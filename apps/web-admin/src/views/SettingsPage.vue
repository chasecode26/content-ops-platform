<template>
  <div class="page-container settings-page">
    <div class="page-scroll">
      <section class="settings-hero">
        <div>
          <p class="settings-hero__eyebrow">Model Control</p>
          <h1 class="settings-hero__title">AI 模型配置</h1>
          <p class="settings-hero__desc">模型名改成自由输入，保留常用模板，同时补上 Ollama 本地接入路径。</p>
        </div>
        <div class="settings-hero__meta">
          <div class="hero-chip">
            <span>当前接入</span>
            <strong>{{ selectedPreset.name }}</strong>
          </div>
          <div class="hero-chip">
            <span>当前模型</span>
            <strong>{{ config.model || "未填写" }}</strong>
          </div>
        </div>
      </section>

      <n-grid :x-gap="18" :y-gap="18" cols="1 xl:5" responsive="screen">
        <n-gi span="1 xl:3">
          <n-card class="page-card panel-card" title="连接配置">
            <n-space vertical :size="16">
              <div class="preset-list">
                <button
                  v-for="preset in providerPresets"
                  :key="preset.id"
                  type="button"
                  class="preset-item"
                  :class="{ active: config.provider === preset.id }"
                  @click="applyPreset(preset.id)"
                >
                  <span class="preset-item__name">{{ preset.name }}</span>
                  <span class="preset-item__desc">{{ preset.desc }}</span>
                </button>
              </div>

              <n-form label-placement="top">
                <n-form-item label="接入类型">
                  <n-input v-model:value="config.provider" readonly />
                </n-form-item>
                <n-form-item label="API Base URL">
                  <n-input v-model:value="config.baseUrl" :placeholder="selectedPreset.baseUrl" />
                </n-form-item>
                <n-form-item :label="selectedPreset.requiresApiKey ? 'API Key' : 'API Key（可选）'">
                  <n-input
                    v-model:value="config.apiKey"
                    type="password"
                    show-password-on="click"
                    :placeholder="selectedPreset.requiresApiKey ? 'sk-...' : 'Ollama 本地可留空'"
                  />
                </n-form-item>
                <n-form-item label="模型名称">
                  <n-input
                    v-model:value="config.model"
                    placeholder="例如：gpt-4o / qwen-plus / llama3.1:8b / qwen2.5:14b"
                  />
                </n-form-item>
                <div class="model-hint">
                  <span>快速填充：</span>
                  <n-tag
                    v-for="m in selectedModels"
                    :key="m.id"
                    size="small"
                    round
                    checkable
                    :checked="config.model === m.id"
                    @update:checked="() => (config.model = m.id)"
                  >
                    {{ m.name }}
                  </n-tag>
                </div>
                <n-space>
                  <n-button type="primary" :loading="saving" @click="saveConfig">保存配置</n-button>
                  <n-button secondary :loading="testing" @click="testConnection">测试连接</n-button>
                </n-space>
              </n-form>
            </n-space>
          </n-card>
        </n-gi>

        <n-gi span="1 xl:2">
          <n-card class="page-card panel-card" title="常用模型模板">
            <div class="model-list">
              <button
                v-for="m in popularModels"
                :key="m.id"
                type="button"
                class="model-item"
                :class="{ active: config.model === m.id }"
                @click="applyModel(m)"
              >
                <div class="model-item__head">
                  <div class="model-item__name">{{ m.name }}</div>
                  <n-tag size="small" :bordered="false">{{ providerLabel(m.provider) }}</n-tag>
                </div>
                <div class="model-item__id">{{ m.id }}</div>
                <div class="model-item__desc">{{ m.desc }}</div>
              </button>
            </div>
          </n-card>
        </n-gi>
      </n-grid>

      <n-card class="page-card panel-card env-card" title="环境变量配置（后端 .env）">
        <n-alert type="warning" style="margin-bottom: 12px;">
          点击“保存配置”后会直接写入后端 <code>.env</code>。若接 Ollama，本地通常只需填 <code>AI_BASE_URL</code> 与 <code>AI_MODEL</code>。
        </n-alert>
        <n-descriptions bordered :column="2">
          <n-descriptions-item label="AI_BASE_URL">
            <n-input :value="config.baseUrl" readonly />
          </n-descriptions-item>
          <n-descriptions-item label="AI_API_KEY">
            <n-input :value="maskKey(config.apiKey)" readonly />
          </n-descriptions-item>
          <n-descriptions-item label="AI_MODEL">
            <n-input :value="config.model" readonly />
          </n-descriptions-item>
        </n-descriptions>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useMessage } from "naive-ui";
import { getAiSettings, testAiSettings, updateAiSettings } from "../api/services";

