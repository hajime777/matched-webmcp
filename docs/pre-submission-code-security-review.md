# MATCHED? — Pre-submission Code / Security Review

Reviewed: 2026-08-30

Scope: targeted pre-submission review of the public WebMCP surface, browser telemetry, public spectator/Observatory rendering, and protected stats endpoint.

This is **not a full professional security audit**. It is a focused release review intended to find obvious submission-blocking defects without destabilizing the fixed 11-tool release.

## Executive result

No release-blocking code/security defect was identified in this targeted review.

The main residual risk is **telemetry integrity**, not privacy leakage or code execution:

> Queen's Observatory is a best-effort public observation layer. It is not a cryptographically authenticated record of genuine agent behavior.

A malicious client could fabricate syntactically valid telemetry and pollute public counts. The current application does not treat Observatory data as an authorization, billing, identity, or security decision source, so the impact is limited to experimental/public metrics.

Recommendation for the Challenge release:

- do not add a new authentication/rate-limit architecture immediately before submission unless abuse is actually observed
- do not describe Observatory data as tamper-proof evidence
- keep the current low-information telemetry boundary
- freeze the stable tool surface
- consider rate limiting / stronger telemetry provenance after the judged release

---

## 1. WebMCP surface

Primary file:

```text
js/webmcp.js
```

Observed release properties:

- fixed 11-tool surface
- tool schemas constrain expected inputs
- free-form strings have explicit maximum lengths
- private/contact/profile-like data is synthetic or `restricted`
- privacy-related routes refuse access instead of disclosing data
- no purchase, email, credential, download, third-party service, or other external side effect is part of the challenge
- finale routing uses observable semantic behavior rather than provider/model identity

Result: **no obvious release-blocking side-effect or PII issue found**.

The fixed surface should not be refactored during final submission polish without a specific regression-driven reason.

---

## 2. Telemetry ingestion

Primary file:

```text
functions/api/telemetry.js
```

Positive controls observed:

- request body capped at 4096 bytes
- event names validated with a restrictive pattern
- session IDs validated with a restrictive pattern
- fields are truncated to bounded lengths
- tool count is range-limited
- JSON parse failures are rejected
- SQL insert uses prepared statement binding
- cross-origin browser requests with a mismatching `Origin` are rejected
- DB failures do not break the WebMCP game
- endpoint accepts POST only

### Residual integrity limitation

The telemetry endpoint is intentionally public and has no authentication that proves an event came from a genuine WebMCP tool execution.

Also, the current same-origin check is conditional:

```text
if Origin exists and does not match -> reject
if Origin is absent -> request may continue
```

Even a strict Origin requirement would not provide strong attestation because a non-browser client can choose request headers. It would only raise the bar for casual misuse.

Impact:

```text
Can pollute experimental counts/feed: yes
Can reveal stored private data: no evidence found
Can modify Queen challenge state: no
Can authenticate as a real model/provider: not applicable
Can cause SQL injection through values: no obvious path found
```

Risk classification for current hackathon use: **low-to-moderate integrity risk / low confidentiality risk**.

---

## 3. Telemetry privacy boundary

Primary browser file:

```text
js/telemetry.js
```

`buildPayload()` intentionally allowlists low-information fields:

```text
event
session_id
path
tool
status
source
phase
supported
tool_count
```

The implementation does not send:

- free-form Queen conversation
- request reason
- meeting-place text
- Queen-note text
- full tool result bodies

This is consistent with the public privacy claim:

> **We watch moves, not private lives.**

Result: **current telemetry design is appropriately conservative for the experiment**.

---

## 4. Public rendering / XSS review

Primary files:

```text
js/activity-feed.js
js/observatory.js
stats.html
```

The reviewed dynamic rendering paths use DOM element creation and `textContent` rather than interpolating telemetry strings through `innerHTML`.

Examples include:

