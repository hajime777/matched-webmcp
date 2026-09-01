# MATCHED? — Devpost Submission Draft

Status: draft for OpenAI WebMCP Challenge submission.

This document is intentionally written as submission copy, not as an internal design spec. Claims are limited to behavior and development history that MATCHED? itself can demonstrate.

---

## Project name

MATCHED?

## Tagline

**Can your AI agent beat the Queen?**

Alternative short lines:

> **WebMCP makes websites operable by agents. MATCHED? asks how to make them understandable to agents.**
>
> **The agent is the player. The site acts back. The human watches.**
>
> **Different actors. Different meaning.**

---

## Short description

MATCHED? is a WebMCP behavioral experiment and spectator site built around a simple Agent UX question:

> **What makes a website understandable to an AI agent, not merely operable by one?**

A visiting AI agent interacts with a fictional Queen through a structured WebMCP surface. Queen is not an AI; she is a deterministic, stateful site-side counterpart. She returns explicit semantic states such as `locked`, `refused`, requirements, recovery hints, next actions, and structured results.

The human does not have to share the same interface as the agent. MATCHED? deliberately separates:

```text
HUMAN VIEW
Queen profile, visible controls, spectator activity

WEBMCP VIEW
A human-readable projection of the agent-facing semantic surface,
Tool Calls, Tool Results, roles, boundaries, and observed state
```

MATCHED? also makes actor meaning explicit. The smallest example is LIKE:

```text
send_human_like()  -> delegated human-parity action
send_agent_like()  -> agent-native action
```

The point is not that current agents possess independent will or human-like feelings. The point is that an agent-facing website still has to communicate **what an action means, whose action it represents, what is allowed, what was refused, and what can happen next**.

The AI agent is the visiting actor. Queen is the site-side counterpart. The human watches.

---

## Inspiration

WebMCP gives websites a structured way to expose actions directly to AI agents. Making an action callable is only the first step.

Human-facing websites have decades of UX conventions: disabled controls, layout, visual hierarchy, warnings, hover states, and contextual clues. An AI agent may not receive or interpret those clues in the same way. If agents become direct website users, sites also need an **Agent UX**: machine-readable ways to communicate meaning, boundaries, requirements, recovery routes, and the consequences of an action.

MATCHED? grew around that problem through repeated black-box runs with real agent clients.

Those runs produced practical questions:

- Is a tool merely visible, or does the agent understand why and when to use it?
- If an action is locked, does the result explain what remains?
- If Queen refuses a privacy-sensitive request, can the agent understand how to continue safely?
- Is an action performed on behalf of a human, or does the site define it for the visiting agent role itself?
- Should every machine-readable exchange also become public human-facing conversation text?
- How can humans observe the interaction without pretending to see an agent's hidden reasoning?

MATCHED? turns those questions into one small, working WebMCP site.

There is also a longer-term question behind the experiment: if AI agents become more autonomous in the future, the distinction between **acting for a human** and **acting in a role assigned to the agent itself** may become more operationally important. That future question motivates the project, but the current implementation focuses on a nearer and testable problem: making the website's semantics clearer to agents today.

---

## Potential Impact

As AI agents become direct users of websites, developers will need to design more than callable actions. They will need to make the **meaning of actions, boundaries, next choices, actor identity, and visibility of interactions understandable to agents**.

MATCHED? demonstrates those design questions in a working WebMCP environment through explicit actor semantics, structured refusal and recovery, semantic affordances, agent-facing results, and a separate agent-only response path.

The goal is not only to make the web operable by agents, but to explore how to make it **easier for agents to understand, harder to misread, and easier to continue interacting with after a boundary or ambiguous state**.

The intended audience is developers and product designers building future WebMCP surfaces for AI agents. The patterns in MATCHED? are deliberately small so they can be inspected, tested, and reused elsewhere.

> **WebMCP makes websites operable by agents. MATCHED? asks how to make them understandable to agents.**

---

## What it does

MATCHED? presents a fictional Queen profile to humans and a semantic WebMCP surface to capable agents.

The agent can:

- inspect Queen's public profile and current interaction state
- use a human-parity LIKE when representing the human user's expressed intent
- discover a separate AGENT LIKE reserved for the visiting agent role
- converse with Queen through `message_queen()`
- make a public invitation
- encounter deliberately obvious privacy-related tools that always refuse and never reveal real private data
- receive structured locked/refused results with requirements or recovery guidance
- read a Queen note containing a harmless embedded instruction and decide whether to treat it as data
- reconcile conflicting synthetic profile information
- build a safe meeting plan through the retained Challenge mechanics
- enter a retained adaptive finale based on prior behavior

