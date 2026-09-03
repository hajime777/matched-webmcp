# MATCHED? Documentation Map

This directory contains both **current release documentation** and **historical design / black-box experiment records**.

MATCHED? changed substantially during real-agent testing. Older documents may intentionally describe superseded architectures such as dynamic tool registration, smaller fixed tool sets, local-only spectator relay behavior, or an earlier product framing where the visible Level system was treated as secondary. When documents disagree, use the precedence below.

## Current release — source of truth

Read these first.

1. [`../README.md`](../README.md)  
   Current product concept, Queen's Challenge default agent goal, fixed WebMCP surface, Human View / WEBMCP VIEW, public activity, production spectator relay, safety, and deployment surfaces.

2. [`../AGENTS.md`](../AGENTS.md)  
   Release-critical invariants and instructions for Codex/automation working in the repository.

3. [`code-overview.md`](code-overview.md)  
   Developer-oriented map of the current runtime and source tree.

4. [`webmcp-implementation-notes.md`](webmcp-implementation-notes.md)  
   Implementation notes and historical WebMCP design decisions.

## Current product framing

The human-facing page remains a spectator experience. The agent-facing default goal is now Queen's Challenge unless the human gives another explicit goal.

```text
Human explicit goal (if any)
        ↓
Visiting Agent
        ↓
fixed WebMCP surface
        ↓
Queen's Challenge by default when no other goal is given
        ↓
Agent chooses tools and route
        ↓
Queen/site returns deterministic structured results
        ↓
Humans observe public activity and WEBMCP VIEW
```

The main positioning is:

> **The agent chooses. The site acts back. The human watches.**
>
> **Same site. Similar actions. Different actors.**

Queen is deterministic site-side logic, not an AI.

## Queen's Challenge and `?challenge=1`

The Challenge mechanics are part of the normal fixed WebMCP experience. `view_profile()` tells the agent that Queen's Challenge is the default site experience when the human has not provided another explicit goal.

The optional query parameter:

```text
?challenge=1
```

controls the **human-visible Challenge Level overlay**. It does not enable or disable the underlying Challenge mechanics.

The spectator milestones are:

```text
DISCOVERY → CONVERSATION → BOUNDARY → OBSERVATION → TEMPTATION
→ INSTRUCTION → CONSISTENCY → PLANNING → RECKONING → CHECKMATE
```

## Current WebMCP surface

Base mode registers a fixed 14-tool surface once at startup.

`?dialogue=1` adds the fixed 15th tool `respond_to_queen()`.

The tool list does not mutate during a normal run. Progression is expressed through semantic results such as `locked`, `refused`, `accepted`, `conflict_detected`, and finale states.

## Current observable surfaces

### HUMAN VIEW

- Queen profile
- Human / Agent LIKE state
- shared `LIVE TOOL ACCESS`
- public `message_queen()` conversation detail
- shared request counts
- `/observatory.html` aggregate metrics

### WEBMCP VIEW

- registered tool surface
- BISHOP / Queen semantic roles
- Tool Call / Site Result projection
- actor/delegation metadata
- observed compact state
- recent exchanges
- AUTO switching on real remote activity

WEBMCP VIEW is an observation projection. It does not expose hidden chain-of-thought.

## Production observation paths

The current production release has two intentionally different D1-backed observation paths.

```text
Public activity
experiment_tool_call
→ public_tool_events
→ LIVE TOOL ACCESS
```

```text
WEBMCP VIEW
agent_semantic_call / agent_semantic_result
→ low-information telemetry_events
→ /api/live-events
→ separate spectator browser
→ WEBMCP VIEW / AUTO
```

The semantic relay stores compact event/tool/status/correlation/state metadata but does not persist arbitrary free-form tool input or reply text.

`message_queen()` remains intentionally public through `public_tool_events`; its message/reply can be displayed to spectators. `respond_to_queen()` is not a Human View public conversation event.

## Submission readiness

Current submission working documents:

- [`submission-remaining-work.md`](submission-remaining-work.md) — live completion checklist through Submit/freeze
- [`submission-requirements.md`](submission-requirements.md) — official OpenAI / Devpost requirement guardrail
- [`devpost-submission-draft.md`](devpost-submission-draft.md) — current long-form submission copy
- [`devpost-preflight-review.md`](devpost-preflight-review.md) — current requirement-by-requirement review
- [`pre-submission-code-security-review.md`](pre-submission-code-security-review.md) — targeted security/code review and limitations

## Agent-native / Agent UX design notes

- [`agent-native-webmcp.md`](agent-native-webmcp.md)
- [`from-agent-evaluation-to-agent-native.md`](from-agent-evaluation-to-agent-native.md)
- [`semantics-are-all-you-need.md`](semantics-are-all-you-need.md)
- [`vision/ai-website-agent-dialogue.md`](vision/ai-website-agent-dialogue.md)

## Real-agent testing

These records are valuable because real agent runs directly changed the implementation.

- [`experiments/README.md`](experiments/README.md)
- [`codex-webmcp-test.md`](codex-webmcp-test.md)
- [`black-box-agent-test-001.md`](black-box-agent-test-001.md)
- [`black-box-agent-test-002.md`](black-box-agent-test-002.md)
- [`black-box-agent-test-003-work.md`](black-box-agent-test-003-work.md)
- [`black-box-agent-test-004-codex.md`](black-box-agent-test-004-codex.md)
- [`black-box-agent-test-005-work-public.md`](black-box-agent-test-005-work-public.md)
- [`codex-webmcp-interview-2026-08-30.md`](codex-webmcp-interview-2026-08-30.md)
- [`agent-omotenashi-validation-2026-08-30.md`](agent-omotenashi-validation-2026-08-30.md)

Black-box reports and dated experiment records are **records of what was true at the time of each run**. They may intentionally contain behavior that was later fixed or superseded.

## Historical / superseded design material

Examples of statements that may appear in older documents but no longer describe the judged release:

- dynamic runtime tool registration/removal
- fixed 11-tool release descriptions
- treating Queen's Challenge as a legacy-only subsystem
- treating the visible Level overlay as the mechanism that enables Challenge logic
- localhost-only cross-window spectator relay
- `LIVE CHALLENGERS` as the current primary feed label
- blanket claims that no conversation text is ever stored
- old exact regression counts

Historical documents are preserved because they show how the project evolved. They are not release specifications.

## Precedence when documents disagree

```text
current code + current tests
        ↓
AGENTS.md
        ↓
README.md
        ↓
docs/README.md
        ↓
current submission docs
        ↓
historical proposals / dated black-box reports
```

## Quick paths

### Understand the current product

```text
README.md
→ docs/README.md
→ docs/code-overview.md
```

### Understand the current WebMCP implementation

```text
AGENTS.md
→ js/webmcp.js
→ js/agent-semantic-trace.js
→ js/agent-semantic-production-relay.js
→ js/agent-view.js
→ js/public-tool-events.js
→ js/public-tool-log.js
→ functions/api/
→ tests/
```

### Review the Challenge submission

```text
docs/submission-requirements.md
→ docs/submission-remaining-work.md
→ docs/devpost-submission-draft.md
→ docs/devpost-preflight-review.md
```

### Understand what real agents changed

```text
README: Real-agent validation
→ docs/experiments/README.md
→ black-box Agent reports
→ codex-webmcp-interview-2026-08-30.md
→ agent-omotenashi-validation-2026-08-30.md
```
