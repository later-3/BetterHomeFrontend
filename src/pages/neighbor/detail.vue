<template>
  <view class="detail-page">
    <!-- 区域1：显示原始卡片 -->
    <view class="original-card-section">
      <div v-if="selectedPost" class="post-card">
        <div class="post-header">
          <div class="user-info">
            <!-- 显示用户头像，如果有的话 -->
            <div class="avatar">
              <img
                v-if="selectedPost.user.avatar"
                :src="selectedPost.user.avatar"
                class="avatar-image"
                alt="用户头像"
              />
              <div v-else class="avatar-placeholder">👤</div>
            </div>
            <div class="user-details">
              <div class="user-name-time">
                <span class="user-name">{{ selectedPost.user.name }}</span>
                <span class="post-time">• {{ selectedPost.user.time }}</span>
              </div>
              <div class="user-title">{{ selectedPost.user.title }}</div>
            </div>
          </div>
          <div class="more-options">⋯</div>
        </div>

        <div class="post-content">
          {{ selectedPost.content }}
        </div>

        <!-- 图片展示 -->
        <div v-if="selectedPost.type === 'image' && selectedPost.images" class="post-images">
          <div class="image-grid">
            <div
              v-for="(image, index) in selectedPost.images.slice(0, 2)"
              :key="index"
              class="image-item"
            >
              <img
                v-if="image"
                :src="image"
                class="actual-image"
                alt="社交动态图片"
              />
              <div v-else class="image-placeholder">📷</div>
            </div>
          </div>
        </div>

        <div class="post-actions">
          <div class="action-group">
            <div class="action-item">
              <span class="action-icon">❤️</span>
              <span class="action-count">{{ selectedPost.likes }}</span>
            </div>
            <div class="action-item">
              <span class="action-icon">💬</span>
              <span class="action-count">{{ selectedPost.comments }}</span>
            </div>
          </div>
          <div class="share-group">
            <span class="share-icon">📤</span>
            <span class="bookmark-icon">🔖</span>
          </div>
        </div>
      </div>
    </view>
    
    <!-- 区域2：评论调试区域 -->
    <view class="detail-ui-section">
      <view class="simple-text">评论调试专区（区域二）</view>

      <view class="comment-debug-panel">
        <view class="debug-row">
          <button class="debug-btn" :disabled="commentLoading" @click="fetchComments">
            {{ commentLoading ? '获取中...' : '获取评论' }}
          </button>
          <view class="content-id-text">内容 ID：{{ contentId || '未传入' }}</view>
        </view>

        <view class="debug-block">
          <view class="debug-block__header">
            <text class="debug-block__title">请求（GET）</text>
            <button class="copy-btn" :disabled="!requestPreview" @click="copyText(requestPreview)">复制</button>
          </view>
          <textarea
            class="debug-textarea"
            readonly
            :value="requestPreview"
            placeholder="点击上方按钮生成请求信息"
          ></textarea>
        </view>

        <view class="debug-block">
          <view class="debug-block__header">
            <text class="debug-block__title">响应内容</text>
            <button class="copy-btn" :disabled="!responseText" @click="copyText(responseText)">复制</button>
          </view>
          <textarea
            class="debug-textarea"
            readonly
            :value="responseText"
            placeholder="尚未获取到评论数据"
          ></textarea>
        </view>

        <view class="debug-block" v-if="errorText">
          <view class="debug-block__header error">
            <text class="debug-block__title">错误信息</text>
            <button class="copy-btn" @click="copyText(errorText)">复制</button>
          </view>
          <textarea class="debug-textarea error" readonly :value="errorText"></textarea>
        </view>
      </view>

      <view class="comment-list" v-if="commentsList.length">
        <view class="comment-title">评论列表（{{ commentsList.length }}）</view>
        <view
          class="comment-item"
          v-for="item in commentsList"
          :key="item.id"
        >
          <view class="comment-header">
            <view class="comment-avatar">
              <image
                v-if="item.author && getAuthorAvatar(item.author)"
                class="comment-avatar__img"
                :src="getAuthorAvatar(item.author)"
                mode="aspectFill"
              />
              <view v-else class="comment-avatar__placeholder">👤</view>
            </view>
            <view class="comment-meta">
              <view class="comment-author">{{ getAuthorName(item.author) }}</view>
              <view class="comment-time">{{ formatDate(item.date_created) }}</view>
            </view>
          </view>

          <view v-if="item.text" class="comment-text">{{ item.text }}</view>

          <view v-if="item.attachments?.length" class="comment-media">
            <view
              v-for="(att, idx) in item.attachments"
              :key="`${item.id}-${att.id || idx}`"
              class="comment-media__item"
            >
              <image
                v-if="isImage(att)"
                class="comment-media__img"
                :src="getAssetUrl(att.fileId)"
                mode="aspectFill"
                @click="previewImage(getAssetUrl(att.fileId))"
              />
                <video
                  v-else-if="isVideo(att)"
                  class="comment-media__video"
                  controls
                  :src="getAssetUrl(att.fileId)"
                ></video>
                <AudioPlayer
                  v-else-if="isAudio(att)"
                  class="comment-media__audio"
                  :src="getAssetUrl(att.fileId)"
                  :title="att.title || att.filename || '音频附件'"
                />
              <view v-else class="comment-media__unknown">
                不支持的附件：{{ att.filename || att.fileId }}
              </view>
            </view>
          </view>
        </view>
      </view>

      <view v-else-if="responseText && !commentLoading" class="comment-empty">
        暂无评论
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { storeToRefs } from 'pinia';
import { useUserStore } from '@/store/user';
import { mapCommentsResponse } from '@/services/comments/adapter';
import type { CommentAttachment, CommentAuthor, CommentEntity } from '@/services/comments/types';
import AudioPlayer from '@/components/AudioPlayer.vue';

