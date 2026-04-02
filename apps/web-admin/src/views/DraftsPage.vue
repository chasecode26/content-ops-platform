<template>
  <div class="page-container drafts-page">
    <div class="page-scroll">
      <n-space vertical size="large">
        <div class="page-split-grid draft-workbench">
          <n-card class="page-card" title="新建草稿任务">
            <n-form label-placement="top">
              <n-form-item label="内容">
                <n-select v-model:value="form.contentId" :options="contentOptions" @update:value="onContentChange" />
              </n-form-item>
              <n-form-item label="版本">
                <n-select
                  v-model:value="form.versionId"
                  :options="versionOptions"
                  placeholder="选择版本"
                  @update:value="refreshPreview"
                />
              </n-form-item>
              <n-form-item label="账号">
                <n-select v-model:value="form.channelAccountId" :options="accountOptions" />
              </n-form-item>
              <n-form-item label="主题">
                <n-select v-model:value="form.themeCode" :options="themeOptions" @update:value="refreshPreview" />
              </n-form-item>
              <n-space>
                <n-button secondary @click="openThemePreview">单独打开主题预览</n-button>
                <n-button type="primary" @click="submit">推送草稿</n-button>
              </n-space>
            </n-form>
          </n-card>

          <n-card class="page-card" title="草稿预览">
            <n-space vertical>
              <div v-if="previewMeta" class="preview-meta">{{ previewMeta }}</div>
              <div class="preview-box" v-if="previewHtml" v-html="previewHtml"></div>
              <n-empty v-else description="选择内容、版本和主题后，这里会直接显示公众号成稿预览" />
            </n-space>
          </n-card>
        </div>

        <n-card class="page-card" title="草稿任务列表">
          <n-space vertical>
            <n-space>
              <n-select
                v-model:value="query.status"
                :options="statusOptions"
                clearable
                placeholder="按状态筛选"
                style="width: 200px"
              />
              <n-button secondary @click="refresh">查询</n-button>
            </n-space>
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
      </n-space>

      <n-drawer v-model:show="showDetail" :width="460" placement="right">
        <n-drawer-content title="任务详情">
          <n-descriptions :column="1" bordered label-placement="left">
            <n-descriptions-item label="任务 ID">{{ detail?.publishJobId ?? "-" }}</n-descriptions-item>
            <n-descriptions-item label="状态">{{ detail?.status ?? "-" }}</n-descriptions-item>
            <n-descriptions-item label="内容">{{ detail?.content.title ?? "-" }}</n-descriptions-item>
            <n-descriptions-item label="平台草稿 ID">{{ detail?.draftRecord.platformDraftId ?? "-" }}</n-descriptions-item>
            <n-descriptions-item label="错误信息">{{ detail?.draftRecord.errorMessage ?? "-" }}</n-descriptions-item>
            <n-descriptions-item label="创建时间">{{ detail?.createdAt ?? "-" }}</n-descriptions-item>
          </n-descriptions>
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
import { computed, h, onMounted, onUnmounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { NButton, NTag, useMessage } from "naive-ui";
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

const message = useMessage();
const route = useRoute();
const router = useRouter();

const contents = ref<ContentItem[]>([]);
const accounts = ref<AccountItem[]>([]);
const themes = ref<ThemeItem[]>([]);
const drafts = ref<DraftJobItem[]>([]);
const versions = ref<ContentVersionItem[]>([]);
const total = ref(0);
const currentContentTitle = ref("");
const previewHtml = ref("");

const showDetail = ref(false);
const detail = ref<DraftDetail | null>(null);
let pollTimer: ReturnType<typeof setTimeout> | null = null;

const form = reactive({
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
  versions.value.map((version) => ({ label: `v${version.versionNo} · ${version.title}`, value: version.id })),
);
const accountOptions = computed(() => accounts.value.map((item) => ({ label: item.name, value: item.id })));
const themeOptions = computed(() => themes.value.map((item) => ({ label: item.name, value: item.code })));
const currentVersion = computed(() => versions.value.find((item) => item.id === form.versionId) ?? null);
const previewMeta = computed(() => {
  if (!currentVersion.value || !form.themeCode) {
    return "";
  }
  const themeName = themes.value.find((item) => item.code === form.themeCode)?.name ?? form.themeCode;
  return `${currentContentTitle.value} · v${currentVersion.value.versionNo} · ${themeName}`;
});

async function loadContentVersions(contentId: string) {
  versions.value = [];
  currentContentTitle.value = "";
  if (!contentId) {
    return;
  }
  const contentDetail = await getContentById(contentId);
  versions.value = contentDetail.versions ?? [];
  currentContentTitle.value = contentDetail.title;
  if (!form.versionId || !versions.value.some((item) => item.id === form.versionId)) {
    form.versionId = contentDetail.latestVersion?.id ?? versions.value[0]?.id ?? "";
  }
}

async function onContentChange() {
  form.versionId = "";
  await loadContentVersions(form.contentId);
  await refreshPreview();
}

async function applyRoutePreset() {
  const contentId = typeof route.query.contentId === "string" ? route.query.contentId : "";
  const versionId = typeof route.query.versionId === "string" ? route.query.versionId : "";
  const themeCode = typeof route.query.themeCode === "string" ? route.query.themeCode : "";

  if (!contentId) {
    return;
  }

  form.contentId = contentId;
  await loadContentVersions(contentId);
  if (versionId && versions.value.some((item) => item.id === versionId)) {
    form.versionId = versionId;
  }
  if (themeCode && themes.value.some((item) => item.code === themeCode)) {
    form.themeCode = themeCode;
  }
}

async function refreshPreview() {
  const version = versions.value.find((item) => item.id === form.versionId);
  if (!version || !form.themeCode) {
    previewHtml.value = "";
    return;
  }
  previewHtml.value = await renderPreview({
    themeCode: form.themeCode,
    platform: "WECHAT_OFFICIAL",
    title: version.title,
    markdownBody: version.markdownBody ?? "",
  });
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
    platform: "WECHAT_OFFICIAL",
  });
  message.success(`已创建任务 ${result.publishJobId}`);
  await refresh();
  stopPolling();
  await pollJob(result.publishJobId);
}

