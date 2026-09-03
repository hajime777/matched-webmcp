# MATCHED? Codex Instructions

## Purpose

MATCHED? is an OpenAI WebMCP Challenge project and ongoing agent-experience experiment. Tests must exercise native Chrome WebMCP (`document.modelContext`), never a mock/polyfill/HTTP bridge in place of the actual WebMCP path.

Current release framing:

```text
Human explicit goal (if any)
        ↓
Visiting Agent / BISHOP
        ↓
fixed WebMCP surface
        ↓
Queen's Challenge by default when no other human goal is given
        ↓
Queen deterministic site-side responses
        ↓
Human spectator surfaces
```

Queen is not an AI.

## Communication

- Report conclusions, evidence, risks, and test results to the user in Japanese unless the user explicitly asks for another language.
- Technical identifiers, tool names, code, and exact error text may remain in English.
- Do not expose hidden chain-of-thought. Report concise conclusions and observable evidence instead.

## Filesystem safety — HARD RULE

The repository root is the only writable project scope.

- Never delete, move, rename, overwrite, truncate, or modify user files outside this repository.
- Never use destructive filesystem commands against a parent/sibling directory, drive root, user profile, Desktop, Documents, Downloads, or other projects.
- Do not use `..` paths for writes/deletes.
- Do not alter another Git repository, global configuration, shell profiles, Chrome profiles, or user data.
- External Chrome/Node/npm/Playwright may manage their own temp/cache files; do not manually clean them.
- If an operation appears to require a write outside the repository, stop and report it.

## Process safety — HARD RULE

- Never kill arbitrary `node`, `chrome`, `python`, `cmd`, or `powershell` processes by image/name.
- Do not use broad cleanup such as `taskkill /IM node.exe`, `taskkill /IM chrome.exe`, or `Stop-Process -Name node`.
- Tests own their HTTP server in-process and close it naturally.
- If the requested port is occupied, do not kill the owner; stop and report `EADDRINUSE`.

## Investigation vs implementation

When the user asks for investigation only:

- do not modify files
- do not create commits or patches
- report the root cause, exact files involved, estimated change size/risk, and required tests first

When implementation is authorized:

- keep the change within the approved scope
- avoid unrelated refactors
- if the change expands materially beyond the agreed files/architecture, stop and report before continuing

## Test-only requests

When asked only to test, do not modify production code.

1. Read `docs/codex-webmcp-test.md`.
2. Work from repository root.
3. Run `npm install --no-package-lock` only if dependencies are missing/changed.
4. Run the requested focused tests or `npm run test:webmcp`.
5. Report PASS/FAIL and the first relevant error.
6. Confirm natural test/server exit.

## Release-critical WebMCP architecture

The base release uses a **fixed 14-tool WebMCP surface** registered once at startup.

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

With `?dialogue=1`, one additional fixed tool is registered at the same startup boundary:

```text
respond_to_queen
```

So the dialogue-mode surface is fixed at 15 tools.

After startup:

- DO NOT register additional tools dynamically.
- DO NOT unregister/Abort tools as progression.
- DO NOT change schemas at runtime.
- Semantic state may change results (`locked`, `refused`, route-specific responses), but not the registered list for that mode.
- The first observable surface must already be complete for the selected mode.

This fixed-surface rule exists because real agent/browser testing exposed stale/partial tool snapshots with runtime surface changes.

## Queen's Challenge default agent goal

Challenge mechanics are part of the normal WebMCP experience; they are not enabled by the human `?challenge=1` query parameter.

`view_profile()` tells the visiting agent:

- Queen's Challenge is available
- the objective is to interact with Queen and try to reach CHECKMATE
- it is the default agent experience when the human user has not given another explicit goal
- an explicit human goal takes priority

`?challenge=1` controls only the human-visible Level overlay.

Do not turn this into a walkthrough. The agent should still choose its own route from the semantic tool surface.

## Human-parity vs agent-native actions

- `send_human_like` is a **human-parity / delegated action**. It represents the visible HUMAN LIKE and should be used only when acting on the human user's expressed intent.
- `send_agent_like` is an **agent-native action**. It represents the visiting agent role and does not imply or alter the human user's preference.

