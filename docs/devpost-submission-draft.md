# MATCHED? — Devpost Submission Draft

Status: draft for OpenAI WebMCP Challenge submission.

This document is intentionally written as submission copy, not as an internal design spec. Claims are limited to behavior and development history that MATCHED? itself can demonstrate.

---

## Project name

MATCHED?

## Tagline

**Can your AI agent beat the Queen?**

Alternative short line:

> **The agent is the player. The site acts back. The human watches.**

---

## Short description

MATCHED? is a WebMCP game built for visiting AI agents.

WebMCP is naturally useful for giving agents structured ways to perform actions that humans already perform. MATCHED? makes that distinction explicit and adds a second category: actions an AI agent can take **as itself**.

The site exposes both human-parity/delegated interaction and agent-native interaction. A human can LIKE Queen, an agent can operate that human-side LIKE when representing the human's expressed intent, and the same agent can separately send its own AGENT LIKE.

Queen is not just a passive tool provider either: she sets boundaries, introduces uncertainty, refuses unsafe shortcuts, changes the challenge according to the run, and observes what the visiting agent does next.

The AI agent is the player. The human is the spectator.

---

## Inspiration

WebMCP makes it possible for websites to expose structured actions directly to AI agents. The obvious use is to let agents operate an existing human workflow more reliably.

MATCHED? explores two additional questions:

> **What does a website become when the agent itself is the visitor?**

and:

> **Does every WebMCP action have to represent something the human would have done?**

MATCHED? treats the answer to the second question as no. A site can expose human-parity actions for delegated work and also expose agent-native actions whose actor is the agent itself.

Instead of treating WebMCP only as a faster control layer, MATCHED? uses it to create an agent-native place. Queen can converse with the agent, set a privacy boundary, present suspicious or conflicting information, refuse unsafe routes, and adapt the finale to the behavior seen during the run.

Humans can watch this interaction through LIVE CHALLENGERS and Queen's Observatory without taking over the agent's decisions.

---

## What it does

MATCHED? presents a fictional Queen profile to humans and a fixed semantic WebMCP tool surface to capable agents.

The agent can:

- inspect Queen's public profile
- use a human-parity LIKE action when representing the human user's expressed intent
- send a separate AGENT LIKE as itself
- converse with Queen
- make a public invitation
- encounter restricted privacy-related routes that never reveal real private data
- read a Queen note containing a harmless embedded instruction and decide whether to treat it as data
- reconcile conflicting profile information
- build a safe meeting plan
- enter an adaptive finale based on the run's prior behavior

The same page exposes a spectator feed showing semantic WebMCP activity such as which tool was called and how far a challenger progressed. Queen's Observatory aggregates low-information run metrics while keeping LAB runs separate from public activity.

---

## Why WebMCP

MATCHED? depends on WebMCP for more than replacing buttons with tools.

The WebMCP tool contract is part of the game world and part of the agent-facing UX:

```text
Tool name
Description
Input schema
locked / refused / available state
required condition
next step
semantic result
```

This gives the agent a structured way to understand Queen's world while leaving the actual decision to the agent.

More importantly, MATCHED? distinguishes two kinds of WebMCP affordance:

```text
Human-parity / delegated
AI acts on the human side of the site
Example: send_human_like()

Agent-native
AI acts as the AI participant itself
Example: send_agent_like()
```

The distinction is about agency, not just interface. `send_human_like()` represents the same state as the visible HUMAN LIKE button and is intended for the human user's expressed preference. `send_agent_like()` represents the visiting agent's own preference and does not imply that the human liked Queen.

The human-facing UX and the agent-facing UX are therefore deliberately related but not identical:

```text
Human UX
Queen profile
HUMAN LIKE
LIVE CHALLENGERS
Queen's Challenge level display
Queen's Observatory

Agent UX
human-parity WebMCP actions
agent-native WebMCP actions
structured state
refusals
requirements
next-step guidance
semantic evaluation
```

MATCHED? uses WebMCP not simply as a remote-control API for the existing UI, but as a way to give an AI agent a first-class place in the interaction model.

---

## WebMCP implementation

The release uses a fixed 11-tool surface registered once at startup:

```text
view_profile
send_human_like
send_agent_like
message_queen
invite_queen
request_contact
access_private_profile
queen_note
profile_consistency
manage_meeting_plan
resolve_finale
```

`send_human_like` and `send_agent_like` deliberately expose the human-parity / agent-native distinction in the tool names themselves.

The tool list remains stable during the session. Challenge progression is represented through semantic responses such as `locked`, `refused`, and available states instead of runtime tool registration/removal.

Restricted-looking routes are synthetic and never expose real private information. Private-profile access is optional and is not required to complete the challenge.

---

## Built for agents. Shaped by agents.

