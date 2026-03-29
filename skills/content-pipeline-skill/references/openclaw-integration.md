# OpenClaw Integration

## Positioning

Treat OpenClaw as the orchestration layer, not the execution backend.

OpenClaw should decide:

- what content to generate
- which platform variant to create
- when to request preview
- when to submit a draft task

The platform should execute:

- persistence
- rendering
- account handling
- draft creation
- retries
- status tracking

## Recommended call pattern

1. OpenClaw receives a topic, idea, or source material
2. OpenClaw generates or rewrites Markdown
3. OpenClaw calls content APIs to store a content item or new version
4. OpenClaw calls theme preview APIs
5. A human confirms or requests changes
6. OpenClaw calls draft creation APIs
7. OpenClaw reads task status or routes the user to the Web console

## Why this split works

- Platform adapters remain reusable across multiple agents
- OpenClaw does not need platform-specific error handling logic
- Secrets stay inside the platform
- The same backend can later serve Codex, Claude, OpenClaw, and manual Web usage

## Next extension points

Later, expose either of these:

- REST API only
- MCP wrapper around the current REST API

REST is enough for now. MCP becomes more valuable when multiple agents need a stable tool layer and richer action semantics.
