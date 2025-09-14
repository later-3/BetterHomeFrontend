<template>
  <div class="neighbor-content-detail">
    <!-- Status Bar -->
    <div class="status-bar">
      <div class="time">9:41</div>
      <div class="status-icons">
        <img src="@/static/pages/neighbor/content-detail/2.svg" alt="Signal" class="status-icon">
        <img src="@/static/pages/neighbor/content-detail/3.svg" alt="WiFi" class="status-icon">
        <img src="@/static/pages/neighbor/content-detail/1.svg" alt="Battery" class="status-icon">
      </div>
    </div>

    <!-- Navigation Header -->
    <div class="nav-header">
      <button class="back-btn" @click="goBack">
        <img src="@/static/pages/neighbor/content-detail/4.svg" alt="Back">
      </button>
      <div class="nav-actions">
        <button class="nav-btn" @click="shareContent">
          <img src="@/static/pages/neighbor/content-detail/5.svg" alt="Share">
        </button>
        <button class="nav-btn" @click="bookmarkContent">
          <img src="@/static/pages/neighbor/content-detail/6.svg" alt="Bookmark">
        </button>
        <button class="nav-btn" @click="moreOptions">
          <img src="@/static/pages/neighbor/content-detail/7.svg" alt="More">
        </button>
      </div>
    </div>

    <!-- Content Card -->
    <div class="content-card">
      <!-- User Info -->
      <div class="user-info">
        <div class="user-avatar">
          <img src="@/static/pages/neighbor/content-detail/8.svg" alt="User Avatar">
        </div>
        <div class="user-details">
          <span class="username">{{ content.author }}</span>
        </div>
        <div class="post-time">{{ content.timeAgo }}</div>
      </div>

      <!-- Main Image -->
      <div class="main-image">
        <img :src="content.imageUrl" :alt="content.title">
      </div>

      <!-- Interaction Stats -->
      <div class="interaction-stats">
        <div class="stat-item">
          <span class="stat-number">{{ content.views }}</span>
          <img src="@/static/pages/neighbor/content-detail/10.svg" alt="Views" class="stat-icon">
        </div>
        <div class="stat-item">
          <span class="stat-number">{{ content.comments }}</span>
          <img src="@/static/pages/neighbor/content-detail/11.svg" alt="Comments" class="stat-icon">
        </div>
        <div class="stat-item">
          <span class="stat-number">{{ content.likes }}</span>
          <img src="@/static/pages/neighbor/content-detail/12.svg" alt="Likes" class="stat-icon">
        </div>
      </div>
    </div>

    <!-- Content Description -->
    <div class="content-description">
      <h2 class="content-title">{{ content.title }}</h2>
      <p class="content-text">{{ content.description }}</p>
    </div>

    <!-- Comments Section -->
    <div class="comments-section">
      <div 
        v-for="comment in comments" 
        :key="comment.id" 
        class="comment-item"
      >
        <div class="comment-avatar">
          <img :src="comment.avatar" :alt="comment.author">
        </div>
        <div class="comment-content">
          <div class="comment-header">
            <span class="comment-author">{{ comment.author }}</span>
            <span class="comment-time">{{ comment.timeAgo }}</span>
          </div>
          <p class="comment-text">{{ comment.text }}</p>
        </div>
      </div>
    </div>

    <!-- Comment Input -->
    <div class="comment-input-section">
      <div class="comment-input-box">
        <div class="input-avatar">
          <img src="@/static/pages/neighbor/content-detail/15.svg" alt="Your Avatar">
        </div>
        <input 
          v-model="newComment"
          type="text" 
          placeholder="Add a comment"
          class="comment-input"
          @keyup.enter="addComment"
        >
      </div>
      <div class="bottom-indicator">
        <div class="home-indicator"></div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NeighborContentDetail',
  props: {
    contentData: {
      type: Object,
      default: () => ({
        author: 'Thanh Pham',
        timeAgo: '1 hour ago',
        title: 'Street portrait',
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quis risus, neque cursus risus. Eget dictumst vitae enim, felis morbi. Quis risus, neque cursus risus. Eget dictumst vitae enim, felis morbi. Quis risus, neque cursus risus.',
        imageUrl: '@/static/pages/neighbor/content-detail/9.png',
        views: 125,
        comments: 20,
        likes: 125
      })
    }
  },
  computed: {
    content() {
      return this.contentData;
    }
  },
  data() {
    return {
      newComment: '',
      comments: [
        {
          id: 1,
          author: 'Bruno Pham',
          text: 'Great shot! I love it',
          timeAgo: '2 mins ago',
          avatar: '@/static/pages/neighbor/content-detail/13.svg'
        },
        {
          id: 2,
          author: 'Bruno Pham',
          text: 'Great shot! I love it',
          timeAgo: '2 mins ago',
          avatar: '@/static/pages/neighbor/content-detail/14.svg'
        },
        {
          id: 3,
          author: 'Bruno Pham',
          text: 'Great shot! I love it',
          timeAgo: '2 mins ago',
          avatar: '@/static/pages/neighbor/content-detail/16.png'
        }
      ]
    }
  },
  methods: {
    goBack() {
      console.log('Going back...');
      // 使用uni-app的返回功能
      uni.navigateBack();
    },
    shareContent() {
      console.log('Sharing content...');
      // 实现分享功能
    },
    bookmarkContent() {
      console.log('Bookmarking content...');
      // 实现收藏功能
    },
    moreOptions() {
      console.log('More options...');
      // 显示更多选项菜单
    },
    addComment() {
      if (this.newComment.trim()) {
        const comment = {
          id: Date.now(),
          author: 'You',
          text: this.newComment,
          timeAgo: 'Just now',
          avatar: '@/static/pages/neighbor/content-detail/15.svg'
        };
        this.comments.unshift(comment);
        this.content.comments++;
        this.newComment = '';
      }
    }
  }
}
</script>

