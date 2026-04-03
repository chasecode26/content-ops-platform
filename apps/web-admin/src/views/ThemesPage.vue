<template>
  <div class="page-container themes-page">
    <div class="page-scroll">
      <n-space class="themes-stack" vertical size="large">
        <n-card class="page-card panel-card" title="选择主题">
          <n-space vertical :size="16">
            <n-select v-model:value="platform" :options="platformOptions" style="width: 220px" @update:value="reloadThemes" />
            <div class="theme-grid">
              <button
                v-for="theme in themes"
                :key="theme.code"
                type="button"
                class="theme-card"
                :class="[`theme-${theme.code}`, { active: themeCode === theme.code }]"
                @click="selectTheme(theme.code)"
              >
                <div class="theme-card__label">{{ theme.name }}</div>
                <div class="theme-card__preview">
                  <div class="theme-card__kicker">{{ platformLabelMap[platform] }}</div>
                  <div class="theme-card__title">内容排版示意</div>
                  <div class="theme-card__text">当前平台会沿用这套主题做成稿预览与草稿生成。</div>
                </div>
              </button>
            </div>
          </n-space>
        </n-card>

        <n-grid class="themes-grid" :x-gap="16" :y-gap="16" cols="1 l:2" responsive="screen">
          <n-gi>
            <n-card class="page-card panel-card" title="渲染参数">
              <n-form label-placement="top">
                <n-form-item label="平台">
                  <n-select v-model:value="platform" :options="platformOptions" @update:value="reloadThemes" />
                </n-form-item>
                <n-form-item label="当前主题">
                  <n-select v-model:value="themeCode" :options="themeOptions" />
                </n-form-item>
                <n-form-item label="标题">
                  <n-input v-model:value="title" />
                </n-form-item>
                <n-form-item label="Markdown">
                  <n-input v-model:value="markdownBody" type="textarea" :rows="14" />
                </n-form-item>
                <div class="theme-toolbar">
                  <n-tooltip trigger="hover">
                    <template #trigger>
                      <n-button circle type="primary" @click="preview">
                        <span class="action-icon">
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path :d="appIconPaths.detail" />
                          </svg>
                        </span>
                      </n-button>
                    </template>
                    渲染预览
                  </n-tooltip>
                  <n-tooltip trigger="hover">
                    <template #trigger>
                      <n-button circle secondary @click="copyHtml">
                        <span class="action-icon">
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path :d="appIconPaths.copy" />
                          </svg>
                        </span>
                      </n-button>
                    </template>
                    复制 HTML
                  </n-tooltip>
                </div>
              </n-form>
            </n-card>
          </n-gi>

          <n-gi>
            <n-card class="page-card panel-card" title="HTML 预览">
              <div class="preview-actions">
                <n-tag type="info">{{ platformLabelMap[platform] }}</n-tag>
                <n-tag type="default">长度 {{ html.length }} 字符</n-tag>
              </div>
              <div class="preview-box" v-html="html"></div>
            </n-card>
          </n-gi>
        </n-grid>
      </n-space>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { NTooltip, useMessage } from "naive-ui";
import { listThemes, renderPreview, type ThemeItem } from "../api/services";
import { appIconPaths } from "../utils/icons";

const message = useMessage();
const themes = ref<ThemeItem[]>([]);
const platform = ref("WECHAT_OFFICIAL");
const themeCode = ref("");
const title = ref("主题预览");
const markdownBody = ref("## 标题\n\n这是主题预览内容。");
const html = ref("");

const platformOptions = [
  { label: "微信公众号", value: "WECHAT_OFFICIAL" },
  { label: "今日头条", value: "TOUTIAO" },
];

const platformLabelMap: Record<string, string> = {
  WECHAT_OFFICIAL: "微信公众号",
  TOUTIAO: "今日头条",
};

const themeOptions = computed(() => themes.value.map((item) => ({ label: item.name, value: item.code })));

