<template>
  <view class="spot-billing-detail-page">
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

    <!-- 内容区域 -->
    <view v-else class="content">
      <!-- 车位信息 -->
      <view class="spot-header">
        <view class="spot-icon">
          <text class="icon-text">🅿️</text>
        </view>
        <view class="spot-info">
          <text class="spot-number">{{ spotNumber }}</text>
          <text class="spot-owner">业主：{{ ownerName }}</text>
          <text class="spot-location">位置：{{ spotLocation }}</text>
        </view>
      </view>

      <!-- 缴费进度区域 -->
      <view class="progress-section">
        <up-card title="缴费进度" :border="false">
          <template #body>
            <view class="progress-content">
              <!-- 统计信息 -->
              <view class="stats-grid">
                <view class="stat-item">
                  <text class="stat-label">月管理费</text>
                  <text class="stat-value">{{ formatAmount(monthlyFee) }}</text>
                </view>
                <view class="stat-item">
                  <text class="stat-label">总应缴</text>
                  <text class="stat-value">{{ formatAmount(totalAmount) }}</text>
                </view>
                <view class="stat-item">
                  <text class="stat-label">已缴金额</text>
                  <text class="stat-value paid">{{ formatAmount(paidAmount) }}</text>
                </view>
                <view class="stat-item">
                  <text class="stat-label">欠费金额</text>
                  <text class="stat-value unpaid">{{ formatAmount(unpaidAmount) }}</text>
                </view>
              </view>

              <!-- 缴费月份标签 -->
              <view class="months-container">
                <text class="months-label">缴费情况：</text>
                <view class="months-tags">
                  <view
                    v-for="month in allMonths"
                    :key="month"
                    class="month-tag"
                    :class="getMonthStatus(month)"
                  >
                    <text>{{ month }}月</text>
                  </view>
                </view>
              </view>
            </view>
          </template>
        </up-card>
      </view>

      <!-- 缴费记录区域 -->
      <view class="payments-section">
        <view class="section-header">
          <text class="section-title">缴费记录</text>
          <text class="section-count">共 {{ payments.length }} 笔</text>
        </view>

        <!-- 缴费记录列表 -->
        <view v-if="payments.length > 0" class="payments-list">
          <up-card
            v-for="payment in payments"
            :key="payment.id"
            :border="false"
            class="payment-card"
            @click="goToPaymentDetail(payment.id)"
          >
            <template #body>
              <view class="payment-content">
                <view class="payment-header">
                  <text class="payment-amount">{{ formatAmount(payment.amount) }}</text>
                  <view class="payment-method-badge">
                    <text class="payment-method-text">{{ getPaymentMethodLabel(payment.payment_method) }}</text>
                  </view>
                </view>

                <view class="payment-details">
                  <view class="payment-row">
                    <text class="payment-label">缴费时间</text>
                    <text class="payment-value">{{ formatDateTime(payment.paid_at) }}</text>
                  </view>
                  <view class="payment-row">
                    <text class="payment-label">缴费月份</text>
                    <text class="payment-value">{{ formatPaidPeriods(payment.paid_periods) }}</text>
                  </view>
                  <view v-if="payment.payer_name" class="payment-row">
                    <text class="payment-label">缴费人</text>
                    <text class="payment-value">{{ payment.payer_name }}</text>
                  </view>
                  <view v-if="payment.transaction_no" class="payment-row">
                    <text class="payment-label">交易单号</text>
                    <text class="payment-value transaction-no">{{ payment.transaction_no }}</text>
                  </view>
                </view>

                <view class="payment-footer">
                  <text class="view-detail-text">点击查看详情 →</text>
                </view>
              </view>
            </template>
          </up-card>
        </view>

        <!-- 空状态 -->
        <view v-else class="empty-state">
          <text class="empty-text">暂无缴费记录</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { directusClient } from "@/utils/directus";
import { readItems } from "@directus/sdk";
import type { ParkingSpot, Receivable } from "@/@types/directus-schema";
import { formatAmount } from "@/utils/finance-labels";

// 页面参数
const spotId = ref("");

