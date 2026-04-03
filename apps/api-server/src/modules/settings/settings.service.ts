import { Injectable } from "@nestjs/common";
import { config as loadDotEnv, parse as parseDotEnv } from "dotenv";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { AiService } from "../ai/ai.service";
import { TestAiSettingsDto } from "./dto/test-ai-settings.dto";
import { UpdateAiSettingsDto } from "./dto/update-ai-settings.dto";

type AiSettings = {
  baseUrl: string;
  apiKey: string;
  model: string;
};

@Injectable()
export class SettingsService {
  private readonly envPath = resolve(process.cwd(), "../../.env");

  constructor(private readonly aiService: AiService) {}

  async getAiSettings() {
    const settings = await this.readAiSettings();
    return {
      ...settings,
      apiKeyMasked: this.maskKey(settings.apiKey),
    };
  }

  async updateAiSettings(dto: UpdateAiSettingsDto) {
    const nextSettings: AiSettings = {
      baseUrl: dto.baseUrl.trim(),
      apiKey: dto.apiKey?.trim() ?? "",
      model: dto.model.trim(),
    };

    await this.upsertEnvValues({
      AI_BASE_URL: nextSettings.baseUrl,
      AI_API_KEY: nextSettings.apiKey,
      AI_MODEL: nextSettings.model,
    });

    process.env.AI_BASE_URL = nextSettings.baseUrl;
    process.env.AI_API_KEY = nextSettings.apiKey;
    process.env.AI_MODEL = nextSettings.model;

    return {
      ...nextSettings,
      apiKeyMasked: this.maskKey(nextSettings.apiKey),
    };
  }

  async testAiSettings(dto: TestAiSettingsDto) {
    const current = await this.readAiSettings();
    const target: AiSettings = {
      baseUrl: dto.baseUrl?.trim() || current.baseUrl,
      apiKey: dto.apiKey?.trim() ?? current.apiKey,
      model: dto.model?.trim() || current.model,
    };

    await this.aiService.testConnection(target);

    return {
      success: true,
      message: "连接成功",
      model: target.model,
      baseUrl: target.baseUrl,
    };
  }

  private async readAiSettings(): Promise<AiSettings> {
    loadDotEnv({ path: this.envPath, override: true });

    return {
      baseUrl: process.env.AI_BASE_URL ?? "https://openrouter.ai/api",
      apiKey: process.env.AI_API_KEY ?? "",
      model: process.env.AI_MODEL ?? "openai/gpt-4o",
    };
  }

  private async upsertEnvValues(entries: Record<string, string>) {
    let source = "";
    try {
      source = await readFile(this.envPath, "utf8");
    } catch {
      source = "";
    }

    const existing = source ? parseDotEnv(source) : {};
    const merged = {
      ...existing,
      ...entries,
    };

    const lines = source ? source.split(/\r?\n/) : [];
    const seen = new Set<string>();
    const nextLines = lines.map((line) => {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=/);
      if (!match) {
        return line;
      }

      const key = match[1];
      if (!(key in entries)) {
        return line;
      }

      seen.add(key);
      return `${key}=${this.formatEnvValue(merged[key] ?? "")}`;
    });

    for (const [key, value] of Object.entries(entries)) {
      if (!seen.has(key)) {
        nextLines.push(`${key}=${this.formatEnvValue(value)}`);
      }
    }

    const content = `${nextLines.filter((line, index, arr) => !(index === arr.length - 1 && line === "")).join("\n")}\n`;
    await writeFile(this.envPath, content, "utf8");
  }

  private formatEnvValue(value: string): string {
    if (value === "") {
      return "\"\"";
    }
    if (/^[A-Za-z0-9_./:-]+$/.test(value)) {
      return value;
    }
    return JSON.stringify(value);
  }

  private maskKey(value: string): string {
    if (!value) return "未配置";
    if (value.length <= 8) return "***";
    return `${value.slice(0, 6)}...${value.slice(-4)}`;
  }
}
