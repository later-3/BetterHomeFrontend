<template>
  <div class="comment-item" :class="{ 'comment-reply': isReply }">
    <div class="comment-avatar">
      <img
        v-if="comment.author?.avatar"
        :src="comment.author.avatar"
        :alt="comment.author?.name"
        @error="handleAvatarError"
      />
      <div v-else class="avatar-placeholder">👤</div>
    </div>

    <div class="comment-body">
      <div class="comment-header">
        <div class="author-info">
          <span class="author-name">{{ comment.author?.name || '匿名用户' }}</span>
          <span v-if="comment.author?.verified" class="badge">✓</span>
        </div>
        <span class="comment-time" :title="formatFullTime(comment.created_at)">
          {{ formatRelative(comment.created_at) }}
        </span>
      </div>

      <div class="media-wrapper" v-if="comment.preview && comment.preview.length">
        <div 
          class="media-item"
          v-for="attachment in comment.preview"
          :key="attachment.fileId"
        >
          <slot name="preview" :attachment="attachment"></slot>
        </div>
        <div v-if="comment.preview.length < comment.attachments.length" class="more-hint">
          共 {{ comment.attachments.length }} 个附件
        </div>
      </div>

      <div class="comment-content" v-html="comment.content"></div>

      <div v-if="comment.meta?.replies_count || comment.meta?.like_count" class="comment-meta">
        <span v-if="comment.meta?.like_count" class="meta-item">❤️ {{ comment.meta.like_count }}</span>
        <span v-if="comment.meta?.replies_count" class="meta-item">
          💬 {{ comment.meta.replies_count }}
        </span>
      </div>

      <div class="comment-actions">
        <button class="action-btn" @click="$emit('like', comment)">点赞</button>
        <button class="action-btn" @click="$emit('reply', comment)">回复</button>
      </div>

      <div v-if="comment.replies?.length" class="comment-replies">
        <CommentItem
          v-for="reply in comment.replies"
          :key="reply.id"
          :comment="reply"
          :is-reply="true"
          @like="$emit('like', $event)"
          @reply="$emit('reply', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CommentItem',
  props: {
    comment: {
      type: Object,
      required: true
    },
    isReply: {
      type: Boolean,
      default: false
    }
  },
  emits: ['like', 'reply'],
  methods: {
    handleAvatarError(e) {
      e.target.src = 'https://static-legacy.dingtalk.com/media/lADOc4aN8c0Eao0CMg_1623_1623.jpg';
    },
    formatRelative(date) {
      const d = new Date(date);
      if (Number.isNaN(d.getTime())) return date;
      const diff = Date.now() - d.getTime();
      if (diff < 60 * 1000) return '刚刚';
      if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)} 分钟前`;
      if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)} 小时前`;
      return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    },
    formatFullTime(date) {
      const d = new Date(date);
      return Number.isNaN(d.getTime()) ? date : d.toLocaleString();
    }
  }
};
</script>

<style scoped>
.comment-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 16px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.comment-reply {
  margin-left: 48px;
  background: #f8f9fb;
}

.comment-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
  overflow: hidden;
  background: linear-gradient(135deg, #b2f7ef, #eff7f6);
  display: flex;
  align-items: center;
  justify-content: center;
}

.comment-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  font-size: 18px;
}

.comment-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.author-info {
  display: flex;
  gap: 6px;
  align-items: center;
}

.author-name {
  font-weight: 600;
  color: #1f2937;
}

.badge {
  font-size: 12px;
  color: #10b981;
}

.comment-time {
  font-size: 12px;
  color: #6b7280;
}

.comment-content {
  font-size: 14px;
  color: #1f2937;
  line-height: 1.5;
}

.media-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.media-item {
  width: 140px;
  height: 140px;
  border-radius: 10px;
  overflow: hidden;
  background: #f3f4f6;
}

.more-hint {
  font-size: 12px;
  color: #64748b;
}

.comment-meta {
  font-size: 12px;
  color: #64748b;
  display: flex;
  gap: 12px;
}

.comment-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  padding: 4px 10px;
  border: none;
  border-radius: 12px;
  background: #eef2ff;
  color: #1f3a8a;
  font-size: 12px;
}

.comment-replies {
  margin-top: 12px;
}
</style>
