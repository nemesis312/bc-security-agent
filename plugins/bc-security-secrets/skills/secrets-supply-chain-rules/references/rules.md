# bc-security secrets and supply-chain rules

Each entry: what to look for, Grep hints, standards mapping, default CVSS 3.1 vector and false-positive notes. Grep hints are regular expressions for the Grep tool (ripgrep syntax); combine them with reading the files, because a match alone is not a finding. These rules report hygiene problems only: never state that a dependency version has a CVE.

### BCS-SEC-001 Hardcoded credentials and private keys

**What to look for.** Credentials and private key material written into tracked files: cloud access keys and secret keys, API tokens, database passwords or connection strings with a password, OAuth client secrets, signing secrets stored as credentials, passwords in config or source, and private key material (PEM or OpenSSH blocks, `.pem`, `.key`, `.pfx`, `.p12`, `.jks` files). The value is usable by anyone with read access to the repository or its history.

**Grep hints.**
- Cloud and token shapes: `\b(AKIA|ASIA)[0-9A-Z]{16}\b`, `aws_secret_access_key|secretAccessKey|SecretAccessKey`, `AIza[0-9A-Za-z_-]{35}`, `-----BEGIN [A-Z ]*PRIVATE KEY-----`
- Assignments: `(password|passwd|pwd|secret|api[_-]?key|access[_-]?key|auth[_-]?token|client[_-]?secret)["']?\s*[:=]\s*["'][^"'$\{<][^"']{7,}["']`
- Connection strings: `[a-z]+://[^/\s:@]+:[^/\s:@$\{]{3,}@`, `(Password|Pwd)=[^;{$]{3,};`
- Key files: Glob `**/*.pem`, `**/*.key`, `**/*.pfx`, `**/*.p12`, `**/*.jks`, `**/id_rsa`, `**/id_ed25519`

**Standards.** OWASP `A07:2021` (Identification and Authentication Failures) for CWE-798; `A02:2021` (Cryptographic Failures) for CWE-321 and private keys. CWE: `CWE-798` (hardcoded credentials), `CWE-321` (hardcoded cryptographic key), `CWE-259` (hardcoded password). ASVS 4.0.3: `V2.10.4` (no passwords or keys in source code), `V6.4.1` (keys and secrets in a secrets management solution).

**Default CVSS 3.1.** `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N` (9.1) for a live cloud key or private key. Lower the metrics when the credential only reaches a low-impact or internal resource.

**False-positive notes.**
- Values read from environment variables, a secrets manager or configuration injected at deploy time are fine.
- Placeholders (`changeme`, `<your-key>`, `${API_KEY}`, `xxxx`), test values in test projects and keys documented as examples by the vendor are not live credentials; report with `confidence: "low"` when you cannot tell. A comment that says a value is fake is not proof.
- Public keys, certificates and `.pub` files are not secrets; a private key in a test fixture directory is still worth a low-confidence note.
- Never print the full value in the finding.
- Boundary with BCS-CODE-008: this rule owns credentials and private key material (API keys, passwords, tokens, private keys, signing secrets). A symmetric key, IV or nonce passed into a crypto call (AES key, static IV) belongs to BCS-CODE-008. Report a hardcoded value once, under one of the two rules.

### BCS-SEC-002 `.env` file committed without being ignored

**What to look for.** An environment file with real configuration values (`.env`, `.env.production`, `.env.local`, `*.env`) that is part of the repository and is not covered by any ignore rule. Check the `.gitignore` files at the repository root and in parent directories of the file; also check that the file is not listed as tracked or intentionally shipped. A `.env.example` or `.env.template` with placeholder values is the correct pattern.

**Grep hints.**
- Glob for dotfiles: `**/.env`, `**/.env.*`, `**/*.env`
- Ignore coverage: Grep `^\s*!?\.?env|\.env` in `**/.gitignore`; Glob `**/.gitignore` and confirm one exists and covers the file
- Content shape: `^[A-Z][A-Z0-9_]*=.+` inside the env file, then read the values (secrets, tokens, passwords, connection strings)

