<template>
  <div
    class="comment-item"
    :class="{
      'comment-reply': isReply,
      'comment-highlighted': isHighlighted,
    }"
  >
    <div class="comment-avatar" :class="{ 'small-avatar': isReply }">
      <img
        :src="comment.author.avatar"
        :alt="comment.author.name"
        @error="handleAvatarError"
      />
    </div>

    <div class="comment-content">
      <div class="comment-header">
        <div class="user-info">
          <span class="username">{{ comment.author.name }}</span>
          <span v-if="comment.author.verified" class="verified-badge">✓</span>
        </div>
        <span class="timestamp" :title="formatFullTime(comment.created_at)">
          {{ formatRelativeTime(comment.created_at) }}
        </span>
      </div>

      <div v-if="comment.reply_to" class="reply-indicator">
        回复 @{{ comment.reply_to.name }}
      </div>

      <div class="rich-content">
        <template v-for="(segment, index) in parsedSegments" :key="index">
          <p v-if="segment.type === 'text'" class="comment-text">
            {{ segment.text }}
          </p>
          <image
            v-else-if="segment.type === 'image'"
            class="comment-media image"
            :src="segment.src"
            mode="aspectFill"
            @click="previewImage(segment.src)"
          />
          <video
            v-else-if="segment.type === 'video'"
            class="comment-media video"
            controls
            :poster="segment.poster"
            :src="segment.src"
          ></video>
          <AudioPlayer
            v-else-if="segment.type === 'audio'"
            :src="segment.src"
          />
        </template>
      </div>

      <div v-if="showActions" class="comment-actions">
        <button
          class="like-btn"
          :class="{ active: comment.is_liked }"
          @click="handleLike"
          :disabled="actionLoading.like"
        >
          <span class="like-icon">♥</span>
          <span v-if="comment.likes_count > 0" class="like-count">
            {{ formatCount(comment.likes_count) }}
          </span>
        </button>

        <div v-if="comment.replies_count > 0 && !isReply" class="replies-count">
          {{ comment.replies_count }}
          {{ comment.replies_count === 1 ? "reply" : "replies" }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import AudioPlayer from "@/components/AudioPlayer.vue";

export default {
  name: "RichCommentItem",
  components: {
    AudioPlayer,
  },
  props: {
    comment: {
      type: Object,
      required: true,
      validator(value) {
        return value && value.id && value.author && value.content;
      },
    },
    isReply: {
      type: Boolean,
      default: false,
    },
    level: {
      type: Number,
      default: 0,
    },
    maxLevel: {
      type: Number,
      default: 2,
    },
    showActions: {
      type: Boolean,
      default: true,
    },
    isHighlighted: {
      type: Boolean,
      default: false,
    },
    currentUserId: {
      type: String,
      default: null,
    },
  },

  emits: ["like", "avatar-error", "content-error", "content-load"],

  data() {
    return {
      actionLoading: {
        like: false,
        reply: false,
      },
    };
  },

  computed: {
    isOwnComment() {
      return (
        this.currentUserId && this.comment.author.id === this.currentUserId
      );
    },
    parsedSegments() {
      return parseContent(this.comment.content);
    },
  },

  watch: {
    "comment.content": {
      immediate: true,
      handler() {
        this.$emit("content-load", { commentId: this.comment.id });
      },
    },
  },

  methods: {
    async handleLike() {
      if (this.actionLoading.like) return;

      this.actionLoading.like = true;
      try {
        this.$emit("like", {
          commentId: this.comment.id,
          isLiked: this.comment.is_liked,
        });
      } finally {
        this.actionLoading.like = false;
      }
    },

    handleAvatarError(event) {
      event.target.src =
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNGMEYwRjAiLz4KPGNpcmNsZSBjeD0iMjAiIGN5PSIxNiIgcj0iNiIgZmlsbD0iI0NDQ0NDQyIvPgo8cGF0aCBkPSJNMTAgMzJDMTAgMjYuNDc3MSAxNC40NzcxIDIyIDE5IDIySDIxQzI1LjUyMjkgMjIgMzAgMjYuNDc3MSAzMCAzMlYzNEgxMFYzMloiIGZpbGw9IiNDQ0NDQ0MiLz4KPC9zdmc+";

      this.$emit("avatar-error", {
        commentId: this.comment.id,
        originalSrc: this.comment.author.avatar,
      });
    },
    previewImage(url) {
      if (!url) return;
      if (typeof uni !== "undefined" && url) {
        uni.previewImage({ current: url, urls: [url], indicator: "number" });
      }
    },

    formatRelativeTime(timestamp) {
      const now = new Date();
      const commentTime = new Date(timestamp);
      const diffInSeconds = Math.floor((now - commentTime) / 1000);

      if (diffInSeconds < 60) return "Just now";
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} h`;
      if (diffInSeconds < 2592000)
        return `${Math.floor((now - commentTime) / (86400 * 1000))} d`;

      return commentTime.toLocaleDateString();
    },

    formatFullTime(timestamp) {
      return new Date(timestamp).toLocaleString();
    },

    formatCount(count) {
      if (count < 1000) return count.toString();
      if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
      return `${(count / 1000000).toFixed(1)}M`;
    },
  },
};

function parseContent(html) {
  const segments = [];
  if (!html) return segments;

  if (typeof document !== "undefined") {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = html;
    traverseNodes(wrapper.childNodes, segments);
  } else {
    const text = html.replace(/<[^>]+>/g, " ").trim();
    if (text) segments.push({ type: "text", text });
  }

  return segments;
}

function traverseNodes(nodeList, segments) {
  nodeList.forEach((node) => {
    if (typeof Node !== "undefined" && node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) segments.push({ type: "text", text });
      return;
    }

    if (typeof Node !== "undefined" && node.nodeType !== Node.ELEMENT_NODE)
      return;

    const el = node;
    const tag = el.tagName.toLowerCase();
    if (tag === "img" || tag === "image") {
      const src = el.getAttribute("src");
      if (src) segments.push({ type: "image", src });
      return;
    }
    if (tag === "video") {
      const src = el.getAttribute("src");
      if (src) {
        segments.push({
          type: "video",
          src,
          poster: el.getAttribute("poster") || "",
        });
      }
      return;
    }
    if (tag === "audio") {
      const src = el.getAttribute("src");
      if (src) segments.push({ type: "audio", src });
      return;
    }

    if (tag === "br") {
      segments.push({ type: "text", text: "\n" });
      return;
    }

    traverseNodes(el.childNodes, segments);
  });
}
</script>

<style scoped>
.comment-item {
  display: flex;
  margin-bottom: 10px;
  padding: 16px;
  border-radius: 8px;
  background: #f6f7f9;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
  transition: background-color 0.2s ease;
  gap: 14px;
}
.comment-item:hover {
  background: #f0f1f3;
}
.comment-reply {
  margin-left: 20px;
  background: #f0f1f3;
}
.comment-reply:hover {
  background: #eaebec;
}
.comment-highlighted {
  border-left: 3px solid #2196f3;
  background: #e3f2fd;
}
.comment-avatar {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
}
.small-avatar {
  width: 36px;
  height: 36px;
}
.comment-avatar img {
  border-radius: 50%;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.comment-content {
  flex: 1;
  min-width: 0;
}
.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 6px;
}
.username {
  font-weight: 600;
  font-size: 16px;
  color: #212121;
}
.comment-reply .username {
  font-weight: 500;
  font-size: 15px;
}
.verified-badge {
  font-weight: bold;
  font-size: 12px;
  color: #1da1f2;
}
.timestamp {
  cursor: help;
  font-weight: 400;
  font-size: 13px;
  color: #8991a0;
}
.reply-indicator {
  margin-bottom: 6px;
  font-weight: 500;
  font-size: 12px;
  color: #007aff;
}
.comment-text {
  margin-bottom: 12px;
  line-height: 1.4;
  font-weight: 400;
  font-size: 15px;
  color: #272727;
  word-wrap: break-word;
}
.rich-content .comment-text + .comment-text {
  margin-top: -8px;
}
.comment-media {
  display: block;
  margin: 8px 0;
  border-radius: 8px;
  width: 100%;
}
.comment-media.image {
  height: 200px;
}
.comment-media.video {
  min-height: 200px;
  background: #000;
}
.comment-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.like-btn {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 20px;
  min-height: 44px;
  background: rgba(0, 0, 0, 0.04);
  font-weight: 500;
  font-size: 14px;
  color: #8991a0;
  transition: all 0.2s ease;
  gap: 6px;
}
.like-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #ff3b30;
}
.like-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.like-btn.active {
  background: rgba(255, 59, 48, 0.1);
  color: #ff3b30;
}
.like-btn.active .like-icon {
  color: #ff3b30;
}
.like-icon {
  font-size: 18px;
  transition: transform 0.2s ease;
}
.like-btn:hover .like-icon {
  transform: scale(1.1);
}
.like-btn.active .like-icon {
  animation: heartbeat 0.6s ease-in-out;
}
@keyframes heartbeat {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}
.like-count {
  margin-left: 2px;
  font-weight: 600;
  font-size: 14px;
}
.replies-count {
  font-weight: 500;
  font-size: 13px;
  color: #007aff;
}
@media (max-width: 480px) {
  .comment-item {
    padding: 12px;
    gap: 10px;
  }
  .comment-avatar {
    width: 36px;
    height: 36px;
  }
  .small-avatar {
    width: 32px;
    height: 32px;
  }
  .username {
    font-size: 15px;
  }
  .comment-text {
    font-size: 14px;
  }
  .like-btn {
    padding: 6px 10px;
    min-height: 40px;
    font-size: 13px;
  }
  .like-icon {
    font-size: 16px;
  }
  .like-count {
    font-size: 13px;
  }
  .replies-count {
    font-size: 12px;
  }
}
</style>
