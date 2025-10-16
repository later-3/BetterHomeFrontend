<template>
  <view class="detail-page">
    <!-- 页面标题 -->
    <view class="page-header">
      <text class="page-title">{{ categoryLabel }}</text>
      <text class="page-subtitle">{{ periodText }}</text>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading" class="loading">加载中...</view>

    <!-- 错误状态 -->
    <view v-if="error" class="error">
      <text>{{ error }}</text>
      <button @click="loadData" size="mini">重试</button>
    </view>

    <!-- 数据展示 -->
    <view v-if="!loading && !error">
      <!-- 汇总卡片 -->
      <view class="summary-card">
        <text class="summary-label">本期合计</text>
        <text class="summary-amount">{{ formatAmount(totalAmount) }}</text>
        <text class="summary-count">共 {{ recordCount }} 笔记录</text>
      </view>

      <!-- 记录列表 -->
      <view class="records-section">
        <text class="section-title">明细记录</text>
        <view class="records-list">
          <view
            v-for="record in records"
            :key="record.id"
            class="record-item"
            @click="goToRecordDetail(record.id)"
          >
            <view class="record-info">
              <text class="record-title">{{ getRecordTitle(record) }}</text>
              <text class="record-time">{{ formatDateTime(record.date) }}</text>
            </view>
            <text class="record-amount">{{ formatAmount(record.amount) }}</text>
          </view>
          <view v-if="records.length === 0" class="empty">暂无记录</view>
        </view>
      </view>

      <!-- 业主个人记录（仅物业费显示） -->
      <view v-if="showMyRecords" class="my-records-section">
        <text class="section-title">我的缴费记录</text>
        <view class="records-list">
          <view
            v-for="billing in myBillings"
            :key="billing.id"
            class="billing-item"
          >
            <view class="billing-info">
              <text class="billing-period">{{ billing.period }}</text>
              <text class="billing-status" :class="getStatusClass(billing.status)">
                {{ getStatusText(billing.status) }}
              </text>
            </view>
            <view class="billing-amounts">
              <text class="billing-due">应缴: {{ formatAmount(billing.billing_amount) }}</text>
              <text class="billing-paid">已缴: {{ formatAmount(billing.paid_amount || 0) }}</text>
            </view>
          </view>
          <view v-if="myBillings.length === 0" class="empty">暂无个人记录</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useFinanceStore } from "@/store/finance";
import { useUserStore } from "@/store/user";
import {
  getIncomeTypeLabel,
  getExpenseTypeLabel,
  formatAmount,
  formatDateTime,
} from "@/utils/finance-labels";
import type { Income, Expense, BillingPayment } from "@/@types/directus-schema";

const financeStore = useFinanceStore();
const userStore = useUserStore();

// URL 参数
const query = ref({
  type: "" as "income" | "expense",
  category: "",
  start: "",
  end: "",
});

// 状态
const loading = ref(false);
const error = ref<string | null>(null);

// 分类标签
const categoryLabel = computed(() => {
  if (query.value.type === "income") {
    return getIncomeTypeLabel(query.value.category);
  } else {
    return getExpenseTypeLabel(query.value.category);
  }
});

// 时间范围文本
const periodText = computed(() => {
  if (query.value.start === query.value.end) {
    return query.value.start.replace("-", "年") + "月";
  } else {
    return `${query.value.start} 至 ${query.value.end}`;
  }
});

// 记录列表（根据类型过滤）
const records = computed<Array<{ id: string; amount: number; date: string; [key: string]: any }>>(() => {
  if (query.value.type === "income") {
    // 如果是物业费，显示实收记录（billing_payments）
    if (query.value.category === "property_fee") {
      return financeStore.billingPayments.map((payment) => ({
        id: payment.id || "",
        amount: payment.amount,
        date: payment.paid_at,
        owner: payment.owner_id,
        method: payment.payment_method,
      }));
    }
    // 其他收入
    return financeStore.incomes
      .filter((item) => item.income_type === query.value.category)
      .map((income) => ({
        id: income.id || "",
        amount: income.amount,
        date: income.income_date,
        title: income.title,
      }));
  } else {
    // 支出
    return financeStore.expenses
      .filter((item) => item.expense_type === query.value.category)
      .map((expense) => ({
        id: expense.id || "",
        amount: expense.amount,
        date: expense.paid_at,
        title: expense.title,
      }));
  }
});

