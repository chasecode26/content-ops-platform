<template>
  <div class="page-container accounts-page">
    <div class="page-scroll">
      <n-grid class="accounts-grid" :x-gap="16" :y-gap="16" cols="1 l:2" responsive="screen">
        <n-gi>
          <n-card class="page-card panel-card" title="新增渠道账号">
            <n-form label-placement="top">
              <n-form-item label="平台">
                <n-select v-model:value="createForm.platform" :options="platformOptions" />
              </n-form-item>
              <n-form-item label="账号名称">
                <n-input v-model:value="createForm.name" />
              </n-form-item>
              <n-form-item label="appId / Client Id">
                <n-input v-model:value="createForm.appId" />
              </n-form-item>
              <n-form-item label="appSecret / Client Secret">
                <n-input v-model:value="createForm.appSecret" type="password" show-password-on="click" />
              </n-form-item>
              <n-form-item label="作者名">
                <n-input v-model:value="createForm.author" />
              </n-form-item>
              <n-form-item label="封面素材 ID">
                <n-input v-model:value="createForm.defaultThumbMediaId" placeholder="可选" />
              </n-form-item>
              <n-button type="primary" @click="submitCreate">保存账号</n-button>
            </n-form>
          </n-card>
        </n-gi>

        <n-gi>
          <n-card class="page-card panel-card" title="账号列表">
            <n-space vertical>
              <n-space>
                <n-select
                  v-model:value="activePlatform"
                  :options="platformOptions"
                  style="width: 180px"
                  @update:value="refresh"
                />
                <n-tooltip trigger="hover">
                  <template #trigger>
                    <n-button circle secondary @click="refresh">
                      <span class="action-icon">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path :d="appIconPaths.refresh" />
                        </svg>
                      </span>
                    </n-button>
                  </template>
                  刷新账号列表
                </n-tooltip>
              </n-space>
              <n-data-table :columns="columns" :data="accounts" :pagination="false" />
            </n-space>
          </n-card>
        </n-gi>
      </n-grid>

      <n-modal v-model:show="showEdit" preset="card" title="编辑账号" style="width: 680px; max-width: 96vw;">
        <n-form label-placement="top">
          <n-form-item label="账号名称">
            <n-input v-model:value="editForm.name" />
          </n-form-item>
          <n-form-item label="作者名">
            <n-input v-model:value="editForm.author" />
          </n-form-item>
          <n-form-item label="封面素材 ID">
            <n-input v-model:value="editForm.defaultThumbMediaId" />
          </n-form-item>
          <n-divider>如需更新密钥，填写下方字段；留空则保持原值</n-divider>
          <n-form-item label="新 appId / Client Id">
            <n-input v-model:value="editForm.appId" />
          </n-form-item>
          <n-form-item label="新 appSecret / Client Secret">
            <n-input v-model:value="editForm.appSecret" type="password" show-password-on="click" />
          </n-form-item>
          <n-space justify="end">
            <n-button @click="showEdit = false">取消</n-button>
            <n-button type="primary" @click="submitEdit">保存修改</n-button>
          </n-space>
        </n-form>
      </n-modal>
    </div>
  </div>
</template>

<script setup lang="ts">
import { h, onMounted, reactive, ref } from "vue";
import { NButton, NPopconfirm, NTag, NTooltip, useMessage } from "naive-ui";
import {
  createAccount,
  deleteAccount,
  listAccounts,
  updateAccount,
  validateAccount,
  type AccountItem,
} from "../api/services";
import { appIconPaths, renderPathIcon } from "../utils/icons";

const message = useMessage();
const accounts = ref<AccountItem[]>([]);
const activePlatform = ref("WECHAT_OFFICIAL");

const platformOptions = [
  { label: "微信公众号", value: "WECHAT_OFFICIAL" },
  { label: "今日头条", value: "TOUTIAO" },
];

const platformLabelMap: Record<string, string> = {
  WECHAT_OFFICIAL: "微信公众号",
  TOUTIAO: "今日头条",
};

const createForm = reactive({
  platform: "WECHAT_OFFICIAL",
  name: "",
  appId: "",
  appSecret: "",
  author: "",
  defaultThumbMediaId: "",
});

const showEdit = ref(false);
const editingId = ref("");
const editForm = reactive({
  name: "",
  author: "",
  defaultThumbMediaId: "",
  appId: "",
  appSecret: "",
});

async function refresh() {
  accounts.value = await listAccounts(activePlatform.value);
}

