<template>
  <view class="billing-detail-page">
    <!-- 加载状态 -->
    <view v-if="loading" class="loading">
      <text>加载中...</text>
    </view>

    <!-- 错误状态 -->
    <view v-if="error" class="error">
      <text>{{ error }}</text>
      <button @click="loadData" size="mini">重试</button>
    </view>

    <!-- 账单详情 -->
    <view v-if="!loading && !error && billing">
      <!-- 账单基本信息 -->
      <view class="billing-card">
        <view class="card-header">
          <text class="billing-period">{{ billing.period }}</text>
          <view class="status-badge" :class="getStatusClass(billing.status)">
            <text class="status-text">{{ getStatusText(billing.status) }}</text>
          </view>
        </view>

        <view class="amount-section">
          <view class="amount-row main-amount">
            <text class="amount-label">应缴金额</text>
            <text class="amount-value">{{ formatAmount(billing.billing_amount) }}</text>
          </view>
          <view class="amount-row">
            <text class="amount-label">已缴金额</text>
            <text class="amount-value paid">{{ formatAmount(billing.paid_amount || 0) }}</text>
          </view>
          <view v-if="unpaidAmount > 0" class="amount-row">
            <text class="amount-label">待缴金额</text>
            <text class="amount-value unpaid">{{ formatAmount(unpaidAmount) }}</text>
          </view>
          <view v-if="billing.late_fee && billing.late_fee > 0" class="amount-row">
            <text class="amount-label">滞纳金</text>
            <text class="amount-value late-fee">{{ formatAmount(billing.late_fee) }}</text>
          </view>
        </view>

        <view class="detail-section">
          <view class="detail-row">
            <text class="detail-label">房屋面积</text>
            <text class="detail-value">{{ billing.area }}㎡</text>
          </view>
          <view class="detail-row">
            <text class="detail-label">物业费单价</text>
            <text class="detail-value">{{ formatAmount(billing.unit_price) }}/㎡</text>
          </view>
          <view class="detail-row">
            <text class="detail-label">缴费截止日</text>
            <text class="detail-value">{{ formatDate(billing.due_date) }}</text>
          </view>
          <view v-if="billing.notes" class="detail-row">
            <text class="detail-label">备注</text>
            <text class="detail-value">{{ billing.notes }}</text>
          </view>
        </view>

        <!-- 逾期提醒 -->
        <view v-if="isOverdue" class="overdue-alert">
          <text class="alert-text">⚠️ 此账单已逾期，请尽快缴费避免产生更多滞纳金</text>
        </view>
      </view>

      <!-- 缴费记录 -->
      <view class="payments-section">
        <view class="section-header">
          <text class="section-title">缴费记录</text>
          <text class="section-count">共 {{ payments.length }} 笔</text>
        </view>

        <view v-if="payments.length > 0" class="payments-list">
          <view
            v-for="payment in payments"
            :key="payment.id"
            class="payment-item"
          >
            <view class="payment-header">
              <text class="payment-amount">{{ formatAmount(payment.amount) }}</text>
              <text class="payment-date">{{ formatDateTime(payment.paid_at) }}</text>
            </view>
            <view class="payment-details">
              <view class="payment-row">
                <text class="payment-label">支付方式</text>
                <text class="payment-value">{{ getPaymentMethodText(payment.payment_method) }}</text>
              </view>
              <view v-if="payment.payer_name" class="payment-row">
                <text class="payment-label">缴费人</text>
                <text class="payment-value">{{ payment.payer_name }}</text>
              </view>
              <view v-if="payment.payer_phone" class="payment-row">
                <text class="payment-label">联系电话</text>
                <text class="payment-value">{{ payment.payer_phone }}</text>
              </view>
              <view v-if="payment.transaction_no" class="payment-row">
                <text class="payment-label">交易流水号</text>
                <text class="payment-value">{{ payment.transaction_no }}</text>
              </view>
              <view v-if="payment.notes" class="payment-row">
                <text class="payment-label">备注</text>
                <text class="payment-value">{{ payment.notes }}</text>
              </view>
            </view>

            <!-- 缴费凭证 -->
            <view v-if="payment.proof_files && payment.proof_files.length > 0" class="proof-section">
              <text class="proof-label">缴费凭证</text>
              <view class="proof-list">
                <view
                  v-for="fileId in payment.proof_files"
                  :key="fileId"
                  class="proof-item"
                  @click="previewProof(fileId)"
                >
                  <text class="proof-text">查看凭证</text>
                </view>
              </view>
            </view>
          </view>
        </view>

        <view v-else class="empty-payments">
          <text class="empty-text">暂无缴费记录</text>
          <text class="empty-hint">请联系物业确认缴费情况</text>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="actions">
        <button v-if="unpaidAmount > 0" @click="goToPayment" type="primary" size="default">
          立即缴费
        </button>
        <button @click="downloadReceipt" type="default" size="default">
          下载缴费凭证
        </button>
      </view>
    </view>

    <!-- 账单不存在 -->
    <view v-if="!loading && !error && !billing" class="not-found">
      <text class="not-found-text">账单不存在</text>
      <button @click="goBack" size="mini">返回</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useFinanceStore } from "@/store/finance";
