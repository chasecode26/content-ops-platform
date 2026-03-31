<template>
  <div class="page-container dashboard-page">
    <div class="hero">
      <div class="hero-title">内容发布控制台</div>
      <div class="hero-subtitle">从内容导入到微信草稿，一条链路完成日常发布任务。</div>
      <n-space>
        <n-button strong @click="go('/content')" color="#ffffff" text-color="#409eff">导入内容</n-button>
        <n-button strong @click="go('/accounts')" color="#ffffff" text-color="#409eff">账号配置</n-button>
        <n-button strong @click="go('/drafts')" color="#ffffff" text-color="#409eff">推送草稿</n-button>
      </n-space>
    </div>

    <div class="dashboard-grid">
      <div class="ai-chat-section">
        <AiChatPanel />
      </div>
      <div class="dashboard-sidebar">
        <div class="grid-cards sidebar-cards">
          <n-card class="page-card" size="small" title="API">
            <n-tag :type="health.api === 'ok' ? 'success' : 'error'">{{ health.api || "-" }}</n-tag>
          </n-card>
          <n-card class="page-card" size="small" title="内容数量" @click="go('/content')" style="cursor: pointer;">
            {{ contentCount }}
          </n-card>
          <n-card class="page-card" size="small" title="账号数量" @click="go('/accounts')" style="cursor: pointer;">
            {{ accountCount }}
          </n-card>
          <n-card class="page-card" size="small" title="草稿任务" @click="go('/drafts')" style="cursor: pointer;">
            {{ draftCount }}
          </n-card>
        </div>

        <n-card class="page-card" title="最近草稿任务">
          <n-data-table :columns="columns" :data="drafts" :pagination="false" size="small" />
        </n-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { h, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { NTag } from "naive-ui";
import { getHealth, listAccounts, listContents, listDrafts, type DraftJobItem } from "../api/services";
import AiChatPanel from "./AiChatPanel.vue";

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
        { size: "small", type: row.status === "DRAFTED" ? "success" : row.status === "FAILED" ? "error" : "warning" },
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

<style scoped>
.dashboard-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px 24px;
  overflow: hidden;
}

.hero {
  margin-bottom: 20px;
  padding: 24px;
  border-radius: 12px;
  background: linear-gradient(135deg, #409eff 0%, #3a8ee6 100%);
  color: #ffffff;
  flex-shrink: 0;
}

.hero-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
}

.hero-subtitle {
  font-size: 15px;
  opacity: 0.9;
  margin-bottom: 16px;
  line-height: 1.6;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 420px;
  gap: 20px;
  flex: 1;
  min-height: 0;
}

.ai-chat-section {
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.ai-chat-section :deep(.ai-chat-container) {
  height: 100%;
}

.dashboard-sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  min-height: 0;
}

.sidebar-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 0;
  flex-shrink: 0;
}

.page-card {
  background: #fff;
  border: 1px solid #e6ebf1;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(17, 24, 39, 0.04);
}

@media (max-width: 1400px) {
  .dashboard-grid {
    grid-template-columns: 1fr 360px;
  }
}

@media (max-width: 1199px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  .dashboard-sidebar {
    max-height: 400px;
  }
}
</style>
