<template>
  <div class="page-container content-page">
    <div class="page-scroll">
      <div class="page-split-grid">
        <n-card class="page-card" title="内容管理">
          <n-space vertical>
            <n-space justify="space-between" align="center" wrap>
              <n-space>
                <n-input
                  v-model:value="query.keyword"
                  placeholder="按标题或摘要搜索"
                  clearable
                  style="width: 280px"
                  @keyup.enter="refresh"
                />
                <n-button type="primary" @click="refresh">查询</n-button>
                <n-button secondary @click="openImport = true">导入 Markdown</n-button>
              </n-space>
            </n-space>

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

        <n-card class="page-card" :title="detail ? `版本工作台 · ${detail.title}` : '版本工作台'">
          <n-empty v-if="!detail" description="先在左侧选择一篇内容" />

          <n-space v-else vertical size="large">
            <div class="detail-toolbar">
              <div>
                <div class="detail-title">{{ currentVersionTitle }}</div>
                <div class="detail-meta">当前版本 {{ currentVersionLabel }}</div>
              </div>
              <n-space>
                <n-button secondary @click="openThemePreview()">主题预览</n-button>
                <n-button type="primary" @click="goDraftTask()">去草稿任务</n-button>
              </n-space>
            </div>

            <n-select
              v-model:value="selectedVersionId"
              :options="versionOptions"
              placeholder="选择版本"
              @update:value="onVersionChange"
            />

            <n-input v-model:value="versionForm.title" placeholder="标题" />
            <n-input v-model:value="versionForm.summary" placeholder="摘要，可选" />
            <n-input
              v-model:value="versionForm.markdownBody"
              type="textarea"
              :rows="14"
              placeholder="Markdown 正文"
            />
            <n-input v-model:value="versionForm.changeSummary" placeholder="本次修改说明，可选" />

            <n-space>
              <n-button type="primary" @click="submitVersion">基于当前内容创建新版本</n-button>
              <n-button tertiary @click="fillFromLatest">恢复最新版本内容</n-button>
            </n-space>
          </n-space>
        </n-card>
      </div>

      <n-modal v-model:show="openImport" preset="card" title="导入 Markdown" style="width: 760px; max-width: 96vw">
        <n-form label-placement="top">
          <n-form-item label="标题">
            <n-input v-model:value="importForm.title" placeholder="输入文章标题" />
          </n-form-item>
          <n-form-item label="摘要">
            <n-input v-model:value="importForm.summary" placeholder="可选" />
          </n-form-item>
          <n-form-item label="Markdown">
            <n-input v-model:value="importForm.markdownBody" type="textarea" :rows="16" />
          </n-form-item>
          <n-form-item label=".md 文件">
            <input type="file" accept=".md,text/markdown,text/plain" @change="onFileChange" />
          </n-form-item>
          <n-space justify="end">
            <n-button @click="openImport = false">取消</n-button>
            <n-button @click="submitImport(false)">仅导入</n-button>
            <n-button type="primary" @click="submitImport(true)">导入后直接去草稿任务</n-button>
          </n-space>
        </n-form>
      </n-modal>

      <n-modal v-model:show="openVariant" preset="card" title="生成多平台变体" style="width: 900px; max-width: 96vw">
        <n-space vertical>
          <n-space>
            <n-select
              v-model:value="variantPlatform"
              :options="platformOptions"
              style="width: 220px"
              placeholder="选择平台"
            />
            <n-button type="primary" :loading="generating" @click="doGenerateVariant">
              {{ generating ? '生成中...' : '生成变体' }}
            </n-button>
          </n-space>

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
            <n-button type="primary" @click="saveVariantAsContent">保存为新内容</n-button>
          </n-space>
        </n-space>
      </n-modal>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { NButton, NTag, useMessage } from "naive-ui";
import {
  createContentVersion,
  generateVariant,
  getContentById,
  importMarkdown,
  listContents,
  type ContentDetail,
  type ContentItem,
  type ContentVersionItem,
} from "../api/services";

const message = useMessage();
const router = useRouter();

const contentRows = ref<ContentItem[]>([]);
const total = ref(0);
const detail = ref<ContentDetail | null>(null);
const selectedVersionId = ref("");
const openImport = ref(false);
const openVariant = ref(false);
const generating = ref(false);
const variantPlatform = ref("XIAOHONGSHU");
const variantResult = ref<{ title: string; markdownBody: string; tags?: string[] } | null>(null);

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

const platformOptions = [
  { label: "小红书", value: "XIAOHONGSHU" },
  { label: "CSDN", value: "CSDN" },
];

const versionOptions = computed(() =>
  (detail.value?.versions ?? []).map((version) => ({
    label: `v${version.versionNo} · ${version.title}`,
    value: version.id,
  })),
);

const currentVersion = computed<ContentVersionItem | null>(() => {
  if (!detail.value) {
    return null;
  }
  return detail.value.versions.find((item) => item.id === selectedVersionId.value) ?? detail.value.latestVersion;
});

const currentVersionLabel = computed(() => {
  const version = currentVersion.value;
  return version ? `v${version.versionNo}` : "-";
});

const currentVersionTitle = computed(() => currentVersion.value?.title ?? detail.value?.title ?? "");

