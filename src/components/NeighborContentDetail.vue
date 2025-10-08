<template>
  <div class="neighbor-content-detail">
    <!-- Status Bar -->
    <div class="status-bar">
      <div class="time">9:41</div>
      <div class="status-icons">
        <img
          src="@/static/pages/neighbor/content-detail/2.svg"
          alt="Signal"
          class="status-icon"
        />
        <img
          src="@/static/pages/neighbor/content-detail/3.svg"
          alt="WiFi"
          class="status-icon"
        />
        <img
          src="@/static/pages/neighbor/content-detail/1.svg"
          alt="Battery"
          class="status-icon"
        />
      </div>
    </div>

    <!-- Navigation Header -->
    <div class="nav-header">
      <button class="back-btn" @click="goBack">
        <img src="@/static/pages/neighbor/content-detail/4.svg" alt="Back" />
      </button>
      <div class="nav-actions">
        <button class="nav-btn" @click="shareContent">
          <img src="@/static/pages/neighbor/content-detail/5.svg" alt="Share" />
        </button>
        <button class="nav-btn" @click="bookmarkContent">
          <img
            src="@/static/pages/neighbor/content-detail/6.svg"
            alt="Bookmark"
          />
        </button>
        <button class="nav-btn" @click="moreOptions">
          <img src="@/static/pages/neighbor/content-detail/7.svg" alt="More" />
        </button>
      </div>
    </div>

    <!-- Content Card -->
    <div class="content-card">
      <!-- User Info -->
      <div class="user-info">
        <div class="user-avatar">
          <img
            src="@/static/pages/neighbor/content-detail/8.svg"
            alt="User Avatar"
          />
        </div>
        <div class="user-details">
          <span class="username">{{ content.author }}</span>
        </div>
        <div class="post-time">{{ content.timeAgo }}</div>
      </div>

      <!-- Main Image -->
      <div class="main-image">
        <img :src="content.imageUrl" :alt="content.title" />
      </div>

      <!-- Interaction Stats -->
      <div class="interaction-stats">
        <div class="stat-item">
          <span class="stat-number">{{ content.views }}</span>
          <img
            src="@/static/pages/neighbor/content-detail/10.svg"
            alt="Views"
            class="stat-icon"
          />
        </div>
        <div class="stat-item">
          <span class="stat-number">{{ content.comments }}</span>
          <img
            src="@/static/pages/neighbor/content-detail/11.svg"
            alt="Comments"
            class="stat-icon"
          />
        </div>
        <div class="stat-item">
          <span class="stat-number">{{ content.likes }}</span>
          <img
            src="@/static/pages/neighbor/content-detail/12.svg"
            alt="Likes"
            class="stat-icon"
          />
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
      <div v-for="comment in comments" :key="comment.id" class="comment-item">
        <div class="comment-avatar">
          <img :src="comment.avatar" :alt="comment.author" />
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
          <img
            src="@/static/pages/neighbor/content-detail/15.svg"
            alt="Your Avatar"
          />
        </div>
        <input
          v-model="newComment"
          type="text"
          placeholder="Add a comment"
          class="comment-input"
          @keyup.enter="addComment"
        />
      </div>
      <div class="bottom-indicator">
        <div class="home-indicator"></div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "NeighborContentDetail",
  props: {
    contentData: {
      type: Object,
      default: () => ({
        author: "Thanh Pham",
        timeAgo: "1 hour ago",
        title: "Street portrait",
        description:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quis risus, neque cursus risus. Eget dictumst vitae enim, felis morbi. Quis risus, neque cursus risus. Eget dictumst vitae enim, felis morbi. Quis risus, neque cursus risus.",
        imageUrl: "@/static/pages/neighbor/content-detail/9.png",
        views: 125,
        comments: 20,
        likes: 125,
      }),
    },
  },
  computed: {
    content() {
      return this.contentData;
    },
  },
  data() {
    return {
      newComment: "",
      comments: [
        {
          id: 1,
          author: "Bruno Pham",
          text: "Great shot! I love it",
          timeAgo: "2 mins ago",
          avatar: "@/static/pages/neighbor/content-detail/13.svg",
        },
        {
          id: 2,
          author: "Bruno Pham",
          text: "Great shot! I love it",
          timeAgo: "2 mins ago",
          avatar: "@/static/pages/neighbor/content-detail/14.svg",
        },
        {
          id: 3,
          author: "Bruno Pham",
          text: "Great shot! I love it",
          timeAgo: "2 mins ago",
          avatar: "@/static/pages/neighbor/content-detail/16.png",
        },
      ],
    };
  },
  methods: {
    goBack() {
      console.log("Going back...");
      // 使用uni-app的返回功能
      uni.navigateBack();
    },
    shareContent() {
      console.log("Sharing content...");
      // 实现分享功能
    },
    bookmarkContent() {
      console.log("Bookmarking content...");
      // 实现收藏功能
    },
    moreOptions() {
      console.log("More options...");
      // 显示更多选项菜单
    },
    addComment() {
      if (this.newComment.trim()) {
        const comment = {
          id: Date.now(),
          author: "You",
          text: this.newComment,
          timeAgo: "Just now",
          avatar: "@/static/pages/neighbor/content-detail/15.svg",
        };
        this.comments.unshift(comment);
        this.content.comments++;
        this.newComment = "";
      }
    },
  },
};
</script>

