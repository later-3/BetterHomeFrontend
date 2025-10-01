<script setup lang="ts">
/**
 * 公告页面
 * 用于展示社区公告和通知相关功能
 *
 * 同时作为原生图片/视频与评论组件的预览调试场景
 */

import { onMounted } from "vue";
import { useNavigation } from "@/hooks/useNavigation";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import UserStatusCard from "../../components/UserStatusCard.vue";
import RichCommentItem from "@/components/RichCommentItem.vue";
import AudioPlayer from "@/components/AudioPlayer.vue";

const DEFAULT_IMAGE_URL = "https://picsum.photos/800/480?image=1050";
const DEFAULT_VIDEO_URL =
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";
const LOCAL_VIDEO_URL = DEFAULT_VIDEO_URL;

const baseCommentShell = (id: string, name: string) => ({
  id,
  author: {
    id,
    name,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
      name
    )}`,
    verified: true,
  },
  content: "",
  created_at: new Date().toISOString(),
  likes_count: 0,
  replies_count: 0,
  is_liked: false,
});

const commentVideoSample = {
  ...baseCommentShell("notice-comment-video", "公告管理员"),
  content: `
    <p>🎞️ 评论组件视频展示：</p>
    <video controls src="${DEFAULT_VIDEO_URL}" poster="${DEFAULT_IMAGE_URL}"></video>
    <p>点击右下角可放大全屏，验证组件媒体集成效果。</p>
  `,
};

const commentLocalVideoSample = {
  ...baseCommentShell("notice-comment-local-video", "物业管理员"),
  content: `
    <p>📁 本地视频 (ui/comment/1.mp4) 验证：</p>
    <video controls src="${LOCAL_VIDEO_URL}" poster="${DEFAULT_IMAGE_URL}"></video>
  `,
};

const commentImageSample = {
  ...baseCommentShell("notice-comment-image", "摄影达人工具人"),
  content: `
    <p>📷 评论组件图片展示：</p>
    <img src="${DEFAULT_IMAGE_URL}" alt="示例图片" />
    <p>点击图片可预览，验证组件内图片展示效果。</p>
  `,
};

function previewImage(url: string) {
  uni.previewImage({ current: url, urls: [url], indicator: "number" });
}

// 页面导航和错误处理
const { initPageNavigation } = useNavigation();
const { handlePageError } = useErrorHandler({ pageName: "公告" });

onMounted(() => {
  try {
    initPageNavigation("notice");
  } catch (error) {
    handlePageError(error as Error, {
      fallbackMessage: "公告页面初始化失败",
    });
  }
});
</script>

<template>
  <view class="page-container">
    <!-- 用户状态显示 -->
    <UserStatusCard theme="orange" />

    <view class="header">
      <text class="title">公告</text>
      <text class="subtitle">社区公告通知</text>
    </view>

    <view class="content">
      <view class="placeholder-card">
        <text class="placeholder-text">功能开发中...</text>
        <text class="description">这里将展示社区公告和通知</text>
      </view>

      <view class="test-section">
        <text class="test-title">原生媒体基础示例</text>
        <view class="rich-block" @click="previewImage(DEFAULT_IMAGE_URL)">
          <text class="rich-label">图片</text>
          <view class="image-wrapper">
            <image
              class="preview-image"
              :src="DEFAULT_IMAGE_URL"
              mode="aspectFill"
            />
          </view>
        </view>
        <view class="rich-block">
          <text class="rich-label">视频</text>
          <video
            class="basic-video"
            controls
            :poster="DEFAULT_IMAGE_URL"
            :src="DEFAULT_VIDEO_URL"
          >
            您的设备暂不支持 video 标签
          </video>
        </view>
      </view>

      <view class="test-section">
        <text class="test-title">AudioPlayer 组件测试</text>
        <AudioPlayer
          src="https://www.w3schools.com/html/horse.mp3"
          title="🎵 自定义音频播放器"
        />
      </view>

      <view class="test-section">
        <text class="test-title">评论组件媒体展示</text>
        <view class="comment-demo">
          <RichCommentItem :comment="commentVideoSample" />
          <RichCommentItem :comment="commentLocalVideoSample" />
          <RichCommentItem :comment="commentImageSample" />
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.page-container {
  padding: 20px;
  padding-bottom: 70px;
  min-height: 100vh;
  background-color: #f5f5f5;
}
.header {
  margin-bottom: 30px;
  text-align: center;
}
.title {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  font-size: 28px;
  color: #333;
}
.subtitle {
  display: block;
  font-size: 16px;
  color: #666;
}
.content {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 20px;
}
.placeholder-card {
  padding: 40px 20px;
  border-radius: 12px;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}
.placeholder-text {
  display: block;
  margin-bottom: 12px;
  font-size: 18px;
  color: #999;
}
.description {
  display: block;
  font-size: 14px;
  color: #ccc;
}
.test-section {
  display: flex;
  flex-direction: column;
  padding: 16px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  gap: 12px;
}
.test-title {
  font-weight: 600;
  font-size: 16px;
  color: #1f2933;
}
.rich-block {
  display: flex;
  flex-direction: column;
  padding: 12px;
  border: 1px solid rgba(26, 168, 108, 0.12);
  border-radius: 10px;
  background: #f9fafb;
  gap: 6px;
}
.rich-label {
  font-weight: 600;
  font-size: 13px;
  color: #1aa86c;
}
.rich-content {
  font-size: 14px;
}
.image-wrapper {
  overflow: hidden;
  border-radius: 8px;
}
.preview-image {
  width: 100%;
  height: 200px;
}
.basic-video {
  margin: 8px 0;
  border-radius: 8px;
  width: 100%;
  min-height: 200px;
  background: #000;
}
.comment-demo {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.stub-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 16px;
  background: rgba(26, 168, 108, 0.12);
  font-size: 12px;
  color: #1aa86c;
}
</style>