type ProviderId = "openrouter" | "openai-compatible" | "ollama";

type ProviderPreset = {
  id: ProviderId;
  name: string;
  desc: string;
  baseUrl: string;
  requiresApiKey: boolean;
};

type ModelPreset = {
  id: string;
  name: string;
  desc: string;
  provider: ProviderId;
  baseUrl?: string;
};

const message = useMessage();
const saving = ref(false);
const testing = ref(false);

const providerPresets: ProviderPreset[] = [
  {
    id: "openrouter",
    name: "OpenRouter",
    desc: "聚合模型市场，适合线上快速试模",
    baseUrl: "https://openrouter.ai/api",
    requiresApiKey: true,
  },
  {
    id: "openai-compatible",
    name: "OpenAI Compatible",
    desc: "任何兼容 /v1/chat/completions 的平台",
    baseUrl: "https://api.openai.com",
    requiresApiKey: true,
  },
  {
    id: "ollama",
    name: "Ollama",
    desc: "本地模型，默认走 11434，可无 Key",
    baseUrl: "http://127.0.0.1:11434",
    requiresApiKey: false,
  },
];

const popularModels: ModelPreset[] = [
  { id: "minimax/minimax-m2.5:free", name: "MiniMax M2.5", desc: "免费，中文写作优秀", provider: "openrouter" },
  { id: "qwen/qwen-plus", name: "通义千问 Plus", desc: "中文能力强，性价比高", provider: "openrouter" },
  { id: "qwen/qwen-turbo", name: "通义千问 Turbo", desc: "速度快，成本低", provider: "openrouter" },
  { id: "openai/gpt-4o", name: "GPT-4o", desc: "通用能力强，质量高", provider: "openrouter" },
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini", desc: "速度快，成本低", provider: "openrouter" },
  {
    id: "anthropic/claude-sonnet-4-20250514",
    name: "Claude Sonnet 4",
    desc: "长文与写作能力强",
    provider: "openrouter",
  },
  {
    id: "deepseek/deepseek-chat-v3-0324:free",
    name: "DeepSeek V3",
    desc: "中文与推理兼顾",
    provider: "openrouter",
  },
  { id: "gpt-4o", name: "OpenAI GPT-4o", desc: "OpenAI 原生命名示例", provider: "openai-compatible" },
  { id: "gpt-4o-mini", name: "OpenAI GPT-4o Mini", desc: "更便宜的 OpenAI 示例", provider: "openai-compatible" },
  { id: "llama3.1:8b", name: "Llama 3.1 8B", desc: "Ollama 本地常用模型", provider: "ollama", baseUrl: "http://127.0.0.1:11434" },
  { id: "qwen2.5:14b", name: "Qwen2.5 14B", desc: "中文体验更稳的 Ollama 模型", provider: "ollama", baseUrl: "http://127.0.0.1:11434" },
  { id: "deepseek-r1:8b", name: "DeepSeek R1 8B", desc: "本地推理模型模板", provider: "ollama", baseUrl: "http://127.0.0.1:11434" },
];

const config = reactive({
  provider: "openrouter" as ProviderId,
  baseUrl: "https://openrouter.ai/api",
  apiKey: "",
  model: "minimax/minimax-m2.5:free",
});

const selectedPreset = computed(
  () => providerPresets.find((preset) => preset.id === config.provider) ?? providerPresets[0],
);

const selectedModels = computed(() => popularModels.filter((model) => model.provider === config.provider).slice(0, 5));

function providerLabel(provider: ProviderId) {
  return providerPresets.find((item) => item.id === provider)?.name ?? provider;
}

function applyPreset(providerId: ProviderId) {
  const preset = providerPresets.find((item) => item.id === providerId);
  if (!preset) return;
  config.provider = providerId;
  config.baseUrl = preset.baseUrl;
  if (!preset.requiresApiKey) {
    config.apiKey = "";
  }
  const suggestedModel = popularModels.find((item) => item.provider === providerId);
  if (suggestedModel) {
    config.model = suggestedModel.id;
  }
}

function applyModel(model: ModelPreset) {
  config.provider = model.provider;
  config.model = model.id;
  const preset = providerPresets.find((item) => item.id === model.provider);
  config.baseUrl = model.baseUrl ?? preset?.baseUrl ?? config.baseUrl;
  if (model.provider === "ollama") {
    config.apiKey = "";
  }
}

function inferProvider(baseUrl: string, model: string): ProviderId {
  if (isOllamaBaseUrl(baseUrl) || /^[a-z0-9._-]+:\d+[a-z0-9._-]*$/i.test(model)) {
    return "ollama";
  }
  if (/openrouter\.ai/i.test(baseUrl) || model.includes("/")) {
    return "openrouter";
  }
  return "openai-compatible";
}

