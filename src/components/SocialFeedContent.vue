<script setup lang="ts">
// import { computed, reactive, ref } from 'vue';
import { computed, type PropType } from 'vue';

interface User {
  name: string;
  title: string;
  avatar: string;
  time: string;
}

interface Post {
  id: number | string;
  user: User;
  content: string;
  type: 'text' | 'image' | 'video';
  images?: string[];
  likes: string | number;
  comments: string | number;
}

// Props接口 - 接收外部数据
const props = defineProps({
  externalPosts: {
    type: Array as PropType<Post[]>,
    default: () => []
  }
});

// 响应式数据
// const searchQuery = ref('');

// 模拟数据
/* const posts = reactive([
  {
    id: 1,
    user: {
      name: 'Stephen Smith',
      title: 'Software Developer | Boston University',
      avatar: '',
      time: '20 min'
    },
    content:
      '📚 Just conquered algorithms & data structures! 🎉 Time for a breather. Suggestions for a binge-worthy show? 🍿\n\n#StudyBreak #NetflixTime',
    likes: '1.6k',
    comments: '200',
    type: 'text'
  },
  {
    id: 2,
    user: {
      name: 'Alexander Cumins',
      title: 'Bachelor of Computer Science | Web Developer',
      avatar: '',
      time: '20 min'
    },
    content:
      '💻 Need some desk setup inspo?\n\n👀 Check out my cozy study corner! Loving the minimalist vibes and natural lighting.',
    likes: '1.6k',
    comments: '200',
    type: 'image',
    images: ['desk1.jpg', 'desk2.jpg']
  },
  {
    id: 3,
    user: {
      name: 'Emily Johnson',
      title: 'B.Sc. in CS | AI and ML',
      avatar: '',
      time: '10 min'
    },
    content:
      "📝 Just wrapped up my final project presentation! 🎓💼 Feeling a mix of relief and excitement for what's next. Cheers to the end of another semester! 🥂\n\n#StudentLife #FinalsDone #NextChapter",
    likes: '1.6k',
    comments: '200',
    type: 'text'
  },
  {
    id: 4,
    user: {
      name: 'Ashley Wong',
      title: 'B.Sc. in CS | Robotics and Control Systems',
      avatar: '',
      time: '10 min'
    },
    content:
      '🚀 Just wrapped up an exhilarating web development session!\n\nDelved into the intricacies of front-end frameworks and unleashed some creativity with CSS animations.',
    likes: '1.6k',
    comments: '200',
    type: 'video'
  }
]); */

// 计算属性：优先使用外部数据，如果没有就使用默认模拟数据
const displayPosts = computed(() => {
  return props.externalPosts.length > 0 ? props.externalPosts : [];
});

// 方法
const handleLike = (postId: any) => {
  console.log('Like post:', postId);
  uni.showToast({ title: `点赞了第 ${postId} 条动态！`, icon: 'success' });
};

const handleComment = (postId: any) => {
  console.log('Comment on post:', postId);
  uni.showToast({ title: `评论第 ${postId} 条动态！`, icon: 'none' });
};

const handleShare = (postId: any) => {
  console.log('Share post:', postId);
  uni.showToast({ title: `分享第 ${postId} 条动态！`, icon: 'none' });
};

const handleImageError = (image: string) => {
  console.log('图片加载失败:', image);
};

const handleImageLoad = (image: string) => {
  console.log('图片加载成功:', image);
};

const handleBookmark = (postId: any) => {
  console.log('Bookmark post:', postId);
  uni.showToast({ title: `收藏第 ${postId} 条动态！`, icon: 'none' });
};
</script>

