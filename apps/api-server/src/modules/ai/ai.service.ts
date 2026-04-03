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
    const systemPrompt = `你是一个专业的内容创作者和编辑。请根据用户给出的想法，生成一篇高质量的中文文章。

要求：
1. 文章结构完整，包含标题、引言、正文和总结。
2. 使用 Markdown 格式。
3. 标题要有吸引力，正文要有信息量。
4. 风格专业但易读。

请严格返回 JSON：
{
  "title": "文章标题",
  "summary": "一句话摘要",
  "markdownBody": "完整 Markdown 正文"
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
    } catch {
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
      XIAOHONGSHU: `你是一个小红书爆款文案专家。请将以下母稿改写成适合小红书发布的笔记。

要求：
1. 标题抓人，可适当使用 emoji。
2. 正文更口语化，更适合种草与经验分享。
3. 多用短段落、小标题、列表，增强收藏意愿。
4. 结尾加入互动引导。
5. 输出 5-8 个小红书标签。

请严格返回 JSON：
{
  "title": "小红书标题",
  "markdownBody": "小红书正文 Markdown",
  "tags": ["#标签1", "#标签2"]
}

源文章：
标题：${sourceTitle}
内容：${sourceMarkdown.substring(0, 3000)}`,
      CSDN: `你是一个资深技术博主。请将以下母稿改写成适合 CSDN 发布的技术文章。

要求：
1. 标题专业、清晰、利于检索。
2. 正文包含背景、问题、方案、步骤、总结。
3. 风格偏技术说明文，可加入注意事项与踩坑总结。
4. 输出 5-8 个技术标签。

请严格返回 JSON：
{
  "title": "CSDN 文章标题",
  "markdownBody": "CSDN 正文 Markdown",
  "tags": ["标签1", "标签2"]
}

源文章：
标题：${sourceTitle}
内容：${sourceMarkdown.substring(0, 3000)}`,
      TOUTIAO: `你是一个今日头条内容运营专家。请将以下母稿改写成适合今日头条发布的文章。

要求：
1. 标题直接、有信息量，突出结果、冲突或收益。
2. 开头先抛核心观点，中段分点展开，结尾做总结或提问。
3. 风格偏信息流干货/评论式写法，减少公众号腔。
4. 多用短段、短句、小标题，提升推荐流完读率。
5. 输出 3-6 个适合头条推荐的话题标签。

请严格返回 JSON：
{
  "title": "今日头条标题",
  "markdownBody": "今日头条正文 Markdown",
  "tags": ["标签1", "标签2"]
}

源文章：
标题：${sourceTitle}
内容：${sourceMarkdown.substring(0, 3000)}`,
    };

    const platformLabelMap: Record<string, string> = {
      XIAOHONGSHU: "小红书",
      CSDN: "CSDN",
      TOUTIAO: "今日头条",
    };

    const systemPrompt = prompts[platform];
    if (!systemPrompt) {
      throw new Error(`不支持的平台: ${platform}`);
    }

    const response = await this.chat([
      { role: "system", content: systemPrompt },
      { role: "user", content: `请将以下文章改写成${platformLabelMap[platform] ?? platform}风格` },
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
    } catch {
      this.logger.warn("Failed to parse variant response as JSON");
    }

    return {
      title: `${platform} 变体`,
      markdownBody: response,
      tags: [],
    };
  }
}
