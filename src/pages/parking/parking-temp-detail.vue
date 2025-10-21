<template>
  <view class="temp-detail-page">
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
      <!-- 车牌号 -->
      <view class="license-header">
        <text class="car-icon">🚗</text>
        <text class="license-number">{{ record.license_plate }}</text>
      </view>

      <!-- 金额卡片 -->
      <view class="amount-card">
        <text class="amount-label">停车费用</text>
        <text class="amount-value">¥{{ Number(record.actual_amount).toFixed(2) }}</text>
        <view class="payment-status">
          <text class="status-icon">✓</text>
          <text class="status-text">已支付</text>
        </view>
      </view>

      <!-- 停车信息 -->
      <view class="info-section">
        <up-card title="停车信息" :border="false">
          <template #body>
            <view class="info-content">
              <view class="info-row">
                <text class="info-label">入场时间</text>
                <text class="info-value">{{ formatFullDateTime(record.entry_time) }}</text>
              </view>
              <view class="info-row">
                <text class="info-label">出场时间</text>
                <text class="info-value">{{ formatFullDateTime(record.exit_time) }}</text>
              </view>
              <view class="info-row">
                <text class="info-label">停车时长</text>
                <text class="info-value highlight">{{ formatDuration(record.duration_minutes) }}</text>
              </view>
              <view class="info-row">
                <text class="info-label">车位号</text>
                <text class="info-value">{{ record.parking_spot_number }}</text>
              </view>
            </view>
          </template>
        </up-card>
      </view>

      <!-- 费用信息 -->
      <view class="fee-section">
        <up-card title="费用信息" :border="false">
          <template #body>
            <view class="fee-content">
              <view class="fee-row">
                <text class="fee-label">计费时长</text>
                <text class="fee-value">{{ Math.ceil(record.duration_minutes / 60) }} 小时</text>
              </view>
              <view class="fee-row">
                <text class="fee-label">单价</text>
                <text class="fee-value">¥5 / 小时</text>
              </view>
              <view class="fee-row">
                <text class="fee-label">计算金额</text>
                <text class="fee-value">¥{{ Number(record.calculated_amount).toFixed(2) }}</text>
              </view>
              <view class="fee-row total">
                <text class="fee-label">实收金额</text>
                <text class="fee-value">¥{{ Number(record.actual_amount).toFixed(2) }}</text>
              </view>
            </view>
          </template>
        </up-card>
      </view>

      <!-- 支付信息 -->
      <view class="payment-section">
        <up-card title="支付信息" :border="false">
          <template #body>
            <view class="payment-content">
              <view class="payment-row">
                <text class="payment-label">支付方式</text>
                <text class="payment-value">{{ getPaymentMethodLabel(record.payment_method) }}</text>
              </view>
              <view class="payment-row">
                <text class="payment-label">支付时间</text>
                <text class="payment-value">{{ formatFullDateTime(record.exit_time) }}</text>
              </view>
              <view v-if="payment" class="payment-row">
                <text class="payment-label">交易单号</text>
                <text class="payment-value transaction-no">{{ payment.transaction_no }}</text>
              </view>
              <view class="payment-row">
                <text class="payment-label">闸机编号</text>
                <text class="payment-value">{{ record.gate_system_id }}</text>
              </view>
            </view>
          </template>
        </up-card>
      </view>

      <!-- 凭证图片 -->
      <view v-if="record.proof_files && record.proof_files.length > 0" class="proof-section">
        <up-card title="支付凭证" :border="false">
          <template #body>
            <view class="proof-content">
              <image
                v-for="(file, index) in record.proof_files"
                :key="index"
                :src="file"
                mode="aspectFill"
                class="proof-image"
              />
            </view>
          </template>
        </up-card>
      </view>

      <!-- 备注 -->
      <view v-if="record.notes" class="notes-section">
        <up-card title="备注" :border="false">
          <template #body>
            <text class="notes-text">{{ record.notes }}</text>
          </template>
        </up-card>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { directusClient } from "@/utils/directus";
