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
    
    <!-- 区域2：简单文本显示 -->
    <view class="detail-ui-section">
      <view class="simple-text">区域二</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

// 页面参数
const contentId = ref('');
const selectedPost = ref<any>(null);

// 模拟的posts数据存储（实际应该从全局状态或API获取）
const allPosts = ref<any[]>([]);

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

/* 区域2：简单文本显示区域 */
.detail-ui-section {
  background: white;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.simple-text {
  font-size: 18px;
  color: #808187;
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