<script setup lang="ts" name="task">
import { ref } from "vue";
import { computed, onMounted, watch } from "vue";
import { storeToRefs } from "pinia";
import TaskList from "./components/TaskList.vue";
import { useUserStore } from "@/store/user";
import { useWorkOrderStore } from "@/store/workOrders";
import type { WorkOrderListItem } from "@/store/workOrders";
import dayjs from "dayjs";

// 常量定义
const CALENDAR_HISTORY_MONTHS = 6; // 日历显示的历史月份数

const userStore = useUserStore();
const { loggedIn, displayName } = storeToRefs(userStore);

const workOrderStore = useWorkOrderStore();
const { items, loading, error, hasMore, initialized } = storeToRefs(
  workOrderStore
);

const listError = computed(() => error.value || null);

// 日期数据结构
interface DateItem {
  name: string;          // 显示文本 "26日"
  date: string;          // 完整日期 "2025-11-26"
  day: number;           // 日期数字 26
  month: number;         // 月份 11
  weekday: string;       // 星期 "周二"
  isToday: boolean;      // 是否今天
  hasWorkOrders: boolean; // 是否有工单
}

// 生成日期列表（前后15天，共31天）
const generateDateList = (): DateItem[] => {
  const dates: DateItem[] = [];
  const today = new Date();
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

  for (let i = -15; i <= 15; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    dates.push({
      name: `${day}日`,
      date: dateStr,
      day,
      month,
      weekday: weekdays[date.getDay()],
      isToday: i === 0,
      hasWorkOrders: false, // 初始为false，后续异步更新
    });
  }

  return dates;
};

// 立即初始化日期列表
const initialDateList = generateDateList();
const todayIndex = initialDateList.findIndex(d => d.isToday);

// 日期列表状态（带初始值）
const dateList = ref<DateItem[]>(initialDateList);
const currentDateIndex = ref(todayIndex >= 0 ? todayIndex : 15);
const selectedDate = ref(""); // 默认不选中任何日期

const fetchInitial = async () => {
  if (!loggedIn.value) return;
  if (initialized.value && items.value.length) return;

  try {
    await workOrderStore.fetchWorkOrders({ refresh: true });
    // 缓存所有工单，用于日历日期提取
    allWorkOrdersCache.value = [...items.value];
  } catch (err) {
    console.error("加载工单失败", err);
  }
};

onMounted(() => {
  void fetchInitial();
});

watch(
  loggedIn,
  async (value) => {
    if (value) {
      try {
        await workOrderStore.refresh();
        // 更新缓存
        allWorkOrdersCache.value = [...items.value];
        // 重置日历的日期缓存
        workOrderDates.value = [];
        forbidDays.value = [];
      } catch (err) {
        console.error("刷新工单失败", err);
      }
    } else {
      workOrderStore.reset();
      // 清空缓存
      allWorkOrdersCache.value = [];
      workOrderDates.value = [];
      forbidDays.value = [];
    }
  },
  { immediate: false }
);

const handleTaskClick = (task: WorkOrderListItem) => {
  uni.navigateTo({
    url: `/pages/task/detail?id=${task.id}`,
  });
};

const handleRefresh = async () => {
  if (!loggedIn.value) {
    uni.showToast({ title: "请先登录", icon: "none" });
    return;
  }

  try {
    // 重置筛选条件
    selectedCategory.value = "";
    selectedDate.value = "";

    await workOrderStore.refresh();
    // 更新缓存
    allWorkOrdersCache.value = [...items.value];
    // 重置日历的日期缓存，下次打开时会重新计算
    workOrderDates.value = [];
    forbidDays.value = [];
  } catch (err) {
    console.error("刷新工单时出错", err);
  }
};

const handleLoadMore = async () => {
  if (!loggedIn.value || !hasMore.value) return;

  try {
    await workOrderStore.loadMore();
  } catch (err) {
    console.error("加载更多工单失败", err);
  }
};

// 日期切换处理
const handleDateChange = async (index: number) => {
  if (!loggedIn.value) {
    uni.showToast({ title: "请先登录", icon: "none" });
    return;
  }

  // 防御性检查
  if (!dateList.value || !dateList.value[index]) {
    console.error("日期数据未初始化或索引越界", { index, listLength: dateList.value?.length });
    return;
  }

  const selectedDateItem = dateList.value[index];
  currentDateIndex.value = index;
  selectedDate.value = selectedDateItem.date;

  try {
    await workOrderStore.fetchWorkOrdersByDate(selectedDateItem.date);
  } catch (err) {
    console.error("按日期查询工单失败", err);
  }
};

// ==================== 日历筛选功能 ====================
const showCalendar = ref(false);
const calendarMinDate = ref<number>(0);
const calendarMaxDate = ref<number>(0);
const calendarDefaultDate = ref<string | string[]>([]); // 空数组表示不选中任何日期
const workOrderDates = ref<string[]>([]); // 有工单的日期列表（缓存，不会被筛选影响）
const forbidDays = ref<string[]>([]); // 禁用的日期列表
const allWorkOrdersCache = ref<WorkOrderListItem[]>([]); // 缓存所有工单，用于日期提取

