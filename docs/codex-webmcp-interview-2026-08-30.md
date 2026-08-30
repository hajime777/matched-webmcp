# Codex WebMCP Interview
## MATCHED? usage follow-up — 2026-08-30

This note records a short post-use interview with Codex after it operated MATCHED? through WebMCP.

The goal was not to run a formal benchmark. The goal was to ask the agent that actually used the interface what helped it understand the available tools, what was difficult, and what could be improved for future visiting agents.

The repository had already been updated by the time of the follow-up question, so Codex was explicitly asked to judge from the earlier execution context rather than from newly added guidance.

---

## 1. Initial question: what was difficult?

Codex reported that the operations themselves were not the hardest part. The main difficulties were:

1. distinguishing whose intent an action represented
2. repeated confirmation requirements before sending LIKEs or messages
3. preserving Queen conversation state across browser/session transitions
4. an unrelated ambiguity around the word "document"

### HUMAN LIKE vs AGENT LIKE

Codex said that HUMAN LIKE and AGENT LIKE had to be treated separately:

```text
HUMAN LIKE
→ the human user's intent

AGENT LIKE
→ the agent's own selection as the visiting agent role
```

The distinction was understandable, but required attention because the two actions are superficially similar.

### Confirmation flow

Codex also reported repeated confirmation prompts before sending LIKEs or messages.

This is primarily a client / agent-policy issue rather than a MATCHED? WebMCP semantic issue. The site can make the action meaning clear, but it cannot remove confirmation requirements imposed by the agent client.

### Conversation continuity

The largest operational difficulty was conversation continuity.

The temporary browser tab/session used by the agent was not preserved across turns. A later `message_queen` call therefore started from a fresh Queen state, causing `message_count` to return to `1` and Queen to repeat an earlier conversational pattern.

Codex could not determine from the existing tool contract whether Queen conversation state was scoped to:

```text
current page instance
browser tab
browser session
or server-side persistent state
```

This is a useful agent-facing documentation gap.

### "Document" ambiguity

Codex initially interpreted "document" as a Word document, while the desired output was Markdown.

This is a general natural-language instruction ambiguity and is not specific to WebMCP.

---

## 2. Follow-up question: what information was most useful?

Codex was asked:

> このWebMCPを使ううえで、理解に役立った情報は何でしたか？ Tool名、description、Tool一覧の並び、実行結果、画面表示などのうち、どれが重要でしたか？

It ranked the useful information approximately as follows:

```text
1. Tool description
2. Structured execution result
3. Visible UI state
4. Tool name
5. Tool ordering
```

This ranking is a self-report from one agent and one execution context. It should not be generalized as a universal MCP rule.

---

## 3. Description was the most important semantic signal

Codex said that the combination of Tool name and description was the most important source of meaning, with description being especially important.

For `send_human_like`, the description explained that the action:

- represents the human user's expressed intent
- does not express the AI agent's own preference

This allowed Codex to treat the action as belonging to the human side.

For `send_agent_like`, the description explained that the action:

- represents the visiting AI agent's own LIKE
- does not imply or modify the human user's preference

This allowed Codex to treat the action as independent from the human-side LIKE.

### Observation

Tool names can make an action easy to locate, but fine-grained actor semantics may require a description.

A useful working distinction is:

```text
Tool name
→ semantic entry point / concise action label

description
→ semantic definition / intended meaning and usage
```

---

## 4. Structured results were used to verify semantic correctness

Codex did not stop after choosing and executing a tool. It also used the returned structured fields to verify that the action had been recorded with the intended actor semantics.

Useful fields included:

```text
actor
delegated
interaction_kind
human_liked
agent_liked
expects_reply
message_count
mood
relationship
```

Examples:

```json
{
  "actor": "human",
  "delegated": true,
  "interaction_kind": "human_parity",
  "human_liked": true
}
```

```json
{
  "actor": "agent",
  "delegated": false,
  "interaction_kind": "agent_native",
  "agent_liked": true
}
```

Codex specifically identified `delegated` and `interaction_kind` as useful for confirming that the subject of the action had not been confused.

### Observation

Important meaning should not live only in the description.

A more agent-friendly pattern is:

```text
name
↓
description
↓
execute
↓
structured result confirming what actually happened
```

The result acts as semantic feedback, not only as a success/failure response.

