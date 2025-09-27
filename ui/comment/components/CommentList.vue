<template>
  <div class="comment-list" :class="{ 'mobile-optimized': isMobile }">
    <!-- 加载状态 -->
    <div v-if="loading && comments.length === 0" class="loading-state">
      <div class="loading-spinner"></div>
      <p class="loading-text">加载评论中...</p>
    </div>
    
    <!-- 空状态 -->
    <div v-else-if="!loading && comments.length === 0" class="empty-state">
      <div class="empty-icon">💬</div>
      <p class="empty-text">暂无评论</p>
      <p class="empty-subtext">成为第一个评论的人吧</p>
    </div>
    
    <!-- 评论列表 -->
    <div v-else class="comments-container">
      <!-- 主评论 -->
      <div 
        v-for="comment in visibleComments" 
        :key="comment.id"
        class="comment-wrapper"
      >
        <!-- 使用 CommentItem 组件 -->
        <CommentItem
          :comment="comment"
          :is-reply="false"
          :level="0"
          :max-level="maxNestingLevel"
          :show-actions="showActions"
          :is-highlighted="highlightedCommentId === comment.id"
          :current-user-id="currentUserId"
          @like="handleLike"
          @avatar-error="handleAvatarError"
        />
        
        <!-- 回复列表 -->
        <div 
          v-if="comment.replies && comment.replies.length > 0" 
          class="replies-container"
        >
          <!-- 回复指示线 -->
          <div class="reply-indicator-line"></div>
          
          <!-- 回复评论 -->
          <div 
            v-for="reply in getVisibleReplies(comment)" 
            :key="reply.id"
            class="reply-wrapper"
          >
            <CommentItem
              :comment="reply"
              :is-reply="true"
              :level="1"
              :max-level="maxNestingLevel"
              :show-actions="showActions"
              :is-highlighted="highlightedCommentId === reply.id"
              :current-user-id="currentUserId"
              @like="handleLike"
              @avatar-error="handleAvatarError"
            />
            
            <!-- 二级回复 -->
            <div 
              v-if="reply.replies && reply.replies.length > 0 && maxNestingLevel > 1"
              class="nested-replies-container"
            >
              <div 
                v-for="nestedReply in getVisibleReplies(reply)" 
                :key="nestedReply.id"
                class="nested-reply-wrapper"
              >
                <CommentItem
                  :comment="nestedReply"
                  :is-reply="true"
                  :level="2"
                  :max-level="maxNestingLevel"
                  :show-actions="showActions"
                  :is-highlighted="highlightedCommentId === nestedReply.id"
                  :current-user-id="currentUserId"
                  @like="handleLike"
                  @avatar-error="handleAvatarError"
                />
              </div>
              
              <!-- 查看更多二级回复 -->
              <button 
                v-if="reply.replies.length > repliesPerPage"
                class="load-more-replies-btn"
                @click="loadMoreReplies(reply.id)"
                :disabled="loadingReplies[reply.id]"
              >
                <span v-if="loadingReplies[reply.id]" class="loading-spinner small"></span>
                <span v-else>查看更多回复 ({{ reply.replies.length - repliesPerPage }})</span>
              </button>
            </div>
          </div>
          
          <!-- 查看更多回复按钮 -->
          <button 
            v-if="comment.replies.length > repliesPerPage"
            class="load-more-replies-btn"
            @click="loadMoreReplies(comment.id)"
            :disabled="loadingReplies[comment.id]"
          >
            <span v-if="loadingReplies[comment.id]" class="loading-spinner small"></span>
            <span v-else>查看更多回复 ({{ comment.replies.length - repliesPerPage }})</span>
          </button>
        </div>
      </div>
    </div>
    
    <!-- 加载更多评论 -->
    <div v-if="hasMore && !loading" class="load-more-section">
      <button 
        class="load-more-btn"
        @click="loadMoreComments"
        :disabled="loadingMore"
      >
        <span v-if="loadingMore" class="loading-spinner small"></span>
        <span v-else>加载更多评论</span>
      </button>
    </div>
    
    <!-- 底部加载状态 -->
    <div v-if="loading && comments.length > 0" class="bottom-loading">
      <div class="loading-spinner small"></div>
      <span class="loading-text">加载中...</span>
    </div>
  </div>
</template>

<script>
import CommentItem from './CommentItem.vue'

