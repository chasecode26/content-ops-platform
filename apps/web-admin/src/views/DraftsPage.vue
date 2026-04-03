<template>
  <div class="page-container drafts-page">
    <div class="page-scroll">
      <section class="drafts-hero">
        <div>
          <p class="drafts-hero__eyebrow">Draft Delivery Console</p>
          <h1 class="drafts-hero__title">草稿箱投递工作台</h1>
          <p class="drafts-hero__desc">按平台选择账号、主题与版本，右侧直接预览成稿效果，底部追踪投递任务。</p>
        </div>
        <div class="drafts-hero__chips">
          <div class="hero-chip">
            <span>任务总数</span>
            <strong>{{ total }}</strong>
          </div>
          <div class="hero-chip">
            <span>当前平台</span>
            <strong>{{ platformLabelMap[form.platform] }}</strong>
          </div>
        </div>
      </section>

      <n-grid :x-gap="18" :y-gap="18" cols="1 xl:5" responsive="screen">
        <n-gi span="1 xl:2">
          <n-card class="page-card panel-card" title="新建草稿任务">
            <n-space vertical :size="16">
              <div class="form-summary">
                <div>
                  <span class="form-summary__label">内容</span>
                  <strong>{{ selectedContentTitle }}</strong>
                </div>
                <div>
                  <span class="form-summary__label">主题</span>
                  <strong>{{ selectedThemeName }}</strong>
                </div>
              </div>

              <n-form label-placement="top">
                <n-form-item label="平台">
                  <n-select v-model:value="form.platform" :options="platformOptions" @update:value="onPlatformChange" />
                </n-form-item>
                <n-form-item label="内容">
                  <n-select v-model:value="form.contentId" :options="contentOptions" @update:value="onContentChange" />
                </n-form-item>
                <n-form-item label="版本">
                  <n-select v-model:value="form.versionId" :options="versionOptions" placeholder="选择版本" />
                </n-form-item>
                <n-form-item label="账号">
                  <n-select v-model:value="form.channelAccountId" :options="accountOptions" placeholder="选择账号" />
                </n-form-item>
                <n-form-item label="主题">
                  <n-select v-model:value="form.themeCode" :options="themeOptions" placeholder="选择主题" />
                </n-form-item>
                <n-button type="primary" block @click="submit">投递草稿</n-button>
              </n-form>
            </n-space>
          </n-card>
        </n-gi>

        <n-gi span="1 xl:3">
          <n-card class="page-card panel-card preview-card" title="右侧预览">
            <div class="preview-meta">
              <n-tag size="small" type="info">{{ form.versionId ? selectedVersionLabel : "未选择版本" }}</n-tag>
              <n-tag size="small" type="warning">{{ platformLabelMap[form.platform] }}</n-tag>
              <n-tag size="small" :type="previewError ? 'error' : previewHtml ? 'success' : 'default'">
                {{ previewLoading ? "生成中" : previewError ? "预览失败" : previewHtml ? "可投递" : "待选择" }}
              </n-tag>
            </div>

            <n-spin :show="previewLoading">
              <n-result
                v-if="previewError"
                status="error"
                title="预览生成失败"
                :description="previewError"
              >
                <template #footer>
                  <n-button secondary @click="updateComposerPreview">重新渲染</n-button>
                </template>
              </n-result>

              <n-empty
                v-else-if="!previewHtml"
                description="选择内容、版本、平台与主题后，这里会直接显示成稿预览。"
              />

              <div v-else class="preview-shell">
                <div class="preview-shell__toolbar">
                  <div>
                    <span class="preview-shell__label">预览内容</span>
                    <strong>{{ selectedContentTitle }}</strong>
                  </div>
                  <div>
                    <span class="preview-shell__label">目标平台</span>
                    <strong>{{ platformLabelMap[form.platform] }}</strong>
                  </div>
                </div>
                <div class="preview-frame" v-html="previewHtml"></div>
              </div>
            </n-spin>
          </n-card>
        </n-gi>
      </n-grid>

      <n-card class="page-card panel-card draft-list-card" title="草稿任务列表">
        <n-space vertical :size="16">
          <div class="list-toolbar">
            <n-select
              v-model:value="query.status"
              :options="statusOptions"
              clearable
              placeholder="按状态筛选"
              style="width: 220px"
            />
            <n-tooltip trigger="hover">
              <template #trigger>
                <n-button circle secondary @click="refresh">
                  <span class="action-icon">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path :d="appIconPaths.search" />
                    </svg>
                  </span>
                </n-button>
              </template>
              查询
            </n-tooltip>
          </div>
          <n-data-table :columns="columns" :data="drafts" :pagination="false" />
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

      <n-drawer v-model:show="showDetail" :width="520" placement="right">
        <n-drawer-content title="任务详情">
          <n-space vertical :size="16">
            <n-descriptions :column="1" bordered label-placement="left">
              <n-descriptions-item label="任务 ID">{{ detail?.publishJobId ?? "-" }}</n-descriptions-item>
              <n-descriptions-item label="状态">{{ detail?.status ?? "-" }}</n-descriptions-item>
              <n-descriptions-item label="内容">{{ detail?.content.title ?? "-" }}</n-descriptions-item>
              <n-descriptions-item label="主题">{{ detail?.draftRecord.themeCode ?? "-" }}</n-descriptions-item>
              <n-descriptions-item label="平台草稿 ID">{{ detail?.draftRecord.platformDraftId ?? "-" }}</n-descriptions-item>
              <n-descriptions-item label="错误信息">{{ detail?.draftRecord.errorMessage ?? "-" }}</n-descriptions-item>
              <n-descriptions-item label="创建时间">{{ detail?.createdAt ?? "-" }}</n-descriptions-item>
            </n-descriptions>

            <div v-if="detail?.draftRecord.renderedHtml" class="detail-preview">
              <div class="detail-preview__label">任务快照</div>
              <div class="preview-frame" v-html="detail.draftRecord.renderedHtml"></div>
            </div>
          </n-space>
          <template #footer>
            <n-space justify="end">
              <n-button @click="showDetail = false">关闭</n-button>
              <n-button v-if="detail?.status === 'FAILED'" type="warning" @click="retryFromDetail">失败重试</n-button>
            </n-space>
          </template>
        </n-drawer-content>
      </n-drawer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { NButton, NTag, NTooltip, useMessage } from "naive-ui";
