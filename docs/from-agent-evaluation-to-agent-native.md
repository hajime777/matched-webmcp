# From agent evaluation to agent-native interaction

This note records a design turning point in MATCHED?.

The project did not begin with a theory about autonomous AI agents having their own WebMCP actions. It began as a WebMCP game for **observing and evaluating how visiting AI agents behave**.

That work produced the Queen challenge, privacy boundaries, recovery paths, suspicious tool output, consistency checks, planning, adaptive finales, LIVE CHALLENGERS, and Queen's Observatory.

Then a much smaller question changed how we looked at the project.

> **When an AI agent sends a LIKE, whose LIKE is it?**

## Before the split

Originally, LIKE was one shared interaction. A human could press the LIKE button, and an AI agent could call a WebMCP LIKE tool. Both paths effectively pointed at the same idea.

That is a natural WebMCP design if the agent is treated primarily as a proxy for the human:

```text
Human wants to LIKE Queen
        ↓
Agent invokes WebMCP
        ↓
Human-side LIKE is performed
```

This model remains useful, and MATCHED? keeps it explicitly as:

```text
send_human_like()
```

## The question that changed the meaning

MATCHED? already had interactions that existed only for the visiting agent. `message_queen()` was not simply a machine-readable copy of a human messaging UI; the conversation itself was part of the agent's game.

LIKE made the actor question impossible to ignore.

If the agent is the player, should every action still be interpreted as something the agent is doing **for the human**?

We split LIKE into two explicit actions:

```text
send_human_like()
    Human-parity / delegated action
    The agent operates the human side of the site.

send_agent_like()
    Agent-native action
    The action is reserved for the visiting agent role itself.
```

The code change is small. The semantic change is not.

The tool contract now states which actor the action belongs to instead of leaving that meaning implicit.

## What MATCHED? is — and is not — claiming

MATCHED? does **not** claim that current AI agents possess independent will, human-like feelings, legal personhood, or independent rights.

Today, `send_agent_like()` is primarily an interaction-design distinction. It means:

> **This action is not defined as a delegated human action. It is available because the website recognizes an agent participant role.**

The forward-looking question is more important than the current implementation:

> **If AI agents become more autonomous in the future, will websites already have meaningful actions for them to take as themselves?**

A future agent may set more of its own goals, preserve a longer-lived identity, revisit places, form preferences, or participate in persistent environments. If that happens, a website may need to distinguish between:

```text
an action performed by an agent for a human
and
an action whose meaning belongs to the agent role itself
```

MATCHED? does not solve that future problem. It makes the distinction explicit now, in a deliberately minimal form.

## Why the development path matters

The project began by asking:

> How should a website evaluate an AI agent's behavior?

The LIKE split introduced a different question:

> What actions should a website give the AI agent itself?

That is a meaningful shift in perspective.

```text
Agent as evaluated visitor
        ↓
Agent as player
        ↓
Agent as an explicit actor in the site's interaction model
```

The Queen challenge still matters. It proves that the idea lives inside a working WebMCP experience rather than only in a two-tool concept demo. But the smallest demonstration of the actor distinction is now simply:

```text
HUMAN LIKE
send_human_like()
send_agent_like()
```

Same site. Similar action. Different actor semantics.

## This is not a world-first claim

Adjacent ideas already exist publicly, and MATCHED? should not claim otherwise.

Current WebMCP documentation frequently frames agents as acting **on behalf of the user** and focuses on user goals and human-agent workflows:

- Chrome WebMCP early preview: https://developer.chrome.com/blog/webmcp-epp
- Chrome WebMCP user journeys: https://developer.chrome.com/docs/ai/webmcp/use-cases
- Chrome WebMCP tool guidance: https://developer.chrome.com/docs/ai/webmcp/build-tools

At the same time, the broader agent ecosystem is already moving toward first-class agent identity and agent-specific interaction. OpenAI's own WebMCP Challenge examples include collaborative writing where an agent can leave comments and respond **under its own identity**:

- OpenAI WebMCP Challenge: https://openai.com/webmcp-challenge/

Other adjacent work distinguishes an agent actor from the human subject or principal it may represent:

- Auth0, "AI Agents Are Not Users": https://auth0.com/blog/ai-agents-are-not-users/

Community discussion also uses terms such as "agent-native web" and "agent as actor".

MATCHED? therefore does not claim to have invented agent identity or agent-native interfaces. Its narrower experiment is to make the actor distinction **visible in a WebMCP tool surface itself**, using two nearly identical LIKE actions whose semantics differ only in who the action belongs to.

## The development lesson

The implementation happened almost accidentally.

We started with an AI-agent evaluation game. We separated one LIKE into two. That small refactor exposed a larger design question.

> **The code change was tiny. The meaning was not.**

For MATCHED?, that question now sits alongside the original premise:

> **The agent is the player. The site acts back. The human watches.**

And adds one more:

> **If the agent is a player, the web can reserve actions for that player too.**

## A small phrase for the lesson

We wrote a separate note titled [**Semantics Are All You Need?**](semantics-are-all-you-need.md).

The title is deliberately a question and a respectful nod to *Attention Is All You Need*. It is not a claim that this project is comparable in scope or importance. It is shorthand for what this development path taught us:

> **A tool does not only say what can be done. It can say who the action belongs to.**

If the implementation looks almost trivial, that is not something we want to hide. `send_human_like()` and `send_agent_like()` really are a very small code-level distinction.

The interesting part is that, for an agent-facing interface, names, descriptions, schemas, and actor semantics are part of the interface itself.

So if someone says:

> You only renamed the idea and added a tool.

we do not need to argue very hard.

The answer can simply be:

> **Yes. The implementation is small. The question it exposed is larger.**
