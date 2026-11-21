# bc-security infrastructure rules

Each entry: what to look for, Grep hints, standards mapping, default CVSS 3.1 vector and false-positive notes. Grep hints are regular expressions for the Grep tool (ripgrep syntax); combine them with reading the files, because a match alone is not a finding. Default scores were computed with the CVSS 3.1 base formula.

## Dockerfile

### BCS-INFRA-001 Dockerfile runs as root

**What to look for.** An image whose final stage never switches to a non-root user: no `USER` instruction in the last stage, or `USER root` / `USER 0` as the last `USER` of the last stage. The container process then runs as uid 0, so any code execution inside it has root privileges in the container and eases a breakout.

**Grep hints.**
- Inventory: Glob `**/Dockerfile*`, `**/*.dockerfile`
- Last user: `^\s*USER\s+` (read the last match in the final `FROM` stage), `^\s*USER\s+(root|0)(:|\s|$)`
- Final stage: `^\s*FROM\s` (count stages; only the last stage ships)

**Standards.** OWASP `A05:2021` (Security Misconfiguration). CWE: `CWE-250` (execution with unnecessary privileges). ASVS 4.0.3: `V14.1.1` (build and deploy processes are secure and repeatable). Docker CIS Benchmark 4.1.

**Default CVSS 3.1.** `CVSS:3.1/AV:L/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H` (7.8). Lower it for images that are never deployed (local tooling), raise confidence in the finding when the image runs a network-facing service.

**False-positive notes.**
- A non-root `USER` in the final stage (name or numeric uid) is fine; earlier build stages may run as root.
- Base images that already run as non-root by default (some distroless `:nonroot` or chiseled .NET images) are fine; report with `confidence: "low"` when the base image's default user is unknown.
- A Compose `user:` setting or a Kubernetes `runAsNonRoot` can enforce the user outside the Dockerfile; mention it and lower confidence when you see one.
- `USER root` followed later by a non-root `USER` in the same stage is fine.

### BCS-INFRA-002 `latest` or unpinned base image

**What to look for.** In a Dockerfile, a `FROM` that uses the `latest` tag, no tag at all, or a floating tag, instead of a specific version and ideally a digest (`image:1.2.3@sha256:...`). The same applies to `ARG`-driven `FROM ${IMAGE}` whose default is unpinned. The same rule covers Compose: a service `image:` with `latest`, no tag or a floating tag is reported here too, one finding per file. Builds are not reproducible and a changed upstream image enters silently.

**Grep hints.**
- All bases: `^\s*FROM\s+(--platform=\S+\s+)?\S+`; Compose images: `^\s*image:\s*\S+` in `**/docker-compose*.y*ml`
- Latest or no tag: `^\s*FROM\s+(--platform=\S+\s+)?[^\s:@]+(:latest)?(\s|$)`, `:latest\b`
- Digest present: `@sha256:[0-9a-f]{64}`
- Internal stage references: `^\s*FROM\s+\S+\s+AS\s+`

**Standards.** OWASP `A06:2021` (Vulnerable and Outdated Components). CWE: `CWE-1357` (reliance on insufficiently trustworthy component), also `CWE-829`. ASVS 4.0.3: `V14.2.4`. Docker CIS Benchmark 4.2. This is a hygiene finding: never claim the image has a CVE.

**Default CVSS 3.1.** `CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:L/A:N` (4.8).

**False-positive notes.**
- `FROM scratch` and `FROM <earlier-stage-alias>` are not external images.
- A pinned version tag without a digest is weaker but acceptable; report it with `confidence: "low"` and lower severity.
- A variable base image whose value is injected by CI with a pin is fine; report with `confidence: "low"` if you cannot see the value.
- Dev-only Dockerfiles (names such as `Dockerfile.dev`) lower severity, not the need to pin.

### BCS-INFRA-003 Secrets in Dockerfile `ENV`, `ARG` or `COPY .env`

**What to look for.** Credentials baked into the image: `ENV` or `ARG` instructions that set passwords, tokens, API keys or secret keys to literal values; `COPY .env` / `ADD .env` or copying whole directories that include `.env`, key files or cloud credential files into the image; `ARG` values for secrets (they stay in image history). Anyone who can pull the image or read its layers can read the value.

