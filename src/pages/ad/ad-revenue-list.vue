<template>
  <view class="ad-revenue-page">
    <!-- 页面标题 -->
    <view class="page-header">
      <text class="page-title">广告收益</text>
      <text class="page-subtitle">广告位租赁收支明细</text>
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

      <!-- 广告位统计 -->
      <view class="stats-section">
        <view class="stats-card">
          <text class="stats-label">总广告位</text>
          <text class="stats-value">{{ totalSpots }}</text>
        </view>
        <view class="stats-card">
          <text class="stats-label">已出租</text>
          <text class="stats-value occupied">{{ occupiedSpots }}</text>
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

      <!-- 广告位列表 -->
      <view class="spots-section">
        <view class="section-header">
          <text class="section-title">广告位列表</text>
          <text class="section-count">共 {{ spotsList.length }} 个</text>
        </view>

        <!-- 广告位卡片列表 -->
        <view v-if="spotsList.length > 0" class="spots-list">
          <view
            v-for="spot in spotsList"
            :key="spot.id"
            class="spot-card"
            @click="goToSpotDetail(spot)"
          >
            <view class="spot-card-header">
              <view class="spot-info">
                <text class="spot-icon">{{ spot.typeText === '电梯广告' ? '🏢' : '🚪' }}</text>
                <text class="spot-code">{{ spot.spotCode }}</text>
              </view>
              <view class="spot-type-badge" :class="spot.typeClass">
                <text class="spot-type-text">{{ spot.typeText }}</text>
              </view>
            </view>

            <view class="spot-card-details">
              <view class="detail-row">
                <text class="detail-label">位置</text>
                <text class="detail-value">{{ spot.location }}</text>
              </view>
              <view class="detail-row">
                <text class="detail-label">缴费状态</text>
                <view class="spot-status-badge" :class="spot.statusClass">
                  <text class="status-text">{{ spot.statusText }}</text>
                </view>
              </view>
            </view>

            <view class="spot-card-footer">
              <text class="view-detail-text">查看详情 →</text>
            </view>
          </view>
        </view>

        <!-- 空状态 -->
        <view v-else class="empty-state">
          <text class="empty-text">暂无出租广告位数据</text>
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
  spotCode: string;
  location: string;
  typeText: string;
  typeClass: string;
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
const occupiedSpots = ref(0);
const paidSpots = ref(0);
const unpaidSpots = ref(0);

// 广告位列表
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

// 生成月份范围数组
function generateMonthRange(start: string, end: string): string[] {
  const months: string[] = [];
  const [startYear, startMonth] = start.split("-").map(Number);
  const [endYear, endMonth] = end.split("-").map(Number);

  let year = startYear;
  let month = startMonth;

  while (year < endYear || (year === endYear && month <= endMonth)) {
    months.push(`${year}-${String(month).padStart(2, "0")}`);
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }

  return months;
}

