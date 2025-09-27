<template>
  <view class="basic-comment-item">
    <view class="comment-header">
      <view class="comment-avatar">
        <image
          v-if="avatarUrl"
          class="comment-avatar__img"
          :src="avatarUrl"
          mode="aspectFill"
        />
        <view v-else class="comment-avatar__placeholder">👤</view>
      </view>
      <view class="comment-meta">
        <text class="comment-author">{{ authorName }}</text>
        <text class="comment-time">{{ createdAtText }}</text>
      </view>
    </view>

    <view v-if="comment.text" class="comment-text">
      {{ comment.text }}
    </view>

    <view v-if="comment.attachments.length" class="comment-media">
      <view
        v-for="(attachment, index) in comment.attachments"
        :key="attachment.id || `${comment.id}-${index}`"
        :class="['comment-media__item', mediaClass(attachment)]"
      >
        <image
          v-if="isImage(attachment)"
          class="comment-media__img"
          :src="resolveAttachmentUrl(attachment)"
          mode="aspectFill"
          @click="handleImagePreview(attachment)"
        />
        <video
          v-else-if="isVideo(attachment)"
          class="comment-media__video"
          :src="resolveAttachmentUrl(attachment)"
          controls
          playsinline
          webkit-playsinline
        ></video>
        <AudioPlayer
          v-else-if="isAudio(attachment)"
          class="comment-media__audio"
          :src="resolveAttachmentUrl(attachment)"
          :title="attachment.title || attachment.filename || '音频附件'"
        />
        <view v-else class="comment-media__unknown">
          不支持的附件 {{ attachment.filename || attachment.fileId }}
        </view>
      </view>
    </view>

    <view class="comment-actions">
      <view
        class="action-btn"
        :class="{ 'action-btn--active': comment.myReaction === 'like' }"
        @click="emitLike"
      >
        <text class="action-icon">{{ comment.myReaction === 'like' ? '♥' : '♡' }}</text>
        <text class="action-label">点赞</text>
        <text class="action-count">{{ comment.likeCount }}</text>
      </view>
      <view class="action-btn" @click="emitReply">
        <text class="action-icon">💬</text>
        <text class="action-label">回复</text>
        <text v-if="comment.replyCount" class="action-count">{{ comment.replyCount }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AudioPlayer from '@/components/AudioPlayer.vue';
import type { CommentAttachment, CommentEntity } from '@/services/comments/types';

const props = defineProps<{
  comment: CommentEntity;
  resolveAssetUrl?: (fileId: string) => string;
}>();

const emit = defineEmits<{
  (event: 'like', comment: CommentEntity): void;
  (event: 'reply', comment: CommentEntity): void;
}>();

const assetResolver = computed(() => props.resolveAssetUrl || ((id: string) => id));

const avatarUrl = computed(() => {
  const fileId = props.comment?.author?.avatar;
  return fileId ? assetResolver.value(fileId) : '';
});

const authorName = computed(() => props.comment?.author?.name || '匿名用户');

const createdAtText = computed(() => formatDate(props.comment?.createdAt));

function formatDate(value: string | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (num: number) => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

function resolveAttachmentUrl(attachment: CommentAttachment): string {
  return assetResolver.value(attachment.fileId);
}

function mediaClass(attachment: CommentAttachment) {
  if (isVideo(attachment)) return 'comment-media__item--video';
  if (isAudio(attachment)) return 'comment-media__item--audio';
  return '';
}

function isImage(attachment: CommentAttachment) {
  return attachment.type === 'image';
}

function isVideo(attachment: CommentAttachment) {
  return attachment.type === 'video';
}

function isAudio(attachment: CommentAttachment) {
  return attachment.type === 'audio';
}

function handleImagePreview(attachment: CommentAttachment) {
  const url = resolveAttachmentUrl(attachment);
  if (!url) return;
  if (typeof uni !== 'undefined' && typeof uni.previewImage === 'function') {
    uni.previewImage({ current: url, urls: [url], indicator: 'number' });
  } else if (typeof window !== 'undefined') {
    window.open(url, '_blank');
  }
}

function emitLike() {
  emit('like', props.comment);
}

function emitReply() {
  emit('reply', props.comment);
}
</script>

<style scoped>
.basic-comment-item {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.comment-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.comment-avatar__img {
  width: 100%;
  height: 100%;
}

.comment-avatar__placeholder {
  font-size: 16px;
}

.comment-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.comment-author {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.comment-time {
  font-size: 12px;
  color: #6b7280;
}

.comment-text {
  font-size: 14px;
  color: #1f2937;
  line-height: 1.5;
  white-space: pre-wrap;
}

.comment-media {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.comment-media__item {
  width: 140px;
  height: 140px;
  border-radius: 8px;
  overflow: hidden;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.comment-media__item--video {
  width: 260px;
  height: 146px;
  background: #000;
}

.comment-media__item--audio {
  width: 100%;
  background: transparent;
}

.comment-media__img,
.comment-media__video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.comment-media__audio {
  width: 100%;
}

.comment-media__unknown {
  font-size: 12px;
  text-align: center;
  padding: 8px;
  color: #555;
}

.comment-actions {
  display: flex;
  gap: 16px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #9ca3af;  /* 更明显的灰色 */
  transition: color 0.2s ease;  /* 添加过渡动画 */
}

.action-btn--active {
  color: #ef4444;  /* 更鲜艳的红色 */
  font-weight: 600;
}

.action-icon {
  font-size: 15px;
}

.action-label {
  font-weight: 500;
}

.action-count {
  font-size: 13px;
  color: #6b7280;
}
</style>
