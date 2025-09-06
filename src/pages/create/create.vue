<script setup lang="ts">
import { reactive, ref } from "vue";
import { usePageNavigation } from "@/hooks/useNavigation";
import { useErrorHandler } from "@/hooks/useErrorHandler";

// 创建选项接口定义
interface CreateOption {
  id: string;
  title: string;
  description: string;
  icon: string;
  action: string;
}

// 错误处理
const {
  hasError,
  errorMessage,
  isLoading,
  handlePageError: _handlePageError,
  safeAsync,
  safeSync,
  resetError,
} = useErrorHandler({
  pageName: "create",
  enableErrorBoundary: true,
});

// 页面状态
const pageState = reactive({
  title: "创建",
  selectedOption: null as string | null,
});

// 创建选项数据
const createOptions = ref<CreateOption[]>([
  {
    id: "text",
    title: "文本内容",
    description: "创建新的文本内容",
    icon: "📝",
    action: "createText",
  },
  {
    id: "image",
    title: "图片内容",
    description: "上传或创建图片内容",
    icon: "🖼️",
    action: "createImage",
  },
  {
    id: "video",
    title: "视频内容",
    description: "录制或上传视频内容",
    icon: "🎥",
    action: "createVideo",
  },
]);

// 处理创建选项点击
const handleOptionClick = (option: CreateOption) => {
  safeSync(
    () => {
      pageState.selectedOption = option.id;

      // 显示选择反馈
      uni.showToast({
        title: `选择了${option.title}`,
        icon: "success",
        duration: 1500,
      });

      // 这里可以根据不同的action执行不同的创建逻辑
      console.log(`执行创建操作: ${option.action}`);
    },
    {
      fallbackMessage: `选择${option.title}失败，请重试`,
    }
  );
};

// 页面导航状态管理
const { navigationStore } = usePageNavigation("create");

// 页面加载时的初始化
onMounted(async () => {
  await safeAsync(
    async () => {
      console.log(
        "创建页面加载完成，当前导航状态:",
        navigationStore.currentTab
      );
      // 这里可以添加页面初始化逻辑
    },
    {
      fallbackMessage: "创建页面加载失败，请刷新重试",
    }
  );
});
</script>

<template>
  <view class="create-container">
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
      <view class="header">
        <text class="title">{{ pageState.title }}</text>
        <text class="subtitle">选择要创建的内容类型</text>
      </view>

      <view class="options-list">
        <view
          v-for="option in createOptions"
          :key="option.id"
          class="option-item"
          :class="{ selected: pageState.selectedOption === option.id }"
          @click="handleOptionClick(option)"
        >
          <view class="option-icon">
            <text class="icon">{{ option.icon }}</text>
          </view>
          <view class="option-content">
            <text class="option-title">{{ option.title }}</text>
            <text class="option-description">{{ option.description }}</text>
          </view>
          <view class="option-arrow">
            <text class="arrow">></text>
          </view>
        </view>
      </view>
    </template>
  </view>
</template>

<style scoped lang="scss">
.create-container {
  box-sizing: border-box;
  padding: 0 32rpx;
  min-height: 100vh;
  background-color: #f8f9fa;
}
.header {
  padding: 60rpx 0 40rpx;
  text-align: center;
  .title {
    display: block;
    margin-bottom: 16rpx;
    font-weight: 600;
    font-size: 48rpx;
    color: #333;
  }
  .subtitle {
    display: block;
    line-height: 1.5;
    font-size: 28rpx;
    color: #666;
  }
}
.options-list {
  margin-top: 20rpx;
}
.option-item {
  display: flex;
  overflow: hidden;
  position: relative;
  align-items: center;
  margin-bottom: 16rpx;
  padding: 32rpx 24rpx;
  border-radius: 16rpx;
  background-color: #fff;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  &:active {
    background-color: #f5f5f5;
    transform: scale(0.98);
  }
  &.selected {
    border: 2rpx solid #1aa86c;
    background-color: #f0f9f4;
    .option-title {
      color: #1aa86c;
    }
  }
  &:last-child {
    margin-bottom: 0;
  }
}
.option-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
  margin-right: 24rpx;
  border-radius: 16rpx;
  width: 80rpx;
  height: 80rpx;
  background-color: #f8f9fa;
  .icon {
    line-height: 1;
    font-size: 40rpx;
  }
}
.option-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  .option-title {
    margin-bottom: 8rpx;
    line-height: 1.4;
    font-weight: 500;
    font-size: 32rpx;
    color: #333;
  }
  .option-description {
    line-height: 1.4;
    font-size: 26rpx;
    color: #666;
  }
}
.option-arrow {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
  width: 32rpx;
  height: 32rpx;
  .arrow {
    font-weight: bold;
    font-size: 28rpx;
    color: #ccc;
    transform: rotate(0deg);
    transition: transform 0.3s ease;
  }
}
.option-item:active .arrow {
  transform: rotate(90deg);
}
.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60rpx 0;
  text {
    font-size: 28rpx;
    color: #666;
  }
}
/* 响应式适配 */
@media screen and (max-width: 750rpx) {
  .create-container {
    padding: 0 24rpx;
  }
  .header {
    padding: 40rpx 0 30rpx;
    .title {
      font-size: 42rpx;
    }
    .subtitle {
      font-size: 26rpx;
    }
  }
  .option-item {
    padding: 28rpx 20rpx;
  }
  .option-icon {
    margin-right: 20rpx;
    width: 72rpx;
    height: 72rpx;
    .icon {
      font-size: 36rpx;
    }
  }
  .option-content {
    .option-title {
      font-size: 30rpx;
    }
    .option-description {
      font-size: 24rpx;
    }
  }
}
/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .create-container {
    background-color: #1a1a1a;
  }
  .header {
    .title {
      color: #fff;
    }
    .subtitle {
      color: #ccc;
    }
  }
  .option-item {
    background-color: #2a2a2a;
    box-shadow: 0 2rpx 8rpx rgba(255, 255, 255, 0.06);
    &:active {
      background-color: #3a3a3a;
    }
    &.selected {
      border-color: #1aa86c;
      background-color: #1a3a2a;
    }
  }
  .option-icon {
    background-color: #3a3a3a;
  }
  .option-content {
    .option-title {
      color: #fff;
    }
    .option-description {
      color: #ccc;
    }
  }
  .option-arrow .arrow {
    color: #666;
  }
  .loading text {
    color: #ccc;
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