**Grep hints.**
- Names: `^\s*(ENV|ARG)\s+\S*(PASSWORD|PASSWD|SECRET|TOKEN|API[_-]?KEY|ACCESS[_-]?KEY|PRIVATE[_-]?KEY|CREDENTIAL)\S*\s*=?\s*\S+`
- Copied secret files: `^\s*(COPY|ADD)\s+.*(\.env|\.pem|\.key|id_rsa|credentials|\.npmrc|\.pypirc)`
- Whole-context copies: `^\s*(COPY|ADD)\s+\.\s+` and then check `.dockerignore` for `.env`
- Token shapes: `\b(AKIA|ASIA)[0-9A-Z]{16}\b`, `-----BEGIN [A-Z ]*PRIVATE KEY-----`

**Standards.** OWASP `A05:2021` (Security Misconfiguration); `A07:2021` when the value is a credential. CWE: `CWE-538` (sensitive information in externally accessible file or directory), also `CWE-798` and `CWE-312`. ASVS 4.0.3: `V6.4.1`, `V14.1.3`.

**Default CVSS 3.1.** `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N` (7.5). Lower it when the value only reaches a low-impact local resource.

**False-positive notes.**
- `ENV NODE_ENV=production`, ports, log levels, feature flags and `ARG` build metadata (`VERSION`, `BUILD_DATE`) are not secrets.
- `ENV DB_PASSWORD=${DB_PASSWORD}` or an empty `ARG TOKEN` with no default and no baked value only declares the name; the value is injected at runtime. Build-time `ARG` secrets still persist in history, so report with `confidence: "low"` unless a real value is present. BuildKit `RUN --mount=type=secret` is the correct pattern.
- `COPY .env.example` with placeholders is fine; a `.dockerignore` entry that excludes `.env` makes `COPY . .` safe.
- Placeholders (`changeme`, `<your-key>`) and vendor documented examples: `confidence: "low"`.
- **Boundary with bc-security-secrets:** a secret inside a Dockerfile is owned by this rule. Report it once here, not also as BCS-SEC-001/002. The standalone `.env` file itself (no ignore entry) stays BCS-SEC-002; a `COPY .env` instruction is this rule.
- Never print the full value.

### BCS-INFRA-004 `curl | sh` in a Dockerfile

**What to look for.** `RUN` instructions that download a script or binary and execute it without integrity verification: `curl ... | sh`, `wget -O- ... | bash`, `bash <(curl ...)`, `sh -c "$(curl ...)"`, or downloading an archive and extracting it without a pinned checksum or signature. The build executes whatever the remote host serves at that moment.

**Grep hints.**
- Pipe to shell: `(curl|wget)\b[^\n|]*\|\s*(sudo\s+)?(ba|z|da)?sh\b`
- Process substitution: `(ba|z)?sh\s+<\(\s*(curl|wget)`, `(ba|z)?sh\s+-c\s+["'$(]+\s*(curl|wget)`
- Unverified downloads: `(curl|wget)\b[^\n]*(\.tar|\.tgz|\.zip|\.sh)` then check for `sha256sum|gpg|cosign|--checksum` nearby

**Standards.** OWASP `A08:2021` (Software and Data Integrity Failures). CWE: `CWE-494` (download of code without integrity check), also `CWE-829`. ASVS 4.0.3: `V10.3.2`, `V14.2.4`.

**Default CVSS 3.1.** `CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:H` (8.1). Lower it for build stages that do not ship.

**False-positive notes.**
- A download followed by a checksum or signature verification (`sha256sum -c`, `gpg --verify`, `cosign verify`) before execution is fine.
- `curl` that only fetches data (a health check, `curl -f http://localhost/health`) is not code execution.
- Package-manager installs from configured, signed repositories are fine.
- Installers from a vendor's official HTTPS URL are still a finding, but state in the evidence that the risk is trust in that host; keep `confidence: "medium"` rather than lowering to ignore.

### BCS-INFRA-005 No `HEALTHCHECK` (informational)

**What to look for.** A Dockerfile for a long-running service (it has `EXPOSE`, a server `CMD`/`ENTRYPOINT`) in which the final stage has no `HEALTHCHECK` instruction, and the repository's Compose files or orchestrator manifests define no health check for that service either. Without a health check the platform cannot tell a hung process from a healthy one. This is an operational hygiene note, **always reported with severity `info`**.