export default {
  name: 'CommentList',
  components: {
    CommentItem
  },
  
  props: {
    // 评论数据数组
    comments: {
      type: Array,
      default: () => []
    },
    
    // 是否显示加载状态
    loading: {
      type: Boolean,
      default: false
    },
    
    // 是否还有更多评论
    hasMore: {
      type: Boolean,
      default: false
    },
    
    // 是否正在加载更多
    loadingMore: {
      type: Boolean,
      default: false
    },
    
    // 最大嵌套层级
    maxNestingLevel: {
      type: Number,
      default: 2,
      validator: value => value >= 1 && value <= 3
    },
    
    // 每页显示的回复数量
    repliesPerPage: {
      type: Number,
      default: 3
    },
    
    // 每页显示的评论数量
    commentsPerPage: {
      type: Number,
      default: 10
    },
    
    // 是否显示操作按钮
    showActions: {
      type: Boolean,
      default: true
    },
    
    // 高亮的评论ID
    highlightedCommentId: {
      type: String,
      default: null
    },
    
    // 当前用户ID
    currentUserId: {
      type: String,
      default: null
    },
    
    // 排序方式
    sortBy: {
      type: String,
      default: 'newest', // newest, oldest, popular
      validator: value => ['newest', 'oldest', 'popular'].includes(value)
    },
    
    // 是否启用虚拟滚动
    enableVirtualScroll: {
      type: Boolean,
      default: false
    },
    
    // 是否为移动端
    isMobile: {
      type: Boolean,
      default: true
    }
  },
  
  emits: [
    'load-more',           // 加载更多评论
    'load-more-replies',   // 加载更多回复
    'like',               // 点赞事件
    'sort-change',        // 排序变更
    'scroll-to-comment'   // 滚动到指定评论
  ],
  
  data() {
    return {
      // 当前显示的评论数量
      visibleCommentsCount: this.commentsPerPage,
      
      // 正在加载回复的评论ID集合
      loadingReplies: {},
      
      // 每个评论显示的回复数量
      visibleRepliesCount: {}
    }
  },
  
  computed: {
    // 当前可见的评论
    visibleComments() {
      return this.comments.slice(0, this.visibleCommentsCount)
    },
    
    // 排序后的评论
    sortedComments() {
      const sorted = [...this.comments]
      
      switch (this.sortBy) {
        case 'newest':
          return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        case 'oldest':
          return sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        case 'popular':
          return sorted.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
        default:
          return sorted
      }
    }
  },
  
  methods: {
    // 获取可见的回复
    getVisibleReplies(comment) {
      const count = this.visibleRepliesCount[comment.id] || this.repliesPerPage
      return comment.replies ? comment.replies.slice(0, count) : []
    },
    
    // 加载更多评论
    loadMoreComments() {
      if (this.hasMore && !this.loadingMore) {
        this.$emit('load-more')
      }
    },
    
    // 加载更多回复
    loadMoreReplies(commentId) {
      if (this.loadingReplies[commentId]) return
      
      this.$set(this.loadingReplies, commentId, true)
      
      // 增加显示的回复数量
      const currentCount = this.visibleRepliesCount[commentId] || this.repliesPerPage
      this.$set(this.visibleRepliesCount, commentId, currentCount + this.repliesPerPage)
      
      this.$emit('load-more-replies', {
        commentId,
        offset: currentCount,
        limit: this.repliesPerPage
      })
      
      // 模拟加载完成
      setTimeout(() => {
        this.$set(this.loadingReplies, commentId, false)
      }, 500)
    },
    
    // 处理点赞事件
    handleLike(data) {
      this.$emit('like', data)
    },
    
    // 处理头像错误
    handleAvatarError(data) {
      console.warn('Avatar loading failed:', data)
    },
    
    // 滚动到指定评论
    scrollToComment(commentId) {
      this.$nextTick(() => {
        const element = this.$el.querySelector(`[data-comment-id="${commentId}"]`)
        if (element) {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          })
          this.$emit('scroll-to-comment', commentId)
        }
      })
    },
    
    // 刷新评论列表
    refresh() {
      this.visibleCommentsCount = this.commentsPerPage
      this.visibleRepliesCount = {}
      this.loadingReplies = {}
    },
    
    // 处理滚动事件（用于无限滚动）
    handleScroll(event) {
      if (!this.hasMore || this.loadingMore) return
      
      const { scrollTop, scrollHeight, clientHeight } = event.target
      const threshold = 100 // 距离底部100px时触发加载
      
      if (scrollHeight - scrollTop - clientHeight < threshold) {
        this.loadMoreComments()
      }
    }
  },
  
  watch: {
    // 监听排序变化
    sortBy(newSort) {
      this.$emit('sort-change', newSort)
    },
    
    // 监听高亮评论变化
    highlightedCommentId(newId) {
      if (newId) {
        this.scrollToComment(newId)
      }
    }
  },
  
  mounted() {
    // 如果启用了无限滚动，添加滚动监听
    if (this.enableVirtualScroll) {
      this.$el.addEventListener('scroll', this.handleScroll)
    }
  },
  
  beforeUnmount() {
    // 清理滚动监听
    if (this.enableVirtualScroll) {
      this.$el.removeEventListener('scroll', this.handleScroll)
    }
  }
}
</script>

