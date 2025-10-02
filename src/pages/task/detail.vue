<script setup lang="ts">
import { ref, onMounted } from "vue";
import { onLoad } from "@dcloudio/uni-app";

const workOrderId = ref<string>("");
const loading = ref(true);

onLoad((options) => {
  if (options?.id) {
    workOrderId.value = options.id as string;
  }
});

onMounted(() => {
  // 简单模拟加载完成
  loading.value = false;
});

const handleBack = () => {
  uni.navigateBack();
};
</script>

<template>
  <view class="detail-page">
    <view v-if="loading" class="loading-container">
      <text>加载中...</text>
    </view>

    <view v-else class="content">
      <view class="header">
        <text class="title">工单详情</text>
        <u-button size="small" type="primary" text="返回" @click="handleBack" />
      </view>

      <view class="info-section">
        <text class="info-text">工单ID: {{ workOrderId }}</text>
        <text class="placeholder">详情内容待实现...</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.detail-page {
  min-height: 100vh;
  background-color: #f4f5f7;
  padding: 16px;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.title {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.info-text {
  font-size: 14px;
  color: #374151;
}

.placeholder {
  font-size: 14px;
  color: #9ca3af;
  font-style: italic;
}
</style>