import { formatAmount, formatDate, formatDateTime } from "@/utils/finance-labels";
import type { Billing, BillingPayment } from "@/@types/directus-schema";

const financeStore = useFinanceStore();

// 页面参数
const billingId = ref("");

// 页面状态
const loading = ref(false);
const error = ref<string | null>(null);

// 数据
const billing = ref<Billing | null>(null);
const payments = ref<BillingPayment[]>([]);

// 计算属性
const unpaidAmount = computed(() => {
  if (!billing.value) return 0;
  return billing.value.billing_amount - (billing.value.paid_amount || 0);
});

const isOverdue = computed(() => {
  if (!billing.value || billing.value.status === "paid") return false;
  if (!billing.value.due_date) return false;
  
  const dueDate = new Date(billing.value.due_date);
  const now = new Date();
  return now > dueDate;
});

// 获取状态文本
function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    unpaid: "未缴",
    paid: "已缴",
    partial: "部分缴纳",
    overdue: "逾期",
  };
  return statusMap[status] || status;
}

// 获取状态样式类
function getStatusClass(status: string): string {
  return `status-${status}`;
}

// 获取支付方式文本
function getPaymentMethodText(method: string): string {
  const methodMap: Record<string, string> = {
    wechat: "微信支付",
    alipay: "支付宝",
    bank_transfer: "银行转账",
    cash: "现金",
    pos: "POS机",
    other: "其他",
  };
  return methodMap[method] || method;
}

// 加载数据
async function loadData() {
  loading.value = true;
  error.value = null;

  try {
    // 加载我的账单列表
    await financeStore.fetchMyBillings(true);
    
    // 从列表中找到对应的账单
    const foundBilling = financeStore.myBillings.find(b => b.id === billingId.value);
    if (foundBilling) {
      billing.value = foundBilling;
      
      // 加载该账单的缴费记录
      await financeStore.fetchMyBillingPayments(billingId.value, true);
      payments.value = financeStore.billingPayments;
    } else {
      billing.value = null;
    }
  } catch (e: any) {
    error.value = e.message || "加载失败";
  } finally {
    loading.value = false;
  }
}

// 预览凭证
function previewProof(fileId: string) {
  // TODO: 实现文件预览功能
  uni.showToast({
    title: "预览功能开发中",
    icon: "none",
  });
}

// 跳转到缴费页面
function goToPayment() {
  // TODO: 实现在线缴费功能
  uni.showToast({
    title: "在线缴费功能开发中",
    icon: "none",
  });
}

// 下载缴费凭证
function downloadReceipt() {
  // TODO: 实现下载功能
  uni.showToast({
    title: "下载功能开发中",
    icon: "none",
  });
}

