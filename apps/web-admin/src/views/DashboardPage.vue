<template>
  <div>
    <div class="hero">
      <div class="hero-title">内容发布控制台</div>
      <div class="hero-subtitle">从内容导入到微信草稿，一条链路完成日常发布任务。</div>
      <n-space>
        <n-button strong secondary @click="go('/content')">导入内容</n-button>
        <n-button strong secondary @click="go('/accounts')">账号配置</n-button>
        <n-button strong secondary @click="go('/drafts')">推送草稿</n-button>
      </n-space>
    </div>

    <div class="grid-cards">
      <n-card class="page-card" size="small" title="API">
        <n-tag :type="health.api === 'ok' ? 'success' : 'error'">{{ health.api || "-" }}</n-tag>
      </n-card>
      <n-card class="page-card" size="small" title="内容数量">{{ contentCount }}</n-card>
      <n-card class="page-card" size="small" title="账号数量">{{ accountCount }}</n-card>
      <n-card class="page-card" size="small" title="草稿任务">{{ draftCount }}</n-card>
    </div>

    <n-card class="page-card" title="最近草稿任务">
      <n-data-table :columns="columns" :data="drafts" :pagination="false" />
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { h, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { NTag } from "naive-ui";
import { getHealth, listAccounts, listContents, listDrafts, type DraftJobItem } from "../api/services";

const router = useRouter();
const health = ref({ api: "-", database: "-", redis: "-" });
const contentCount = ref(0);
const accountCount = ref(0);
const draftCount = ref(0);
const drafts = ref<DraftJobItem[]>([]);

const columns = [
  { title: "标题", key: "contentTitle" },
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
];

function go(path: string) {
  router.push(path);
}

onMounted(async () => {
  const [hData, contents, accounts, draftJobs] = await Promise.all([
    getHealth(),
    listContents({ page: 1, pageSize: 20 }),
    listAccounts(),
    listDrafts({ page: 1, pageSize: 20 }),
  ]);
  health.value = hData;
  contentCount.value = contents.total;
  accountCount.value = accounts.length;
  draftCount.value = draftJobs.total;
  drafts.value = draftJobs.items.slice(0, 10);
});
</script>
