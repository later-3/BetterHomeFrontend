<script setup lang="ts" name="profile">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useUserStore } from '@/store/user';
import type { DirectusUser, Community, DirectusFile } from '@/@types/directus-schema';
import env from '@/config/env';

const userStore = useUserStore();
const { profile, community, isLoggedIn, loading } = storeToRefs(userStore);
const DEFAULT_AVATAR = '/static/avatar-default.png';

const displayName = computed(() => {
  const value = profile.value as DirectusUser | null;
  if (!value) return '未登录用户';
  const first = value.first_name?.trim() ?? '';
  const last = value.last_name?.trim() ?? '';
  const fullName = [first, last].filter(Boolean).join(' ');
  return fullName || value.email || '未命名用户';
});

const contactInfo = computed(() => {
  const value = profile.value as DirectusUser | null;
  return value?.email || '未绑定邮箱';
});

const communityName = computed(() => {
  const joinedCommunity = community.value as Community | null;
  if (joinedCommunity?.name) return joinedCommunity.name;

  const rawCommunity = profile.value?.community_id;
  if (typeof rawCommunity === 'string' && rawCommunity) return rawCommunity;
  if (rawCommunity && typeof rawCommunity === 'object' && 'name' in rawCommunity) {
    return rawCommunity.name as string;
  }
  return '尚未加入小区';
});

const buildingName = computed(() => {
  const value = profile.value;
  const rawBuilding = value?.building_id;
  if (!rawBuilding) return '未绑定楼栋';
  if (typeof rawBuilding === 'string') return rawBuilding;
  if (typeof rawBuilding === 'object' && 'name' in rawBuilding && rawBuilding.name) {
    return rawBuilding.name as string;
  }
  return '未绑定楼栋';
});

const userTypeLabel = computed(() => {
  const type = profile.value?.user_type;
  const map: Record<string, string> = {
    resident: '业主/住户',
    property_manager: '物业经理',
    property_woker: '物业员工',
    committee_member: '业委会成员',
    committee_normal: '业委会工作人员',
    admin: '平台管理员'
  };
  if (!type) return '未设置';
  return map[type] ?? type;
});

function buildAssetUrl(file: DirectusFile | string): string {
  const fileId = typeof file === 'string' ? file : file.id;
  return `${env.directusUrl}/assets/${fileId}`;
}

const avatarUrl = computed(() => {
  const avatar = profile.value?.avatar;
  if (!avatar) return DEFAULT_AVATAR;
  try {
    return buildAssetUrl(avatar);
  } catch (error) {
    console.warn('[profile] failed to resolve avatar url', error);
    return DEFAULT_AVATAR;
  }
});

async function goToLogin() {
  try {
    await uni.navigateTo({ url: '/pages/profile/login' });
  } catch (error: any) {
    uni.showToast({ title: error?.message || '无法跳转到登录页', icon: 'none' });
  }
}

async function goToRegister() {
  try {
    await uni.navigateTo({ url: '/pages/profile/register' });
  } catch (error: any) {
    uni.showToast({ title: error?.message || '无法跳转到注册页', icon: 'none' });
  }
}

async function handleLogout() {
  const { confirm } = await uni.showModal({
    title: '确认退出登录',
    content: '退出后将无法查看个人资料，确定继续吗？'
  });

  if (!confirm) return;

  await userStore.logout();
  uni.showToast({ title: '已退出登录', icon: 'success' });
  await uni.switchTab({ url: '/pages/profile/profile' });
}

</script>

<template>
  <view class="profile-page">
    <up-card v-if="isLoggedIn" :showHead="false" :border="false" class="profile-card">
      <template #body>
        <view class="user-section">
          <up-avatar :src="avatarUrl" size="120" shape="circle" />
          <view class="user-meta">
            <text class="user-name">{{ displayName }}</text>
            <text class="user-contact">{{ contactInfo }}</text>
          </view>
        </view>

        <up-divider margin="32rpx 0" />

        <up-cell-group>
          <up-cell title="所属小区" :value="communityName" icon="home" />
          <up-cell title="所属楼栋" :value="buildingName" icon="building" />
          <up-cell title="用户类型" :value="userTypeLabel" icon="account" />
        </up-cell-group>

        <up-button
          class="logout-button"
          text="退出登录"
          type="error"
          shape="circle"
          plain
          @click="handleLogout"
        />

      </template>
    </up-card>

    <up-card v-else :showHead="false" :border="false" class="welcome-card">
      <template #body>
        <view class="welcome-section">
          <up-avatar :src="DEFAULT_AVATAR" size="140" shape="circle" />
          <text class="welcome-title">欢迎使用 BetterHome</text>
          <text class="welcome-subtitle">登录或注册后即可查看个人资料与社区内容</text>
        </view>
        <view class="action-buttons">
          <up-button
            type="primary"
            shape="circle"
            :loading="loading"
            text="登录"
            @click="goToLogin"
          />
          <up-button
            type="success"
            shape="circle"
            plain
            text="注册"
            @click="goToRegister"
          />
        </view>
      </template>
    </up-card>
  </view>
</template>

<style lang="scss" scoped>
.profile-page {
  min-height: 100vh;
  padding: 32rpx;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
  gap: 32rpx;
}

.profile-card,
.welcome-card {
  border-radius: 24rpx;
  box-shadow: 0 12rpx 36rpx rgba(0, 0, 0, 0.08);
}

.user-section {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.user-meta {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.user-name {
  font-size: 34rpx;
  font-weight: 600;
  color: #222;
}

.user-contact {
  font-size: 26rpx;
  color: #666;
}

.welcome-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 16rpx;
  padding: 20rpx 0;
}

.welcome-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #1aa86c;
}

.welcome-subtitle {
  font-size: 26rpx;
  color: #666;
}

.action-buttons {
  margin-top: 32rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.logout-button {
  margin-top: 32rpx;
}


</style>
