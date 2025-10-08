<script setup lang="ts" name="task">
import { ref } from "vue";
import { computed, onMounted, watch, nextTick } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { storeToRefs } from "pinia";
import TaskList from "./components/TaskList.vue";
import { useUserStore } from "@/store/user";
import { useWorkOrderStore } from "@/store/workOrders";
import type { WorkOrderListItem } from "@/store/workOrders";
import dayjs from "dayjs";

// 常量定义
const getCalendarRange = () => {
  const start = dayjs().startOf("year");
  const end = dayjs();
  return { start, end };
};

const calendarMonthNum = computed(() => {
  const { start, end } = getCalendarRange();
  const diff = end.diff(start, "month");
  return Math.max(diff + 1, 1);
});

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
const calendarRef = ref<any>(null);

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

// 页面显示时检测新工单（Tab切换或应用切回前台）
onShow(() => {
  void checkForNewWorkOrders();
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
    // 记录刷新前的第一条工单ID（用于判断是否有新数据）
    const oldFirstId = items.value.length > 0 ? items.value[0].id : null;

    // 重置筛选条件
    selectedCategory.value = "";
    selectedDate.value = "";

    await workOrderStore.refresh();

    // 检查是否有新数据
    const newFirstId = items.value.length > 0 ? items.value[0].id : null;
    const hasNewData = oldFirstId !== newFirstId;

    // 更新缓存
    allWorkOrdersCache.value = [...items.value];
    // 重置日历的日期缓存，下次打开时会重新计算
    workOrderDates.value = [];
    forbidDays.value = [];

    // 刷新后更新最新工单ID并清除红点提示（无论是点击按钮还是下拉刷新）
    if (items.value.length > 0) {
      latestWorkOrderId.value = items.value[0].id;
    }
    hasNewWorkOrders.value = false;

    // 如果没有新数据，提示用户
    if (!hasNewData && oldFirstId !== null) {
      uni.showToast({
        title: "暂无新工单",
        icon: "none",
        duration: 1500
      });
    }
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
const calendarDefaultDate = ref<number | number[]>(dayjs().startOf("day").valueOf());
const workOrderDates = ref<string[]>([]); // 有工单的日期列表（缓存，不会被筛选影响）
const forbidDays = ref<string[]>([]); // 禁用的日期列表
const allWorkOrdersCache = ref<WorkOrderListItem[]>([]); // 缓存所有工单，用于日期提取

// ==================== 新工单检测 ====================
const hasNewWorkOrders = ref(false); // 是否有新工单
const latestWorkOrderId = ref<string | number | null>(null); // 最新工单ID（用于检测）

// 检测是否有新工单
const checkForNewWorkOrders = async () => {
  if (!loggedIn.value) return;

  try {
    // 获取当前筛选条件下的最新工单（只取第一条）
    const latestWorkOrder = await workOrderStore.fetchLatestWorkOrder(
      selectedCategory.value,
      selectedDate.value
    );

    if (!latestWorkOrder) return;

    // 如果是首次加载，记录最新工单ID，不显示提示
    if (latestWorkOrderId.value === null) {
      latestWorkOrderId.value = latestWorkOrder.id;
      return;
    }

    // 对比ID，如果不同说明有新工单
    if (latestWorkOrder.id !== latestWorkOrderId.value) {
      hasNewWorkOrders.value = true;
    }
  } catch (err) {
    console.error("检测新工单失败", err);
  }
};

// 刷新按钮点击处理
const handleRefreshClick = async () => {
  if (!loggedIn.value) {
    uni.showToast({ title: "请先登录", icon: "none" });
    return;
  }

  // 如果没有新工单，阻止刷新
  if (!hasNewWorkOrders.value) {
    uni.showToast({ title: "暂无新工单", icon: "none" });
    return;
  }

  // 调用统一的刷新逻辑（会自动清除红点）
  await handleRefresh();
};

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
const handleFilter = async () => {
  if (!loggedIn.value) {
    uni.showToast({ title: "请先登录", icon: "none" });
    return;
  }

  // 设置日历的日期范围（当前年份）
  const { start, end } = getCalendarRange();
  calendarMinDate.value = start.valueOf();
  calendarMaxDate.value = end.valueOf();

  // 如果有选中的日期，显示选中日期；否则为空数组（不选中任何日期）
  calendarDefaultDate.value = selectedDate.value
    ? dayjs(selectedDate.value).startOf("day").valueOf()
    : dayjs().startOf("day").valueOf();

  // 只在首次打开或缓存为空时加载日期
  if (workOrderDates.value.length === 0) {
    await loadWorkOrderDates();
  }

  showCalendar.value = true;

  await nextTick();
  syncCalendarSelection();
};

// 关闭日历
const handleCalendarClose = () => {
  showCalendar.value = false;
};

// 加载有工单的日期列表
const loadWorkOrderDates = async () => {
  try {
    const { start, end } = getCalendarRange();

    let dateList: string[] = [];

    if (typeof workOrderStore.fetchWorkOrderDatesByYear === "function") {
      try {
        dateList = await workOrderStore.fetchWorkOrderDatesByYear(start.year());
      } catch (err) {
        console.error("按年聚合工单日期失败，回退本地缓存", err);
      }
    }

    // 回退：使用本地缓存/当前列表生成日期集合
    if (!dateList.length) {
      const dates = new Set<string>();
      const sourceList = allWorkOrdersCache.value.length > 0
        ? allWorkOrdersCache.value
        : items.value;

      sourceList.forEach((order) => {
        if (order.date_created) {
          dates.add(dayjs(order.date_created).format("YYYY-MM-DD"));
        }
      });

      dateList = Array.from(dates);
    }

    workOrderDates.value = dateList;

    // 生成禁用日期列表（日历范围内没有工单的日期）
    const allDatesInRange: string[] = [];
    const dateSet = new Set(dateList);
    let current = start.startOf("day");
    const endOfRange = end.startOf("day");

    while (current.isBefore(endOfRange) || current.isSame(endOfRange)) {
      const dateStr = current.format("YYYY-MM-DD");
      if (!dateSet.has(dateStr)) {
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

const syncCalendarSelection = () => {
  const calendar = calendarRef.value as any;
  const monthRef = calendar?.$refs?.month;
  if (!monthRef || typeof monthRef.setSelected !== "function") return;
  const selected = selectedDate.value ? [selectedDate.value] : [];
  monthRef.setSelected(selected, false);
};

// 日历日期选择确认
const handleCalendarConfirm = async (value: any) => {
  if (!loggedIn.value) return;

  // value 是一个数组，单选模式下只有一个元素
  const rawValue = Array.isArray(value) ? value[0] : value;
  const selectedDateStr = rawValue
    ? dayjs(rawValue).format("YYYY-MM-DD")
    : "";

  if (selectedDateStr) {
    showCalendar.value = false;

    // Toggle 逻辑：如果点击的是同一个日期，则取消筛选
    if (selectedDate.value === selectedDateStr) {
      selectedDate.value = "";
      calendarDefaultDate.value = dayjs().startOf("day").valueOf();

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
      calendarDefaultDate.value = dayjs(selectedDateStr).startOf("day").valueOf();

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

      <!-- 刷新按钮 -->
      <view
        class="filter-btn refresh-btn"
        :class="{ 'refresh-btn--disabled': !hasNewWorkOrders }"
        @click="handleRefreshClick"
      >
        <view class="refresh-icon-wrapper">
          <up-icon
            name="reload"
            size="18"
            :color="hasNewWorkOrders ? '#ff6b6b' : '#cbd5e0'"
          />
          <view v-if="hasNewWorkOrders" class="red-dot"></view>
        </view>
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
      ref="calendarRef"
      :show="showCalendar"
      :min-date="calendarMinDate"
      :max-date="calendarMaxDate"
      :default-date="calendarDefaultDate"
      :formatter="calendarFormatter"
      :forbid-days="forbidDays"
      forbid-days-toast="该日期暂无工单"
      mode="single"
      color="#28a745"
      :month-num="calendarMonthNum"
      :show-confirm="false"
      :close-on-click-overlay="true"
      @confirm="handleCalendarConfirm"
      @close="handleCalendarClose"
    />

    <view class="section list-section">
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
  padding: 0 16px 80px;
  padding-top: calc(var(--status-bar-height) + 0px); /* NavigationBar已隐藏，只需状态栏高度 */
  min-height: 100vh;
  background-color: #f4f5f7;
  font-size: 14px;
}
.section {
  margin-bottom: 16px;
  padding: 20px;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
}
/* 日期筛选条 */
.date-filter-bar {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding: 8px 12px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05);
  gap: 12px;
}
/* 筛选按钮栏 */
.filter-bar {
  display: flex;
  position: sticky;
  top: var(--status-bar-height);
  z-index: 100;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px; /* 与顶部保持间距 */
  margin-bottom: 16px;
  padding: 6px 12px; /* 从8px优化到6px */
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05);
  gap: 8px; /* 从12px优化到8px */
}
.filter-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 6px 12px; /* 从8px 16px优化到6px 12px */
  border-radius: 8px;
  min-width: 90px; /* 从100px优化到90px */
  cursor: pointer;
  transition: background-color 0.2s;
  gap: 4px; /* 从6px优化到4px */
}
.filter-btn:active {
  background-color: #f0f0f0;
}
.category-btn {
  justify-content: space-between;
  flex: 1;
  border: 1px solid #e0e0e0;
}
.calendar-btn {
  border: 1px solid #e0e0e0;
}
.refresh-btn {
  position: relative;
  padding: 0;
  border: 1px solid #e0e0e0;
  border-radius: 50%;
  width: 36px; /* 从40px优化到36px */
  min-width: auto;
  height: 36px; /* 从40px优化到36px */
  transition: all 0.3s ease;
}
.refresh-btn--disabled {
  background-color: #f5f5f5;
  opacity: 0.5;
  cursor: not-allowed;
}
.refresh-btn--disabled:active {
  background-color: #f5f5f5;
}
.refresh-icon-wrapper {
  display: flex;
  position: relative;
  justify-content: center;
  align-items: center;
}
.red-dot {
  position: absolute;
  right: -2px;
  top: -2px;
  border: 2px solid #fff;
  border-radius: 50%;
  width: 8px;
  height: 8px;
  background-color: #ff6b6b;
}
.filter-text {
  font-weight: 500;
  font-size: 14px;
  color: #28a745;
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
  font-weight: 600;
  font-size: 16px;
  color: #0f172a;
}
.hint-desc {
  font-size: 13px;
  color: #64748b;
}
.list-section {
  padding: 16px 0; /* 从20px优化到16px，符合8pt网格 */
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