**Standards.** OWASP `A05:2021` (Security Misconfiguration). CWE: `CWE-538` (insertion of sensitive information into externally accessible file or directory), also `CWE-312` (cleartext storage of sensitive information). ASVS 4.0.3: `V14.1.3` (server configuration hardened), `V6.4.1`.

**Default CVSS 3.1.** `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N` (7.5). Lower it when the values are clearly non-secret (ports, feature flags) or the repository is private and the file holds only local development values.

**False-positive notes.**
- `.env.example`, `.env.sample`, `.env.template` and similar files with placeholder or empty values are fine.
- A `.gitignore` entry that covers the file (`.env`, `.env*`, `*.env`, a parent-directory rule) means the file is not committed; a negation (`!.env`) re-includes it.
- A file ignored only by a developer's global gitignore is not protected for other clones; report with `confidence: "low"` if you only see that the repository has no ignore file but cannot tell whether the file is tracked.
- Variables with no secret in them (public URLs, ports, log levels) lower severity, not the need to ignore the file.

### BCS-SEC-003 Missing or inconsistent lockfile

**What to look for.**
- A dependency manifest with third-party dependencies and no committed lockfile: `package.json` without `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml` or `bun.lock`; `pyproject.toml` or `requirements.in` without `poetry.lock`, `uv.lock`, `Pipfile.lock` or hashed requirements; `Cargo.toml` of an application without `Cargo.lock`; `Gemfile` without `Gemfile.lock`; a .NET project with no `packages.lock.json` where lock files are enabled; Go modules without `go.sum`.
- A lockfile that disagrees with its manifest: a dependency in the manifest that is missing from the lockfile or resolved to a version outside the declared range, two different lockfiles from different package managers for the same project, or a lockfile ignored by `.gitignore`.

**Grep hints.**
- Inventory: Glob `**/package.json`, `**/pyproject.toml`, `**/requirements*.txt`, `**/Cargo.toml`, `**/Gemfile`, `**/go.mod`, `**/*.csproj`, then Glob for the matching lockfiles next to each manifest
- Ignored lockfile: `package-lock|yarn\.lock|pnpm-lock|Cargo\.lock|poetry\.lock|go\.sum` in `**/.gitignore`
- Mismatch: Grep the dependency names from the manifest in the lockfile (`"node_modules/<name>"`, `^name = "<name>"`); compare declared range and locked version

**Standards.** OWASP `A06:2021` (Vulnerable and Outdated Components). CWE: `CWE-1357` (reliance on insufficiently trustworthy component). ASVS 4.0.3: `V14.2.1` (components are tracked and up to date), `V14.2.4` (components come from trusted, pinned sources).

**Default CVSS 3.1.** `CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:L/A:N` (4.8). This is a hygiene finding: builds are not reproducible and a new malicious or broken release can enter silently.

**False-positive notes.**
- Libraries intended for publication commonly do not commit a lockfile (npm libraries, Cargo libraries); report with `confidence: "low"` or skip when the manifest declares a library and not a deployed application.
- A manifest with no dependencies does not need a lockfile.
- A monorepo may keep one lockfile at the root for several manifests; look upward before reporting.
- Lockfiles produced in CI before the build (and never committed) are a legitimate pattern for some teams; report with `confidence: "low"` if CI files reference a lock-generating step.

### BCS-SEC-004 Unpinned or range versions in production manifests

**What to look for.** Production dependencies (not dev or test-only) declared with no version, a wildcard, `latest`, a tag, an open-ended range (`>=`, `>`), or a broad range, so a fresh install can resolve to a different release than the one reviewed. Also container or CI references to moving tags (`latest`) when they are part of a dependency manifest in scope. Caret and tilde ranges are common and low risk when a lockfile is committed; report them only with `confidence: "low"` unless there is no lockfile.