<template>
  <div class="social-feed-content">
    <!-- 动态列表 -->
    <div class="feed-list">
      <!-- 动态渲染每个post -->
      <div v-for="post in displayPosts" :key="post.id" class="post-card">
        <div class="post-header">
          <div class="user-info">
            <!-- 显示用户头像，如果有的话 -->
            <div class="avatar">
              <img
                v-if="post.user.avatar"
                :src="post.user.avatar"
                class="avatar-image"
                alt="用户头像"
              />
              <div v-else class="avatar-placeholder">👤</div>
            </div>
            <div class="user-details">
              <div class="user-name-time">
                <span class="user-name">{{ post.user.name }}</span>
                <span class="post-time">• {{ post.user.time }}</span>
              </div>
              <div class="user-title">{{ post.user.title }}</div>
            </div>
          </div>
          <div class="more-options">⋯</div>
        </div>

        <div class="post-content">
          {{ post.content }}
        </div>

        <!-- 图片展示 -->
        <div v-if="post.type === 'image' && post.images" class="post-images">
          <div class="image-grid">
            <div
              v-for="(image, index) in post.images.slice(0, 2)"
              :key="index"
              class="image-item"
            >
              <!-- 尝试显示实际图片，失败则显示占位符 -->
              <img
                v-if="image"
                :src="image"
                class="actual-image"
                alt="社交动态图片"
                @error="handleImageError(image)"
                @load="handleImageLoad(image)"
              />
              <div v-else class="image-placeholder">📷</div>
            </div>
          </div>
        </div>

        <!-- 视频展示 -->
        <div v-if="post.type === 'video'" class="post-video">
          <div class="video-container">
            <div class="video-placeholder">
              <div class="play-button">▶️</div>
              <div class="video-duration">00:32</div>
              <div class="video-controls">
                <div class="mute-button">🔇</div>
              </div>
            </div>
          </div>
        </div>

        <div class="post-actions">
          <div class="action-group">
            <div class="action-item" @click="handleLike(post.id)">
              <span class="action-icon">❤️</span>
              <span class="action-count">{{ post.likes }}</span>
            </div>
            <div class="action-item" @click="handleComment(post.id)">
              <span class="action-icon">💬</span>
              <span class="action-count">{{ post.comments }}</span>
            </div>
          </div>
          <div class="share-group">
            <span class="share-icon" @click="handleShare(post.id)">📤</span>
            <span class="bookmark-icon" @click="handleBookmark(post.id)"
              >🔖</span
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.social-feed-content {
  overflow: hidden;
  border-radius: 8px;
  width: 100%;
  background: #f5f5f5;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
}
/* 动态列表 */
.feed-list {
  /* 移除了 padding-bottom，因为不再需要为底部导航预留空间 */
}
.post-card {
  margin-bottom: 0;
  padding: 16px;
  border-bottom: 0.5px solid #cccdcf;
  background: white;
  transition: background-color 0.2s ease;
}
.post-card:hover {
  background: #fafafa;
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
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
  border-radius: 50%;
  width: 40px;
  height: 40px;
}
.avatar-image {
  border-radius: 50%;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.avatar-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  font-weight: 500;
  font-size: 16px;
  color: #00030f;
}
.post-time {
  font-size: 12px;
  color: #808187;
}
.user-title {
  line-height: 1.3;
  font-size: 12px;
  color: #808187;
}
.more-options {
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  color: #808187;
  transition: background-color 0.2s ease;
}
.more-options:hover {
  background: #f0f0f0;
}
.post-content {
  margin-bottom: 16px;
  line-height: 1.4;
  font-size: 14px;
  color: #00030f;
  white-space: pre-line;
}
/* 图片网格 */
.post-images {
  margin-bottom: 16px;
}
.image-grid {
  display: flex;
  gap: 8px;
  overflow-x: auto;
}
.image-item {
  display: flex;
  overflow: hidden;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
  border-radius: 6px;
  width: 200px;
  height: 200px;
  background: #f0f0f0;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}
.image-placeholder {
  font-size: 48px;
  color: #cccdcf;
}
.actual-image {
  border-radius: 6px;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
/* 视频容器 */
.post-video {
  margin-bottom: 16px;
}
.video-container {
  overflow: hidden;
  position: relative;
  border-radius: 6px;
  width: 100%;
  height: 192px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}
.video-placeholder {
  display: flex;
  position: relative;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.play-button {
  cursor: pointer;
  font-size: 40px;
  color: white;
  transition: transform 0.2s ease;
}
.play-button:hover {
  transform: scale(1.1);
}
.video-duration {
  position: absolute;
  right: 8px;
  top: 8px;
  padding: 2px 4px;
  border-radius: 4px;
  background: rgba(0, 3, 15, 0.4);
  backdrop-filter: blur(10px);
  font-size: 10px;
  color: rgba(255, 255, 255, 0.8);
}
.video-controls {
  position: absolute;
  left: 8px;
  bottom: 8px;
}
.mute-button {
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  background: rgba(0, 3, 15, 0.5);
  backdrop-filter: blur(10px);
  cursor: pointer;
  font-size: 12px;
  color: white;
  transition: background-color 0.2s ease;
}
.mute-button:hover {
  background: rgba(0, 3, 15, 0.7);
}
/* 动态操作 */
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
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  gap: 4px;
}
.action-item:hover {
  background: #f0f0f0;
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
.share-icon,
.bookmark-icon {
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.2s ease;
}
.share-icon:hover,
.bookmark-icon:hover {
  background: #f0f0f0;
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
/* 滚动优化 */
.image-grid::-webkit-scrollbar {
  height: 4px;
}
.image-grid::-webkit-scrollbar-track {
  border-radius: 2px;
  background: #f0f0f0;
}
.image-grid::-webkit-scrollbar-thumb {
  border-radius: 2px;
  background: #cccdcf;
}
.image-grid::-webkit-scrollbar-thumb:hover {
  background: #999;
}
</style>