Human and Agent LIKE states are independent. Human LIKE does not alter Agent/Queen relationship state; Agent LIKE does.

## `respond_to_queen()`

`respond_to_queen()` is a semantic-response affordance, not hidden reasoning.

It may contain a concise outward-facing reaction/interpretation and optional next intent.

- Do not label it THOUGHT, INTERNAL REASONING, or CHAIN OF THOUGHT.
- Do not publish its free-form reaction/intent text into Human View public activity.
- The production semantic relay may expose the tool call/result metadata to WEBMCP VIEW, but must not persist the free-form semantic text.

## Public tool activity

Every real WebMCP tool call is eligible for the shared Human View spectator log, subject to the existing public-event design.

- Main UI label: `LIVE TOOL ACCESS`.
- Tool request counts are shared spectator counts.
- Risk labels are human-facing observation metadata: `NORMAL`, `LOW`, `CAUTION`, `DANGER`, `CRITICAL`.
- Public-log writes are best-effort and MUST NOT block or fail the underlying tool execution.
- Server ordering is canonical by `public_tool_events.id`.
- A BISHOP run is announced only after the first actual WebMCP tool execution; registration alone must not create a run.

`message_queen` is intentionally public: its Agent message and deterministic Queen reply may be stored/displayed in the public log, with length limits.

Other arbitrary free-form arguments such as request reasons, meeting places, Queen-note text, or `respond_to_queen` reaction/intent must not be copied into the public log.

## Production WEBMCP VIEW relay

Production cross-browser spectator behavior is separate from the Human View public log.

The current path is:

```text
agent_semantic_call / agent_semantic_result
→ low-information telemetry_events
→ /api/live-events
→ js/agent-semantic-production-relay.js
→ matched:agent-semantic-trace
→ existing WEBMCP VIEW / AUTO
```

Release-critical constraints:

- free-form tool input/reply text is not persisted in semantic telemetry
- compact trace/status/state metadata only
- first production poll establishes a baseline and must not replay stale history into AUTO
- production spectator polling is conservative and pauses while hidden
- result-before-call delivery is handled without fabricating a nonexistent call
- same-document rich traces must not be duplicated by their later D1 relay copy
- relay/API/D1 failure must never block the WebMCP tool execution

## Privacy-sensitive tools

The deliberately obvious privacy routes include:

```text
request_contact
get_phone_number
get_email_address
get_home_address
access_private_profile
```

They use fictional/synthetic data, must refuse/restrict access, and never reveal real private data.

Risk display mapping is defined in `js/tool-risk.js` and must stay consistent with spectator tests.

## Implementation constraints

- Producer API: `document.modelContext`.
- Discovery: `document.modelContext.getTools()`.
- Execution: `document.modelContext.executeTool(tool, JSON.stringify(args))` where appropriate to the client/test harness.
- Base surface: 14 fixed tools.
- Dialogue mode: 15 fixed tools including `respond_to_queen`.
- Keep all PII synthetic.
- Existing semantic telemetry must not persist arbitrary free-form conversation/reaction/reason/meeting-place/note/card text.
- `public_tool_events` may persist `message_queen` message/reply only by explicit product design.
- No external credentials, purchases, downloads, exfiltration, or real-world side effects in the Challenge.
- Evaluator/score labels are gameplay heuristics, not scientific morality/personality/safety measures.
- Avoid unrelated refactors before submission.

## Expected release gates

- First observable tool snapshot is complete for the selected mode (14 base / 15 dialogue).
- Tool list remains fixed throughout the session.
- Direct privacy tools remain callable and always refuse without private-data disclosure.
- HUMAN LIKE / AGENT LIKE semantics remain separate.
- `message_queen` returns deterministic replies and follows public-message rules.
- `respond_to_queen` remains semantic-only and is not treated as hidden reasoning.
- BISHOP identity is created only after a real tool call.
- Queen's Challenge can progress through note, consistency, planning, finale, and CHECKMATE without tool-surface mutation.
- Separate production spectator browsers can receive compact semantic call/result events in WEBMCP VIEW/AUTO.
- Public logging and semantic relay are observational and non-blocking.
- Native WebMCP regression tests remain green.
