<template>
  <view class="parking-revenue-page">
    <!-- 页面标题 -->
    <view class="page-header">
      <text class="page-title">停车费收益</text>
      <text class="page-subtitle">小区停车相关收入汇总</text>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading" class="loading-container">
      <up-loading-icon mode="circle" size="40" />
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 错误状态 -->
    <view v-else-if="error" class="error-container">
      <text class="error-text">{{ error }}</text>
      <up-button text="重试" type="primary" size="small" @click="loadData" />
    </view>

    <!-- 收益汇总 -->
    <view v-else class="revenue-section">
      <!-- 总收益 -->
      <view class="revenue-card total">
        <text class="card-label">停车费总收益</text>
        <text class="card-value">¥{{ totalRevenue.toFixed(2) }}</text>
        <text class="card-hint">所有停车相关收入</text>
      </view>

      <!-- 分类收益（可点击） -->
      <view class="revenue-grid">
        <!-- 管理费 -->
        <view class="revenue-card clickable" @click="goToManagementDetail">
          <text class="card-label">管理费</text>
          <text class="card-value">¥{{ managementRevenue.toFixed(2) }}</text>
          <text class="card-hint">点击查看详情 ></text>
        </view>

        <!-- 租金 -->
        <view class="revenue-card">
          <text class="card-label">租金</text>
          <text class="card-value">¥{{ rentRevenue.toFixed(2) }}</text>
          <text class="card-hint">公共车位租金</text>
        </view>

        <!-- 临停费 -->
        <view class="revenue-card">
          <text class="card-label">临停费</text>
          <text class="card-value">¥{{ tempRevenue.toFixed(2) }}</text>
          <text class="card-hint">临时停车收入</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { directusClient } from "@/utils/directus";
import { aggregate } from "@directus/sdk";

const loading = ref(false);
const error = ref<string | null>(null);

const totalRevenue = ref(0);
const managementRevenue = ref(0);
const rentRevenue = ref(0);
const tempRevenue = ref(0);

// 加载收益数据
async function loadData() {
  loading.value = true;
  error.value = null;

  try {
    // 获取管理费收益（从 payments 表统计）
    const managementResult = await directusClient.request(
      aggregate("payments", {
        aggregate: { sum: ["amount"] },
        query: {
          filter: {
            type_code: { _eq: "parking_management" },
          },
        },
      })
    );

    managementRevenue.value = Number(managementResult?.[0]?.sum?.amount || 0);

    // 获取租金收益
    const rentResult = await directusClient.request(
      aggregate("payments", {
        aggregate: { sum: ["amount"] },
        query: {
          filter: {
            type_code: { _eq: "parking_rent" },
          },
        },
      })
    );

    rentRevenue.value = Number(rentResult?.[0]?.sum?.amount || 0);

    // 获取临停费收益
    const tempResult = await directusClient.request(
      aggregate("payments", {
        aggregate: { sum: ["amount"] },
        query: {
          filter: {
            type_code: { _eq: "parking_temp" },
          },
        },
      })
    );

    tempRevenue.value = Number(tempResult?.[0]?.sum?.amount || 0);

    // 计算总收益
    totalRevenue.value = managementRevenue.value + rentRevenue.value + tempRevenue.value;

  } catch (e: any) {
    console.error("[parking-revenue] 加载失败:", e);
    error.value = e.message || "加载失败";
  } finally {
    loading.value = false;
  }
}

// 跳转到管理费详情
function goToManagementDetail() {
  uni.navigateTo({
    url: "/pages/parking/parking-management-detail",
  });
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.parking-revenue-page {
  padding: 20rpx;
  background: #f5f5f5;
  min-height: 100vh;
}

.page-header {
  padding: 30rpx 20rpx;
  background: white;
  border-radius: 8rpx;
  margin-bottom: 20rpx;
}

.page-title {
  font-size: 36rpx;
  font-weight: bold;
  display: block;
  margin-bottom: 10rpx;
}

.page-subtitle {
  font-size: 24rpx;
  color: #999;
}

.loading-container,
.error-container {
  padding: 60rpx 20rpx;
  text-align: center;
  background: white;
  border-radius: 8rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
}

.loading-text {
  font-size: 28rpx;
  color: #999;
}

.error-text {
  font-size: 28rpx;
  color: #ff4d4f;
  margin-bottom: 10rpx;
}

.revenue-section {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.revenue-card {
  padding: 30rpx 25rpx;
  background: white;
  border-radius: 8rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
}

.revenue-card.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40rpx 25rpx;
}

.revenue-card.clickable {
  cursor: pointer;
  transition: all 0.3s;
}

.revenue-card.clickable:active {
  transform: scale(0.98);
  opacity: 0.9;
}

.card-label {
  font-size: 26rpx;
  margin-bottom: 12rpx;
  opacity: 0.8;
}

.revenue-card.total .card-label {
  opacity: 0.95;
}

.card-value {
  font-size: 48rpx;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.revenue-card.total .card-value {
  font-size: 56rpx;
}

.card-hint {
  font-size: 22rpx;
  opacity: 0.6;
}

.revenue-card.total .card-hint {
  opacity: 0.85;
}

.revenue-card.clickable .card-hint {
  color: #1890ff;
  opacity: 1;
  font-weight: 500;
}

.revenue-grid {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
}
</style>