**Grep hints.**
- Present: `^\s*HEALTHCHECK\s`, `HEALTHCHECK\s+NONE`
- Service signals: `^\s*EXPOSE\s`, `^\s*(CMD|ENTRYPOINT)\s`
- Compose or orchestrator coverage: `healthcheck:` in `**/docker-compose*.y*ml`, `livenessProbe|readinessProbe` in `**/*.y*ml`

**Standards.** OWASP `A05:2021` (Security Misconfiguration). CWE: `CWE-693` (protection mechanism failure) as the nearest generic mapping. ASVS 4.0.3: `V14.1.1`. Docker CIS Benchmark 4.6.

**Default CVSS 3.1.** `CVSS:3.1/AV:L/AC:H/PR:H/UI:N/S:U/C:N/I:N/A:N` (0.0, None). There is no confidentiality, integrity or availability impact to score; the finding is informational and must not be raised to low or above.

**False-positive notes.**
- Batch jobs, one-shot tools, init containers and build-only images need no health check.
- A `healthcheck:` in Compose, or Kubernetes probes in the repository, satisfy the need; the Dockerfile does not have to carry it.
- If the orchestrator is outside the repository, report with `confidence: "low"`.
- Report once per Dockerfile, never as a medium or high finding.

## Docker Compose

### BCS-INFRA-006 Compose `privileged`, host network or Docker socket mount

**What to look for.** Services that break container isolation: `privileged: true`; `network_mode: host`; `pid: host`, `ipc: host`; mounting `/var/run/docker.sock` (or `/run/docker.sock`) into a container; added capabilities such as `SYS_ADMIN` or `cap_add: ALL`; bind mounts of `/`, `/etc` or `/proc`. Compromise of the container then gives control of the host or of every container on it.

**Grep hints.**
- `^\s*privileged:\s*(true|yes|1)\b`
- `^\s*network_mode:\s*["']?host`, `^\s*(pid|ipc|userns_mode):\s*["']?host`
- Socket: `docker\.sock`
- Capabilities: `cap_add:` then `SYS_ADMIN|ALL|NET_ADMIN|SYS_PTRACE`
- Host mounts: `^\s*-\s*["']?(/|/etc|/proc|/sys|/root)[:"' ]`

**Standards.** OWASP `A05:2021` (Security Misconfiguration). CWE: `CWE-250` (execution with unnecessary privileges), also `CWE-269`. ASVS 4.0.3: `V14.1.1`. Docker CIS Benchmark 5.4, 5.9, 5.31.

**Default CVSS 3.1.** `CVSS:3.1/AV:L/AC:L/PR:L/UI:N/S:C/C:H/I:H/A:H` (8.8). Scope is changed because the impact crosses the container boundary.

**False-positive notes.**
- Tools that legitimately need the socket or host access (a reverse proxy with dynamic discovery, CI runners, monitoring agents) are still a finding, but note the justification and lower severity or confidence; a read-only socket mount (`:ro`) does not stop API abuse, so do not treat it as safe.
- Local development override files (`docker-compose.override.yml`, `*.dev.yml`) lower severity.
- `network_mode: host` on a single-purpose developer machine is lower risk; still report.

### BCS-INFRA-007 Database ports bound to 0.0.0.0

**What to look for.** Compose `ports:` that publish a database or datastore port on all interfaces: a bare `"5432:5432"`, `"0.0.0.0:5432:5432"`, or a port list with no host IP. Applies to PostgreSQL 5432, MySQL/MariaDB 3306, MongoDB 27017, Redis 6379, SQL Server 1433, Elasticsearch 9200, Memcached 11211 and similar. Published ports are reachable from every network the host is on and bypass the host firewall on Linux.

**Grep hints.**
- Port lines: `^\s*-\s*["']?(0\.0\.0\.0:)?\d{2,5}:(5432|3306|27017|6379|1433|9200|11211|5984|9042)["']?\s*$`
- Any published port: `^\s*ports:` followed by `^\s*-\s*["']?\d+:\d+`
- Safe form: `127\.0\.0\.1:\d+:\d+`, `localhost:\d+:\d+`
- Datastore images: `image:\s*["']?(postgres|mysql|mariadb|mongo|redis|mssql|elasticsearch|memcached)`

