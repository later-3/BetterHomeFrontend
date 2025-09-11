import 'uno.css';
import { createSSRApp } from 'vue';
import { createPinia } from 'pinia'; // 导入 createPinia
import piniaPluginPersistUni from 'pinia-plugin-persist-uni'; // 导入持久化插件
import App from './App.vue';
import { initGlobalErrorHandler } from '@/utils/globalErrorHandler';

export function createApp() {
  const app = createSSRApp(App);

  // 1. 创建 Pinia 实例
  const pinia = createPinia();
  
  // 2. 为 Pinia 实例注册持久化插件
  pinia.use(piniaPluginPersistUni);

  // 3. 将配置好的 Pinia 实例应用到整个 Vue app
  app.use(pinia);

  // 初始化全局错误处理
  initGlobalErrorHandler();

  return {
    app
  };
}