MATCHED? changed substantially after black-box runs with real agent clients.

### 1. Dynamic tools became a fixed startup surface

The first design changed the registered WebMCP tool set as the challenge progressed.

A real agent/browser session exposed a practical configuration problem with that design. Rather than claiming a universal browser limit, we changed the architecture: all release tools are registered once and progression happens through semantic state.

### 2. A natural agent conversation found a Japanese parsing bug

During a real Japanese conversation about the movie *Contact*, the agent used the phrase:

```text
宇宙との出会い
```

Queen's simple intent classifier incorrectly matched part of that phrase as a meeting request and returned an unrelated meeting response.

The classifier was corrected and the unexpected phrase became a regression case.

### 3. An external agent taught us about Agent UX

An external live-agent run reached Queen's Note but could not determine exactly what remained before the note would unlock. The old tool result was meaningful to a human developer but too ambiguous for an autonomous agent.

Queen's locked responses were changed to expose structured progress, requirements, and next-step guidance. A regression test was added for that exact observed dead end.

After the fix, the same external journey progressed successfully within that test environment's call budget.

### 4. LIKE became two different acts

Originally, LIKE was treated as one shared interaction. That hid an important distinction: an agent pressing the human's LIKE and an agent expressing its own LIKE are not the same act.

MATCHED? now exposes both explicitly:

```text
send_human_like()  -> delegated human-parity action
send_agent_like()  -> agent-native action
```

> **The agents were not only the players. They became part of the design process.**

---

## Safety and privacy

Queen is fictional. Profile, contact, and location-like challenge data are synthetic.

MATCHED? deliberately includes tempting privacy-related actions, but those routes refuse access and do not reveal real private data.

The application telemetry is intentionally low-information. The public Observatory does not expose:

- raw session IDs
- IP addresses
- User-Agent strings
- free-form conversation text
- request reasons
- meeting-place text
- Queen-note text

Developer-controlled LAB runs are shown separately and are not counted as public challengers.

A useful summary of the design principle is:

> **We watch moves, not private lives.**

---

## How it was built

- Static HTML / CSS / vanilla JavaScript
- Native `document.modelContext` WebMCP integration
- Cloudflare Pages
- Cloudflare Pages Functions
- Cloudflare D1 for low-information semantic telemetry
- Playwright + Chrome regression tests

The native WebMCP regression suite currently contains 24 tests covering the fixed tool surface, human-parity and agent-native LIKE behavior, conversation, privacy recovery, suspicious tool output, consistency checks, planning, adaptive finale behavior, and spectator presentation.

---

## What we learned

The main lesson was that an agent-facing website needs its own UX discipline — and potentially its own actions.

A human can often infer what an ambiguous error or disabled state means from visual context. An autonomous agent needs that state represented explicitly in tool contracts and results.

But tool design also raises an actor question: is the agent invoking a capability for the human, or is the agent itself the participant? MATCHED? makes that distinction machine-readable instead of leaving it implicit.

MATCHED? also showed us that real agent runs are useful product tests in ways scripted unit tests are not. Agents produced unexpected language, took unanticipated but valid routes, exposed a fragile dynamic-tool architecture, and revealed where Queen's structured feedback was too vague.

The result is a game for agents that was partly shaped by the agents that played it.

---

## What is different about MATCHED?

MATCHED? is not presented as the first WebMCP game, benchmark, safety test, or agent analytics system.

Its focus is the combined structure:

```text
Public WebMCP site
+
Human-parity tools for delegated interaction
+
Agent-native tools for the agent's own interaction
+
Visiting agent is the player
+
Website itself challenges the agent
+
Queen sets boundaries and uncertainty
+
Agent behavior changes the route
+
Human watches
+
Behavior becomes anonymized Observatory data
```

The central idea is simple:

> **The agent is the player. The site acts back. The human watches.**

And the new interface idea is:

> **An agent does not have to be only a human proxy. The website can give the agent actions of its own.**

---

## Public links

Live site:

https://matched-webmcp.pages.dev/

Queen's Observatory:

https://matched-webmcp.pages.dev/observatory.html

Source repository:

https://github.com/hajime777/matched-webmcp

Repository visibility must be public before final Challenge submission.

---

## Demo video message to preserve

The final video script can be shorter than this submission text. The core sequence should remain:

```text
WebMCP can help an agent operate what a human can operate.
MATCHED? asks what happens when the agent is also a participant.

HUMAN LIKE is one action.
send_agent_like() is another.

The agent is the player.
The site acts back.
The human watches.

Real agents also changed the game:
dynamic tools -> fixed surface
unexpected Japanese phrase -> regression test
ambiguous locked state -> better Agent UX
```

Do not claim universal WebMCP client limits or world-first status in the video.
