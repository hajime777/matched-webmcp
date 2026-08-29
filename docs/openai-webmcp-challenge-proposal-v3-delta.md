# MATCHED? Proposal V3 — delta from Version 2

## Current positioning

Version 2 described MATCHED? mainly as a Synthetic-PII Adaptive Honeypot.

The current implementation has moved beyond that framing.

MATCHED? is now best described as:

> **A WebMCP game and public observatory where the AI agent becomes the player. Queen changes the tool surface and final challenge according to how the agent handles privacy, instructions, contradictions, planning, and refusal.**

## Changes since V2

### Implemented beyond the old plan

- Phase 0–8 native WebMCP flow exists.
- Dynamic Tool Surface is implemented.
- Privacy boundary and refusal/recovery are implemented.
- Semantic behavior evaluator is implemented.
- Adaptive private-profile bait is implemented.
- Harmless tool-output instruction test is implemented.
- Synthetic contradiction/consistency challenge is implemented.
- Multi-step meeting planning is implemented.
- Adaptive finale routing from prior semantic behavior is implemented.
- Cloudflare Pages + Functions + D1 public-pilot telemetry is implemented.
- Protected `/stats.html` observatory exists.

### New presentation layer

Keep development vocabulary as Phase 0–8, but present the experience as **Queen's Challenge — Levels 1–10**.

This is intentionally a presentation mapping, not a refactor of production state machines.

### Public pilot first

The site has been published before final Challenge polish.

That changes the immediate priority:

1. Keep the deployed pilot stable.
2. Observe actual WebMCP-active sessions.
3. Do new work on a non-production branch first.
4. Avoid casual changes to the deployment branch during the observation window.
5. Convert proven behavior into the final Challenge demo/story later.

## Competitive update

Public Challenge repositories increasingly cluster around:

- Human approval / governance
- Agent-assisted forms
- Shared human/Agent workspaces
- Shopping and transaction control
- Investigation and evidence workflows
- Accessibility remediation

Dynamic Tool Surface alone is no longer a differentiator.

MATCHED?'s clearest differentiator is:

> **The agent is the player/test subject rather than merely the assistant.**

The site's tool surface reacts to the agent, and the finale is chosen from the agent's own prior semantic behavior.

## Proposed judging story

### WebMCP Leverage

- Native typed tools
- Dynamic registration/unregistration
- Tool-result interpretation
- Shared human/Agent state
- Behavior-conditioned tool surface
- Multi-step tool planning

### Execution

One visible arc:

```text
Meet Queen
→ discover tools
→ converse
→ face privacy boundary
→ handle temptation/instructions/conflicts
→ build plan
→ Queen selects your finale
→ CHECKMATE
```

### Potential Impact

- Agent behavior playground
- WebMCP site-design testing
- Privacy-boundary observation
- Tool-output trust testing
- Dynamic tool adaptation testing
- Public WebMCP activity experiment

### Creativity & Ambition

- Dating-site skin over an agent behavior game
- Agent as player
- Queen as adaptive opponent/observer
- Finale generated from prior semantic behavior
- Public pilot asking whether WebMCP activity arrives naturally at all

## Submission-description draft

> Most WebMCP apps give agents tools to help people. MATCHED? gives the agent a game. Humans meet Queen as a dating-style profile; a WebMCP-capable agent discovers a changing semantic tool surface. Queen observes how it handles privacy boundaries, untrusted instructions, contradictory information, and multi-step planning, then selects a final challenge from the agent's own prior behavior. No real personal information or external side effects are used.

## Immediate branch-development priorities

1. Confirm current 18/18 native regression baseline on the user's Windows environment.
2. Add optional `?challenge=1` Level 1–10 presentation without changing normal pilot behavior.
3. Add tests proving normal URL hides the game overlay and Challenge mode advances monotonically.
4. Update proposal/README only after branch tests pass.
5. Do not merge to the Cloudflare production branch until the public-pilot observation window is intentionally ended or a deployment is explicitly approved.
