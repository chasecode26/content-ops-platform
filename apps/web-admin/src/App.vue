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
  { key: "/settings", label: "AI 配置" },
];

const activeKey = computed(() => route.path);
const titles: Record<string, string> = {
  "/dashboard": "控制台概览",
  "/content": "内容管理",
  "/themes": "主题预览",
  "/accounts": "账号管理",
  "/drafts": "草稿任务",
  "/settings": "AI 配置",
};
const pageTitle = computed(() => titles[route.path] ?? "Content Ops");

function go(key: string) {
  router.push(key);
}

const themeOverrides = {
  common: {
    primaryColor: "#1f6feb",
    primaryColorHover: "#195fd0",
    primaryColorPressed: "#174ea6",
    infoColor: "#1f6feb",
    successColor: "#1f9d73",
    warningColor: "#d97706",
    errorColor: "#d9485f",
    borderRadius: "16px",
    cardColor: "#FFFFFF",
    bodyColor: "#F2F6FB",
  },
};
</script>

<style scoped>
.app-layout :deep(.n-layout-scroll-container) {
  min-height: 100%;
}

.main-layout :deep(.n-layout-scroll-container) {
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

.main-content {
  min-height: 0;
}

.footer {
  margin-top: auto;
}
</style>
