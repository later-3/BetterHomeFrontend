<template>
  <div class="comment-system" :class="{ 'debug-mode': debug }">
    <!-- 调试面板 -->
    <div v-if="debug" class="debug-panel" :class="`debug-${debugPosition}`">
      <div class="debug-header">
        <h4 class="debug-title">🔧 CommentSystem 调试面板</h4>
        <button 
          class="debug-toggle" 
          @click="debugExpanded = !debugExpanded"
          :class="{ 'is-expanded': debugExpanded }"
        >
          {{ debugExpanded ? '收起' : '展开' }}
        </button>
      </div>
      
      <div v-if="debugExpanded" class="debug-content">
        <!-- 系统状态 -->
        <div class="debug-section">
          <h5 class="debug-section-title">📊 系统状态</h5>
          <div class="debug-data">
            <div class="debug-item">
              <span class="debug-label">文章ID:</span>
              <span class="debug-value">{{ postId }}</span>
            </div>
            <div class="debug-item">
              <span class="debug-label">总评论数:</span>
              <span class="debug-value">{{ totalComments }}</span>
            </div>
            <div class="debug-item">
              <span class="debug-label">加载状态:</span>
              <span class="debug-value" :class="`status-${loadingState}`">{{ loadingState }}</span>
            </div>
            <div class="debug-item">
              <span class="debug-label">错误信息:</span>
              <span class="debug-value error">{{ error || '无' }}</span>
            </div>
          </div>
        </div>

        <!-- API 配置 -->
        <div class="debug-section">
          <h5 class="debug-section-title">🌐 API 配置</h5>
          <pre class="debug-json">{{ JSON.stringify(apiConfig, null, 2) }}</pre>
        </div>

        <!-- 评论数据 -->
        <div class="debug-section">
          <h5 class="debug-section-title">💬 评论数据 ({{ comments.length }}条)</h5>
          <div class="debug-data-list">
            <div 
              v-for="(comment, index) in comments.slice(0, 3)" 
              :key="comment.id"
              class="debug-comment-item"
            >
              <div class="debug-comment-header">
                <span class="debug-comment-id">#{{ comment.id }}</span>
                <span class="debug-comment-author">{{ comment.author?.name }}</span>
                <span class="debug-comment-time">{{ comment.created_at }}</span>
              </div>
              <div class="debug-comment-content">{{ comment.content?.substring(0, 50) }}...</div>
              <div class="debug-comment-meta">
                赞: {{ comment.likes_count }} | 回复: {{ comment.replies_count || 0 }}
              </div>
            </div>
            <div v-if="comments.length > 3" class="debug-more">
              还有 {{ comments.length - 3 }} 条评论...
            </div>
          </div>
        </div>

        <!-- API 日志 -->
        <div class="debug-section">
          <h5 class="debug-section-title">📝 API 日志 (最近{{ Math.min(apiLogs.length, 5) }}条)</h5>
          <div class="debug-logs">
            <div 
              v-for="log in apiLogs.slice(-5)" 
              :key="log.id"
              class="debug-log-item"
              :class="`log-${log.type}`"
            >
              <div class="log-header">
                <span class="log-method">{{ log.method }}</span>
                <span class="log-url">{{ log.url }}</span>
                <span class="log-time">{{ log.timestamp }}</span>
              </div>
              <div v-if="log.error" class="log-error">{{ log.error }}</div>
              <div v-if="log.response" class="log-response">
                响应: {{ typeof log.response === 'object' ? JSON.stringify(log.response).substring(0, 100) + '...' : log.response }}
              </div>
            </div>
          </div>
        </div>

        <!-- 性能指标 -->
        <div class="debug-section">
          <h5 class="debug-section-title">⚡ 性能指标</h5>
          <div class="debug-data">
            <div class="debug-item">
              <span class="debug-label">初始化时间:</span>
              <span class="debug-value">{{ performanceMetrics.initTime }}ms</span>
            </div>
            <div class="debug-item">
              <span class="debug-label">首次加载时间:</span>
              <span class="debug-value">{{ performanceMetrics.firstLoadTime }}ms</span>
            </div>
            <div class="debug-item">
              <span class="debug-label">平均API响应:</span>
              <span class="debug-value">{{ performanceMetrics.avgApiTime }}ms</span>
            </div>
            <div class="debug-item">
              <span class="debug-label">渲染次数:</span>
              <span class="debug-value">{{ performanceMetrics.renderCount }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="comment-system-content">
      <!-- 评论输入框 -->
      <div class="comment-input-section">
        <CommentInput
          :placeholder="inputConfig.placeholder"
          :max-length="inputConfig.maxLength"
          :debug="debug"
          @submit="handleCommentSubmit"
          @focus="handleInputFocus"
          @blur="handleInputBlur"
        />
      </div>

      <!-- 评论统计 -->
      <div class="comment-stats">
        <div class="stats-item">
          <span class="stats-count">{{ totalComments }}</span>
          <span class="stats-label">条评论</span>
        </div>
        <div class="stats-actions">
          <button 
            class="sort-button"
            :class="{ 'is-active': sortBy === 'time' }"
            @click="changeSortBy('time')"
          >
            按时间
          </button>
          <button 
            class="sort-button"
            :class="{ 'is-active': sortBy === 'hot' }"
            @click="changeSortBy('hot')"
          >
            按热度
          </button>
        </div>
      </div>

      <!-- 评论列表 -->
      <div class="comment-list-section">
        <CommentList
          :comments="comments"
          :loading="loadingState === 'loading'"
          :has-more="hasMoreComments"
          :loading-more="loadingState === 'loadingMore'"
          :highlighted-comment-id="highlightedCommentId"
          :debug="debug"
          @load-more="handleLoadMore"
          @comment-like="handleCommentLike"
          @comment-reply="handleCommentReply"
          @comment-delete="handleCommentDelete"
          @load-more-replies="handleLoadMoreReplies"
        />
      </div>

      <!-- 空状态 -->
      <div v-if="comments.length === 0 && loadingState === 'idle'" class="empty-state">
        <div class="empty-icon">💬</div>
        <div class="empty-title">还没有评论</div>
        <div class="empty-description">来发表第一条评论吧</div>
      </div>

      <!-- 加载状态 -->
      <div v-if="loadingState === 'loading'" class="loading-state">
        <div class="loading-spinner"></div>
        <div class="loading-text">加载评论中...</div>
      </div>

      <!-- 错误状态 -->
      <div v-if="error && loadingState === 'error'" class="error-state">
        <div class="error-icon">⚠️</div>
        <div class="error-title">加载失败</div>
        <div class="error-message">{{ error }}</div>
        <button class="retry-button" @click="retryLoad">重试</button>
      </div>
    </div>

    <!-- 浮动调试按钮 -->
    <button 
      v-if="debug && !debugExpanded" 
      class="debug-float-button"
      @click="debugExpanded = true"
      title="打开调试面板"
    >
      🔧
    </button>
  </div>
</template>

<script>
import CommentList from './CommentList.vue'
import CommentInput from './CommentInput.vue'

export default {
  name: 'CommentSystem',
  components: {
    CommentList,
    CommentInput
  },
  props: {
    // 文章ID
    postId: {
      type: [String, Number],
      required: true
    },
    // API配置
    apiConfig: {
      type: Object,
      default: () => ({
        baseURL: '/api/v1',
        endpoints: {
          list: '/comments',
          create: '/comments',
          like: '/comments/:id/like',
          delete: '/comments/:id',
          replies: '/comments/:id/replies'
        },
        headers: {},
        timeout: 10000
      })
    },
    // UI配置
    uiConfig: {
      type: Object,
      default: () => ({
        maxNestingLevel: 2,
        enableReplies: true,
        enableLikes: true,
        enableDelete: true,
        pageSize: 20,
        theme: 'light'
      })
    },
    // 输入框配置
    inputConfig: {
      type: Object,
      default: () => ({
        placeholder: '写下你的评论...',
        maxLength: 500,
        enableEmoji: true,
        enableMention: true
      })
    },
    // 初始排序方式
    initialSortBy: {
      type: String,
      default: 'time',
      validator: value => ['time', 'hot'].includes(value)
    },
    // 高亮评论ID
    highlightedCommentId: {
      type: [String, Number],
      default: null
    },
    // 调试模式
    debug: {
      type: Boolean,
      default: false
    },
    // 调试面板位置
    debugPosition: {
      type: String,
      default: 'bottom',
      validator: value => ['top', 'bottom', 'left', 'right'].includes(value)
    }
  },
  emits: [
    'comment-added',
    'comment-liked', 
    'comment-deleted',
    'comment-replied',
    'load-complete',
    'load-error',
    'sort-changed'
  ],
  data() {
    return {
      // 评论数据
      comments: [],
      totalComments: 0,
      hasMoreComments: false,
      currentPage: 1,
      
      // 状态管理
      loadingState: 'idle', // idle, loading, loadingMore, error
      error: null,
      sortBy: this.initialSortBy,
      
      // 调试相关
      debugExpanded: false,
      apiLogs: [],
      performanceMetrics: {
        initTime: 0,
        firstLoadTime: 0,
        avgApiTime: 0,
        renderCount: 0
      },
      
      // 内部状态
      initStartTime: 0,
      apiTimes: []
    }
  },
  computed: {
    // 完整的API配置
    fullApiConfig() {
      return {
        baseURL: this.apiConfig.baseURL || '/api/v1',
        endpoints: {
          list: '/comments',
          create: '/comments',
          like: '/comments/:id/like',
          delete: '/comments/:id',
          replies: '/comments/:id/replies',
          ...this.apiConfig.endpoints
        },
        headers: {
          'Content-Type': 'application/json',
          ...this.apiConfig.headers
        },
        timeout: this.apiConfig.timeout || 10000
      }
    }
  },
  watch: {
    // 监听文章ID变化
    postId: {
      handler(newPostId, oldPostId) {
        if (newPostId !== oldPostId) {
          this.resetAndLoad()
        }
      },
      immediate: false
    },
    
    // 监听排序变化
    sortBy(newSort) {
      this.loadComments(true)
      this.$emit('sort-changed', newSort)
    }
  },
  created() {
    this.initStartTime = performance.now()
    this.logDebug('CommentSystem created', { postId: this.postId })
  },
  async mounted() {
    // 记录初始化时间
    this.performanceMetrics.initTime = Math.round(performance.now() - this.initStartTime)
    
    // 加载初始数据
    await this.loadComments()
    
    // 记录首次加载时间
    this.performanceMetrics.firstLoadTime = Math.round(performance.now() - this.initStartTime)
    
    this.logDebug('CommentSystem mounted', {
      initTime: this.performanceMetrics.initTime,
      firstLoadTime: this.performanceMetrics.firstLoadTime
    })
  },
  methods: {
    // 加载评论列表
    async loadComments(reset = false) {
      if (reset) {
        this.currentPage = 1
        this.comments = []
      }
      
      this.loadingState = this.comments.length === 0 ? 'loading' : 'loadingMore'
      this.error = null
      
      const startTime = performance.now()
      
      try {
        const url = this.buildApiUrl('list')
        const params = {
          post_id: this.postId,
          page: this.currentPage,
          page_size: this.uiConfig.pageSize,
          sort_by: this.sortBy
        }
        
        this.logApiCall('GET', url, params)
        
        // 模拟API调用（实际项目中替换为真实API）
        const response = await this.mockApiCall(url, 'GET', params)
        
        const endTime = performance.now()
        const apiTime = Math.round(endTime - startTime)
        this.apiTimes.push(apiTime)
        this.performanceMetrics.avgApiTime = Math.round(
          this.apiTimes.reduce((a, b) => a + b, 0) / this.apiTimes.length
        )
        
        this.logApiResponse('GET', url, response, apiTime)
        
        // 处理响应数据
        if (reset) {
          this.comments = response.data || []
        } else {
          this.comments.push(...(response.data || []))
        }
        
        this.totalComments = response.total || 0
        this.hasMoreComments = response.has_more || false
        this.currentPage = response.current_page || this.currentPage
        
        this.loadingState = 'idle'
        this.$emit('load-complete', {
          comments: this.comments,
          total: this.totalComments,
          page: this.currentPage
        })
        
      } catch (error) {
        const endTime = performance.now()
        const apiTime = Math.round(endTime - startTime)
        
        this.error = error.message || '加载评论失败'
        this.loadingState = 'error'
        
        this.logApiError('GET', this.buildApiUrl('list'), error, apiTime)
        this.$emit('load-error', error)
      }
    },
    
    // 加载更多评论
    async handleLoadMore() {
      if (this.loadingState !== 'idle' || !this.hasMoreComments) return
      
      this.currentPage += 1
      await this.loadComments()
    },
    
    // 提交评论
    async handleCommentSubmit(submitData) {
      const startTime = performance.now()
      
      try {
        const url = this.buildApiUrl('create')
        const data = {
          post_id: this.postId,
          content: submitData.content,
          parent_id: submitData.parentId || null,
          mentions: submitData.mentions || []
        }
        
        this.logApiCall('POST', url, data)
        
        // 模拟API调用
        const response = await this.mockApiCall(url, 'POST', data)
        
        const endTime = performance.now()
        const apiTime = Math.round(endTime - startTime)
        
        this.logApiResponse('POST', url, response, apiTime)
        
        // 添加新评论到列表
        if (response.data) {
          this.comments.unshift(response.data)
          this.totalComments += 1
          
          this.$emit('comment-added', response.data)
        }
        
      } catch (error) {
        const endTime = performance.now()
        const apiTime = Math.round(endTime - startTime)
        
        this.logApiError('POST', this.buildApiUrl('create'), error, apiTime)
        throw error // 重新抛出错误，让输入组件处理
      }
    },
    
    // 处理评论点赞
    async handleCommentLike(likeData) {
      const startTime = performance.now()
      
      try {
        const url = this.buildApiUrl('like', { id: likeData.commentId })
        const data = { is_liked: likeData.isLiked }
        
        this.logApiCall('POST', url, data)
        
        // 模拟API调用
        const response = await this.mockApiCall(url, 'POST', data)
        
        const endTime = performance.now()
        const apiTime = Math.round(endTime - startTime)
        
        this.logApiResponse('POST', url, response, apiTime)
        
        // 更新评论点赞状态
        const comment = this.findCommentById(likeData.commentId)
        if (comment) {
          comment.is_liked = likeData.isLiked
          comment.likes_count += likeData.isLiked ? 1 : -1
        }
        
        this.$emit('comment-liked', likeData)
        
      } catch (error) {
        const endTime = performance.now()
        const apiTime = Math.round(endTime - startTime)
        
        this.logApiError('POST', this.buildApiUrl('like', { id: likeData.commentId }), error, apiTime)
      }
    },
    
    // 处理评论回复
    handleCommentReply(replyData) {
      this.$emit('comment-replied', replyData)
      // 这里可以触发输入框的回复模式
    },
    
    // 处理评论删除
    async handleCommentDelete(deleteData) {
      const startTime = performance.now()
      
      try {
        const url = this.buildApiUrl('delete', { id: deleteData.commentId })
        
        this.logApiCall('DELETE', url)
        
        // 模拟API调用
        const response = await this.mockApiCall(url, 'DELETE')
        
        const endTime = performance.now()
        const apiTime = Math.round(endTime - startTime)
        
        this.logApiResponse('DELETE', url, response, apiTime)
        
        // 从列表中移除评论
        const index = this.comments.findIndex(c => c.id === deleteData.commentId)
        if (index !== -1) {
          this.comments.splice(index, 1)
          this.totalComments -= 1
        }
        
        this.$emit('comment-deleted', deleteData)
        
      } catch (error) {
        const endTime = performance.now()
        const apiTime = Math.round(endTime - startTime)
        
        this.logApiError('DELETE', this.buildApiUrl('delete', { id: deleteData.commentId }), error, apiTime)
      }
    },
    
    // 处理加载更多回复
    async handleLoadMoreReplies(repliesData) {
      const startTime = performance.now()
      
      try {
        const url = this.buildApiUrl('replies', { id: repliesData.parentCommentId })
        const params = {
          page: repliesData.page,
          page_size: repliesData.pageSize
        }
        
        this.logApiCall('GET', url, params)
        
        // 模拟API调用
        const response = await this.mockApiCall(url, 'GET', params)
        
        const endTime = performance.now()
        const apiTime = Math.round(endTime - startTime)
        
        this.logApiResponse('GET', url, response, apiTime)
        
        // 更新回复数据（这里需要根据实际的数据结构来处理）
        // 实际实现中需要找到对应的评论并更新其回复列表
        
      } catch (error) {
        const endTime = performance.now()
        const apiTime = Math.round(endTime - startTime)
        
        this.logApiError('GET', this.buildApiUrl('replies', { id: repliesData.parentCommentId }), error, apiTime)
      }
    },
    
    // 处理输入框焦点
    handleInputFocus() {
      this.logDebug('Input focused')
    },
    
    // 处理输入框失焦
    handleInputBlur() {
      this.logDebug('Input blurred')
    },
    
    // 改变排序方式
    changeSortBy(newSort) {
      if (this.sortBy !== newSort) {
        this.sortBy = newSort
        this.logDebug('Sort changed', { sortBy: newSort })
      }
    },
    
    // 重试加载
    async retryLoad() {
      this.logDebug('Retry load')
      await this.loadComments(true)
    },
    
    // 重置并加载
    async resetAndLoad() {
      this.comments = []
      this.totalComments = 0
      this.hasMoreComments = false
      this.currentPage = 1
      this.error = null
      this.loadingState = 'idle'
      
      this.logDebug('Reset and load', { postId: this.postId })
      await this.loadComments()
    },
    
    // 构建API URL
    buildApiUrl(endpoint, params = {}) {
      let url = this.fullApiConfig.baseURL + this.fullApiConfig.endpoints[endpoint]
      
      // 替换URL参数
      Object.keys(params).forEach(key => {
        url = url.replace(`:${key}`, params[key])
      })
      
      return url
    },
    
    // 根据ID查找评论
    findCommentById(commentId) {
      return this.comments.find(comment => comment.id === commentId)
    },
    
    // 模拟API调用（实际项目中替换为真实的HTTP请求）
    async mockApiCall(url, method, data = null) {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500))
      
      // 模拟不同的响应
      if (url.includes('/comments') && method === 'GET') {
        return this.mockGetComments(data)
      } else if (url.includes('/comments') && method === 'POST') {
        return this.mockCreateComment(data)
      } else if (url.includes('/like') && method === 'POST') {
        return this.mockLikeComment(data)
      } else if (method === 'DELETE') {
        return { success: true }
      }
      
      throw new Error('API endpoint not found')
    },
    
    // 模拟获取评论列表
    mockGetComments(params) {
      const page = params?.page || 1
      const pageSize = params?.page_size || 20
      const sortBy = params?.sort_by || 'time'
      
      // 生成模拟数据
      const totalCount = 50 + Math.floor(Math.random() * 100)
      const startIndex = (page - 1) * pageSize
      const comments = []
      
      for (let i = 0; i < Math.min(pageSize, totalCount - startIndex); i++) {
        const index = startIndex + i + 1
        comments.push({
          id: `comment-${index}`,
          author: {
            name: `用户${index}`,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${index}`
          },
          content: `这是第${index}条评论内容，用来测试评论系统的功能。排序方式：${sortBy}`,
          created_at: new Date(Date.now() - index * 3600000).toISOString(),
          likes_count: Math.floor(Math.random() * 50),
          replies_count: Math.floor(Math.random() * 10),
          is_liked: Math.random() > 0.7
        })
      }
      
      return {
        data: comments,
        total: totalCount,
        current_page: page,
        has_more: startIndex + pageSize < totalCount
      }
    },
    
    // 模拟创建评论
    mockCreateComment(data) {
      const newComment = {
        id: `comment-${Date.now()}`,
        author: {
          name: '当前用户',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=current'
        },
        content: data.content,
        created_at: new Date().toISOString(),
        likes_count: 0,
        replies_count: 0,
        is_liked: false,
        parent_id: data.parent_id
      }
      
      return { data: newComment }
    },
    
    // 模拟点赞评论
    mockLikeComment(data) {
      return { 
        success: true,
        is_liked: data.is_liked
      }
    },
    
    // 调试日志方法
    logDebug(message, data = null) {
      if (this.debug) {
        console.log(`[CommentSystem Debug] ${message}`, data)
      }
    },
    
    // 记录API调用
    logApiCall(method, url, data = null) {
      const log = {
        id: Date.now() + Math.random(),
        type: 'request',
        method,
        url,
        data,
        timestamp: new Date().toLocaleTimeString()
      }
      
      this.apiLogs.push(log)
      this.logDebug(`API ${method} ${url}`, data)
    },
    
    // 记录API响应
    logApiResponse(method, url, response, time) {
      const log = {
        id: Date.now() + Math.random(),
        type: 'response',
        method,
        url,
        response,
        time,
        timestamp: new Date().toLocaleTimeString()
      }
      
      this.apiLogs.push(log)
      this.logDebug(`API ${method} ${url} - ${time}ms`, response)
    },
    
    // 记录API错误
    logApiError(method, url, error, time) {
      const log = {
        id: Date.now() + Math.random(),
        type: 'error',
        method,
        url,
        error: error.message,
        time,
        timestamp: new Date().toLocaleTimeString()
      }
      
      this.apiLogs.push(log)
      this.logDebug(`API ${method} ${url} - Error: ${error.message}`, error)
    }
  },
  beforeUpdate() {
    this.performanceMetrics.renderCount += 1
  }
}
</script>

<style scoped>
.comment-system {
  position: relative;
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.comment-system.debug-mode {
  border: 2px dashed #007AFF;
}

/* 调试面板样式 */
.debug-panel {
  background: #1a1a1a;
  color: #ffffff;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.debug-panel.debug-top {
  order: -1;
}

.debug-panel.debug-bottom {
  order: 1;
  margin-top: 16px;
  margin-bottom: 0;
}

.debug-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #2d2d2d;
  border-bottom: 1px solid #404040;
}

.debug-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #00d4ff;
}

.debug-toggle {
  padding: 4px 8px;
  background: #007AFF;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.debug-toggle:hover {
  background: #0056CC;
}

.debug-toggle.is-expanded {
  background: #FF3B30;
}

.debug-content {
  padding: 16px;
  max-height: 400px;
  overflow-y: auto;
}

.debug-section {
  margin-bottom: 20px;
}

.debug-section-title {
  margin: 0 0 8px 0;
  font-size: 13px;
  font-weight: 600;
  color: #00ff88;
  border-bottom: 1px solid #404040;
  padding-bottom: 4px;
}

.debug-data {
  display: grid;
  gap: 6px;
}

.debug-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.debug-label {
  color: #888;
  min-width: 80px;
  font-size: 11px;
}

.debug-value {
  color: #fff;
  font-weight: 500;
}

.debug-value.status-loading {
  color: #ffaa00;
}

.debug-value.status-error {
  color: #ff4444;
}

.debug-value.status-idle {
  color: #00ff88;
}

.debug-value.error {
  color: #ff4444;
}

.debug-json {
  background: #0d1117;
  padding: 12px;
  border-radius: 6px;
  font-size: 11px;
  line-height: 1.4;
  overflow-x: auto;
  border: 1px solid #404040;
  color: #e6edf3;
}

.debug-data-list {
  max-height: 200px;
  overflow-y: auto;
}

.debug-comment-item {
  background: #2d2d2d;
  padding: 8px;
  border-radius: 4px;
  margin-bottom: 8px;
  border-left: 3px solid #007AFF;
}

.debug-comment-header {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 11px;
}

.debug-comment-id {
  color: #00d4ff;
  font-weight: 600;
}

.debug-comment-author {
  color: #00ff88;
}

.debug-comment-time {
  color: #888;
}

.debug-comment-content {
  color: #fff;
  font-size: 11px;
  margin-bottom: 4px;
}

.debug-comment-meta {
  color: #888;
  font-size: 10px;
}

.debug-more {
  color: #888;
  font-style: italic;
  text-align: center;
  padding: 8px;
}

.debug-logs {
  max-height: 200px;
  overflow-y: auto;
}

.debug-log-item {
  background: #2d2d2d;
  padding: 8px;
  border-radius: 4px;
  margin-bottom: 6px;
  border-left: 3px solid #666;
}

.debug-log-item.log-request {
  border-left-color: #007AFF;
}

.debug-log-item.log-response {
  border-left-color: #00ff88;
}

.debug-log-item.log-error {
  border-left-color: #ff4444;
}

.log-header {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 11px;
}

.log-method {
  color: #00d4ff;
  font-weight: 600;
  min-width: 40px;
}

.log-url {
  color: #fff;
  flex: 1;
}

.log-time {
  color: #888;
}

.log-error {
  color: #ff4444;
  font-size: 11px;
  margin-top: 4px;
}

.log-response {
  color: #00ff88;
  font-size: 11px;
  margin-top: 4px;
}

/* 浮动调试按钮 */
.debug-float-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #007AFF;
  color: white;
  border: none;
  font-size: 20px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
  z-index: 1000;
  transition: all 0.2s ease;
}

.debug-float-button:hover {
  background: #0056CC;
  transform: scale(1.1);
}

/* 主要内容区域 */
.comment-system-content {
  padding: 16px;
}

.comment-input-section {
  margin-bottom: 20px;
}

.comment-stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #E5E5EA;
  margin-bottom: 16px;
}

.stats-item {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.stats-count {
  font-size: 18px;
  font-weight: 600;
  color: #272727;
}

.stats-label {
  font-size: 14px;
  color: #8991A0;
}

.stats-actions {
  display: flex;
  gap: 8px;
}

.sort-button {
  padding: 6px 12px;
  background: transparent;
  border: 1px solid #E5E5EA;
  border-radius: 16px;
  color: #8991A0;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 44px;
}

.sort-button:hover {
  background: rgba(137, 145, 160, 0.1);
}

.sort-button.is-active {
  background: #007AFF;
  color: white;
  border-color: #007AFF;
}

.comment-list-section {
  margin-bottom: 20px;
}

/* 状态样式 */
.empty-state,
.loading-state,
.error-state {
  text-align: center;
  padding: 40px 20px;
}

.empty-icon,
.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-title,
.error-title {
  font-size: 18px;
  font-weight: 600;
  color: #272727;
  margin-bottom: 8px;
}

.empty-description,
.error-message {
  font-size: 14px;
  color: #8991A0;
  margin-bottom: 16px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #E5E5EA;
  border-top: 3px solid #007AFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  color: #8991A0;
  font-size: 14px;
}

.retry-button {
  padding: 10px 20px;
  background: #007AFF;
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 44px;
}

.retry-button:hover {
  background: #0056CC;
}

/* 移动端优化 */
@media (max-width: 480px) {
  .comment-system-content {
    padding: 12px;
  }
  
  .debug-panel {
    margin: 8px;
    border-radius: 6px;
  }
  
  .debug-content {
    padding: 12px;
    max-height: 300px;
  }
  
  .debug-float-button {
    bottom: 16px;
    right: 16px;
    width: 44px;
    height: 44px;
    font-size: 18px;
  }
  
  .stats-actions {
    gap: 6px;
  }
  
  .sort-button {
    padding: 8px 12px;
    min-height: 40px;
    font-size: 12px;
  }
  
  .retry-button {
    min-height: 40px;
  }
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .debug-panel {
    border: 2px solid #000;
  }
  
  .sort-button {
    border-color: #000;
  }
}

/* 减少动画模式支持 */
@media (prefers-reduced-motion: reduce) {
  .debug-toggle,
  .sort-button,
  .retry-button,
  .debug-float-button,
  .loading-spinner {
    transition: none;
    animation: none;
  }
}
</style>