<style scoped>
.neighbor-content-detail {
  width: 375px;
  height: 812px;
  background: white;
  position: relative;
  overflow: hidden;
  font-family: 'Circular Std', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* Status Bar */
.status-bar {
  width: 100%;
  height: 44px;
  background: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  box-sizing: border-box;
}

.time {
  font-size: 15px;
  font-weight: 600;
  color: #212121;
  font-family: 'SF Pro Text', sans-serif;
}

.status-icons {
  display: flex;
  gap: 5px;
  align-items: center;
}

.status-icon {
  height: 11.5px;
}

/* Navigation Header */
.nav-header {
  width: 100%;
  height: 48px;
  background: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  box-sizing: border-box;
}

.back-btn {
  background: none;
  border: none;
  padding: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-btn img {
  width: 24px;
  height: 24px;
}

.nav-actions {
  display: flex;
  gap: 44px;
  align-items: center;
}

.nav-btn {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-btn img {
  width: 24px;
  height: 24px;
}

/* Content Card */
.content-card {
  width: 100%;
  background: white;
}

.user-info {
  height: 50px;
  display: flex;
  align-items: center;
  padding: 10px 14px;
  box-sizing: border-box;
}

.user-avatar {
  width: 30px;
  height: 30px;
  margin-right: 10px;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.user-details {
  flex: 1;
}

.username {
  font-size: 16px;
  font-weight: 400;
  color: #242424;
}

.post-time {
  font-size: 14px;
  color: #BDBDBD;
  font-weight: 400;
}

.main-image {
  width: 100%;
  height: 250.75px;
  overflow: hidden;
}

.main-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.interaction-stats {
  height: 45px;
  background: white;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 12px 0;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stat-number {
  font-size: 14px;
  color: #828282;
  font-weight: 400;
}

.stat-icon {
  width: 20px;
  height: 20px;
}

/* Content Description */
.content-description {
  padding: 20px;
  background: white;
}

.content-title {
  font-size: 20px;
  font-weight: 700;
  color: #212121;
  margin: 0 0 10px 0;
}

.content-text {
  font-size: 14px;
  font-weight: 400;
  color: #828282;
  line-height: 1.5;
  margin: 0;
}

/* Comments Section */
.comments-section {
  padding: 0 14px;
  background: white;
}

.comment-item {
  background: #F6F7F9;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 10px;
  display: flex;
  gap: 14px;
}

.comment-avatar {
  width: 30px;
  height: 30px;
  flex-shrink: 0;
}

.comment-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.comment-author {
  font-size: 16px;
  font-weight: 700;
  color: #212121;
}

.comment-time {
  font-size: 12px;
  color: #828282;
  font-weight: 400;
}

.comment-text {
  font-size: 14px;
  font-weight: 400;
  color: #212121;
  margin: 0;
  line-height: 1.4;
}

/* Comment Input */
.comment-input-section {
  position: absolute;
  bottom: 0;
  width: 100%;
  background: white;
}

.comment-input-box {
  height: 54px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 14px;
  background: white;
}

.input-avatar {
  width: 30px;
  height: 30px;
  flex-shrink: 0;
}

.input-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.comment-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  color: #212121;
  background: transparent;
}

.comment-input::placeholder {
  color: #BDBDBD;
}

.bottom-indicator {
  height: 34px;
  background: white;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  padding-bottom: 13px;
}

.home-indicator {
  width: 134px;
  height: 5px;
  background: #737982;
  border-radius: 100px;
}

/* Responsive Design */
@media (max-width: 375px) {
  .neighbor-content-detail {
    width: 100%;
  }
}

/* Hover Effects */
.back-btn:hover,
.nav-btn:hover {
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.comment-item:hover {
  background: #f0f1f3;
  transition: background-color 0.2s ease;
}

/* Animation */
.comment-item {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>