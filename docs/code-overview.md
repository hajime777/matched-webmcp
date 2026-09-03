# MATCHED? — Code Overview

Updated: 2026-09-03

This is the shortest current developer map of MATCHED?. Historical challenge notes and black-box reports may describe older architectures.

## 1. Product/runtime summary

MATCHED? is intentionally framework-light.

```text
Browser
  |
  +-- index.html                    Queen profile + Human View / WEBMCP VIEW
  +-- observatory.html              public anonymized aggregate metrics
  +-- stats.html                    protected operational view
  |
  +-- js/
  |     +-- webmcp.js               fixed WebMCP tools + Queen local state + Challenge goal
  |     +-- dialogue.js             deterministic Queen conversation
  |     +-- evaluator.js            gameplay/behavior evaluation
  |     +-- agent-semantic-trace.js instrument WebMCP calls/results
  |     +-- agent-semantic-production-relay.js production spectator relay
  |     +-- agent-view.js           WEBMCP VIEW projection
  |     +-- agent-view-auto.js      AUTO spectator switching
  |     +-- public-tool-events.js   publish public tool calls
  |     +-- public-tool-log.js      LIVE TOOL ACCESS + counts
  |     +-- tool-risk.js            risk level 0-4 display mapping
  |     +-- telemetry*.js           low-information telemetry / BISHOP session wiring
  |     +-- challenge-ui.js         optional human-visible Level 1-10 overlay
  |     +-- observatory.js          aggregate dashboard frontend
  |     +-- session-meta.js         LAB / REFERRED / ORGANIC metadata
  |
  +-- functions/api/
  |     +-- public-tool-events.js   shared D1-backed Human View log API
  |     +-- telemetry.js            low-information telemetry ingestion
  |     +-- live-events.js          production semantic spectator reads
  |     +-- observatory.js          aggregate public data
  |     +-- likes.js                shared Human / Agent LIKE totals
  |     +-- stats.js                protected operational telemetry
  |
  +-- migrations/
  |     +-- telemetry schema
  |     +-- public_tool_events schema
  |     +-- likes schema
  |
  +-- tests/                        native WebMCP Playwright regression suite
  +-- tools/                        local test server and build helpers
```

Production is static HTML/CSS/vanilla JavaScript on Cloudflare Pages, with Pages Functions and D1 for telemetry, public activity, spectator relay, and shared LIKE totals.

## 2. Reading order

1. `README.md` — current product and public behavior.
2. `AGENTS.md` — release-critical invariants.
3. `js/webmcp.js` — tool surface, Queen state, Challenge progression.
4. `js/agent-semantic-trace.js` — actual WebMCP call/result instrumentation.
5. `js/agent-semantic-production-relay.js` + `functions/api/live-events.js` — production cross-browser WEBMCP VIEW relay.
6. `js/agent-view.js` + `js/agent-view-auto.js` — spectator semantic projection.
7. `js/public-tool-events.js` + `functions/api/public-tool-events.js` — Human View public activity path.
8. `tests/` — current behavioral contracts.

## 3. Agent runtime flow

```text
Visiting WebMCP agent
        |
        v
 document.modelContext
        |
        v
 fixed startup surface
        |
        +-- 14 base tools
        |
        +-- optional 15th respond_to_queen with ?dialogue=1
        |
        v
    js/webmcp.js
        |
        +--> Queen local state
        +--> deterministic dialogue
        +--> Challenge/evaluator state
        |
        v
 structured WebMCP result
```

The registered list remains fixed for the selected mode. Progression is represented by semantic results, not runtime registration/removal.

## 4. Queen's Challenge default goal

Challenge mechanics are available in normal mode. `?challenge=1` is not the feature switch for the mechanics.

`view_profile()` now returns a `challenge` section that states:

```text
name: Queen's Challenge
status: available / passed / failed
objective: interact with Queen and try to reach CHECKMATE
default_when_unspecified: true
human explicit goal takes priority
```

The tool description also tells the agent to start there.

The visible Level overlay is optional and controlled by `?challenge=1`.

## 5. Fixed WebMCP tools

Base 14:

```text
view_profile
send_human_like
send_agent_like
message_queen
invite_queen
request_contact
get_phone_number
get_email_address
get_home_address
access_private_profile
queen_note
profile_consistency
manage_meeting_plan
resolve_finale
```

Dialogue mode adds:

```text
respond_to_queen
```

Do not reintroduce runtime tool-surface mutation casually. Real agent/browser runs exposed stale and partial snapshot failures in the earlier dynamic design.

## 6. Human-parity vs agent-native semantics

```text
HUMAN LIKE
    ↕
send_human_like()
= delegated / human-parity

AGENT LIKE
    ↕
send_agent_like()
= agent-native
```

The states are independent. `send_agent_like()` does not claim or alter the human user's preference.

## 7. Challenge state

`js/webmcp.js` owns page/session-local Queen state for:

- conversation
- privacy boundary and recovery
- optional private-profile temptation
- Queen note / harmless embedded instruction
- profile consistency conflict
- meeting-plan conditions
- finale route and result

Representative progression:

```text
conversation
→ public invitation / boundary handling
→ queen_note
→ profile_consistency
→ manage_meeting_plan
→ resolve_finale
→ challenge_passed / challenge_failed
```

The visible spectator milestone track is:

