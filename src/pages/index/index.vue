<script setup lang="ts">
import { useTitle } from '@/hooks/useTitle';
import { forward } from '@/utils/router';
import { useNavigation, usePageNavigation } from '@/hooks/useNavigation';
import { useErrorHandler } from '@/hooks/useErrorHandler';

const { title } = useTitle();
const { navigateToTab } = useNavigation();
const { navigationStore: _navigationStore } = usePageNavigation('index');

// 错误处理
const {
  hasError,
  errorMessage,
  isLoading,
  handlePageError: _handlePageError,
  handleNavigationError,
  safeAsync,
  resetError
} = useErrorHandler({
  pageName: 'index',
  enableErrorBoundary: true
});

// 主要功能入口数据
const mainFeatures = ref([
  {
    id: 'create',
    title: '快速创建',
    description: '创建新的内容',
    icon: '/static/icons/add.png',
    path: '/pages/create/create'
  },
  {
    id: 'profile',
    title: '个人中心',
    description: '查看个人信息',
    icon: '/static/icons/profile.png',
    path: '/pages/profile/profile'
  },
  {
    id: 'test',
    title: '功能测试',
    description: '测试应用功能',
    icon: '/static/logo.png',
    path: '/pages/test/test'
  }
]);

// 导航到功能页面
async function navigateToFeature(feature: any) {
  try {
    if (feature.id === 'create' || feature.id === 'profile') {
      // 使用导航composable进行tabBar页面导航
      await navigateToTab(feature.id);
    } else {
      // 使用 navigateTo 导航到普通页面
      forward(feature.id, {});
    }
  } catch (error) {
    handleNavigationError(
      error as Error,
      feature.path || `/pages/${feature.id}/${feature.id}`,
      {
        fallbackMessage: `无法打开${feature.title}，请重试`
      }
    );
  }
}

// 欢迎信息
const welcomeMessage = computed(() => {
  const hour = new Date().getHours();
  if (hour < 12) return '早上好';
  if (hour < 18) return '下午好';
  return '晚上好';
});

// 页面初始化
onMounted(async () => {
  await safeAsync(
    async () => {
      // 页面加载逻辑
      console.log('首页加载完成');
    },
    {
      fallbackMessage: '首页加载失败，请刷新重试'
    }
  );
});

// 页面导航状态已通过usePageNavigation自动处理
</script>

<template>
  <view class="content">
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
      <!-- 头部欢迎区域 -->
      <view class="header-section">
        <image class="logo" src="/static/logo.png" />
        <view class="welcome-area">
          <text class="welcome-text">{{ welcomeMessage }}！</text>
          <text class="app-title">{{ title }}</text>
        </view>
      </view>

      <!-- 主要功能入口 -->
      <view class="features-section">
        <view class="section-title">主要功能</view>
        <view class="features-grid">
          <view
            v-for="feature in mainFeatures"
            :key="feature.id"
            class="feature-item"
            @click="navigateToFeature(feature)"
          >
            <image class="feature-icon" :src="feature.icon" />
            <view class="feature-info">
              <text class="feature-title">{{ feature.title }}</text>
              <text class="feature-desc">{{ feature.description }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 快捷操作区域 -->
      <view class="quick-actions">
        <view class="section-title">快捷操作</view>
        <view class="action-buttons">
          <button
            class="action-btn primary"
            @click="navigateToFeature(mainFeatures[0])"
          >
            立即创建
          </button>
          <button
            class="action-btn secondary"
            @click="navigateToFeature(mainFeatures[1])"
          >
            个人中心
          </button>
        </view>
      </view>
    </template>
  </view>
</template>

<style scoped lang="scss">
.content {
  padding: 40rpx 30rpx;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

// 头部欢迎区域
.header-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 60rpx;
  .logo {
    margin-bottom: 30rpx;
    border-radius: 20rpx;
    width: 160rpx;
    height: 160rpx;
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
  }
  .welcome-area {
    text-align: center;
    .welcome-text {
      display: block;
      margin-bottom: 10rpx;
      font-weight: 500;
      font-size: 32rpx;
      color: #333;
    }
    .app-title {
      display: block;
      font-size: 28rpx;
      color: #666;
    }
  }
}

// 功能区域
.features-section {
  margin-bottom: 50rpx;
  .section-title {
    margin-bottom: 30rpx;
    padding-left: 10rpx;
    font-weight: 600;
    font-size: 32rpx;
    color: #333;
  }
  .features-grid {
    display: flex;
    flex-direction: column;
    gap: 20rpx;
  }
  .feature-item {
    display: flex;
    align-items: center;
    padding: 30rpx;
    border-radius: 16rpx;
    background: #fff;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
    &:active {
      box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
      transform: scale(0.98);
    }
    .feature-icon {
      margin-right: 24rpx;
      border-radius: 12rpx;
      width: 80rpx;
      height: 80rpx;
    }
    .feature-info {
      flex: 1;
      .feature-title {
        display: block;
        margin-bottom: 8rpx;
        font-weight: 500;
        font-size: 30rpx;
        color: #333;
      }
      .feature-desc {
        display: block;
        font-size: 24rpx;
        color: #999;
      }
    }
  }
}

// 快捷操作区域
.quick-actions {
  .section-title {
    margin-bottom: 30rpx;
    padding-left: 10rpx;
    font-weight: 600;
    font-size: 32rpx;
    color: #333;
  }
  .action-buttons {
    display: flex;
    gap: 20rpx;
  }
  .action-btn {
    flex: 1;
    border: none;
    border-radius: 12rpx;
    height: 88rpx;
    font-weight: 500;
    font-size: 28rpx;
    transition: all 0.3s ease;
    &.primary {
      background: #1aa86c;
      color: #fff;
      &:active {
        background: #168f5a;
      }
    }
    &.secondary {
      border: 2rpx solid #1aa86c;
      background: #fff;
      color: #1aa86c;
      &:active {
        background: #f0f9ff;
      }
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
