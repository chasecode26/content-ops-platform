<template>
  <n-config-provider :theme-overrides="themeOverrides">
    <n-message-provider>
      <n-dialog-provider>
        <div class="app-layout">
          <n-layout has-sider class="inner-layout">
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
            <n-layout class="main-layout">
              <n-layout-header bordered class="header">
                <div class="header-title">{{ pageTitle }}</div>
              </n-layout-header>
              <n-layout-content class="main-content">
                <router-view />
              </n-layout-content>
              <n-layout-footer bordered class="footer">
                <span>© 2026 Content Ops Platform. All rights reserved.</span>
              </n-layout-footer>
            </n-layout>
          </n-layout>
        </div>
      </n-dialog-provider>
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
  { key: "/dashboard", label: "控制台" },
  { key: "/content", label: "内容管理" },
  { key: "/themes", label: "主题预览" },
  { key: "/accounts", label: "账号管理" },
  { key: "/drafts", label: "草稿任务" },
];

const activeKey = computed(() => route.path);
const titles: Record<string, string> = {
  "/dashboard": "控制台概览",
  "/content": "内容管理",
  "/themes": "主题预览",
  "/accounts": "账号管理",
  "/drafts": "草稿任务",
};
const pageTitle = computed(() => titles[route.path] ?? "Content Ops");

function go(key: string) {
  router.push(key);
}

const themeOverrides = {
  common: {
    primaryColor: "#409eff",
    primaryColorHover: "#3a8ee6",
    borderRadius: "8px",
    cardColor: "#FFFFFF",
    bodyColor: "#F4F7FB",
  },
};
</script>
