import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import { router } from "./router";
import "./styles.css";

import * as naive from "naive-ui";

const app = createApp(App);
app.use(createPinia());
app.use(router);

const naiveExports = Object.keys(naive) as (keyof typeof naive)[];
for (const name of naiveExports) {
  if (name.startsWith("N")) {
    app.component(name, naive[name]);
  }
}

app.mount("#app");