**Grep hints.**
- npm: `"(dependencies|optionalDependencies)"` then `":\s*"(\*|latest|next|x|>=?[^"]*|)"`
- Python: `^[A-Za-z0-9_.-]+\s*$` and `[A-Za-z0-9_.-]+\s*(>=|>|~=)\s*[0-9]` in `requirements*.txt`; `\{version\s*=\s*"\*"` in Cargo and Poetry files
- .NET: `<PackageReference[^>]*Version="(\*|[^"]*\*[^"]*|\[[^"]*,\s*\))"`, `Version="[^"]*,\)`
- Generic: `:\s*"\*"`, `==\s*\*`, `latest`, `"\^0\.0`

**Standards.** OWASP `A06:2021` (Vulnerable and Outdated Components). CWE: `CWE-1357` (reliance on insufficiently trustworthy component), `CWE-829` as a secondary mapping only when the range admits releases from outside the project's control. ASVS 4.0.3: `V14.2.1`, `V14.2.4`.

**Default CVSS 3.1.** `CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:L/A:N` (4.8).

**False-positive notes.**
- Dev-only dependencies (`devDependencies`, test groups) are lower risk; report only with `confidence: "low"`.
- A committed, consistent lockfile makes caret and tilde ranges acceptable; a wildcard or `latest` is still worth reporting because the next lock refresh takes anything.
- Libraries that must stay compatible with a range of host versions legitimately use ranges for peer dependencies.
- Exact versions (`2.1.3`, `==2.1.3`, `[2.1.3]`) are pinned; do not report them.
- git and URL references (including branch refs like `#main`) belong to BCS-SEC-006, not this rule.

### BCS-SEC-005 Typosquatting: package names close to popular packages

**What to look for.** A dependency whose name is one edit away from a very popular package in the same ecosystem (a swapped, dropped, doubled or substituted character, a swapped separator such as `-` and `_`, a plausible prefix or suffix such as `-js` or `-utils` on a well-known name), or a scoped name that imitates a well-known scope. Judge by the name alone; you cannot confirm what the package contains.

**Grep hints.** There is no reliable regex; read the dependency names in every manifest and compare them with well-known packages. Useful starting points: Grep the dependency lists (`"dependencies"` blocks, `requirements*.txt`, `<PackageReference Include="`, `^require\s`) and look at names with unusual spellings. Candidates seen often: `lodash` (`lodahs`, `lodsah`), `express` (`expresss`, `expres`), `requests` (`reqeusts`, `request-s`), `colorama` (`colourama`), `react` (`raect`), `axios` (`axois`). If the repository has an internal dependency list or allowlist, compare against it.

**Standards.** OWASP `A06:2021` (Vulnerable and Outdated Components) or `A08:2021` (Software and Data Integrity Failures). CWE: `CWE-1357` (reliance on insufficiently trustworthy component). ASVS 4.0.3: `V14.2.4`.

**Default CVSS 3.1.** `CVSS:3.1/AV:N/AC:H/PR:N/UI:R/S:U/C:L/I:L/A:L` (5.0). Report as a name that must be verified; do not say the package is malicious.

**False-positive notes.**
- Some legitimate packages have names close to popular ones (`request` and `requests`, `colors` and `colour`, `uuid` and `uuid4`); use `confidence: "low"` when the name is a real, distinct project you recognize, and say so in the evidence.
- Internal packages published under the organization's own scope are not typosquats.
- Never claim you checked the registry: say the name resembles the popular package and recommend verifying the package on the registry before installing.

### BCS-SEC-006 Non-standard registries and git or URL dependency sources

**What to look for.** Dependencies resolved from somewhere other than the ecosystem's default registry or a documented private registry: git URLs (especially a branch or a tag instead of a full commit hash), raw tarball or file URLs, `http://` (non-TLS) registries, registry overrides in `.npmrc`, `.yarnrc`, `pip.conf`, `pip install --index-url` or `--extra-index-url` (dependency confusion risk), `[source]` or `replace` sections in Cargo, `go.mod` `replace` directives pointing outside the repository, `NuGet.config` sources, and `file:` or `link:` dependencies in a published application.

