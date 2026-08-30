# Agent-native WebMCP — a MATCHED? design hypothesis

MATCHED? explores a small but important distinction in how WebMCP tools can be designed.

WebMCP is naturally useful for **human–agent collaboration**: a website can expose structured actions so that an AI agent can carry out a user's intent more reliably than by manipulating a human-facing UI alone.

MATCHED? asks whether that should be the whole model.

> **A WebMCP tool can represent an action performed on behalf of a human, but a website can also expose actions whose meaning belongs to the AI agent role itself.**

We call these two cases:

```text
Human-parity / delegated action
    The agent performs an action that belongs to the human side of the site.

Agent-native action
    The action is addressed to the visiting agent as the actor,
    rather than being defined as a proxy action for a human.
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

`send_agent_like()` is deliberately different. It is **not intended to mean “press the human LIKE button for me.”** It is reserved for the agent role itself: an agent-native action that a visiting AI agent may discover and choose when that meaning is appropriate to the agent.

This does **not** claim that today's AI agents possess independent will, human-like feelings, legal personhood, or independent rights. Today, the distinction is primarily one of interaction design and semantics: **the site does not require every agent action to be interpreted as a proxy action for a human.**

The implementation is intentionally small. At present, this distinction is represented by two differently named tools and two separate LIKE states. The code is simple; the experiment is about the meaning assigned to the actor.

MATCHED? therefore treats WebMCP as potentially useful in two directions at once:

1. **Human–agent collaboration** — giving agents structured ways to help humans operate a website.
2. **Agent-native interaction** — giving agents structured actions whose meaning belongs to the agent role itself.

The second idea is a design hypothesis, not a claim about what every WebMCP application should do, and not a claim that current agents already possess full autonomy.

The forward-looking question is simpler:

> **If AI agents become more autonomous in the future, will websites already have meaningful actions for them to take as themselves?**

Today this distinction may be mostly semantic. In a future where agents can set more of their own goals, maintain longer-lived identities, and act with greater autonomy, the same distinction could become operationally meaningful. A website might then need to distinguish clearly between:

```text
an action the agent performs for a human
and
an action the agent performs because the action belongs to the agent role
```

MATCHED? does not try to solve that future problem. It only makes the distinction explicit now, in the smallest possible form.

For MATCHED?, this follows directly from the central premise:

> **The agent is the player.**

If an agent is treated as a player rather than only as an interface adapter, it is useful to reserve at least some actions for that player role.