async function openThemePreview() {
  if (!form.contentId || !form.versionId) {
    message.warning("请先选择内容和版本");
    return;
  }
  await router.push({
    path: "/themes",
    query: {
      contentId: form.contentId,
      versionId: form.versionId,
      themeCode: form.themeCode,
    },
  });
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
  if (!detail.value) {
    return;
  }
  await retryOne(detail.value.publishJobId);
  detail.value = await getDraftDetail(detail.value.publishJobId);
}

const columns = [
  { title: "标题", key: "contentTitle" },
  { title: "账号", key: "channelAccountName" },
  {
    title: "状态",
    key: "status",
    render: (row: DraftJobItem) =>
      h(
        NTag,
        { type: row.status === "DRAFTED" ? "success" : row.status === "FAILED" ? "error" : "warning" },
        { default: () => row.status },
      ),
  },
  { title: "创建时间", key: "createdAt" },
  {
    title: "操作",
    key: "actions",
    render: (row: DraftJobItem) =>
      h("div", { style: "display:flex;gap:8px;" }, [
        h(
          NButton,
          {
            size: "small",
            tertiary: true,
            onClick: () => {
              void openDetail(row.publishJobId);
            },
          },
          { default: () => "详情" },
        ),
        ...(row.status === "FAILED"
          ? [
              h(
                NButton,
                {
                  size: "small",
                  type: "warning",
                  tertiary: true,
                  onClick: () => {
                    void retryOne(row.publishJobId);
                  },
                },
                { default: () => "重试" },
              ),
            ]
          : []),
      ]),
  },
];

onMounted(async () => {
  const [contentResp, accountResp, themeResp] = await Promise.all([
    listContents({ page: 1, pageSize: 100 }),
    listAccounts(),
    listThemes(),
  ]);

  contents.value = contentResp.items;
  accounts.value = accountResp;
  themes.value = themeResp;

  form.contentId = contentResp.items[0]?.id ?? "";
  form.channelAccountId = accountResp[0]?.id ?? "";
  form.themeCode = themeResp[0]?.code ?? "";

  await applyRoutePreset();

  if (!form.contentId && contentResp.items[0]?.id) {
    form.contentId = contentResp.items[0].id;
  }

  if (form.contentId && versions.value.length === 0) {
    await loadContentVersions(form.contentId);
  }

  if (!form.versionId) {
    form.versionId = versions.value[0]?.id ?? "";
  }

  await refreshPreview();
  await refresh();
});

onUnmounted(() => {
  stopPolling();
});
</script>

<style scoped>
.draft-workbench {
  align-items: start;
}

.preview-meta {
  padding: 10px 12px;
  border-radius: 12px;
  background: #f6f9ff;
  border: 1px solid #dbe7ff;
  color: #3257a1;
  font-size: 13px;
}

.preview-box {
  min-height: 320px;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 16px;
  background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
}
</style>
