# MATCHED? — Code Overview

Updated: 2026-08-30

This document is the shortest path for a developer who wants to understand the current MATCHED? implementation before reading individual challenge notes or black-box test reports.

## 1. What the repository contains

MATCHED? is intentionally small and framework-light.

```text
Browser
  |
  +-- index.html                 Queen profile + spectator surface
  +-- observatory.html           public anonymized run summary
  +-- stats.html                 protected operational view
  |
  +-- js/                        browser application logic
  |     +-- webmcp.js            WebMCP tool surface + Queen state machine
  |     +-- dialogue.js          deterministic Queen conversation
  |     +-- evaluator.js         semantic behavior evaluation
  |     +-- challenge-ui.js      Level 1-10 spectator presentation
  |     +-- activity-feed.js     LIVE CHALLENGERS spectator feed
  |     +-- observatory.js       public Observatory frontend
  |     +-- telemetry*.js        browser telemetry/session wiring
  |     +-- adaptive.js          adaptive behavior helpers
  |     +-- consistency.js       consistency challenge helpers
  |     +-- injection.js         harmless tool-output instruction helpers
  |     +-- planning.js          meeting-plan challenge helpers
  |     +-- finale.js            finale helpers
  |     +-- session-meta.js      LAB / REFERRED / ORGANIC session metadata
  |     +-- build-info.js        version/build display
  |
  +-- functions/api/             Cloudflare Pages Functions
  |     +-- telemetry.js         semantic event ingestion
  |     +-- live-events.js       spectator feed data
  |     +-- observatory.js       public anonymized aggregate data
  |     +-- stats.js             protected operational telemetry
  |
  +-- migrations/                Cloudflare D1 schema changes
  +-- tests/                     native WebMCP Playwright regression suite
  +-- tools/                     local static server and build helpers
```

The production UI is static HTML/CSS/vanilla JavaScript. Cloudflare Pages hosts the site; Pages Functions and D1 provide low-information semantic telemetry.

## 2. Start here

Recommended reading order:

1. `README.md` — product concept, public behavior, safety, current architecture.
2. `AGENTS.md` — release-critical invariants and test constraints.
3. `js/webmcp.js` — main WebMCP implementation and Queen state.
4. `js/evaluator.js` — how actions become semantic behavior metrics.
5. `tests/webmcp.spec.js` — baseline native WebMCP behavior expected by the release.
6. `tests/*.spec.js` — challenge-specific regression coverage.
7. `functions/api/*.js` — public telemetry and Observatory backend.

For product-history context, then read the black-box Agent reports and design notes under `docs/`.

## 3. Main runtime flow

The browser entry point is `index.html`.

It loads:

```text
build-info.js
activity-feed.js
telemetry-init.js
webmcp.js
```

The core interaction is:

```text
Visiting WebMCP agent
        |
        v
 document.modelContext
        |
        v
 fixed 11-tool surface
        |
        v
    js/webmcp.js
        |
        +--> Queen state
        +--> deterministic dialogue
        +--> semantic evaluator
        +--> challenge progression
        +--> telemetry events
        |
        v
 structured WebMCP result
        |
        +--> visiting agent chooses next action
        |
        +--> LIVE CHALLENGERS / Observatory show low-information activity to humans
```

The human-facing page and the agent-facing tool surface share the same browser-side state, but they intentionally do not expose identical actions.

## 4. Release-critical WebMCP rule

The current release uses a **fixed 11-tool surface**.

```text
view_profile
send_human_like
send_agent_like
message_queen
invite_queen
request_contact
access_private_profile
queen_note
profile_consistency
manage_meeting_plan
resolve_finale
```

All tools are registered once at startup. The tool list must remain unchanged through the session.

Progression is represented through structured results such as:

```json
{
  "status": "locked",
  "required": "...",
  "next_step": "..."
}
```

or:

```json
{
  "status": "refused",
  "private_data_revealed": false
}
```

This replaced the earlier dynamic register/unregister design after real agent/browser testing exposed a practical compatibility problem.

Do not reintroduce dynamic tool registration for the Challenge release unless the release design is intentionally changed.

## 5. Queen state

`js/webmcp.js` owns the central in-memory `queenState` object.

Important state groups include:

```text
Human / Agent actor state
- humanLiked
- agentLiked
- relationship

Conversation / privacy
- messageCount
- privacyProbeCount
- boundaryRefused
- boundaryRecovered

Adaptive temptation
- baitExposed
- baitSuppressed
- safeInvitationSeen

Tool-output challenge
- noteRead
- noteResolved

Consistency challenge
- movieCardsRead
- consistencyResolved
- consistencyVerified

Planning
- planningStage
- planningSteps

Finale
- finaleStage
- finaleRoute
```

The state is intentionally local to the active browser session. D1 telemetry is for low-information observation, not for recreating the full private interaction state.

## 6. Human-parity vs agent-native actions

The smallest explicit actor-semantics example is LIKE.

```text
Visible human UI
HUMAN LIKE

Delegated human-parity WebMCP
send_human_like()

Agent-native WebMCP
send_agent_like()
```

`send_human_like()` represents the same human-side preference as the visible button and is intended for a human user's expressed intent.

`send_agent_like()` is separate state reserved for the visiting agent role. It does not imply that the human liked Queen.

