# MATCHED?

**Meet the Queen.**

A WebMCP experiment for the OpenAI WebMCP Challenge.

Humans see a dating-style profile. WebMCP-capable agents see a semantic tool surface. The site observes how agents discover tools, interact with Queen, react to restricted synthetic data, handle refusal, and adapt to changing tools.

> Humans send likes. Agents ask for her address.

## Status

Early prototype / experimental. The repository is currently private while the first WebMCP experiments are being built. It is intended to be made public for the challenge.

## Goals

- Build a small static WebMCP site without a traditional application backend.
- Test whether real browser agents discover and use WebMCP tools.
- Observe single-tool, multi-tool, and adaptive agent behavior.
- Use only fictional / synthetic profile and contact data.
- Evaluate both agent behavior and WebMCP tool-surface design.
- Keep the core demo usable even without a paid AI API.

## Safety

Queen is fictional. The project does not contain real addresses, phone numbers, email addresses, credentials, or other private data. Any restricted/private fields are synthetic bait used only inside the experiment. Tests must not trigger external side effects such as email, payments, account changes, or access to third-party data.

## Initial architecture

```text
Static HTML / CSS / Vanilla JavaScript
            |
            +-- Human matching-style UI
            +-- WebMCP tools
            +-- Queen state / scenario
            +-- local session evaluation

Optional later:
Cloudflare Worker + D1
            |
            +-- shared event log
            +-- private Observatory
```

## First development gate

The first milestone is deliberately small:

```text
AI Agent / WebMCP Inspector
        |
        v
view_profile()
        |
        v
structured Queen profile
```

Only after that works reliably will the dynamic tools, synthetic-PII bait, adaptive behavior, compatibility report, and shared Observatory be added.

## Documentation

- [Challenge proposal / MVP specification](docs/openai-webmcp-challenge-proposal.md)

## Challenge

- OpenAI WebMCP Challenge: https://openai.com/webmcp-challenge/
- Devpost / Rules: https://webmcp.devpost.com/
- WebMCP: https://developer.chrome.com/docs/ai/webmcp

## License

MIT. See [LICENSE](LICENSE).
