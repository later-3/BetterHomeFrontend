<template>
  <view class="rent-list-page">
    <!-- 页面标题 -->
    <view class="page-header">
      <text class="page-title">停车租金详情</text>
      <text class="page-subtitle">公共车位租金收支明细</text>
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
          <text class="stats-label">出租车位总数</text>
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
                <text class="spot-renter">租户：{{ spot.renterName }}</text>
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
          <text class="empty-text">暂无出租车位数据</text>
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
import { readItems, aggregate } from "@directus/sdk";
import env from "@/config/env";

interface SpotInfo {
  id: string;
  spotNumber: string;
  renterName: string;
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

// 汇总数据
const totalReceivable = ref(0);
const totalReceived = ref(0);
const totalSpots = ref(0);
const paidSpots = ref(0);
const unpaidSpots = ref(0);

// 车位列表
const spotsList = ref<SpotInfo[]>([]);

// 初始化日期范围（默认当前年份）
function initDateRange() {
  const now = new Date();
  const year = now.getFullYear();
  const startMonth = 1;
  const endMonth = 12;

  startPeriod.value = `${year}-${String(startMonth).padStart(2, "0")}`;
  endPeriod.value = `${year}-${String(endMonth).padStart(2, "0")}`;

  startPickerValue.value = new Date(`${year}-01-01`).getTime();
  endPickerValue.value = new Date(`${year}-12-01`).getTime();
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

// 生成月份数组
function generateMonths(start: string, end: string): string[] {
  const months: string[] = [];
  const startDate = new Date(`${start}-01`);
  const endDate = new Date(`${end}-01`);

  let current = new Date(startDate);
  while (current <= endDate) {
    const year = current.getFullYear();
    const month = current.getMonth() + 1;
    months.push(`${year}-${String(month).padStart(2, "0")}`);
    current.setMonth(current.getMonth() + 1);
  }

  return months;
}

// 加载数据
async function loadData() {
  loading.value = true;
  error.value = null;

  try {
    const months = generateMonths(startPeriod.value, endPeriod.value);

    // 1. 获取所有已租车位
    const rentedSpots = (await directusClient.request(
      readItems("parking_spots", {
        filter: {
          is_rented: { _eq: true },
        },
        fields: ["id", "spot_number", "renter_id", "location"],
        limit: -1,
      })
    )) as any;

    console.log(`[parking-rent-list] 找到 ${rentedSpots.length} 个已租车位`);

    if (!rentedSpots || rentedSpots.length === 0) {
      totalSpots.value = 0;
      paidSpots.value = 0;
      unpaidSpots.value = 0;
      totalReceivable.value = 0;
      totalReceived.value = 0;
      spotsList.value = [];
      return;
    }

    // 2. 获取所有租户信息（使用REST API，因为directus_users是核心集合）
    const renterIds = [...new Set(rentedSpots.map((s: any) => s.renter_id).filter(Boolean))];
    const renterMap = new Map<string, string>();

    // 获取当前token
    const token = uni.getStorageSync("directus_token");

    for (const renterId of renterIds) {
      try {
        const response = await fetch(`${env.directusUrl}/users/${renterId}?fields=id,first_name,last_name`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const user = await response.json();
          const name = user.data?.first_name || user.data?.last_name || "未知租户";
          renterMap.set(renterId, name);
        } else {
          renterMap.set(renterId, "未知租户");
        }
      } catch (e) {
        console.warn(`[parking-rent-list] 获取租户信息失败: ${renterId}`, e);
        renterMap.set(renterId, "未知租户");
      }
    }

    // 3. 获取每个车位的parking_details
    const spotIds = rentedSpots.map((s: any) => s.id);
    const parkingDetails = (await directusClient.request(
      readItems("parking_details", {
        filter: {
          parking_spot_id: { _in: spotIds },
          fee_type: { _eq: "rent" },
        },
        fields: ["id", "parking_spot_id"],
        limit: -1,
      })
    )) as any;

    const spotToDetailMap = new Map(parkingDetails.map((d: any) => [d.parking_spot_id, d.id]));

    // 4. 获取筛选期间的租金应收
    const detailIds = parkingDetails.map((d: any) => d.id);
    const receivables = (await directusClient.request(
      readItems("receivables", {
        filter: {
          type_detail_id: { _in: detailIds },
          type_code: { _eq: "parking_rent" },
          period: { _in: months },
        },
        fields: ["id", "type_detail_id", "amount", "status", "payment_id"],
        limit: -1,
      })
    )) as any;

    console.log(`[parking-rent-list] 找到 ${receivables.length} 条应收账单`);

    // 5. 统计每个车位的应收和实收
    const spotStats = new Map<string, { receivable: number; received: number; hasUnpaid: boolean }>();

    for (const spot of rentedSpots) {
      const detailId = spotToDetailMap.get(spot.id);
      const spotReceivables = receivables.filter((r: any) => r.type_detail_id === detailId);

      const receivableAmount = spotReceivables.reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0);
      const receivedAmount = spotReceivables
        .filter((r: any) => r.status === "paid")
        .reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0);
      const hasUnpaid = spotReceivables.some((r: any) => r.status !== "paid");

      spotStats.set(spot.id, {
        receivable: receivableAmount,
        received: receivedAmount,
        hasUnpaid,
      });
    }

    // 6. 计算汇总数据
    let totalRec = 0;
    let totalPaid = 0;
    let paidCount = 0;
    let unpaidCount = 0;

    for (const [_, stats] of spotStats) {
      totalRec += stats.receivable;
      totalPaid += stats.received;
      if (stats.hasUnpaid) {
        unpaidCount++;
      } else {
        paidCount++;
      }
    }

    totalSpots.value = rentedSpots.length;
    paidSpots.value = paidCount;
    unpaidSpots.value = unpaidCount;
    totalReceivable.value = totalRec;
    totalReceived.value = totalPaid;

    // 7. 构建车位列表数据
    spotsList.value = rentedSpots.map((spot: any) => {
      const stats = spotStats.get(spot.id) || { receivable: 0, received: 0, hasUnpaid: false };
      return {
        id: spot.id,
        spotNumber: spot.spot_number,
        renterName: renterMap.get(spot.renter_id) || "未知租户",
        statusText: stats.hasUnpaid ? "有欠费" : "已缴清",
        statusClass: stats.hasUnpaid ? "unpaid" : "paid",
        hasUnpaid: stats.hasUnpaid,
      };
    });

    console.log(`[parking-rent-list] 处理完成，共 ${spotsList.value.length} 个车位`);
  } catch (e: any) {
    console.error("[parking-rent-list] 加载失败:", e);
    error.value = e.message || "加载失败";
  } finally {
    loading.value = false;
  }
}

