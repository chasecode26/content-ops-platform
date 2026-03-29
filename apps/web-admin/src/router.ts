import { createRouter, createWebHistory } from "vue-router";

import DashboardPage from "./views/DashboardPage.vue";
import ContentPage from "./views/ContentPage.vue";
import ThemesPage from "./views/ThemesPage.vue";
import AccountsPage from "./views/AccountsPage.vue";
import DraftsPage from "./views/DraftsPage.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", redirect: "/dashboard" },
    { path: "/dashboard", component: DashboardPage },
    { path: "/content", component: ContentPage },
    { path: "/themes", component: ThemesPage },
    { path: "/accounts", component: AccountsPage },
    { path: "/drafts", component: DraftsPage },
  ],
});
