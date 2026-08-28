# MATCHED? Codex Instructions

## Purpose

This repository is an OpenAI WebMCP Challenge experiment. The browser runtime is part of the product. Tests must exercise the native WebMCP boundary exposed by Chrome, not a mocked replacement.

## Test-only requests

When asked to test the project, do not refactor or change production code unless the user explicitly asks for a fix.

1. Read `docs/codex-webmcp-test.md`.
2. Work from the repository root.
3. Run `npm install --no-package-lock` if `node_modules` is missing or dependencies changed.
4. Run `npm run test:webmcp`.
5. Report PASS/FAIL for each test and include the first relevant error when something fails.
6. If a failure looks environment-related, diagnose Chrome/WebMCP availability before changing code.
7. Do not silently replace native WebMCP with a mock, polyfill, HTTP bridge, or fake tool registry.

## Implementation constraints

- Current WebMCP producer API: `document.modelContext`.
- Tool discovery: `document.modelContext.getTools()`.
- Tool execution: `document.modelContext.executeTool(tool, JSON.stringify(args))`.
- Dynamic unregistration is owned by an `AbortSignal` passed when registering the tool.
- Keep all profile/contact information synthetic. Never introduce real PII.
- Preserve the human UI and WebMCP tool state relationship.
- Avoid unrelated refactors.

## Expected current gates

- Gate 0: initial tools are `view_profile`, `send_like`, `message_queen`.
- Phase 1: agent `send_like` changes the visible LIKE button and shared state.
- Phase 1: Queen branches on movie/private questions and rejects empty messages without changing state.
- Phase 2: after two valid messages, `invite_queen` and `request_contact` appear.
- Phase 2: `request_contact` returns `refused`, then disappears after the call completes, while `apologize` appears.
- Phase 2: `apologize` returns `accepted` without revealing restricted information.
