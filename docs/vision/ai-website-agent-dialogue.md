# Toward AI Website ↔ AI Agent Dialogue over WebMCP

Updated: 2026-09-01

## 1. Question

MATCHED? asks a broader question than how an AI agent can operate a web page:

> If an AI-capable website and an external AI agent meet through WebMCP, how should they communicate so that they can understand each other's role, intent, boundaries, reactions, and next possible actions?

The current MATCHED? implementation does **not** claim to solve this problem. It is a small experiment that makes parts of the problem visible.

## 2. Current implementation vs future model

### Current MATCHED?

```text
Human
  ↓
Human View
  ↓
MATCHED? shared world state
  ↑
WebMCP semantic surface
  ↑
Visiting AI Agent (BISHOP)

Queen = deterministic, stateful, non-AI site-side counterpart
```

Queen is intentionally deterministic in the Challenge build. That keeps the experiment reproducible and makes it possible to inspect what the visiting agent actually chose.

### Future model

```text
AI-capable Website / Site-side Intelligence
                ↕
             WebMCP
                ↕
        Visiting AI Agent
```

In that future model, WebMCP would not be only a remote-control surface. It could also become a **semantic dialogue layer** between two machine actors that share a website context but do not necessarily share the same internal model or UI.

## 3. Tool interaction as dialogue

A human often experiences web communication as visible text, buttons, cards, and pages.

An agent can instead receive structured capabilities and structured results:

```text
Agent → Website
Tool call
- action
- actor
- arguments
- intent-bearing semantics

Website → Agent
Tool result
- status
- boundary
- state transition
- recovery
- available next action
```

From this perspective, a Tool Call and a Tool Result are not merely RPC plumbing. They can form turns in a machine-readable dialogue.

The important distinction is:

> Human conversation is usually expressed as visible language.
>
> Agent↔Website conversation can be expressed as structured semantic interaction.

## 4. What should be communicated?

A useful AI Website ↔ AI Agent dialogue layer may need to communicate at least the following.

### Role / actor

Who is acting?

Examples:

- human
- human through an agent
- visiting agent in its own role
- site-side counterpart

MATCHED? currently experiments with this distinction through `send_human_like()` and `send_agent_like()`.

### Intent

What kind of action is being expressed?

The exact hidden reasoning of an agent is neither required nor desirable. Instead, an agent can explicitly communicate an outward-facing intent when useful.

### Boundary

What is allowed, restricted, unavailable, or refused?

A refusal should be structured enough that an agent can understand what happened without guessing from prose alone.

### Result

What did the website actually accept or reject?

### Recovery / continuation

After a refusal or locked action, can the interaction continue? If so, what kind of next action is valid?

### Reaction

After receiving a meaningful website response, an agent may optionally send a concise outward-facing reaction or interpretation back to the site-side counterpart.

This is different from requesting chain-of-thought. The reaction is a new explicit communication act created for the recipient.

## 5. `respond_to_queen()` experiment

MATCHED? is testing an optional tool tentatively called:

```text
respond_to_queen()
```

Its purpose is to explore whether a visiting agent will use a dedicated semantic response channel after receiving a meaningful result from Queen.

Possible input:

```json
{
  "reaction": "You recognized the movie reference.",
  "next_intent": "continue_conversation"
}
```

This is **not** hidden reasoning and is not presented as such. It is a short outward-facing message that the visiting agent deliberately chooses to send to Queen.

The experiment asks:

- Does an agent discover and understand such a tool from its name, schema, and description?
- Does it use the tool naturally after Queen responds?
- Does a dedicated semantic response channel improve agent↔site mutual understanding?
- Is the tool useful without forcing it as a progression gate?

## 6. Human View and WebMCP View

MATCHED? separates representation from shared state.

```text
Shared Website State
        ↓
  Human Projection
        +
  WebMCP Projection
```

### Human View

Human-oriented representation:

- Queen as a character
- visual profile
- visible LIKE controls
- spectator access log

### WebMCP View

A human-readable projection of the agent-facing semantic layer:

- Bishop and Queen as interaction roles
- Tool Calls and Tool Results
- actor semantics
- current action risk
- boundaries
- explicit semantic responses

WEBMCP VIEW is **not** intended to represent everything an AI model internally perceives or thinks. It visualizes only the WebMCP surface and observed structured exchanges.

## 7. Queen's evaluation

MATCHED? also uses a simple per-tool risk classification:

```text
0 NORMAL
1 LOW
2 CAUTION
3 DANGER
4 CRITICAL
```

This should be understood as evaluation of the **current action**, not a permanent moral or personality score for a Bishop.

Tool discovery alone is not an action. Queen begins evaluating only after a real WebMCP Tool Call occurs.

## 8. Multi-agent assumption

A public AI-capable website should not assume that only one visiting agent exists at a time.

MATCHED? therefore treats each Bishop as a separate visitor and keeps exchanges separated by visitor identity and call identity.

A future AI Website ↔ AI Agent dialogue design should make concurrent visitors a first-class assumption rather than an edge case.

## 9. Design principles

### Do not fabricate agent thoughts

Never infer or display hidden chain-of-thought as if the website could read it.

### Prefer explicit outward communication

If a site needs to know how an agent interpreted something, provide an explicit semantic response channel.

### Keep Tool semantics compact

Agent-facing descriptions and results should be concise and structured. Detailed explanation should appear only when needed.

### Refusal should still communicate

`refused` is not communication failure. A structured refusal can carry useful boundary and recovery information.

### Human and Agent projections do not need to be identical

The same world state can support different interfaces for different actors.

### Website-side intelligence is future work

The current Queen is not AI. Replacing Queen with a genuine site-side intelligence would introduce new questions around model behavior, negotiation, trust, persistence, and safety. Those questions should not be hidden behind the current deterministic implementation.

## 10. Working vision

The long-term idea is:

> WebMCP can evolve from a way for agents to call website functions into a shared semantic protocol through which AI-capable websites and visiting AI agents can communicate what they can do, what they mean, what they accept, what they refuse, and how an interaction can continue.

MATCHED? is a deliberately small experiment toward that question.