// 页面参数
const contentId = ref('');
const selectedPost = ref<any>(null);

// 模拟的posts数据存储（实际应该从全局状态或API获取）
const allPosts = ref<any[]>([]);

// 评论调试相关状态
const apiBaseUrl = ref('/api');
const commentLoading = ref(false);
const requestPreview = ref('');
const responseText = ref('');
const errorText = ref('');

const userStore = useUserStore();
const { token } = storeToRefs(userStore);
const commentsList = ref<CommentEntity[]>([]);

// 页面加载时接收参数
onLoad((query: any) => {
  console.log('详情页接收到的参数:', query);
  contentId.value = query.contentId || '';

  // 从localStorage或其他方式获取posts数据
  loadPostsData();

  // 根据contentId找到对应的post
  findSelectedPost();
});

// 加载posts数据（临时方案，实际应该从全局状态管理获取）
function loadPostsData() {
  try {
    // 尝试从localStorage获取socialFeedPosts数据
    const storedPosts = uni.getStorageSync('temp_social_posts');
    if (storedPosts) {
      allPosts.value = JSON.parse(storedPosts);
      console.log('从localStorage加载posts数据:', allPosts.value.length);
    }
  } catch (error) {
    console.error('加载posts数据失败:', error);
  }
}

// 根据contentId找到选中的post
function findSelectedPost() {
  if (!contentId.value || !allPosts.value.length) {
    console.warn('无法找到对应的post数据');
    return;
  }

  selectedPost.value = allPosts.value.find(post => String(post.id) === String(contentId.value));

  if (!selectedPost.value) {
    console.error('未找到对应的post:', contentId.value);
    // 可以显示错误提示或返回上一页
  } else {
    console.log('找到选中的post:', selectedPost.value);
  }
}

// 返回上一页
function goBack() {
  uni.navigateBack();
}

onMounted(() => {
  console.log('详情页加载完成');
});

function ensureContentId(): string {
  if (!contentId.value) {
    errorText.value = '未获取到内容 ID，无法请求评论。';
    uni.showToast({ title: '缺少内容 ID', icon: 'none' });
    return '';
  }
  return contentId.value;
}

async function fetchComments() {
  errorText.value = '';
  commentsList.value = [];
  responseText.value = '';
  const id = ensureContentId();
  if (!id) return;

  if (!token.value) {
    errorText.value = '未登录或缺少访问令牌，请先登录。';
    uni.showToast({ title: '缺少 token', icon: 'none' });
    return;
  }

  const url = `${apiBaseUrl.value}/items/comments`;
  const requestData = {
    filter: {
      content_id: { _eq: id }
    },
    fields:
      'id,text,like_count,unlike_count,replies_count,date_created,user_created,author_id.id,author_id.first_name,author_id.last_name,author_id.avatar,attachments.id,attachments.directus_files_id.id,attachments.directus_files_id.type,attachments.directus_files_id.filename_download,attachments.directus_files_id.title',
    sort: '-date_created'
  };

  requestPreview.value = JSON.stringify(
    {
      method: 'GET',
      url,
      params: requestData,
      headers: { Authorization: `Bearer ${token.value}` }
    },
    null,
    2
  );

  commentLoading.value = true;
  try {
    const res: any = await uni.request({
      url,
      method: 'GET',
      data: requestData,
      header: {
        Authorization: `Bearer ${token.value}`,
        'Content-Type': 'application/json'
      }
    });

    if (res.statusCode >= 200 && res.statusCode < 300) {
      responseText.value = JSON.stringify(res.data, null, 2);
      commentsList.value = mapCommentsResponse(res.data?.data);
      if (!res.data?.data || res.data.data.length === 0) {
        uni.showToast({ title: '暂无评论', icon: 'none' });
      } else {
        uni.showToast({ title: '获取成功', icon: 'success' });
      }
    } else {
      throw new Error(
        `HTTP ${res.statusCode}: ${typeof res.data === 'string' ? res.data : JSON.stringify(res.data)}`
      );
    }
  } catch (err: any) {
    const message = err?.message || JSON.stringify(err);
    errorText.value = `请求失败：${message}`;
    uni.showToast({ title: '请求失败', icon: 'error' });
  } finally {
    commentLoading.value = false;
  }
}

