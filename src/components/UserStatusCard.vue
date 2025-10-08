<script setup lang="ts">
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import { useUserStore, type SessionState } from "@/store/user";

interface Props {
  theme?: "green" | "wechat" | "blue" | "orange";
}

const props = withDefaults(defineProps<Props>(), {
  theme: "wechat",
});

// 用户状态管理
const userStore = useUserStore();
const { loggedIn, userInfo, sessionState } = storeToRefs(userStore);

// 主题颜色配置
const themeColors = {
  wechat: "#07c160", // 微信绿 - neighbor页面
  green: "#28a745", // Bootstrap绿 - task页面
  blue: "#007aff", // 蓝色 - create页面
  orange: "#ff9500", // 橙色 - notice页面
};

const currentColor = themeColors[props.theme];

interface StatusConfig {
  badgeText: string;
  message: string;
  accent: string;
  background: string;
  badgeColor: string;
  badgeTextColor: string;
  showRefresh: boolean;
  showLogin: boolean;
}

const refreshing = ref(false);

const statusConfig = computed<StatusConfig>(() => {
  const state = sessionState.value as SessionState;

  switch (state) {
    case "active":
      return {
        badgeText: "会话有效",
        message: "登录状态正常，可提交工单。",
        accent: currentColor,
        background: "rgba(40, 167, 69, 0.08)",
        badgeColor: currentColor,
        badgeTextColor: "#ffffff",
        showRefresh: false,
        showLogin: false,
      };
    case "near_expiry":
      return {
        badgeText: "即将过期",
        message: "登录状态即将过期，建议立即刷新。",
        accent: "#F59E0B",
        background: "#FFF7E6",
        badgeColor: "#F59E0B",
        badgeTextColor: "#ffffff",
        showRefresh: true,
        showLogin: false,
      };
    case "expired":
      return {
        badgeText: "已过期",
        message: "登录状态已失效，请重新登录。",
        accent: "#EF4444",
        background: "#FEE2E2",
        badgeColor: "#EF4444",
        badgeTextColor: "#ffffff",
        showRefresh: false,
        showLogin: true,
      };
    default:
      return {
        badgeText: "未登录",
        message: "请登录后查看或提交工单。",
        accent: "#CBD5E1",
        background: "#F8FAFC",
        badgeColor: "#CBD5E1",
        badgeTextColor: "#0F172A",
        showRefresh: false,
        showLogin: true,
      };
  }
});

const statusStyle = computed(() => ({
  borderLeftColor: statusConfig.value.accent,
  backgroundColor: statusConfig.value.background,
}));

const canShowUserInfo = computed(() => sessionState.value !== "unauthenticated" && Boolean(userInfo.value.id));

const handleRefreshToken = async () => {
  if (refreshing.value) return;
  refreshing.value = true;
  try {
    await userStore.ensureActiveSession({ force: true });
    uni.showToast({ title: "登录状态已刷新", icon: "none" });
  } catch (error) {
    console.error("UserStatusCard - refresh token failed", error);
    uni.showToast({ title: "刷新失败，请重新登录", icon: "none" });
  } finally {
    refreshing.value = false;
  }
};

const handleGoLogin = () => {
  uni.navigateTo({
    url: "/pages/profile/login",
  });
};
</script>

<template>
  <view class="section user-status-section" :style="statusStyle">
    <view class="status-header">
      <text class="section-title">👤 用户状态</text>
      <text
        class="status-badge"
        :style="{ backgroundColor: statusConfig.badgeColor, color: statusConfig.badgeTextColor }"
      >
        {{ statusConfig.badgeText }}
      </text>
    </view>

    <view v-if="canShowUserInfo" class="user-info">
      <text class="user-name">
        {{ userInfo.first_name }} {{ userInfo.last_name }}
      </text>
      <text class="user-detail">{{ userInfo.email }}</text>
      <text
        v-if="userInfo.community_name"
        class="user-community"
        :style="{ color: statusConfig.accent }"
      >
        🏠 {{ userInfo.community_name }}
      </text>
    </view>
    <view v-else class="user-info user-info--placeholder">
      <text class="user-name">未登录</text>
      <text class="user-detail">请先登录以继续</text>
    </view>

    <view class="status-message">
      <text>{{ statusConfig.message }}</text>
    </view>

    <view
      class="status-actions"
      v-if="statusConfig.showRefresh || statusConfig.showLogin"
    >
      <up-button
        v-if="statusConfig.showRefresh"
        size="small"
        type="primary"
        plain
        :loading="refreshing"
        text="刷新登录"
        @click="handleRefreshToken"
      />
      <up-button
        v-if="statusConfig.showLogin"
        size="small"
        type="primary"
        text="去登录"
        @click="handleGoLogin"
      />
    </view>
  </view>
</template>

<style scoped>
.section {
  margin-bottom: 16px;
  padding: 16px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
.user-status-section {
  display: flex;
  flex-direction: column;
  border-left: 4px solid;
  gap: 12px;
}
.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.section-title {
  font-weight: bold;
  font-size: 16px;
  color: #333;
}
.status-badge {
  padding: 4px 12px;
  border-radius: 16px;
  font-weight: 500;
  font-size: 12px;
}
.user-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.user-info--placeholder .user-name {
  color: #0f172a;
}
.user-info--placeholder .user-detail {
  color: #64748b;
}
.user-name {
  font-weight: 600;
  font-size: 16px;
  color: #333;
}
.user-detail {
  font-size: 14px;
  color: #666;
}
.user-community {
  font-weight: 500;
  font-size: 13px;
}
.status-message {
  font-size: 13px;
  color: #64748b;
}
.status-actions {
  display: flex;
  gap: 8px;
}
</style>
