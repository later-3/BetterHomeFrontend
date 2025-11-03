<template>
  <view class="management-detail-page">
    <!-- 页面标题 -->
    <view class="page-header">
      <text class="page-title">停车管理费详情</text>
      <text class="page-subtitle">车位管理费收支明细</text>
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
      <!-- 收支汇总 -->
      <view class="summary-section">
        <view class="summary-card receivable">
          <text class="summary-label">应收总额</text>
          <text class="summary-value">¥{{ totalReceivable.toFixed(2) }}</text>
        </view>
        <view class="summary-card received">
          <text class="summary-label">实收总额</text>
          <text class="summary-value">¥{{ totalReceived.toFixed(2) }}</text>
        </view>
      </view>

      <!-- 车位统计 -->
      <view class="stats-section">
        <view class="stats-card">
          <text class="stats-label">管理费车位总数</text>
          <text class="stats-value">{{ totalSpots }}</text>
        </view>
        <view class="stats-card">
          <text class="stats-label">未欠费</text>
          <text class="stats-value paid">{{ paidSpots }}</text>
        </view>
        <view class="stats-card">
          <text class="stats-label">欠费</text>
          <text class="stats-value unpaid">{{ unpaidSpots }}</text>
        </view>
      </view>

      <!-- 车位列表 -->
      <view class="spots-section">
        <up-cell-group :border="false">
          <up-cell
            v-for="spot in spotsList"
            :key="spot.id"
            isLink
            @click="goToSpotDetail(spot)"
          >
            <template #title>
              <view class="spot-title">
                <text class="spot-number">{{ spot.spotNumber }}</text>
                <text class="spot-owner">{{ spot.ownerName }}</text>
              </view>
            </template>
            <template #value>
              <view class="spot-status-badge" :class="spot.statusClass">
                <text class="status-text">{{ spot.statusText }}</text>
              </view>
            </template>
          </up-cell>
        </up-cell-group>

        <!-- 空状态 -->
        <view v-if="spotsList.length === 0" class="empty-state">
          <text class="empty-text">暂无车位数据</text>
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
import { ref, onMounted } from "vue";
import { directusClient } from "@/utils/directus";
import { readItems, aggregate } from "@directus/sdk";
import type { ParkingSpot, Receivable, ParkingDetail } from "@/@types/directus-schema";

interface SpotInfo {
  id: string;
  spotNumber: string;
  ownerName: string;
  statusText: string;
  statusClass: string;
  hasUnpaid: boolean;
}

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

// 统计数据
const totalReceivable = ref(0);
const totalReceived = ref(0);
const totalSpots = ref(0);
const paidSpots = ref(0);
const unpaidSpots = ref(0);
const spotsList = ref<SpotInfo[]>([]);

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

// 生成月份范围数组
function generatePeriodRange(start: string, end: string): string[] {
  const periods: string[] = [];
  const [startYear, startMonth] = start.split("-").map(Number);
  const [endYear, endMonth] = end.split("-").map(Number);

  let year = startYear;
  let month = startMonth;

  while (year < endYear || (year === endYear && month <= endMonth)) {
    periods.push(`${year}-${String(month).padStart(2, "0")}`);

    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }

  return periods;
}

