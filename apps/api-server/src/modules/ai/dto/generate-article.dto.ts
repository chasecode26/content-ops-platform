import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class GenerateArticleDto {
  @IsNotEmpty()
  @IsString()
  prompt!: string;
}

export class ChatMessageDto {
  @IsNotEmpty()
  @IsString()
  message!: string;

  @IsOptional()
  @IsString()
  conversationHistory?: string;
}

export class GenerateVariantDto {
  @IsNotEmpty()
  @IsString()
  platform!: string;

  @IsNotEmpty()
  @IsString()
  sourceMarkdown!: string;

  @IsOptional()
  @IsString()
  sourceTitle?: string;
}