// 数据状态
const loading = ref(false);
const error = ref<string | null>(null);
const spotNumber = ref("");
const ownerName = ref("");
const spotLocation = ref("");
const monthlyFee = ref(0);
const receivables = ref<Receivable[]>([]);
const payments = ref<any[]>([]);

// 所有月份 (1-10月，根据实际数据)
const allMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// 计算属性
const totalAmount = computed(() => {
  return receivables.value.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
});

const paidAmount = computed(() => {
  return receivables.value
    .filter((r) => r.status === "paid")
    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
});

const unpaidAmount = computed(() => {
  return totalAmount.value - paidAmount.value;
});

// 获取当前月份（1-12）
function getCurrentMonth(): number {
  const now = new Date();
  return now.getMonth() + 1;
}

// 判断某月是否已缴费
function isPaid(month: number): boolean {
  const period = `2025-${String(month).padStart(2, "0")}`;
  return receivables.value.some((r) => r.period === period && r.status === "paid");
}

// 获取月份状态：paid(已缴)、overdue(应缴未缴)、future(未到期)
function getMonthStatus(month: number): string {
  const currentMonth = getCurrentMonth();
  const paid = isPaid(month);

  if (paid) {
    return "paid"; // 已缴费：绿色
  } else if (month <= currentMonth) {
    return "overdue"; // 应缴未缴：黄色
  } else {
    return "future"; // 未到期：灰色
  }
}

// 格式化日期时间
function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "未知";
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

// 格式化缴费月份
function formatPaidPeriods(periods: string[] | null | undefined): string {
  if (!periods || periods.length === 0) return "无";
  // periods like ["2025-01", "2025-02"]
  // 先去重，避免同一个月份重复显示
  const uniquePeriods = [...new Set(periods)];
  const months = uniquePeriods.map((p) => {
    const month = parseInt(p.split("-")[1]);
    return `${month}月`;
  });
  return months.join("、");
}

// 获取支付方式标签
function getPaymentMethodLabel(method: string | null | undefined): string {
  const methodMap: Record<string, string> = {
    wechat: "微信",
    alipay: "支付宝",
    bank_transfer: "银行转账",
    cash: "现金",
    pos: "POS机",
  };
  return methodMap[method || ""] || method || "其他";
}

// 加载数据
async function loadData() {
  if (!spotId.value) {
    error.value = "缺少车位ID参数";
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    // 1. 获取车位信息
    const spot = (await directusClient.request(
      readItems("parking_spots", {
        filter: {
          id: { _eq: spotId.value },
        },
        fields: [
          "id",
          "spot_number",
          "location",
          "monthly_management_fee",
          "owner_id.id",
          "owner_id.first_name",
          "owner_id.email",
        ],
        limit: 1,
      })
    )) as any;

    if (!spot || spot.length === 0) {
      error.value = "未找到车位信息";
      return;
    }

    const spotData = spot[0];
    spotNumber.value = spotData.spot_number || "未知车位";
    spotLocation.value = spotData.location || "未知位置";
    monthlyFee.value = Number(spotData.monthly_management_fee) || 0;

    const owner = spotData.owner_id;
    ownerName.value = owner
      ? owner.first_name || owner.email || "未知业主"
      : "未知业主";

    // 2. 获取该车位的 parking_details
    const parkingDetails = (await directusClient.request(
      readItems("parking_details", {
        filter: {
          parking_spot_id: { _eq: spotId.value },
          fee_type: { _eq: "management" },
        },
        fields: ["id"],
        limit: 1,
      })
    )) as any;

    if (!parkingDetails || parkingDetails.length === 0) {
      console.warn("[parking-spot-billing-detail] 该车位没有管理费配置");
      receivables.value = [];
      payments.value = [];
      return;
    }

    const detailId = parkingDetails[0].id;

    // 3. 获取应收账单
    const receivablesResult = (await directusClient.request(
      readItems("receivables", {
        filter: {
          type_code: { _eq: "parking_management" },
          type_detail_id: { _eq: detailId },
        },
        fields: ["id", "period", "amount", "status", "payment_id"],
        sort: ["period"],
        limit: -1,
      })
    )) as Receivable[];

    receivables.value = receivablesResult;

    // 4. 获取缴费记录（通过 payment_id）
    const paymentIds = receivablesResult
      .map((r: any) => r.payment_id)
      .filter((id): id is string => !!id);

    if (paymentIds.length > 0) {
      const paymentsResult = (await directusClient.request(
        readItems("payments", {
          filter: {
            id: { _in: paymentIds },
          },
          fields: [
            "id",
            "amount",
            "paid_at",
            "paid_periods",
            "payment_method",
            "payer_name",
            "transaction_no",
          ],
          sort: ["-paid_at"],
          limit: -1,
        })
      )) as any;

      payments.value = paymentsResult;
    } else {
      payments.value = [];
    }
  } catch (e: any) {
    console.error("[parking-spot-billing-detail] 加载失败:", e);
    error.value = e.message || "加载失败";
  } finally {
    loading.value = false;
  }
}

