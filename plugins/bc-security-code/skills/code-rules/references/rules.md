# bc-security code rules

Each entry: what to look for, Grep hints, standards mapping, default CVSS 3.1 vector and false-positive notes. Grep hints are regular expressions for the Grep tool; combine them with reading the code, because a match alone is not a finding.

### BCS-CODE-001 Injection: SQL, OS command, code or template

**What to look for.** Untrusted input built into an interpreter's input by string concatenation, interpolation or formatting:
- SQL: a query string built with `+`, template literals, f-strings, `String.Format`, `fmt.Sprintf` or `%` and passed to a driver or ORM raw-query API.
- OS command: input passed to a shell (`shell=True`, `sh -c`, `cmd /c`, `exec` of a single string) or used as a program name or option.
- Code and templates: input passed to `eval`, `Function`, `exec`, `compile`, dynamic `import`, or rendered as a template source (server-side template injection) instead of as template data.

**Grep hints.**
- SQL: `(SELECT|INSERT|UPDATE|DELETE)\b[^;]*("\s*\+|\+\s*"|\$\{|\{[a-z_]+\}|%s|Sprintf)`, `` \.(query|execute|exec|raw|rawQuery)\(\s*(f"|`|".*"\s*\+) ``, `FromSqlRaw|ExecuteSqlRaw|SqlQueryRaw|\$queryRawUnsafe|\$executeRawUnsafe`, `new SqlCommand\(\s*\$?"`
- Command: `child_process|exec\(|execSync|spawn\(.*shell:\s*true`, `subprocess\.(run|call|Popen|check_output)\(.*shell=True|os\.system|os\.popen`, `Process\.Start|ProcessStartInfo`, `exec\.Command\("(sh|bash|cmd)"`, `Runtime\.getRuntime\(\)\.exec`
- Code and templates: `\beval\(|new Function\(|vm\.runIn`, `\bexec\(|\bcompile\(|__import__`, `render_template_string|Template\(.*request|Environment\(.*\)\.from_string`, `Razor\.Parse|Engine\.Razor\.RunCompile`, `template\.New\(.*\)\.Parse\(`

**Standards.** OWASP `A03:2021` (Injection). CWE: `CWE-89` (SQL), `CWE-78` (OS command), `CWE-94` (code injection), `CWE-1336` (server-side template injection, alongside CWE-94). ASVS 4.0.3: `V5.3.4` (parameterized queries), `V5.3.8` (OS command injection), `V5.2.4` (no `eval` or dynamic code execution), `V5.2.5` (template injection).

**Default CVSS 3.1.** `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H` (9.8). Use `PR:L` when the entry point requires authentication.

**False-positive notes.**
- Parameterized queries (`$1`, `?`, `@name`, `:name` with a separate parameters argument) and query builders that bind values are safe.
- Interpolated identifiers (column or table names, `ORDER BY`) are safe only when chosen from a fixed allowlist in code; otherwise report.
- Constant strings and values that never come from outside the process are not injection; values read from the database, files or other services may still be untrusted.
- Argument arrays without a shell (`execFile`, `subprocess.run([...])`, `exec.Command("git", args...)`) are not shell injection, but report if input can become an option (a value starting with `-`).

### BCS-CODE-002 Broken authentication: unverified JWT, weak password storage

**What to look for.**
- JWTs decoded without verifying the signature, with signature verification disabled, accepting the `none` algorithm, without an algorithm allowlist, or with expiry (`exp`) validation turned off.
- Passwords stored in plaintext, reversibly encrypted, or hashed with a fast hash (MD5, SHA-1, SHA-256 without a KDF) or without a per-user salt; password comparison with plain string equality on stored values.

**Grep hints.**
- JWT: `jwt\.decode\(`, `verify_signature"?\s*:\s*False|verify_exp"?\s*:\s*False|verify=False`, `algorithms?\s*[:=]\s*\[?\s*["']none`, `ignoreExpiration:\s*true`, `ValidateLifetime\s*=\s*false|ValidateIssuerSigningKey\s*=\s*false|RequireSignedTokens\s*=\s*false|SignatureValidator`, `ParseUnverified|jwt\.Parse\(.*nil\)`
- Passwords: `(md5|sha1|sha256|SHA256|MD5|SHA1)\b.*(password|passwd|pwd)`, `(password|passwd|pwd)\b.*(md5|sha1|sha256|hashlib|createHash|ComputeHash)`, `password\s*==|password\s*===|\.Equals\(.*[Pp]assword`

**Standards.** OWASP `A02:2021` (Cryptographic Failures) for CWE-347 and CWE-916; `A07:2021` (Identification and Authentication Failures) when the issue is missing expiry (`CWE-613`) or an authentication bypass (`CWE-287`). CWE: `CWE-347` (improper verification of cryptographic signature), `CWE-916` (password hash with insufficient computational effort), `CWE-613` (insufficient session expiration), `CWE-287` (improper authentication). ASVS 4.0.3: `V3.5.3` (stateless tokens use signatures and are protected against tampering), `V2.4.1` (passwords stored with an approved salted one-way KDF).

**Default CVSS 3.1.** `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N` (9.1) for an unverified token; for weak password storage use `CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:N/A:N` (5.9), since exploitation requires a prior data leak.

**False-positive notes.**
- Decoding a token without verification only to read a header (for example `kid`) before a verified decode is fine; check that the verified decode happens and its result is used.
- Tokens verified by a gateway or framework middleware before the code runs: report with `confidence: "low"` if you cannot see that layer.
- bcrypt, scrypt, Argon2 and PBKDF2 with a reasonable work factor are acceptable; MD5 or SHA used for non-password purposes (cache keys, ETags) is not this rule.

### BCS-CODE-003 Broken access control and IDOR

**What to look for.** Handlers or services that load, change or delete a resource by an identifier from the request (path, query, body) without checking that the authenticated caller owns it or is allowed to act on it; endpoints with no authorization check at all; role or permission checks that trust a client-supplied role.

**Grep hints.** `(params|query|body)\.(id|.*Id)\b`, `r\.PathValue\(|mux\.Vars\(|c\.Param\(`, `request\.(args|view_args|json)\[.?(id|.*_id)`, `\[FromRoute\]|\[HttpGet\("\{id`, `(findById|FindAsync|get_object_or_404|findUnique|SELECT .* WHERE id\s*=)`, `\[AllowAnonymous\]|permitAll\(\)|@csrf_exempt`; then check whether the query or a following check involves the caller (`owner_id`, `user_id`, `userId`, `CreatedBy`, `User.Identity`, `current_user`, `ctx.user`).

**Standards.** OWASP `A01:2021` (Broken Access Control). CWE: `CWE-639` (authorization bypass through user-controlled key), `CWE-862` (missing authorization). ASVS 4.0.3: `V4.2.1` (protection against IDOR), `V4.1.3` (least privilege).

**Default CVSS 3.1.** `CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:N` (8.1). Use `I:N` for read-only endpoints.

**False-positive notes.**
- The ownership check may be in the query (`WHERE id = $1 AND owner_id = $2`), in a policy or guard, or in a row-level security policy. Look for it before reporting; if it may live outside the files in scope, report with `confidence: "low"`.
- Public resources (published posts, product catalog) do not need ownership checks.
- Unguessable identifiers (random UUIDs) reduce likelihood but are not an access control; keep the finding and set `AC:H`, which lowers the score.

### BCS-CODE-004 Multitenant data access without a tenant filter or RLS

**What to look for.** In a multitenant codebase (a tenant context, `tenant_id`/`TenantId`/`org_id`/`account_id` columns, a tenant resolver or middleware), a query, ORM call, cache key or file path that reads or writes tenant-owned data without scoping it to the current tenant, while there is no database row-level security (RLS) or global query filter that enforces it. Typical signs: some methods filter by tenant and a sibling method does not; tenant ID taken from the request body or header instead of the authenticated context; raw SQL that bypasses an ORM global filter; `IgnoreQueryFilters()`.

**Grep hints.** `tenant_?id|TenantId|tenantId|org_?id|OrganizationId|account_?id`, `ITenantContext|TenantProvider|current_tenant|tenantContext`, `HasQueryFilter|IgnoreQueryFilters`, `CREATE POLICY|ENABLE ROW LEVEL SECURITY|set_config\('app\.tenant|SET app\.current_tenant`, `FROM \w+ WHERE` in repositories of a codebase that matches the first hint; compare the queries of the same repository with each other.

**Standards.** OWASP `A01:2021` (Broken Access Control). CWE: `CWE-639` (authorization bypass through user-controlled key); `CWE-862` when the tenant check is missing entirely. ASVS 4.0.3: `V4.2.1` (protection against IDOR), `V4.1.3` (least privilege).

**Default CVSS 3.1.** `CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:N` (8.1). Use `I:N` for read-only access. Consider `S:C` when one tenant's data or actions affect other tenants' security boundaries.

**False-positive notes.**
- An ORM global query filter (for example EF Core `HasQueryFilter` on the entity) or PostgreSQL RLS keyed on a per-request setting enforces the filter even if the query does not repeat it. Check for them; if they may exist outside the files in scope, report with `confidence: "low"`.
- Tables that are global by design (countries, plans, feature flags) do not need a tenant filter.
- Admin or back-office code that intentionally spans tenants should be behind a separate, explicit authorization check; report if it is not.

### BCS-CODE-005 Server-side request forgery (SSRF)

**What to look for.** The server makes an HTTP, socket or file request to a URL, host or path that comes fully or partly from untrusted input (link previews, webhooks, image fetchers, import-from-URL, PDF renderers, proxy endpoints) without an allowlist of destinations, or with a check that can be bypassed (prefix match, blocklist of `localhost` only, resolution not pinned, redirects followed).

**Grep hints.** `fetch\(|axios\.(get|post|request)\(|got\(|http\.request\(`, `requests\.(get|post|request)\(|urllib\.request\.urlopen|httpx\.`, `HttpClient\.(GetAsync|SendAsync|GetStringAsync)|WebClient|WebRequest\.Create`, `http\.(Get|Post|NewRequest)\(|http\.DefaultClient`, `new URL\(.*(req|query|body)|url\s*=\s*.*(request|req\.|params|query)`, `169\.254\.169\.254|metadata\.google\.internal`

**Standards.** OWASP `A10:2021` (Server-Side Request Forgery). CWE: `CWE-918`. ASVS 4.0.3: `V12.6.1` (server only sends requests to allowlisted destinations), `V5.2.6` (SSRF protection by validating untrusted URLs).

**Default CVSS 3.1.** `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:N/A:N` (8.6): requests can reach internal services and cloud metadata outside the application's scope. Use `C:L` when the response is not returned to the caller (blind SSRF).

**False-positive notes.**
- Requests to a fixed base URL where input only fills a path segment or query value after encoding are usually not SSRF; check for path traversal or `@`/`//` tricks if the input is not encoded.
- A strict allowlist of schemes and hosts, enforced after DNS resolution and on every redirect, is an effective control.
- Outbound egress restrictions in the network may mitigate impact; you usually cannot see them, so keep the finding and mention it.

### BCS-CODE-006 Insecure deserialization of untrusted data

**What to look for.** Untrusted bytes or strings (cookies, request bodies, message queues, uploaded files, cache entries shared with other tenants) passed to a deserializer that can instantiate arbitrary types or run code: native object serializers, YAML loaders with object tags, JSON or XML serializers with polymorphic type handling enabled.

**Grep hints.** `pickle\.loads?|cPickle|dill\.loads|shelve\.open|jsonpickle\.decode|marshal\.loads`, `yaml\.load\(|yaml\.unsafe_load|Loader=yaml\.(Loader|UnsafeLoader|FullLoader)`, `BinaryFormatter|SoapFormatter|NetDataContractSerializer|LosFormatter|ObjectStateFormatter|JavaScriptSerializer\(.*TypeResolver`, `TypeNameHandling\.(All|Auto|Objects|Arrays)`, `ObjectInputStream|readObject\(|XMLDecoder`, `node-serialize|unserialize\(|serialize-javascript.*eval`, `gob\.NewDecoder` (Go: report only when decoding into interface types registered from untrusted input).

**Standards.** OWASP `A08:2021` (Software and Data Integrity Failures). CWE: `CWE-502`. ASVS 4.0.3: `V5.5.1` (serialized objects use integrity checks or encryption), `V5.5.3` (deserialization of untrusted data is avoided or protected).

**Default CVSS 3.1.** `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H` (9.8).

**False-positive notes.**
- `yaml.safe_load` and `yaml.load` with `Loader=yaml.SafeLoader` or `CSafeLoader` are safe. `FullLoader` is safe in PyYAML 5.4 and later; report it with `confidence: "low"` only when the PyYAML version may be older.
- Plain JSON parsing into data types (`JSON.parse`, `json.loads`, `System.Text.Json` without polymorphic type names, `encoding/json`) is not this rule.
- Data signed with a server-side key (HMAC) and verified before deserialization lowers the risk; report with `confidence: "low"` if the key handling looks sound, and check that the key is not hardcoded (BCS-CODE-008).
- Deserializing files the application itself wrote to a location users cannot write is usually fine.

### BCS-CODE-007 Cross-site scripting (XSS)

**What to look for.** Untrusted input written into HTML, JavaScript, CSS or URL contexts without context-aware encoding: server responses built by string concatenation or template literals, templates with auto-escaping disabled or raw/safe filters, client code writing to `innerHTML` and similar sinks, `javascript:` URLs in `href`.

**Grep hints.** `` res\.send\(\s*`.*\$\{ ``, `res\.(send|write|end)\(.*<`, `innerHTML\s*=|outerHTML\s*=|insertAdjacentHTML|document\.write\(`, `dangerouslySetInnerHTML|v-html|\[innerHTML\]|bypassSecurityTrust`, `\|\s*safe\b|Markup\(|autoescape\s+false|mark_safe\(`, `Html\.Raw\(|@Html\.Raw|new HtmlString\(`, `template\.HTML\(|text/template` (Go `text/template` for HTML output), `href=\{.*(url|link)`

**Standards.** OWASP `A03:2021` (Injection). CWE: `CWE-79`. ASVS 4.0.3: `V5.3.3` (context-aware output escaping), `V5.3.1` (output encoding relevant for the interpreter and context).

**Default CVSS 3.1.** `CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N` (6.1) for reflected XSS. For stored XSS that runs for other users without a crafted link, consider `PR:L` and higher `C`/`I`.

**False-positive notes.**
- Framework templates with auto-escaping on (React JSX text, Razor `@value`, Jinja2 with autoescape, Go `html/template`, Angular interpolation) are safe for HTML text content; check attribute, URL and script contexts separately.
- Values sanitized with a maintained HTML sanitizer (DOMPurify, bleach, HtmlSanitizer) before a raw sink are usually fine.
- Responses served with `Content-Type: application/json` or `text/plain` are not rendered as HTML by browsers; a strict CSP reduces impact but does not remove the finding.

### BCS-CODE-008 Weak cryptography, hardcoded keys or IVs

**What to look for.**
- Broken or weak algorithms and modes for security purposes: DES, 3DES, RC4, Blowfish, ECB mode, MD5 or SHA-1 for signatures, integrity or tokens, RSA keys under 2048 bits, RSA without OAEP/PSS.
- Keys, IVs, nonces or salts that are hardcoded, all zeros, derived from a constant, or reused; CBC/CTR/GCM with a static IV or nonce.
- Non-cryptographic random generators used for tokens, keys, IVs or password reset codes.

**Grep hints.** `(DES|TripleDES|RC4|RC2|Blowfish)\b|des-ede|createCipher\(`, `ECB|CipherMode\.ECB|AES/ECB|MODE_ECB|NewECB`, `\b(md5|MD5|sha1|SHA1)\b`, `(key|iv|nonce|secret|salt)\s*[:=]\s*(b?["']|Encoding\.\w+\.GetBytes\(")|new byte\[\d+\]`, `\.IV\s*=|iv\s*=\s*b?["']|createCipheriv\(.*["']`, `Math\.random\(|random\.random\(|new Random\(|math/rand`, `RSA.*(512|1024)|KeySize\s*=\s*(512|1024)|PKCS1v15|RSA_PKCS1_PADDING`

**Standards.** OWASP `A02:2021` (Cryptographic Failures). CWE: `CWE-327` (broken or risky algorithm), `CWE-321` (hardcoded cryptographic key); also `CWE-329` (predictable IV with CBC), `CWE-330` (insufficiently random values). ASVS 4.0.3: `V6.2.2` (industry-proven algorithms), `V6.2.5` (no insecure modes, padding or weak ciphers), `V6.2.6` (nonces and IVs are not reused), `V6.4.1` (keys held in a secrets management solution), `V6.3.1` (random values from a cryptographically secure generator).

**Default CVSS 3.1.** `CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:N` (7.4). Use `I:N` when only confidentiality is affected.

**False-positive notes.**
- MD5 and SHA-1 used for non-security purposes (checksums against accidental corruption, cache keys, ETags, deduplication) are not findings; report with `confidence: "low"` when the purpose is unclear.
- Test vectors and test fixtures with fixed keys are fine when they are not used by production code.
- A hardcoded credential that is not a cryptographic key (API token, password) belongs to the secrets domain, not this rule.
- Keys loaded from configuration, environment variables or a key vault are fine here; whether that configuration is committed is a secrets-domain question.
- Private key material (PEM or OpenSSH blocks, `.pem`, `.key`, `.pfx`, `.p12`, `.jks` files) and signing secrets stored as credentials belong to BCS-SEC-001 when the secrets rules are loaded; otherwise report them here. This rule owns symmetric keys, IVs and nonces passed into a crypto call. Report a hardcoded value once, under one rule.
