<template>
  <div class="page-container content-page">
    <div class="page-scroll">
      <n-grid :x-gap="16" :y-gap="16" cols="1 xl:5" responsive="screen">
        <n-gi span="1 xl:3">
          <n-card class="page-card" title="内容库">
            <n-space vertical>
              <n-space>
                <n-input v-model:value="query.keyword" placeholder="按标题搜索" clearable style="width: 260px" />
                <n-button type="primary" @click="refresh">查询</n-button>
                <n-button secondary @click="openImport = true">导入 Markdown</n-button>
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
        </n-gi>

        <n-gi span="1 xl:2">
          <n-card class="page-card" :title="detail ? `版本工作台 · ${detail.title}` : '版本工作台'">
            <n-empty v-if="!detail" description="请选择左侧内容，查看版本并管理" />
            <n-space v-else vertical>
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
                :rows="10"
                placeholder="Markdown 内容"
              />
              <n-input v-model:value="versionForm.changeSummary" placeholder="变更说明（可选）" />
              <n-button type="primary" @click="submitVersion">基于当前内容创建新版本</n-button>
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { NButton, NTag, useMessage } from "naive-ui";
import {
  createContentVersion,
  getContentById,
  importMarkdown,
  listContents,
  type ContentDetail,
  type ContentItem,
} from "../api/services";

const message = useMessage();
const router = useRouter();
const contentRows = ref<ContentItem[]>([]);
const total = ref(0);
const detail = ref<ContentDetail | null>(null);
const selectedVersionId = ref("");
const openImport = ref(false);

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
];

const versionOptions = computed(() =>
  (detail.value?.versions ?? []).map((v) => ({
    label: `v${v.versionNo} · ${v.title}`,
    value: v.id,
  })),
);

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
  const version =
    detail.value?.versions.find((v) => v.id === versionId) ??
    (detail.value?.latestVersion ? { ...detail.value.latestVersion } : null);
  if (!version || !detail.value) return;
  if (detail.value.latestVersion && detail.value.latestVersion.id === versionId) {
    versionForm.title = detail.value.latestVersion.title;
    versionForm.summary = detail.value.latestVersion.summary ?? "";
    versionForm.markdownBody = detail.value.latestVersion.markdownBody;
  } else {
    versionForm.title = version.title;
  }
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

onMounted(async () => {
  await refresh();
  if (contentRows.value.length > 0) {
    await loadDetail(contentRows.value[0].id);
  }
});
</script>
