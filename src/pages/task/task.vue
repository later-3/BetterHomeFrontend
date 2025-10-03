<script setup lang="ts" name="task">
import { ref } from "vue";
import { computed, onMounted, watch } from "vue";
import { storeToRefs } from "pinia";
import TaskList from "./components/TaskList.vue";
import { useUserStore } from "@/store/user";
import { useWorkOrderStore } from "@/store/workOrders";
import type { WorkOrderListItem } from "@/store/workOrders";

const userStore = useUserStore();
const { loggedIn, displayName } = storeToRefs(userStore);

const workOrderStore = useWorkOrderStore();
const { items, loading, error, hasMore, initialized } = storeToRefs(
  workOrderStore
);

const listError = computed(() => error.value || null);

const fetchInitial = async () => {
  if (!loggedIn.value) return;
  if (initialized.value && items.value.length) return;

  try {
    await workOrderStore.fetchWorkOrders({ refresh: true });
  } catch (err) {
    console.error("加载工单失败", err);
  }
};

onMounted(() => {
  void fetchInitial();
});

watch(
  loggedIn,
  (value) => {
    if (value) {
      void workOrderStore.refresh().catch((err) => {
        console.error("刷新工单失败", err);
      });
    } else {
      workOrderStore.reset();
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
    await workOrderStore.refresh();
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
</script>

<template>
  <view class="page-container">
    <view v-if="!loggedIn" class="section login-hint">
      <text class="hint-title">需要登录以查看工单</text>
      <text class="hint-desc">请先登录后再查看社区事项</text>
    </view>

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