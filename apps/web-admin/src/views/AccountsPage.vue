<template>
  <div class="page-container accounts-page">
    <div class="page-scroll">
      <n-grid :x-gap="16" :y-gap="16" cols="1 l:2" responsive="screen">
        <n-gi>
          <n-card class="page-card" title="新增公众号账号">
            <n-form label-placement="top">
              <n-form-item label="账号名称">
                <n-input v-model:value="createForm.name" />
              </n-form-item>
              <n-form-item label="appId">
                <n-input v-model:value="createForm.appId" />
              </n-form-item>
              <n-form-item label="appSecret">
                <n-input v-model:value="createForm.appSecret" type="password" show-password-on="click" />
              </n-form-item>
              <n-form-item label="作者名">
                <n-input v-model:value="createForm.author" />
              </n-form-item>
              <n-form-item label="thumb_media_id">
                <n-input v-model:value="createForm.defaultThumbMediaId" placeholder="可选，不填则自动上传兜底图" />
              </n-form-item>
              <n-button type="primary" @click="submitCreate">保存账号</n-button>
            </n-form>
          </n-card>
        </n-gi>
        <n-gi>
          <n-card class="page-card" title="账号列表（密文存储 / 脱敏展示）">
            <n-space vertical>
              <n-space>
                <n-button secondary @click="refresh">刷新</n-button>
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
          <n-form-item label="thumb_media_id">
            <n-input v-model:value="editForm.defaultThumbMediaId" />
          </n-form-item>
          <n-divider>如需更新密钥，填写下方字段（留空则保持原值）</n-divider>
          <n-form-item label="新 appId">
            <n-input v-model:value="editForm.appId" />
          </n-form-item>
          <n-form-item label="新 appSecret">
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
import { NButton, NTag, useMessage } from "naive-ui";
import {
  createAccount,
  listAccounts,
  updateAccount,
  validateAccount,
  type AccountItem,
} from "../api/services";

const message = useMessage();
const accounts = ref<AccountItem[]>([]);

const createForm = reactive({
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
  accounts.value = await listAccounts();
}

async function submitCreate() {
  if (!createForm.name || !createForm.appId || !createForm.appSecret) {
    message.warning("请填写完整账号信息");
    return;
  }
  await createAccount({
    platform: "WECHAT_OFFICIAL",
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
      message.warning("更新密钥时 appId 与 appSecret 需同时填写");
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
    message.success("账号校验通过");
  } else {
    message.error("账号校验失败");
  }
}

const columns = [
  { title: "名称", key: "name" },
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
      h(NTag, { type: row.credential?.configured ? "success" : "warning" }, { default: () => (row.credential?.configured ? "已配置" : "未配置") }),
  },
  {
    title: "操作",
    key: "actions",
    render: (row: AccountItem) =>
      h("div", { style: "display:flex;gap:8px;" }, [
        h(
          NButton,
          { size: "small", tertiary: true, onClick: () => void runValidate(row.id) },
          { default: () => "校验" },
        ),
        h(
          NButton,
          { size: "small", tertiary: true, type: "primary", onClick: () => openEdit(row) },
          { default: () => "编辑" },
        ),
      ]),
  },
];

onMounted(refresh);
</script>
