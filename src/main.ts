import 'uno.css';
import { createSSRApp } from 'vue';
import App from './App.vue';
import store from '@/store';
import { initGlobalErrorHandler } from '@/utils/globalErrorHandler';

export function createApp() {
  const app = createSSRApp(App).use(store);

  // 初始化全局错误处理
  initGlobalErrorHandler();

  return {
    app
  };
}
