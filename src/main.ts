// ============================================
// 微信小程序 Polyfills - 必须在所有 import 之前注入到全局
// ============================================
import { MiniURL, MiniURLSearchParams } from "@/utils/url-polyfill-miniprogram";

// 注入到全局对象（所有库都能访问）
if (typeof globalThis !== "undefined") {
  if (!globalThis.URL) (globalThis as any).URL = MiniURL;
  if (!globalThis.URLSearchParams) (globalThis as any).URLSearchParams = MiniURLSearchParams;
}
if (typeof global !== "undefined") {
  // @ts-ignore
  if (!global.URL) global.URL = MiniURL;
  // @ts-ignore
  if (!global.URLSearchParams) global.URLSearchParams = MiniURLSearchParams;
}
if (typeof window !== "undefined") {
  // @ts-ignore
  if (!window.URL) window.URL = MiniURL;
  // @ts-ignore
  if (!window.URLSearchParams) window.URLSearchParams = MiniURLSearchParams;
}
// ============================================

import "uno.css";
import { createSSRApp } from "vue";
import { createPinia } from "pinia"; // 导入 createPinia
import piniaPluginPersistUni from "pinia-plugin-persist-uni"; // 导入持久化插件
import uviewPlus from "uview-plus";
import App from "./App.vue";
import { initGlobalErrorHandler } from "@/utils/globalErrorHandler";

export function createApp() {
  const app = createSSRApp(App);

  // 1. 创建 Pinia 实例
  const pinia = createPinia();

  // 2. 为 Pinia 实例注册持久化插件
  pinia.use(piniaPluginPersistUni);

  // 3. 将配置好的 Pinia 实例应用到整个 Vue app
  app.use(pinia);

  // 4. 使用 uview-plus
  app.use(uviewPlus);

  // 初始化全局错误处理
  initGlobalErrorHandler();

  return {
    app,
  };
}