<style scoped>
.neighbor-content-detail {
  overflow: hidden;
  position: relative;
  width: 375px;
  height: 812px;
  background: white;
  font-family: 'Circular Std', -apple-system, BlinkMacSystemFont, sans-serif;
}
/* Status Bar */
.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-sizing: border-box;
  padding: 0 20px;
  width: 100%;
  height: 44px;
  background: white;
}
.time {
  font-family: 'SF Pro Text', sans-serif;
  font-weight: 600;
  font-size: 15px;
  color: #212121;
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-sizing: border-box;
  padding: 0 16px;
  width: 100%;
  height: 48px;
  background: white;
}
.back-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px;
  border: none;
  background: none;
  cursor: pointer;
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
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
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
  display: flex;
  align-items: center;
  box-sizing: border-box;
  padding: 10px 14px;
  height: 50px;
}
.user-avatar {
  margin-right: 10px;
  width: 30px;
  height: 30px;
}
.user-avatar img {
  border-radius: 50%;
  width: 100%;
  height: 100%;
}
.user-details {
  flex: 1;
}
.username {
  font-weight: 400;
  font-size: 16px;
  color: #242424;
}
.post-time {
  font-weight: 400;
  font-size: 14px;
  color: #bdbdbd;
}
.main-image {
  overflow: hidden;
  width: 100%;
  height: 250.75px;
}
.main-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.interaction-stats {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 12px 0;
  height: 45px;
  background: white;
}
.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
}
.stat-number {
  font-weight: 400;
  font-size: 14px;
  color: #828282;
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
  margin: 0 0 10px;
  font-weight: 700;
  font-size: 20px;
  color: #212121;
}
.content-text {
  margin: 0;
  line-height: 1.5;
  font-weight: 400;
  font-size: 14px;
  color: #828282;
}
/* Comments Section */
.comments-section {
  padding: 0 14px;
  background: white;
}
.comment-item {
  display: flex;
  margin-bottom: 10px;
  padding: 16px;
  border-radius: 8px;
  background: #f6f7f9;
  gap: 14px;
}
.comment-avatar {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
}
.comment-avatar img {
  border-radius: 50%;
  width: 100%;
  height: 100%;
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
  font-weight: 700;
  font-size: 16px;
  color: #212121;
}
.comment-time {
  font-weight: 400;
  font-size: 12px;
  color: #828282;
}
.comment-text {
  margin: 0;
  line-height: 1.4;
  font-weight: 400;
  font-size: 14px;
  color: #212121;
}
/* Comment Input */
.comment-input-section {
  position: absolute;
  bottom: 0;
  width: 100%;
  background: white;
}
.comment-input-box {
  display: flex;
  align-items: center;
  padding: 0 16px;
  height: 54px;
  background: white;
  gap: 14px;
}
.input-avatar {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
}
.input-avatar img {
  border-radius: 50%;
  width: 100%;
  height: 100%;
}
.comment-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  color: #212121;
}
.comment-input::placeholder {
  color: #bdbdbd;
}
.bottom-indicator {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  padding-bottom: 13px;
  height: 34px;
  background: white;
}
.home-indicator {
  border-radius: 100px;
  width: 134px;
  height: 5px;
  background: #737982;
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
