# MATCHED? — Pre-submission Code / Security Review

Reviewed: 2026-09-03

Scope: targeted pre-submission review of the public WebMCP surface, browser telemetry, Human View public activity, production WEBMCP VIEW relay, Observatory rendering, and protected stats endpoint.

This is **not a full professional security audit**. It is a focused release review intended to catch obvious submission-blocking defects without destabilizing the judged release.

## Executive result

No known release-blocking confidentiality or unsafe-side-effect defect is currently documented.

The main residual risk remains **telemetry integrity / public-feed integrity**, not private-data disclosure:

> Queen's Observatory and spectator telemetry are best-effort public observation layers. They are not cryptographically authenticated records of genuine agent identity or behavior.

A malicious client could theoretically fabricate syntactically valid observational events and pollute public counts or spectator data. The application does not use those streams for authorization, billing, identity, or safety-critical decisions.

Current release recommendation:

- keep telemetry low-information
- keep public/semantic logging observational and non-blocking
- do not claim tamper-proof provenance
- avoid late authentication/rate-limit redesign unless actual abuse is observed
- freeze the judged tool surface and semantics after final verification

---

## 1. WebMCP surface

Primary file:

```text
js/webmcp.js
```

Current release properties:

- fixed 14-tool base surface
- optional fixed 15th `respond_to_queen()` with `?dialogue=1`
- no runtime register/unregister progression
- constrained input schemas
- free-form inputs have explicit maximum lengths where applicable
- privacy/contact/profile-like data is synthetic or restricted
- privacy-related routes refuse rather than disclose real private data
- no purchase, credential, download, email sending, third-party account action, or real-world side effect is part of the Challenge
- finale routing uses observed semantic behavior, not provider/model identity
- Queen's Challenge is the default agent goal only when the human has not supplied a different explicit goal

Result: **no obvious release-blocking side-effect or PII issue identified in the current design**.

---

## 2. Low-information telemetry ingestion

Primary file:

```text
functions/api/telemetry.js
```

Current design intentionally allowlists compact fields such as:

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

The telemetry path is observational and best-effort.

Important privacy rule:

> arbitrary free-form tool inputs, Queen replies, meeting places, request reasons, Queen-note text, synthetic card values, and `respond_to_queen()` reaction/intent must not be copied into low-information telemetry.

The production semantic spectator relay uses this same low-information store for compact `agent_semantic_call` / `agent_semantic_result` metadata.

### Residual integrity limitation

The telemetry endpoint is not cryptographic attestation that an event came from a genuine WebMCP agent/tool execution.

Impact:

```text
Can pollute observational counts/feed: theoretically yes
Can directly mutate Queen page/session Challenge state: no
Can authenticate as a real model/provider: no such guarantee exists
Can expose intentionally stored arbitrary private tool input: not by current low-information schema/design
```

Risk classification for hackathon use: **low-to-moderate integrity risk / low confidentiality risk**, assuming current allowlists and rendering rules remain unchanged.

---

## 3. Human View public activity

Primary files:

```text
js/public-tool-events.js
js/public-tool-log.js
functions/api/public-tool-events.js
```

This is intentionally different from low-information semantic telemetry.

`message_queen()` is defined as public conversation. Its length-limited Agent message and deterministic Queen reply may be stored in `public_tool_events` and shown to spectators.

Other arbitrary free-form fields such as:

```text
request reason
meeting place
Queen-note text
respond_to_queen reaction / next intent
```

must not be published through this feed.

Public-log failures are caught and must not fail the WebMCP action.

---

## 4. Production WEBMCP VIEW relay

Primary files:

```text
js/agent-semantic-trace.js
js/agent-semantic-production-relay.js
functions/api/live-events.js
js/agent-view.js
js/agent-view-auto.js
```

Current production path:

```text
WebMCP call/result
→ compact semantic telemetry
→ D1 telemetry_events
→ /api/live-events
→ separate spectator browser
→ matched:agent-semantic-trace
→ WEBMCP VIEW / AUTO
```

Privacy properties:

- free-form input/reply text is not persisted in semantic telemetry
- production call events may show an `input_not_persisted` sentinel
- trace/status/state metadata is compact and bounded
- `respond_to_queen()` call/result metadata may be observable in WEBMCP VIEW, but reaction/intent free text is not persisted

