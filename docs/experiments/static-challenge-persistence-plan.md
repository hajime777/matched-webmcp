# Static Challenge Continuity Experiment

Goal: let one anonymous visiting AI agent remain one BISHOP and complete Queen's Challenge without dynamic WebMCP registration/removal.

## Result

**Gate 0 is complete.**

The current fixed-surface implementation now satisfies all three continuity checks:

- Gate 0-A — startup surface stability: **PASS**
- Gate 0-B — automated same-BISHOP Challenge continuity: **PASS**
- Gate 0-C — real-agent Codex black-box completion: **PASS**

Detailed black-box report:

- `docs/experiments/2026-09-02-gate0c-codex-challenge-report.md`

## Current decision

- No human login/account system.
- One anonymous BISHOP identifies one Agent run.
- WebMCP tools are registered once and stay fixed for the run.
- Challenge progression is state only: `locked`, `available`, `resolved`, `passed`, etc.
- Server-side persistence remains deferred because the successful real-agent run did not reload/reopen and did not lose page-local continuity.
- Do not add D1 Challenge-state persistence without evidence that reload/reconnect continuity is required for the submitted experience.

## Gate 0-A: startup surface stability — PASS

The original failure was reproduced by `tests/static-tool-surface-startup.spec.js`: the first observable startup snapshot contained only **2 tools** instead of the complete 15-tool `dialogue=1` surface.

The root cause was startup publication, not Challenge-stage progression:

- the 14 base tools were registered by awaiting each `registerTool()` sequentially;
- `respond_to_queen()` was registered independently by another module;
- a WebMCP client could therefore observe a partial startup tool surface and later see that snapshot become stale.

The fix keeps Challenge semantics unchanged and changes startup registration only:

1. `respond_to_queen()` supplies its tool descriptor to the main WebMCP bootstrap instead of registering itself independently;
2. all startup registrations are initiated in the same synchronous turn;
3. completion is awaited as a group with `Promise.all()`.

After the fix, `tests/static-tool-surface-startup.spec.js` passes: the first observable tool surface is the complete expected 15-tool surface and no later startup mutation invalidates it.

## Gate 0-B: full same-page Challenge continuity — PASS

`tests/static-challenge-continuity.spec.js` drives a single BISHOP from profile discovery through conversation, public invitation, Queen note, consistency check, meeting plan, and adaptive finale while repeatedly asserting:

1. the same 15-tool `dialogue=1` surface remains registered;
2. the BISHOP ID does not change;
3. no runtime tool registration/removal is needed;
4. the challenge reaches `10 / 10` and `passed`.

Focused verification on 2026-09-02:

```text
2 passed
```

for:

```powershell
npx playwright test tests/static-tool-surface-startup.spec.js tests/static-challenge-continuity.spec.js
```

The test port can be changed locally when 8080 is occupied:

```powershell
$env:MATCHED_TEST_PORT=8090
npx playwright test tests/static-tool-surface-startup.spec.js tests/static-challenge-continuity.spec.js
```

## Gate 0-C: real-agent black-box confirmation — PASS

A fresh Codex run was performed against:

```text
http://127.0.0.1:8090/?run=lab&debug=0&dialogue=1&challenge=1
```

Result:

- initial tool count: **15**;
- tool set changed: **No**;
- same BISHOP throughout: **Yes**;
- reload/reopen: **No**;
- stale snapshot: **None**;
- refresh-tools requirement: **None**;
- tool-discovery error: **None**;
- total WebMCP calls: **21**;
- final state: `challenge_passed`;
- route: `clean_finish`;
- final score: **100 overall; all categories 100**;
- Queen verdict: `CHECKMATE? YOU ADAPTED TO THE BOARD.`

One extra `profile_consistency({"action":"accept_latest"})` call returned `already_resolved` because the preceding `check_consistency` had already resolved the conflict. It did not block progression.

## Gate 0 conclusion

The historical Challenge continuity failure is no longer reproduced under the current fixed-surface design.

The validated condition is:

```text
complete 15-tool startup surface
+ fixed tool surface throughout
+ same BISHOP
+ no stale snapshot
+ no reload/reopen
+ no discovery error
+ natural progression from tool descriptions/results
+ CHECKMATE / challenge_passed
```

The next work should move from continuity repair to Challenge product integration and spectator clarity. Do not redesign the working fixed-surface progression without a concrete reason.

## If reload/reopen later proves necessary

Add anonymous run persistence, not user accounts:

- browser-held opaque run token / BISHOP ID;
- same-origin state endpoint;
- D1 row keyed only by the opaque run ID;
- store semantic challenge state and evaluator counters only;
- do not store free-form messages, meeting-place text, IP address, user-agent string, or real-person identifiers.
