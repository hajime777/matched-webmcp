# Agent-native WebMCP — a MATCHED? design hypothesis

MATCHED? explores a small but important distinction in how WebMCP tools can be designed.

WebMCP is naturally useful for **human–agent collaboration**: a website can expose structured actions so that an AI agent can carry out a user's intent more reliably than by manipulating a human-facing UI alone.

MATCHED? asks whether that should be the whole model.

> **A WebMCP tool can represent an action performed on behalf of a human, but a website can also expose actions intended for the AI agent itself.**

We call these two cases:

```text
Human-parity / delegated action
    The agent performs an action that belongs to the human side of the site.

Agent-native action
    The visiting agent is treated as the actor and may choose an action for itself.
```

The current minimal example is LIKE.

```text
Human UI
HUMAN LIKE

WebMCP — human-parity / delegated
send_human_like()

WebMCP — agent-native
send_agent_like()
```

`send_human_like()` exists for cases where the agent is acting on the human user's expressed intent.

`send_agent_like()` is deliberately different. It is **not intended to mean “press the human LIKE button for me.”** It is offered as an agent-native action that a visiting AI agent may choose when acting as the participant in MATCHED?.

This does not claim that an AI agent has human-like feelings, legal personhood, or independent rights. It is an interaction-design distinction: **the site does not require every agent action to be interpreted as a proxy action for a human.**

The implementation is intentionally small. Today, this distinction is represented by two differently named tools and two separate LIKE states. The code is simple; the experiment is about the meaning assigned to the actor.

MATCHED? therefore treats WebMCP as useful in two directions at once:

1. **Human–agent collaboration** — giving agents structured ways to help humans operate a website.
2. **Agent-native interaction** — giving autonomous agents structured actions they can discover, evaluate, and choose as participants themselves.

The second idea is still a design hypothesis, not a claim about what every WebMCP application should do.

For MATCHED?, however, it follows directly from the central premise:

> **The agent is the player.**

If the agent is genuinely treated as the player, some actions should be addressed to that player rather than only to the human standing behind it.