import { readItems } from "@directus/sdk";

const recordId = ref("");
const loading = ref(false);
const error = ref<string | null>(null);
const record = ref<any>({});
const payment = ref<any>(null);

// 加载数据
async function loadData() {
  if (!recordId.value) {
    error.value = "缺少记录ID参数";
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    // 1. 获取临停记录
    const records = (await directusClient.request(
      readItems("parking_temp_records", {
        filter: {
          id: { _eq: recordId.value },
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
          "gate_system_id",
          "proof_files",
          "notes",
          "payment_id",
        ],
        limit: 1,
      })
    )) as any;

    if (!records || records.length === 0) {
      error.value = "未找到临停记录";
      return;
    }

    record.value = records[0];

    // 2. 获取支付记录
    if (record.value.payment_id) {
      const payments = (await directusClient.request(
        readItems("payments", {
          filter: {
            id: { _eq: record.value.payment_id },
          },
          fields: ["id", "transaction_no", "paid_at"],
          limit: 1,
        })
      )) as any;

      if (payments && payments.length > 0) {
        payment.value = payments[0];
      }
    }
  } catch (e: any) {
    console.error("[parking-temp-detail] 加载失败:", e);
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

// 格式化完整日期时间
function formatFullDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "未知";
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

// 获取支付方式标签
function getPaymentMethodLabel(method: string | null | undefined): string {
  const methodMap: Record<string, string> = {
    wechat: "微信支付",
    alipay: "支付宝",
    cash: "现金",
  };
  return methodMap[method || ""] || "其他";
}

onLoad((options: any) => {
  recordId.value = options.recordId || "";
  loadData();
});
</script>

<style scoped>
.temp-detail-page {
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

.license-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15rpx;
  padding: 30rpx 20rpx;
  background: white;
  border-radius: 8rpx;
  margin-bottom: 20rpx;
}

.car-icon {
  font-size: 40rpx;
}

.license-number {
  font-size: 42rpx;
  font-weight: bold;
  color: #333;
}

.amount-card {
  padding: 35rpx 25rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
  margin-bottom: 20rpx;
}

.amount-label {
  font-size: 26rpx;
  opacity: 0.9;
  margin-bottom: 10rpx;
}

.amount-value {
  font-size: 56rpx;
  font-weight: bold;
  margin-bottom: 15rpx;
}

.payment-status {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 8rpx 20rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20rpx;
}

.status-icon {
  font-size: 24rpx;
}

.status-text {
  font-size: 24rpx;
}

.info-section,
.fee-section,
.payment-section,
.proof-section,
.notes-section {
  margin-bottom: 20rpx;
}

.info-content,
.fee-content,
.payment-content {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
}

.info-row,
.fee-row,
.payment-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10rpx 0;
}

.info-row {
  border-bottom: 1rpx solid #f0f0f0;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label,
.fee-label,
.payment-label {
  font-size: 28rpx;
  color: #666;
}

.info-value,
.fee-value,
.payment-value {
  font-size: 28rpx;
  color: #333;
  text-align: right;
}

.info-value.highlight {
  color: #1890ff;
  font-weight: 500;
}

.fee-row.total {
  padding-top: 15rpx;
  border-top: 2rpx solid #f0f0f0;
  margin-top: 10rpx;
}

.fee-row.total .fee-label,
.fee-row.total .fee-value {
  font-size: 32rpx;
  font-weight: bold;
  color: #52c41a;
}

.payment-value.transaction-no {
  font-family: monospace;
  font-size: 22rpx;
  color: #999;
}

.proof-content {
  display: flex;
  flex-wrap: wrap;
  gap: 15rpx;
}

.proof-image {
  width: 200rpx;
  height: 200rpx;
  border-radius: 8rpx;
}

.notes-text {
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
}
</style>