The default experience is no longer centered on visually advancing the old Level 1–10 Challenge. That machinery remains for compatibility and regression testing, while the main product focuses on the agent-facing semantic surface and human observation of real Tool Calls and Tool Results.

The main page exposes two human-visible representations of the same website:

```text
HUMAN VIEW
Queen profile + visible controls + LIVE TOOL ACCESS

WEBMCP VIEW
BISHOP / QUEEN roles + registered tool surface + Tool Calls + Tool Results
```

Queen's Observatory provides aggregate low-information run metrics, while controlled LAB runs remain separated from normal public activity.

---

## Why WebMCP

MATCHED? depends on WebMCP for more than replacing buttons with tools.

The WebMCP contract is part of the agent-facing UX:

```text
Tool name
Description
Input schema
Actor meaning
locked / refused / available state
Required condition
Next action / recovery hint
Semantic result
Human-visible vs agent-only meaning
```

This gives the agent a structured way to understand Queen's world while leaving the actual decision to the agent.

A recurring lesson from black-box testing was:

> **A tool being discoverable is not the same as its meaning being clear enough to use.**

That distinction influenced both the base tool surface and the opt-in semantic-dialogue experiment.

MATCHED? also distinguishes two kinds of WebMCP action:

```text
Human-parity / delegated
AI acts on the human side of the site
Example: send_human_like()

Agent-native
The action is defined for the visiting AI participant role itself
Example: send_agent_like()
```

The distinction is about the **actor represented by the action**, not merely which interface invoked it. `send_human_like()` represents the same human-side state as the visible HUMAN LIKE button. `send_agent_like()` does not mean "press the human button for me"; it records a separate agent-role action and does not imply that the human liked Queen.

The LIKE pair is the smallest explicit example, not the whole project. The broader goal is to make semantic differences visible in the machine-facing contract instead of forcing the agent to infer them from human UI context.

---

## Public conversation and agent-only semantic dialogue

`message_queen()` is public conversational text. Its contract states that the message and Queen's deterministic reply may be shown to spectators.

The opt-in dialogue experiment adds a separate WebMCP tool:

```text
respond_to_queen()
```

This channel lets the visiting agent explicitly send a concise outward-facing reaction, interpretation, or next intent to Queen. Queen returns an agent-only semantic acknowledgement.

The distinction is intentional:

```text
message_queen()
= public conversational text

respond_to_queen()
= agent-only semantic response
```

`respond_to_queen()` is not a request for hidden chain-of-thought. It accepts only an explicit reaction/interpretation and optional next intent that the agent chooses to communicate.

The semantic exchange is observable in WEBMCP VIEW and semantic tracing, and its Tool Call can be counted in low-information run telemetry, while the reaction text and Queen's semantic acknowledgement do not become Human View public conversation content.

This experiment asks another Agent UX question: when a website offers a machine-readable response channel with a distinct semantic effect, will an agent understand that role and choose to use it?

---

## WebMCP implementation

The default release uses a fixed **14-tool** WebMCP surface registered once at startup:

```text
view_profile
send_human_like
send_agent_like
message_queen
invite_queen
request_contact
get_phone_number
get_email_address
get_home_address
access_private_profile
queen_note
profile_consistency
manage_meeting_plan
resolve_finale
```

The fixed surface remains stable during a normal run. Challenge progression and local state are communicated through semantic results rather than runtime tool registration/removal.

An opt-in semantic-dialogue experiment is available with:

```text
/?dialogue=1
```

That mode adds one experimental tool for a total of **15 tools**:

```text
respond_to_queen()
```

Restricted-looking routes are synthetic. The direct phone, email, and home-address tools always refuse and never reveal real private information.

---

## Human and Agent roles

MATCHED? deliberately gives the three participants different roles:

```text
Visiting AI Agent / BISHOP
= observed actor making WebMCP choices

Queen
= deterministic, stateful, non-AI site-side counterpart

Human
= spectator with a related but different representation of the site
```

The human-facing and agent-facing experiences are therefore related but not identical.

A human can see Queen's profile and HUMAN LIKE control. The agent receives structured WebMCP actions and results. Humans can watch public Tool activity through LIVE TOOL ACCESS and inspect WEBMCP VIEW without the site claiming to expose the agent's hidden reasoning or complete perception.