**Standards.** OWASP `A05:2021` (Security Misconfiguration); `A01:2021` (Broken Access Control) for the data exposure. CWE: `CWE-668` (exposure of resource to wrong sphere), also `CWE-200`. ASVS 4.0.3: `V14.1.3`, `V1.14.1`.

**Default CVSS 3.1.** `CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:N` (7.4). The database still needs credentials, hence high attack complexity; lower it further if the port is published only in a local development file.

**False-positive notes.**
- Ports bound to `127.0.0.1` or `::1` are fine.
- `expose:` (container-network only) and services reachable only through the internal Compose network are fine.
- Non-database ports (web servers on 80/443/8080) are not covered by this rule.
- A dev-only Compose file bound to all interfaces on a laptop lowers severity; a production or shared-host file raises confidence.
- Firewalls or cloud security groups outside the repository may block access: `confidence: "low"` when you rely on that.

### BCS-INFRA-008 Inline secrets in Compose

**What to look for.** Credentials written as literals in Compose files: `environment:` entries (map or list form) with passwords, tokens or API keys, `POSTGRES_PASSWORD`, `MYSQL_ROOT_PASSWORD`, connection strings containing a password, and `build.args` carrying secrets. Anyone with read access to the repository can use them.

**Grep hints.**
- Map form: `^\s*\S*(PASSWORD|PASSWD|SECRET|TOKEN|API[_-]?KEY|ACCESS[_-]?KEY|PRIVATE[_-]?KEY)\S*:\s*["']?[^\s"'$\{][^\s"']{5,}`
- List form: `^\s*-\s*["']?\S*(PASSWORD|SECRET|TOKEN|API[_-]?KEY)\S*=[^\s"'$\{]\S{5,}`
- Connection strings: `[a-z]+://[^/\s:@]+:[^/\s:@$\{]{3,}@`
- Safe forms: `\$\{[A-Z_]+(:?[-?][^}]*)?\}`, `secrets:`, `env_file:`

**Standards.** OWASP `A07:2021` (Identification and Authentication Failures); `A05:2021`. CWE: `CWE-798` (hardcoded credentials), also `CWE-259` and `CWE-538`. ASVS 4.0.3: `V2.10.4`, `V6.4.1`.

**Default CVSS 3.1.** `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N` (9.1). Lower the metrics when the credential only protects a local development database not reachable from other hosts.

**False-positive notes.**
- Variable substitution (`${DB_PASSWORD}`, `${DB_PASSWORD:?error}`), `env_file:` pointing to an ignored file, and Compose `secrets:` are fine.
- Placeholders (`changeme`, `example`, `<password>`) and documented dev defaults: report with `confidence: "low"`; a default like `postgres/postgres` in an `*.override.yml` for local use is low severity but still worth noting.
- Non-secret environment values (`NODE_ENV`, ports, hostnames) are not findings.
- **Boundary with bc-security-secrets:** a secret in a Compose file belongs to this rule. Report it once here, not also as BCS-SEC-001. An `env_file:` that points to a committed `.env` without an ignore entry is BCS-SEC-002 for the `.env` file, not this rule.
- Never print the full value.

## GitHub Actions

### BCS-INFRA-009 Workflow `permissions` missing or `write-all`

**What to look for.** Workflows (and jobs) that do not restrict `GITHUB_TOKEN`: no top-level or job-level `permissions:` block (the token then gets the repository or organization default, which may be read-write), `permissions: write-all`, or broad `write` scopes (`contents: write`, `packages: write`, `id-token: write`, `pull-requests: write`) granted to jobs that do not need them. Least privilege starts with `permissions: contents: read`.

**Grep hints.**
- Inventory: Glob `**/.github/workflows/*.y*ml`
- Present: `^\s*permissions:`
- Broad: `permissions:\s*write-all`, `^\s+\S+:\s*write\b`
- Absent: files from the inventory that have no `permissions:` match (Grep with `-L`)

**Standards.** OWASP `A01:2021` (Broken Access Control); `A05:2021`. CWE: `CWE-732` (incorrect permission assignment for critical resource), also `CWE-269`. ASVS 4.0.3: `V1.4.4`, `V14.1.1`. OpenSSF Scorecard: Token-Permissions.

**Default CVSS 3.1.** `CVSS:3.1/AV:N/AC:H/PR:L/UI:N/S:U/C:H/I:H/A:N` (6.8).