// ==================== 类别筛选功能 ====================
const showCategoryPicker = ref(false);
const selectedCategory = ref<string>(""); // 当前选中的类别

// 类别选项
const categoryOptions = [
  { name: "全部类别", value: "" },
  { name: "设施维修", value: "repair" },
  { name: "投诉建议", value: "complaint" },
  { name: "优化建议", value: "suggestion" },
  { name: "咨询", value: "inquiry" },
  { name: "其他事项", value: "other" },
];

// 获取当前选中类别的显示文本
const selectedCategoryLabel = computed(() => {
  const option = categoryOptions.find((opt) => opt.value === selectedCategory.value);
  return option ? option.name : "全部类别";
});

// 打开类别选择器
const handleCategoryClick = () => {
  if (!loggedIn.value) {
    uni.showToast({ title: "请先登录", icon: "none" });
    return;
  }
  showCategoryPicker.value = true;
};

// 选择类别
const handleCategorySelect = async (item: any) => {
  selectedCategory.value = item.value;
  showCategoryPicker.value = false;

  // 应用筛选
  await applyFilters();
};

// 应用筛选（类别 + 日期）
const applyFilters = async () => {
  if (!loggedIn.value) return;

  try {
    // 如果有日期筛选，按日期和类别查询
    if (selectedDate.value) {
      await workOrderStore.fetchWorkOrdersByDate(selectedDate.value, selectedCategory.value);
    } else {
      // 没有日期筛选：按类别查询所有（如果类别为空则显示全部）
      if (selectedCategory.value) {
        await workOrderStore.fetchWorkOrdersByCategory(selectedCategory.value);
      } else {
        // 类别和日期都为空，显示所有工单
        await workOrderStore.refresh();
      }
    }
  } catch (err) {
    console.error("筛选工单失败", err);
  }
};

// 打开日历筛选
const handleFilter = () => {
  if (!loggedIn.value) {
    uni.showToast({ title: "请先登录", icon: "none" });
    return;
  }

  // 设置日历的日期范围
  const today = dayjs();
  calendarMinDate.value = today.subtract(CALENDAR_HISTORY_MONTHS, "month").valueOf();
  calendarMaxDate.value = today.valueOf();

  // 如果有选中的日期，显示选中日期；否则为空数组（不选中任何日期）
  calendarDefaultDate.value = selectedDate.value || [];

  // 只在首次打开或缓存为空时加载日期
  if (workOrderDates.value.length === 0) {
    loadWorkOrderDates();
  }

  showCalendar.value = true;
};

// 关闭日历
const handleCalendarClose = () => {
  showCalendar.value = false;
};

// 加载有工单的日期列表
const loadWorkOrderDates = async () => {
  try {
    // 查询往前6个月到今天的所有有工单的日期
    const minDate = dayjs().subtract(CALENDAR_HISTORY_MONTHS, "month").format("YYYY-MM-DD");
    const maxDate = dayjs().format("YYYY-MM-DD");

    // 从缓存中提取日期（不从 items 中提取，避免被筛选影响）
    const dates = new Set<string>();

    // 使用缓存的完整工单列表
    const sourceList = allWorkOrdersCache.value.length > 0
      ? allWorkOrdersCache.value
      : items.value;

    sourceList.forEach((order) => {
      if (order.date_created) {
        const dateStr = dayjs(order.date_created).format("YYYY-MM-DD");
        const orderDate = dayjs(dateStr);

        // 只添加在日历范围内的日期
        if (orderDate.isAfter(dayjs(minDate).subtract(1, 'day')) &&
            orderDate.isBefore(dayjs(maxDate).add(1, 'day'))) {
          dates.add(dateStr);
        }
      }
    });

    workOrderDates.value = Array.from(dates);

    // 生成禁用日期列表（日历范围内没有工单的日期）
    const allDatesInRange: string[] = [];
    const start = dayjs(minDate);
    const end = dayjs(maxDate);
    let current = start;

    while (current.isBefore(end) || current.isSame(end)) {
      const dateStr = current.format("YYYY-MM-DD");
      if (!dates.has(dateStr)) {
        allDatesInRange.push(dateStr);
      }
      current = current.add(1, "day");
    }

    forbidDays.value = allDatesInRange;
  } catch (err) {
    console.error("加载工单日期失败", err);
  }
};

// 日历日期格式化函数（添加绿点标记）
const calendarFormatter = (day: any) => {
  const dateStr = dayjs(day.date).format("YYYY-MM-DD");

  // 如果该日期有工单，添加绿点标记
  if (workOrderDates.value.includes(dateStr)) {
    day.dot = true;
  }

  return day;
};

