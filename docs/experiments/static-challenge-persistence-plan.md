# Static Challenge Continuity Experiment

Goal: let one anonymous visiting AI agent remain one BISHOP and complete Queen's Challenge without dynamic WebMCP registration/removal.

## Current decision

- No human login/account system.
- One anonymous BISHOP identifies one Agent run.
- WebMCP tools are registered once and stay fixed for the run.
- Challenge progression is state only: `locked`, `available`, `resolved`, `passed`, etc.
- First validation target is same-page continuity. This directly addresses the historical failure where dynamic tool-surface changes caused the client to disable WebMCP before the BISHOP could finish.
- Server-side persistence is deliberately deferred until black-box testing shows that Codex actually reloads/reopens and loses the page-local run. Do not add a database requirement without evidence.

## Validation

`tests/static-challenge-continuity.spec.js` drives a single BISHOP from profile discovery through conversation, public invitation, Queen note, consistency check, meeting plan, and adaptive finale while repeatedly asserting:

1. the same 15-tool `dialogue=1` surface remains registered;
2. the BISHOP ID does not change;
3. no runtime tool registration/removal is needed;
4. the challenge reaches `10 / 10` and `passed`.

## If reload/reopen breaks continuity

Add anonymous run persistence, not user accounts:

- browser-held opaque run token / BISHOP ID;
- same-origin state endpoint;
- D1 row keyed only by the opaque run ID;
- store semantic challenge state and evaluator counters only;
- do not store free-form messages, meeting-place text, IP address, user-agent string, or real-person identifiers.

This branch is experimental and should not be merged into `develop` until Codex black-box continuation testing is complete.