import {
  createDraft,
  getContentById,
  getDraftDetail,
  listAccounts,
  listContents,
  listDrafts,
  listThemes,
  renderPreview,
  retryDraft,
  type AccountItem,
  type ContentItem,
  type ContentVersionItem,
  type DraftDetail,
  type DraftJobItem,
  type ThemeItem,
} from "../api/services";
import { appIconPaths, renderPathIcon } from "../utils/icons";

const message = useMessage();
const route = useRoute();
const contents = ref<ContentItem[]>([]);
const accounts = ref<AccountItem[]>([]);
const themes = ref<ThemeItem[]>([]);
const drafts = ref<DraftJobItem[]>([]);
const versions = ref<ContentVersionItem[]>([]);
const total = ref(0);

const showDetail = ref(false);
const detail = ref<DraftDetail | null>(null);
const previewHtml = ref("");
const previewError = ref("");
const previewLoading = ref(false);

const platformOptions = [
  { label: "微信公众号", value: "WECHAT_OFFICIAL" },
  { label: "今日头条", value: "TOUTIAO" },
];

const platformLabelMap: Record<string, string> = {
  WECHAT_OFFICIAL: "微信公众号",
  TOUTIAO: "今日头条",
};

let pollTimer: ReturnType<typeof setTimeout> | null = null;
let previewTimer: ReturnType<typeof setTimeout> | null = null;
let previewTaskId = 0;

const form = reactive({
  platform: "WECHAT_OFFICIAL",
  contentId: "",
  versionId: "",
  channelAccountId: "",
  themeCode: "",
});

const query = reactive({
  status: "",
  page: 1,
  pageSize: 20,
});

const statusOptions = [
  { label: "DRAFTED", value: "DRAFTED" },
  { label: "FAILED", value: "FAILED" },
  { label: "PUSHING", value: "PUSHING" },
  { label: "PENDING", value: "PENDING" },
];

const contentOptions = computed(() => contents.value.map((item) => ({ label: item.title, value: item.id })));
const versionOptions = computed(() =>
  versions.value.map((item) => ({ label: `v${item.versionNo} · ${item.title}`, value: item.id })),
);
const accountOptions = computed(() => accounts.value.map((item) => ({ label: item.name, value: item.id })));
const themeOptions = computed(() => themes.value.map((item) => ({ label: item.name, value: item.code })));

const selectedContentTitle = computed(
  () => contents.value.find((item) => item.id === form.contentId)?.title ?? "未选择内容",
);
const selectedThemeName = computed(
  () => themes.value.find((item) => item.code === form.themeCode)?.name ?? "未选择主题",
);
const selectedVersionLabel = computed(() => {
  const matched = versions.value.find((item) => item.id === form.versionId);
  return matched ? `v${matched.versionNo} · ${matched.title}` : "未选择版本";
});

