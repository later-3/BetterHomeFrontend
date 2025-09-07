<script setup lang="ts">
/**
 * 公告页面
 * 用于展示社区公告和通知相关功能
 *
 * @author Claude Code
 * @created 2025-01-07
 */

import { onMounted } from 'vue';
import { useNavigation } from '@/hooks/useNavigation';
import { useErrorHandler } from '@/hooks/useErrorHandler';

// 页面导航和错误处理
const { initPageNavigation } = useNavigation();
const { handlePageError } = useErrorHandler({ pageName: '公告' });

// 页面生命周期
onMounted(() => {
  try {
    initPageNavigation('notice');
    // 页面加载完成
  } catch (error) {
    handlePageError(error as Error, {
      fallbackMessage: '公告页面初始化失败'
    });
  }
});
</script>

<template>
  <view class="page-container">
    <view class="header">
      <text class="title">公告</text>
      <text class="subtitle">社区公告通知</text>
    </view>

    <view class="content">
      <view class="placeholder-card">
        <text class="placeholder-text">功能开发中...</text>
        <text class="description">这里将展示社区公告和通知</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.page-container {
  padding: 20px;
  padding-bottom: 70px; /* 为底部TabBar留出空间 */
  min-height: 100vh;
  background-color: #f5f5f5;
}
.header {
  margin-bottom: 30px;
  text-align: center;
}
.title {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  font-size: 28px;
  color: #333;
}
.subtitle {
  display: block;
  font-size: 16px;
  color: #666;
}
.content {
  flex: 1;
}
.placeholder-card {
  padding: 40px 20px;
  border-radius: 12px;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}
.placeholder-text {
  display: block;
  margin-bottom: 12px;
  font-size: 18px;
  color: #999;
}
.description {
  display: block;
  font-size: 14px;
  color: #ccc;
}
</style>
