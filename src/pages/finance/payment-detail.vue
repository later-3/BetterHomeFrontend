<template>
  <view class="payment-detail-page">
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
    <view v-else-if="payment" class="content">
      <!-- 缴费金额卡片 -->
      <view class="amount-section">
        <up-card :border="false">
          <template #body>
            <view class="amount-container">
              <text class="amount-label">缴费金额</text>
              <text class="amount-value">{{ formatAmount(payment.amount) }}</text>
              <view class="status-badge success">
                <text class="status-text">缴费成功</text>
              </view>
            </view>
          </template>
        </up-card>
      </view>

      <!-- 缴费详情 -->
      <view class="details-section">
        <up-card title="缴费信息" :border="false">
          <template #body>
            <up-cell-group :border="false">
              <up-cell title="缴费时间" :value="formatDateTime(payment.paid_at)" />
              <up-cell title="缴费月份" :value="formatPaidPeriods(payment.paid_periods)" />
              <up-cell title="支付方式" :value="getPaymentMethodLabel(payment.payment_method)" />
              <up-cell v-if="payment.payer_name" title="缴费人" :value="payment.payer_name" />
              <up-cell v-if="payment.payer_phone" title="联系电话" :value="payment.payer_phone" />
            </up-cell-group>
          </template>
        </up-card>
      </view>

      <!-- 交易信息 -->
      <view v-if="payment.transaction_no" class="transaction-section">
        <up-card title="交易信息" :border="false">
          <template #body>
            <view class="transaction-content">
              <view class="transaction-row">
                <text class="transaction-label">交易单号</text>
                <text class="transaction-value">{{ payment.transaction_no }}</text>
              </view>
              <view class="copy-button-container">
                <up-button
                  text="复制单号"
                  type="primary"
                  size="small"
                  plain
                  @click="copyTransactionNo"
                />
              </view>
            </view>
          </template>
        </up-card>
      </view>

      <!-- 缴费凭证 -->
      <view v-if="payment.proof_files && payment.proof_files.length > 0" class="proof-section">
        <up-card title="缴费凭证" :border="false">
          <template #body>
            <view class="proof-images">
              <image
                v-for="(file, index) in payment.proof_files"
                :key="index"
                :src="getFileUrl(file)"
                mode="aspectFill"
                class="proof-image"
                @click="previewImage(index)"
              />
            </view>
          </template>
        </up-card>
      </view>

      <!-- 备注信息 -->
      <view v-if="payment.notes" class="notes-section">
        <up-card title="备注信息" :border="false">
          <template #body>
            <view class="notes-content">
              <text class="notes-text">{{ payment.notes }}</text>
            </view>
          </template>
        </up-card>
      </view>

      <!-- 创建时间 -->
      <view class="meta-section">
        <text class="meta-text">记录创建时间: {{ formatDateTime(payment.date_created) }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { billingPaymentsApi } from "@/utils/directus";
import type { BillingPayment } from "@/@types/directus-schema";
import { formatAmount } from "@/utils/finance-labels";
import env from "@/config/env";

// 页面参数
const paymentId = ref("");

// 数据状态
const loading = ref(false);
const error = ref<string | null>(null);
const payment = ref<BillingPayment | null>(null);

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
  const months = periods.map(p => {
    const parts = p.split("-");
    const month = parseInt(parts[1]);
    return `${parts[0]}年${month}月`;
  });
  return months.join("、");
}

// 获取支付方式标签
function getPaymentMethodLabel(method: string | null | undefined): string {
  const methodMap: Record<string, string> = {
    wechat: "微信支付",
    alipay: "支付宝",
    bank: "银行转账",
    cash: "现金",
  };
  return methodMap[method || ""] || method || "其他";
}

// 获取文件URL
function getFileUrl(fileId: string): string {
  return `${env.directusUrl}/assets/${fileId}`;
}

// 复制交易单号
function copyTransactionNo() {
  if (!payment.value?.transaction_no) return;

  uni.setClipboardData({
    data: payment.value.transaction_no,
    success: () => {
      uni.showToast({
        title: "已复制到剪贴板",
        icon: "success",
      });
    },
    fail: () => {
      uni.showToast({
        title: "复制失败",
        icon: "none",
      });
    },
  });
}

// 预览图片
function previewImage(index: number) {
  if (!payment.value?.proof_files) return;

  const urls = payment.value.proof_files.map(file => getFileUrl(file));

  uni.previewImage({
    urls,
    current: index,
  });
}

// 加载数据
async function loadData() {
  if (!paymentId.value) {
    error.value = "缺少缴费记录ID参数";
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const result = await billingPaymentsApi.readOne(paymentId.value, {
      fields: [
        "id",
        "amount",
        "paid_at",
        "paid_periods",
        "payment_method",
        "payer_name",
        "payer_phone",
        "transaction_no",
        "proof_files",
        "notes",
        "date_created",
      ],
    } as any) as any;

    payment.value = result as BillingPayment;
  } catch (e: any) {
    console.error("[payment-detail] 加载失败:", e);
    error.value = e.message || "加载失败";
  } finally {
    loading.value = false;
  }
}

onLoad((options: any) => {
  paymentId.value = options.paymentId || "";
  loadData();
});
</script>

<style scoped>
.payment-detail-page {
  background: #f5f5f5;
  min-height: 100vh;
  padding: 20rpx;
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
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.amount-section {
  margin-bottom: 10rpx;
}

.amount-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30rpx 20rpx;
}

.amount-label {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 15rpx;
}

.amount-value {
  font-size: 56rpx;
  font-weight: bold;
  color: #52c41a;
  margin-bottom: 20rpx;
}

.status-badge {
  padding: 8rpx 24rpx;
  border-radius: 20rpx;
}

.status-badge.success {
  background: #f6ffed;
  border: 2rpx solid #b7eb8f;
}

.status-text {
  font-size: 24rpx;
  color: #52c41a;
  font-weight: 500;
}

.details-section,
.transaction-section,
.proof-section,
.notes-section {
  /* Card styles handled by up-card */
}

.transaction-content {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
}

.transaction-row {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.transaction-label {
  font-size: 26rpx;
  color: #666;
}

.transaction-value {
  font-size: 24rpx;
  color: #333;
  font-family: monospace;
  word-break: break-all;
}

.copy-button-container {
  padding-top: 10rpx;
}

.proof-images {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15rpx;
}

.proof-image {
  width: 100%;
  height: 200rpx;
  border-radius: 8rpx;
  background: #f0f0f0;
}

.notes-content {
  padding: 10rpx 0;
}

.notes-text {
  font-size: 26rpx;
  color: #333;
  line-height: 1.6;
}

.meta-section {
  text-align: center;
  padding: 20rpx;
}

.meta-text {
  font-size: 24rpx;
  color: #999;
}
</style>
