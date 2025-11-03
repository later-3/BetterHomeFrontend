<script setup lang="ts">
import RichCommentItem from "@/components/RichCommentItem.vue";
import AudioPlayer from "@/components/AudioPlayer.vue";

interface DebugComment {
  id: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    verified: boolean;
  };
  content: string;
  created_at: string;
  likes_count: number;
  replies_count: number;
  is_liked: boolean;
}

const DEFAULT_IMAGE_URL = "https://picsum.photos/800/480?image=1050";
const DEFAULT_VIDEO_URL =
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";
const LOCAL_VIDEO_URL = DEFAULT_VIDEO_URL;

const baseCommentShell = (id: string, name: string): DebugComment => ({
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

const commentVideoSample: DebugComment = {
  ...baseCommentShell("comment-debug-video", "公告管理员"),
  content: `
    <p>🎞️ 评论组件视频展示：</p>
    <video controls src="${DEFAULT_VIDEO_URL}" poster="${DEFAULT_IMAGE_URL}"></video>
    <p>点击右下角可放大全屏，验证组件媒体集成效果。</p>
  `,
};

const commentLocalVideoSample: DebugComment = {
  ...baseCommentShell("comment-debug-local-video", "物业管理员"),
  content: `
    <p>📁 本地视频 (ui/comment/1.mp4) 验证：</p>
    <video controls src="${LOCAL_VIDEO_URL}" poster="${DEFAULT_IMAGE_URL}"></video>
  `,
};

const commentImageSample: DebugComment = {
  ...baseCommentShell("comment-debug-image", "摄影达人工具人"),
  content: `
    <p>📷 评论组件图片展示：</p>
    <img src="${DEFAULT_IMAGE_URL}" alt="示例图片" />
    <p>点击图片可预览，验证组件内图片展示效果。</p>
  `,
};

function previewImage(url: string) {
  uni.previewImage({ current: url, urls: [url], indicator: "number" });
}
</script>

<template>
  <view class="page-container">
    <view class="header">
      <text class="title">评论调试页</text>
      <text class="subtitle">验证评论组件媒体能力</text>
    </view>

    <view class="section">
      <text class="section-title">原生媒体基础示例</text>
      <view class="media-card" @click="previewImage(DEFAULT_IMAGE_URL)">
        <text class="label">图片</text>
        <view class="image-wrapper">
          <image
            class="preview-image"
            :src="DEFAULT_IMAGE_URL"
            mode="aspectFill"
          />
        </view>
      </view>
      <view class="media-card">
        <text class="label">视频</text>
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

    <view class="section">
      <text class="section-title">AudioPlayer 组件测试</text>
      <AudioPlayer
        src="https://www.w3schools.com/html/horse.mp3"
        title="🎵 自定义音频播放器"
      />
    </view>

    <view class="section">
      <text class="section-title">评论组件媒体展示</text>
      <view class="comment-list">
        <RichCommentItem :comment="commentVideoSample" />
        <RichCommentItem :comment="commentLocalVideoSample" />
        <RichCommentItem :comment="commentImageSample" />
      </view>
    </view>
  </view>
</template>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 20px;
  background-color: #f5f5f5;
}

.header {
  margin-bottom: 24px;
  text-align: center;
}

.title {
  display: block;
  margin-bottom: 6px;
  font-weight: 700;
  font-size: 24px;
  color: #1f2933;
}

.subtitle {
  display: block;
  font-size: 14px;
  color: #64748b;
}

.section {
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
  padding: 16px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  gap: 12px;
}

.section-title {
  font-weight: 600;
  font-size: 16px;
  color: #1f2933;
}

.media-card {
  display: flex;
  flex-direction: column;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid rgba(26, 168, 108, 0.12);
  background: #f9fafb;
  gap: 6px;
}

.label {
  font-weight: 600;
  font-size: 13px;
  color: #1aa86c;
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
  margin: 8px 0 0;
  width: 100%;
  min-height: 200px;
  border-radius: 8px;
  background: #000;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
