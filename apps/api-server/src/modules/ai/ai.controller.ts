import { Body, Controller, Post } from "@nestjs/common";
import { ok } from "../../common/http-response";
import { AiService } from "./ai.service";
import { GenerateArticleDto, ChatMessageDto, GenerateVariantDto } from "./dto/generate-article.dto";

@Controller("ai")
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post("generate-article")
  async generateArticle(@Body() dto: GenerateArticleDto) {
    const result = await this.aiService.generateArticle(dto.prompt);
    return ok(result);
  }

  @Post("chat")
  async chat(@Body() dto: ChatMessageDto) {
    const messages: { role: string; content: string }[] = [
      {
        role: "system",
        content: `你是一个专业的内容创作助手。你的任务是帮助用户根据灵感、想法或链接，生成高质量的文章内容。

你可以：
1. 根据简短的灵感生成完整文章
2. 根据 URL 链接内容进行分析改写
3. 与用户对话，逐步完善文章内容
4. 提供写作建议和思路扩展

请用中文回复，保持专业但亲和的语气。`,
      },
    ];

    if (dto.conversationHistory) {
      try {
        const history = JSON.parse(dto.conversationHistory);
        if (Array.isArray(history)) {
          messages.push(...history);
        }
      } catch {
        // ignore invalid history
      }
    }

    messages.push({ role: "user", content: dto.message });

    const reply = await this.aiService.chatMessage(messages);
    return ok({ reply });
  }

  @Post("generate-variant")
  async generateVariant(@Body() dto: GenerateVariantDto) {
    const result = await this.aiService.generateVariant(
      dto.platform,
      dto.sourceMarkdown,
      dto.sourceTitle ?? "",
    );
    return ok(result);
  }
}
