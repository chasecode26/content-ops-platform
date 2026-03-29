<template>
  <n-config-provider :theme-overrides="themeOverrides">
    <n-message-provider>
      <n-layout class="app-layout" has-sider>
        <n-layout-sider
          bordered
          class="app-sider"
          collapse-mode="width"
          :collapsed-width="64"
          :width="220"
          :collapsed="collapsed"
          show-trigger="bar"
          @collapse="collapsed = true"
          @expand="collapsed = false"
        >
          <div class="brand">{{ collapsed ? "CO" : "Content Ops" }}</div>
          <n-menu
            :collapsed="collapsed"
            :options="menuOptions"
            :value="activeKey"
            @update:value="go"
            class="side-menu"
          />
        </n-layout-sider>
        <n-layout>
          <n-layout-header bordered class="header">
            <div class="header-title">{{ pageTitle }}</div>
            <n-space size="small" class="top-nav">
              <n-button
                v-for="item in topNav"
                :key="item.key"
                size="small"
                :type="activeKey === item.key ? 'primary' : 'default'"
                @click="go(item.key)"
              >
                {{ item.label }}
              </n-button>
            </n-space>
          </n-layout-header>
          <n-layout-content content-style="padding: 16px 20px;">
            <router-view />
          </n-layout-content>
        </n-layout>
      </n-layout>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { MenuOption } from "naive-ui";

const router = useRouter();
const route = useRoute();
const collapsed = ref(false);

const menuOptions: MenuOption[] = [
  { key: "/dashboard", label: "概览" },
  { key: "/content", label: "内容" },
  { key: "/themes", label: "主题预览" },
  { key: "/accounts", label: "账号" },
  { key: "/drafts", label: "草稿任务" },
];
const topNav = [
  { key: "/dashboard", label: "概览" },
  { key: "/content", label: "内容" },
  { key: "/themes", label: "主题" },
  { key: "/accounts", label: "账号" },
  { key: "/drafts", label: "草稿" },
];

const activeKey = computed(() => route.path);
const titles: Record<string, string> = {
  "/dashboard": "控制台概览",
  "/content": "内容管理",
  "/themes": "主题预览",
  "/accounts": "公众号账号",
  "/drafts": "草稿任务",
};
const pageTitle = computed(() => titles[route.path] ?? "Content Ops");

function go(key: string) {
  router.push(key);
}

const themeOverrides = {
  common: {
    primaryColor: "#0F766E",
    primaryColorHover: "#115E59",
    borderRadius: "10px",
    cardColor: "#FFFFFF",
    bodyColor: "#F4F7FB",
  },
};
</script>
