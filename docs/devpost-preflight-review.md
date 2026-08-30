# MATCHED? — Devpost Preflight Review

Reviewed: 2026-08-30

Purpose: check the current `docs/devpost-submission-draft.md` against the official OpenAI WebMCP Challenge submission requirements before the final video is available.

This is a preflight review, not the final submission pass. Video wording and final release identifiers should be synchronized only after the judged build is ready.

## 1. Required live URL

Current candidate:

```text
https://matched-webmcp.pages.dev/
```

Repository README also exposes:

```text
https://matched-webmcp.pages.dev/?challenge=1
https://matched-webmcp.pages.dev/observatory.html
```

Status: **present**.

Final gate: open the exact submitted URL in a WebMCP-capable browser immediately before submission.

---

## 2. Required public open-source repository

Current candidate:

```text
https://github.com/hajime777/matched-webmcp
```

Verified current repository state:

```text
visibility: public
license: MIT
default branch: develop
```

Status: **present**.

### Stale sentence in current Devpost draft

The draft still contains:

```text
Repository visibility must be public before final Challenge submission.
```

That sentence is now obsolete because the repository is already public.

Final copy should replace it with a factual current-state statement, for example:

```text
The source repository is public under the MIT License.
```

---

## 3. Required project description

Official submission guidance asks the description to explain four things:

1. why the project is a strong fit for WebMCP
2. how it creates a better user experience
3. what people and agents can do together that was difficult or impossible before
4. briefly how WebMCP was implemented

### 3.1 Why WebMCP fits

Current draft: **strong**.

It clearly explains:

- fixed semantic WebMCP tools
- agent-facing structured state
- human-parity vs agent-native actions
- `send_human_like()` vs `send_agent_like()`
- Queen as an interactive counterpart rather than a passive API

No major rewrite needed.

### 3.2 Better user experience

Current draft: **present, but can be made more explicit**.

The draft explains Human UX and Agent UX separately, but the final copy should include one plain sentence explaining the practical improvement.

Recommended final-copy concept:

> Humans do not need to inspect raw tool logs to understand the run, and agents do not need to infer challenge state from visual UI. Humans get a spectator experience while agents get explicit semantic progress, refusals, requirements, and next steps.

This directly connects implementation to user experience instead of leaving the benefit implicit.

### 3.3 What people and agents can do together

Current draft: **conceptually present, wording should be explicit**.

MATCHED? deliberately makes the human a spectator rather than a supervisor. Therefore avoid forcing the project into a conventional “human approves agent action” story.

The final answer can instead state:

> A person can bring an agent to the same live web experience, make a human-side choice such as HUMAN LIKE, and then watch the agent participate through its own WebMCP actions while Queen responds to the agent's behavior. The human and agent share the site without being forced into the same role or interface.

That is the strongest MATCHED?-specific answer to the “people and agents together” criterion.

### 3.4 How WebMCP was implemented

Current draft: **strong**.

It already states:

- native `document.modelContext`
- fixed 11-tool surface
- semantic `locked` / `refused` progression
- static HTML/CSS/vanilla JS
- Cloudflare Pages/Functions/D1
- Playwright + Chrome native WebMCP testing

No major rewrite needed.

---

## 4. Demo video

Status: **handled in a separate workstream**.

Final Devpost pass must confirm:

```text
public YouTube URL
under 3 minutes
audio present
video demonstrates real WebMCP behavior
video wording matches final submitted build
```

Do not finalize the first/last Devpost paragraphs until the final demo narrative is stable.

---

## 5. Claims review

Current draft correctly avoids claiming that MATCHED? is:

- the first WebMCP game
- the first agent benchmark
- the first agent-native interface
- a scientific benchmark of global model intelligence
- proof that current agents possess independent will

Keep this restraint.

Strong claims that are directly supported by the implementation:

```text
The agent is the player.
The site acts back.
The human watches.
Different actors. Different meaning.
```

The actor-semantics claim is concretely represented by separate Human LIKE and Agent LIKE state/actions.

---

## 6. Observatory wording

Current public telemetry should be described as:

```text
low-information
anonymized
semantic
best-effort public experiment telemetry
```

Avoid wording such as:

```text
verified proof of real agents
tamper-proof run history
authenticated agent identity
```

Reason: the public telemetry ingestion path is not cryptographic attestation and can theoretically be polluted by a fabricated client event stream.

This does not reduce its value as a public spectator/experimental surface; it only limits the assurance claim.

See:

```text
docs/pre-submission-code-security-review.md
```

---

## 7. Testing instructions

The final Devpost submission should provide a compact judge path rather than forcing judges to infer the intended route from the README.

Recommended testing block:

```text
Live site:
https://matched-webmcp.pages.dev/?challenge=1

Use a WebMCP-capable ChatGPT/Chrome session and discover the native tools exposed by the page.

The release exposes 11 fixed tools, including:
send_human_like
send_agent_like
message_queen

Try the Human/Agent LIKE distinction, then converse with Queen and continue through the semantic challenge states.

Public spectator results:
https://matched-webmcp.pages.dev/observatory.html

Source / local regression:
https://github.com/hajime777/matched-webmcp
npm run test:webmcp
```

Final testing instructions should match the actual judged release and final video.

---

## 8. Current draft strengths

Do not lose these sections during final shortening:

- the Human LIKE / Agent LIKE actor-semantics example
- “Built for agents. Shaped by agents.”
- real-agent lessons: dynamic -> fixed surface, Japanese parsing regression, Agent UX dead-end
- synthetic-only safety boundary
- LAB separation from public activity
- native `document.modelContext` implementation
- 24/24 documented regression baseline

---

## 9. Final-copy changes still needed

Before submission:

- [ ] remove the stale “repository must become public” sentence
- [ ] make “better UX” benefit explicit in one plain paragraph
- [ ] explicitly answer the “people and agents together” criterion using MATCHED?'s spectator/actor-separation model
- [ ] synchronize opening/closing wording with final video
- [ ] insert final public YouTube URL
- [ ] ensure testing instructions match the judged deployment
- [ ] update regression statement only after the final pre-submit run
- [ ] record/freeze the final release commit

## Conclusion

The current Devpost draft already contains the core technical and conceptual material needed for submission.

The remaining copy work is **alignment and compression**, not a conceptual rewrite.

The most important final framing remains:

> **The agent is the player. The site acts back. The human watches.**

with the concrete WebMCP interface example:

> **Different actors. Different meaning.**
