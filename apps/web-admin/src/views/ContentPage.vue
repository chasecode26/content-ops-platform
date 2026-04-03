<template>
  <div class="page-container content-page">
    <div class="page-scroll">
      <section class="content-hero">
        <div>
          <p class="content-hero__eyebrow">Content Workspace</p>
          <h1 class="content-hero__title">内容管理工作台</h1>
          <p class="content-hero__desc">把内容库、版本编辑和多平台衍生收束到一块，不再让按钮挤成一团。</p>
        </div>
        <div class="content-hero__meta">
          <div class="hero-stat">
            <span class="hero-stat__label">内容总数</span>
            <strong>{{ total }}</strong>
          </div>
          <div class="hero-stat">
            <span class="hero-stat__label">当前选中</span>
            <strong>{{ detail?.title ?? "未选择" }}</strong>
          </div>
        </div>
      </section>

      <n-grid class="content-grid" :x-gap="18" :y-gap="18" cols="1 xl:5" responsive="screen">
        <n-gi span="1 xl:3">
          <n-card class="page-card panel-card" title="内容库">
            <n-space vertical :size="16">
              <div class="toolbar">
                <n-input v-model:value="query.keyword" placeholder="按标题搜索" clearable class="toolbar__search" />
                <div class="toolbar__actions">
                  <n-tooltip trigger="hover">
                    <template #trigger>
                      <n-button circle type="primary" @click="refresh">
                        <span class="icon-shell">
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path :d="appIconPaths.search" />
                          </svg>
                        </span>
                      </n-button>
                    </template>
                    查询
                  </n-tooltip>
                  <n-tooltip trigger="hover">
                    <template #trigger>
                      <n-button circle secondary @click="openImport = true">
                        <span class="icon-shell">
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path :d="appIconPaths.import" />
                          </svg>
                        </span>
                      </n-button>
                    </template>
                    导入 Markdown
                  </n-tooltip>
                </div>
              </div>

              <n-data-table
                :columns="columns"
                :data="contentRows"
                :pagination="false"
                :row-key="(row: ContentItem) => row.id"
                :single-line="false"
              />

              <n-pagination
                v-model:page="query.page"
                v-model:page-size="query.pageSize"
                :item-count="total"
                show-size-picker
                :page-sizes="[10, 20, 50]"
                @update:page="refresh"
                @update:page-size="refresh"
              />
            </n-space>
          </n-card>
        </n-gi>

        <n-gi span="1 xl:2">
          <n-card class="page-card panel-card editor-card" :title="detail ? `版本工作台 · ${detail.title}` : '版本工作台'">
            <n-empty v-if="!detail" description="请选择左侧内容，查看版本并管理" />
            <n-space v-else vertical :size="16">
              <div class="editor-summary">
                <div>
                  <span class="editor-summary__label">当前版本</span>
                  <strong>{{ selectedVersionLabel }}</strong>
                </div>
                <n-tag size="small" type="info">{{ detail.status ?? "DRAFT" }}</n-tag>
              </div>

              <n-select
                v-model:value="selectedVersionId"
                :options="versionOptions"
                placeholder="选择版本查看"
                @update:value="onVersionChange"
              />
              <n-input v-model:value="versionForm.title" placeholder="新版本标题" />
              <n-input v-model:value="versionForm.summary" placeholder="新版本摘要（可选）" />
              <n-input
                v-model:value="versionForm.markdownBody"
                type="textarea"
                :rows="12"
                placeholder="Markdown 内容"
              />
              <n-input v-model:value="versionForm.changeSummary" placeholder="变更说明（可选）" />
              <n-button type="primary" block @click="submitVersion">基于当前内容创建新版本</n-button>
            </n-space>
          </n-card>
        </n-gi>
      </n-grid>

      <n-modal v-model:show="openImport" preset="card" title="导入 Markdown" style="width: 720px; max-width: 96vw;">
        <n-form label-placement="top">
          <n-form-item label="标题">
            <n-input v-model:value="importForm.title" placeholder="输入文章标题" />
          </n-form-item>
          <n-form-item label="摘要">
            <n-input v-model:value="importForm.summary" placeholder="选填" />
          </n-form-item>
          <n-form-item label="Markdown">
            <n-input v-model:value="importForm.markdownBody" type="textarea" :rows="14" />
          </n-form-item>
          <n-form-item label=".md 文件">
            <input type="file" accept=".md,text/markdown,text/plain" @change="onFileChange" />
          </n-form-item>
          <n-space justify="end">
            <n-button @click="openImport = false">取消</n-button>
            <n-button @click="submitImport(false)">导入</n-button>
            <n-button type="primary" @click="submitImport(true)">导入并去草稿</n-button>
          </n-space>
        </n-form>
      </n-modal>

      <n-modal v-model:show="openVariant" preset="card" title="生成多平台变体" style="width: 900px; max-width: 96vw;">
        <n-space vertical>
          <div class="variant-toolbar">
            <n-select
              v-model:value="variantPlatform"
              :options="platformOptions"
              style="width: 200px"
              placeholder="选择平台"
            />
            <n-button type="primary" :loading="generating" @click="doGenerateVariant">
              {{ generating ? '生成中...' : '生成' }}
            </n-button>
          </div>

          <n-tabs v-if="variantResult" type="line" animated>
            <n-tab-pane name="preview" tab="预览">
              <div class="variant-preview-box">
                <h3>{{ variantResult.title }}</h3>
                <div v-if="variantResult.tags?.length" class="variant-tags">
                  <n-tag v-for="tag in variantResult.tags" :key="tag" size="small" type="info">{{ tag }}</n-tag>
                </div>
                <div class="variant-markdown" v-html="formatMarkdown(variantResult.markdownBody)"></div>
              </div>
            </n-tab-pane>
            <n-tab-pane name="raw" tab="原始 Markdown">
              <n-input
                v-model:value="variantResult.markdownBody"
                type="textarea"
                :rows="16"
                style="font-family: monospace"
              />
            </n-tab-pane>
          </n-tabs>

          <n-space v-if="variantResult" justify="end">
            <n-button secondary @click="copyVariantText">复制文本</n-button>
            <n-button type="primary" @click="saveVariantAsContent">保存为新母稿</n-button>
          </n-space>
        </n-space>
      </n-modal>

      <n-modal
        v-model:show="openThemePreview"
        preset="card"
        title="主题预览"
        style="width: 1080px; max-width: 96vw;"
      >
        <n-space vertical :size="16">
          <div class="theme-preview-toolbar">
            <n-select
              v-model:value="previewThemeCode"
              :options="themeOptions"
              style="width: 260px"
              placeholder="选择主题"
              @update:value="renderThemePreview"
            />
            <n-tag size="small" type="info">{{ previewSourceLabel }}</n-tag>
          </div>

          <n-spin :show="previewLoading">
            <n-empty v-if="!previewThemeHtml" description="暂无预览内容" />
            <div v-else class="theme-preview-frame" v-html="previewThemeHtml"></div>
          </n-spin>
        </n-space>
      </n-modal>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { NButton, NTag, NTooltip, useMessage } from "naive-ui";
