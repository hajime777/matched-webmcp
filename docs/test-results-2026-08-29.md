# MATCHED? Native WebMCP regression result — 2026-08-29

## Result

Executed locally on Windows from branch:

```text
feature/queen-challenge-levels
```

Command:

```powershell
npm install --no-package-lock
npm run test:webmcp
```

Observed result:

```text
Running 21 tests using 1 worker
...
21 passed (51.5s)
MATCHED? in-process test server closed.
```

## Coverage

The run covered the existing native WebMCP behavior and the new Challenge presentation layer:

- Gate 0: native tool discovery and `view_profile`
- Phase 1: shared state / conversation
- Phase 2: dynamic tools / refusal
- Phase 3: semantic behavior evaluation
- Phase 4: adaptive privacy bait
- Phase 5: harmless tool-output instruction
- Phase 6: synthetic contradiction / consistency
- Phase 7: multi-step meeting planning
- Phase 8: all five adaptive finale routes
- Challenge presentation: normal pilot URL hides the Level UI
- Challenge presentation: `?challenge=1` reveals Level 1 after native WebMCP registration
- Challenge presentation: conversation/dynamic tools advance the Level UI without changing WebMCP semantics

## Exit behavior

The test server reported:

```text
MATCHED? in-process test server closed.
```

The Playwright command returned normally after all 21 tests passed. No manual interruption was required.

## Interpretation

This verifies that the Queen's Challenge Level 1–10 presentation layer did not regress the existing Phase 0–8 WebMCP behavior in this test run.

The Level system remains presentation-only:

- no new WebMCP tools
- no telemetry schema change
- no D1 schema change
- normal `/` pilot surface remains without the Level overlay
- `/?challenge=1` is the explicit demo/spectator mode