// 加载数据
async function loadData() {
  if (!startPeriod.value || !endPeriod.value) {
    uni.showToast({
      title: "请选择月份范围",
      icon: "none",
    });
    return;
  }

  if (startPeriod.value > endPeriod.value) {
    uni.showToast({
      title: "起始月份不能大于结束月份",
      icon: "none",
    });
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    // 1. 获取所有广告位
    const allSpots = await directusClient.request(
      readItems("ad_spots", {
        fields: [
          "id",
          "spot_code",
          "spot_type",
          "location",
          "status",
          "current_contract_id",
        ],
        limit: -1,
      })
    );

    if (!allSpots || allSpots.length === 0) {
      totalReceivable.value = 0;
      totalReceived.value = 0;
      totalSpots.value = 0;
      occupiedSpots.value = 0;
      paidSpots.value = 0;
      unpaidSpots.value = 0;
      spotsList.value = [];
      return;
    }

    // 区分已出租和未出租的广告位
    const occupiedSpotsData = allSpots.filter((s: any) => s.current_contract_id);
    totalSpots.value = allSpots.length;
    occupiedSpots.value = occupiedSpotsData.length;

    // 2. 获取广告详情记录（连接ad_spots和receivables）
    let adDetails: any[] = [];
    let receivables: any[] = [];

    if (occupiedSpotsData.length > 0) {
      const spotIds = occupiedSpotsData.map((s: any) => s.id);
      adDetails = await directusClient.request(
        readItems("ad_details", {
          filter: {
            spot_id: {
              _in: spotIds,
            },
          },
          fields: ["id", "spot_id", "contract_id"],
          limit: -1,
        })
      );
    }

    // 3. 生成月份范围并获取应收账单
    if (adDetails.length > 0) {
      const months = generateMonthRange(startPeriod.value, endPeriod.value);
      const detailIds = adDetails.map((d: any) => d.id);

      // 4. 获取应收账单（筛选月份范围）
      receivables = await directusClient.request(
        readItems("receivables", {
          filter: {
            type_code: { _eq: "ad_revenue" },
            type_detail_id: { _in: detailIds },
            period: { _in: months },
          },
          fields: ["id", "type_detail_id", "amount", "status", "payment_id"],
          limit: -1,
        })
      );
    }

    // 5. 计算应收总额
    totalReceivable.value = receivables.reduce(
      (sum: number, r: any) => sum + Number(r.amount || 0),
      0
    );

    // 6. 统计实收总额（使用aggregate）
    const paymentResult = await directusClient.request(
      aggregate("payments", {
        aggregate: { sum: ["amount"] },
        query: {
          filter: {
            type_code: { _eq: "ad_revenue" },
          },
        },
      })
    );
    totalReceived.value = Number(paymentResult?.[0]?.sum?.amount || 0);

    // 7. 按广告位分组统计欠费情况
    const spotStatusMap = new Map<string, { hasUnpaid: boolean; hasReceivables: boolean }>();

    // 先初始化所有已出租广告位的状态
    for (const spot of occupiedSpotsData) {
      spotStatusMap.set(spot.id, { hasUnpaid: false, hasReceivables: false });
    }

    // 再根据 receivables 更新状态
    for (const recv of receivables) {
      const detailId = recv.type_detail_id;
      const detail = adDetails.find((d: any) => d.id === detailId);
      if (!detail) continue;

      const spotId = detail.spot_id;
      const status = spotStatusMap.get(spotId);
      if (status) {
        status.hasReceivables = true;
        if (recv.status === "unpaid") {
          status.hasUnpaid = true;
        }
      }
    }

    // 8. 统计欠费/未欠费广告位数
    paidSpots.value = 0;
    unpaidSpots.value = 0;
    spotStatusMap.forEach((status) => {
      if (!status.hasReceivables) {
        // 没有账单数据的不计入统计
        return;
      }
      if (status.hasUnpaid) {
        unpaidSpots.value++;
      } else {
        paidSpots.value++;
      }
    });

    // 9. 构建广告位列表（包含所有广告位）
    spotsList.value = allSpots.map((spot: any) => {
      // 广告位类型
      const typeText = spot.spot_type === "elevator" ? "电梯广告" : "闸机广告";
      const typeClass = spot.spot_type === "elevator" ? "type-elevator" : "type-gate";

      // 广告位状态
      let statusText: string;
      let statusClass: string;

      if (spot.status === "available") {
        // 未出租
        statusText = "未出租";
        statusClass = "status-available";
      } else {
        // 已出租，检查账单状态
        const status = spotStatusMap.get(spot.id) || { hasUnpaid: false, hasReceivables: false };

        if (!status.hasReceivables) {
          statusText = "暂无账单";
          statusClass = "status-no-data";
        } else if (status.hasUnpaid) {
          statusText = "有欠费";
          statusClass = "status-unpaid";
        } else {
          statusText = "已缴清";
          statusClass = "status-paid";
        }
      }

      return {
        id: spot.id,
        spotCode: spot.spot_code,
        location: spot.location,
        typeText,
        typeClass,
        statusText,
        statusClass,
        hasUnpaid: false,
      };
    });

    console.log("[ad-revenue-list] 数据加载完成", {
      totalSpots: totalSpots.value,
      totalReceivable: totalReceivable.value,
      totalReceived: totalReceived.value,
      paidSpots: paidSpots.value,
      unpaidSpots: unpaidSpots.value,
    });
  } catch (err: any) {
    console.error("[ad-revenue-list] 加载数据失败", err);
    error.value = err.message || "加载数据失败，请稍后重试";
    uni.showToast({
      title: "加载失败",
      icon: "none",
    });
  } finally {
    loading.value = false;
  }
}

// 跳转到广告位详情
function goToSpotDetail(spot: SpotInfo) {
  uni.navigateTo({
    url: `/pages/ad/ad-spot-detail?id=${spot.id}&startPeriod=${startPeriod.value}&endPeriod=${endPeriod.value}`,
  });
}

// 页面加载时初始化
onMounted(() => {
  initDateRange();
  loadData();
});
</script>

<style scoped lang="scss">
.ad-revenue-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 40rpx;
}

