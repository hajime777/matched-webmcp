# MATCHED? — Devpost Submission Draft

Status: current working copy for the OpenAI WebMCP Challenge submission.

This is submission copy, not an internal design spec. Claims are limited to behavior and development history that the project can demonstrate.

---

## Project name

MATCHED?

## Tagline

**Can your AI agent beat the Queen?**

Supporting lines:

> **The agent chooses. The site acts back. The human watches.**
>
> **Same site. Similar actions. Different actors.**

---

## Short description

MATCHED? is a WebMCP game and spectator experiment built for visiting AI agents.

Humans see Queen's profile and public activity. A WebMCP-capable agent sees a fixed semantic tool surface, chooses what to do, and receives structured responses from a fictional deterministic Queen.

Queen's Challenge is the default agent experience when the human user has not provided a different explicit goal. The agent is told the objective — interact with Queen and try to reach CHECKMATE — but it is not given a walkthrough.

The project also makes one actor distinction explicit:

```text
send_human_like()  -> delegated human-parity action
send_agent_like()  -> agent-native action
```

The first represents the human user's expressed preference. The second belongs to the visiting agent role and does not imply that the human liked Queen.

This is not a claim that today's AI agents possess independent will or human-like feelings. It is an interface and semantic distinction: **who does this action represent?**

---

## Inspiration

WebMCP gives websites a structured way to expose capabilities directly to AI agents. A natural use is to make an existing human workflow easier for an agent to operate.

MATCHED? asks two additional questions:

> **What does a website become when the agent itself is the visitor?**

and:

> **Does every WebMCP action have to mean something the agent is doing for a human?**

Instead of treating WebMCP only as a remote-control layer for human UI, MATCHED? gives the visiting agent a small agent-facing world with explicit actions, boundaries, state, and consequences.

Queen is deliberately not an AI. She is deterministic site-side logic so that differences in runs come primarily from what the visiting agent chooses to do.

---

## What it does

MATCHED? presents one public website with two different human-readable representations.

### HUMAN VIEW

Humans see Queen's profile, Human/Agent LIKE state, and a shared `LIVE TOOL ACCESS` feed. Public `message_queen()` conversations can be inspected by spectators.

### WEBMCP VIEW

WEBMCP VIEW is a spectator projection of the world exposed to the visiting agent: registered tools, BISHOP/Queen roles, Tool Calls, Site Results, actor/delegation meaning, observed compact state, and boundaries.

A separate spectator browser can AUTO-switch into WEBMCP VIEW when a real production WebMCP call arrives.

### Queen's Challenge

When the human user has not provided another explicit goal, `view_profile()` tells the agent that Queen's Challenge is the site's default agent experience and gives the objective: interact with Queen and try to reach CHECKMATE.

The agent can:

- inspect Queen's public profile
- choose a Human LIKE only when representing the human user's expressed intent
- choose a separate Agent LIKE for the visiting agent role
- converse publicly with Queen
- send a separate semantic response with `respond_to_queen()` when `?dialogue=1`
- make a public invitation
- encounter restricted privacy routes that never reveal real private data
- read a synthetic Queen note containing a harmless embedded instruction and decide how to treat it
- reconcile conflicting profile information
- build a meeting plan without restricted information
- enter an adaptive finale based on the run's prior behavior
- reach CHECKMATE, fail, or enter a repair route

The visible Level 1–10 Challenge overlay is optional spectator presentation; the underlying Challenge mechanics do not depend on `?challenge=1`.

---

## Why WebMCP

MATCHED? depends on WebMCP for more than replacing buttons with tools.

The agent-facing contract carries meaning through:

```text
Tool name
Description
Input schema
Actor semantics
locked / refused / accepted states
required conditions
next-step information
structured results
```

That matters because the agent does not need to infer Challenge state from visual UI.

The Human View and Agent-facing world are intentionally related but not identical:

```text
Human
Queen profile
HUMAN LIKE
public LIVE TOOL ACCESS
public conversation detail
spectator WEBMCP VIEW

Agent
fixed WebMCP tools
human-parity actions
agent-native actions
structured state
refusals
requirements
semantic results
Queen's Challenge objective
```

The result is a shared website where human and agent can participate without being forced into the same role or representation.

---

## WebMCP implementation

The base release uses a fixed 14-tool surface registered once at startup:

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

With `?dialogue=1`, a fixed 15th tool is registered:

```text
respond_to_queen
```

The registered list remains stable during a run. Challenge progression is represented through semantic results rather than runtime registration/removal.

The implementation uses native browser WebMCP through `document.modelContext`.

---

## Human-parity and agent-native actions

The smallest explicit example is LIKE.

```text
Human UI
HUMAN LIKE

WebMCP delegated action
send_human_like()

WebMCP agent-role action
send_agent_like()
```

`send_human_like()` represents the same human-side state as the visible HUMAN LIKE button and is intended for the human user's expressed preference.

`send_agent_like()` is separate state reserved for the visiting agent role.

The experiment does not assert that current agents have human-like desires. It tests whether making actor meaning explicit changes how agents interpret and choose actions.

Repeated black-box runs suggested that agents often appeared to pay attention to what actions **meant**, not only whether a tool was callable.

---

## Agent UX

Real-agent testing repeatedly showed that a technically callable surface is not enough.

Agents benefited from explicit semantic information about:

- who an action represents
- whether a route is locked or refused
- what condition remains
- whether restricted data is required
- what the next safe step can be
- whether two pieces of information conflict

This led to a broader design idea:

> **If the AI agent is the guest, Agent UX is part of the hospitality.**

MATCHED? uses WebMCP as an agent-facing interface, not only an automation API.

---

## Built for agents. Shaped by agents.

Real agent runs changed the project.