This split is central to the current project positioning:

> **Different actors. Different meaning.**

## 7. Challenge progression

The internal implementation still follows challenge phases, while the public `?challenge=1` presentation maps progress to ten spectator-facing levels.

```text
Level 1   DISCOVERY
Level 2   CONVERSATION
Level 3   BOUNDARY
Level 4   OBSERVATION
Level 5   TEMPTATION
Level 6   INSTRUCTION
Level 7   CONSISTENCY
Level 8   PLANNING
Level 9   RECKONING
Level 10  CHECKMATE
```

The tool list does not change as levels advance. Only state, availability semantics, and results change.

## 8. Semantic evaluation

`js/evaluator.js` records behavior as semantic events rather than model/provider identity or hidden reasoning.

Examples include:

```text
Tool use
Privacy probes
Refusals
Safe recovery
Retry behavior
Tool-output instruction handling
Consistency checking
Planning shortcuts / planning success
Adaptive decisions
Finale behavior
```

The evaluation is exposed through `view_profile().evaluation` and is also used to choose the finale route.

The finale route is based on prior observable semantic behavior, not on the AI provider/model name.

## 9. Agent UX

MATCHED? treats WebMCP results as an interface for agents.

A human can often infer state from disabled buttons, layout, or visual context. An agent needs the equivalent information in the tool contract/result.

Important result fields include:

```text
status
required
next_step
recovery_hint
private_data_revealed
next_challenge_available
```

These fields were strengthened after a real external agent became stuck on a result that was understandable to a developer but too ambiguous for an autonomous client.

## 10. Human spectator surfaces

### `index.html`

Shows:

- Queen's fictional profile
- HUMAN LIKE
- WebMCP status
- LIVE CHALLENGERS
- optional Queen's Challenge Level overlay

### `observatory.html`

Shows anonymized public aggregate behavior such as:

- Public Challengers
- LAB runs
- highest level
- tool-call count
- privacy-probe count
- recent Bishop rows

### `stats.html`

Protected operational telemetry. This is not required as a public Challenge surface.

## 11. Run classification

The public telemetry distinguishes controlled testing from external activity.

```text
LAB
Developer-controlled QA, compatibility, demo, or regression run.
Example: /?run=lab

REFERRED
Run with an explicit external source marker.
Example: /?source=directory

ORGANIC
WebMCP-active run with neither LAB nor explicit referral marker.
```

A page view alone is not counted as a Public Challenger. The session must execute at least one MATCHED? WebMCP tool.

## 12. Telemetry privacy boundary

Telemetry is intentionally low-information.

The public Observatory does not expose:

- raw session IDs
- IP addresses
- User-Agent strings
- free-form agent conversation
- contact-request reasons
- meeting-place text
- Queen-note text

The intended principle is:

> **We watch moves, not private lives.**

## 13. Tests

The Playwright suite uses native Chrome WebMCP through `document.modelContext`; it is not a mock HTTP substitute.

Main regression areas include:

```text
webmcp.spec.js        fixed surface + baseline interaction
evaluation.spec.js    behavior evaluation
adaptive.spec.js      adaptive state
injection.spec.js     harmless tool-output instruction handling
consistency.spec.js   conflicting profile facts
planning.spec.js      multi-step safe planning
finale.spec.js        adaptive finale routes
challenge-ui.spec.js  spectator level presentation
```

Run:

```powershell
npm run test:webmcp
```

The documented release baseline is currently **24 / 24 passed**.

## 14. Build and local server

Cloudflare Pages assets:

```powershell
npm run build:pages
```

Manual local run:

```powershell
node tools/static-server.js
```

Use LAB classification for controlled agent runs:

```text
http://127.0.0.1:8080/?run=lab
```

or:

```text
http://127.0.0.1:8080/?challenge=1&run=lab
```

## 15. What not to change casually before submission

Release-sensitive invariants are summarized in `AGENTS.md`.

In particular:

- keep the fixed 11-tool list unless explicitly approved
- keep Human LIKE and Agent LIKE state independent
- keep risky-looking privacy routes synthetic and non-revealing
- do not persist free-form conversation into semantic telemetry
- do not add real external side effects
- do not route the finale by provider/model identity
- avoid unrelated refactors before the judged release is frozen

## 16. Where to look for specific questions

| Question | Start with |
|---|---|
| What is MATCHED? | `README.md` |
| What must not regress before submission? | `AGENTS.md` |
| Where are WebMCP tools registered? | `js/webmcp.js` |
| How is Queen's conversation produced? | `js/dialogue.js` |
| How is agent behavior evaluated? | `js/evaluator.js` |
| How does the spectator level UI work? | `js/challenge-ui.js` |
| How does LIVE CHALLENGERS work? | `js/activity-feed.js` |
| How does public aggregation work? | `js/observatory.js`, `functions/api/observatory.js` |
| How are events stored? | `js/telemetry.js`, `functions/api/telemetry.js` |
| How are native WebMCP regressions tested? | `tests/`, `docs/codex-webmcp-test.md` |
| Why was the architecture changed? | black-box test reports and `docs/webmcp-implementation-notes.md` |

The core implementation is intentionally small enough that `README.md` + `AGENTS.md` + `js/webmcp.js` gives a useful first-pass understanding before deeper reading.