function copyText(text: string) {
  if (!text) {
    uni.showToast({ title: '无内容可复制', icon: 'none' });
    return;
  }
  uni.setClipboardData({
    data: text,
    success: () => uni.showToast({ title: '已复制', icon: 'success' }),
    fail: () => uni.showToast({ title: '复制失败', icon: 'error' })
  });
}

function getAuthorName(author: CommentAuthor | undefined) {
  if (!author) return '匿名用户';
  return author.name || '匿名用户';
}

function getAuthorAvatar(author: CommentAuthor | undefined) {
  if (!author) return '';
  return author.avatar || '';
}

function formatDate(value: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (num: number) => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

function getAssetUrl(fileId: string) {
  if (!fileId) return '';
  return `${apiBaseUrl.value}/assets/${fileId}?access_token=${token.value}`;
}

function isImage(att: CommentAttachment) {
  return att.type === 'image';
}

function isVideo(att: CommentAttachment) {
  return att.type === 'video';
}

function isAudio(att: CommentAttachment) {
  return att.type === 'audio';
}

function previewImage(url: string) {
  if (!url) return;
  uni.previewImage({ current: url, urls: [url], indicator: 'number' });
}
</script>

<style scoped>
.detail-page {
  width: 100%;
  background-color: #f5f5f5;
  min-height: 100vh;
}

/* 区域1：原始卡片样式（复制自SocialFeedContent组件） */
.original-card-section {
  background: white;
  border-bottom: 8px solid #f5f5f5;
}

.post-card {
  background: white;
  border-bottom: 0.5px solid #CCCDCF;
  padding: 16px;
  margin-bottom: 0;
  transition: background-color 0.2s ease;
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.user-info {
  display: flex;
  gap: 12px;
  flex: 1;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
  overflow: hidden;
  position: relative;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: white;
}

.user-details {
  flex: 1;
}

.user-name-time {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 2px;
}

.user-name {
  font-size: 16px;
  font-weight: 500;
  color: #00030F;
}

.post-time {
  font-size: 12px;
  color: #808187;
}

.user-title {
  font-size: 12px;
  color: #808187;
  line-height: 1.3;
}

.more-options {
  font-size: 16px;
  color: #808187;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.post-content {
  font-size: 14px;
  color: #00030F;
  line-height: 1.4;
  margin-bottom: 16px;
  white-space: pre-line;
}

.post-images {
  margin-bottom: 16px;
}

.image-grid {
  display: flex;
  gap: 8px;
  overflow-x: auto;
}

.image-item {
  width: 200px;
  height: 200px;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
  background: #F0F0F0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-placeholder {
  font-size: 48px;
  color: #CCCDCF;
}

.actual-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
}

.post-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-group {
  display: flex;
  gap: 24px;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.action-icon {
  font-size: 16px;
}

.action-count {
  font-size: 12px;
  color: #808187;
}

.share-group {
  display: flex;
  gap: 16px;
}

.share-icon, .bookmark-icon {
  font-size: 16px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

/* 区域2：评论调试 */
.detail-ui-section {
  background: white;
  padding: 24px 16px 48px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.simple-text {
  font-size: 18px;
  color: #1f2937;
  font-weight: 600;
}

.comment-debug-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.debug-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.debug-btn {
  padding: 8px 18px;
  background: linear-gradient(135deg, #34c759 0%, #2aa568 100%);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
}

.debug-btn:disabled {
  opacity: 0.7;
}

.content-id-text {
  font-size: 13px;
  color: #4b5563;
}

.debug-block {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.debug-block__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.debug-block__header.error {
  color: #c0392b;
}

.debug-block__title {
  font-size: 14px;
  font-weight: 600;
}

.copy-btn {
  padding: 4px 12px;
  font-size: 12px;
  border: none;
  border-radius: 4px;
  background: #e5edff;
  color: #1f2a62;
}

.copy-btn:disabled {
  opacity: 0.5;
}

.debug-textarea {
  width: 100%;
  min-height: 110px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 6px;
  padding: 8px;
  font-family: Menlo, Consolas, monospace;
  font-size: 12px;
  background: white;
  color: #1f2937;
}

.debug-textarea.error {
  border-color: #e74c3c;
  color: #c0392b;
  background: #fff5f3;
}

.comment-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 16px;
}

.comment-item {
  padding: 16px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 12px;
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

.comment-media__img,
.comment-media__video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.comment-media__audio {
  width: 100%;
  display: block;
}

.comment-media__unknown {
  font-size: 12px;
  text-align: center;
  padding: 8px;
  color: #555;
}

.comment-empty {
  margin-top: 16px;
  font-size: 14px;
  color: #6b7280;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .post-card {
    padding: 12px;
  }
  
  .image-item {
    width: 150px;
    height: 150px;
  }
  
  .action-group {
    gap: 16px;
  }
}

@media (max-width: 480px) {
  .post-card {
    padding: 8px;
  }
  
  .image-item {
    width: 120px;
    height: 120px;
  }
  
  .user-name {
    font-size: 14px;
  }
  
  .post-content {
    font-size: 13px;
  }
}
</style>
