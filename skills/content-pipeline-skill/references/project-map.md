# Project Map

## Current execution surface

Use `content-ops-platform` as the execution backend.

Main areas:

- `apps/api-server`
  REST API for content, themes, accounts, and drafts

- `apps/web-admin`
  human review console for content, accounts, theme preview, and draft tasks

- `prisma/schema.prisma`
  source of truth for content, version, account, and draft tables

## Core API flow

### Create or import content

- `POST /api/content/import-markdown`
  create a new content item and version 1

- `GET /api/content`
  query content list with pagination and filters

- `GET /api/content/:contentId`
  inspect latest version and version history

- `POST /api/content/:contentId/versions`
  create a new version for revisions

### Preview theme output

- `GET /api/themes?platform=WECHAT_OFFICIAL`
  list themes

- `POST /api/themes/render-preview`
  render HTML preview from Markdown + theme

### Manage accounts

- `GET /api/channel-accounts`
  list masked account summaries

- `POST /api/channel-accounts`
  create an account with encrypted credentials

- `PATCH /api/channel-accounts/:accountId`
  update account metadata or credentials

- `POST /api/channel-accounts/:accountId/validate`
  validate account configuration

### Draft creation and tracking

- `POST /api/drafts`
  create a draft task

- `GET /api/drafts`
  list tasks

- `GET /api/drafts/:publishJobId`
  inspect task detail and error message

- `POST /api/drafts/:publishJobId/retry`
  retry a failed draft task when context exists

## Current Web console map

- `/dashboard`
  summary and shortcut entry points

- `/content`
  import, search, view versions, create versions

- `/themes`
  preview rendered HTML and copy output

- `/accounts`
  create, edit, and validate channel accounts

- `/drafts`
  create draft tasks, inspect status, retry failures