// 跳转到缴费详情
function goToPaymentDetail(paymentId: string) {
  uni.navigateTo({
    url: `/pages/finance/payment-detail?paymentId=${paymentId}`,
  });
}

onLoad((options: any) => {
  spotId.value = options.spotId || "";
  loadData();
});
</script>

<style scoped>
.spot-billing-detail-page {
  background: #f5f5f5;
  min-height: 100vh;
}

.loading-container,
.error-container {
  padding: 100rpx 20rpx;
  text-align: center;
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

.content {
  padding: 20rpx;
}

.spot-header {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 30rpx 20rpx;
  background: white;
  border-radius: 8rpx;
  margin-bottom: 20rpx;
}

.spot-icon {
  width: 100rpx;
  height: 100rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
}

.icon-text {
  font-size: 50rpx;
}

.spot-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.spot-number {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.spot-owner,
.spot-location {
  font-size: 24rpx;
  color: #666;
}

.progress-section {
  margin-bottom: 20rpx;
}

.progress-content {
  display: flex;
  flex-direction: column;
  gap: 25rpx;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx;
  background: #f8f9fa;
  border-radius: 8rpx;
}

.stat-label {
  font-size: 24rpx;
  color: #666;
  margin-bottom: 8rpx;
}

.stat-value {
  font-size: 32rpx;
  font-weight: bold;
  color: #1890ff;
}

.stat-value.paid {
  color: #52c41a;
}

.stat-value.unpaid {
  color: #ff4d4f;
}

.months-container {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.months-label {
  font-size: 26rpx;
  color: #666;
}

.months-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
}

.month-tag {
  padding: 8rpx 16rpx;
  background: #f0f0f0;
  border-radius: 16rpx;
  border: 2rpx solid transparent;
}

.month-tag.paid {
  background: #f6ffed;
  border-color: #b7eb8f;
}

.month-tag.overdue {
  background: #fffbe6;
  border-color: #ffe58f;
}

.month-tag.future {
  background: #f0f0f0;
  border-color: transparent;
}

.month-tag text {
  font-size: 24rpx;
  color: #666;
}

.month-tag.paid text {
  color: #52c41a;
  font-weight: 500;
}

.month-tag.overdue text {
  color: #faad14;
  font-weight: 500;
}

.month-tag.future text {
  color: #999;
}

.payments-section {
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

.payments-list {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
}

.payment-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.payment-card:active {
  transform: scale(0.98);
}

.payment-content {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
}

.payment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.payment-amount {
  font-size: 36rpx;
  font-weight: bold;
  color: #52c41a;
}

.payment-method-badge {
  padding: 6rpx 16rpx;
  background: #e6f7ff;
  border-radius: 16rpx;
}

.payment-method-text {
  font-size: 24rpx;
  color: #1890ff;
}

.payment-details {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.payment-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.payment-label {
  font-size: 26rpx;
  color: #666;
}

.payment-value {
  font-size: 26rpx;
  color: #333;
}

.payment-value.transaction-no {
  font-family: monospace;
  font-size: 22rpx;
  color: #999;
}

.payment-footer {
  text-align: right;
  padding-top: 5rpx;
  border-top: 1rpx solid #f0f0f0;
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
