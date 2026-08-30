# External WebMCP Discovery Notes

## 2026-08-30

MATCHED? is publicly deployed and its repository is public.

An external community directory (`webmcp.com`) discovered the site, which demonstrates a real external discovery path:

```text
Public deployment
    ↓
External crawler / directory
    ↓
WebMCP site listing
```

At the time of observation, the directory still showed an older MATCHED? tool surface:

```text
10 tools
send_like
```

The current release exposes:

```text
11 tools
send_human_like
send_agent_like
```

This is useful operational evidence that an external Agent-facing discovery layer can become stale after a site's WebMCP tool surface changes.

It should not be treated as a WebMCP protocol failure; it is an external crawling / indexing freshness issue.

### Same-day recheck

A later public recheck on 2026-08-30 still reported:

```text
10 tools
send_like
```

while the deployed/repository release remains on the fixed 11-tool surface.

The directory detail page also showed at least one internally inconsistent cached tool record (an old tool name paired with description/schema content belonging to a different current action). This strengthens the interpretation that the directory entry is stale or partially refreshed rather than reflecting the current MATCHED? implementation.

Treat the live site and repository release as the source of truth for the submitted tool surface.

### Follow-up

After the 11-tool surface remains stable:

- check whether the directory refreshes automatically
- use a directory rescan mechanism if available and appropriate
- confirm that the external listing reports 11 tools
- confirm that `send_human_like` and `send_agent_like` replace the old `send_like`
- record the observed refresh delay if it can be determined

This is an observation task, not a release blocker.