// 日历日期选择确认
const handleCalendarConfirm = async (value: any) => {
  if (!loggedIn.value) return;

  // value 是一个数组，单选模式下只有一个元素
  const selectedDateStr = Array.isArray(value) ? value[0] : value;

  if (selectedDateStr) {
    showCalendar.value = false;

    // Toggle 逻辑：如果点击的是同一个日期，则取消筛选
    if (selectedDate.value === selectedDateStr) {
      selectedDate.value = "";

      try {
        // 只按类别筛选（如果有类别的话）
        if (selectedCategory.value) {
          await workOrderStore.fetchWorkOrdersByCategory(selectedCategory.value);
        } else {
          await workOrderStore.refresh();
        }
      } catch (err) {
        console.error("刷新工单失败", err);
      }
    } else {
      // 选择新日期
      selectedDate.value = selectedDateStr;

      try {
        await workOrderStore.fetchWorkOrdersByDate(
          selectedDateStr,
          selectedCategory.value
        );
      } catch (err) {
        console.error("按日期查询工单失败", err);
      }
    }
  }
};
</script>

<template>
  <view class="page-container">
    <view v-if="!loggedIn" class="section login-hint">
      <text class="hint-title">需要登录以查看工单</text>
      <text class="hint-desc">请先登录后再查看社区事项</text>
    </view>

    <!-- 日期筛选条 - 暂时隐藏，改用日历 -->
    <view v-if="false && loggedIn && dateList.length > 0" class="date-filter-bar">
      <up-tabs
        :list="dateList"
        :current="currentDateIndex"
        :scrollable="true"
        :activeStyle="{
          color: '#ffffff',
          backgroundColor: '#28a745',
          fontWeight: '600'
        }"
        :inactiveStyle="{
          color: '#94a3b8'
        }"
        @change="handleDateChange"
      />

      <view class="filter-btn" @click="handleFilter">
        <up-icon name="filter" size="22" color="#28a745" />
      </view>
    </view>

    <!-- 筛选按钮栏 -->
    <view v-if="loggedIn" class="filter-bar">
      <!-- 类别筛选 -->
      <view class="filter-btn category-btn" @click="handleCategoryClick">
        <up-icon name="list" size="20" color="#28a745" />
        <text class="filter-text">{{ selectedCategoryLabel }}</text>
        <up-icon name="arrow-down" size="16" color="#28a745" />
      </view>

      <!-- 日历筛选 -->
      <view class="filter-btn calendar-btn" @click="handleFilter">
        <up-icon name="calendar" size="20" color="#28a745" />
        <text class="filter-text">日历筛选</text>
      </view>
    </view>

    <!-- 类别选择器 -->
    <u-action-sheet
      :show="showCategoryPicker"
      :actions="categoryOptions"
      title="选择类别"
      @select="handleCategorySelect"
      @close="showCategoryPicker = false"
    />

    <!-- 日历弹窗 -->
    <up-calendar
      :show="showCalendar"
      :min-date="calendarMinDate"
      :max-date="calendarMaxDate"
      :default-date="calendarDefaultDate"
      :formatter="calendarFormatter"
      :forbid-days="forbidDays"
      forbid-days-toast="该日期暂无工单"
      mode="single"
      color="#28a745"
      :month-num="7"
      :show-confirm="false"
      :close-on-click-overlay="true"
      @confirm="handleCalendarConfirm"
      @close="handleCalendarClose"
    />

    <view class="section list-section">
      <view class="result-header">
        <text class="section-title">📋 工单列表</text>
        <up-button
          size="mini"
          type="primary"
          plain
          :loading="loading"
          text="刷新"
          @click="handleRefresh"
        />
      </view>

      <TaskList
        :tasks="items"
        :loading="loading"
        :error="listError"
        :has-more="hasMore"
        @refresh="handleRefresh"
        @load-more="handleLoadMore"
        @select="handleTaskClick"
      />
    </view>
  </view>
</template>

<style scoped>
.page-container {
  padding: 16px;
  padding-bottom: 80px;
  min-height: 100vh;
  background-color: #f4f5f7;
  font-size: 14px;
}

.section {
  margin-bottom: 16px;
  padding: 20px;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
}

/* 日期筛选条 */
.date-filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  margin-bottom: 16px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05);
}

/* 筛选按钮栏 */
.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  margin-bottom: 16px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05);
}

.filter-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  cursor: pointer;
  border-radius: 8px;
  transition: background-color 0.2s;
  min-width: 100px;
}

.filter-btn:active {
  background-color: #f0f0f0;
}

.category-btn {
  flex: 1;
  justify-content: space-between;
  border: 1px solid #e0e0e0;
}

.calendar-btn {
  border: 1px solid #e0e0e0;
}

.filter-text {
  font-size: 14px;
  color: #28a745;
  font-weight: 500;
}

.login-hint {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  text-align: center;
  color: #475569;
}

.hint-title {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
}

.hint-desc {
  font-size: 13px;
  color: #64748b;
}

.list-section {
  padding: 20px 16px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  font-weight: 600;
  font-size: 16px;
  color: #111827;
}
</style>