async function reloadThemes() {
  themes.value = await listThemes(platform.value === "TOUTIAO" ? "WECHAT_OFFICIAL" : platform.value);
  if (!themes.value.some((item) => item.code === themeCode.value)) {
    themeCode.value = themes.value[0]?.code ?? "";
  }
  await preview();
}

function selectTheme(code: string) {
  themeCode.value = code;
  void preview();
}

async function preview() {
  if (!themeCode.value) {
    message.warning("请先选择主题");
    return;
  }
  html.value = await renderPreview({
    themeCode: themeCode.value,
    platform: platform.value,
    markdownBody: markdownBody.value,
    title: title.value,
  });
}

async function copyHtml() {
  if (!html.value) {
    message.warning("暂无可复制 HTML");
    return;
  }
  await navigator.clipboard.writeText(html.value);
  message.success("已复制 HTML 到剪贴板");
}

onMounted(async () => {
  await reloadThemes();
});
</script>

<style scoped>
.themes-page {
  min-height: 0;
}

.themes-page > .page-scroll {
  min-height: 0;
}

.themes-stack {
  flex: 1;
  min-height: 0;
}

.themes-grid {
  flex-shrink: 0;
}

.panel-card {
  height: 100%;
}

.theme-toolbar {
  display: flex;
  gap: 10px;
}

.action-icon {
  display: inline-flex;
  width: 16px;
  height: 16px;
}

.action-icon svg,
.action-icon :deep(svg) {
  width: 16px;
  height: 16px;
  fill: currentColor;
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.theme-card {
  width: 100%;
  border: 1px solid #dbe4ee;
  border-radius: 14px;
  padding: 12px;
  background: #fff;
  cursor: pointer;
  text-align: left;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.theme-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
}

.theme-card.active {
  border-color: #1e40af;
  box-shadow: 0 0 0 2px rgba(30, 64, 175, 0.12);
}

.theme-card__label {
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 700;
}

.theme-card__preview {
  min-height: 140px;
  border-radius: 12px;
  padding: 14px;
}

.theme-card__kicker {
  margin-bottom: 8px;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.85;
}

.theme-card__title {
  margin-bottom: 10px;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.35;
}

.theme-card__text {
  font-size: 13px;
  line-height: 1.7;
  opacity: 0.9;
}

.theme-wechat-tech-green .theme-card__preview,
.theme-toutiao-tech-green .theme-card__preview {
  background: linear-gradient(180deg, #ffffff 0%, #eef4ff 100%);
  border: 1px solid #d4e2fc;
  color: #2b2b2b;
}

.theme-wechat-tech-green .theme-card__kicker,
.theme-toutiao-tech-green .theme-card__kicker {
  color: #1e40af;
}

.theme-wechat-tech-green .theme-card__title,
.theme-toutiao-tech-green .theme-card__title {
  color: #0f172a;
}

.theme-wechat-minimal-light .theme-card__preview,
.theme-toutiao-minimal-light .theme-card__preview {
  background: #ffffff;
  border: 1px solid #ececec;
  color: #303133;
}

.theme-wechat-minimal-light .theme-card__kicker,
.theme-wechat-minimal-light .theme-card__title,
.theme-toutiao-minimal-light .theme-card__kicker,
.theme-toutiao-minimal-light .theme-card__title {
  color: #111111;
}

.theme-wechat-dark-column .theme-card__preview,
.theme-toutiao-dark-column .theme-card__preview {
  background: linear-gradient(180deg, #0f172a 0%, #111c33 100%);
  border: 1px solid #1e293b;
  color: #dbe4ee;
}

.theme-wechat-dark-column .theme-card__kicker,
.theme-toutiao-dark-column .theme-card__kicker {
  color: #7dd3fc;
}

.theme-wechat-dark-column .theme-card__title,
.theme-toutiao-dark-column .theme-card__title {
  color: #f8fafc;
}

.preview-actions {
  margin-bottom: 10px;
  display: flex;
  gap: 8px;
}

.preview-box {
  min-height: 300px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  background: #fff;
}

@media (max-width: 1199px) {
  .theme-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 767px) {
  .theme-grid {
    grid-template-columns: 1fr;
  }
}
</style>
