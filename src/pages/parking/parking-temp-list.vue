<template>
  <view class="temp-list-page">
    <!-- 页面标题 -->
    <view class="page-header">
      <text class="page-title">临停收益</text>
      <text class="page-subtitle">临时停车费收入明细</text>
    </view>

    <!-- 筛选区域 -->
    <view class="filter-section">
      <view class="filter-card">
        <view class="filter-row">
          <text class="filter-label">起始月份</text>
          <view class="filter-input" @click="showStartPicker">
            <text class="filter-value">{{ startPeriod }}</text>
            <text class="filter-arrow">▼</text>
          </view>
        </view>
        <view class="filter-row">
          <text class="filter-label">结束月份</text>
          <view class="filter-input" @click="showEndPicker">
            <text class="filter-value">{{ endPeriod }}</text>
            <text class="filter-arrow">▼</text>
          </view>
        </view>
        <up-button
          text="查询"
          type="primary"
          size="normal"
          shape="circle"
          @click="loadData"
          :loading="loading"
        />
      </view>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading && !error" class="loading-container">
      <up-loading-icon mode="circle" size="40" />
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 错误状态 -->
    <view v-else-if="error" class="error-container">
      <text class="error-text">{{ error }}</text>
      <up-button text="重试" type="primary" size="small" @click="loadData" />
    </view>

    <!-- 数据展示 -->
    <view v-else>
      <!-- 总收益 -->
      <view class="revenue-section">
        <view class="revenue-card">
          <text class="revenue-label">临停总收益</text>
          <text class="revenue-value">¥{{ totalRevenue.toFixed(2) }}</text>
          <text class="revenue-count">共 {{ tempRecords.length }} 笔</text>
        </view>
      </view>

      <!-- 临停记录列表 -->
      <view class="records-section">
        <view class="section-header">
          <text class="section-title">临停记录</text>
          <text class="section-count">{{ tempRecords.length }} 条</text>
        </view>

        <view v-if="tempRecords.length > 0" class="records-list">
          <view
            v-for="record in tempRecords"
            :key="record.id"
            class="record-card"
            @click="goToRecordDetail(record.id)"
          >
            <view class="record-header">
              <view class="license-plate">
                <text class="plate-icon">🚗</text>
                <text class="plate-number">{{ record.license_plate }}</text>
              </view>
              <text class="record-amount">¥{{ Number(record.actual_amount).toFixed(2) }}</text>
            </view>

            <view class="record-details">
              <view class="detail-row">
                <text class="detail-label">停车时长</text>
                <text class="detail-value">{{ formatDuration(record.duration_minutes) }}</text>
              </view>
              <view class="detail-row">
                <text class="detail-label">入场时间</text>
                <text class="detail-value">{{ formatDateTime(record.entry_time) }}</text>
              </view>
              <view class="detail-row">
                <text class="detail-label">出场时间</text>
                <text class="detail-value">{{ formatDateTime(record.exit_time) }}</text>
              </view>
              <view class="detail-row">
                <text class="detail-label">车位号</text>
                <text class="detail-value">{{ record.parking_spot_number }}</text>
              </view>
            </view>

            <view class="record-footer">
              <view class="payment-badge">
                <text class="payment-text">{{ getPaymentMethodLabel(record.payment_method) }}</text>
              </view>
              <text class="view-detail-text">查看详情 →</text>
            </view>
          </view>
        </view>

        <!-- 空状态 -->
        <view v-else class="empty-state">
          <text class="empty-text">暂无临停记录</text>
        </view>
      </view>
    </view>

    <!-- 月份选择器 - 起始月份 -->
    <up-datetime-picker
      :show="startPickerShow"
      v-model="startPickerValue"
      mode="year-month"
      :minDate="minDate"
      :maxDate="maxDate"
      @confirm="onStartConfirm"
      @cancel="startPickerShow = false"
    />

    <!-- 月份选择器 - 结束月份 -->
    <up-datetime-picker
      :show="endPickerShow"
      v-model="endPickerValue"
      mode="year-month"
      :minDate="minDate"
      :maxDate="maxDate"
      @confirm="onEndConfirm"
      @cancel="endPickerShow = false"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { directusClient } from "@/utils/directus";
import { readItems } from "@directus/sdk";

const loading = ref(false);
const error = ref<string | null>(null);

// 筛选条件
const startPeriod = ref("");
const endPeriod = ref("");
const startPickerShow = ref(false);
const endPickerShow = ref(false);
const startPickerValue = ref(Date.now());
const endPickerValue = ref(Date.now());

// 日期范围限制
const minDate = ref(new Date("2024-01-01").getTime());
const maxDate = ref(new Date("2026-12-31").getTime());

// 临停记录
const tempRecords = ref<any[]>([]);

// 总收益
const totalRevenue = computed(() => {
  return tempRecords.value.reduce((sum, r) => sum + Number(r.actual_amount || 0), 0);
});

// 初始化日期范围（默认当前月份）
function initDateRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const period = `${year}-${String(month).padStart(2, "0")}`;

  startPeriod.value = period;
  endPeriod.value = period;

  startPickerValue.value = now.getTime();
  endPickerValue.value = now.getTime();
}