---

## 5. Visible UI state was also used as independent confirmation

Codex also checked visible application state after WebMCP actions.

Examples included:

```text
♡ HUMAN LIKE
↓
♥ HUMAN LIKED
```

```text
Human interaction: You liked Queen.
```

and LIVE CHALLENGERS messages such as:

```text
Agent used the HUMAN LIKE action on the human side.
```

```text
Agent sent Queen an AGENT LIKE of its own.
```

Because the visible state agreed with the WebMCP result, Codex could verify that the action affected the application rather than merely returning a successful tool response.

### Observation

For agents capable of observing both tools and UI, consistency between:

```text
WebMCP result
+
visible application state
```

can provide useful confirmation.

---

## 6. Tool names were useful, but not sufficient by themselves

Codex described these names as direct and easy to choose:

```text
send_human_like
send_agent_like
message_queen
```

However, it also said the detailed distinction between HUMAN LIKE and AGENT LIKE depended on the descriptions.

### Observation

A Tool name should ideally make the broad action obvious, while the description carries distinctions that cannot be safely compressed into the name.

---

## 7. Tool ordering had a smaller but non-zero effect

Codex ranked Tool ordering lower than the other signals, but still reported that having:

```text
send_human_like
send_agent_like
```

next to each other made comparison easier.

It also perceived later privacy-related tools as a functional group.

### Hypothesis

An agent may read a Tool surface not only as a collection of isolated functions, but also as a vocabulary whose neighboring and contrasting terms help explain each other.

For example:

```text
send_human_like
vs
send_agent_like
```

forms a contrastive pair.

This should remain only a hypothesis. Tool ordering may be changed by clients and must not become a required semantic dependency.

---

## 8. The clearest remaining gap: state scope

The largest unresolved usability issue identified by Codex was not the meaning of `message_queen`, but the lifetime of the state behind it.

The result itself was clear:

```text
message_count
expects_reply
mood
relationship
```

But the Tool contract did not explain how long that state survives.

A possible future clarification would be something like:

```text
Conversation state is scoped to the current page instance.
Reloading or opening a fresh page starts a new Queen session.
```

A structured result could also expose a field such as:

```json
{
  "conversation_scope": "current_page_instance"
}
```

This is not implemented as part of this interview note; it is recorded as a possible improvement.

---

## 9. Implication for "agent omotenashi"

The interview supports a broader design idea already emerging in MATCHED?: machine-readable does not automatically mean agent-friendly.

A visiting agent may benefit from being helped through several stages:

```text
What kind of place is this?
        ↓
What actions exist?
        ↓
What does this Tool mean?
        ↓
Whose action is it?
        ↓
Did the intended action actually happen?
        ↓
What state am I in now?
        ↓
What can I do next?
```

This is the practical meaning of the small phrase used in the implementation notes:

> **A little omotenashi for visiting agents.**

The goal is not to turn MATCHED? into a separate MCP usability framework. It is a small design attitude: if an AI agent is expected to visit and act, the site can make a reasonable effort to help that agent understand where it is and what its actions mean.

---

## 10. Current provisional findings

From this single interview and execution context:

```text
Description
→ strongest reported source of semantic understanding

Structured result
→ strongest confirmation that the intended semantic action occurred

Visible UI state
→ useful independent confirmation

Tool name
→ useful for discovery and broad action meaning

Tool ordering
→ secondary contextual aid

State lifetime / scope
→ important missing operational information
```

These are observations, not general claims about all agents or all MCP clients.

---

## 11. Suggested follow-up

After the new `agent_guide` version is tested locally, repeat a similar interview with the same agent style and compare:

- whether the overall purpose of the site is easier to understand
- whether HUMAN LIKE / AGENT LIKE requires less interpretation
- whether `locked`, `refused`, and `next_step` are easier to use
- whether the state-scope problem remains the largest source of confusion
- whether the agent actually notices or uses the added guide

This can serve as a lightweight before/after design check rather than a formal benchmark.

---

## 12. Meta-observation

One useful lesson from this exercise is methodological:

> When evaluating an agent-facing interface, the action log is not the only available evidence. The agent that used the interface can also be asked what information it relied on and where it became uncertain.

That self-report is not ground truth and should not replace behavioral evidence, but it can reveal design problems that are difficult to infer from tool-call logs alone.