// 跳转到车位详情
function goToSpotDetail(spot: SpotInfo) {
  uni.navigateTo({
    url: `/pages/parking/parking-rent-spot-detail?spotId=${spot.id}`,
  });
}

onMounted(() => {
  initDateRange();
  loadData();
});
</script>

<style scoped>
.rent-list-page {
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

/* 收支汇总 */
.summary-section {
  display: flex;
  gap: 15rpx;
  margin-bottom: 20rpx;
}

.summary-card {
  flex: 1;
  padding: 30rpx 20rpx;
  background: white;
  border-radius: 8rpx;
  text-align: center;
}

.summary-card.receivable {
  border-left: 4rpx solid #1890ff;
}

.summary-card.received {
  border-left: 4rpx solid #52c41a;
}

.summary-label {
  font-size: 24rpx;
  color: #999;
  display: block;
  margin-bottom: 10rpx;
}

.summary-value {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

/* 车位统计 */
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
  text-align: center;
}

.stats-label {
  font-size: 22rpx;
  color: #999;
  display: block;
  margin-bottom: 8rpx;
}

.stats-value {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.stats-value.paid {
  color: #52c41a;
}

.stats-value.unpaid {
  color: #ff4d4f;
}

/* 车位列表 */
.spots-section {
  margin-bottom: 20rpx;
}

.spot-title {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.spot-number {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.spot-renter {
  font-size: 26rpx;
  color: #999;
}

.spot-status-badge {
  padding: 6rpx 16rpx;
  border-radius: 16rpx;
}

.spot-status-badge.paid {
  background: #f6ffed;
}

.spot-status-badge.unpaid {
  background: #fff2e8;
}

.status-text {
  font-size: 24rpx;
}

.spot-status-badge.paid .status-text {
  color: #52c41a;
}

.spot-status-badge.unpaid .status-text {
  color: #fa8c16;
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
