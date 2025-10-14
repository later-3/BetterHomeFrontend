<template>
  <view class="finance-page">
    <!-- 导航栏 -->
    <up-navbar
      title="财务透明"
      :border="false"
      :safe-area-inset-top="true"
      :placeholder="true"
      :fixed="true"
      bg-color="#ffffff"
      left-icon="arrow-left"
      :auto-back="true"
    />

    <!-- 加载中遮罩 -->
    <up-loading-page
      :loading="loading"
      loading-text="加载中..."
      bg-color="rgba(255, 255, 255, 0.9)"
    />

    <!-- 月份选择区域 -->
    <view class="month-selector">
      <view class="month-selector-header">
        <up-icon name="calendar" size="18" color="#606266" />
        <up-text text="选择月份" size="15" color="#303133" bold :style="{ marginLeft: '8px' }" />
      </view>
      <up-checkbox-group v-model="selectedMonths" @change="onMonthChange">
        <view class="month-grid">
          <view class="month-item" v-for="month in 12" :key="month">
            <up-checkbox
              :name="month"
              :label="`${month}月`"
              :disabled="month > currentMonth"
              shape="circle"
              labelSize="14"
            />
          </view>
        </view>
      </up-checkbox-group>
    </view>

    <!-- 汇总卡片区域 -->
    <view class="summary-section">
      <up-card
        :showHead="false"
        :border="false"
        :head-border-bottom="false"
        padding="24rpx"
        margin="20rpx"
        box-shadow="0 4rpx 20rpx rgba(0,0,0,0.08)"
      >
        <template #body>
          <view class="summary-main">
            <up-text text="结余" size="14" color="#999" />
            <up-text
              :text="formatAmount(summary.balance)"
              size="32"
              :color="summary.balance >= 0 ? '#52c41a' : '#ff4d4f'"
              bold
              margin="8rpx 0 0 0"
            />
          </view>

          <up-grid :col="3" :border="false" class="summary-grid">
            <up-grid-item>
              <view class="grid-item">
                <up-text text="总支出" size="12" color="#999" />
                <up-text
                  :text="formatAmount(summary.totalExpense)"
                  size="16"
                  color="#ff4d4f"
                  bold
                  margin="4rpx 0 0 0"
                />
              </view>
            </up-grid-item>
            <up-grid-item>
              <view class="grid-item">
                <up-text text="总收入" size="12" color="#999" />
                <up-text
                  :text="formatAmount(summary.totalIncome)"
                  size="16"
                  color="#52c41a"
                  bold
                  margin="4rpx 0 0 0"
                />
              </view>
            </up-grid-item>
            <up-grid-item>
              <view class="grid-item">
                <up-text text="环比" size="12" color="#999" />
                <up-text
                  :text="summary.growth"
                  size="16"
                  :color="summary.growth.startsWith('+') ? '#52c41a' : '#ff4d4f'"
                  bold
                  margin="4rpx 0 0 0"
                />
              </view>
            </up-grid-item>
          </up-grid>
        </template>
      </up-card>
    </view>

    <!-- 分段器切换 -->
    <view class="subsection-wrapper">
      <up-subsection
        :list="tabs"
        :current="currentTab"
        @change="onTabChange"
        active-color="#1890ff"
        :bg-color="'#f5f7fa'"
        :font-size="15"
      />
    </view>

    <!-- 明细列表 -->
    <view class="detail-section">
      <up-cell-group :border="false">
        <up-cell
          v-for="(item, index) in currentList"
          :key="index"
          :title="item.label"
          @click="handleItemClick(item)"
        >
          <template #icon>
            <view class="item-icon">{{ item.icon }}</view>
          </template>

          <template #value>
            <view class="item-value">
              <up-text
                :text="formatAmount(item.amount)"
                size="16"
                :color="currentTab === 0 ? '#52c41a' : '#ff4d4f'"
                bold
              />
              <up-tag
                :text="item.percentage + '%'"
                type="info"
                plain
                size="mini"
                :style="{ marginLeft: '8px' }"
              />
            </view>
          </template>

          <template #label>
            <up-line-progress
              :percentage="item.percentage"
              :active-color="currentTab === 0 ? '#52c41a' : '#ff4d4f'"
              :inactive-color="'#f0f0f0'"
              :show-percent="false"
              height="6"
              :style="{ marginTop: '8px' }"
            />
          </template>
        </up-cell>
      </up-cell-group>

      <!-- 空状态 -->
      <up-empty
        v-if="currentList.length === 0"
        mode="data"
        text="暂无数据"
        :margin-top="60"
      />
    </view>

  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useFinanceStore } from "@/store/finance";
import { getIncomeTypeLabel, getExpenseTypeLabel } from "@/utils/finance-labels";

// Store
const financeStore = useFinanceStore();

// 状态
const currentTab = ref(0);
const loading = ref(false);
const financialData = ref<any>(null);