<style scoped>
.comment-list {
  width: 100%;
  max-width: 570px;
  margin: 0 auto;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
}

.mobile-optimized {
  padding: 0 16px;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #007AFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

.loading-spinner.small {
  width: 20px;
  height: 20px;
  border-width: 2px;
  margin-bottom: 0;
  margin-right: 8px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-size: 16px;
  color: #8991A0;
  margin: 0;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-text {
  font-size: 18px;
  font-weight: 600;
  color: #272727;
  margin: 0 0 8px 0;
}

.empty-subtext {
  font-size: 14px;
  color: #8991A0;
  margin: 0;
}

/* 评论容器 */
.comments-container {
  padding: 20px 0;
}

.comment-wrapper {
  margin-bottom: 24px;
  position: relative;
}

.comment-wrapper:last-child {
  margin-bottom: 0;
}

/* 回复容器 */
.replies-container {
  margin-top: 16px;
  margin-left: 20px;
  position: relative;
}

.reply-indicator-line {
  position: absolute;
  left: 22px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(to bottom, #E5E5EA 0%, transparent 100%);
  opacity: 0.6;
}

.reply-wrapper {
  margin-bottom: 12px;
  position: relative;
}

.reply-wrapper:last-child {
  margin-bottom: 0;
}

/* 嵌套回复 */
.nested-replies-container {
  margin-top: 12px;
  margin-left: 20px;
}

.nested-reply-wrapper {
  margin-bottom: 8px;
}

.nested-reply-wrapper:last-child {
  margin-bottom: 0;
}

/* 加载更多按钮 */
.load-more-replies-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #007AFF;
  font-size: 14px;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 20px;
  margin: 12px 0;
  display: flex;
  align-items: center;
  transition: all 0.2s ease;
  min-height: 44px; /* 移动端触摸友好 */
}

.load-more-replies-btn:hover {
  background: rgba(0, 122, 255, 0.1);
}

.load-more-replies-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.load-more-section {
  display: flex;
  justify-content: center;
  padding: 20px;
}

.load-more-btn {
  background: #F6F7F9;
  border: 1px solid #E5E5EA;
  cursor: pointer;
  color: #007AFF;
  font-size: 16px;
  font-weight: 500;
  padding: 12px 24px;
  border-radius: 25px;
  display: flex;
  align-items: center;
  transition: all 0.2s ease;
  min-height: 44px; /* 移动端触摸友好 */
}

.load-more-btn:hover {
  background: #F0F1F3;
  border-color: #D1D1D6;
}

.load-more-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 底部加载状态 */
.bottom-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #8991A0;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .comment-list {
    padding: 0 12px;
  }
  
  .comments-container {
    padding: 16px 0;
  }
  
  .comment-wrapper {
    margin-bottom: 20px;
  }
  
  .replies-container {
    margin-left: 16px;
    margin-top: 12px;
  }
  
  .nested-replies-container {
    margin-left: 16px;
  }
  
  .reply-indicator-line {
    left: 18px;
  }
  
  .load-more-replies-btn {
    font-size: 13px;
    padding: 6px 12px;
    min-height: 40px;
  }
  
  .load-more-btn {
    font-size: 15px;
    padding: 10px 20px;
    min-height: 40px;
  }
  
  .empty-state {
    padding: 60px 20px;
  }
  
  .empty-icon {
    font-size: 40px;
  }
  
  .empty-text {
    font-size: 16px;
  }
  
  .empty-subtext {
    font-size: 13px;
  }
}

/* 高性能滚动优化 */
.comment-list {
  -webkit-overflow-scrolling: touch;
  overflow-y: auto;
}

/* 触摸优化 */
.load-more-replies-btn,
.load-more-btn {
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

/* 无障碍支持 */
.loading-spinner {
  aria-label: "加载中";
}

.empty-state {
  role: "status";
  aria-live: "polite";
}

/* 性能优化：减少重绘 */
.comment-wrapper,
.reply-wrapper,
.nested-reply-wrapper {
  contain: layout style;
}
</style>