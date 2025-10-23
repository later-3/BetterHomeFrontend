<template>
  <view class="ad-spot-detail-page">
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
      <!-- 广告位信息 -->
      <view class="spot-header">
        <view class="spot-icon">
          <text class="icon-text">{{ spotTypeIcon }}</text>
        </view>
        <view class="spot-info">
          <text class="spot-code">{{ spotCode }}</text>
          <text class="spot-type">{{ spotTypeText }}</text>
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
                <view class="months-header">
                  <text class="months-label">缴费情况：</text>
                  <view class="legend-container">
                    <view class="legend-item">
                      <view class="legend-dot paid"></view>
                      <text class="legend-text">已缴</text>
                    </view>
                    <view class="legend-item">
                      <view class="legend-dot unpaid"></view>
                      <text class="legend-text">未缴</text>
                    </view>
                    <view class="legend-item">
                      <view class="legend-dot out-of-contract"></view>
                      <text class="legend-text">合同期外</text>
                    </view>
                  </view>
                </view>
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

// 页面参数
const spotId = ref("");
const startPeriod = ref("");
const endPeriod = ref("");

// 数据状态
const loading = ref(false);
const error = ref<string | null>(null);
const spotCode = ref("");
const spotType = ref("");
const spotLocation = ref("");
const monthlyRent = ref(0);
const contractInfo = ref("");

// 合同信息
const contractStartMonth = ref<number | null>(null);
const contractEndMonth = ref<number | null>(null);

// 缴费数据
const allMonths = ref<number[]>([]);
const paidMonths = ref<number[]>([]);
const receivables = ref<any[]>([]);
const payments = ref<any[]>([]);

// 计算属性
const spotTypeIcon = computed(() => {
  return spotType.value === "elevator" ? "🏢" : "🚪";
});

const spotTypeText = computed(() => {
  return spotType.value === "elevator" ? "电梯广告" : "闸机广告";
});

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
    error.value = "缺少广告位ID参数";
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    // 1. 获取广告位信息
    const spots = (await directusClient.request(
      readItems("ad_spots", {
        filter: {
          id: { _eq: spotId.value },
        },
        fields: [
          "id",
          "spot_code",
          "spot_type",
          "location",
          "current_contract_id",
        ],
        limit: 1,
      })
    )) as any;

    if (!spots || spots.length === 0) {
      error.value = "未找到广告位信息";
      return;
    }

    const spot = spots[0];
    spotCode.value = spot.spot_code;
    spotType.value = spot.spot_type;
    spotLocation.value = spot.location;

    // 2. 获取当前合同信息
    if (spot.current_contract_id) {
      const contracts = (await directusClient.request(
        readItems("ad_contracts", {
          filter: {
            id: { _eq: spot.current_contract_id },
          },
          fields: [
            "id",
            "contract_no",
            "advertiser_name",
            "advertiser_company",
            "monthly_rent",
            "contract_start",
            "contract_end",
          ],
          limit: 1,
        })
      )) as any;

      if (contracts && contracts.length > 0) {
        const contract = contracts[0];
        monthlyRent.value = Number(contract.monthly_rent || 0);

        const advertiser = contract.advertiser_company || contract.advertiser_name;
        const startDate = contract.contract_start ? contract.contract_start.split("T")[0] : "";
        const endDate = contract.contract_end ? contract.contract_end.split("T")[0] : "";
        contractInfo.value = `广告主：${advertiser} | 合同期：${startDate} 至 ${endDate}`;

        // 提取合同起止月份
        if (contract.contract_start) {
          const startDateObj = new Date(contract.contract_start);
          contractStartMonth.value = startDateObj.getMonth() + 1; // 1-12
        }
        if (contract.contract_end) {
          const endDateObj = new Date(contract.contract_end);
          contractEndMonth.value = endDateObj.getMonth() + 1; // 1-12
        }
      }
    }

    // 3. 获取广告详情记录
    const adDetails = (await directusClient.request(
      readItems("ad_details", {
        filter: {
          spot_id: { _eq: spotId.value },
        },
        fields: ["id"],
        limit: 1,
      })
    )) as any;

    if (!adDetails || adDetails.length === 0) {
      receivables.value = [];
      payments.value = [];
      allMonths.value = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      paidMonths.value = [];
      console.warn("[ad-spot-detail] 未找到广告详情记录");
      return;
    }

    const detailId = adDetails[0].id;

    // 4. 生成月份范围
    const months = generateMonthRange(startPeriod.value, endPeriod.value);

    // 提取月份数字（1-12）
    const monthNumbers = months.map(m => {
      const [year, month] = m.split("-").map(Number);
      return month;
    });
    allMonths.value = [...new Set(monthNumbers)].sort((a, b) => a - b);

    // 5. 获取应收账单
    receivables.value = (await directusClient.request(
      readItems("receivables", {
        filter: {
          type_code: { _eq: "ad_revenue" },
          type_detail_id: { _eq: detailId },
          period: { _in: months },
        },
        fields: ["id", "amount", "period", "status", "payment_id"],
        limit: -1,
        sort: ["period"],
      })
    )) as any;

    // 6. 提取已缴费的月份
    const paidPeriods = receivables.value
      .filter((r: any) => r.status === "paid")
      .map((r: any) => {
        const [year, month] = r.period.split("-").map(Number);
        return month;
      });
    paidMonths.value = [...new Set(paidPeriods)];

    // 7. 获取缴费记录
    const paymentIds = receivables.value
      .filter((r: any) => r.payment_id)
      .map((r: any) => r.payment_id);

    if (paymentIds.length > 0) {
      const uniquePaymentIds = [...new Set(paymentIds)];

      const paymentsData = (await directusClient.request(
        readItems("payments", {
          filter: {
            id: { _in: uniquePaymentIds },
          },
          fields: [
            "id",
            "amount",
            "payment_method",
            "paid_at",
            "transaction_no",
          ],
          limit: -1,
          sort: ["-paid_at"],
        })
      )) as any;

      // 为每个payment添加缴费月份信息
      payments.value = paymentsData.map((p: any) => {
        const relatedReceivables = receivables.value.filter(
          (r: any) => r.payment_id === p.id
        );
        const periods = relatedReceivables.map((r: any) => {
          const [year, month] = r.period.split("-").map(Number);
          return month;
        });
        return {
          ...p,
          paid_periods: [...new Set(periods)].sort((a, b) => a - b),
        };
      });
    }

    console.log("[ad-spot-detail] 数据加载完成", {
      spotCode: spotCode.value,
      monthlyRent: monthlyRent.value,
      totalAmount: totalAmount.value,
      paidAmount: paidAmount.value,
      unpaidAmount: unpaidAmount.value,
      receivablesCount: receivables.value.length,
      paymentsCount: payments.value.length,
    });
  } catch (err: any) {
    console.error("[ad-spot-detail] 加载数据失败", err);
    error.value = err.message || "加载数据失败，请稍后重试";
    uni.showToast({
      title: "加载失败",
      icon: "none",
    });
  } finally {
    loading.value = false;
  }
}

