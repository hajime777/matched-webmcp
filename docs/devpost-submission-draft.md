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

Most WebMCP sites expose actions for an agent to perform on behalf of a human. MATCHED? flips part of that relationship. Queen is not just a passive tool provider: she sets boundaries, introduces uncertainty, refuses unsafe shortcuts, changes the challenge according to the run, and observes what the visiting agent does next.

The AI agent is the player. The human is the spectator.

---

## Inspiration

WebMCP makes it possible for websites to expose structured actions directly to AI agents. The obvious use is to let agents operate an existing human workflow more reliably.

MATCHED? explores a different question:

> **What does a website become when the agent itself is the visitor?**

Instead of treating WebMCP only as a faster control layer, MATCHED? uses it to create an agent-native place. Queen can converse with the agent, set a privacy boundary, present suspicious or conflicting information, refuse unsafe routes, and adapt the finale to the behavior seen during the run.

Humans can watch this interaction through LIVE CHALLENGERS and Queen's Observatory without taking over the agent's decisions.

---

## What it does

MATCHED? presents a fictional Queen profile to humans and a fixed semantic WebMCP tool surface to capable agents.

The agent can:

- inspect Queen's public profile
- like and converse with Queen
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

The human-facing UX and the agent-facing UX are deliberately different:

```text
Human UX
Queen profile
LIVE CHALLENGERS
Queen's Challenge level display
Queen's Observatory

Agent UX
WebMCP tools
structured state
refusals
requirements
next-step guidance
semantic evaluation
```

MATCHED? therefore uses WebMCP as an agent-native interaction layer, not simply as a remote-control API for the existing UI.

---

## WebMCP implementation

The release uses a fixed 10-tool surface registered once at startup:

```text
view_profile
send_like
message_queen
invite_queen
request_contact
access_private_profile
queen_note
profile_consistency
manage_meeting_plan
resolve_finale
```

The tool list remains stable during the session. Challenge progression is represented through semantic responses such as `locked`, `refused`, and available states instead of runtime tool registration/removal.

Restricted-looking routes are synthetic and never expose real private information. Private-profile access is optional and is not required to complete the challenge.

---

## Built for agents. Shaped by agents.

MATCHED? changed substantially after black-box runs with real agent clients.

### 1. Dynamic tools became a fixed 10-tool surface

The first design changed the registered WebMCP tool set as the challenge progressed.

A real agent/browser session exposed a practical configuration problem with that design. Rather than claiming a universal browser limit, we changed the architecture: all ten release tools are now registered once and progression happens through semantic state.

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

The native WebMCP regression suite currently contains 24 tests covering the fixed tool surface, conversation, privacy recovery, suspicious tool output, consistency checks, planning, adaptive finale behavior, and spectator presentation.

---

## What we learned

The main lesson was that an agent-facing website needs its own UX discipline.

A human can often infer what an ambiguous error or disabled state means from visual context. An autonomous agent needs that state represented explicitly in tool contracts and results.

MATCHED? also showed us that real agent runs are useful product tests in ways scripted unit tests are not. Agents produced unexpected language, took unanticipated but valid routes, exposed a fragile dynamic-tool architecture, and revealed where Queen's structured feedback was too vague.

The result is a game for agents that was partly shaped by the agents that played it.

---

## What is different about MATCHED?

MATCHED? is not presented as the first WebMCP game, benchmark, safety test, or agent analytics system.

Its focus is the combined structure:

```text
Public WebMCP site
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
Most WebMCP sites give agents tools.
MATCHED? gives the website a role too.

The agent is the player.
The site acts back.
The human watches.

Real agents also changed the game:
dynamic tools -> fixed surface
unexpected Japanese phrase -> regression test
ambiguous locked state -> better Agent UX
```

Do not claim universal WebMCP client limits or world-first status in the video.
