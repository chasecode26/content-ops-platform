import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly model: string;

  constructor() {
    this.baseUrl = process.env.AI_BASE_URL ?? "https://openrouter.ai/api";
    this.apiKey = process.env.AI_API_KEY ?? "";
    this.model = process.env.AI_MODEL ?? "openai/gpt-4o";
  }

  async chat(messages: { role: string; content: string }[]): Promise<string> {
    if (!this.apiKey) {
      throw new Error("AI_API_KEY not configured");
    }

    const url = `${this.baseUrl}/v1/chat/completions`;

    this.logger.log(`Calling AI model: ${this.model}`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        "HTTP-Referer": "http://localhost:8088",
        "X-Title": "Content Ops Platform",
      },
      body: JSON.stringify({
        model: this.model,
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
}
