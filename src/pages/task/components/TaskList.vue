<script setup lang="ts">
import { ref, computed } from "vue";
import type { WorkOrderListItem } from "@/store/workOrders";
import WorkOrderCard from "./WorkOrderCard.vue";

const props = defineProps<{
  tasks: WorkOrderListItem[];
  loading?: boolean;
  error?: string | null;
  hasMore?: boolean;
}>();

const emit = defineEmits<{
  (e: "refresh"): void;
  (e: "load-more"): void;
  (e: "select", workOrder: WorkOrderListItem): void;
}>();

const isEmpty = computed(
  () => !props.loading && props.tasks.length === 0 && !props.error
);

// 下拉刷新状态
const refreshing = ref(false);

const handleSelect = (workOrder: WorkOrderListItem) => {
  emit("select", workOrder);
};

const handleLoadMore = () => {
  if (props.loading) return;
  emit("load-more");
};

const handleRefresh = async () => {
  if (refreshing.value) return;
  refreshing.value = true;

  try {
    emit("refresh");
    // 等待一段时间让刷新动画完成
    await new Promise(resolve => setTimeout(resolve, 500));
  } finally {
    refreshing.value = false;
  }
};

// scroll-view下拉刷新触发
const handleScrollRefresh = () => {
  void handleRefresh();
};
</script>

<template>
  <scroll-view
    class="task-list-scroll"
    scroll-y
    refresher-enabled
    :refresher-triggered="refreshing"
    @refresherrefresh="handleScrollRefresh"
  >
    <view class="task-list">
      <view v-if="error" class="list-error">
        <text class="error-text">{{ error }}</text>
        <up-button
          size="small"
          type="primary"
          plain
          text="重试"
          @click="handleRefresh"
        />
      </view>

      <view v-else-if="isEmpty" class="list-empty">
        <text class="empty-icon">📭</text>
        <text class="empty-title">还没有工单</text>
        <text class="empty-desc">创建一个新的事项，让团队开始处理吧</text>
        <up-button
          size="small"
          type="primary"
          plain
          text="刷新"
          @click="handleRefresh"
        />
      </view>

      <view v-else class="list-content">
        <WorkOrderCard
          v-for="item in tasks"
          :key="item.id"
          :work-order="item"
          @select="handleSelect"
        />
      </view>

      <view v-if="loading" class="list-loading">
        <text class="loading-text">加载中...</text>
      </view>

      <view v-else-if="hasMore" class="list-more">
        <up-button
          size="small"
          type="primary"
          plain
          text="加载更多"
          @click="handleLoadMore"
        />
      </view>
    </view>
  </scroll-view>
</template>

<style scoped>
.task-list-scroll {
  width: 100%;
  height: 100%;
}
.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.list-error,
.list-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 16px;
  border-radius: 16px;
  background-color: #f8fafc;
  text-align: center;
  color: #475569;
  gap: 8px;
}
.error-text {
  font-size: 14px;
  color: #ef4444;
}
.empty-icon {
  font-size: 32px;
}
.empty-title {
  font-weight: 600;
  font-size: 16px;
  color: #1f2933;
}
.empty-desc {
  font-size: 13px;
  color: #64748b;
}
.list-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.list-loading,
.list-more {
  display: flex;
  justify-content: center;
  padding: 12px 0 8px;
}
.loading-text {
  font-size: 13px;
  color: #64748b;
}
</style>
