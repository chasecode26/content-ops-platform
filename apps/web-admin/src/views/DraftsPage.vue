<template>
  <n-grid :x-gap="12" :y-gap="12" cols="1 l:2" responsive="screen">
    <n-gi>
      <n-card class="page-card" title="新建草稿任务">
        <n-form label-placement="top">
          <n-form-item label="内容">
            <n-select v-model:value="form.contentId" :options="contentOptions" @update:value="onContentChange" />
          </n-form-item>
          <n-form-item label="版本">
            <n-select v-model:value="form.versionId" :options="versionOptions" placeholder="选择版本" />
          </n-form-item>
          <n-form-item label="账号">
            <n-select v-model:value="form.channelAccountId" :options="accountOptions" />
          </n-form-item>
          <n-form-item label="主题">
            <n-select v-model:value="form.themeCode" :options="themeOptions" />
          </n-form-item>
          <n-button type="primary" @click="submit">推送草稿</n-button>
        </n-form>
      </n-card>
    </n-gi>
    <n-gi>
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
    </n-gi>
  </n-grid>

  <n-drawer v-model:show="showDetail" :width="460" placement="right">
    <n-drawer-content title="任务详情">
      <n-descriptions :column="1" bordered label-placement="left">
        <n-descriptions-item label="任务ID">{{ detail?.publishJobId ?? "-" }}</n-descriptions-item>
        <n-descriptions-item label="状态">{{ detail?.status ?? "-" }}</n-descriptions-item>
        <n-descriptions-item label="内容">{{ detail?.content.title ?? "-" }}</n-descriptions-item>
        <n-descriptions-item label="平台草稿ID">{{ detail?.draftRecord.platformDraftId ?? "-" }}</n-descriptions-item>
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
</template>

<script setup lang="ts">
import { computed, h, onMounted, onUnmounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import { NButton, NTag, useMessage } from "naive-ui";
import {
  createDraft,
  getContentById,
  getDraftDetail,
  listAccounts,
  listContents,
  listDrafts,
  listThemes,
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
const contents = ref<ContentItem[]>([]);
const accounts = ref<AccountItem[]>([]);
const themes = ref<ThemeItem[]>([]);
const drafts = ref<DraftJobItem[]>([]);
const versions = ref<ContentVersionItem[]>([]);
const total = ref(0);

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

const contentOptions = computed(() => contents.value.map((i) => ({ label: i.title, value: i.id })));
const versionOptions = computed(() =>
  versions.value.map((v) => ({ label: `v${v.versionNo} · ${v.title}`, value: v.id })),
);
const accountOptions = computed(() => accounts.value.map((i) => ({ label: i.name, value: i.id })));
const themeOptions = computed(() => themes.value.map((i) => ({ label: i.name, value: i.code })));

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
            onClick: () => void openDetail(row.publishJobId),
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
                  onClick: () => void retryOne(row.publishJobId),
                },
                { default: () => "重试" },
              ),
            ]
          : []),
      ]),
  },
];

onMounted(async () => {
  const [c, a, t] = await Promise.all([listContents({ page: 1, pageSize: 100 }), listAccounts(), listThemes()]);
  contents.value = c.items;
  accounts.value = a;
  themes.value = t;
  form.contentId = c.items[0]?.id ?? "";
  await onContentChange();
  await applyRoutePreset();
  form.channelAccountId = a[0]?.id ?? "";
  form.themeCode = t[0]?.code ?? "";
  await refresh();
});

onUnmounted(() => {
  stopPolling();
});
</script>
