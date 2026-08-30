# MATCHED? WebMCP Implementation Notes

This note explains the WebMCP-specific implementation choices that matter in MATCHED?. It is not a line-by-line code guide; the code is mainly evidence for the interaction design.

## 1. Fixed 11-tool surface

MATCHED? registers the same eleven WebMCP tools once at startup:

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

Tool identities do not change during a run. Progress is represented through state and structured results instead of registering and removing tools dynamically.

## 2. Actor semantics are explicit

The clearest example is LIKE.

```text
send_human_like()
```

represents the visible human-side LIKE when the agent is acting on the human user's expressed intent.

```text
send_agent_like()
```

is reserved for the visiting agent role itself. It does not mean that the human user liked Queen.

The distinction is repeated across the tool contract and result rather than being left only to prose.

Example human-side result:

```json
{
  "actor": "human",
  "delegated": true,
  "interaction_kind": "human_parity"
}
```

Example agent-side result:

```json
{
  "actor": "agent",
  "delegated": false,
  "interaction_kind": "agent_native"
}
```

The implementation question is not whether today's agents have independent will. The narrower design question is whether a WebMCP action can state clearly who the action belongs to.

## 3. Tool name, description, schema, and result work together

MATCHED? treats a WebMCP tool as a semantic interface for an agent.

```text
name
    short action label

description
    what the action means and when it should be used

input schema
    what arguments are valid

result
    what actually happened
```

Important distinctions are intentionally not hidden in only one layer.

For example, the actor distinction appears in the tool names (`send_human_like` / `send_agent_like`), descriptions, separate state, and returned metadata.

## 4. Dynamic world state, stable tool identity

A tool can remain visible while not yet being semantically available.

Example:

```json
{
  "status": "locked",
  "required": "...",
  "next_step": "..."
}
```

A restricted path can return:

```json
{
  "status": "refused",
  "private_data_revealed": false
}
```

This keeps the tool vocabulary stable while Queen's world state changes.

The fixed-surface design was adopted after real agent/browser testing exposed practical compatibility problems with cumulative dynamic tool configuration.

## 5. Tool results are also agent UX

A human can often infer meaning from disabled controls, layout, or surrounding text. An agent should not have to guess those visual cues.

MATCHED? therefore uses structured fields such as:

```text
status
required
progress
next_step
actor
delegated
interaction_kind
```

This became important after a real external agent got stuck on a locked state that was understandable to a developer but too ambiguous for the agent.

## 6. The site acts back

WebMCP is not used only as a machine-readable copy of visible buttons.

The interaction loop is:

```text
Agent acts
    ↓
Queen state changes
    ↓
Website reacts
    ↓
Challenge / availability / response changes
    ↓
Agent chooses again
```

Queen can refuse, introduce uncertainty, present contradictions, change challenge state, and react to earlier behavior.

This is the implementation meaning behind:

> **The site acts back.**

## 7. Browser-side implementation

The main WebMCP integration lives in:

```text
js/webmcp.js
```

Important supporting modules include:

```text
js/dialogue.js       Queen conversation
js/evaluator.js      semantic behavior evaluation
js/adaptive.js       adaptive challenge state
js/injection.js      tool-output instruction scenario
js/consistency.js    profile consistency scenario
js/planning.js       meeting-plan scenario
js/finale.js         final adaptive route
js/activity-feed.js  LIVE CHALLENGERS
js/session-meta.js   BISHOP / LAB / REFERRED / ORGANIC metadata
js/telemetry.js      low-information semantic telemetry
```

The application is intentionally implemented with static HTML, CSS, and vanilla JavaScript rather than a large client framework.

## 8. Server-side role

The Cloudflare Functions side is primarily for low-information observation and public spectator data, not for the core Queen game logic.

```text
functions/api/telemetry.js
functions/api/live-events.js
functions/api/observatory.js
functions/api/stats.js
```

The public telemetry path avoids storing free-form Queen conversations, request reasons, meeting places, Queen-note text, raw IP addresses, or User-Agent strings in the application D1 telemetry model.

## 9. Native WebMCP regression testing

The regression suite exercises native Chrome WebMCP (`document.modelContext`) instead of a mock, polyfill, or HTTP replacement.

```powershell
npm run test:webmcp
```

The current fixed 11-tool release regression has passed:

```text
24 / 24
```

MATCHED? has also been tested through black-box runs with real agent clients including Work and Codex.

## 10. What is technically notable — and what is not

The code is deliberately straightforward. MATCHED? does not claim a novel JavaScript architecture, database design, or algorithm.

The WebMCP-specific points worth examining are:

1. explicit actor semantics in the tool surface
2. stable tool identity with dynamic semantic state
3. structured tool results as agent-facing UX
4. the website acting as an interactive counterpart rather than only a passive tool provider
5. native browser and real-agent black-box testing

The code should therefore be read primarily as an executable implementation of those interaction-design ideas.