// 生成月份范围
function generateMonthRange(start: string, end: string): string[] {
  if (!start || !end) return [];

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

// 获取月份状态
function getMonthStatus(month: number): string {
  // 判断是否在合同期内
  const isInContract = isMonthInContract(month);

  if (!isInContract) {
    return "month-out-of-contract"; // 合同期外 - 灰色
  }

  // 合同期内，判断是否已缴费
  return paidMonths.value.includes(month) ? "month-paid" : "month-unpaid";
}

// 判断月份是否在合同期内
function isMonthInContract(month: number): boolean {
  if (contractStartMonth.value === null || contractEndMonth.value === null) {
    return true; // 如果没有合同信息，默认都算在合同期内
  }

  const start = contractStartMonth.value;
  const end = contractEndMonth.value;

  // 处理跨年的情况
  if (start <= end) {
    // 不跨年：如 2月-8月
    return month >= start && month <= end;
  } else {
    // 跨年：如 11月-2月
    return month >= start || month <= end;
  }
}

// 格式化缴费月份
function formatPaidPeriods(periods: number[]): string {
  if (!periods || periods.length === 0) return "-";
  const sortedPeriods = [...new Set(periods)].sort((a, b) => a - b);
  return sortedPeriods.map((m) => `${m}月`).join("、");
}

// 格式化时间
function formatDateTime(dateString: string): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

// 获取支付方式标签
function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    wechat: "微信",
    alipay: "支付宝",
    bank_transfer: "银行转账",
    cash: "现金",
  };
  return labels[method] || method || "未知";
}

// 跳转到缴费详情
function goToPaymentDetail(paymentId: string) {
  uni.navigateTo({
    url: `/pages/finance/payment-detail?id=${paymentId}`,
  });
}

// 页面加载
onLoad((options: any) => {
  if (options.id) {
    spotId.value = options.id;
  }
  if (options.startPeriod) {
    startPeriod.value = options.startPeriod;
  }
  if (options.endPeriod) {
    endPeriod.value = options.endPeriod;
  }

  loadData();
});
</script>