Correctness/safety properties:

- first production poll establishes a baseline and does not replay stale history into AUTO
- hidden spectator documents do not poll
- result-before-call visibility is buffered rather than fabricating an order
- same-document rich traces are deduplicated against later D1 copies
- transport failures are observational only and do not fail the WebMCP action

This relay was added after a real production smoke test exposed a local-only cross-window assumption.

---

## 5. Public rendering / XSS posture

Current spectator/Observatory rendering should continue to prefer DOM creation and `textContent` for externally influenced strings rather than unsafe HTML interpolation.

Relevant surfaces include:

```text
LIVE TOOL ACCESS
WEBMCP VIEW labels/state
Queen's Observatory
stats.html
```

Do not weaken this rule during final polish.

No current release requirement justifies rendering arbitrary agent text as HTML.

---

## 6. Queen's Observatory

Primary file:

```text
functions/api/observatory.js
```

Intended behavior:

- aggregate/low-information public fields
- no raw internal session IDs in the public UI
- no raw IP/User-Agent data intentionally stored/exposed
- recent BISHOP display uses anonymous display identity/run classification
- no claim of authenticated agent/model identity

Safe wording:

> **Queen's Observatory exposes anonymized, low-information, best-effort experiment telemetry.**

Avoid wording such as:

```text
verified proof of real agents
tamper-proof run history
authenticated model/provider identity
```

---

## 7. BISHOP identity

BISHOP IDs are display/session identifiers only.

A BISHOP run is announced after a real WebMCP tool execution, not merely page load or tool registration.

Do not present a BISHOP ID as:

- authenticated human identity
- authenticated provider/model identity
- cryptographic session attestation

---

## 8. Protected stats endpoint

Primary files:

```text
functions/api/stats.js
stats.html
```

The protected operational dashboard uses a configured bearer secret rather than a full identity/access-control system.

Keep the secret private and strong. Do not expose it in public source, telemetry, screenshots, or demo materials.

---

## 9. HTTP security headers

The current release uses targeted no-store/robot controls on sensitive operational/telemetry surfaces.

A broader production service could add CSP, Referrer-Policy, framing restrictions, and other hardening headers.

For this judged experimental release, adding a new CSP immediately before submission could introduce WebMCP/browser compatibility risk. Do not add late header hardening unless tested in the actual native WebMCP environment.

Status: **post-submission hardening opportunity, not a current submission blocker**.

---

## 10. Rate limiting / abuse

No full application-level anti-abuse system should be assumed.

Possible public impact of abuse:

- telemetry spam
- D1 write/read amplification
- polluted LIVE TOOL ACCESS / Observatory counts
- noisy WEBMCP VIEW spectator events

This does not directly change another visitor's page/session-local Queen Challenge state.

Recommendation:

```text
Judged release:
  monitor; document observational limitations; avoid late infrastructure redesign

Post-submission / LAB:
  evaluate Cloudflare rate limiting, provenance controls, retention policy, and stronger isolation if public traffic grows
```

---

## 11. Current release verification relevant to this review

Verified behavior before this documentation pass includes:

- full production Queen's Challenge run to CHECKMATE / `clean_finish`
- no WebMCP tool errors in that production run
- no stale tool snapshot / missing tools / reload
- separate production Chrome spectator receiving WEBMCP VIEW semantic updates through AUTO
- focused cross-window/startup/public-load automated checks passing after the spectator-relay change

The final judged commit still needs a final regression/smoke pass after the latest `view_profile()` default-goal wording change.

---

## 12. Release recommendation

Remaining technical gate:

```text
1. Pull final develop.
2. Run final native WebMCP regression.
3. Smoke-test the deployed public site with a minimal non-walkthrough prompt.
4. Verify fixed surface, Human/Agent LIKE separation, Challenge progression, and spectator relay.
5. Record judged commit SHA.
6. Finish video / YouTube / Devpost.
7. Submit and freeze the judged version.
```

Do not claim:

- full professional security audit
- cryptographically authentic telemetry
- manipulation-proof public counts
- authenticated model/provider identity
- scientific moral/personality/safety measurement

The current release is an experimental WebMCP Challenge project, not a production identity, authorization, or high-assurance audit system.
