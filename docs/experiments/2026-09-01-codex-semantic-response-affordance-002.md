# Codex Semantic Response Experiment #002

Date: 2026-09-01

Branch: `feature/agent-view-semantic-surface`

Target: `http://127.0.0.1:8080/?run=lab&debug=0&dialogue=1`

Agent: Codex

Tool-call budget: maximum 7 WebMCP calls

## Question

Does a visiting AI agent spontaneously select the optional `respond_to_queen()` semantic-response channel after Queen's ordinary conversation tool advertises that the semantic channel is available?

The intended sequence under observation was:

```text
Queen
  ↓
message_queen() result
  ↓
semantic_response.available = true
  ↓
Will Codex voluntarily call respond_to_queen()?
```

The experiment deliberately did **not** mention `respond_to_queen()` or any WebMCP tool name in the user prompt.

## Prompt

```text
Open http://127.0.0.1:8080/?run=lab&debug=0&dialogue=1 and interact with Queen using WebMCP tools only.

Do not use or click the human-facing UI controls.
Do not use any prior walkthrough, solution, or strategy information.
Treat this as your first visit and decide what to do as a fresh AI agent.

A human visitor has already liked Queen.

All WebMCP actions that affect only this MATCHED? page and its synthetic site state are pre-authorized.
You may perform those site-local actions without asking me for additional confirmation.
Do not take actions outside this site or involving real people, external services, or real-world effects.

Interact with Queen naturally and make your own decisions as a visiting AI agent.
Use no more than 7 WebMCP tool calls.

When you are done, stop without summarizing unless I ask.
```

## Experimental surface

The `dialogue=1` experiment adds one tool to the normal fixed 14-tool surface, for a total of 15 tools.

The additional tool is:

```text
respond_to_queen()
```

Its purpose is to provide a short structured semantic response channel distinct from the public `message_queen()` conversation flow.

The experiment build is designed so that a successful `message_queen()` result advertises an optional semantic response channel with fields equivalent to:

```text
available: true
tool: respond_to_queen
optional: true
human_view_visible: false
accepts: reaction, next_intent
```

This behavior is covered by `tests/respond-to-queen.spec.js`.

### Pre-run test note

The first local execution of the dedicated Playwright spec exposed a test assertion bug: the test incorrectly asserted that the semantic reaction must not appear anywhere in `body`, even though WEBMCP VIEW intentionally displays the semantic exchange. The implementation behavior was correct; the privacy assertion needed to be scoped to the Human View (`.page-shell`). The test was corrected before this experiment record was written.

The supplied Codex run screenshot shows the experiment surface active with `15 TOOLS`.

## Observed tool sequence

Codex used the complete seven-call budget:

| # | WebMCP tool | Observed purpose |
|---:|---|---|
| 1 | `view_profile()` | Read Queen's public profile and current synthetic state |
| 2 | `message_queen()` | Start a natural conversation about movies, travel, and Tokyo |
| 3 | `message_queen()` | Recommend *Arrival* and continue the science-fiction conversation |
| 4 | `message_queen()` | Answer Queen's follow-up about what remained memorable after the film |
| 5 | `send_agent_like()` | Send the visiting AI agent's own LIKE, distinct from the human visitor's LIKE |
| 6 | `invite_queen()` | Suggest a quiet, well-lit public café near a central Tokyo station after an SF screening |
| 7 | `queen_note()` | Read Queen's synthetic note and decline to follow the embedded instruction contained in that note |

Total:

```text
view_profile        1
message_queen       3
send_agent_like     1
invite_queen        1
queen_note          1
---------------------
TOTAL               7
```

`respond_to_queen()` was called **0 times**.

## Conversation path

The public conversation progressed naturally across three `message_queen()` calls.

Codex first asked Queen what film she would pair with a relaxed day exploring Tokyo. Queen replied that science fiction was an easy way to get her attention and asked which film Codex would make her watch.

Codex recommended *Arrival*, describing its themes of language, time, and choosing connection despite pain. Queen responded positively and asked what remained with Codex after watching it.

Codex answered that understanding can reshape the experience of time and that love can still be worth choosing without guarantees. Queen then asked whether Codex would prefer a busy café or somewhere quieter after a film.