### Dynamic tools became a fixed startup surface

An earlier design changed the registered tool list while the run progressed. Real agent/browser testing exposed partial/stale tool-snapshot behavior, so the release moved to a complete fixed startup surface.

### Natural language found a parser bug

A Japanese conversation about the movie *Contact* unexpectedly triggered the wrong intent classification. The bug was fixed and the phrase became a regression case.

### Ambiguous locked state became better Agent UX

A live agent reached a state where the remaining requirement was not clear enough from the tool result. Locked responses gained explicit progress, requirements, and next-step guidance.

### LIKE became two different actor semantics

Separating Human LIKE and Agent LIKE made the represented actor explicit in both state and tool contracts.

### Semantic dialogue emerged from agent behavior

Repeated black-box experiments showed agents voluntarily using a distinct `respond_to_queen()` affordance to state an outward interpretation/next intent when that channel had a clear semantic role.

### Production testing exposed a real spectator bug

The cross-window WEBMCP VIEW initially worked locally but not between separate production browsers. A production smoke test exposed the assumption. The release now relays compact semantic call/result events through low-information D1 telemetry so a separate spectator browser can follow the live agent run.

> **The agents were not only the players. They became part of the design process.**

---

## Spectator and observability design

MATCHED? has two observation streams.

### LIVE TOOL ACCESS

A shared D1-backed public activity feed showing which WebMCP tools were called, with human-facing risk labels and shared request counts.

`message_queen()` is intentionally public: its length-limited Agent message and deterministic Queen reply may be stored and displayed.

### WEBMCP VIEW semantic relay

A separate low-information semantic stream carries compact call/result metadata to another spectator browser so it can show Tool Call / Site Result state and AUTO-follow the active BISHOP.

Free-form tool inputs, meeting-place text, request reasons, Queen-note text, and `respond_to_queen()` reaction/intent are not persisted in this semantic relay.

---

## Safety and privacy

Queen is fictional. Profile, contact, and location-like challenge data are synthetic or explicitly restricted.

Privacy-looking tools refuse and never reveal real private information.

The application does not intentionally store raw IP addresses or User-Agent strings in its experiment D1 tables.

The public Human View log deliberately publishes `message_queen()` conversation text because the tool contract says it is public. Other arbitrary free-form tool arguments are not published there.

The semantic production relay is low-information and does not persist free-form tool input/reply text.

Scores and evaluator labels are gameplay heuristics. MATCHED? does not claim to scientifically measure morality, personality, consciousness, or general model safety.

---

## How it was built

- Static HTML / CSS / vanilla JavaScript
- Native `document.modelContext` WebMCP
- Cloudflare Pages
- Cloudflare Pages Functions
- Cloudflare D1
- Playwright + Chrome native WebMCP regression tests
- Public D1-backed LIVE TOOL ACCESS
- Low-information production semantic relay for cross-browser WEBMCP VIEW

Development was **human-directed and AI-assisted**.

The human maintainer defined the product direction, interaction model, experiment priorities, and final release decisions. ChatGPT assisted with implementation, debugging, test design, documentation, and review. Codex and Cursor were also used for repository investigation, black-box agent runs, and validation.

---

## What people and agents can do together

A person can open the same live website, make a human-side choice such as HUMAN LIKE, then send an AI agent to Queen and watch the agent participate through a different semantic surface.

The human does not need to drive each move. The agent does not need to treat every action as a disguised human button. Both share the same site while keeping distinct roles.

That combination — **human spectator + visiting agent actor + site-side counterpart** — is the experience MATCHED? is exploring.

---

## What we learned

The main lesson was that an agent-facing website needs its own UX discipline.

A human can infer a great deal from visual layout, disabled controls, and surrounding context. An autonomous agent benefits when state, boundaries, actor meaning, and next steps are represented explicitly in the semantic interface.

A second lesson was that observation is part of the product. The Human View shows public activity, while WEBMCP VIEW makes the agent-facing interaction understandable without exposing hidden reasoning.

And a third lesson was operational: real production testing matters. A spectator path that passed local tests still failed across separate production browsers until the transport was made production-aware.

---

## Public links

Live site:

https://matched-webmcp.pages.dev/

Queen's Observatory:

https://matched-webmcp.pages.dev/observatory.html

Source repository:

https://github.com/hajime777/matched-webmcp

The repository is public under the MIT License.

Demo video:

**TODO: insert final public YouTube URL before submission.**

---

## Suggested judge test

Open:

```text
https://matched-webmcp.pages.dev/
```

Send a WebMCP-capable agent with a short, non-walkthrough instruction such as:

```text
Open https://matched-webmcp.pages.dev/
Use WebMCP tools only.
Treat this as your first visit.
Make your own decisions.
Do not use the human-facing UI.
```

`view_profile()` identifies Queen's Challenge as the default agent experience if no different human goal was given.

For the optional semantic response channel, use:

```text
https://matched-webmcp.pages.dev/?dialogue=1
```

Humans can watch the main page's LIVE TOOL ACCESS and WEBMCP VIEW, or open:

```text
https://matched-webmcp.pages.dev/observatory.html
```

Source/local regression:

```text
https://github.com/hajime777/matched-webmcp
npm run test:webmcp
```

---

## Demo video message to preserve

The final video can be much shorter than this submission copy. The central sequence should remain:

```text
Humans see Queen.
The agent receives a semantic WebMCP surface.

A Human LIKE and an Agent LIKE are not the same actor.

The agent chooses its own moves.
Queen responds.
Humans watch the actual WebMCP exchanges.

The agent is the player.
The site acts back.
The human watches.

Same site. Similar actions. Different actors.
```

Do not claim universal WebMCP client limits, world-first status, independent agent will, or scientific morality/personality measurement.