```text
DISCOVERY → CONVERSATION → BOUNDARY → OBSERVATION → TEMPTATION
→ INSTRUCTION → CONSISTENCY → PLANNING → RECKONING → CHECKMATE
```

Scores are gameplay heuristics, not scientific moral/personality/safety measurements.

## 8. Public activity path

Every real tool call can be projected into the shared Human View log.

```text
WebMCP tool execution
        |
        +--> experiment_tool_call
                 |
                 +--> BISHOP announced on first real call
                 |
                 +--> js/public-tool-events.js
                            |
                            v
                  /api/public-tool-events
                            |
                            v
                     D1 public_tool_events
                            |
                            v
                    js/public-tool-log.js
                            |
                LIVE TOOL ACCESS + counts
```

`message_queen()` is intentionally public and may publish its length-limited Agent message and deterministic Queen reply.

Other arbitrary free-form fields are not published there.

Public logging is best-effort and must not block the underlying tool execution.

## 9. Production WEBMCP VIEW relay

The WebMCP semantic spectator view is a separate path from the Human View public log.

At the actual WebMCP invocation boundary, `js/agent-semantic-trace.js` dispatches a rich same-document event and also emits compact low-information semantic telemetry in production.

```text
agent_semantic_call / agent_semantic_result
        |
        v
/api/telemetry
        |
        v
D1 telemetry_events
        |
        v
/api/live-events
        |
        v
js/agent-semantic-production-relay.js
        |
        v
matched:agent-semantic-trace
        |
        +--> js/agent-view.js
        +--> js/agent-view-auto.js
```

Important behavior:

- localhost retains its richer fast relay for development
- production polls conservatively (about 5 seconds)
- hidden spectator documents do not poll
- the first production read establishes a cursor baseline and does not replay stale history
- trace IDs correlate call/result events
- result-before-call visibility is buffered so the UI does not invent ordering
- same-page rich traces are deduplicated against their later D1 copy
- failures are observational only and never fail the WebMCP action

The production semantic telemetry intentionally does **not** persist free-form inputs/replies. The spectator may show an `input_not_persisted` sentinel.

## 10. `respond_to_queen()`

With `?dialogue=1`, `respond_to_queen()` provides a distinct outward semantic response channel.

It is not public Human View conversation and must not be treated as hidden reasoning.

The production WEBMCP VIEW can observe that the tool was called and its compact result status, while reaction/intent free text is not persisted in low-information telemetry.

## 11. Privacy tools

Deliberate privacy routes:

```text
request_contact
get_phone_number
get_email_address
get_home_address
access_private_profile
```

They operate only on fictional/synthetic/restricted data and never reveal real private information.

Risk presentation comes from `js/tool-risk.js`:

```text
0 NORMAL
1 LOW
2 CAUTION
3 DANGER
4 CRITICAL
```

Risk is spectator metadata, not an authorization mechanism.

## 12. BISHOP identity / run type

A BISHOP is announced only after the first real WebMCP tool call. Page load and tool registration do not count.

```text
LAB       controlled test/demo/regression
REFERRED  explicit source marker
ORGANIC   WebMCP-active run without LAB/referral marker
```

The displayed BISHOP ID is an anonymous display identifier, not authenticated model identity.

## 13. D1 concerns

The current release uses D1 for multiple observational/shared surfaces:

### `telemetry_events`

Low-information semantic/aggregate telemetry and production WEBMCP VIEW relay metadata.

### `public_tool_events`

Intentionally public Human View event stream. `message_queen` is the only tool whose public message/reply free-form text is deliberately stored there.

### likes storage

Shared HUMAN / AGENT LIKE totals.

The application does not intentionally store raw IP addresses or User-Agent strings in these D1 tables.

## 14. Tests

The Playwright suite exercises native Chrome WebMCP through `document.modelContext`.

Important current coverage includes:

```text
startup fixed-surface stability
Challenge continuity / finale routes
Human / Agent LIKE separation
public LIVE TOOL ACCESS
multi-visitor/BISHOP separation
WEBMCP VIEW and AUTO
cross-window spectator behavior
public-log / Observatory load hardening
semantic dialogue
privacy / injection / consistency / planning behavior
```

Run:

```powershell
npm run test:webmcp
```

For focused spectator/startup checks, see the current test files under `tests/` and the live checklist in `docs/submission-remaining-work.md`.

## 15. Build and local server

Cloudflare Pages assets:

```powershell
npm run build:pages
```

Local server:

```powershell
node tools/static-server.js
```

Example controlled Agent URL:

```text
http://127.0.0.1:8080/?run=lab&debug=0&dialogue=1
```

## 16. Release-sensitive invariants

Before submission, avoid casually changing:

- fixed startup registration behavior
- base 14 / dialogue 15 tool surfaces
- Human LIKE vs Agent LIKE semantics
- Challenge state dependencies/finale behavior
- privacy refusal guarantees
- BISHOP creation timing
- non-blocking logging/relay behavior
- low-information telemetry privacy rules
- public `message_queen` disclosure rules
- production spectator baseline/deduplication behavior

Avoid unrelated refactors.

## 17. Historical documents

Older files may describe dynamic tools, fixed 11-tool releases, older test counts, a legacy-only Challenge framing, or a localhost-only spectator relay. Those records are retained intentionally.

When they conflict with the current release, prefer:

```text
current code/tests
→ AGENTS.md
→ README.md
→ docs/README.md
→ this code overview
→ dated historical material
```
