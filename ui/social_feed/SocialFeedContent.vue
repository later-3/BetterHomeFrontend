<template>
  <div class="social-feed-content">
    <!-- 动态列表 -->
    <div class="feed-list">
      <!-- Stephen Smith 的动态 -->
      <div class="post-card">
        <div class="post-header">
          <div class="user-info">
            <div class="avatar"></div>
            <div class="user-details">
              <div class="user-name-time">
                <span class="user-name">Stephen Smith</span>
                <span class="post-time">• 20 min</span>
              </div>
              <div class="user-title">Software Developer | Boston University</div>
            </div>
          </div>
          <div class="more-options">⋯</div>
        </div>
        <div class="post-content">
          📚 Just conquered algorithms & data structures! 🎉 Time for a breather. Suggestions for a binge-worthy show? 🍿
          <br><br>
          #StudyBreak #NetflixTime
        </div>
        <div class="post-actions">
          <div class="action-group">
            <div class="action-item" @click="handleLike(1)">
              <span class="action-icon">❤️</span>
              <span class="action-count">1.6 k</span>
            </div>
            <div class="action-item" @click="handleComment(1)">
              <span class="action-icon">💬</span>
              <span class="action-count">200</span>
            </div>
          </div>
          <div class="share-group">
            <span class="share-icon" @click="handleShare(1)">📤</span>
            <span class="bookmark-icon" @click="handleBookmark(1)">🔖</span>
          </div>
        </div>
      </div>

      <!-- Alexander Cumins 的动态 -->
      <div class="post-card">
        <div class="post-header">
          <div class="user-info">
            <div class="avatar"></div>
            <div class="user-details">
              <div class="user-name-time">
                <span class="user-name">Alexander Cumins</span>
                <span class="post-time">• 20 min</span>
              </div>
              <div class="user-title">Bachelor of Computer Science | Web Developer</div>
            </div>
          </div>
          <div class="more-options">⋯</div>
        </div>
        <div class="post-content">
          💻 Need some desk setup inspo?
          <br><br>
          👀 Check out my cozy study corner! Loving the minimalist vibes and natural lighting.
        </div>
        <div class="post-images">
          <div class="image-grid">
            <div class="image-item">
              <div class="image-placeholder">📷</div>
            </div>
            <div class="image-item">
              <div class="image-placeholder">📷</div>
            </div>
          </div>
        </div>
        <div class="post-actions">
          <div class="action-group">
            <div class="action-item" @click="handleLike(2)">
              <span class="action-icon">❤️</span>
              <span class="action-count">1.6 k</span>
            </div>
            <div class="action-item" @click="handleComment(2)">
              <span class="action-icon">💬</span>
              <span class="action-count">200</span>
            </div>
          </div>
          <div class="share-group">
            <span class="share-icon" @click="handleShare(2)">📤</span>
            <span class="bookmark-icon" @click="handleBookmark(2)">🔖</span>
          </div>
        </div>
      </div>

      <!-- Emily Johnson 的动态 -->
      <div class="post-card">
        <div class="post-header">
          <div class="user-info">
            <div class="avatar"></div>
            <div class="user-details">
              <div class="user-name-time">
                <span class="user-name">Emily Johnson</span>
                <span class="post-time">• 10 min</span>
              </div>
              <div class="user-title">B.Sc. in CS | AI and ML</div>
            </div>
          </div>
          <div class="more-options">⋯</div>
        </div>
        <div class="post-content">
          📝 Just wrapped up my final project presentation! 🎓💼 Feeling a mix of relief and excitement for what's next. Cheers to the end of another semester! 🥂
          <br><br>
          #StudentLife #FinalsDone #NextChapter
        </div>
        <div class="post-actions">
          <div class="action-group">
            <div class="action-item" @click="handleLike(3)">
              <span class="action-icon">❤️</span>
              <span class="action-count">1.6 k</span>
            </div>
            <div class="action-item" @click="handleComment(3)">
              <span class="action-icon">💬</span>
              <span class="action-count">200</span>
            </div>
          </div>
          <div class="share-group">
            <span class="share-icon" @click="handleShare(3)">📤</span>
            <span class="bookmark-icon" @click="handleBookmark(3)">🔖</span>
          </div>
        </div>
      </div>

      <!-- Ashley Wong 的动态 -->
      <div class="post-card">
        <div class="post-header">
          <div class="user-info">
            <div class="avatar"></div>
            <div class="user-details">
              <div class="user-name-time">
                <span class="user-name">Ashley Wong</span>
                <span class="post-time">• 10 min</span>
              </div>
              <div class="user-title">B.Sc. in CS | Robotics and Control Systems</div>
            </div>
          </div>
          <div class="more-options">⋯</div>
        </div>
        <div class="post-content">
          🚀 Just wrapped up an exhilarating web development session!
          <br><br>
          Delved into the intricacies of front-end frameworks and unleashed some creativity with CSS animations.
        </div>
        <div class="post-video">
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
            <div class="action-item" @click="handleLike(4)">
              <span class="action-icon">❤️</span>
              <span class="action-count">1.6 k</span>
            </div>
            <div class="action-item" @click="handleComment(4)">
              <span class="action-icon">💬</span>
              <span class="action-count">200</span>
            </div>
          </div>
          <div class="share-group">
            <span class="share-icon" @click="handleShare(4)">📤</span>
            <span class="bookmark-icon" @click="handleBookmark(4)">🔖</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

