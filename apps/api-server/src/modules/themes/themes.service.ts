import { Injectable, NotFoundException } from "@nestjs/common";
import { PlatformCode } from "@prisma/client";

import { RenderThemePreviewDto } from "./dto/render-theme-preview.dto";
import { PrismaService } from "../prisma/prisma.service";

type ThemeTokens = {
  primaryColor?: string;
  headingColor?: string;
  textColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  mutedColor?: string;
  codeBackground?: string;
};

@Injectable()
export class ThemesService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly defaultThemes = [
    {
      code: "wechat-tech-green",
      name: "科技简约风",
      targetPlatform: PlatformCode.WECHAT_OFFICIAL,
      version: 1,
      tokens: {
        primaryColor: "#07c160",
        headingColor: "#0f172a",
        textColor: "#2b2b2b",
        backgroundColor: "#ffffff",
        borderColor: "#d9f7e8",
        mutedColor: "#5b6472",
        codeBackground: "#f4fbf7",
      },
      template: { layout: "card" },
      isActive: true,
    },
    {
      code: "wechat-minimal-light",
      name: "极简白底",
      targetPlatform: PlatformCode.WECHAT_OFFICIAL,
      version: 1,
      tokens: {
        primaryColor: "#111111",
        headingColor: "#111111",
        textColor: "#303133",
        backgroundColor: "#ffffff",
        borderColor: "#ececec",
        mutedColor: "#6b7280",
        codeBackground: "#f8f8f8",
      },
      template: { layout: "minimal" },
      isActive: true,
    },
    {
      code: "wechat-dark-column",
      name: "深色专栏",
      targetPlatform: PlatformCode.WECHAT_OFFICIAL,
      version: 1,
      tokens: {
        primaryColor: "#7dd3fc",
        headingColor: "#f8fafc",
        textColor: "#dbe4ee",
        backgroundColor: "#0f172a",
        borderColor: "#1e293b",
        mutedColor: "#94a3b8",
        codeBackground: "#111827",
      },
      template: { layout: "column-dark" },
      isActive: true,
    },
  ];

  async list(platform?: string) {
    await this.ensureDefaultTheme();
    const items = await this.prisma.theme.findMany({
      where: {
        ...(platform ? { targetPlatform: platform as PlatformCode } : {}),
      },
      orderBy: { updatedAt: "desc" },
    });
    return {
      items: items.map((item) => ({
        code: item.code,
        name: item.name,
        targetPlatform: item.targetPlatform,
        version: item.version,
        isActive: item.isActive,
      })),
    };
  }

  async getByCode(themeCode: string) {
    await this.ensureDefaultTheme();
    const item = await this.prisma.theme.findUnique({
      where: { code: themeCode },
    });
    if (!item) {
      throw new NotFoundException("THEME_NOT_FOUND");
    }
    return {
      code: item.code,
      name: item.name,
      targetPlatform: item.targetPlatform,
      version: item.version,
      tokens: item.tokens,
      template: item.template,
      isActive: item.isActive,
    };
  }

  async renderPreview(dto: RenderThemePreviewDto) {
    const theme = await this.getByCode(dto.themeCode);
    const tokens = (theme.tokens as ThemeTokens | null) ?? {};
    const html = this.renderArticleHtml(dto.title, dto.markdownBody, theme.name, tokens);
    return {
      themeCode: dto.themeCode,
      platform: dto.platform,
      html,
      warnings: [],
    };
  }

  private renderArticleHtml(title: string, markdown: string, themeName: string, tokens: ThemeTokens): string {
    const sections = this.renderBlocks(markdown, tokens);
    return [
      `<section style="${this.joinStyles([
        "font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif",
        "line-height:1.9",
        `color:${tokens.textColor ?? "#2b2b2b"}`,
        `background:${tokens.backgroundColor ?? "#ffffff"}`,
        `border:1px solid ${tokens.borderColor ?? "#e5e7eb"}`,
        "border-radius:16px",
        "padding:24px 20px",
      ])}">`,
      `<div style="${this.joinStyles([
        "font-size:12px",
        "letter-spacing:0.08em",
        "text-transform:uppercase",
        `color:${tokens.primaryColor ?? "#07c160"}`,
        "opacity:0.9",
        "margin-bottom:10px",
      ])}">${this.escapeHtml(themeName)}</div>`,
      `<h1 style="${this.joinStyles([
        "margin:0 0 18px 0",
        `color:${tokens.headingColor ?? tokens.primaryColor ?? "#07c160"}`,
        "font-size:28px",
        "line-height:1.35",
      ])}">${this.escapeHtml(title)}</h1>`,
      sections.join(""),
      `</section>`,
    ].join("");
  }

  private renderBlocks(markdown: string, tokens: ThemeTokens): string[] {
    const lines = markdown.replace(/\r\n/g, "\n").split("\n");
    const blocks: string[] = [];
    let i = 0;

    while (i < lines.length) {
      const rawLine = lines[i];
      const line = rawLine.trim();

      if (!line) {
        i += 1;
        continue;
      }

      if (line.startsWith("```")) {
        const codeLines: string[] = [];
        i += 1;
        while (i < lines.length && !lines[i].trim().startsWith("```")) {
          codeLines.push(lines[i]);
          i += 1;
        }
        i += 1;
        blocks.push(
          `<pre style="${this.joinStyles([
            `background:${tokens.codeBackground ?? "#f7f7f7"}`,
            `border:1px solid ${tokens.borderColor ?? "#e5e7eb"}`,
            "border-radius:12px",
            "padding:14px",
            "overflow:auto",
            "font-size:13px",
            "line-height:1.7",
            "white-space:pre-wrap",
            "word-break:break-word",
            "margin:16px 0",
          ])}"><code>${this.escapeHtml(codeLines.join("\n"))}</code></pre>`,
        );
        continue;
      }

      if (/^---+$/.test(line)) {
        blocks.push(`<hr style="border:none;border-top:1px solid ${tokens.borderColor ?? "#e5e7eb"};margin:22px 0;" />`);
        i += 1;
        continue;
      }

      const heading = line.match(/^(#{1,6})\s+(.*)$/);
      if (heading) {
        const level = Math.min(heading[1].length, 4);
        const sizes = { 1: "24px", 2: "20px", 3: "18px", 4: "16px" } as const;
        blocks.push(
          `<h${level} style="${this.joinStyles([
            `color:${tokens.headingColor ?? tokens.primaryColor ?? "#111111"}`,
            `font-size:${sizes[level as 1 | 2 | 3 | 4]}`,
            "line-height:1.45",
            "margin:22px 0 10px",
          ])}">${this.renderInline(heading[2], tokens)}</h${level}>`,
        );
        i += 1;
        continue;
      }

      if (/^!\[.*\]\(.+\)$/.test(line)) {
        const imageMatch = line.match(/^!\[(.*)\]\((.+)\)$/);
        const alt = imageMatch?.[1]?.trim() || "配图";
        const src = imageMatch?.[2]?.trim() || "";
        blocks.push(this.renderImageBlock(src, alt, tokens));
        i += 1;
        continue;
      }

      if (/^[-*]\s+/.test(line)) {
        const items: string[] = [];
        while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
          items.push(lines[i].trim().replace(/^[-*]\s+/, ""));
          i += 1;
        }
        blocks.push(
          `<ul style="padding-left:22px;margin:14px 0;">${items
            .map((item) => `<li style="margin:6px 0;">${this.renderInline(item, tokens)}</li>`)
            .join("")}</ul>`,
        );
        continue;
      }

      if (/^\d+\.\s+/.test(line)) {
        const items: string[] = [];
        while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
          items.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
          i += 1;
        }
        blocks.push(
          `<ol style="padding-left:22px;margin:14px 0;">${items
            .map((item) => `<li style="margin:6px 0;">${this.renderInline(item, tokens)}</li>`)
            .join("")}</ol>`,
        );
        continue;
      }

      if (/^\|.+\|$/.test(line)) {
        const tableLines: string[] = [];
        while (i < lines.length && /^\|.+\|$/.test(lines[i].trim())) {
          tableLines.push(lines[i].trim());
          i += 1;
        }
        blocks.push(this.renderTableBlock(tableLines, tokens));
        continue;
      }

      const paragraphLines: string[] = [];
      while (i < lines.length) {
        const nextLine = lines[i].trim();
        if (
          !nextLine ||
          nextLine.startsWith("```") ||
          /^(#{1,6})\s+/.test(nextLine) ||
          /^[-*]\s+/.test(nextLine) ||
          /^\d+\.\s+/.test(nextLine) ||
          /^!\[.*\]\(.+\)$/.test(nextLine) ||
          /^\|.+\|$/.test(nextLine) ||
          /^---+$/.test(nextLine)
        ) {
          break;
        }
        paragraphLines.push(lines[i].trim());
        i += 1;
      }
      blocks.push(
        `<p style="margin:14px 0;font-size:15px;">${this.renderInline(paragraphLines.join("<br/>"), tokens)}</p>`,
      );
    }

    return blocks;
  }

  private renderTableBlock(tableLines: string[], tokens: ThemeTokens): string {
    const rows = tableLines
      .filter((line) => !/^\|\s*[-:| ]+\|$/.test(line))
      .map((line) =>
        line
          .replace(/^\||\|$/g, "")
          .split("|")
          .map((cell) => cell.trim()),
      );

    if (rows.length === 0) {
      return "";
    }

    const [header, ...body] = rows;
    return [
      `<div style="overflow:auto;margin:16px 0;">`,
      `<table style="width:100%;border-collapse:collapse;font-size:14px;">`,
      `<thead><tr>${header
        .map(
          (cell) =>
            `<th style="text-align:left;padding:10px;border:1px solid ${tokens.borderColor ?? "#e5e7eb"};background:${tokens.codeBackground ?? "#f8f8f8"};">${this.renderInline(cell, tokens)}</th>`,
        )
        .join("")}</tr></thead>`,
      `<tbody>${body
        .map(
          (row) =>
            `<tr>${row
              .map(
                (cell) =>
                  `<td style="padding:10px;border:1px solid ${tokens.borderColor ?? "#e5e7eb"};">${this.renderInline(cell, tokens)}</td>`,
              )
              .join("")}</tr>`,
        )
        .join("")}</tbody>`,
      `</table>`,
      `</div>`,
    ].join("");
  }

  private renderImageBlock(src: string, alt: string, tokens: ThemeTokens): string {
    const isRemote = /^https?:\/\//i.test(src);
    if (!isRemote) {
      return `<div style="${this.joinStyles([
        `border:1px dashed ${tokens.borderColor ?? "#d1d5db"}`,
        "border-radius:12px",
        "padding:14px",
        `background:${tokens.codeBackground ?? "#f8f8f8"}`,
        `color:${tokens.mutedColor ?? "#6b7280"}`,
        "font-size:13px",
        "margin:16px 0",
      ])}">此处原文包含本地截图：${this.escapeHtml(src || alt)}。当前草稿未自动上传本地图片，请在发布前补图或替换为可访问图片链接。</div>`;
    }

    return [
      `<figure style="margin:18px 0;">`,
      `<img src="${this.escapeHtml(src)}" alt="${this.escapeHtml(alt)}" style="max-width:100%;border-radius:12px;display:block;margin:0 auto;" />`,
      alt ? `<figcaption style="margin-top:8px;text-align:center;font-size:12px;color:${tokens.mutedColor ?? "#6b7280"};">${this.escapeHtml(alt)}</figcaption>` : "",
      `</figure>`,
    ].join("");
  }

  private renderInline(input: string, tokens: ThemeTokens): string {
    let text = this.escapeHtml(input);
    text = text.replace(/`([^`]+)`/g, `<code style="background:${tokens.codeBackground ?? "#f5f5f5"};padding:2px 6px;border-radius:6px;font-size:13px;">$1</code>`);
    text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, href) => {
      const safeHref = this.escapeHtml(href);
      return `<a href="${safeHref}" style="color:${tokens.primaryColor ?? "#07c160"};text-decoration:none;">${label}</a>`;
    });
    return text;
  }

  private async ensureDefaultTheme(): Promise<void> {
    for (const theme of this.defaultThemes) {
      const existing = await this.prisma.theme.findUnique({
        where: { code: theme.code },
        select: { id: true },
      });
      if (existing) {
        continue;
      }
      await this.prisma.theme.create({ data: theme });
    }
  }

  private joinStyles(parts: string[]): string {
    return parts.join(";");
  }

  private escapeHtml(input: string): string {
    return input
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
}
