<template>
  <div class="page-container settings-page">
    <div class="page-scroll">
      <n-grid :x-gap="16" :y-gap="16" cols="1 l:2" responsive="screen">
        <n-gi>
          <n-card class="page-card" title="AI 模型配置">
            <n-form label-placement="top">
              <n-form-item label="API Base URL">
                <n-input v-model:value="config.baseUrl" placeholder="https://openrouter.ai/api" />
              </n-form-item>
              <n-form-item label="API Key">
                <n-input
                  v-model:value="config.apiKey"
                  type="password"
                  show-password-on="click"
                  placeholder="sk-..."
                />
              </n-form-item>
              <n-form-item label="模型名称">
                <n-select v-model:value="config.model" :options="modelOptions" filterable tag />
              </n-form-item>
              <n-space>
                <n-button type="primary" @click="saveConfig">保存配置</n-button>
                <n-button secondary @click="testConnection">测试连接</n-button>
              </n-space>
            </n-form>
          </n-card>
        </n-gi>
        <n-gi>
          <n-card class="page-card" title="常用模型">
            <n-space vertical>
              <div class="model-list">
                <div
                  v-for="m in popularModels"
                  :key="m.id"
                  class="model-item"
                  :class="{ active: config.model === m.id }"
                  @click="config.model = m.id"
                >
                  <div class="model-item__name">{{ m.name }}</div>
                  <div class="model-item__desc">{{ m.desc }}</div>
                </div>
              </div>
            </n-space>
          </n-card>
        </n-gi>
      </n-grid>

      <n-card class="page-card" title="环境变量配置（后端 .env）" style="margin-top: 16px;">
        <n-alert type="warning" style="margin-bottom: 12px;">
          以下配置需要修改后端 <code>.env</code> 文件并重启 API 服务
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
import { onMounted, reactive, ref } from "vue";
import { useMessage } from "naive-ui";

const message = useMessage();

const config = reactive({
  baseUrl: "https://openrouter.ai/api",
  apiKey: "",
  model: "minimax/minimax-m2.5:free",
});

const popularModels = [
  { id: "minimax/minimax-m2.5:free", name: "MiniMax M2.5", desc: "免费，中文写作优秀" },
  { id: "qwen/qwen-plus", name: "通义千问 Plus", desc: "中文能力强，性价比高" },
  { id: "qwen/qwen-turbo", name: "通义千问 Turbo", desc: "速度快，成本低" },
  { id: "openai/gpt-4o", name: "GPT-4o", desc: "通用能力强，质量高" },
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini", desc: "速度快，成本低" },
  { id: "anthropic/claude-sonnet-4-20250514", name: "Claude Sonnet 4", desc: "写作能力强" },
  { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash", desc: "速度快，多模态" },
  { id: "deepseek/deepseek-chat-v3-0324:free", name: "DeepSeek V3", desc: "免费，中文优秀" },
];

const modelOptions = popularModels.map((m) => ({ label: m.name, value: m.id }));

function maskKey(key: string) {
  if (!key) return "未配置";
  if (key.length <= 8) return "***";
  return key.slice(0, 6) + "..." + key.slice(-4);
}

function saveConfig() {
  message.warning("请在后端 .env 文件中修改配置并重启服务");
}

async function testConnection() {
  message.info("测试连接中...");
  try {
    const response = await fetch(`${config.baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
        "HTTP-Referer": "http://localhost:8088",
        "X-Title": "Content Ops Platform",
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: "user", content: "hi" }],
        max_tokens: 10,
      }),
    });
    if (response.ok) {
      message.success("连接成功！");
    } else {
      const err = await response.text();
      message.error(`连接失败: ${response.status} - ${err.slice(0, 100)}`);
    }
  } catch (err: any) {
    message.error(`连接失败: ${err.message}`);
  }
}

onMounted(() => {
  // Load from backend config endpoint if available
});
</script>

<style scoped>
.model-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
}

.model-item {
  padding: 12px 16px;
  border: 1px solid #e6ebf1;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.model-item:hover {
  border-color: #409eff;
  background: #ecf5ff;
}

.model-item.active {
  border-color: #409eff;
  background: #ecf5ff;
}

.model-item__name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.model-item__desc {
  font-size: 12px;
  color: #909399;
}
</style>