// 响应式数据
const searchQuery = ref('')

// 模拟数据
const posts = reactive([
  {
    id: 1,
    user: {
      name: 'Stephen Smith',
      title: 'Software Developer | Boston University',
      avatar: '',
      time: '20 min'
    },
    content: '📚 Just conquered algorithms & data structures! 🎉 Time for a breather. Suggestions for a binge-worthy show? 🍿\n\n#StudyBreak #NetflixTime',
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
    content: '💻 Need some desk setup inspo?\n\n👀 Check out my cozy study corner! Loving the minimalist vibes and natural lighting.',
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
    content: '📝 Just wrapped up my final project presentation! 🎓💼 Feeling a mix of relief and excitement for what\'s next. Cheers to the end of another semester! 🥂\n\n#StudentLife #FinalsDone #NextChapter',
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
    content: '🚀 Just wrapped up an exhilarating web development session!\n\nDelved into the intricacies of front-end frameworks and unleashed some creativity with CSS animations.',
    likes: '1.6k',
    comments: '200',
    type: 'video'
  }
])

// 方法
const handleLike = (postId: number) => {
  console.log('Like post:', postId)
  // 这里可以添加点赞逻辑
}

const handleComment = (postId: number) => {
  console.log('Comment on post:', postId)
  // 这里可以添加评论逻辑
}

const handleShare = (postId: number) => {
  console.log('Share post:', postId)
  // 这里可以添加分享逻辑
}

const handleBookmark = (postId: number) => {
  console.log('Bookmark post:', postId)
  // 这里可以添加收藏逻辑
}
</script>

<style scoped>
.social-feed-content {
  width: 100%;
  background: #F5F5F5;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
  border-radius: 8px;
  overflow: hidden;
}

/* 动态列表 */
.feed-list {
  /* 移除了 padding-bottom，因为不再需要为底部导航预留空间 */
}

.post-card {
  background: white;
  border-bottom: 0.5px solid #CCCDCF;
  padding: 16px;
  margin-bottom: 0;
  transition: background-color 0.2s ease;
}

.post-card:hover {
  background: #FAFAFA;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  flex-shrink: 0;
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

.more-options:hover {
  background: #F0F0F0;
}

.post-content {
  font-size: 14px;
  color: #00030F;
  line-height: 1.4;
  margin-bottom: 16px;
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

/* 视频容器 */
.post-video {
  margin-bottom: 16px;
}

.video-container {
  width: 100%;
  height: 192px;
  border-radius: 6px;
  overflow: hidden;
  position: relative;
  box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.05);
}

.video-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.play-button {
  font-size: 40px;
  color: white;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.play-button:hover {
  transform: scale(1.1);
}

.video-duration {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 3, 15, 0.4);
  color: rgba(255, 255, 255, 0.8);
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 10px;
  backdrop-filter: blur(10px);
}

.video-controls {
  position: absolute;
  bottom: 8px;
  left: 8px;
}

.mute-button {
  width: 24px;
  height: 24px;
  background: rgba(0, 3, 15, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: white;
  backdrop-filter: blur(10px);
  cursor: pointer;
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
  gap: 4px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.action-item:hover {
  background: #F0F0F0;
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

.share-icon:hover, .bookmark-icon:hover {
  background: #F0F0F0;
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
  background: #F0F0F0;
  border-radius: 2px;
}

.image-grid::-webkit-scrollbar-thumb {
  background: #CCCDCF;
  border-radius: 2px;
}

.image-grid::-webkit-scrollbar-thumb:hover {
  background: #999;
}
</style>