**False-positive notes.**
- If every job declares its own `permissions:`, a missing top-level block is fine.
- If the organization or repository default token permission is read-only (a setting outside the files), the impact is lower: report a missing block with `confidence: "low"`.
- A job that really publishes (a release job with `contents: write`) is fine when the scope matches the job's purpose and is set at job level.
- Reusable workflows (`workflow_call`) inherit the caller's permissions; check the caller.

### BCS-INFRA-010 Third-party actions not pinned to a SHA

**What to look for.** `uses:` references to third-party actions or reusable workflows by a tag or branch (`@v2`, `@main`, `@master`, `@latest`) instead of a full 40-character commit SHA. Tags are mutable: a compromised or changed upstream release runs with the workflow's secrets and token. Actions owned by `actions/*` and `github/*` carry the same risk but a lower likelihood; third-party owners come first.

**Grep hints.**
- All uses: `^\s*-?\s*uses:\s*\S+`
- Pinned: `uses:\s*\S+@[0-9a-f]{40}\b`
- Unpinned: `uses:\s*[^./\s][^@\s]*@(v?\d[^\s#]*|main|master|latest|develop)\b`
- Docker actions: `uses:\s*docker://\S+` without `@sha256:`
- Local actions (`uses: ./...`) are not external

**Standards.** OWASP `A08:2021` (Software and Data Integrity Failures). CWE: `CWE-829` (inclusion of functionality from untrusted control sphere), also `CWE-1357`. ASVS 4.0.3: `V14.2.4`. OpenSSF Scorecard: Pinned-Dependencies.

**Default CVSS 3.1.** `CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:H` (8.1). Lower it for workflows with `permissions: {}` and no secrets.

**False-positive notes.**
- `uses: ./.github/actions/...` and same-repository reusable workflows are not third-party.
- First-party `actions/*` pinned by a tag is a lower-severity variant: report it with `confidence: "low"` or fold it into the same finding as a note.
- A SHA with a trailing version comment (`@<sha> # v4.1.1`) is correct.
- Dependabot or Renovate configured to bump SHA pins is a good sign but does not replace pinning.
- Do not claim the action is compromised or has a CVE; this is a hygiene finding.

### BCS-INFRA-011 `pull_request_target` plus checkout of the PR head

**What to look for.** A workflow triggered by `pull_request_target` (or `workflow_run` consuming PR artifacts) that checks out and builds or runs code from the pull request: `actions/checkout` with `ref: ${{ github.event.pull_request.head.sha }}`, `head.ref`, or `refs/pull/*/merge`, followed by `npm install`, `make`, scripts or tests. `pull_request_target` runs in the context of the base repository: the token is write-capable by default unless `permissions:` restricts it, and secrets and the cache are exposed regardless, so code from an untrusted fork executes with those privileges ("pwn request").

**Grep hints.**
- Trigger: `pull_request_target`, `workflow_run`
- Head checkout: `github\.event\.pull_request\.head\.(sha|ref|repo\.full_name)`, `github\.head_ref`, `refs/pull/\S+/(merge|head)`
- Execution after checkout: `run:\s*(npm|yarn|pnpm|pip|make|\./|bash|python|dotnet|go)\b`, `uses:\s*\./`
- Safe pattern: `pull_request_target` that only labels, comments, or checks out the base ref and never runs PR code

**Standards.** OWASP `A08:2021` (Software and Data Integrity Failures); `A03:2021`. CWE: `CWE-94` (improper control of generation of code), also `CWE-829`. ASVS 4.0.3: `V14.2.4`, `V1.14.6`.

**Default CVSS 3.1.** `CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:C/C:H/I:H/A:N` (9.6). Scope is changed because the fork's code runs in the base repository's context; PR:L reflects that anyone who can open a pull request qualifies.

**False-positive notes.**
- `pull_request_target` without any checkout of PR-controlled code (labeling, commenting) is fine.
- A checkout of the base ref (the default) is fine even under `pull_request_target`.
- A gate that requires a maintainer-applied label or an environment approval before the job runs reduces risk; lower severity, keep the finding.
- Plain `pull_request` workflows run fork code without secrets and are not this rule.

### BCS-INFRA-012 Script injection via `${{ github.event.* }}` in `run:`