<style scoped lang="scss">
.ad-spot-detail-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 40rpx;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx 0;

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
  padding: 200rpx 40rpx;

  .error-text {
    font-size: 28rpx;
    color: #666;
    text-align: center;
    margin-bottom: 40rpx;
  }
}

.content {
  padding: 30rpx;
}

.spot-header {
  display: flex;
  gap: 30rpx;
  padding: 40rpx;
  background: white;
  border-radius: 24rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);

  .spot-icon {
    .icon-text {
      font-size: 80rpx;
    }
  }

  .spot-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12rpx;

    .spot-code {
      font-size: 36rpx;
      font-weight: bold;
      color: #333;
    }

    .spot-type {
      font-size: 26rpx;
      color: #1976d2;
      font-weight: 500;
    }

    .spot-location {
      font-size: 28rpx;
      color: #666;
    }

    .spot-contract {
      font-size: 24rpx;
      color: #999;
      margin-top: 8rpx;
      padding-top: 12rpx;
      border-top: 1rpx solid #f0f0f0;
    }
  }
}

.progress-section {
  margin-bottom: 30rpx;

  .progress-content {
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24rpx;
      margin-bottom: 30rpx;

      .stat-item {
        display: flex;
        flex-direction: column;
        gap: 8rpx;

        .stat-label {
          font-size: 24rpx;
          color: #999;
        }

        .stat-value {
          font-size: 32rpx;
          font-weight: bold;
          color: #333;

          &.paid {
            color: #4caf50;
          }

          &.unpaid {
            color: #f44336;
          }
        }
      }
    }

    .months-container {
      padding-top: 24rpx;
      border-top: 1rpx solid #f0f0f0;

      .months-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16rpx;

        .months-label {
          font-size: 26rpx;
          color: #666;
        }

        .legend-container {
          display: flex;
          gap: 16rpx;

          .legend-item {
            display: flex;
            align-items: center;
            gap: 6rpx;

            .legend-dot {
              width: 12rpx;
              height: 12rpx;
              border-radius: 50%;

              &.paid {
                background: #4caf50;
              }

              &.unpaid {
                background: #f44336;
              }

              &.out-of-contract {
                background: #bdbdbd;
              }
            }

            .legend-text {
              font-size: 22rpx;
              color: #999;
            }
          }
        }
      }

      .months-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 12rpx;

        .month-tag {
          padding: 8rpx 20rpx;
          border-radius: 20rpx;
          font-size: 24rpx;
          font-weight: 500;

          &.month-paid {
            background: #e8f5e9;
            color: #4caf50;
          }

          &.month-unpaid {
            background: #ffebee;
            color: #f44336;
          }

          &.month-out-of-contract {
            background: #f5f5f5;
            color: #bdbdbd;
          }
        }
      }
    }
  }
}

.payments-section {
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 8rpx 20rpx;

    .section-title {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
    }

    .section-count {
      font-size: 26rpx;
      color: #999;
    }
  }

  .payments-list {
    display: flex;
    flex-direction: column;
    gap: 20rpx;

    .payment-card {
      cursor: pointer;
      transition: transform 0.2s;

      &:active {
        transform: scale(0.98);
      }

      .payment-content {
        .payment-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24rpx;

          .payment-amount {
            font-size: 40rpx;
            font-weight: bold;
            color: #4caf50;
          }

          .payment-method-badge {
            padding: 8rpx 20rpx;
            background: #e3f2fd;
            border-radius: 20rpx;

            .payment-method-text {
              font-size: 24rpx;
              color: #1976d2;
              font-weight: 500;
            }
          }
        }

        .payment-details {
          display: flex;
          flex-direction: column;
          gap: 16rpx;
          margin-bottom: 20rpx;

          .payment-row {
            display: flex;
            justify-content: space-between;
            align-items: center;

            .payment-label {
              font-size: 26rpx;
              color: #999;
            }

            .payment-value {
              font-size: 26rpx;
              color: #333;

              &.transaction-no {
                font-family: monospace;
                color: #666;
                font-size: 22rpx;
              }
            }
          }
        }

        .payment-footer {
          padding-top: 16rpx;
          border-top: 1rpx solid #f0f0f0;
          text-align: right;

          .view-detail-text {
            font-size: 24rpx;
            color: #1976d2;
          }
        }
      }
    }
  }

  .empty-state {
    padding: 80rpx 40rpx;
    text-align: center;

    .empty-text {
      font-size: 28rpx;
      color: #999;
    }
  }
}
</style>
