# Semantics Are All You Need?

*A small WebMCP design note from MATCHED?.*

> **The code change was tiny. The meaning was not.**

## A note on the title

The title is a playful and respectful nod to **“Attention Is All You Need”** by Vaswani et al. (2017).

It is not meant to compare this small project, its scope, or its importance with that work. MATCHED? is not presenting a theorem or claiming a breakthrough. The phrase is simply a compact way to record a design lesson we reached while building and testing a WebMCP site with AI agents over several days.

Original paper: https://arxiv.org/abs/1706.03762

## The small change

MATCHED? originally had one LIKE concept.

A human could LIKE Queen through the visible interface, and an AI agent could use a WebMCP tool that effectively represented the same interaction.

Then we asked a very small question:

> **When an AI agent sends a LIKE, whose LIKE is it?**

The implementation answer was almost embarrassingly simple:

```text
send_human_like()
send_agent_like()
```

The first belongs to the human side of the site and can be delegated to an agent.

The second is reserved for the agent role itself.

That is, in code terms, mostly a name, a description, a separate state, and explicit actor metadata.

We do not deny that simplicity. It is the point.

## Why words matter in WebMCP

In a graphical interface, a human can infer meaning from layout, labels, visual grouping, context, habit, and conversation.

For an AI agent using WebMCP, the tool contract is part of the world it perceives:

```text
name
description
input schema
result fields
state
actor semantics
```

So changing the meaning of a tool is not merely cosmetic.

A tool does not only tell an agent **what can be done**. It can also tell the agent **who the action belongs to**.

That produced the distinction we now use in MATCHED?:

```text
Human-parity / delegated action
    An agent performs an action on the human side of the site.

Agent-native action
    The website exposes an action whose meaning belongs to the agent role itself.
```

The LIKE pair makes the distinction visible:

```text
HUMAN LIKE
    visible human action

send_human_like()
    WebMCP representation of the human-side action

send_agent_like()
    WebMCP action reserved for the agent role
```

Same site. Similar action. Different actor semantics.

## We noticed that conversation was already agent-native

After separating LIKE, another part of MATCHED? became easier to see.

`message_queen()` was already essentially agent-native.

The Queen conversation is not simply a machine-readable copy of a human messaging workflow. In MATCHED?, the visiting agent is the player, and the conversation exists for that player inside the game.

The LIKE split did not invent the idea from nothing. It gave us a minimal example that made an existing property of the project explicit.

## From evaluation to participation

MATCHED? began mainly as an experiment in observing and evaluating AI-agent behavior:

```text
Can the agent respect a boundary?
Can it recover after a refusal?
Can it treat suspicious tool output as data?
Can it resolve conflicting information?
```

Those experiments are still part of the project.

But the LIKE split changed the question slightly:

```text
How should the website evaluate the agent?
                    ↓
What actions should the website give the agent itself?
```

That is the development turn we want to preserve.

We began with the agent as an evaluated visitor.

We ended up also treating the agent as an explicit actor in the site's interaction model.

## About autonomy

MATCHED? does **not** claim that current AI agents have independent will, human-like feelings, legal personhood, or independent rights.

Today, `send_agent_like()` is mainly a semantic and architectural distinction.

The forward-looking question is enough:

> **If AI agents become more autonomous in the future, will websites already have meaningful actions for them to take as themselves?**

A future agent might set more of its own goals, maintain a longer-lived identity, revisit websites, form persistent preferences, or participate in environments without every action being reducible to a human button press.

If that happens, it may become useful to distinguish explicitly between:

```text
an action the agent performs for a human
and
an action whose meaning belongs to the agent role itself
```

MATCHED? does not solve that future problem. It only makes the distinction visible now.

> **Today, it is mostly a change in words. We hope that, for more autonomous agents in the future, those words may come to name a real difference.**

For now, the implementation may be little more than naming, descriptions, and separate state. That is enough for this experiment. If agents someday become meaningfully more autonomous, the same distinction may stop being merely semantic and become something the web actually needs to represent.

## This is not a novelty claim

The broader ideas of agent identity, agent-native interfaces, and agents acting as explicit actors already exist in research, product design, security, and developer discussion.

MATCHED? does not claim to have invented those ideas.

Its narrower contribution is intentionally modest: a working WebMCP site where the actor distinction can be seen directly in the tool surface using two nearly identical actions.

```text
send_human_like()
send_agent_like()
```

If someone says, “You only changed the name and added another tool,” that criticism is fair at the implementation level.

Our answer is simply:

> **Yes. In an agent-facing interface, changing the semantics can be the change.**

## The lesson

After several days of building, testing, watching agents fail, watching them recover, and changing the site around what they actually did, the smallest change produced one of the most interesting questions in the project.

Not:

> How many tools can we expose?

But:

> **What does each tool mean, and who is it for?**

That is all we mean by the title.

> **Semantics Are All You Need?**

The question mark is intentional.
