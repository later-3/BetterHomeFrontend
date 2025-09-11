<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useUserStore } from '@/store/user';

interface Props {
  theme?: 'green' | 'wechat' | 'blue';
}

const props = withDefaults(defineProps<Props>(), {
  theme: 'wechat'
});

// 用户状态管理
const userStore = useUserStore();
const { loggedIn, userInfo } = storeToRefs(userStore);

// 主题颜色配置
const themeColors = {
  wechat: '#07c160',  // 微信绿 - neighbor页面
  green: '#28a745',   // Bootstrap绿 - task页面  
  blue: '#007aff'     // 蓝色 - create页面
};

const currentColor = themeColors[props.theme];
</script>

<template>
  <view v-if="loggedIn" class="section user-status-section" :style="{ borderLeftColor: currentColor }">
    <view class="status-header">
      <text class="section-title">👤 用户状态</text>
      <text class="status-badge logged-in" :style="{ backgroundColor: currentColor }">已登录</text>
    </view>
    <view class="user-info">
      <text class="user-name">{{ userInfo.first_name }} {{ userInfo.last_name }}</text>
      <text class="user-detail">{{ userInfo.email }}</text>
      <text v-if="userInfo.community_name" class="user-community" :style="{ color: currentColor }">🏠 {{ userInfo.community_name }}</text>
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
  border-left: 4px solid;
  background: #f0f9f4;
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
  font-size: 12px;
  font-weight: 500;
}

.status-badge.logged-in {
  color: white;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
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
  font-size: 13px;
  font-weight: 500;
}
</style>