// 加载数据
async function loadData() {
  loading.value = true;
  error.value = null;

  try {
    // 生成月份范围
    const periods = generatePeriodRange(startPeriod.value, endPeriod.value);

    // 1. 获取所有有管理费的停车位
    const parkingDetails = await directusClient.request(
      readItems("parking_details", {
        filter: {
          fee_type: { _eq: "management" },
        },
        fields: ["id", "parking_spot_id"],
        limit: -1,
      })
    ) as ParkingDetail[];

    if (!parkingDetails || parkingDetails.length === 0) {
      spotsList.value = [];
      totalSpots.value = 0;
      paidSpots.value = 0;
      unpaidSpots.value = 0;
      totalReceivable.value = 0;
      totalReceived.value = 0;
      return;
    }

    const detailIds = parkingDetails.map((d: any) => d.id);

    // 2. 获取选定时间范围内的应收账单
    const receivables = await directusClient.request(
      readItems("receivables", {
        filter: {
          type_code: { _eq: "parking_management" },
          period: { _in: periods },
          type_detail_id: { _in: detailIds },
        },
        fields: ["id", "type_detail_id", "amount", "status", "period"],
        limit: -1,
      })
    ) as Receivable[];

    // 3. 计算应收和实收总额
    totalReceivable.value = receivables.reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0);
    totalReceived.value = receivables
      .filter((r: any) => r.status === "paid")
      .reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0);

    // 4. 获取停车位信息
    const spotIds = [...new Set(parkingDetails.map((d: any) =>
      typeof d.parking_spot_id === 'string' ? d.parking_spot_id : d.parking_spot_id?.id
    ))].filter(Boolean);

    const spots = await directusClient.request(
      readItems("parking_spots", {
        filter: {
          id: { _in: spotIds as string[] },
        },
        fields: ["id", "spot_number", "owner_id.id", "owner_id.first_name", "owner_id.email"],
        limit: -1,
      })
    ) as ParkingSpot[];

    // 5. 构建车位信息列表
    const spotsInfo: SpotInfo[] = [];

    for (const spot of spots) {
      // 找到该车位对应的 detail
      const detail = parkingDetails.find((d: any) => {
        const spotId = typeof d.parking_spot_id === 'string' ? d.parking_spot_id : d.parking_spot_id?.id;
        return spotId === spot.id;
      });

      if (!detail) continue;

      // 找到该 detail 在选定时间范围内的所有应收
      const spotReceivables = receivables.filter((r: any) => r.type_detail_id === detail.id);

      // 判断是否有欠费
      const hasUnpaid = spotReceivables.some((r: any) => r.status !== "paid");

      // 提取业主名字
      const owner = (spot as any).owner_id;
      const ownerName = owner
        ? (owner.first_name || owner.email || "未知业主")
        : "未知业主";

      spotsInfo.push({
        id: spot.id,
        spotNumber: spot.spot_number || "未知车位",
        ownerName,
        statusText: hasUnpaid ? "欠费" : "未欠费",
        statusClass: hasUnpaid ? "status-unpaid" : "status-paid",
        hasUnpaid,
      });
    }

    // 按欠费情况排序：欠费在前
    spotsInfo.sort((a, b) => {
      if (a.hasUnpaid !== b.hasUnpaid) {
        return a.hasUnpaid ? -1 : 1;
      }
      return a.spotNumber.localeCompare(b.spotNumber);
    });

    spotsList.value = spotsInfo;
    totalSpots.value = spotsInfo.length;
    paidSpots.value = spotsInfo.filter(s => !s.hasUnpaid).length;
    unpaidSpots.value = spotsInfo.filter(s => s.hasUnpaid).length;

  } catch (e: any) {
    console.error("[parking-management-detail] 加载失败:", e);
    error.value = e.message || "加载失败";
  } finally {
    loading.value = false;
  }
}

// 跳转到车位详情
function goToSpotDetail(spot: SpotInfo) {
  uni.navigateTo({
    url: `/pages/parking/parking-spot-billing-detail?spotId=${spot.id}`,
  });
}

onMounted(() => {
  initDateRange();
  loadData();
});
</script>

<style scoped>
.management-detail-page {
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

/* 汇总区域 */
.summary-section {
  display: flex;
  gap: 15rpx;
  margin-bottom: 20rpx;
}

.summary-card {
  flex: 1;
  padding: 25rpx 15rpx;
  background: white;
  border-radius: 8rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.summary-card.receivable {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.summary-card.received {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.summary-label {
  font-size: 24rpx;
  margin-bottom: 8rpx;
  opacity: 0.9;
}

.summary-value {
  font-size: 32rpx;
  font-weight: bold;
}

/* 统计区域 */
.stats-section {
  display: flex;
  gap: 15rpx;
  margin-bottom: 20rpx;
}

.stats-card {
  flex: 1;
  padding: 25rpx 15rpx;
  background: white;
  border-radius: 8rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stats-label {
  font-size: 24rpx;
  color: #666;
  margin-bottom: 8rpx;
}

.stats-value {
  font-size: 32rpx;
  font-weight: bold;
  color: #1890ff;
}

.stats-value.paid {
  color: #52c41a;
}

.stats-value.unpaid {
  color: #ff4d4f;
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

/* 车位列表 */
.spots-section {
  background: white;
  border-radius: 8rpx;
  overflow: hidden;
}

.spot-title {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.spot-number {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
}

.spot-owner {
  font-size: 24rpx;
  color: #999;
}

.spot-status-badge {
  padding: 6rpx 16rpx;
  border-radius: 16rpx;
}

.spot-status-badge.status-paid {
  background: #f6ffed;
  border: 1rpx solid #b7eb8f;
}

.spot-status-badge.status-unpaid {
  background: #fff2f0;
  border: 1rpx solid #ffccc7;
}

.status-text {
  font-size: 24rpx;
  font-weight: 500;
}

.spot-status-badge.status-paid .status-text {
  color: #52c41a;
}

.spot-status-badge.status-unpaid .status-text {
  color: #ff4d4f;
}

.empty-state {
  padding: 60rpx 20rpx;
  text-align: center;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}
</style>
