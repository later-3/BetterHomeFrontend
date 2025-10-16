<template>
  <view class="finance-page">
    <!-- 导航栏 -->
    <up-navbar
      title="财务透明"
      :border="false"
      :safe-area-inset-top="true"
      bg-color="#ffffff"
    />

    <!-- 加载状态 -->
    <u-loading-page v-if="loading" :loading="true" loading-text="加载中..." />

    <!-- 错误状态 -->
    <view v-else-if="error" class="error-container">
      <up-empty mode="error" :text="error" text-size="14" />
      <up-button
        type="primary"
        size="small"
        text="重试"
        @click="handleRetry"
        style="margin-top: 20rpx"
      />
    </view>

    <!-- 主内容 -->
    <view v-else class="content-scroll">
      <!-- 时间选择器 -->
      <view class="time-selector">
        <view class="time-display">
          <up-icon name="calendar" size="18" color="#666" />
          <up-text :text="currentPeriodText" size="15" color="#333" margin="0 0 0 8rpx" />
        </view>
        <up-button
          type="primary"
          size="mini"
          text="切换月份"
          @click="showTimePicker = true"
        />
      </view>

      <!-- 收支卡片 -->
      <view class="summary-section">
        <up-card
          :border="false"
          :head-border-bottom="false"
          padding="24rpx"
          margin="0"
          box-shadow="0 2rpx 12rpx rgba(0,0,0,0.06)"
        >
          <view class="summary-cards">
            <!-- 总收入 -->
            <view class="stat-card income-card">
              <view class="stat-icon">
                <up-icon name="arrow-up-circle" size="20" color="#52c41a" />
              </view>
              <view class="stat-content">
                <up-text text="总收入" size="12" color="#999" />
                <up-text
                  :text="formatAmount(summary.totalIncome)"
                  size="18"
                  color="#52c41a"
                  bold
                  margin="4rpx 0 0 0"
                />
              </view>
            </view>

            <!-- 总支出 -->
            <view class="stat-card expense-card">
              <view class="stat-icon">
                <up-icon name="arrow-down-circle" size="20" color="#ff4d4f" />
              </view>
              <view class="stat-content">
                <up-text text="总支出" size="12" color="#999" />
                <up-text
                  :text="formatAmount(summary.totalExpense)"
                  size="18"
                  color="#ff4d4f"
                  bold
                  margin="4rpx 0 0 0"
                />
              </view>
            </view>

            <!-- 结余 -->
            <view class="stat-card balance-card">
              <view class="stat-icon">
                <up-icon name="account-fill" size="20" color="#1890ff" />
              </view>
              <view class="stat-content">
                <up-text text="结余" size="12" color="#999" />
                <up-text
                  :text="formatAmount(summary.balance)"
                  size="18"
                  :color="summary.balance >= 0 ? '#1890ff' : '#ff4d4f'"
                  bold
                  margin="4rpx 0 0 0"
                />
              </view>
            </view>
          </view>
        </up-card>
      </view>

      <!-- 快捷入口（仅业主可见） -->
      <view
        v-if="userStore.profile?.user_type === 'resident'"
        class="quick-access-section"
      >
        <up-card
          :border="false"
          :head-border-bottom="false"
          padding="0"
          margin="0 0 24rpx 0"
          box-shadow="0 2rpx 12rpx rgba(0,0,0,0.06)"
        >
          <view class="quick-access-item" @click="goToMyBillings">
            <view class="access-left">
              <view class="access-icon-wrapper">
                <up-icon name="file-text" size="20" color="#1890ff" />
              </view>
              <view class="access-info">
                <up-text text="我的物业费" size="15" bold />
                <up-text
                  text="查看缴费记录和账单状态"
                  size="12"
                  color="#999"
                  margin="4rpx 0 0 0"
                />
              </view>
            </view>
            <up-icon name="arrow-right" size="16" color="#ccc" />
          </view>
        </up-card>
      </view>

      <!-- 收入组成 -->
      <view class="category-section">
        <view class="section-header">
          <up-text text="收入组成" size="16" bold />
        </view>
        <up-card
          :border="false"
          :head-border-bottom="false"
          padding="24rpx"
          margin="0"
          box-shadow="0 2rpx 12rpx rgba(0,0,0,0.06)"
        >
          <view v-if="incomeCategories.length > 0" class="category-list">
            <view
              v-for="item in incomeCategories"
              :key="item.type"
              class="category-item"
              @click="goToDetail('income', item.type)"
            >
              <view class="category-info">
                <view class="category-row">
                  <up-text :text="item.label" size="14" bold />
                  <up-tag
                    :text="formatPercentage(item.percentage)"
                    type="info"
                    plain
                    size="mini"
                  />
                </view>
                <up-text
                  :text="formatAmount(item.amount)"
                  size="16"
                  color="#52c41a"
                  bold
                  margin="8rpx 0 0 0"
                />
              </view>
              <up-icon name="arrow-right" size="16" color="#ccc" />
            </view>
          </view>
          <up-empty
            v-else
            mode="data"
            text="暂无收入记录"
            text-size="14"
            icon-size="80"
          />
        </up-card>
      </view>

      <!-- 支出组成 -->
      <view class="category-section">
        <view class="section-header">
          <up-text text="支出组成" size="16" bold />
        </view>
        <up-card
          :border="false"
          :head-border-bottom="false"
          padding="24rpx"
          margin="0"
          box-shadow="0 2rpx 12rpx rgba(0,0,0,0.06)"
        >
          <view v-if="expenseCategories.length > 0" class="category-list">
            <view
              v-for="item in expenseCategories"
              :key="item.type"
              class="category-item"
              @click="goToDetail('expense', item.type)"
            >
              <view class="category-info">
                <view class="category-row">
                  <up-text :text="item.label" size="14" bold />
                  <up-tag
                    :text="formatPercentage(item.percentage)"
                    type="error"
                    plain
                    size="mini"
                  />
                </view>
                <up-text
                  :text="formatAmount(item.amount)"
                  size="16"
                  color="#ff4d4f"
                  bold
                  margin="8rpx 0 0 0"
                />
              </view>
              <up-icon name="arrow-right" size="16" color="#ccc" />
            </view>
          </view>
          <up-empty
            v-else
            mode="data"
            text="暂无支出记录"
            text-size="14"
            icon-size="80"
          />
        </up-card>
      </view>

      <!-- 底部占位 -->
      <view class="bottom-spacer" />
    </view>

    <!-- 时间选择器弹窗 -->
    <up-popup v-model:show="showTimePicker" mode="center" :round="16">
      <view class="time-picker-popup">
        <view class="picker-header">
          <up-text text="选择月份" size="16" bold />
        </view>
        <view class="picker-body">
          <picker mode="date" fields="month" :value="selectedMonth" @change="onMonthChange">
            <up-button type="primary" text="选择月份" :custom-style="{ width: '100%' }" />
          </picker>
          <up-button
            type="info"
            text="年初至今"
            :custom-style="{ width: '100%', marginTop: '20rpx' }"
            @click="selectYearToDate"
          />
          <up-button
            type="default"
            text="取消"
            :custom-style="{ width: '100%', marginTop: '20rpx' }"
            @click="showTimePicker = false"
          />
        </view>
      </view>
    </up-popup>
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
  formatPercentage,
} from "@/utils/finance-labels";