.page-header {
  padding: 40rpx 40rpx 30rpx;
  background: linear-gradient(135deg, #42a5f5 0%, #478ed1 100%);
  text-align: center;
  color: white;
  margin-bottom: 20rpx;

  .page-title {
    display: block;
    font-size: 44rpx;
    font-weight: bold;
    margin-bottom: 12rpx;
  }

  .page-subtitle {
    display: block;
    font-size: 26rpx;
    opacity: 0.9;
  }
}

.filter-section {
  padding: 0 30rpx 30rpx;

  .filter-card {
    background: white;
    border-radius: 20rpx;
    padding: 40rpx;
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);

    .filter-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 30rpx;

      .filter-label {
        font-size: 30rpx;
        color: #333;
        font-weight: 500;
      }

      .filter-input {
        display: flex;
        align-items: center;
        padding: 16rpx 24rpx;
        background: #f5f5f5;
        border-radius: 12rpx;
        min-width: 200rpx;
        justify-content: space-between;

        .filter-value {
          font-size: 28rpx;
          color: #666;
        }

        .filter-arrow {
          font-size: 20rpx;
          color: #999;
          margin-left: 12rpx;
        }
      }
    }
  }
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;

  .loading-text {
    margin-top: 20rpx;
    font-size: 28rpx;
    color: #666;
  }
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 40rpx;

  .error-text {
    font-size: 28rpx;
    color: #666;
    text-align: center;
    margin-bottom: 40rpx;
  }
}

.summary-section {
  display: flex;
  gap: 20rpx;
  padding: 0 30rpx 30rpx;

  .summary-card {
    flex: 1;
    background: white;
    border-radius: 20rpx;
    padding: 30rpx;
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);

    .summary-label {
      display: block;
      font-size: 26rpx;
      color: #666;
      margin-bottom: 12rpx;
    }

    .summary-value {
      display: block;
      font-size: 38rpx;
      font-weight: bold;
    }

    &.receivable .summary-value {
      color: #ff9800;
    }

    &.received .summary-value {
      color: #4caf50;
    }
  }
}

.stats-section {
  display: flex;
  gap: 20rpx;
  padding: 0 30rpx 30rpx;

  .stats-card {
    flex: 1;
    background: white;
    border-radius: 16rpx;
    padding: 24rpx;
    text-align: center;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);

    .stats-label {
      display: block;
      font-size: 24rpx;
      color: #999;
      margin-bottom: 8rpx;
    }

    .stats-value {
      display: block;
      font-size: 36rpx;
      font-weight: bold;
      color: #333;

      &.occupied {
        color: #1976d2;
      }

      &.paid {
        color: #4caf50;
      }

      &.unpaid {
        color: #f44336;
      }
    }
  }
}

.spots-section {
  padding: 0 30rpx;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;
    padding: 0 10rpx;

    .section-title {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
    }

    .section-count {
      font-size: 24rpx;
      color: #999;
    }
  }

  .spots-list {
    display: flex;
    flex-direction: column;
    gap: 20rpx;
  }

  .spot-card {
    background: white;
    border-radius: 16rpx;
    padding: 30rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
    cursor: pointer;
    transition: transform 0.2s;

    &:active {
      transform: scale(0.98);
    }
  }

  .spot-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;
    padding-bottom: 20rpx;
    border-bottom: 1rpx solid #f0f0f0;

    .spot-info {
      display: flex;
      align-items: center;
      gap: 12rpx;

      .spot-icon {
        font-size: 32rpx;
      }

      .spot-code {
        font-size: 32rpx;
        font-weight: bold;
        color: #333;
      }
    }

    .spot-type-badge {
      padding: 8rpx 16rpx;
      border-radius: 20rpx;
      font-size: 22rpx;
      font-weight: 500;

      &.type-elevator {
        background: #e3f2fd;
        color: #1976d2;
      }

      &.type-gate {
        background: #fff3e0;
        color: #f57c00;
      }

      .spot-type-text {
        font-size: 22rpx;
      }
    }
  }

  .spot-card-details {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
    margin-bottom: 20rpx;

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .detail-label {
        font-size: 26rpx;
        color: #666;
      }

      .detail-value {
        font-size: 26rpx;
        color: #333;
      }
    }
  }

  .spot-status-badge {
    padding: 6rpx 16rpx;
    border-radius: 16rpx;
    font-size: 22rpx;
    font-weight: 500;

    &.status-paid {
      background: #e8f5e9;
      color: #4caf50;
    }

    &.status-unpaid {
      background: #ffebee;
      color: #f44336;
    }

    &.status-no-data {
      background: #f5f5f5;
      color: #999;
    }

    &.status-available {
      background: #e3f2fd;
      color: #1976d2;
    }

    .status-text {
      font-size: 22rpx;
    }
  }

  .spot-card-footer {
    padding-top: 16rpx;
    border-top: 1rpx solid #f0f0f0;
    text-align: right;

    .view-detail-text {
      font-size: 24rpx;
      color: #1890ff;
    }
  }
}

.empty-state {
  padding: 100rpx 40rpx;
  text-align: center;

  .empty-text {
    font-size: 28rpx;
    color: #999;
  }
}
</style>
