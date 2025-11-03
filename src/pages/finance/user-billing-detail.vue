<template>
  <view class="user-billing-detail-page">
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
      <!-- 用户信息 -->
      <view class="user-header">
        <up-avatar :src="userAvatar" size="60" shape="circle" />
        <view class="user-info">
          <text class="user-name">{{ userName }}</text>
          <text class="user-subtitle">物业费详情</text>
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
                  <text class="stat-label">月物业费</text>
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
import { billingsApi, billingPaymentsApi } from "@/utils/directus";
import type { Billing, BillingPayment } from "@/@types/directus-schema";
import { formatAmount } from "@/utils/finance-labels";

// 页面参数
const userId = ref("");

// 数据状态
const loading = ref(false);
const error = ref<string | null>(null);
const userName = ref("");
const userAvatar = ref("");
const billings = ref<Billing[]>([]);
const payments = ref<BillingPayment[]>([]);

// 所有月份 (1-12月)
const allMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

// 计算属性
const monthlyFee = computed(() => {
  // 从第一个账单获取月物业费
  if (billings.value.length > 0) {
    return Number(billings.value[0].amount) || 0;
  }
  return 0;
});

const totalAmount = computed(() => {
  return billings.value.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
});

const paidAmount = computed(() => {
  return billings.value.filter(b => b.is_paid).reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
});

const unpaidAmount = computed(() => {
  return totalAmount.value - paidAmount.value;
});

// 获取当前月份（1-12）
function getCurrentMonth(): number {
  const now = new Date();
  return now.getMonth() + 1; // getMonth() 返回 0-11，需要 +1
}

// 判断某月是否已缴费
function isPaid(month: number): boolean {
  const period = `2025-${String(month).padStart(2, "0")}`;
  return billings.value.some(b => b.period === period && b.is_paid);
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

// 获取用户默认头像
function getDefaultAvatar(): string {
  return "/static/avatar-default.png";
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
  const months = uniquePeriods.map(p => {
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
    bank: "银行转账",
    cash: "现金",
  };
  return methodMap[method || ""] || method || "其他";
}

// 加载数据
async function loadData() {
  if (!userId.value) {
    error.value = "缺少用户ID参数";
    return;
  }

  loading.value = true;
  error.value = null;

  try {

    // 2. 获取用户的账单数据
    const billingsResult = await billingsApi.readMany({
      filter: {
        owner_id: { _eq: userId.value },
        period: {
          _in: ["2025-01", "2025-02", "2025-03", "2025-04", "2025-05",
                "2025-06", "2025-07", "2025-08", "2025-09", "2025-10", "2025-11", "2025-12"]
        },
      },
      fields: ["id", "period", "amount", "is_paid", "paid_at"],
      sort: ["period"],
      limit: 20,
    } as any) as any;

    billings.value = (Array.isArray(billingsResult) ? billingsResult : []) as Billing[];

    // 3. 获取用户的缴费记录
    const paymentsResult = await billingPaymentsApi.readMany({
      filter: {
        owner_id: { _eq: userId.value },
      },
      fields: ["id", "amount", "paid_at", "paid_periods", "payment_method", "payer_name", "transaction_no"],
      sort: ["-paid_at"],
      limit: 20,
    } as any) as any;

    payments.value = (Array.isArray(paymentsResult) ? paymentsResult : []) as BillingPayment[];
  } catch (e: any) {
    console.error("[user-billing-detail] 加载失败:", e);
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
  userId.value = options.userId || "";
  userName.value = decodeURIComponent(options.userName || "未命名用户");
  userAvatar.value = decodeURIComponent(options.userAvatar || getDefaultAvatar());
  loadData();
});
</script>

<style scoped>
.user-billing-detail-page {
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

.user-header {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 30rpx 20rpx;
  background: white;
  border-radius: 8rpx;
  margin-bottom: 20rpx;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.user-name {
  font-size: 32rpx;
  font-weight: bold;
}

.user-subtitle {
  font-size: 24rpx;
  color: #999;
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
