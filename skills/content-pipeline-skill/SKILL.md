---
name: content-pipeline-skill
description: "Generate, rewrite, format, review, preview, and draft AI-written articles through content-ops-platform. Use when the request is about turning a topic, outline, AI draft, or Markdown article into a publishable content workflow: creating or revising content items, generating WeChat-ready Markdown, choosing themes, previewing HTML, selecting channel accounts, creating draft tasks, retrying failed drafts, or preparing future multi-platform variants. Typical triggers include requests like 'write a WeChat article', 'rewrite this into a public account version', 'import this Markdown and create a draft', 'preview this article with a theme', 'push this content to the draft box', '生成公众号文章', '改写成公众号版本', '导入 Markdown 并推送草稿', and '根据主题生成排版预览'."
---

# Content Pipeline Skill

Use this skill for the everyday content workflow that starts with an idea, AI draft, or rough Markdown and ends with a reviewable draft task inside `content-ops-platform`.

## Typical Requests

Use this skill when the request sounds like one of these:

- write a WeChat article from a topic
- rewrite this draft into a public account version
- import this Markdown and push it to the draft box
- create a new version for this article and preview the theme
- generate a platform-ready article, let me review it, then create a draft
- 生成一篇公众号文章
- 把这篇 Markdown 改写成公众号版本
- 导入内容并生成草稿
- 预览这个主题排版效果
- 用当前账号把这篇文章推到草稿箱

## Workflow

1. Clarify the source material.
Use one of these entry points:
- topic or keyword
- rough outline
- existing Markdown
- an existing content item inside `content-ops-platform`

2. Produce or refine Markdown first.
- Keep the working source in Markdown, not HTML
- Treat HTML as a render output only
- Prefer creating a new content item for a new topic
- Prefer creating a new content version when revising an existing item

3. Pick the publishing target before styling.
- Default current target is `WECHAT_OFFICIAL`
- Choose the theme before rendering preview
- Keep platform-specific wording in the content version history, not only in the final draft task

4. Preview before drafting.
- Render HTML with a theme preview step
- Check title, section rhythm, quote/code block layout, and CTA wording
- If visual problems appear, fix the Markdown or theme choice first, then re-render

5. Keep human confirmation as the release gate.
- For now, stop at draft creation unless the user explicitly wants more automation
- Surface the rendered result, selected account, and target theme before submission when the consequences are non-obvious

6. Submit and track.
- Create the draft task
- Poll task status if the workflow requires confirmation
- When failures happen, surface the exact failure stage and retry from the task center when possible

## Operating Rules

- Use the current project as the execution backend when the workspace is `content-ops-platform`
- Prefer existing REST APIs and database-backed flows over inventing new ad hoc scripts
- Reuse the existing Web console for human review states
- Keep account secrets out of responses; the platform already stores them encrypted and returns masked summaries
- When revising content, preserve version history instead of overwriting prior Markdown

## Decision Guide

Choose the action that matches the request:

- New article from a topic:
  create a content item, save version 1, render preview, then create a draft task

- Revision of an existing article:
  load the current content item, create a new version, re-render preview, then create a new draft task

- Theme/style exploration:
  work only in preview mode until the user confirms the direction

- Account or platform issue:
  validate account config first, then retry draft creation

- Draft task failure:
  inspect task details, keep the error message, retry only after the cause is understood

## Project Mapping

When working inside this repository, use these areas:

- Web console:
  `apps/web-admin`

- API server:
  `apps/api-server`

- Schema and seed data:
  `prisma`

- Strategy and implementation docs:
  `docs`

Read these reference files when needed:

- Workflow/API map:
  `references/project-map.md`

- OpenClaw and long-term architecture:
  `references/openclaw-integration.md`

## Success Criteria

The skill run is successful when it achieves all of the following:

- Markdown exists as the canonical source
- The content item or content version is stored in the platform
- A theme preview has been rendered or consciously skipped
- The target account and platform are explicit
- A draft task exists or the exact blocker is recorded




