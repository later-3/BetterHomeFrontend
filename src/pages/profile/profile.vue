<script lang="ts" setup>
import { useInit } from '@/hooks/useInit';
import { usePageNavigation } from '@/hooks/useNavigation';
import { useErrorHandler } from '@/hooks/useErrorHandler';

const userStore = useStore('user');
const appStore = useStore('app');
const { navigationStore } = usePageNavigation('profile');

// 错误处理
const {
  hasError,
  errorMessage,
  isLoading,
  handlePageError: _handlePageError,
  safeAsync,
  safeSync,
  resetError
} = useErrorHandler({
  pageName: 'profile',
  enableErrorBoundary: true
});

// 用户信息
const _userInfo = computed(() => userStore.userInfo);
const isLoggedIn = computed(() => userStore.logged);
const userId = computed(() => userStore.userId);

// 系统信息
const systemInfo = computed(() => appStore.getSystemInfo());

// 设置选项
const settingsOptions = ref([
  {
    id: 'account',
    title: '账户设置',
    description: '修改个人信息',
    icon: '👤',
    action: 'account'
  },
  {
    id: 'notification',
    title: '通知设置',
    description: '管理通知偏好',
    icon: '🔔',
    action: 'notification'
  },
  {
    id: 'privacy',
    title: '隐私设置',
    description: '隐私和安全',
    icon: '🔒',
    action: 'privacy'
  },
  {
    id: 'about',
    title: '关于应用',
    description: '版本信息和帮助',
    icon: 'ℹ️',
    action: 'about'
  }
]);

// 功能入口
const functionEntries = ref([
  {
    id: 'favorites',
    title: '我的收藏',
    icon: '⭐',
    count: 12
  },
  {
    id: 'history',
    title: '浏览历史',
    icon: '📖',
    count: 25
  },
  {
    id: 'downloads',
    title: '我的下载',
    icon: '📥',
    count: 8
  }
]);

// 处理设置选项点击
function handleSettingClick(option: any) {
  safeSync(
    () => {
      console.log('设置选项点击:', option);
      uni.showToast({
        title: `${option.title}功能开发中`,
        icon: 'none'
      });
    },
    {
      fallbackMessage: `打开${option.title}失败，请重试`
    }
  );
}

// 处理功能入口点击
function handleFunctionClick(func: any) {
  safeSync(
    () => {
      console.log('功能入口点击:', func);
      uni.showToast({
        title: `${func.title}功能开发中`,
        icon: 'none'
      });
    },
    {
      fallbackMessage: `打开${func.title}失败，请重试`
    }
  );
}

// 退出登录
function handleLogout() {
  safeSync(
    () => {
      uni.showModal({
        title: '确认退出',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            // 这里可以调用退出登录的逻辑
            uni.showToast({
              title: '退出登录功能开发中',
              icon: 'none'
            });
          }
        }
      });
    },
    {
      fallbackMessage: '退出登录操作失败，请重试'
    }
  );
}

onMounted(async () => {
  await safeAsync(
    async () => {
      const { pageName, pagePath, pageQuery } = useInit();
      console.log(
        pageName,
        pagePath,
        pageQuery,
        'pageName,pagePath, pageQuery'
      );
      console.log(
        '个人中心页面加载完成，当前导航状态:',
        navigationStore.currentTab
      );
    },
    {
      fallbackMessage: '个人中心页面加载失败，请刷新重试'
    }
  );
});
</script>

