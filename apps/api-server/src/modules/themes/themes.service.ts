import { Injectable, NotFoundException } from "@nestjs/common";
import { PlatformCode } from "@prisma/client";

import { RenderThemePreviewDto } from "./dto/render-theme-preview.dto";
import { PrismaService } from "../prisma/prisma.service";

type ThemeTokens = {
  primaryColor?: string;
  accentColor?: string;
  headingColor?: string;
  textColor?: string;
  backgroundColor?: string;
  surfaceColor?: string;
  softBackground?: string;
  borderColor?: string;
  mutedColor?: string;
  codeBackground?: string;
};

type ThemeTemplate = {
  layout?: string;
};

type HeroSection = {
  title?: string;
  blocks: string[];
};

@Injectable()
export class ThemesService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly defaultThemes = [
    {
      code: "wechat-tech-green",
      name: "科技蓝卡片风",
      targetPlatform: PlatformCode.WECHAT_OFFICIAL,
      version: 2,
      tokens: {
        primaryColor: "#1d4ed8",
        accentColor: "#0f3d91",
        headingColor: "#0f172a",
        textColor: "#1f2937",
        backgroundColor: "#ffffff",
        surfaceColor: "#f7fbff",
        softBackground: "#e8f1ff",
        borderColor: "#d9e7ff",
        mutedColor: "#5b6472",
        codeBackground: "#0f172a",
      },
      template: { layout: "hero-card" },
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
    {
      code: "wechat-superpowers-green",
      name: "森绿长文风",
      targetPlatform: PlatformCode.WECHAT_OFFICIAL,
      version: 1,
      tokens: {
        primaryColor: "#07c160",
        accentColor: "#06ad56",
        headingColor: "#11703f",
        textColor: "#111111",
        backgroundColor: "#ffffff",
        surfaceColor: "#f8fff9",
        softBackground: "#e8f7f0",
        borderColor: "#cfeedd",
        mutedColor: "#5f6b63",
        codeBackground: "#0b1020",
      },
      template: { layout: "superpowers-green" },
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
    const item = await this.prisma.theme.findUnique({ where: { code: themeCode } });
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
    const template = (theme.template as ThemeTemplate | null) ?? {};
    const html = this.renderArticleHtml(dto.title, dto.markdownBody, theme.name, tokens, template);
    return {
      themeCode: dto.themeCode,
      platform: dto.platform,
      html,
      warnings: [],
    };
  }

  private renderArticleHtml(
    title: string,
    markdown: string,
    themeName: string,
    tokens: ThemeTokens,
    template: ThemeTemplate,
  ): string {
    switch (template.layout) {
      case "hero-card":
        return this.renderHeroCardArticle(title, markdown, tokens);
      case "column-dark":
        return this.renderDarkColumnArticle(title, markdown, tokens);
      case "superpowers-green":
        return this.renderSuperpowersArticle(title, markdown, tokens);
      default:
        return this.renderMinimalArticle(title, markdown, tokens);
    }
  }

  private renderMinimalArticle(title: string, markdown: string, tokens: ThemeTokens): string {
    const sections = this.renderBlocks(markdown, tokens, "minimal");
    const cleanTitle = this.stripInlineCodeMarkers(title);
    return [
      `<section style="${this.joinStyles(["font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif", "line-height:1.9", `color:${tokens.textColor ?? "#2b2b2b"}`, `background:${tokens.backgroundColor ?? "#ffffff"}`, `border:1px solid ${tokens.borderColor ?? "#e5e7eb"}`, "border-radius:16px", "padding:24px 20px"])}">`,
      `<h1 style="${this.joinStyles(["margin:0 0 18px 0", `color:${tokens.headingColor ?? tokens.primaryColor ?? "#111111"}`, "font-size:28px", "line-height:1.35"])}">${this.escapeHtml(cleanTitle)}</h1>`,
      sections.join(""),
      `</section>`,
    ].join("");
  }

  private renderHeroCardArticle(title: string, markdown: string, tokens: ThemeTokens): string {
    const sections = this.renderHeroCardBlocks(markdown, tokens);
    return [
      `<section style="${this.joinStyles(["margin:0 auto", "max-width:677px", "font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif", "color:#222222", "line-height:1.75", "font-size:16px", "word-break:break-word"])}">`,
      sections.map((section, index) => this.renderHeroSection(section, tokens, index)).join(""),
      `</section>`,
    ].join("");
  }

  private renderHeroSection(section: HeroSection, tokens: ThemeTokens, index: number): string {
    const isIntro = !section.title;
    const boxStyles = isIntro
      ? [
          "margin:0 0 20px 0",
          "padding:18px 16px",
          `border:1px solid ${tokens.borderColor ?? "#d9e7ff"}`,
          `background:${tokens.surfaceColor ?? "#f7fbff"}`,
          "border-radius:10px",
          "box-sizing:border-box",
        ]
      : [
          "margin:0 0 20px 0",
          "padding:16px",
          `border:${index % 2 === 1 ? `1px solid ${tokens.borderColor ?? "#dbeafe"}` : `1px solid ${tokens.borderColor ?? "#e5e7eb"}`}`,
          `background:${index % 2 === 1 ? tokens.surfaceColor ?? "#f8fbff" : "#ffffff"}`,
          "border-radius:10px",
          "box-sizing:border-box",
        ];

    const titleHtml = section.title
      ? `<p style="margin:0 0 10px 0;font-size:${index === 1 ? "22px" : "18px"};font-weight:700;color:${index === 1 ? "#222222" : tokens.accentColor ?? "#0f3d91"};">${this.escapeHtml(section.title)}</p>`
      : "";

    return [`<section style="${this.joinStyles(boxStyles)}">`, titleHtml, section.blocks.join(""), `</section>`].join("");
  }

  private renderHeroCardBlocks(markdown: string, tokens: ThemeTokens): HeroSection[] {
    const lines = markdown.replace(/\r\n/g, "\n").split("\n");
    const sections: HeroSection[] = [{ blocks: [] }];
    let current = sections[0];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i].trim();
      if (!line) {
        i += 1;
        continue;
      }

      const heading = line.match(/^(#{1,6})\s+(.*)$/);
      if (heading) {
        const level = Math.min(heading[1].length, 4);
        if (level <= 2) {
          current = { title: heading[2], blocks: [] };
          sections.push(current);
        } else {
          current.blocks.push(`<p style="margin:0 0 8px 0;font-size:15px;font-weight:700;color:${tokens.accentColor ?? "#0f3d91"};">${this.renderInline(heading[2], tokens, "hero-card")}</p>`);
        }
        i += 1;
        continue;
      }

      if (/^>\s?/.test(line)) {
        const quoteLines: string[] = [];
        while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
          quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
          i += 1;
        }
        current.blocks.push(`<section style="margin:14px 0;padding:16px;border-left:4px solid ${tokens.accentColor ?? "#0f3d91"};background:#ffffff;box-sizing:border-box;"><p style="margin:0;">${this.renderInline(quoteLines.join("<br/>"), tokens, "hero-card")}</p></section>`);
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
        current.blocks.push(`<section style="margin:0 0 12px 0;padding:16px;border:1px solid ${tokens.borderColor ?? "#dbeafe"};background:#f8fbff;border-radius:10px;box-sizing:border-box;"><pre style="background:${tokens.codeBackground ?? "#0f172a"};color:#e5edf8;border-radius:8px;padding:12px 14px;font-size:14px;word-break:break-all;white-space:pre-wrap;margin:0;"><code>${this.escapeHtml(codeLines.join("\n"))}</code></pre></section>`);
        continue;
      }

      if (/^[-*]\s+/.test(line)) {
        const items: string[] = [];
        while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
          items.push(lines[i].trim().replace(/^[-*]\s+/, ""));
          i += 1;
        }
        current.blocks.push(`<ul style="margin:10px 0;padding:0;list-style:none;">${items.map((item) => `<li style="margin:8px 0;padding-left:1.2em;text-indent:-1.2em;color:#444444;line-height:1.85;">${this.renderInline(`• ${item}`, tokens, "hero-card")}</li>`).join("")}</ul>`);
        continue;
      }

      if (/^\d+\.\s+/.test(line)) {
        const items: string[] = [];
        while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
          items.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
          i += 1;
        }
        current.blocks.push(items.map((item, index) => `<section style="margin:0 0 12px 0;padding:16px;border:1px solid ${tokens.borderColor ?? "#dbeafe"};background-color:#f8fbff;border-radius:10px;box-sizing:border-box;"><p style="margin:0 0 10px 0;"><span style="display:inline-block;width:28px;height:28px;line-height:28px;text-align:center;border-radius:50%;background-color:${tokens.primaryColor ?? "#2563eb"};color:#ffffff;font-size:15px;font-weight:700;">${index + 1}</span></p><p style="margin:0;color:#222222;font-weight:700;">${this.renderInline(item, tokens, "hero-card")}</p></section>`).join(""));
        continue;
      }

      if (/^\|.+\|$/.test(line)) {
        const tableLines: string[] = [];
        while (i < lines.length && /^\|.+\|$/.test(lines[i].trim())) {
          tableLines.push(lines[i].trim());
          i += 1;
        }
        current.blocks.push(this.renderTableBlock(tableLines, tokens));
        continue;
      }

      if (/^---+$/.test(line)) {
        current.blocks.push(`<hr style="border:none;border-top:1px solid ${tokens.borderColor ?? "#d9e7ff"};margin:22px 0;" />`);
        i += 1;
        continue;
      }

      const paragraphLines: string[] = [];
      while (i < lines.length) {
        const nextLine = lines[i].trim();
        if (!nextLine || nextLine.startsWith("```") || /^>\s?/.test(nextLine) || /^(#{1,6})\s+/.test(nextLine) || /^[-*]\s+/.test(nextLine) || /^\d+\.\s+/.test(nextLine) || /^!\[.*\]\(.+\)$/.test(nextLine) || /^\|.+\|$/.test(nextLine) || /^---+$/.test(nextLine)) {
          break;
        }
        paragraphLines.push(lines[i].trim());
        i += 1;
      }
      current.blocks.push(`<p style="margin:0 0 10px 0;${current.title ? "" : "font-size:16px;"}">${this.renderInline(paragraphLines.join("<br/>"), tokens, "hero-card")}</p>`);
    }

    return sections.filter((section) => section.title || section.blocks.length > 0);
  }

  private renderDarkColumnArticle(title: string, markdown: string, tokens: ThemeTokens): string {
    const sections = this.renderBlocks(markdown, tokens, "column-dark");
    const cleanTitle = this.stripInlineCodeMarkers(title);
    return [
      `<section style="${this.joinStyles(["margin:0 auto", "max-width:700px", "font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif", `background:${tokens.backgroundColor ?? "#0f172a"}`, `color:${tokens.textColor ?? "#dbe4ee"}`, "padding:24px 20px", "border-radius:20px", `border:1px solid ${tokens.borderColor ?? "#1e293b"}`, "box-shadow:0 20px 40px rgba(15,23,42,0.28)"])}">`,
      `<h1 style="margin:0 0 18px 0;font-size:28px;line-height:1.35;color:${tokens.headingColor ?? "#f8fafc"};">${this.escapeHtml(cleanTitle)}</h1>`,
      sections.join(""),
      `</section>`,
    ].join("");
  }

  private renderSuperpowersArticle(title: string, markdown: string, tokens: ThemeTokens): string {
    const sections = this.renderBlocks(markdown, tokens, "superpowers-green");
    const cleanTitle = this.stripInlineCodeMarkers(title);
    return [
      `<section style="${this.joinStyles(["margin:0 auto", "max-width:860px", "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,'PingFang SC','Microsoft YaHei',sans-serif", `color:${tokens.textColor ?? "#111111"}`, "line-height:1.72", `background:${tokens.backgroundColor ?? "#ffffff"}`])}">`,
      `<div style="${this.joinStyles(["padding:32px 22px", `border:1px solid ${tokens.borderColor ?? "#cfeedd"}`, "border-radius:24px", "box-shadow:0 18px 40px rgba(7,193,96,0.08)"])}">`,
      `<h1 style="margin:0 0 18px 0;font-size:28px;line-height:1.25;color:${tokens.accentColor ?? "#06ad56"};">${this.escapeHtml(cleanTitle)}</h1>`,
      sections.join(""),
      `</div>`,
      `</section>`,
    ].join("");
  }

  private renderBlocks(markdown: string, tokens: ThemeTokens, layout: string): string[] {
    const lines = markdown.replace(/\r\n/g, "\n").split("\n");
    const blocks: string[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i].trim();
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
        blocks.push(`<pre style="${this.joinStyles([`background:${tokens.codeBackground ?? "#f7f7f7"}`, `color:${layout === "hero-card" || layout === "superpowers-green" ? "#e6edf3" : tokens.textColor ?? "#2b2b2b"}`, `border:1px solid ${tokens.borderColor ?? "#e5e7eb"}`, "border-radius:12px", "padding:14px 16px", "overflow:auto", "font-size:13px", "line-height:1.7", "white-space:pre-wrap", "word-break:break-word", "margin:14px 0"])}"><code>${this.escapeHtml(codeLines.join("\n"))}</code></pre>`);
        continue;
      }

      if (/^>\s?/.test(line)) {
        const quoteLines: string[] = [];
        while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
          quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
          i += 1;
        }
        blocks.push(`<blockquote style="${this.joinStyles(["margin:14px 0", "padding:10px 14px", `border-left:4px solid ${tokens.primaryColor ?? "#07c160"}`, `background:${tokens.surfaceColor ?? "#fafafa"}`, "border-radius:8px"])}"><p style="margin:0;">${this.renderInline(quoteLines.join("<br/>"), tokens, layout)}</p></blockquote>`);
        continue;
      }

      if (/^---+$/.test(line)) {
        blocks.push(`<hr style="border:none;border-top:1px solid ${tokens.softBackground ?? tokens.borderColor ?? "#e5e7eb"};margin:22px 0;" />`);
        i += 1;
        continue;
      }

      const heading = line.match(/^(#{1,6})\s+(.*)$/);
      if (heading) {
        const level = Math.min(heading[1].length, 4);
        const sizes = { 1: "24px", 2: "22px", 3: "18px", 4: "16px" } as const;
        const extras = layout === "superpowers-green" && level === 2 ? [`padding-top:10px`, `border-top:2px solid ${tokens.softBackground ?? "#e8f7f0"}`] : [];
        blocks.push(`<h${level} style="${this.joinStyles([`color:${tokens.headingColor ?? tokens.primaryColor ?? "#111111"}`, `font-size:${sizes[level as 1 | 2 | 3 | 4]}`, "line-height:1.45", "margin:22px 0 10px", ...extras])}">${this.escapeHtml(this.stripInlineCodeMarkers(heading[2]))}</h${level}>`);
        i += 1;
        continue;
      }

      if (/^!\[.*\]\(.+\)$/.test(line)) {
        const imageMatch = line.match(/^!\[(.*)\]\((.+)\)$/);
        blocks.push(this.renderImageBlock(imageMatch?.[2]?.trim() || "", imageMatch?.[1]?.trim() || "配图", tokens));
        i += 1;
        continue;
      }

      if (/^[-*]\s+/.test(line)) {
        const items: string[] = [];
        while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
          items.push(lines[i].trim().replace(/^[-*]\s+/, ""));
          i += 1;
        }
        blocks.push(`<ul style="padding-left:22px;margin:10px 0 10px 22px;">${items.map((item) => `<li style="margin:6px 0;">${this.renderInline(item, tokens, layout)}</li>`).join("")}</ul>`);
        continue;
      }

      if (/^\d+\.\s+/.test(line)) {
        const items: string[] = [];
        while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
          items.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
          i += 1;
        }
        blocks.push(`<ol style="padding-left:22px;margin:10px 0 10px 22px;">${items.map((item) => `<li style="margin:6px 0;">${this.renderInline(item, tokens, layout)}</li>`).join("")}</ol>`);
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
        if (!nextLine || nextLine.startsWith("```") || /^>\s?/.test(nextLine) || /^(#{1,6})\s+/.test(nextLine) || /^[-*]\s+/.test(nextLine) || /^\d+\.\s+/.test(nextLine) || /^!\[.*\]\(.+\)$/.test(nextLine) || /^\|.+\|$/.test(nextLine) || /^---+$/.test(nextLine)) {
          break;
        }
        paragraphLines.push(lines[i].trim());
        i += 1;
      }
      blocks.push(`<p style="margin:10px 0;font-size:${layout === "hero-card" ? "15px" : "16px"};word-break:break-word;">${this.renderInline(paragraphLines.join("<br/>"), tokens, layout)}</p>`);
    }

    return blocks;
  }

  private renderTableBlock(tableLines: string[], tokens: ThemeTokens): string {
    const rows = tableLines.filter((line) => !/^\|\s*[-:| ]+\|$/.test(line)).map((line) => line.replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim()));
    if (rows.length === 0) {
      return "";
    }
    const [header, ...body] = rows;
    return [`<div style="overflow:auto;margin:16px 0;">`, `<table style="width:100%;border-collapse:collapse;font-size:14px;">`, `<thead><tr>${header.map((cell) => `<th style="text-align:left;padding:10px;border:1px solid ${tokens.borderColor ?? "#e5e7eb"};background:${tokens.softBackground ?? tokens.surfaceColor ?? "#f8f8f8"};">${this.renderInline(cell, tokens)}</th>`).join("")}</tr></thead>`, `<tbody>${body.map((row) => `<tr>${row.map((cell) => `<td style="padding:10px;border:1px solid ${tokens.borderColor ?? "#e5e7eb"};">${this.renderInline(cell, tokens)}</td>`).join("")}</tr>`).join("")}</tbody>`, `</table>`, `</div>`].join("");
  }

  private renderImageBlock(src: string, alt: string, tokens: ThemeTokens): string {
    const isRemote = /^https?:\/\//i.test(src) || /^data:image\//i.test(src);
    if (!isRemote) {
      return `<div style="${this.joinStyles([`border:1px dashed ${tokens.borderColor ?? "#d1d5db"}`, "border-radius:12px", "padding:14px", `background:${tokens.surfaceColor ?? "#f8f8f8"}`, `color:${tokens.mutedColor ?? "#6b7280"}`, "font-size:13px", "margin:16px 0"])}">此处原文包含本地图片：${this.escapeHtml(src || alt)}。当前预览不会自动上传本地图片，请在发布前替换为可访问图片链接。</div>`;
    }
    return [`<figure style="margin:18px 0;">`, `<img src="${this.escapeHtml(src)}" alt="${this.escapeHtml(alt)}" style="max-width:100%;border-radius:12px;display:block;margin:0 auto;" />`, alt ? `<figcaption style="margin-top:8px;text-align:center;font-size:12px;color:${tokens.mutedColor ?? "#6b7280"};">${this.escapeHtml(alt)}</figcaption>` : "", `</figure>`].join("");
  }

  private renderInline(input: string, tokens: ThemeTokens, layout = "minimal"): string {
    let text = this.escapeHtml(input).replace(/&lt;br\s*\/??&gt;/gi, "<br/>");
    text = text.replace(/`([^`]+)`/g, `<code style="${this.joinStyles([`background:${layout === "hero-card" || layout === "superpowers-green" ? tokens.softBackground ?? "#e8f7f0" : tokens.codeBackground ?? "#f5f5f5"}`, `color:${layout === "hero-card" || layout === "superpowers-green" ? tokens.accentColor ?? tokens.primaryColor ?? "#07c160" : "inherit"}`, "padding:2px 6px", "border-radius:6px", "font-size:13px"])}">$1</code>`);
    text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, href) => `<a href="${this.escapeHtml(href)}" style="color:${tokens.primaryColor ?? "#07c160"};text-decoration:none;">${label}</a>`);
    return text;
  }

  private stripInlineCodeMarkers(input: string): string {
    return input.replace(/`([^`]+)`/g, "$1").replace(/`/g, "");
  }

  private async ensureDefaultTheme(): Promise<void> {
    for (const theme of this.defaultThemes) {
      await this.prisma.theme.upsert({
        where: { code: theme.code },
        update: { name: theme.name, version: theme.version, tokens: theme.tokens, template: theme.template, isActive: theme.isActive },
        create: theme,
      });
    }
  }

  private joinStyles(parts: string[]): string {
    return parts.join(";");
  }

  private escapeHtml(input: string): string {
    return input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;");
  }
}










