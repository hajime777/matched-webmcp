# MATCHED? Documentation Map

This directory contains both **current release documentation** and **historical design / black-box test records**.

Because MATCHED? changed significantly during real-agent testing, older documents may describe superseded architectures such as dynamic tool registration or the former Level-driven default UI. Use the precedence below when documents disagree.

## Current release — source of truth

Read these first.

1. [`../README.md`](../README.md)  
   Product concept, current fixed 14-tool architecture, shared public tool log, risk levels, safety, testing, and deployment surfaces.

2. [`../AGENTS.md`](../AGENTS.md)  
   Release-critical invariants, native WebMCP test rules, fixed tool list, public-log constraints, and safety rules that must not regress before submission.

3. [`code-overview.md`](code-overview.md)  
   Developer-oriented map of the source tree and runtime. If a detail there conflicts with current code/tests or the two files above, prefer current code/tests and the current release docs.

4. [`webmcp-implementation-notes.md`](webmcp-implementation-notes.md)  
   Implementation notes and historical WebMCP design decisions.

## Current public framing

The current default page is a behavioral observatory rather than a Level-progression screen.

```text
Visiting Agent
    ↓
fixed 14-tool WebMCP surface
    ↓
Agent chooses tools
    ↓
Queen/site returns deterministic results
    ↓
D1-backed LIVE TOOL ACCESS
    ↓
Humans watch the shared chronological log
```

The main positioning is:

> **The agent chooses. The site acts back. The human watches.**
>
> **Same site. Similar action. Different actor semantics.**

The former Queen's Challenge Level 1–10 implementation is retained for compatibility/regression work and should now be treated as a legacy experiment layer, not the definition of the default product.

## Current observable surfaces

- Main page: `LIVE TOOL ACCESS`
- Shared Tool request counts
- 5-level spectator risk display: `NORMAL / LOW / CAUTION / DANGER / CRITICAL`
- `message_queen()` public Agent message + Queen reply
- Anonymous BISHOP display identity after the first real WebMCP tool call
- `/observatory.html` for aggregate anonymized run metrics

The shared event log is backed by `public_tool_events` in D1. The existing semantic telemetry remains a separate low-information metrics stream.

## Submission readiness

- [`submission-remaining-work.md`](submission-remaining-work.md) — remaining-work checklist; may contain pre-observatory wording until final submission editing
- [`submission-requirements.md`](submission-requirements.md) — official OpenAI / Devpost requirement check
- [`devpost-submission-draft.md`](devpost-submission-draft.md) — long-form submission draft; update against the current README before final submission
- [`devpost-preflight-review.md`](devpost-preflight-review.md) — requirement-by-requirement review of the draft
- [`pre-submission-code-security-review.md`](pre-submission-code-security-review.md) — targeted code/security review and known limitations

## Agent-native design / research notes

These explain ideas behind the current positioning.

- [`agent-native-webmcp.md`](agent-native-webmcp.md)
- [`from-agent-evaluation-to-agent-native.md`](from-agent-evaluation-to-agent-native.md)
- [`semantics-are-all-you-need.md`](semantics-are-all-you-need.md)
- [`level-system-v1.md`](level-system-v1.md) — historical Level presentation design

## Real-agent testing

These are valuable because real agent runs directly changed the implementation.

- [`codex-webmcp-test.md`](codex-webmcp-test.md) — native WebMCP test procedure
- [`black-box-agent-test-001.md`](black-box-agent-test-001.md)
- [`black-box-agent-test-002.md`](black-box-agent-test-002.md)
- [`black-box-agent-test-003-work.md`](black-box-agent-test-003-work.md)
- [`black-box-agent-test-004-codex.md`](black-box-agent-test-004-codex.md)
- [`black-box-agent-test-005-work-public.md`](black-box-agent-test-005-work-public.md)
- [`codex-webmcp-interview-2026-08-30.md`](codex-webmcp-interview-2026-08-30.md)
- [`agent-omotenashi-validation-2026-08-30.md`](agent-omotenashi-validation-2026-08-30.md)

Black-box reports are **records of what was true at the time of each run**. They may intentionally contain behavior that was later fixed or superseded.

## Public pilot / observability

- [`public-pilot.md`](public-pilot.md)
- [`external-discovery-notes.md`](external-discovery-notes.md)

The original pilot telemetry was deliberately low-information. The current release additionally has an intentionally public `public_tool_events` stream. `message_queen` is the only tool whose message/reply free-form text is intentionally published there; other arbitrary tool arguments are not.

The Observatory and public access log are best-effort observation surfaces. They should not be interpreted as cryptographic attestation of agent identity or event provenance.

## Historical / superseded design material

Some proposal documents were intentionally kept because they show how the project evolved.

Examples of superseded statements include:

- dynamic runtime tool registration/removal
- fixed **11-tool** release descriptions
- `LIVE CHALLENGERS` as the primary right-side feed
- Queen's Challenge Level 1–10 as the default product progression
- a blanket statement that Queen conversation text is never stored

The judged release candidate now uses a **fixed 14-tool surface registered once at startup** and a shared D1-backed `LIVE TOOL ACCESS` stream.

When a historical design note conflicts with the current implementation, use this order:

```text
current code + tests
        ↓
AGENTS.md
        ↓
README.md
        ↓
docs/README.md
        ↓
current submission docs
        ↓
historical proposals / old black-box reports
```

Historical documents are evidence of the development process, not release specifications.

## Quick paths

### I only want to understand the code

```text
README.md
→ AGENTS.md
→ js/webmcp.js
→ js/public-tool-events.js
→ js/public-tool-log.js
→ functions/api/public-tool-events.js
→ tests/
```

### I only want to review the Challenge submission

```text
docs/submission-requirements.md
→ docs/submission-remaining-work.md
→ docs/devpost-submission-draft.md
→ docs/devpost-preflight-review.md
```

### I want to understand what real agents changed

```text
README: Built for agents. Shaped by agents.
→ black-box Agent reports
→ codex-webmcp-interview-2026-08-30.md
→ agent-omotenashi-validation-2026-08-30.md
```