function syncVersionForm(version: ContentVersionItem | null) {
  if (!version) {
    return;
  }
  versionForm.title = version.title;
  versionForm.summary = version.summary ?? "";
  versionForm.markdownBody = version.markdownBody ?? "";
}

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
    render: (row: ContentItem) =>
      h(
        NTag,
        { type: row.status === "FAILED" ? "error" : row.status === "PUBLISHED" ? "success" : "info" },
        { default: () => row.status ?? "-" },
      ),
  },
  { title: "版本", key: "latestVersionNo", render: (row: ContentItem) => `v${row.latestVersionNo ?? 1}` },
  { title: "更新时间", key: "updatedAt" },
  {
    title: "操作",
    key: "actions",
    render: (row: ContentItem) =>
      h("div", { style: "display:flex;gap:8px;flex-wrap:wrap;" }, [
        h(
          NButton,
          {
            size: "small",
            tertiary: true,
            onClick: () => {
              void openThemePreview(row.id);
            },
          },
          { default: () => "主题预览" },
        ),
        h(
          NButton,
          {
            size: "small",
            type: "primary",
            ghost: true,
            onClick: () => {
              void goDraftTask(row.id);
            },
          },
          { default: () => "去草稿任务" },
        ),
        h(
          NButton,
          {
            size: "small",
            type: "warning",
            secondary: true,
            onClick: () => {
              void openVariantModal(row.id);
            },
          },
          { default: () => "多平台变体" },
        ),
      ]),
  },
];

async function refresh() {
  const resp = await listContents({
    page: query.page,
    pageSize: query.pageSize,
    keyword: query.keyword || undefined,
  });
  contentRows.value = resp.items;
  total.value = resp.total;
}

async function loadDetail(contentId: string) {
  detail.value = await getContentById(contentId);
  selectedVersionId.value = detail.value.latestVersion?.id ?? detail.value.versions[0]?.id ?? "";
  onVersionChange(selectedVersionId.value);
}

function onVersionChange(versionId: string) {
  if (!detail.value) {
    return;
  }
  const version = detail.value.versions.find((item) => item.id === versionId) ?? detail.value.latestVersion;
  if (!version) {
    return;
  }
  selectedVersionId.value = version.id;
  syncVersionForm(version);
}

function fillFromLatest() {
  if (!detail.value?.latestVersion) {
    return;
  }
  selectedVersionId.value = detail.value.latestVersion.id;
  syncVersionForm(detail.value.latestVersion);
}

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) {
    return;
  }
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
      query: { contentId: res.contentId, versionId: res.versionId },
    });
  }
}

async function submitVersion() {
  if (!detail.value) {
    return;
  }
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

  versionForm.changeSummary = "";
  message.success("新版本已创建");
  await loadDetail(detail.value.id);
  await refresh();
}

async function resolveTarget(contentId?: string) {
  if (contentId) {
    const loaded = await getContentById(contentId);
    const versionId = loaded.latestVersion?.id ?? loaded.versions[0]?.id ?? "";
    return { contentId, versionId };
  }
  if (!detail.value) {
    return null;
  }
  return {
    contentId: detail.value.id,
    versionId: selectedVersionId.value || detail.value.latestVersion?.id || detail.value.versions[0]?.id || "",
  };
}

async function openThemePreview(contentId?: string) {
  const target = await resolveTarget(contentId);
  if (!target) {
    message.warning("请先选择内容");
    return;
  }
  await router.push({ path: "/themes", query: target });
}

async function goDraftTask(contentId?: string) {
  const target = await resolveTarget(contentId);
  if (!target) {
    message.warning("请先选择内容");
    return;
  }
  await router.push({ path: "/drafts", query: target });
}

async function openVariantModal(contentId: string) {
  await loadDetail(contentId);
  variantResult.value = null;
  openVariant.value = true;
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
    variantResult.value = await generateVariant(variantPlatform.value, markdown, versionForm.title || detail.value.title);
    message.success("变体生成完成");
  } catch (error: any) {
    message.error(`生成失败：${error.message || "未知错误"}`);
  } finally {
    generating.value = false;
  }
}

async function copyVariantText() {
  if (!variantResult.value) {
    return;
  }
  const text = `# ${variantResult.value.title}\n\n${variantResult.value.markdownBody}`;
  await navigator.clipboard.writeText(text);
  message.success("已复制到剪贴板");
}

async function saveVariantAsContent() {
  if (!variantResult.value) {
    return;
  }
  try {
    const res = await importMarkdown({
      title: variantResult.value.title,
      summary: `${variantPlatform.value} 变体`,
      markdownBody: variantResult.value.markdownBody,
      tags: variantResult.value.tags,
    });
    message.success("已保存为新内容");
    openVariant.value = false;
    await refresh();
    await loadDetail(res.contentId);
  } catch (error: any) {
    message.error(`保存失败：${error.message || "未知错误"}`);
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
    .replace(/(?:^- .+$\n?)+/gm, (block) => {
      const items = block
        .trim()
        .split("\n")
        .map((line) => line.replace(/^- /, ""))
        .map((line) => `<li>${line}</li>`)
        .join("");
      return `<ul>${items}</ul>`;
    })
    .replace(/\n/g, "<br>");
}

onMounted(async () => {
  await refresh();
  if (contentRows.value.length > 0) {
    await loadDetail(contentRows.value[0].id);
  }
});
</script>

<style scoped>
.detail-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}

.detail-title {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
}

.detail-meta {
  margin-top: 6px;
  color: #6b7280;
  font-size: 13px;
}

.variant-preview-box {
  padding: 16px;
  background: #fafbfc;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  max-height: 500px;
  overflow-y: auto;
}

.variant-preview-box h3 {
  margin: 0 0 12px;
  font-size: 18px;
  color: #303133;
}

.variant-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.variant-markdown {
  font-size: 14px;
  line-height: 1.8;
  color: #606266;
}

.variant-markdown :deep(h2),
.variant-markdown :deep(h3),
.variant-markdown :deep(h4) {
  margin: 16px 0 8px;
  color: #303133;
}

.variant-markdown :deep(ul) {
  margin: 8px 0 8px 20px;
}

.variant-markdown :deep(code) {
  background: #f0f2f5;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}
</style>