async function submitCreate() {
  if (!createForm.name || !createForm.appId || !createForm.appSecret) {
    message.warning("请填写完整账号信息");
    return;
  }

  await createAccount({
    platform: createForm.platform,
    name: createForm.name,
    credentials: {
      appId: createForm.appId,
      appSecret: createForm.appSecret,
    },
    meta: {
      author: createForm.author || "未设置",
      ...(createForm.defaultThumbMediaId ? { defaultThumbMediaId: createForm.defaultThumbMediaId } : {}),
    },
  });

  message.success("账号已保存");
  createForm.platform = activePlatform.value;
  createForm.name = "";
  createForm.appId = "";
  createForm.appSecret = "";
  createForm.author = "";
  createForm.defaultThumbMediaId = "";
  await refresh();
}

function openEdit(row: AccountItem) {
  editingId.value = row.id;
  editForm.name = row.name;
  editForm.author = String(row.meta?.author ?? "");
  editForm.defaultThumbMediaId = String(row.meta?.defaultThumbMediaId ?? "");
  editForm.appId = "";
  editForm.appSecret = "";
  showEdit.value = true;
}

async function submitEdit() {
  if (!editingId.value) return;

  const payload: {
    name?: string;
    meta?: Record<string, unknown>;
    credentials?: { appId: string; appSecret: string };
  } = {
    name: editForm.name,
    meta: {
      author: editForm.author || "未设置",
      ...(editForm.defaultThumbMediaId ? { defaultThumbMediaId: editForm.defaultThumbMediaId } : {}),
    },
  };

  if (editForm.appId || editForm.appSecret) {
    if (!editForm.appId || !editForm.appSecret) {
      message.warning("更新密钥时 appId 和 appSecret 需同时填写");
      return;
    }
    payload.credentials = {
      appId: editForm.appId,
      appSecret: editForm.appSecret,
    };
  }

  await updateAccount(editingId.value, payload);
  message.success("账号已更新");
  showEdit.value = false;
  await refresh();
}

async function runValidate(accountId: string) {
  const result = await validateAccount(accountId);
  if (result.valid) {
    message.success(`${platformLabelMap[result.platform] ?? result.platform} 账号校验通过`);
  } else {
    message.error("账号校验失败");
  }
}

async function removeOne(accountId: string) {
  const result = await deleteAccount(accountId);
  message.success(`已删除账号：${result.name}`);
  await refresh();
}

const columns = [
  { title: "名称", key: "name" },
  {
    title: "平台",
    key: "platform",
    width: 120,
    render: (row: AccountItem) => platformLabelMap[row.platform] ?? row.platform,
  },
  {
    title: "作者",
    key: "author",
    render: (row: AccountItem) => String(row.meta?.author ?? "-"),
  },
  {
    title: "appId",
    key: "appIdMasked",
    render: (row: AccountItem) => row.credential?.appIdMasked ?? "-",
  },
  {
    title: "appSecret",
    key: "appSecretMasked",
    render: (row: AccountItem) => row.credential?.appSecretMasked ?? "-",
  },
  {
    title: "凭证",
    key: "configured",
    render: (row: AccountItem) =>
      h(NTag, { type: row.credential?.configured ? "success" : "warning" }, {
        default: () => (row.credential?.configured ? "已配置" : "未配置"),
      }),
  },
  {
    title: "操作",
    key: "actions",
    width: 140,
    render: (row: AccountItem) =>
      h("div", { class: "account-actions" }, [
        h(NTooltip, null, {
          trigger: () =>
            h(
              NButton,
              { size: "small", tertiary: true, circle: true, onClick: () => void runValidate(row.id) },
              { default: () => renderPathIcon(appIconPaths.validate) },
            ),
          default: () => "校验账号",
        }),
        h(NTooltip, null, {
          trigger: () =>
            h(
              NButton,
              { size: "small", tertiary: true, circle: true, type: "primary", onClick: () => openEdit(row) },
              { default: () => renderPathIcon(appIconPaths.edit) },
            ),
          default: () => "编辑账号",
        }),
        h(NPopconfirm, { onPositiveClick: () => void removeOne(row.id) }, {
          trigger: () =>
            h(
              NButton,
              { size: "small", tertiary: true, circle: true, type: "error" },
              { default: () => renderPathIcon(appIconPaths.delete) },
            ),
          default: () => `确认删除账号「${row.name}」？`,
        }),
      ]),
  },
];

onMounted(async () => {
  createForm.platform = activePlatform.value;
  await refresh();
});
</script>

<style scoped>
.accounts-page {
  min-height: 0;
}

.accounts-grid {
  flex: 1;
  min-height: 0;
}

.accounts-grid :deep(.n-grid-item) {
  min-height: 0;
}

.panel-card {
  height: 100%;
}

.account-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
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
</style>