import {
  createContentVersion,
  getContentById,
  generateVariant,
  importMarkdown,
  listContents,
  listThemes,
  renderPreview,
  type ContentDetail,
  type ContentItem,
  type ThemeItem,
} from "../api/services";
import { appIconPaths, renderPathIcon } from "../utils/icons";

const message = useMessage();
const router = useRouter();
const contentRows = ref<ContentItem[]>([]);
const total = ref(0);
const detail = ref<ContentDetail | null>(null);
const selectedVersionId = ref("");
const openImport = ref(false);
const openVariant = ref(false);
const openThemePreview = ref(false);
const generating = ref(false);
const previewLoading = ref(false);
const variantPlatform = ref("XIAOHONGSHU");
const variantResult = ref<{ title: string; markdownBody: string; tags?: string[] } | null>(null);
const themeItems = ref<ThemeItem[]>([]);
const previewThemeCode = ref("");
const previewThemeHtml = ref("");

const platformOptions = [
  { label: "📕 小红书", value: "XIAOHONGSHU" },
  { label: "💻 CSDN", value: "CSDN" },
  { label: "今日头条", value: "TOUTIAO" },
];

const query = reactive({
  page: 1,
  pageSize: 20,
  keyword: "",
});

const importForm = reactive({
  title: "",
  summary: "",
  markdownBody: "# 新文章\n\n这里开始写正文。",
});