async function loadAccountsAndThemes() {
  const [accountList, themeList] = await Promise.all([
    listAccounts(form.platform),
    listThemes(form.platform === "TOUTIAO" ? "WECHAT_OFFICIAL" : form.platform),
  ]);
  accounts.value = accountList;
  themes.value = themeList;
  if (!accountList.some((item) => item.id === form.channelAccountId)) {
    form.channelAccountId = accountList[0]?.id ?? "";
  }
  if (!themeList.some((item) => item.code === form.themeCode)) {
    form.themeCode = themeList[0]?.code ?? "";
  }
}

async function onPlatformChange() {
  await loadAccountsAndThemes();
  scheduleComposerPreview();
}

async function onContentChange() {
  form.versionId = "";
  versions.value = [];
  if (!form.contentId) return;
  const contentDetail = await getContentById(form.contentId);
  versions.value = contentDetail.versions ?? [];
  form.versionId = contentDetail.latestVersion?.id ?? versions.value[0]?.id ?? "";
}

async function applyRoutePreset() {
  const contentId = typeof route.query.contentId === "string" ? route.query.contentId : "";
  const versionId = typeof route.query.versionId === "string" ? route.query.versionId : "";
  if (!contentId) {
    return;
  }
  form.contentId = contentId;
  await onContentChange();
  if (versionId) {
    form.versionId = versionId;
  }
}

async function refresh() {
  const resp = await listDrafts({
    page: query.page,
    pageSize: query.pageSize,
    status: query.status || undefined,
  });
  drafts.value = resp.items;
  total.value = resp.total;
}

function stopPolling() {
  if (pollTimer) {
    clearTimeout(pollTimer);
    pollTimer = null;
  }
}

function stopPreviewTimer() {
  if (previewTimer) {
    clearTimeout(previewTimer);
    previewTimer = null;
  }
}

function scheduleComposerPreview() {
  stopPreviewTimer();
  previewTimer = setTimeout(() => {
    void updateComposerPreview();
  }, 180);
}

async function updateComposerPreview() {
  if (!form.contentId || !form.versionId || !form.themeCode) {
    previewHtml.value = "";
    previewError.value = "";
    previewLoading.value = false;
    return;
  }

  const version = versions.value.find((item) => item.id === form.versionId);
  if (!version?.markdownBody?.trim()) {
    previewHtml.value = "";
    previewError.value = "所选版本没有可渲染的正文内容";
    previewLoading.value = false;
    return;
  }

  const taskId = ++previewTaskId;
  previewLoading.value = true;
  previewError.value = "";

  try {
    const html = await renderPreview({
      themeCode: form.themeCode,
      platform: form.platform,
      markdownBody: version.markdownBody,
      title: version.title,
    });
    if (taskId !== previewTaskId) return;
    previewHtml.value = html;
  } catch (error: any) {
    if (taskId !== previewTaskId) return;
    previewHtml.value = "";
    previewError.value = error?.message || "预览渲染失败";
  } finally {
    if (taskId === previewTaskId) {
      previewLoading.value = false;
    }
  }
}

async function pollJob(publishJobId: string, round = 1) {
  const one = await getDraftDetail(publishJobId);
  const status = one.status;
  if (status === "DRAFTED") {
    message.success(`任务 ${publishJobId} 已完成`);
    await refresh();
    stopPolling();
    return;
  }
  if (status === "FAILED") {
    message.error(`任务 ${publishJobId} 失败`);
    await refresh();
    stopPolling();
    return;
  }
  if (round >= 30) {
    message.warning(`任务 ${publishJobId} 仍在处理中，请稍后刷新`);
    stopPolling();
    return;
  }
  pollTimer = setTimeout(() => {
    void pollJob(publishJobId, round + 1);
  }, 2000);
}

async function submit() {
  if (!form.contentId || !form.versionId || !form.channelAccountId || !form.themeCode) {
    message.warning("请填写完整草稿参数");
    return;
  }
  const result = await createDraft({
    contentId: form.contentId,
    versionId: form.versionId,
    channelAccountId: form.channelAccountId,
    themeCode: form.themeCode,
    platform: form.platform,
  });
  message.success(`已创建任务 ${result.publishJobId}`);
  await refresh();
  stopPolling();
  await pollJob(result.publishJobId);
}

async function openDetail(jobId: string) {
  detail.value = await getDraftDetail(jobId);
  showDetail.value = true;
}

async function retryOne(jobId: string) {
  const retried = await retryDraft(jobId);
  message.success(`已重试：${retried.publishJobId}`);
  await refresh();
  stopPolling();
  await pollJob(retried.publishJobId);
}