function maskKey(key: string) {
  if (!key) return "未配置";
  if (key.length <= 8) return "***";
  return key.slice(0, 6) + "..." + key.slice(-4);
}

function isOllamaBaseUrl(baseUrl: string) {
  return /(?:127\.0\.0\.1|localhost):11434/i.test(baseUrl) || /\/ollama\/?$/i.test(baseUrl);
}

async function saveConfig() {
  if (!config.baseUrl.trim() || !config.model.trim()) {
    message.warning("请填写完整的 Base URL 和模型名称");
    return;
  }
  saving.value = true;
  try {
    const saved = await updateAiSettings({
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
      model: config.model,
    });
    config.baseUrl = saved.baseUrl;
    config.apiKey = saved.apiKey;
    config.model = saved.model;
    config.provider = inferProvider(saved.baseUrl, saved.model);
    message.success("配置已保存到后端 .env");
  } catch (err: any) {
    message.error(`保存失败: ${err.message || "未知错误"}`);
  } finally {
    saving.value = false;
  }
}

async function testConnection() {
  if (!config.model.trim()) {
    message.warning("请填写模型名称");
    return;
  }
  if (!config.baseUrl.trim()) {
    message.warning("请填写 API Base URL");
    return;
  }
  if (!config.apiKey.trim() && !isOllamaBaseUrl(config.baseUrl)) {
    message.warning("该接入方式通常需要 API Key");
    return;
  }

  testing.value = true;
  message.info("测试连接中...");
  try {
    const result = await testAiSettings({
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
      model: config.model,
    });
    message.success(`${result.message}：${result.model}`);
  } catch (err: any) {
    message.error(`连接失败: ${err.message}`);
  } finally {
    testing.value = false;
  }
}

onMounted(async () => {
  try {
    const saved = await getAiSettings();
    config.baseUrl = saved.baseUrl;
    config.apiKey = saved.apiKey;
    config.model = saved.model;
    config.provider = inferProvider(saved.baseUrl, saved.model);
  } catch (err: any) {
    message.warning(`读取已保存配置失败: ${err.message || "未知错误"}`);
  }
});
</script>

<style scoped>
.settings-page {
  min-height: 0;
  gap: 18px;
}

.settings-page > .page-scroll {
  min-height: 0;
}

.settings-page :deep(.n-grid) {
  flex-shrink: 0;
}

.settings-hero {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 18px;
  padding: 24px 26px;
  border-radius: 24px;
  border: 1px solid rgba(31, 111, 235, 0.08);
  background:
    radial-gradient(circle at top right, rgba(125, 211, 252, 0.18), transparent 34%),
    linear-gradient(135deg, #111827 0%, #1d4ed8 48%, #0f766e 100%);
  color: #f8fafc;
}

.settings-hero__eyebrow {
  margin: 0 0 10px;
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  opacity: 0.72;
}

.settings-hero__title {
  margin: 0;
  font-size: 28px;
}

.settings-hero__desc {
  max-width: 720px;
  margin: 10px 0 0;
  line-height: 1.7;
  color: rgba(248, 250, 252, 0.82);
}

.settings-hero__meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(160px, 1fr));
  gap: 12px;
  min-width: min(360px, 100%);
}

.hero-chip {
  padding: 16px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
}

.hero-chip span {
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
  color: rgba(248, 250, 252, 0.66);
}

.hero-chip strong {
  display: block;
  font-size: 18px;
  line-height: 1.5;
}

.panel-card {
  border-radius: 22px;
}

.preset-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.preset-item,
.model-item {
  width: 100%;
  border: 1px solid #d8e2ee;
  background: linear-gradient(180deg, #ffffff 0%, #f7fafc 100%);
  border-radius: 18px;
  padding: 16px;
  text-align: left;
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.preset-item:hover,
.model-item:hover {
  transform: translateY(-1px);
  border-color: #1f6feb;
  box-shadow: 0 16px 32px rgba(31, 111, 235, 0.08);
}

.preset-item.active,
.model-item.active {
  border-color: #1f6feb;
  background: linear-gradient(180deg, #eff6ff 0%, #f8fbff 100%);
}

.preset-item__name,
.model-item__name {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: #102033;
}

.preset-item__desc,
.model-item__desc,
.model-item__id {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.6;
  color: #627489;
}

.model-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 100%;
}

.model-item__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.model-hint {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
  color: #627489;
  font-size: 12px;
}

.env-card {
  margin-top: 18px;
}

@media (max-width: 1100px) {
  .settings-hero {
    flex-direction: column;
  }

  .settings-hero__meta,
  .preset-list {
    grid-template-columns: 1fr;
  }
}
</style>