const versionForm = reactive({
  title: "",
  summary: "",
  markdownBody: "",
  changeSummary: "",
});

const columns = [
  {
    title: "标题",
    key: "title",
    render: (row: ContentItem) =>
      h(
        NButton,
        {
          text: true,
          type: "primary",
          class: "content-link",
          onClick: () => {
            void loadDetail(row.id);
          },
        },
        { default: () => row.title },
      ),
  },
  {
    title: "状态",
    key: "status",
    width: 110,
    render: (row: ContentItem) =>
      h(
        NTag,
        { type: row.status === "FAILED" ? "error" : row.status === "PUBLISHED" ? "success" : "info" },
        { default: () => row.status ?? "-" },
      ),
  },
  { title: "版本", key: "latestVersionNo", width: 90, render: (row: ContentItem) => `v${row.latestVersionNo ?? 1}` },
  { title: "更新时间", key: "updatedAt", minWidth: 170 },
  {
    title: "操作",
    key: "actions",
    minWidth: 150,
    render: (row: ContentItem) =>
      h("div", { class: "content-actions" }, [
        h(
          NTooltip,
          null,
          {
            trigger: () =>
              h(
                NButton,
                {
                  size: "small",
                  circle: true,
                  tertiary: true,
                  onClick: () => void loadDetail(row.id),
                },
                { default: () => renderPathIcon(appIconPaths.detail) },
              ),
            default: () => "查看详情",
          },
        ),
        h(
          NTooltip,
          null,
          {
            trigger: () =>
              h(
                NButton,
                {
                  size: "small",
                  circle: true,
                  tertiary: true,
                  type: "info",
                  onClick: () => void openThemePreviewModal(row.id),
                },
                { default: () => renderPathIcon(appIconPaths.theme) },
              ),
            default: () => "主题预览",
          },
        ),
        h(
          NTooltip,
          null,
          {
            trigger: () =>
              h(
                NButton,
                {
                  size: "small",
                  circle: true,
                  secondary: true,
                  type: "warning",
                  onClick: () => void openVariantModal(row.id),
                },
                { default: () => renderPathIcon(appIconPaths.variant) },
              ),
            default: () => "多平台变体",
          },
        ),
      ]),
  },
];

const versionOptions = computed(() =>
  (detail.value?.versions ?? []).map((v) => ({
    label: `v${v.versionNo} · ${v.title}`,
    value: v.id,
  })),
);

const themeOptions = computed(() => themeItems.value.map((item) => ({ label: item.name, value: item.code })));

const selectedVersionLabel = computed(() => {
  const matched = detail.value?.versions.find((item) => item.id === selectedVersionId.value);
  return matched ? `v${matched.versionNo} · ${matched.title}` : "未选择版本";
});

const previewSourceLabel = computed(() => {
  return selectedVersionLabel.value === "未选择版本" ? "当前内容" : selectedVersionLabel.value;
});

async function refresh() {
  const resp = await listContents({
    page: query.page,
    pageSize: query.pageSize,
    keyword: query.keyword || undefined,
  });
  contentRows.value = resp.items;
  total.value = resp.total;
}

async function loadThemes() {
  themeItems.value = await listThemes();
  if (!previewThemeCode.value) {
    previewThemeCode.value = themeItems.value[0]?.code ?? "";
  }
}

async function loadDetail(contentId: string) {
  detail.value = await getContentById(contentId);
  selectedVersionId.value = detail.value.latestVersion?.id ?? detail.value.versions[0]?.id ?? "";
  onVersionChange(selectedVersionId.value);
}