// 获取当前月份（MVP阶段假设是10月）
const currentMonth = ref(10);

// 选中的月份数组，默认选中1-10月
const selectedMonths = ref<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

// 分段器选项
const tabs = ["收入", "支出"];

// 收入类型图标映射
const incomeIcons: Record<string, string> = {
  parking: "🅿️",
  advertising: "📢",
  express_locker: "📦",
  venue_rental: "🏢",
  other: "💰",
};

// 支出类型图标映射
const expenseIcons: Record<string, string> = {
  salary: "👨‍💼",
  utilities: "⚡",
  maintenance: "🔧",
  materials: "📦",
  security: "🛡️",
  cleaning: "🧹",
  greening: "🌳",
  other: "💸",
};

// 汇总数据
const summary = computed(() => {
  if (!financialData.value) {
    return {
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      growth: "+0.0%",
    };
  }

  return {
    totalIncome: financialData.value.totalIncome || 0,
    totalExpense: financialData.value.totalExpense || 0,
    balance: financialData.value.balance || 0,
    growth: "+0.0%", // TODO: 实现环比计算
  };
});

// 计算带百分比的收入列表
const incomesWithPercentage = computed(() => {
  if (!financialData.value?.incomesByType) {
    return [];
  }

  const total = summary.value.totalIncome;
  return financialData.value.incomesByType.map((item: any) => ({
    type: item.type,
    label: getIncomeTypeLabel(item.type),
    amount: item.total,
    icon: incomeIcons[item.type] || incomeIcons.other,
    percentage: total > 0 ? ((item.total / total) * 100).toFixed(1) : 0,
  }));
});

// 计算带百分比的支出列表
const expensesWithPercentage = computed(() => {
  if (!financialData.value?.expensesByType) {
    return [];
  }

  const total = summary.value.totalExpense;
  return financialData.value.expensesByType.map((item: any) => ({
    type: item.type,
    label: getExpenseTypeLabel(item.type),
    amount: item.total,
    icon: expenseIcons[item.type] || expenseIcons.other,
    percentage: total > 0 ? ((item.total / total) * 100).toFixed(1) : 0,
  }));
});

// 当前显示的列表
const currentList = computed(() => {
  return currentTab.value === 0 ? incomesWithPercentage.value : expensesWithPercentage.value;
});

// 格式化金额
function formatAmount(amount: number): string {
  return `¥${amount.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// 切换分段器
function onTabChange(index: number) {
  currentTab.value = index;
}

// 获取财务数据
async function fetchFinancialData() {
  if (loading.value) return;

  loading.value = true;

  try {
    // 将选中的月份转换为 period 格式（YYYY-MM）
    const periods = selectedMonths.value.map((month) => {
      return `2025-${String(month).padStart(2, "0")}`;
    });

    console.log("获取财务数据，账期:", periods);

    // 调用 store 方法获取汇总数据
    const data = await financeStore.calculateFinancialSummary(periods);
    financialData.value = data;

    console.log("财务数据获取成功:", data);
  } catch (error: any) {
    console.error("获取财务数据失败:", error);
    uni.showToast({
      title: error?.message || "获取数据失败",
      icon: "none",
      duration: 2000,
    });
  } finally {
    loading.value = false;
  }
}

// 月份选择变化
function onMonthChange(value: number[]) {
  console.log("选中的月份:", value);
  fetchFinancialData();
}

// 点击列表项
function handleItemClick(item: any) {
  uni.showToast({
    title: `查看${item.label}详情`,
    icon: "none",
  });
}

// 页面加载时获取数据
onMounted(() => {
  fetchFinancialData();
});
</script>

<style scoped>
.finance-page {
  min-height: 100vh;
  background-color: #f5f7fa;
}

/* 汇总卡片区域 */
.summary-section {
  padding-bottom: 10rpx;
}

.summary-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx 0 32rpx;
  background: linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%);
  border-radius: 12rpx;
  margin-bottom: 20rpx;
}

.summary-grid {
  margin-top: 20rpx;
}

.grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}

/* 分段器区域 */
.subsection-wrapper {
  padding: 20rpx;
}

/* 明细列表区域 */
.detail-section {
  padding: 0 20rpx;
}

.item-icon {
  font-size: 22px;
  margin-right: 12px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 8px;
}

.item-value {
  display: flex;
  align-items: center;
}

/* 月份选择器 */
.month-selector {
  background: #ffffff;
  padding: 20rpx;
  margin: 0 20rpx 20rpx;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}

.month-selector-header {
  display: flex;
  align-items: center;
  padding-bottom: 16rpx;
  margin-bottom: 16rpx;
  border-bottom: 1px solid #f0f0f0;
}

.month-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120rpx, 1fr));
  gap: 12rpx;
  width: 100%;
}

.month-item {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
