<template>
  <view class="rent-spot-detail-page">
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
          <text class="spot-renter">租户：{{ renterName }}</text>
          <text class="spot-location">位置：{{ spotLocation }}</text>
          <text v-if="contractInfo" class="spot-contract">{{ contractInfo }}</text>
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
                  <text class="stat-label">月租金</text>
                  <text class="stat-value">{{ formatAmount(monthlyRent) }}</text>
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
import { formatAmount } from "@/utils/finance-labels";
import env from "@/config/env";

// 页面参数
const spotId = ref("");

// 数据状态
const loading = ref(false);
const error = ref<string | null>(null);
const spotNumber = ref("");
const renterName = ref("");
const spotLocation = ref("");
const monthlyRent = ref(0);
const contractInfo = ref("");

// 缴费数据
const allMonths = ref<number[]>([]);
const paidMonths = ref<number[]>([]);
const receivables = ref<any[]>([]);
const payments = ref<any[]>([]);

// 计算属性
const totalAmount = computed(() => {
  return receivables.value.reduce((sum, r) => sum + Number(r.amount || 0), 0);
});

const paidAmount = computed(() => {
  return receivables.value
    .filter((r) => r.status === "paid")
    .reduce((sum, r) => sum + Number(r.amount || 0), 0);
});

const unpaidAmount = computed(() => {
  return totalAmount.value - paidAmount.value;
});

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
    const spots = (await directusClient.request(
      readItems("parking_spots", {
        filter: {
          id: { _eq: spotId.value },
        },
        fields: [
          "id",
          "spot_number",
          "location",
          "renter_id",
          "monthly_rent",
          "rent_contract_start",
          "rent_contract_end",
        ],
        limit: 1,
      })
    )) as any;

    if (!spots || spots.length === 0) {
      error.value = "未找到车位信息";
      return;
    }

    const spot = spots[0];
    spotNumber.value = spot.spot_number;
    spotLocation.value = spot.location || "未知";
    monthlyRent.value = Number(spot.monthly_rent || 500);

    // 合同信息
    if (spot.rent_contract_start && spot.rent_contract_end) {
      contractInfo.value = `合同期：${spot.rent_contract_start} 至 ${spot.rent_contract_end}`;
    }

    // 2. 获取租户信息（使用REST API，因为directus_users是核心集合）
    if (spot.renter_id) {
      try {
        const token = uni.getStorageSync("directus_token");
        const response = await fetch(`${env.directusUrl}/users/${spot.renter_id}?fields=id,first_name,last_name`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const user = await response.json();
          renterName.value = user.data?.first_name || user.data?.last_name || "未知租户";
        } else {
          renterName.value = "未知租户";
        }
      } catch (e) {
        console.warn("[parking-rent-spot-detail] 获取租户信息失败", e);
        renterName.value = "未知租户";
      }
    }

    // 3. 获取parking_details
    const details = (await directusClient.request(
      readItems("parking_details", {
        filter: {
          parking_spot_id: { _eq: spotId.value },
          fee_type: { _eq: "rent" },
        },
        fields: ["id"],
        limit: 1,
      })
    )) as any;

    if (!details || details.length === 0) {
      // 没有详情记录，可能是新车位
      allMonths.value = [];
      paidMonths.value = [];
      receivables.value = [];
      payments.value = [];
      return;
    }

    const detailId = details[0].id;

    // 4. 获取应收账单
    const recvList = (await directusClient.request(
      readItems("receivables", {
        filter: {
          type_detail_id: { _eq: detailId },
          type_code: { _eq: "parking_rent" },
        },
        fields: ["id", "period", "amount", "status", "payment_id"],
        sort: ["period"],
        limit: -1,
      })
    )) as any;

    receivables.value = recvList || [];

    // 提取所有月份和已缴月份
    allMonths.value = recvList.map((r: any) => parseInt(r.period.split("-")[1]));
    paidMonths.value = recvList.filter((r: any) => r.status === "paid").map((r: any) => parseInt(r.period.split("-")[1]));

    // 5. 获取缴费记录
    const paymentIds = [...new Set(recvList.filter((r: any) => r.payment_id).map((r: any) => r.payment_id))];

    if (paymentIds.length > 0) {
      const paymentList = (await directusClient.request(
        readItems("payments", {
          filter: {
            id: { _in: paymentIds },
          },
          fields: ["id", "amount", "paid_at", "payment_method", "transaction_no", "paid_periods"],
          sort: ["-paid_at"],
          limit: -1,
        })
      )) as any;

      payments.value = paymentList || [];
    } else {
      payments.value = [];
    }

    console.log(`[parking-rent-spot-detail] 加载完成：${receivables.value.length} 条应收，${payments.value.length} 条缴费`);
  } catch (e: any) {
    console.error("[parking-rent-spot-detail] 加载失败:", e);
    error.value = e.message || "加载失败";
  } finally {
    loading.value = false;
  }
}

// 获取月份状态
function getMonthStatus(month: number): string {
  if (paidMonths.value.includes(month)) {
    return "paid";
  }
  return "unpaid";
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
  // 去重
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
  };
  return methodMap[method || ""] || "其他";
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
.rent-spot-detail-page {
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

/* 车位信息 */
.spot-header {
  display: flex;
  gap: 20rpx;
  padding: 30rpx 25rpx;
  background: white;
  border-radius: 8rpx;
  margin-bottom: 20rpx;
}

.spot-icon {
  width: 80rpx;
  height: 80rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-text {
  font-size: 40rpx;
}

.spot-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.spot-number {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.spot-renter,
.spot-location,
.spot-contract {
  font-size: 26rpx;
  color: #999;
}

/* 缴费进度 */
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
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx;
  background: #f5f5f5;
  border-radius: 8rpx;
}

.stat-label {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 8rpx;
}

.stat-value {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.stat-value.paid {
  color: #52c41a;
}

.stat-value.unpaid {
  color: #ff4d4f;
}

/* 缴费月份标签 */
.months-container {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
}

.months-label {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.months-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.month-tag {
  padding: 8rpx 16rpx;
  border-radius: 6rpx;
  font-size: 24rpx;
}

.month-tag.paid {
  background: #f6ffed;
  color: #52c41a;
  border: 1rpx solid #b7eb8f;
}

.month-tag.unpaid {
  background: #fff2e8;
  color: #fa8c16;
  border: 1rpx solid #ffd591;
}

/* 缴费记录 */
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
  color: #333;
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
  padding-bottom: 15rpx;
  border-bottom: 1rpx solid #f0f0f0;
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
  gap: 12rpx;
}

.payment-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.payment-label {
  font-size: 26rpx;
  color: #999;
}

.payment-value {
  font-size: 26rpx;
  color: #333;
  text-align: right;
}

.payment-value.transaction-no {
  font-family: monospace;
  font-size: 22rpx;
  color: #999;
}

.payment-footer {
  padding-top: 10rpx;
  border-top: 1rpx solid #f0f0f0;
  text-align: right;
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
