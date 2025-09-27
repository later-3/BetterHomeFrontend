<template>
  <div class="comment-replies" :class="{ 'is-expanded': isExpanded }">
    <!-- 展开/折叠按钮 -->
    <div 
      v-if="!isExpanded && totalReplies > 0" 
      class="replies-toggle"
      @click="toggleReplies"
    >
      <div class="toggle-line"></div>
      <button class="toggle-button" type="button">
        <span class="toggle-icon">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
        <span class="toggle-text">
          {{ loadingReplies ? '加载中...' : `查看${totalReplies}条回复` }}
        </span>
      </button>
    </div>

    <!-- 回复列表 -->
    <div 
      v-if="isExpanded" 
      class="replies-container"
      :style="{ maxHeight: containerMaxHeight }"
    >
      <!-- 折叠按钮 -->
      <div class="replies-header">
        <div class="header-line"></div>
        <button 
          class="collapse-button" 
          type="button"
          @click="collapseReplies"
        >
          <span class="collapse-icon">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M9 7.5L6 4.5L3 7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
          <span class="collapse-text">收起回复</span>
        </button>
      </div>

      <!-- 回复项列表 -->
      <div class="replies-list" ref="repliesListRef">
        <div 
          v-for="reply in displayedReplies" 
          :key="reply.id"
          class="reply-item"
          :class="{
            'is-highlighted': reply.id === highlightedReplyId,
            'is-new': reply.isNew
          }"
        >
          <CommentItem 
            :comment="reply"
            :level="1"
            :show-reply-button="false"
            :is-reply="true"
            @like="handleReplyLike"
            @reply="handleReplyToReply"
            @delete="handleReplyDelete"
          />
        </div>

        <!-- 加载更多回复 -->
        <div 
          v-if="hasMoreReplies && !loadingMoreReplies" 
          class="load-more-replies"
        >
          <button 
            class="load-more-button" 
            type="button"
            @click="loadMoreReplies"
          >
            <span class="load-more-text">查看更多回复 ({{ remainingRepliesCount }})</span>
            <span class="load-more-icon">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M4 6L7 9L10 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
          </button>
        </div>

        <!-- 加载更多状态 -->
        <div v-if="loadingMoreReplies" class="loading-more">
          <div class="loading-spinner"></div>
          <span class="loading-text">加载更多回复中...</span>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="isExpanded && displayedReplies.length === 0 && !loadingReplies" class="empty-replies">
        <div class="empty-icon">💬</div>
        <div class="empty-text">暂无回复</div>
      </div>

      <!-- 加载状态 -->
      <div v-if="loadingReplies" class="loading-replies">
        <div class="loading-skeleton" v-for="i in 3" :key="i">
          <div class="skeleton-avatar"></div>
          <div class="skeleton-content">
            <div class="skeleton-line skeleton-line-1"></div>
            <div class="skeleton-line skeleton-line-2"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <div class="error-message">{{ error }}</div>
      <button class="retry-button" type="button" @click="retryLoadReplies">
        重试
      </button>
    </div>
  </div>
</template>

<script>
import CommentItem from './CommentItem.vue'

