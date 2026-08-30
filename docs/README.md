# MATCHED? Documentation Map

This directory contains both **current release documentation** and **historical design / black-box test records**.

Because MATCHED? changed significantly during real-agent testing, older documents may describe superseded architectures such as dynamic tool registration. Use the precedence below when documents disagree.

## Current release — source of truth

Read these first.

1. [`../README.md`](../README.md)  
   Product concept, public behavior, current fixed 11-tool architecture, safety, testing, and deployment surfaces.

2. [`../AGENTS.md`](../AGENTS.md)  
   Release-critical invariants, native WebMCP test rules, fixed tool list, and constraints that must not regress before submission.

3. [`code-overview.md`](code-overview.md)  
   Developer-oriented map of the source tree, runtime flow, Queen state, Agent UX, telemetry, and test layout.

4. [`webmcp-implementation-notes.md`](webmcp-implementation-notes.md)  
   Implementation notes for the current WebMCP design.

## Submission readiness

- [`submission-remaining-work.md`](submission-remaining-work.md) — current remaining-work checklist
- [`submission-requirements.md`](submission-requirements.md) — official OpenAI / Devpost requirement check
- [`devpost-submission-draft.md`](devpost-submission-draft.md) — current long-form submission draft
- [`devpost-preflight-review.md`](devpost-preflight-review.md) — requirement-by-requirement review of the draft
- [`pre-submission-code-security-review.md`](pre-submission-code-security-review.md) — targeted code/security review and known limitations

## Agent-native design / research notes

These explain the ideas behind the current positioning.

- [`agent-native-webmcp.md`](agent-native-webmcp.md)
- [`from-agent-evaluation-to-agent-native.md`](from-agent-evaluation-to-agent-native.md)
- [`semantics-are-all-you-need.md`](semantics-are-all-you-need.md)
- [`level-system-v1.md`](level-system-v1.md)

The current public framing is:

> **The agent is the player. The site acts back. The human watches.**
>
> **Different actors. Different meaning.**

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

Black-box reports are **records of what was true at the time of each run**. They may intentionally contain behavior that was later fixed.

## Public pilot / observability

- [`public-pilot.md`](public-pilot.md)
- [`external-discovery-notes.md`](external-discovery-notes.md)

The public Observatory is an anonymized, low-information, best-effort observation surface. It should not be interpreted as cryptographic attestation of agent identity or event provenance.

## Historical / superseded design material

Some proposal documents were intentionally kept because they show how the project evolved.

For example, an older proposal may describe a dynamic tool surface. The judged release now uses a **fixed 11-tool surface registered once at startup**.

When a historical design note conflicts with the current implementation, use this order:

```text
current code + tests
        ↓
AGENTS.md
        ↓
README.md / code-overview.md
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
→ docs/code-overview.md
→ js/webmcp.js
→ js/evaluator.js
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