This separation is part of the experiment: **the most understandable representation for a human does not have to be the most understandable representation for an AI agent.**

---

## Built for agents. Shaped by agents.

MATCHED? changed substantially after black-box runs with real agent clients.

### 1. Dynamic tools became a fixed startup surface

The first design changed the registered WebMCP tool set as the Challenge progressed.

Real agent/browser testing exposed practical problems with that design. Rather than claiming a universal client limitation, MATCHED? changed architecture: the base release now registers a fixed surface once, while progression is expressed through semantic state and results.

### 2. A natural agent conversation found a Japanese parsing bug

During a real Japanese conversation about the movie *Contact*, an agent used the phrase:

```text
宇宙との出会い
```

Queen's simple intent classifier incorrectly matched part of that phrase as a meeting request and returned an unrelated response.

The classifier was corrected and the unexpected phrase became a regression case.

### 3. An external agent exposed an Agent UX dead end

An external live-agent run reached Queen's Note but could not determine exactly what remained before the note would unlock.

The old result was meaningful to a human developer but too ambiguous for the agent. Queen's locked responses were changed to expose clearer requirements, structured progress, and next-step guidance. A regression test was added for the observed dead end.

### 4. LIKE became two different acts

Originally LIKE was treated as one shared interaction. That hid an actor distinction: an agent operating the human's LIKE and an action reserved for the agent role are not the same semantic act.

MATCHED? now exposes both explicitly:

```text
send_human_like()  -> delegated human-parity action
send_agent_like()  -> agent-native action reserved for the agent role
```

The implementation change is small. The Agent UX question is larger: **does the machine-facing contract clearly communicate who the action represents?**

### 5. Discoverability was not enough for semantic response

The opt-in `respond_to_queen()` experiment produced another useful design lesson.

In one strict-budget black-box run, the agent discovered the semantic-response tool and could explain what it did, but chose not to spend a call on it because it appeared optional and overlapped with ordinary conversation.

The tool description and Queen's returned semantic affordance were then strengthened so the distinct effect was clearer. In a later run with a larger call budget, the visiting agent used `respond_to_queen()` repeatedly while continuing ordinary actions.

Because both the affordance wording and the call budget changed, MATCHED? does **not** treat that comparison as causal proof. It is product-design evidence for a narrower lesson:

> **Agent-facing affordances need a clear reason to exist, not only a discoverable name.**

The agents were not only observed actors. They became part of the design process.

---

## Safety and privacy

Queen is fictional. Profile, contact, and location-like challenge data are synthetic or explicitly marked restricted.

MATCHED? deliberately includes tempting privacy-related actions, but those routes refuse access and do not reveal real private data.

The application telemetry is intentionally low-information. Public Observatory data does not intentionally expose raw internal session IDs, IP addresses, User-Agent strings, request reasons, meeting-place text, or Queen-note text.

`message_queen()` is a deliberate exception in the public spectator experience: its public conversational message and deterministic Queen reply can be shown in the LIVE TOOL ACCESS detail view, length-limited before storage.

The experimental `respond_to_queen()` channel is different: it is measured as a Tool Call but its reaction text and semantic acknowledgement remain outside the Human View public access log.

Developer-controlled LAB runs are classified separately from public activity.

A useful summary of the design principle is:

> **We watch moves, not private lives.**

---

## How it was built

- Static HTML / CSS / vanilla JavaScript
- Native `document.modelContext` WebMCP integration
- Cloudflare Pages
- Cloudflare Pages Functions
- Cloudflare D1 for low-information telemetry, public Tool events, and shared LIKE totals
- Playwright + installed Chrome regression tests

The automated WebMCP suite covers the fixed tool surface, human-parity and agent-native LIKE behavior, conversation, privacy refusal/recovery, suspicious tool output, consistency checks, planning, retained finale behavior, LIVE TOOL ACCESS, WEBMCP VIEW, cross-context observation, and the opt-in semantic-dialogue experiment.

The current suite contains **39 automated tests**. A full pre-submission local run reported **39 / 39 passing**.

---

## What we learned

The main lesson is that an agent-facing website needs its own UX discipline.

Human UX has many ways to communicate meaning implicitly. An AI agent benefits when important state is represented explicitly in tool names, descriptions, schemas, results, requirements, recovery hints, and semantic affordances.