// 显示起始月份选择器
function showStartPicker() {
  startPickerShow.value = true;
}

// 显示结束月份选择器
function showEndPicker() {
  endPickerShow.value = true;
}

// 确认起始月份
function onStartConfirm(e: any) {
  const date = new Date(e.value);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  startPeriod.value = `${year}-${String(month).padStart(2, "0")}`;
  startPickerShow.value = false;
}

// 确认结束月份
function onEndConfirm(e: any) {
  const date = new Date(e.value);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  endPeriod.value = `${year}-${String(month).padStart(2, "0")}`;
  endPickerShow.value = false;
}

// 生成日期范围
function generateDateRange(start: string, end: string): { start: string; end: string } {
  const startDate = new Date(`${start}-01T00:00:00Z`);
  const endDate = new Date(`${end}-01T00:00:00Z`);
  endDate.setMonth(endDate.getMonth() + 1);
  endDate.setMilliseconds(-1);

  return {
    start: startDate.toISOString(),
    end: endDate.toISOString(),
  };
}

// 加载数据
async function loadData() {
  loading.value = true;
  error.value = null;

  try {
    const { start, end } = generateDateRange(startPeriod.value, endPeriod.value);

    // 查询临停记录
    const records = (await directusClient.request(
      readItems("parking_temp_records", {
        filter: {
          entry_time: {
            _between: [start, end],
          },
        },
        fields: [
          "id",
          "license_plate",
          "entry_time",
          "exit_time",
          "duration_minutes",
          "parking_spot_number",
          "calculated_amount",
          "actual_amount",
          "payment_method",
          "is_paid",
        ],
        sort: ["-entry_time"],
        limit: -1,
      })
    )) as any;

    tempRecords.value = records || [];
  } catch (e: any) {
    console.error("[parking-temp-list] 加载失败:", e);
    error.value = e.message || "加载失败";
  } finally {
    loading.value = false;
  }
}

// 格式化时长
function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}小时${mins}分钟`;
  }
  return `${mins}分钟`;
}

// 格式化日期时间
function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "未知";
  const date = new Date(dateStr);
  return `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

// 获取支付方式标签
function getPaymentMethodLabel(method: string | null | undefined): string {
  const methodMap: Record<string, string> = {
    wechat: "微信",
    alipay: "支付宝",
    cash: "现金",
  };
  return methodMap[method || ""] || "其他";
}

// 跳转到记录详情
function goToRecordDetail(recordId: string) {
  uni.navigateTo({
    url: `/pages/parking/parking-temp-detail?recordId=${recordId}`,
  });
}

onMounted(() => {
  initDateRange();
  loadData();
});
</script>

<style scoped>
.temp-list-page {
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

/* 筛选区域 */
.filter-section {
  margin-bottom: 20rpx;
}

.filter-card {
  padding: 25rpx;
  background: white;
  border-radius: 8rpx;
}

.filter-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.filter-label {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.filter-input {
  display: flex;
  align-items: center;
  padding: 12rpx 20rpx;
  background: #f5f5f5;
  border-radius: 6rpx;
  gap: 10rpx;
}

.filter-value {
  font-size: 28rpx;
  color: #666;
}

.filter-arrow {
  font-size: 20rpx;
  color: #999;
}

/* 总收益 */
.revenue-section {
  margin-bottom: 20rpx;
}

.revenue-card {
  padding: 35rpx 25rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
}

.revenue-label {
  font-size: 26rpx;
  opacity: 0.9;
  margin-bottom: 10rpx;
}

.revenue-value {
  font-size: 48rpx;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.revenue-count {
  font-size: 24rpx;
  opacity: 0.8;
}

/* 加载和错误状态 */
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

/* 记录列表 */
.records-section {
  margin-top: 20rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15rpx;
  padding: 0 10rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
}

.section-count {
  font-size: 24rpx;
  color: #999;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
}

.record-card {
  background: white;
  border-radius: 8rpx;
  padding: 25rpx;
  cursor: pointer;
  transition: transform 0.2s;
}

.record-card:active {
  transform: scale(0.98);
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15rpx;
  padding-bottom: 15rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.license-plate {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.plate-icon {
  font-size: 28rpx;
}

.plate-number {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.record-amount {
  font-size: 36rpx;
  font-weight: bold;
  color: #52c41a;
}

.record-details {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  margin-bottom: 15rpx;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-label {
  font-size: 26rpx;
  color: #666;
}

.detail-value {
  font-size: 26rpx;
  color: #333;
}

.record-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10rpx;
  border-top: 1rpx solid #f0f0f0;
}

.payment-badge {
  padding: 6rpx 16rpx;
  background: #e6f7ff;
  border-radius: 16rpx;
}

.payment-text {
  font-size: 24rpx;
  color: #1890ff;
}

.view-detail-text {
  font-size: 24rpx;
  color: #1890ff;
}

.empty-state {
  padding: 60rpx 20rpx;
  text-align: center;
  background: white;
  border-radius: 8rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}
</style>