// 返回上一页
function goBack() {
  uni.navigateBack();
}

onMounted(() => {
  // 获取页面参数
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1] as any;
  const options = currentPage.options || {};
  
  billingId.value = options.id || "";
  
  if (billingId.value) {
    loadData();
  } else {
    error.value = "缺少账单ID参数";
  }
});
</script>

<style scoped>
.billing-detail-page {
  padding: 20rpx;
  background: #f5f5f5;
  min-height: 100vh;
}

.loading,
.error,
.not-found {
  padding: 40rpx;
  text-align: center;
  background: white;
  border-radius: 8rpx;
  margin-bottom: 20rpx;
}

.billing-card {
  background: white;
  border-radius: 8rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.billing-period {
  font-size: 36rpx;
  font-weight: bold;
}

.status-badge {
  padding: 8rpx 16rpx;
  border-radius: 16rpx;
}

.status-text {
  font-size: 24rpx;
  color: white;
}

.status-paid {
  background: #52c41a;
}

.status-unpaid {
  background: #ff4d4f;
}

.status-partial {
  background: #faad14;
}

.status-overdue {
  background: #f5222d;
}

.amount-section {
  margin-bottom: 30rpx;
}

.amount-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15rpx;
}

.amount-row.main-amount {
  padding-bottom: 15rpx;
  border-bottom: 1rpx solid #f0f0f0;
  margin-bottom: 20rpx;
}

.amount-label {
  font-size: 28rpx;
  color: #666;
}

.amount-value {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.amount-row.main-amount .amount-value {
  font-size: 36rpx;
  color: #1890ff;
}

.amount-value.paid {
  color: #52c41a;
}

.amount-value.unpaid {
  color: #ff4d4f;
}

.amount-value.late-fee {
  color: #f5222d;
}

.detail-section {
  margin-bottom: 20rpx;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15rpx;
}

.detail-label {
  font-size: 26rpx;
  color: #666;
}

.detail-value {
  font-size: 26rpx;
  color: #333;
}

.overdue-alert {
  padding: 15rpx 20rpx;
  background: #fff2f0;
  border: 1rpx solid #ffccc7;
  border-radius: 8rpx;
  margin-top: 20rpx;
}

.alert-text {
  font-size: 26rpx;
  color: #ff4d4f;
}

.payments-section {
  background: white;
  border-radius: 8rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25rpx;
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
  gap: 25rpx;
}

.payment-item {
  padding: 20rpx;
  background: #f8f9fa;
  border-radius: 8rpx;
  border-left: 4rpx solid #52c41a;
}

.payment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15rpx;
}

.payment-amount {
  font-size: 32rpx;
  font-weight: bold;
  color: #52c41a;
}

.payment-date {
  font-size: 24rpx;
  color: #999;
}

.payment-details {
  margin-bottom: 15rpx;
}

.payment-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10rpx;
}

.payment-label {
  font-size: 24rpx;
  color: #666;
}

.payment-value {
  font-size: 24rpx;
  color: #333;
}

.proof-section {
  margin-top: 15rpx;
}

.proof-label {
  font-size: 24rpx;
  color: #666;
  display: block;
  margin-bottom: 10rpx;
}

.proof-list {
  display: flex;
  gap: 10rpx;
}

.proof-item {
  padding: 8rpx 16rpx;
  background: #e6f7ff;
  border: 1rpx solid #91d5ff;
  border-radius: 6rpx;
}

.proof-text {
  font-size: 22rpx;
  color: #1890ff;
}

.empty-payments {
  padding: 40rpx 20rpx;
  text-align: center;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
  display: block;
  margin-bottom: 10rpx;
}

.empty-hint {
  font-size: 24rpx;
  color: #ccc;
}

.actions {
  display: flex;
  gap: 20rpx;
  padding: 0 20rpx;
}

.actions button {
  flex: 1;
}

.not-found-text {
  font-size: 28rpx;
  color: #999;
  display: block;
  margin-bottom: 20rpx;
}
</style>