export default {
  name: 'CommentReplies',
  components: {
    CommentItem
  },
  props: {
    // 父评论ID
    parentCommentId: {
      type: [String, Number],
      required: true
    },
    // 回复列表数据
    replies: {
      type: Array,
      default: () => []
    },
    // 总回复数量
    totalReplies: {
      type: Number,
      default: 0
    },
    // 是否有更多回复
    hasMoreReplies: {
      type: Boolean,
      default: false
    },
    // 每页显示数量
    pageSize: {
      type: Number,
      default: 10
    },
    // 初始展开状态
    initialExpanded: {
      type: Boolean,
      default: false
    },
    // 高亮回复ID
    highlightedReplyId: {
      type: [String, Number],
      default: null
    },
    // 最大高度（用于长列表优化）
    maxHeight: {
      type: String,
      default: '400px'
    },
    // 是否启用虚拟滚动
    enableVirtualScroll: {
      type: Boolean,
      default: false
    }
  },
  emits: [
    'expand',
    'collapse', 
    'load-replies',
    'load-more-replies',
    'reply-like',
    'reply-to-reply',
    'reply-delete'
  ],
  data() {
    return {
      // 展开状态
      isExpanded: this.initialExpanded,
      // 加载状态
      loadingReplies: false,
      loadingMoreReplies: false,
      // 错误状态
      error: null,
      // 当前页码
      currentPage: 1,
      // 显示的回复列表
      displayedReplies: [...this.replies],
      // 动画状态
      isAnimating: false,
      // 容器最大高度
      containerMaxHeight: this.maxHeight
    }
  },
  computed: {
    // 剩余回复数量
    remainingRepliesCount() {
      return Math.max(0, this.totalReplies - this.displayedReplies.length)
    }
  },
  watch: {
    // 监听外部回复数据变化
    replies: {
      handler(newReplies) {
        this.displayedReplies = [...newReplies]
      },
      deep: true
    },
    // 监听展开状态变化
    isExpanded(newValue) {
      if (newValue && this.displayedReplies.length === 0 && this.totalReplies > 0) {
        this.loadReplies()
      }
    }
  },
  methods: {
    // 切换展开/折叠状态
    async toggleReplies() {
      if (this.isAnimating) return
      
      this.isAnimating = true
      
      try {
        if (!this.isExpanded) {
          // 展开回复
          this.isExpanded = true
          this.$emit('expand', {
            parentCommentId: this.parentCommentId,
            totalReplies: this.totalReplies
          })
          
          // 如果没有回复数据，则加载
          if (this.displayedReplies.length === 0 && this.totalReplies > 0) {
            await this.loadReplies()
          }
        } else {
          // 折叠回复
          this.collapseReplies()
        }
      } finally {
        setTimeout(() => {
          this.isAnimating = false
        }, 300)
      }
    },

    // 折叠回复
    collapseReplies() {
      this.isExpanded = false
      this.$emit('collapse', {
        parentCommentId: this.parentCommentId
      })
    },

    // 加载回复列表
    async loadReplies() {
      if (this.loadingReplies) return
      
      this.loadingReplies = true
      this.error = null
      
      try {
        this.$emit('load-replies', {
          parentCommentId: this.parentCommentId,
          page: 1,
          pageSize: this.pageSize
        })
      } catch (error) {
        this.error = '加载回复失败，请重试'
        console.error('Load replies error:', error)
      } finally {
        this.loadingReplies = false
      }
    },

    // 加载更多回复
    async loadMoreReplies() {
      if (this.loadingMoreReplies || !this.hasMoreReplies) return
      
      this.loadingMoreReplies = true
      
      try {
        this.currentPage += 1
        this.$emit('load-more-replies', {
          parentCommentId: this.parentCommentId,
          page: this.currentPage,
          pageSize: this.pageSize
        })
      } catch (error) {
        this.error = '加载更多回复失败'
        console.error('Load more replies error:', error)
      } finally {
        this.loadingMoreReplies = false
      }
    },

    // 重试加载回复
    async retryLoadReplies() {
      this.error = null
      await this.loadReplies()
    },

    // 处理回复点赞
    handleReplyLike(likeData) {
      this.$emit('reply-like', {
        ...likeData,
        parentCommentId: this.parentCommentId
      })
    },

    // 处理回复的回复
    handleReplyToReply(replyData) {
      this.$emit('reply-to-reply', {
        ...replyData,
        parentCommentId: this.parentCommentId
      })
    },

    // 处理回复删除
    handleReplyDelete(deleteData) {
      this.$emit('reply-delete', {
        ...deleteData,
        parentCommentId: this.parentCommentId
      })
    },

    // 添加新回复（外部调用）
    addReply(newReply) {
      // 标记为新回复
      const replyWithNewFlag = {
        ...newReply,
        isNew: true
      }
      
      this.displayedReplies.unshift(replyWithNewFlag)
      
      // 如果未展开，自动展开
      if (!this.isExpanded) {
        this.isExpanded = true
      }
      
      // 移除新回复标记
      setTimeout(() => {
        const index = this.displayedReplies.findIndex(r => r.id === newReply.id)
        if (index !== -1) {
          this.displayedReplies[index].isNew = false
        }
      }, 2000)
    },

    // 更新回复（外部调用）
    updateReply(replyId, updatedData) {
      const index = this.displayedReplies.findIndex(r => r.id === replyId)
      if (index !== -1) {
        this.displayedReplies[index] = {
          ...this.displayedReplies[index],
          ...updatedData
        }
      }
    },

    // 删除回复（外部调用）
    removeReply(replyId) {
      const index = this.displayedReplies.findIndex(r => r.id === replyId)
      if (index !== -1) {
        this.displayedReplies.splice(index, 1)
      }
    },

    // 滚动到指定回复
    scrollToReply(replyId) {
      if (!this.isExpanded) {
        this.isExpanded = true
      }
      
      this.$nextTick(() => {
        const replyElement = this.$el.querySelector(`[data-reply-id="${replyId}"]`)
        if (replyElement) {
          replyElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          })
        }
      })
    }
  }
}
</script>

<style scoped>
.comment-replies {
  margin-top: 8px;
}

/* 展开/折叠按钮 */
.replies-toggle {
  display: flex;
  align-items: center;
  margin-left: 40px;
  margin-bottom: 8px;
}

.toggle-line {
  width: 20px;
  height: 1px;
  background: #E5E5EA;
  margin-right: 8px;
}