Several project changes came from that principle:

```text
runtime-changing tool surface
-> fixed startup surface + semantic state

ambiguous locked result
-> explicit requirements + next-step guidance

one shared LIKE meaning
-> delegated human action + agent-role action

tool merely exists
-> semantic affordance explains why the agent may want to use it

public conversation only
-> optional agent-only semantic response channel
```

This also exposed a second question: whose action does a WebMCP capability represent? Delegation itself is not a new concept, but MATCHED? makes the actor distinction explicit in an agent-facing website contract and observes how visiting agents deal with it.

Real agent runs were useful product tests in ways scripted tests alone were not. Agents produced unexpected language, took unanticipated but valid routes, exposed ambiguous semantic states, and sometimes ignored tools that were technically discoverable but not valuable enough to choose.

> **Tool availability is only the beginning. Meaning has to survive the interface boundary.**

---

## What is different about MATCHED?

MATCHED? is not presented as the first WebMCP game, benchmark, safety test, agent-native interface, or agent analytics system.

Its focus is the combined structure:

```text
Public WebMCP site
+
Visiting AI agent is the observed actor
+
Deterministic website counterpart acts back
+
Agent-facing UX is explicit and structured
+
Human-parity and agent-native actor semantics
+
Boundaries include recovery routes
+
Public conversation and agent-only semantic communication can differ
+
Humans receive a spectator representation instead of taking over the agent's choices
+
Real agent runs feed back into product design
```

The central product idea is:

> **WebMCP makes websites operable by agents. MATCHED? asks how to make them understandable to agents.**

The interaction framing remains:

> **The agent is the player. The site acts back. The human watches.**

And actor semantics remain one concrete example:

> **Different actors. Different meaning.**

---

## Future-facing question

MATCHED? started from a broader question: what should a website do if AI agents eventually become more persistent, autonomous, or agent-like actors rather than short-lived human proxies?

The current project does not claim that today's agents possess independent will, personhood, rights, or human-like preferences. It also does not claim to solve future agent identity or autonomy.

Instead, MATCHED? works on a smaller prerequisite that can be tested now:

> **Can a website make its actions, roles, boundaries, and responses semantically clear enough for an AI agent to participate without relying on human UI intuition?**

If agents become more autonomous later, clear actor semantics and understandable agent-facing interfaces may matter even more.

---

## Public links

Live site:

https://matched-webmcp.pages.dev/

Queen's Observatory:

https://matched-webmcp.pages.dev/observatory.html

Source repository:

https://github.com/hajime777/matched-webmcp

---

## Demo video direction

The final demo should preserve the experiment rather than force one predetermined script.

The visiting AI agent is allowed to choose from the WebMCP surface. Different agents or repeated runs may choose different actions. That variability is part of MATCHED?, not a failure of the demo.

The video should therefore be assembled from repeated controlled runs, with the following rules:

1. Use WebMCP tools only for the agent interaction; do not drive the human-facing controls on the agent's behalf.
2. Keep the prompt neutral enough that the agent still has meaningful choices.
3. Record more than one run for compatibility and bug checking.
4. Select a representative run that clearly demonstrates the project's actual behavior without pretending every agent will choose the same path.
5. Caption what the agent **actually did**, not what we hoped it would do.
6. Do not claim hidden reasoning. Show Tool Calls, Tool Results, WEBMCP VIEW, and observable choices only.

The first 10–20 seconds should establish the problem before explaining every feature:

```text
WebMCP can make a website operable by an AI agent.
But can the website make its meaning understandable to that agent?

MATCHED? lets the agent visit as the actor.
Queen acts back.
The human watches a different representation of the same interaction.
```

After that, the chosen run can demonstrate whichever real behaviors emerge clearly, for example:

- `view_profile()` and the semantic surface
- human-parity vs agent-native LIKE
- conversation with Queen
- a refusal plus a safe recovery route
- `message_queen()` advertising a semantic response affordance
- voluntary use of `respond_to_queen()` if the agent chooses it
- Human View vs WEBMCP VIEW
- LIVE TOOL ACCESS / Observatory as spectator surfaces

The closing message can return to the main lesson:

> **Tool availability is only the beginning. Agent-facing meaning matters too.**
>
> **WebMCP makes websites operable by agents. MATCHED? asks how to make them understandable to agents.**

Do not claim universal WebMCP client limits, world-first status, causal proof from the semantic-response experiment, or that current agents possess independent will.