function onVersionChange(versionId: string) {
  const versionMeta = detail.value?.versions.find((item) => item.id === versionId);
  if (!detail.value || !versionMeta) return;

  versionForm.title = versionMeta.title;
  versionForm.summary = versionMeta.summary ?? "";
  versionForm.markdownBody = versionMeta.markdownBody;
  versionForm.changeSummary = "";
}

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const text = await file.text();
  importForm.markdownBody = text;
  if (!importForm.title.trim()) {
    importForm.title = file.name.replace(/\.md$/i, "");
  }
}

async function submitImport(goDraft: boolean) {
  if (!importForm.title.trim() || !importForm.markdownBody.trim()) {
    message.warning("请填写标题和正文");
    return;
  }
  const res = await importMarkdown({
    title: importForm.title,
    summary: importForm.summary || undefined,
    markdownBody: importForm.markdownBody,
  });
  message.success("导入成功");
  openImport.value = false;
  await refresh();
  await loadDetail(res.contentId);
  if (goDraft) {
    await router.push({
      path: "/drafts",
      query: {
        contentId: res.contentId,
        versionId: res.versionId,
      },
    });
  }
}

async function submitVersion() {
  if (!detail.value) return;
  if (!versionForm.title.trim() || !versionForm.markdownBody.trim()) {
    message.warning("标题和正文不能为空");
    return;
  }
  await createContentVersion(detail.value.id, {
    title: versionForm.title,
    summary: versionForm.summary || undefined,
    markdownBody: versionForm.markdownBody,
    changeSummary: versionForm.changeSummary || undefined,
  });
  message.success("新版本已创建");
  await loadDetail(detail.value.id);
  await refresh();
}

function openVariantModal(contentId: string) {
  void loadDetail(contentId);
  variantResult.value = null;
  openVariant.value = true;
}

async function openThemePreviewModal(contentId: string) {
  await loadDetail(contentId);
  openThemePreview.value = true;
  await renderThemePreview();
}

async function renderThemePreview() {
  if (!previewThemeCode.value) {
    message.warning("请先选择主题");
    return;
  }
  const markdown = versionForm.markdownBody || detail.value?.latestVersion?.markdownBody;
  const titleText = versionForm.title || detail.value?.title;
  if (!markdown || !titleText) {
    previewThemeHtml.value = "";
    message.warning("当前内容暂无可预览正文");
    return;
  }

  previewLoading.value = true;
  try {
    previewThemeHtml.value = await renderPreview({
      themeCode: previewThemeCode.value,
      platform: "WECHAT_OFFICIAL",
      markdownBody: markdown,
      title: titleText,
    });
  } catch (err: any) {
    previewThemeHtml.value = "";
    message.error(`主题预览失败：${err.message || "未知错误"}`);
  } finally {
    previewLoading.value = false;
  }
}

async function doGenerateVariant() {
  if (!detail.value) {
    message.warning("请先选择一篇内容");
    return;
  }
  const markdown = versionForm.markdownBody || detail.value.latestVersion?.markdownBody;
  if (!markdown) {
    message.warning("当前版本没有正文内容");
    return;
  }
  generating.value = true;
  try {
    variantResult.value = await generateVariant(
      variantPlatform.value,
      markdown,
      versionForm.title || detail.value.title,
    );
    message.success("变体生成完成");
  } catch (err: any) {
    message.error("生成失败：" + (err.message || "未知错误"));
  } finally {
    generating.value = false;
  }
}

async function copyVariantText() {
  if (!variantResult.value) return;
  const text = `# ${variantResult.value.title}\n\n${variantResult.value.markdownBody}`;
  await navigator.clipboard.writeText(text);
  message.success("已复制到剪贴板");
}

async function saveVariantAsContent() {
  if (!variantResult.value) return;
  try {
    const res = await importMarkdown({
      title: variantResult.value.title,
      summary: `${variantPlatform.value} 变体`,
      markdownBody: variantResult.value.markdownBody,
      tags: variantResult.value.tags,
    });
    message.success("已保存为新母稿");
    openVariant.value = false;
    await refresh();
    await loadDetail(res.contentId);
  } catch (err: any) {
    message.error("保存失败：" + (err.message || "未知错误"));
  }
}