.toggle-button {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: transparent;
  border: none;
  border-radius: 16px;
  color: #007AFF;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 44px;
  -webkit-tap-highlight-color: transparent;
}

.toggle-button:hover {
  background: rgba(0, 122, 255, 0.1);
}

.toggle-button:active {
  transform: scale(0.98);
  background: rgba(0, 122, 255, 0.15);
}

.toggle-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  transition: transform 0.2s ease;
}

.toggle-text {
  white-space: nowrap;
}

/* 回复容器 */
.replies-container {
  margin-left: 40px;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

/* 回复头部 */
.replies-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.header-line {
  width: 20px;
  height: 1px;
  background: #E5E5EA;
  margin-right: 8px;
}

.collapse-button {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: transparent;
  border: none;
  border-radius: 12px;
  color: #8991A0;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 44px;
  -webkit-tap-highlight-color: transparent;
}

.collapse-button:hover {
  background: rgba(137, 145, 160, 0.1);
  color: #272727;
}

.collapse-button:active {
  transform: scale(0.98);
}

.collapse-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
}

/* 回复列表 */
.replies-list {
  position: relative;
}

.reply-item {
  position: relative;
  transition: all 0.3s ease;
}

.reply-item.is-highlighted {
  background: rgba(0, 122, 255, 0.05);
  border-radius: 8px;
  padding: 8px;
  margin: -8px;
}

.reply-item.is-new {
  animation: slideInFromTop 0.3s ease;
}

@keyframes slideInFromTop {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 加载更多按钮 */
.load-more-replies {
  margin-top: 12px;
  text-align: center;
}

.load-more-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: transparent;
  border: 1px solid #E5E5EA;
  border-radius: 20px;
  color: #007AFF;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 44px;
  -webkit-tap-highlight-color: transparent;
}

.load-more-button:hover {
  background: rgba(0, 122, 255, 0.05);
  border-color: #007AFF;
}

.load-more-button:active {
  transform: scale(0.98);
  background: rgba(0, 122, 255, 0.1);
}

.load-more-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
}

/* 加载更多状态 */
.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  color: #8991A0;
  font-size: 13px;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #E5E5EA;
  border-top: 2px solid #007AFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 空状态 */
.empty-replies {
  text-align: center;
  padding: 24px 16px;
  color: #8991A0;
}

.empty-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.empty-text {
  font-size: 14px;
}

/* 加载状态 */
.loading-replies {
  padding: 16px 0;
}

.loading-skeleton {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

.skeleton-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-content {
  flex: 1;
}

.skeleton-line {
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  margin-bottom: 8px;
}

.skeleton-line-1 {
  width: 80%;
}

.skeleton-line-2 {
  width: 60%;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* 错误状态 */
.error-state {
  text-align: center;
  padding: 16px;
  color: #FF3B30;
}

.error-icon {
  font-size: 20px;
  margin-bottom: 8px;
}

.error-message {
  font-size: 14px;
  margin-bottom: 12px;
}

.retry-button {
  padding: 8px 16px;
  background: #FF3B30;
  color: white;
  border: none;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 44px;
  -webkit-tap-highlight-color: transparent;
}

.retry-button:hover {
  background: #E6342A;
}

.retry-button:active {
  transform: scale(0.98);
}

/* 移动端优化 */
@media (max-width: 480px) {
  .replies-container {
    margin-left: 32px;
  }
  
  .toggle-line,
  .header-line {
    width: 16px;
  }
  
  .toggle-button,
  .collapse-button {
    padding: 8px 12px;
    min-height: 40px;
  }
  
  .load-more-button {
    padding: 10px 16px;
    min-height: 40px;
  }
  
  .retry-button {
    min-height: 40px;
  }
}

/* 展开动画 */
.comment-replies.is-expanded .replies-container {
  animation: expandReplies 0.3s ease;
}

@keyframes expandReplies {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: var(--max-height, 400px);
  }
}

/* 触摸优化 */
@media (hover: none) and (pointer: coarse) {
  .toggle-button:hover,
  .collapse-button:hover,
  .load-more-button:hover,
  .retry-button:hover {
    background: transparent;
  }
  
  .toggle-button:active,
  .collapse-button:active,
  .load-more-button:active,
  .retry-button:active {
    transform: scale(0.95);
  }
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .toggle-line,
  .header-line {
    background: #000;
  }
  
  .toggle-button,
  .load-more-button {
    border: 1px solid currentColor;
  }
}

/* 减少动画模式支持 */
@media (prefers-reduced-motion: reduce) {
  .comment-replies,
  .reply-item,
  .toggle-button,
  .collapse-button,
  .load-more-button,
  .retry-button,
  .toggle-icon,
  .loading-spinner {
    transition: none;
    animation: none;
  }
}
</style>