async function retryFromDetail() {
  if (!detail.value) return;
  await retryOne(detail.value.publishJobId);
  detail.value = await getDraftDetail(detail.value.publishJobId);
}

const columns = [
  { title: "标题", key: "contentTitle" },
  {
    title: "平台",
    key: "platform",
    width: 120,
    render: (row: DraftJobItem) => platformLabelMap[row.platform] ?? row.platform,
  },
  { title: "账号", key: "channelAccountName", width: 160 },
  {
    title: "状态",
    key: "status",
    width: 110,
    render: (row: DraftJobItem) =>
      h(
        NTag,
        { type: row.status === "DRAFTED" ? "success" : row.status === "FAILED" ? "error" : "warning" },
        { default: () => row.status },
      ),
  },
  { title: "创建时间", key: "createdAt", minWidth: 170 },
  {
    title: "操作",
    key: "actions",
    minWidth: 110,
    render: (row: DraftJobItem) =>
      h("div", { class: "draft-actions" }, [
        h(NTooltip, null, {
          trigger: () =>
            h(
              NButton,
              { size: "small", tertiary: true, circle: true, onClick: () => void openDetail(row.publishJobId) },
              { default: () => renderPathIcon(appIconPaths.detail) },
            ),
          default: () => "任务详情",
        }),
        ...(row.status === "FAILED"
          ? [
              h(NTooltip, null, {
                trigger: () =>
                  h(
                    NButton,
                    {
                      size: "small",
                      type: "warning",
                      secondary: true,
                      circle: true,
                      onClick: () => void retryOne(row.publishJobId),
                    },
                    { default: () => renderPathIcon(appIconPaths.retry) },
                  ),
                default: () => "失败重试",
              }),
            ]
          : []),
      ]),
  },
];

watch(
  () => [form.contentId, form.versionId, form.themeCode, form.platform],
  () => {
    scheduleComposerPreview();
  },
);

onMounted(async () => {
  const contentResp = await listContents({ page: 1, pageSize: 100 });
  contents.value = contentResp.items;
  form.contentId = contentResp.items[0]?.id ?? "";
  await onContentChange();
  await applyRoutePreset();
  await loadAccountsAndThemes();
  await refresh();
  await updateComposerPreview();
});

onUnmounted(() => {
  stopPolling();
  stopPreviewTimer();
});
</script>

<style scoped>
.drafts-page {
  min-height: 0;
  gap: 18px;
}

.drafts-page > .page-scroll {
  min-height: 0;
}

.drafts-page :deep(.n-grid) {
  flex-shrink: 0;
}

.drafts-hero {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 18px;
  padding: 24px 26px;
  border-radius: 24px;
  border: 1px solid rgba(88, 65, 32, 0.08);
  background:
    radial-gradient(circle at top left, rgba(255, 216, 157, 0.25), transparent 30%),
    linear-gradient(135deg, #1f2937 0%, #334155 48%, #7c5c2e 100%);
  color: #f8fafc;
}

.drafts-hero__eyebrow {
  margin: 0 0 10px;
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  opacity: 0.7;
}

.drafts-hero__title {
  margin: 0;
  font-size: 28px;
}

.drafts-hero__desc {
  max-width: 700px;
  margin: 10px 0 0;
  line-height: 1.7;
  color: rgba(248, 250, 252, 0.82);
}

.drafts-hero__chips {
  display: grid;
  grid-template-columns: repeat(2, minmax(140px, 1fr));
  gap: 12px;
  min-width: min(340px, 100%);
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
  font-size: 18px;
}

.panel-card {
  border-radius: 22px;
}

.form-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  background: linear-gradient(180deg, #fffdf7 0%, #f8f4ea 100%);
}

.form-summary__label,
.preview-shell__label,
.detail-preview__label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  color: #7c6b4c;
}

.preview-card {
  min-height: 100%;
}

.preview-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.preview-shell {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.preview-shell__toolbar {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid #e4dfd3;
  border-radius: 18px;
  background: #fffdf8;
}

.preview-frame {
  max-height: 640px;
  overflow: auto;
  padding: 16px;
  border: 1px solid #dbe4ef;
  border-radius: 20px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(247, 250, 252, 0.98)),
    #ffffff;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.draft-list-card {
  margin-top: 18px;
}

.list-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.draft-actions {
  display: flex;
  flex-wrap: nowrap;
  gap: 6px;
  justify-content: flex-end;
  white-space: nowrap;
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

.detail-preview {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

@media (max-width: 1100px) {
  .drafts-hero {
    flex-direction: column;
  }

  .drafts-hero__chips,
  .form-summary,
  .preview-shell__toolbar {
    grid-template-columns: 1fr;
  }
}
</style>