<template>
  <view class="profile-container">
    <!-- 错误状态显示 -->
    <view v-if="hasError" class="error-container">
      <view class="error-icon">⚠️</view>
      <view class="error-message">{{ errorMessage }}</view>
      <button class="retry-btn" @click="resetError">重试</button>
    </view>

    <!-- 加载状态 -->
    <view v-else-if="isLoading" class="loading-container">
      <view class="loading-spinner"></view>
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 正常内容 -->
    <template v-else>
      <!-- 用户信息头部 -->
      <view class="user-header">
        <view class="user-avatar">
          <image class="avatar-img" src="/static/logo.png" />
        </view>
        <view class="user-info">
          <view class="user-name">
            {{ isLoggedIn ? `用户 ${userId}` : '未登录用户' }}
          </view>
          <view class="user-status">
            {{ isLoggedIn ? '已登录' : '点击登录' }}
          </view>
        </view>
        <view class="user-actions">
          <text class="edit-btn">编辑</text>
        </view>
      </view>

      <!-- 功能入口 -->
      <view class="function-section">
        <view class="section-title">我的功能</view>
        <view class="function-grid">
          <view
            v-for="func in functionEntries"
            :key="func.id"
            class="function-item"
            @click="handleFunctionClick(func)"
          >
            <view class="function-icon">{{ func.icon }}</view>
            <view class="function-info">
              <text class="function-title">{{ func.title }}</text>
              <text class="function-count">{{ func.count }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 设置选项 -->
      <view class="settings-section">
        <view class="section-title">设置</view>
        <view class="settings-list">
          <view
            v-for="option in settingsOptions"
            :key="option.id"
            class="setting-item"
            @click="handleSettingClick(option)"
          >
            <view class="setting-icon">{{ option.icon }}</view>
            <view class="setting-info">
              <text class="setting-title">{{ option.title }}</text>
              <text class="setting-desc">{{ option.description }}</text>
            </view>
            <view class="setting-arrow">›</view>
          </view>
        </view>
      </view>

      <!-- 系统信息 -->
      <view class="system-info">
        <text class="info-text">设备: {{ systemInfo.model }}</text>
        <text class="info-text">系统: {{ systemInfo.system }}</text>
        <text class="info-text">版本: v1.0.0</text>
      </view>

      <!-- 退出登录 -->
      <view v-if="isLoggedIn" class="logout-section">
        <button class="logout-btn" @click="handleLogout">退出登录</button>
      </view>
    </template>
  </view>
</template>

<style lang="scss" scoped>
.profile-container {
  padding-bottom: 40rpx;
  min-height: 100vh;
  background: #f5f5f5;
}

// 用户信息头部
.user-header {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
  padding: 40rpx 30rpx;
  background: #fff;
  .user-avatar {
    margin-right: 24rpx;
    .avatar-img {
      border: 4rpx solid #f0f0f0;
      border-radius: 60rpx;
      width: 120rpx;
      height: 120rpx;
    }
  }
  .user-info {
    flex: 1;
    .user-name {
      margin-bottom: 8rpx;
      font-weight: 600;
      font-size: 32rpx;
      color: #333;
    }
    .user-status {
      font-size: 24rpx;
      color: #999;
    }
  }
  .user-actions {
    .edit-btn {
      padding: 12rpx 24rpx;
      border: 2rpx solid #1aa86c;
      border-radius: 20rpx;
      font-size: 28rpx;
      color: #1aa86c;
    }
  }
}

// 功能入口
.function-section {
  margin-bottom: 20rpx;
  .section-title {
    padding: 20rpx 30rpx 16rpx;
    font-weight: 600;
    font-size: 28rpx;
    color: #333;
  }
  .function-grid {
    display: flex;
    justify-content: space-around;
    padding: 20rpx 30rpx;
    background: #fff;
  }
  .function-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20rpx;
    border-radius: 12rpx;
    transition: background 0.3s ease;
    &:active {
      background: #f5f5f5;
    }
    .function-icon {
      margin-bottom: 12rpx;
      font-size: 48rpx;
    }
    .function-info {
      text-align: center;
      .function-title {
        display: block;
        margin-bottom: 4rpx;
        font-size: 24rpx;
        color: #333;
      }
      .function-count {
        display: block;
        font-weight: 500;
        font-size: 20rpx;
        color: #1aa86c;
      }
    }
  }
}

// 设置选项
.settings-section {
  margin-bottom: 20rpx;
  .section-title {
    padding: 20rpx 30rpx 16rpx;
    font-weight: 600;
    font-size: 28rpx;
    color: #333;
  }
  .settings-list {
    background: #fff;
  }
  .setting-item {
    display: flex;
    align-items: center;
    padding: 30rpx;
    border-bottom: 1rpx solid #f0f0f0;
    transition: background 0.3s ease;
    &:last-child {
      border-bottom: none;
    }
    &:active {
      background: #f5f5f5;
    }
    .setting-icon {
      margin-right: 24rpx;
      font-size: 40rpx;
    }
    .setting-info {
      flex: 1;
      .setting-title {
        display: block;
        margin-bottom: 6rpx;
        font-size: 28rpx;
        color: #333;
      }
      .setting-desc {
        display: block;
        font-size: 24rpx;
        color: #999;
      }
    }
    .setting-arrow {
      font-weight: 300;
      font-size: 32rpx;
      color: #ccc;
    }
  }
}

// 系统信息
.system-info {
  margin-bottom: 20rpx;
  padding: 30rpx;
  background: #fff;
  .info-text {
    display: block;
    margin-bottom: 8rpx;
    font-size: 24rpx;
    color: #666;
    &:last-child {
      margin-bottom: 0;
    }
  }
}

// 退出登录
.logout-section {
  padding: 0 30rpx;
  .logout-btn {
    border: none;
    border-radius: 12rpx;
    width: 100%;
    height: 88rpx;
    background: #ff4757;
    font-weight: 500;
    font-size: 28rpx;
    color: #fff;
    &:active {
      background: #ff3742;
    }
  }
}

// 错误状态样式
.error-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40rpx;
  min-height: 60vh;
  .error-icon {
    margin-bottom: 30rpx;
    font-size: 120rpx;
  }
  .error-message {
    margin-bottom: 40rpx;
    line-height: 1.5;
    text-align: center;
    font-size: 28rpx;
    color: #666;
  }
  .retry-btn {
    padding: 20rpx 40rpx;
    border: none;
    border-radius: 12rpx;
    background: #1aa86c;
    font-size: 28rpx;
    color: #fff;
    &:active {
      background: #168f5a;
    }
  }
}

// 加载状态样式
.loading-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  .loading-spinner {
    margin-bottom: 30rpx;
    border: 4rpx solid #f3f3f3;
    border-top: 4rpx solid #1aa86c;
    border-radius: 50%;
    width: 60rpx;
    height: 60rpx;
    animation: spin 1s linear infinite;
  }
  .loading-text {
    font-size: 28rpx;
    color: #666;
  }
}
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
