import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  async chat(messages: { role: string; content: string }[]): Promise<string> {
    const settings = this.getSettings();
    if (!settings.apiKey && !this.isOllamaBaseUrl(settings.baseUrl)) {
      throw new Error("AI_API_KEY not configured");
    }

    const url = `${settings.baseUrl}/v1/chat/completions`;

    this.logger.log(`Calling AI model: ${settings.model}`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(settings.apiKey ? { Authorization: `Bearer ${settings.apiKey}` } : {}),
        ...(!this.isOllamaBaseUrl(settings.baseUrl)
          ? {
              "HTTP-Referer": "http://localhost:8088",
              "X-Title": "Content Ops Platform",
            }
          : {}),
      },
      body: JSON.stringify({
        model: settings.model,
        messages,
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`AI API error: ${response.status} ${errorText}`);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? "";
  }

  async testConnection(settings?: { baseUrl: string; apiKey: string; model: string }) {
    const target = settings ?? this.getSettings();
    if (!target.apiKey && !this.isOllamaBaseUrl(target.baseUrl)) {
      throw new Error("AI_API_KEY not configured");
    }

    const response = await fetch(`${target.baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(target.apiKey ? { Authorization: `Bearer ${target.apiKey}` } : {}),
        ...(!this.isOllamaBaseUrl(target.baseUrl)
          ? {
              "HTTP-Referer": "http://localhost:8088",
              "X-Title": "Content Ops Platform",
            }
          : {}),
      },
      body: JSON.stringify({
        model: target.model,
        messages: [{ role: "user", content: "hi" }],
        max_tokens: 10,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`AI API error: ${response.status} ${errorText}`);
      throw new Error(`AI API error: ${response.status}`);
    }

    return true;
  }

  private getSettings() {
    return {
      baseUrl: process.env.AI_BASE_URL ?? "https://openrouter.ai/api",
      apiKey: process.env.AI_API_KEY ?? "",
      model: process.env.AI_MODEL ?? "openai/gpt-4o",
    };
  }

  private isOllamaBaseUrl(baseUrl: string): boolean {
    return /(?:127\.0\.0\.1|localhost):11434/i.test(baseUrl) || /\/ollama\/?$/i.test(baseUrl);
  }

  async generateArticle(prompt: string): Promise<{
    title: string;
    summary: string;
    markdownBody: string;
  }> {
    const systemPrompt = `你是一个专业的内容创作者和编辑。你的任务是根据用户的灵感或想法，生成一篇高质量的微信公众号文章。

要求：
1. 文章结构完整：包含标题、引言、正文（分章节）、结语
2. 使用 Markdown 格式
3. 标题要吸引人，正文要有深度
4. 语言风格：专业但不失亲和力
5. 适当使用标题层级（## 和 ###）
6. 可以使用列表、引用等 Markdown 语法增强可读性

请严格按照以下 JSON 格式返回，不要包含任何其他文字：
{
  "title": "文章标题",
  "summary": "一句话摘要",
  "markdownBody": "完整的 Markdown 正文"
}`;

    const response = await this.chat([
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ]);

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          title: parsed.title ?? "AI 生成文章",
          summary: parsed.summary ?? "",
          markdownBody: parsed.markdownBody ?? response,
        };
      }
    } catch (e) {
      this.logger.warn("Failed to parse AI response as JSON");
    }

    return {
      title: "AI 生成文章",
      summary: "",
      markdownBody: response,
    };
  }

  async chatMessage(messages: { role: string; content: string }[]): Promise<string> {
    return this.chat(messages);
  }

  async generateVariant(platform: string, sourceMarkdown: string, sourceTitle: string): Promise<{
    title: string;
    markdownBody: string;
    tags?: string[];
  }> {
    const prompts: Record<string, string> = {
      XIAOHONGSHU: `你是一个小红书爆款文案专家。请将以下母稿改写成小红书风格的笔记。

小红书风格要求：
1. 标题：吸引眼球，使用 emoji，制造悬念或痛点共鸣，15-20 字
2. 正文：
   - 开头用痛点/悬念/共鸣吸引注意
   - 多用 emoji（但不过度），每段 2-3 行
   - 使用序号列表、分隔线等增强可读性
   - 口语化、亲切感，像朋友分享
   - 适当使用"姐妹们"、"真的绝了"、"按头安利"等网感词汇
   - 结尾引导互动（点赞、收藏、评论）
3. 标签：生成 5-8 个相关话题标签，用 # 开头

请严格按照以下 JSON 格式返回，不要包含任何其他文字：
{
  "title": "小红书标题（带emoji）",
  "markdownBody": "小红书风格正文（用 Markdown 格式）",
  "tags": ["#标签1", "#标签2", "#标签3"]
}

源文章：
标题：${sourceTitle}
内容：${sourceMarkdown.substring(0, 3000)}`,
      CSDN: `你是一个资深技术博主。请将以下母稿改写成 CSDN 风格的技术文章。

CSDN 风格要求：
1. 标题：专业、准确、包含关键词，便于搜索引擎优化
2. 正文：
   - 结构清晰：前言、环境/背景、核心内容（分步骤）、总结
   - 使用代码块、表格、列表等技术文档常用元素
   - 语言专业严谨，适合技术人员阅读
   - 适当添加"踩坑记录"、"注意事项"、"扩展阅读"等板块
   - 结尾可以引导关注、点赞、收藏
3. 标签：生成 5-8 个技术相关标签

请严格按照以下 JSON 格式返回，不要包含任何其他文字：
{
  "title": "CSDN文章标题",
  "markdownBody": "CSDN风格正文（用 Markdown 格式）",
  "tags": ["标签1", "标签2", "标签3"]
}

源文章：
标题：${sourceTitle}
内容：${sourceMarkdown.substring(0, 3000)}`,
    };

    const systemPrompt = prompts[platform];
    if (!systemPrompt) {
      throw new Error(`不支持的平台: ${platform}`);
    }

    const response = await this.chat([
      { role: "system", content: systemPrompt },
      { role: "user", content: `请将以下文章改写成${platform === "XIAOHONGSHU" ? "小红书" : "CSDN"}风格` },
    ]);

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          title: parsed.title ?? `${platform} 变体`,
          markdownBody: parsed.markdownBody ?? response,
          tags: parsed.tags ?? [],
        };
      }
    } catch (e) {
      this.logger.warn("Failed to parse variant response as JSON");
    }

    return {
      title: `${platform} 变体`,
      markdownBody: response,
      tags: [],
    };
  }
}