// 总金额
const totalAmount = computed(() => {
  return records.value.reduce((sum, record) => sum + record.amount, 0);
});

// 记录数量
const recordCount = computed(() => records.value.length);

// 是否显示"我的记录"（仅物业费且是业主）
const showMyRecords = computed(() => {
  return (
    query.value.type === "income" &&
    query.value.category === "property_fee" &&
    userStore.profile?.user_type === "resident"
  );
});

// 我的账单
const myBillings = computed(() => financeStore.myBillings);

// 获取记录标题
function getRecordTitle(record: any): string {
  if (record.title) return record.title;
  if (record.owner) {
    const owner = typeof record.owner === "string" ? record.owner : record.owner;
    return `业主缴费`;
  }
  return "记录";
}

// 获取账单状态文本
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

// 加载数据
async function loadData() {
  loading.value = true;
  error.value = null;

  try {
    if (query.value.type === "income") {
      if (query.value.category === "property_fee") {
        // 加载物业费实收记录
        await financeStore.fetchMyBillings(true);
      }
      // 加载收入记录
      await financeStore.fetchCommunityIncomes(true);
    } else {
      // 加载支出记录
      await financeStore.fetchCommunityExpenses(true);
    }
  } catch (e: any) {
    error.value = e.message || "加载失败";
  } finally {
    loading.value = false;
  }
}

// 跳转到记录详情
function goToRecordDetail(id: string) {
  uni.navigateTo({
    url: `/pages/finance/record?id=${id}&type=${query.value.type}`,
  });
}

onMounted(() => {
  // 获取 URL 参数
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1] as any;
  const options = currentPage.options || {};

  query.value = {
    type: options.type || "income",
    category: options.category || "",
    start: options.start || "",
    end: options.end || "",
  };

  loadData();
});
</script>

<style scoped>
.detail-page {
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

.loading,
.error {
  padding: 40rpx;
  text-align: center;
  background: white;
  border-radius: 8rpx;
}

.summary-card {
  padding: 40rpx 20rpx;
  background: white;
  border-radius: 8rpx;
  margin-bottom: 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.summary-label {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 10rpx;
}

.summary-amount {
  font-size: 48rpx;
  font-weight: bold;
  color: #1890ff;
  margin-bottom: 10rpx;
}

.summary-count {
  font-size: 24rpx;
  color: #999;
}

.records-section,
.my-records-section {
  background: white;
  border-radius: 8rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  display: block;
  margin-bottom: 20rpx;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  background: #f5f5f5;
  border-radius: 8rpx;
}

.record-info {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.record-title {
  font-size: 28rpx;
  font-weight: 500;
}

.record-time {
  font-size: 24rpx;
  color: #999;
}

.record-amount {
  font-size: 32rpx;
  font-weight: bold;
}

.billing-item {
  display: flex;
  justify-content: space-between;
  padding: 20rpx;
  background: #f5f5f5;
  border-radius: 8rpx;
}

.billing-info {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.billing-period {
  font-size: 28rpx;
  font-weight: 500;
}

.billing-status {
  font-size: 24rpx;
  padding: 4rpx 12rpx;
  border-radius: 4rpx;
  align-self: flex-start;
}

.status-paid {
  background: #52c41a;
  color: white;
}

.status-unpaid {
  background: #ff4d4f;
  color: white;
}

.status-partial {
  background: #faad14;
  color: white;
}

.status-overdue {
  background: #f5222d;
  color: white;
}

.billing-amounts {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  align-items: flex-end;
}

.billing-due,
.billing-paid {
  font-size: 24rpx;
}

.empty {
  padding: 40rpx;
  text-align: center;
  color: #999;
}
</style>
