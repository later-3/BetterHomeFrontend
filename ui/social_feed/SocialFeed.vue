<template>
  <div class="social-feed">
    <!-- 状态栏 -->
    <div class="status-bar">
      <div class="time">9:41</div>
      <div class="status-icons">
        <div class="signal-icon"></div>
        <div class="wifi-icon"></div>
        <div class="battery-icon"></div>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="search-header">
      <div class="search-container">
        <div class="search-icon">🔍</div>
        <input type="text" placeholder="Search" class="search-input" />
      </div>
      <div class="profile-avatar">
        <div class="avatar-placeholder"></div>
      </div>
    </div>

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
            <div class="action-item">
              <span class="action-icon">❤️</span>
              <span class="action-count">1.6 k</span>
            </div>
            <div class="action-item">
              <span class="action-icon">💬</span>
              <span class="action-count">200</span>
            </div>
          </div>
          <div class="share-group">
            <span class="share-icon">📤</span>
            <span class="bookmark-icon">🔖</span>
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
              <img src="../assets/CodeBubbyAssets/61_504/30.png" alt="Desk setup 1" />
            </div>
            <div class="image-item">
              <img src="../assets/CodeBubbyAssets/61_504/31.png" alt="Desk setup 2" />
            </div>
          </div>
        </div>
        <div class="post-actions">
          <div class="action-group">
            <div class="action-item">
              <span class="action-icon">❤️</span>
              <span class="action-count">1.6 k</span>
            </div>
            <div class="action-item">
              <span class="action-icon">💬</span>
              <span class="action-count">200</span>
            </div>
          </div>
          <div class="share-group">
            <span class="share-icon">📤</span>
            <span class="bookmark-icon">🔖</span>
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
            <div class="action-item">
              <span class="action-icon">❤️</span>
              <span class="action-count">1.6 k</span>
            </div>
            <div class="action-item">
              <span class="action-icon">💬</span>
              <span class="action-count">200</span>
            </div>
          </div>
          <div class="share-group">
            <span class="share-icon">📤</span>
            <span class="bookmark-icon">🔖</span>
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
            <img src="../assets/CodeBubbyAssets/61_504/1.png" alt="Video thumbnail" />
            <div class="video-overlay">
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
            <div class="action-item">
              <span class="action-icon">❤️</span>
              <span class="action-count">1.6 k</span>
            </div>
            <div class="action-item">
              <span class="action-icon">💬</span>
              <span class="action-count">200</span>
            </div>
          </div>
          <div class="share-group">
            <span class="share-icon">📤</span>
            <span class="bookmark-icon">🔖</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部导航栏 -->
    <div class="bottom-navigation">
      <div class="nav-item active">
        <div class="nav-icon">🏠</div>
      </div>
      <div class="nav-item">
        <div class="nav-icon">🔍</div>
      </div>
      <div class="nav-item">
        <div class="nav-icon">➕</div>
      </div>
      <div class="nav-item">
        <div class="nav-icon">💬</div>
      </div>
      <div class="nav-item">
        <div class="nav-icon">👤</div>
      </div>
      <div class="home-indicator"></div>
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
  // 更多动态数据...
])

// 方法
const handleLike = (postId: number) => {
  console.log('Like post:', postId)
}

const handleComment = (postId: number) => {
  console.log('Comment on post:', postId)
}

const handleShare = (postId: number) => {
  console.log('Share post:', postId)
}
</script>

<style scoped>
.social-feed {
  width: 375px;
  height: 100vh;
  background: #F5F5F5;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
  overflow-y: auto;
  position: relative;
}

/* 状态栏 */
.status-bar {
  height: 44px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 21px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.time {
  font-size: 15px;
  font-weight: 600;
  color: black;
}

.status-icons {
  display: flex;
  gap: 6px;
  align-items: center;
}

.signal-icon, .wifi-icon, .battery-icon {
  width: 17px;
  height: 10px;
  background: black;
  border-radius: 2px;
}

/* 搜索栏 */
.search-header {
  height: 52px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px);
  border-bottom: 0.5px solid rgba(204, 205, 207, 0.2);
  display: flex;
  align-items: center;
  padding: 6px 16px;
  gap: 8px;
  position: sticky;
  top: 44px;
  z-index: 99;
}

.search-container {
  flex: 1;
  height: 40px;
  background: #F7F7F7;
  border: 0.5px solid #CCCDCF;
  border-radius: 20px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  gap: 8px;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 12px;
  color: #808187;
  outline: none;
}

.search-input::placeholder {
  color: #808187;
}

.profile-avatar {
  width: 40px;
  height: 40px;
  background: #F7F7F7;
  border: 0.5px solid #CCCDCF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-placeholder {
  width: 20px;
  height: 20px;
  background: #CCCDCF;
  border-radius: 50%;
}

/* 动态列表 */
.feed-list {
  padding-bottom: 78px;
}

.post-card {
  background: white;
  border-bottom: 0.5px solid #CCCDCF;
  padding: 16px;
  margin-bottom: 0;
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
  background: #CCCDCF;
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
}

.image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
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

.video-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
}

.play-button {
  font-size: 40px;
  color: white;
  cursor: pointer;
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
}

/* 底部导航栏 */
.bottom-navigation {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 78px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px);
  border-top: 0.5px solid #CCCDCF;
  display: flex;
  align-items: flex-start;
  justify-content: space-around;
  padding-top: 8px;
}

.nav-item {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.nav-item.active .nav-icon {
  color: #007AFF;
}

.nav-icon {
  font-size: 24px;
  color: #808187;
}

.home-indicator {
  position: absolute;
  bottom: 21px;
  left: 50%;
  transform: translateX(-50%);
  width: 134px;
  height: 5px;
  background: black;
  border-radius: 100px;
}

/* 响应式设计 */
@media (max-width: 375px) {
  .social-feed {
    width: 100%;
  }
}

/* 滚动优化 */
.social-feed::-webkit-scrollbar {
  display: none;
}

.social-feed {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>