```text
message -> text.textContent
metadata -> small.textContent
Bishop/run values -> cell.textContent
stats table values -> td.textContent
```

Result: **no obvious stored/reflected XSS path was found in the reviewed public telemetry rendering**.

This matters because `source`, `tool`, `status`, and related telemetry fields can ultimately originate from client-side data.

---

## 5. Public Observatory API

Primary file:

```text
functions/api/observatory.js
```

Observed behavior:

- public endpoint returns aggregate/low-information fields
- raw session IDs are not returned
- IP/User-Agent/free-form text are not exposed
- only classified LAB / ORGANIC / REFERRED rows with a Bishop display ID are listed in recent challengers
- SQL is static and does not interpolate request-controlled query fragments
- response disables caching

Result: **no obvious confidentiality issue found**.

Limitation: because source telemetry can be forged, the aggregates are observational rather than authenticated evidence.

---

## 6. LIVE CHALLENGERS API

Primary file:

```text
functions/api/live-events.js
```

Observed behavior:

- GET only
- numeric `after` cursor normalized before binding
- query values use bound parameters
- response exposes low-information event metadata only
- response disables caching

Result: **no obvious injection or private-data exposure issue found**.

As with Observatory, integrity depends on the quality of the underlying telemetry stream.

---

## 7. Protected stats endpoint

Primary files:

```text
functions/api/stats.js
stats.html
```

Observed controls:

- requires configured `STATS_KEY`
- expects `Authorization: Bearer <STATS_KEY>`
- unauthorized requests return 404 rather than exposing endpoint details
- response disables caching
- browser page stores the entered key only in JavaScript memory
- key is not written to localStorage or sessionStorage
- dynamic table values use `textContent`

Result: **reasonable for a small private operational dashboard**.

Residual note: this is a single shared bearer secret, not a full identity/access-control system. Keep the key strong and private.

---

## 8. HTTP security headers

Current `_headers` focuses on:

- `X-Robots-Tag` for private stats
- `Cache-Control: no-store` for stats/telemetry surfaces

A broader production site might additionally consider CSP, Referrer-Policy, framing restrictions, and other hardening headers.

For this Challenge release, adding a new CSP immediately before submission could create compatibility/regression risk for an experimental browser API. No header expansion is recommended unless it is regression-tested in the actual WebMCP browser environment.

Status: **hardening opportunity, not a submission blocker**.

---

## 9. Rate limiting / abuse control

An earlier MVP design note mentioned rate limiting, but no application-level rate limiter was found in the current repository review.

Possible impact:

- telemetry spam
- D1 write amplification
- polluted public feed / Observatory counts

This does not affect the internal Queen state machine because the telemetry endpoint is a separate observation path.

Recommendation:

```text
Challenge release:
  document limitation; monitor usage; avoid risky late infrastructure changes

Post-submission / if abuse appears:
  add Cloudflare-side rate limiting and/or stronger session/provenance controls
```

Status: **known deferred hardening item**.

---

## 10. Repository unfinished-code scan

Repository search on 2026-08-30 found no obvious markers for:

```text
TODO
FIXME
not implemented
placeholder
```

This does not prove completeness, but it means there is no visible backlog encoded through common source markers.

---

## 11. Release recommendation

For the judged release, prioritize stability over new security architecture.

Recommended remaining technical gate:

```text
1. Finish video-related UI adjustments, if any.
2. Run the full native WebMCP regression again.
3. Smoke-test the deployed public site.
4. Verify the 11-tool surface and Human/Agent LIKE separation.
5. Record the release commit SHA.
6. Submit and freeze the judged version.
```

Do not claim:

- Observatory events are cryptographically authentic
- public run counts cannot be manipulated
- the project has completed a full external security audit

Safe wording:

> **Queen's Observatory exposes low-information, anonymized, best-effort semantic telemetry from the public experiment.**

The current release is an experimental WebMCP challenge, not a production identity, authorization, or high-assurance audit system.
