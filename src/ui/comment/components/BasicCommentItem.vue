<template>
  <view class="comment-item">
    <view class="comment-header">
      <view class="comment-author">
        <image
          v-if="comment.author?.avatar"
          :src="resolveAssetUrl(comment.author.avatar)"
          class="avatar"
        />
        <view v-else class="avatar-placeholder">👤</view>
        <text class="author-name">{{ comment.author?.name || '匿名用户' }}</text>
      </view>
      <text class="comment-time">{{ formatTime(comment.createdAt) }}</text>
    </view>

    <view class="comment-content">
      <text>{{ comment.text }}</text>
    </view>

    <view class="comment-actions">
      <view class="action-btn" @click="handleLike">
        <text :class="['action-icon', comment.myReaction === 'like' ? 'liked' : '']">
          {{ comment.myReaction === 'like' ? '❤️' : '🤍' }}
        </text>
        <text class="action-count">{{ comment.likeCount || 0 }}</text>
      </view>

      <view class="action-btn" @click="handleReply">
        <text class="action-icon">💬</text>
        <text class="action-count">{{ comment.replyCount || 0 }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { CommentEntity } from '@/services/comments/types';

interface Props {
  comment: CommentEntity;
  resolveAssetUrl: (fileId: string) => string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  like: [comment: CommentEntity];
  reply: [comment: CommentEntity];
}>();

function handleLike() {
  emit('like', props.comment);
}

function handleReply() {
  emit('reply', props.comment);
}

function formatTime(dateStr: string | undefined): string {
  if (!dateStr) return '';

  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;

  return date.toLocaleDateString('zh-CN');
}
</script>

<style scoped>
.comment-item {
  padding: 16px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.comment-author {
  display: flex;
  align-items: center;
  gap: 8px;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.avatar-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f0f0f0;
  font-size: 16px;
}

.author-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.comment-time {
  font-size: 12px;
  color: #999;
}

.comment-content {
  margin-bottom: 12px;
  line-height: 1.5;
  font-size: 14px;
  color: #333;
}

.comment-actions {
  display: flex;
  gap: 24px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.action-icon {
  font-size: 16px;
  transition: transform 0.2s;
}

.action-icon.liked {
  animation: like-bounce 0.3s ease;
}

.action-count {
  font-size: 12px;
  color: #666;
}

@keyframes like-bounce {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
}
</style>
