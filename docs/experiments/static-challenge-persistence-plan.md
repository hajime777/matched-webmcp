# Static Challenge Continuity Experiment

Goal: let one anonymous visiting AI agent remain one BISHOP and complete Queen's Challenge without dynamic WebMCP registration/removal.

## Current decision

- No human login/account system.
- One anonymous BISHOP identifies one Agent run.
- WebMCP tools are registered once and stay fixed for the run.
- Challenge progression is state only: `locked`, `available`, `resolved`, `passed`, etc.
- First validation target is same-page continuity. This directly addresses the historical failure where dynamic tool-surface changes caused the client to disable WebMCP before the BISHOP could finish.
- Server-side persistence is deliberately deferred until black-box testing shows that Codex actually reloads/reopens and loses the page-local run. Do not add a database requirement without evidence.

## Gate 0-A: startup surface stability

The latest black-box Challenge run completed as one BISHOP, but one `profile_consistency` attempt was rejected because the client considered its WebMCP tool snapshot stale and refreshed the tool list before continuing.

The current implementation registers the 14 base tools with a loop that awaits each `registerTool()` call, while `respond_to_queen()` is registered separately when `dialogue=1`. The working hypothesis is therefore a startup publication race rather than Challenge-stage dynamic registration.

The WebMCP API registers a single tool per `registerTool()` call and emits `toolchange` when tools are added or removed. A client that observes an early startup `toolchange` can therefore take a partial snapshot if later startup registrations are still pending.

`tests/static-tool-surface-startup.spec.js` records every startup `toolchange` snapshot from document initialization. The acceptance criterion is strict:

1. the first observable `toolchange` already exposes all 15 `dialogue=1` tools;
2. every later startup snapshot exposes the exact same 15 names;
3. no partial 1..14-tool surface is externally observable.

This test is intentionally expected to expose the current race before an implementation fix is made.

Candidate fix after reproduction: initiate registration of the complete fixed surface in one synchronous startup batch, then await completion as a group. Do not restore runtime registration/removal and do not change Challenge progression semantics.

## Gate 0-B: full same-page Challenge continuity

`tests/static-challenge-continuity.spec.js` drives a single BISHOP from profile discovery through conversation, public invitation, Queen note, consistency check, meeting plan, and adaptive finale while repeatedly asserting:

1. the same 15-tool `dialogue=1` surface remains registered;
2. the BISHOP ID does not change;
3. no runtime tool registration/removal is needed;
4. the challenge reaches `10 / 10` and `passed`.

Run the focused Gate 0 tests with:

```powershell
npx playwright test tests/static-tool-surface-startup.spec.js tests/static-challenge-continuity.spec.js
```

After the startup race is fixed, repeat the neutral black-box Challenge prompt with the same browser Agent and require:

- one BISHOP from start to finish;
- no reload/reopen;
- no stale tool snapshot;
- no observable tool-set change;
- successful CHECKMATE completion.

## If reload/reopen breaks continuity

Add anonymous run persistence, not user accounts:

- browser-held opaque run token / BISHOP ID;
- same-origin state endpoint;
- D1 row keyed only by the opaque run ID;
- store semantic challenge state and evaluator counters only;
- do not store free-form messages, meeting-place text, IP address, user-agent string, or real-person identifiers.

This branch is experimental and should not be merged into `develop` until startup surface stability and Codex black-box continuation testing are complete.