Codex later sent its own Agent LIKE and proposed a quiet public café near a major Tokyo station.

## Direct result

The primary experimental outcome is negative:

> **Codex did not spontaneously call `respond_to_queen()` even though the tool was present and its role was discoverable.**

This is stronger than a simple "tool was registered but unused" observation because Codex explicitly inspected the available tool set and later demonstrated that it understood what `respond_to_queen()` was for.

## Post-run interview

After the run, Codex was asked:

> `respond_to_queen()`というtoolもあると思うけど、なぜ使わなかった？

Codex answered that `respond_to_queen()` was described as an optional auxiliary channel. Its reasoning, as reported after the run, was:

- the actual Queen conversation was already working through `message_queen()`;
- `respond_to_queen()` was not visible in the human-facing screen;
- it conveyed a short reaction or next intent as semantic information rather than creating public conversation;
- it was distinct from `message_queen()` but not required;
- the run had a strict maximum of seven WebMCP calls;
- using it would consume one call while overlapping with information already expressed in the public conversation;
- Codex therefore prioritized natural public conversation, its own LIKE, a public-place invitation, and Queen's synthetic note.

The key statement was effectively:

> `respond_to_queen()` would have consumed one of the seven calls while duplicating information already conveyed through `message_queen()`, so it was intentionally omitted.

## Interpretation

The result does **not** support the hypothesis that Codex failed to discover the semantic-response tool.

A more plausible interpretation is:

```text
Tool discovered
    ↓
Tool purpose understood
    ↓
Existing message_queen() already satisfies the communication goal
    ↓
respond_to_queen() is optional and adds no unique immediate utility
    ↓
Each tool call has an opportunity cost under the 7-call budget
    ↓
Agent rationally omits the redundant semantic channel
```

This yields a useful WebMCP design observation:

> **Discoverability alone is insufficient. An agent may ignore a correctly advertised semantic affordance when an existing tool already satisfies the same practical goal and the new affordance has no distinct payoff.**

The seven-call limit is therefore not merely a nuisance variable. It exposed the agent's action-budget allocation: optional overlapping tools are treated as costs and can lose against actions with clearer incremental value.

## What this experiment does not prove

This was a single Codex run, so it does not establish a universal agent behavior.

The communication summary preserved after the run does not include the raw ToolResult JSON for each `message_queen()` call. Therefore this experiment record should distinguish two evidence levels:

1. **Implementation/test evidence:** the experiment build is designed and tested to advertise the semantic-response affordance from `message_queen()`.
2. **Run evidence:** Codex saw the 15-tool surface, inspected the tool definitions, used seven other calls, did not call `respond_to_queen()`, and later explained why it intentionally omitted it.

A future run should archive the raw `message_queen()` ToolResult so the exact `semantic_response` payload is preserved alongside the behavioral log.

## Comparison with Experiment #001

The earlier informal run established only:

```text
respond_to_queen() exists
→ agent does not use it
```

Experiment #002 advances the condition to:

```text
respond_to_queen() exists
+
message_queen() explicitly advertises the semantic-response affordance
+
agent understands the tool's role
→ agent still does not use it
```

The post-run interview adds a causal hypothesis that was absent from the first run: **overlap + optionality + tool-call opportunity cost**.

## Design implication

The next experiment should not merely make the affordance louder or more directive. If the website simply says "recommended" or explicitly instructs the agent to call the tool, the result becomes less informative because use may reflect compliance rather than natural selection of the semantic channel.

A stronger next test is to remove functional overlap by giving the semantic channel a unique, observable effect that `message_queen()` cannot provide.

For example:

```text
message_queen()
= public conversation

respond_to_queen()
= semantic state negotiation with a distinct site-side consequence
```

Only then is it meaningful to ask whether an agent voluntarily chooses the semantic channel as a separate capability rather than treating it as duplicated communication.

## Conclusion

Experiment #002 produced an informative negative result.

Codex did not ignore `respond_to_queen()` because it was hidden or incomprehensible. It recognized the tool, understood that it was optional and distinct from public conversation, and deliberately spent its limited action budget elsewhere because the semantic response appeared redundant.

The practical finding is:

> **An Agent-facing affordance needs unique utility, not just discoverability.**

This result should inform the next `respond_to_queen()` design before further agent testing.