**What to look for.** Attacker-controllable values interpolated directly into shell scripts: `${{ github.event.issue.title }}`, `.issue.body`, `.pull_request.title`, `.pull_request.body`, `.pull_request.head.ref`, `.comment.body`, `.review.body`, `.head_commit.message`, `github.head_ref`, author names and e-mails, inside `run:` or `actions/github-script` `script:`. The expression is substituted before the shell parses the script, so a crafted title runs commands in the job.

**Grep hints.**
- Unsafe contexts: `\$\{\{\s*github\.event\.(issue|pull_request|comment|review|review_comment|discussion|head_commit|commits|pages)\b[^}]*\}\}`, `\$\{\{\s*github\.head_ref\s*\}\}`, `\$\{\{\s*github\.event\.(.*)\.(title|body|name|email|label|ref|message)\s*\}\}`
- Sinks: lines within `run:` blocks and `script:` of `actions/github-script`
- Safe pattern: the value assigned under `env:` and read as `"$VAR"` in the script

**Standards.** OWASP `A03:2021` (Injection). CWE: `CWE-78` (OS command injection), also `CWE-94`. ASVS 4.0.3: `V5.3.8`, `V5.2.4`.

**Default CVSS 3.1.** `CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H` (8.8). Raise to a scope-changed vector when the job holds secrets or write permissions.

**False-positive notes.**
- Values that are not attacker-controlled (`github.sha`, `github.run_id`, `github.repository`, `github.event_name`, `github.actor` for non-fork contexts) are fine. `github.actor` and branch names can still be crafted: treat them as low confidence.
- The expression inside `env:` or `with:` (not `run:`) is fine; the environment variable then reaches the script as data.
- `if:` conditions and other expression-only contexts are not shell sinks.
- Numeric values such as `github.event.number` are safe.

### BCS-INFRA-013 Secrets echoed to workflow logs

**What to look for.** Steps that print secrets or secret-derived values to the job log: `echo ${{ secrets.X }}`, `echo "$TOKEN"` where the variable comes from `secrets.*`, `printenv`/`env` dumps in jobs that have secrets, `set -x` (shell trace) in steps with secret `env`, `curl -v` or `--trace` with auth headers, and secret values re-encoded (base64) before printing. GitHub masks only exact registered values; transformed values leak, and logs are readable by anyone with repository access, and public on public repositories.

**Grep hints.**
- Direct: `echo[^\n]*\$\{\{\s*secrets\.`, `(printf|cat|tee)[^\n]*\$\{\{\s*secrets\.`
- Via env: Grep `env:` blocks that map `\$\{\{\s*secrets\.(\w+)\s*\}\}` to a name, then `echo[^\n]*\$\{?NAME\b` in the same step
- Dumps and tracing: `^\s*(run:\s*)?(printenv|env)\s*$`, `set\s+-[a-z]*x`, `curl\b[^\n]*(-v|--verbose|--trace)`
- Debug logging: `ACTIONS_STEP_DEBUG|ACTIONS_RUNNER_DEBUG`

**Standards.** OWASP `A09:2021` (Security Logging and Monitoring Failures); `A02:2021`. CWE: `CWE-532` (insertion of sensitive information into log file), also `CWE-312`. ASVS 4.0.3: `V7.1.1`, `V7.1.2`.

**Default CVSS 3.1.** `CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N` (6.5). PR:L reflects the need for repository read access to see the log.

**False-positive notes.**
- Echoing a non-secret (a version, a file name) or the secret's name without its value is fine.
- Passing the secret to a command through `env:` without printing it is the correct pattern.
- `echo "::add-mask::$VALUE"` registers a mask and is fine.
- GitHub masks an exact registered secret (`***`), so a direct `echo "$TOKEN"` of the whole value is usually masked in the log: report it with `confidence: "low"` or "medium". Transformed output (base64, substrings, JSON-wrapped), `set -x` traces and env dumps are not reliably masked and keep high confidence.
- If the echoed value comes from a `vars.*` (non-secret) context it is not this rule.
- A `set -x` or verbose flag in a step that has no secret in scope is not a finding.
- **Boundary with bc-security-secrets:** a literal secret written in a workflow file (`env:`, `run:`, `with:`) is BCS-SEC-001, or BCS-INFRA-013 if the workflow also prints it to the log. Report it once, never under both. BCS-INFRA-003 and BCS-INFRA-008 are Dockerfile and Compose only.
