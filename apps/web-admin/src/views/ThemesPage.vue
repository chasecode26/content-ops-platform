<template>
  <div class="page-container themes-page">
    <div class="page-scroll">
      <n-space vertical size="large">
        <n-card class="page-card" title="选择主题">
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
                <div class="theme-card__kicker">公众号预览</div>
                <div class="theme-card__title">{{ presetTitle || '正文效果预览' }}</div>
                <div class="theme-card__text">从内容管理带入正文后，切主题会直接刷新右侧成稿预览。</div>
              </div>
            </button>
          </div>
        </n-card>

        <div class="page-split-grid preview-layout">
          <n-card class="page-card" title="预览内容">
            <n-space vertical>
              <div v-if="sourceBadge" class="source-badge">{{ sourceBadge }}</div>
              <n-form label-placement="top">
                <n-form-item label="当前主题">
                  <n-select v-model:value="themeCode" :options="themeOptions" @update:value="preview" />
                </n-form-item>
                <n-form-item label="标题">
                  <n-input v-model:value="title" @blur="preview" />
                </n-form-item>
                <n-form-item label="Markdown">
                  <n-input v-model:value="markdownBody" type="textarea" :rows="18" @blur="preview" />
                </n-form-item>
              </n-form>
              <n-space>
                <n-button type="primary" @click="preview">刷新预览</n-button>
                <n-button secondary @click="goDraftTask">带着当前主题去草稿任务</n-button>
                <n-button tertiary @click="copyHtml">复制 HTML</n-button>
              </n-space>
            </n-space>
          </n-card>

          <n-card class="page-card" title="HTML 预览">
            <div class="preview-actions">
              <n-tag type="info">长度 {{ html.length }} 字符</n-tag>
            </div>
            <div class="preview-box" v-html="html"></div>
          </n-card>
        </div>
      </n-space>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useMessage } from "naive-ui";
import { getContentById, listThemes, renderPreview, type ContentVersionItem, type ThemeItem } from "../api/services";

const message = useMessage();
const route = useRoute();
const router = useRouter();

const themes = ref<ThemeItem[]>([]);
const themeCode = ref("");
const title = ref("主题预览：让正文更像成稿");
const markdownBody = ref(`# 标题层级\n\n一套合格的公众号主题，不只是换个颜色，而是让导语、段落、提示块和代码区都有自己的秩序。\n\n## 这一版加了什么\n\n- 内容管理可以直接带正文进来\n- 切换主题时会立即刷新成稿效果\n- 草稿任务会沿用当前选中的主题\n\n> 主题预览不该是孤岛，它应该嵌在真实发稿流程里。`);
const html = ref("");
const contentId = ref("");
const versionId = ref("");
const presetTitle = ref("");

const themeOptions = computed(() => themes.value.map((item) => ({ label: item.name, value: item.code })));
const sourceBadge = computed(() => {
  if (!contentId.value) {
    return "当前是独立预览模式";
  }
  return `已从内容管理带入 · ${presetTitle.value || title.value}`;
});

function pickVersion(versions: ContentVersionItem[], targetVersionId: string, fallbackId?: string) {
  return versions.find((item) => item.id === targetVersionId) ?? versions.find((item) => item.id === fallbackId) ?? versions[0] ?? null;
}

async function loadThemes() {
  themes.value = await listThemes();
  const presetThemeCode = typeof route.query.themeCode === "string" ? route.query.themeCode : "";
  themeCode.value = presetThemeCode || themeCode.value || themes.value[0]?.code || "";
}

async function applyRoutePreset() {
  const routeContentId = typeof route.query.contentId === "string" ? route.query.contentId : "";
  const routeVersionId = typeof route.query.versionId === "string" ? route.query.versionId : "";
  contentId.value = routeContentId;
  versionId.value = routeVersionId;

  if (!routeContentId) {
    presetTitle.value = title.value;
    return;
  }

  const detail = await getContentById(routeContentId);
  const current = pickVersion(detail.versions, routeVersionId, detail.latestVersion?.id);
  if (!current) {
    return;
  }

  versionId.value = current.id;
  title.value = current.title;
  markdownBody.value = current.markdownBody ?? detail.latestVersion?.markdownBody ?? "";
  presetTitle.value = current.title;
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
    platform: "WECHAT_OFFICIAL",
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

async function goDraftTask() {
  if (!contentId.value) {
    message.warning("请先从内容管理选择内容，再进入草稿任务");
    return;
  }
  await router.push({
    path: "/drafts",
    query: {
      contentId: contentId.value,
      versionId: versionId.value,
      themeCode: themeCode.value,
    },
  });
}

onMounted(async () => {
  await loadThemes();
  await applyRoutePreset();
  await preview();
});
</script>

<style scoped>
.preview-layout {
  align-items: start;
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 14px;
}

.theme-card {
  width: 100%;
  border: 1px solid #dbe4ee;
  border-radius: 18px;
  padding: 14px;
  background: #fff;
  cursor: pointer;
  text-align: left;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.theme-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.08);
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
  min-height: 160px;
  border-radius: 14px;
  padding: 16px;
  position: relative;
  overflow: hidden;
}

.theme-card__kicker {
  margin-bottom: 10px;
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
  opacity: 0.92;
}

.theme-wechat-tech-green .theme-card__preview {
  background: linear-gradient(180deg, #0f3d91 0%, #1c4fb0 100%);
  border: 1px solid #295fc6;
  color: #e8f0ff;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.theme-wechat-tech-green .theme-card__preview::after {
  content: "";
  position: absolute;
  inset: auto -12px -28px auto;
  width: 112px;
  height: 112px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
}

.theme-wechat-tech-green .theme-card__kicker {
  color: #bfdbfe;
}

.theme-wechat-tech-green .theme-card__title {
  color: #ffffff;
}

.theme-wechat-minimal-light .theme-card__preview {
  background: #ffffff;
  border: 1px solid #ececec;
  color: #303133;
}

.theme-wechat-minimal-light .theme-card__kicker,
.theme-wechat-minimal-light .theme-card__title {
  color: #111111;
}

.theme-wechat-dark-column .theme-card__preview {
  background: linear-gradient(180deg, #0f172a 0%, #111c33 100%);
  border: 1px solid #1e293b;
  color: #dbe4ee;
}

.theme-wechat-dark-column .theme-card__kicker {
  color: #7dd3fc;
}

.theme-wechat-dark-column .theme-card__title {
  color: #f8fafc;
}

.theme-wechat-superpowers-green .theme-card__preview {
  background: linear-gradient(180deg, #f8fff9 0%, #eefcf2 100%);
  border: 1px solid #cfeedd;
  color: #1b4332;
}

.theme-wechat-superpowers-green .theme-card__preview::before {
  content: "";
  position: absolute;
  inset: 14px 14px auto auto;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: rgba(7, 193, 96, 0.12);
}

.theme-wechat-superpowers-green .theme-card__kicker {
  color: #06ad56;
}

.theme-wechat-superpowers-green .theme-card__title {
  color: #11703f;
}

.source-badge {
  padding: 10px 12px;
  border-radius: 12px;
  background: #f5f8ff;
  border: 1px solid #dbe7ff;
  color: #3158a5;
  font-size: 13px;
}

.preview-actions {
  margin-bottom: 10px;
}

.preview-box {
  min-height: 320px;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 16px;
  background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
}

@media (max-width: 767px) {
  .theme-grid {
    grid-template-columns: 1fr;
  }
}
</style>