function formatMarkdown(text: string) {
  return text
    .replace(/^### (.+)$/gm, "<h4>$1</h4>")
    .replace(/^## (.+)$/gm, "<h3>$1</h3>")
    .replace(/^# (.+)$/gm, "<h2>$1</h2>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/^\- (.+)$/gm, "<li>$1</li>")
    .replace(/\n/g, "<br>");
}

onMounted(async () => {
  await Promise.all([refresh(), loadThemes()]);
  if (contentRows.value.length > 0) {
    await loadDetail(contentRows.value[0].id);
  }
});
</script>

<style scoped>
.content-page {
  min-height: 0;
  gap: 18px;
}

.content-page > .page-scroll {
  min-height: 0;
}

.content-hero {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 18px;
  padding: 24px 26px;
  border: 1px solid rgba(20, 54, 89, 0.08);
  border-radius: 24px;
  background:
    radial-gradient(circle at top right, rgba(68, 183, 255, 0.2), transparent 36%),
    linear-gradient(135deg, #0f172a 0%, #16324f 45%, #1a5f7a 100%);
  color: #f8fafc;
}

.content-hero__eyebrow {
  margin: 0 0 10px;
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  opacity: 0.72;
}

.content-hero__title {
  margin: 0;
  font-size: 28px;
}

.content-hero__desc {
  max-width: 680px;
  margin: 10px 0 0;
  line-height: 1.7;
  color: rgba(248, 250, 252, 0.8);
}

.content-hero__meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(140px, 1fr));
  gap: 12px;
  min-width: min(340px, 100%);
}

.hero-stat {
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
}

.hero-stat__label {
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
  color: rgba(248, 250, 252, 0.68);
}

.hero-stat strong {
  display: block;
  font-size: 18px;
  line-height: 1.5;
}

.content-grid {
  flex: 1;
  min-height: 0;
}

.content-grid :deep(.n-grid-item) {
  min-height: 0;
}

.panel-card {
  border-radius: 22px;
  height: 100%;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: space-between;
  align-items: center;
}

.toolbar__search {
  width: min(360px, 100%);
}

.toolbar__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.editor-card {
  min-height: 100%;
}

.editor-summary {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  padding: 14px 16px;
  border: 1px solid #d9e5f2;
  border-radius: 18px;
  background: linear-gradient(180deg, #f8fbff 0%, #eef6ff 100%);
}

.editor-summary__label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  color: #58708b;
}

.content-actions {
  display: flex;
  flex-wrap: nowrap;
  gap: 6px;
  justify-content: flex-end;
  white-space: nowrap;
}

.icon-shell {
  display: inline-flex;
  width: 16px;
  height: 16px;
}

.icon-shell svg,
.icon-shell :deep(svg) {
  width: 16px;
  height: 16px;
  fill: currentColor;
}

.theme-preview-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.theme-preview-frame {
  max-height: 70vh;
  overflow: auto;
  padding: 18px;
  border: 1px solid #dce7f2;
  border-radius: 18px;
  background: linear-gradient(180deg, #fcfdff 0%, #f4f8fc 100%);
}

.variant-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.variant-preview-box {
  padding: 18px;
  background: linear-gradient(180deg, #fcfdff 0%, #f4f8fc 100%);
  border-radius: 18px;
  border: 1px solid #dce7f2;
  max-height: 500px;
  overflow-y: auto;
}

.variant-preview-box h3 {
  margin: 0 0 12px;
  font-size: 18px;
  color: #1f2a37;
}

.variant-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.variant-markdown {
  font-size: 14px;
  line-height: 1.9;
  color: #475569;
}

.variant-markdown :deep(h2),
.variant-markdown :deep(h3),
.variant-markdown :deep(h4) {
  margin: 16px 0 8px;
  color: #0f172a;
}

.variant-markdown :deep(code) {
  background: #eaf2fb;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

@media (max-width: 1100px) {
  .content-hero {
    flex-direction: column;
  }

  .content-hero__meta {
    grid-template-columns: 1fr;
  }
}
</style>