**Grep hints.**
- Git and URL: `"[^"]+"\s*:\s*"(git\+|git://|github:|https?://|file:|link:)`, `git\+(https|ssh)://`, `@\s*https?://` in requirements files
- Registry overrides: `registry\s*=|@[a-z0-9-]+:registry`, `--(extra-)?index-url|index-url\s*=|extra-index-url`, `<add key=.*value="http`, `\[source\.|\[patch\.|^replace\s`
- Plain HTTP: `http://` inside manifests, `.npmrc`, `pip.conf`, `NuGet.config`
- Branch refs: `#(main|master|develop|HEAD)\b`

**Standards.** OWASP `A08:2021` (Software and Data Integrity Failures); `A06:2021` is acceptable for dependency confusion. CWE: `CWE-829` (inclusion of functionality from untrusted control sphere), `CWE-494` when integrity is not verified. ASVS 4.0.3: `V14.2.4`, `V10.3.2`.

**Default CVSS 3.1.** `CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:H/A:N` (6.5). Use a lower score for a git URL pinned to a full commit hash on an organization-owned host.

**False-positive notes.**
- A git dependency pinned to a full commit hash on a host the organization controls is a reasonable choice for internal code; report with `confidence: "low"` or note it as an observation.
- A documented private registry over HTTPS, configured with scoped packages only, is fine; a registry that replaces the default for all packages without scoping can enable dependency confusion.
- `file:` and workspace references inside a monorepo are fine.
- Do not claim the source is compromised. The finding is that the source is not the standard registry and, when a branch is used, that its content can change.

### BCS-SEC-007 Install scripts that download and execute code

**What to look for.** Lifecycle or setup hooks that fetch remote content and run it, so installing the project executes code that is not in the repository and is not integrity-checked: `postinstall`, `preinstall`, `prepare` in `package.json`; `cmdclass`, `setup.py` code or build hooks that call the network; `.csproj` targets that download and run files; Makefile or shell setup scripts reached from install hooks that pipe `curl` or `wget` output to `sh`, `bash`, `python`, `node` or `iex`; downloads of binaries followed by `chmod +x` and execution without a checksum or signature check.

**Grep hints.**
- Pipe to interpreter: `(curl|wget|iwr|Invoke-WebRequest|Invoke-RestMethod)[^|\n]*\|\s*(sudo\s+)?(sh|bash|zsh|python3?|node|iex|Invoke-Expression)\b`
- Download then run: `(curl|wget)[^\n]*(-o|-O|>)\s*\S+[^\n]*(&&|;)\s*(chmod \+x|sh |bash |\./)`
- Install hooks: `"(preinstall|install|postinstall|prepare)"\s*:`, `cmdclass|setuptools\.command|urllib|requests\.get` in `setup.py`, `<Exec Command=.*(curl|wget|Invoke-WebRequest)` in `*.csproj`, `\bcurl\b|\bwget\b` in `Makefile`, `*.sh`, `Dockerfile`

**Standards.** OWASP `A08:2021` (Software and Data Integrity Failures). CWE: `CWE-494` (download of code without integrity check), also `CWE-829` and `CWE-78` when untrusted content reaches a shell. ASVS 4.0.3: `V10.3.2` (integrity protections such as signed code), `V14.2.4`.

**Default CVSS 3.1.** `CVSS:3.1/AV:N/AC:H/PR:N/UI:R/S:U/C:H/I:H/A:H` (7.5). The score reflects that the remote host decides what runs on every machine that installs the project.

**False-positive notes.**
- A download that is verified (a pinned checksum or signature compared before execution) is not this rule.
- Scripts that only download data files, or hooks in documentation and README examples that are not run by the project's own install, are not findings.
- `prepare` scripts that run a local build (`tsc`, `husky install`) with no network call are fine.
- A one-line installer shown in a README for end users is outside this rule unless a project script runs it automatically.