const financeStore = useFinanceStore();
const userStore = useUserStore();

// 状态
const loading = ref(false);
const error = ref<string | null>(null);
const showTimePicker = ref(false);
const selectedMonth = ref("");
const isYearToDate = ref(true); // 是否为"年初至今"模式

// 当前时间范围
const startMonth = ref("");
const endMonth = ref("");

// 当前时间范围文本
const currentPeriodText = computed(() => {
  if (isYearToDate.value) {
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;
    return `${year}年度（1月-${month}月）`;
  } else {
    return selectedMonth.value.replace("-", "年") + "月";
  }
});

// 汇总数据
const summary = computed(() => ({
  totalIncome: financeStore.totalIncome,
  totalExpense: financeStore.totalExpense,
  balance: financeStore.balance,
}));

// 收入分类
const incomeCategories = computed(() => {
  const total = financeStore.totalIncome;
  return financeStore.incomesByType
    .map((item) => ({
      type: item.type,
      label: getIncomeTypeLabel(item.type),
      amount: item.total,
      percentage: total > 0 ? (item.total / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
});

// 支出分类
const expenseCategories = computed(() => {
  const total = financeStore.totalExpense;
  return financeStore.expensesByType
    .map((item) => ({
      type: item.type,
      label: getExpenseTypeLabel(item.type),
      amount: item.total,
      percentage: total > 0 ? (item.total / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
});

// 初始化时间范围
function initTimeRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  startMonth.value = `${year}-01`;
  endMonth.value = `${year}-${String(month).padStart(2, "0")}`;
  selectedMonth.value = endMonth.value;
}

// 加载数据
async function loadData() {
  loading.value = true;
  error.value = null;

  try {
    // 根据时间范围加载数据
    if (isYearToDate.value) {
      // 年初至今：加载所有月份
      await Promise.all([
        financeStore.fetchCommunityIncomes(true),
        financeStore.fetchCommunityExpenses(true),
      ]);
    } else {
      // 单月：TODO - 需要在 Store 中添加按月筛选的方法
      // 暂时先加载全部，前端过滤
      await Promise.all([
        financeStore.fetchCommunityIncomes(true),
        financeStore.fetchCommunityExpenses(true),
      ]);
    }
  } catch (e: any) {
    error.value = e.message || "加载失败";
  } finally {
    loading.value = false;
  }
}

// 重试
function handleRetry() {
  loadData();
}

// 月份改变
function onMonthChange(e: any) {
  selectedMonth.value = e.detail.value;
  isYearToDate.value = false;
  showTimePicker.value = false;
  loadData();
}

// 选择年初至今
function selectYearToDate() {
  isYearToDate.value = true;
  showTimePicker.value = false;
  initTimeRange();
  loadData();
}

// 跳转到分类明细页
function goToDetail(type: "income" | "expense", category: string) {
  const params = {
    type,
    category,
    start: startMonth.value,
    end: endMonth.value,
  };
  uni.navigateTo({
    url: `/pages/finance/detail?${new URLSearchParams(params as any).toString()}`,
  });
}

// 跳转到我的账单页面
function goToMyBillings() {
  uni.navigateTo({
    url: "/pages/finance/my-billings",
  });
}

onMounted(() => {
  initTimeRange();
  loadData();
});
</script>

<style scoped>
.finance-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx 40rpx;
}

.content-scroll {
  flex: 1;
  padding: 20rpx;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* 时间选择器 */
.time-selector {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  background: white;
  margin-bottom: 24rpx;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}

.time-display {
  display: flex;
  align-items: center;
}

/* 汇总卡片 */
.summary-section {
  margin-bottom: 24rpx;
}

.summary-cards {
  display: flex;
  gap: 20rpx;
}

.stat-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24rpx 16rpx;
  background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
  border-radius: 12rpx;
  gap: 12rpx;
}

.stat-icon {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
}

.income-card .stat-icon {
  background: rgba(82, 196, 26, 0.1);
}

.expense-card .stat-icon {
  background: rgba(255, 77, 79, 0.1);
}

.balance-card .stat-icon {
  background: rgba(24, 144, 255, 0.1);
}

.stat-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}

/* 快捷入口 */
.quick-access-section {
  margin-bottom: 24rpx;
}

.quick-access-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
}

.access-left {
  display: flex;
  align-items: center;
  gap: 20rpx;
  flex: 1;
}

.access-icon-wrapper {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12rpx;
  background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%);
}

.access-info {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

/* 分类区块 */
.category-section {
  margin-bottom: 24rpx;
}

.section-header {
  margin-bottom: 16rpx;
  padding: 0 8rpx;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  background: linear-gradient(135deg, #fafafa 0%, #ffffff 100%);
  border-radius: 12rpx;
  border: 1px solid #f0f0f0;
  transition: all 0.3s;
}

.category-item:active {
  background: #f5f5f5;
  transform: scale(0.98);
}

.category-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.category-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16rpx;
}

/* 时间选择器弹窗 */
.time-picker-popup {
  width: 560rpx;
  background: white;
  border-radius: 16rpx;
  overflow: hidden;
}

.picker-header {
  padding: 32rpx;
  text-align: center;
  border-bottom: 1px solid #f0f0f0;
}

.picker-body {
  padding: 32rpx;
}

/* 底部占位 */
.bottom-spacer {
  height: 40rpx;
}
</style>
