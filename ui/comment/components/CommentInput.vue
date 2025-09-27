<template>
  <div class="comment-input" :class="{ 'mobile-optimized': isMobile, 'reply-mode': isReplyMode }">
    <!-- 回复模式提示 -->
    <div v-if="isReplyMode && replyTo" class="reply-indicator">
      <div class="reply-info">
        <span class="reply-text">回复 @{{ replyTo.name }}</span>
        <button class="cancel-reply-btn" @click="cancelReply" aria-label="取消回复">
          <span class="cancel-icon">×</span>
        </button>
      </div>
    </div>
    
    <!-- 输入区域 -->
    <div class="input-container">
      <!-- 用户头像 -->
      <div v-if="showAvatar && currentUser" class="user-avatar">
        <img 
          :src="currentUser.avatar" 
          :alt="currentUser.name"
          @error="handleAvatarError"
        >
      </div>
      
      <!-- 输入框区域 -->
      <div class="input-wrapper">
        <!-- 文本输入框 -->
        <div class="textarea-container">
          <textarea
            ref="textareaRef"
            v-model="inputText"
            :placeholder="computedPlaceholder"
            :maxlength="maxLength"
            :disabled="isSubmitting"
            class="comment-textarea"
            rows="1"
            @input="handleInput"
            @focus="handleFocus"
            @blur="handleBlur"
            @keydown="handleKeydown"
            @paste="handlePaste"
          ></textarea>
          
          <!-- 字数统计 -->
          <div v-if="showCharCount" class="char-count" :class="{ 'over-limit': isOverLimit }">
            {{ inputText.length }}/{{ maxLength }}
          </div>
        </div>
        
        <!-- 工具栏 -->
        <div v-if="showToolbar" class="input-toolbar">
          <!-- 表情按钮 -->
          <button 
            v-if="enableEmoji"
            class="toolbar-btn emoji-btn"
            @click="toggleEmojiPicker"
            :disabled="isSubmitting"
            aria-label="添加表情"
          >
            <span class="emoji-icon">😊</span>
          </button>
          
          <!-- @提及按钮 -->
          <button 
            v-if="enableMention"
            class="toolbar-btn mention-btn"
            @click="triggerMention"
            :disabled="isSubmitting"
            aria-label="提及用户"
          >
            <span class="mention-icon">@</span>
          </button>
          
          <!-- 发布按钮 -->
          <button 
            class="submit-btn"
            :class="{ 'active': canSubmit, 'loading': isSubmitting }"
            :disabled="!canSubmit || isSubmitting"
            @click="handleSubmit"
            aria-label="发布评论"
          >
            <span v-if="isSubmitting" class="loading-spinner"></span>
            <span v-else class="submit-text">{{ submitButtonText }}</span>
          </button>
        </div>
      </div>
    </div>
    
    <!-- 表情选择器 -->
    <div v-if="showEmojiPicker" class="emoji-picker" @click.stop>
      <div class="emoji-grid">
        <button 
          v-for="emoji in emojiList" 
          :key="emoji"
          class="emoji-item"
          @click="insertEmoji(emoji)"
        >
          {{ emoji }}
        </button>
      </div>
    </div>
    
    <!-- 提及用户列表 -->
    <div v-if="showMentionList" class="mention-list" @click.stop>
      <div v-if="mentionUsers.length === 0" class="mention-empty">
        暂无用户
      </div>
      <button 
        v-for="user in mentionUsers" 
        :key="user.id"
        class="mention-item"
        @click="selectMentionUser(user)"
      >
        <img :src="user.avatar" :alt="user.name" class="mention-avatar">
        <span class="mention-name">{{ user.name }}</span>
      </button>
    </div>
    
    <!-- 错误提示 -->
    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'CommentInput',
  
  props: {
    // 当前用户信息
    currentUser: {
      type: Object,
      default: null
    },
    
    // 是否显示用户头像
    showAvatar: {
      type: Boolean,
      default: true
    },
    
    // 占位符文本
    placeholder: {
      type: String,
      default: '写下你的评论...'
    },
    
    // 最大字符数
    maxLength: {
      type: Number,
      default: 500
    },
    
    // 是否显示字数统计
    showCharCount: {
      type: Boolean,
      default: true
    },
    
    // 是否显示工具栏
    showToolbar: {
      type: Boolean,
      default: true
    },
    
    // 是否启用表情功能
    enableEmoji: {
      type: Boolean,
      default: true
    },
    
    // 是否启用@提及功能
    enableMention: {
      type: Boolean,
      default: true
    },
    
    // 回复模式
    isReplyMode: {
      type: Boolean,
      default: false
    },
    
    // 回复的目标用户
    replyTo: {
      type: Object,
      default: null
    },
    
    // 是否为移动端
    isMobile: {
      type: Boolean,
      default: true
    },
    
    // 提交按钮文本
    submitButtonText: {
      type: String,
      default: '发布'
    },
    
    // 是否自动聚焦
    autoFocus: {
      type: Boolean,
      default: false
    },
    
    // 最小行数
    minRows: {
      type: Number,
      default: 1
    },
    
    // 最大行数
    maxRows: {
      type: Number,
      default: 6
    }
  },
  
  emits: [
    'submit',           // 提交评论
    'cancel-reply',     // 取消回复
    'focus',           // 输入框聚焦
    'blur',            // 输入框失焦
    'input',           // 输入内容变化
    'mention-search',  // 搜索提及用户
    'emoji-select'     // 选择表情
  ],
  
  data() {
    return {
      // 输入文本
      inputText: '',
      
      // 是否正在提交
      isSubmitting: false,
      
      // 是否聚焦
      isFocused: false,
      
      // 是否显示表情选择器
      showEmojiPicker: false,
      
      // 是否显示提及列表
      showMentionList: false,
      
      // 提及用户列表
      mentionUsers: [],
      
      // 错误信息
      errorMessage: '',
      
      // 当前光标位置
      cursorPosition: 0,
      
      // 表情列表
      emojiList: [
        '😊', '😂', '❤️', '👍', '👎', '😍', '😢', '😮', '😡', '🤔',
        '👏', '🙏', '💪', '🔥', '✨', '🎉', '😎', '🤗', '😴', '🤯'
      ],
      
      // 防抖定时器
      mentionSearchTimer: null
    }
  },
  
  computed: {
    // 是否可以提交
    canSubmit() {
      return this.inputText.trim().length > 0 && 
             this.inputText.length <= this.maxLength &&
             !this.isSubmitting
    },
    
    // 是否超出字数限制
    isOverLimit() {
      return this.inputText.length > this.maxLength
    },
    
    // 计算后的占位符
    computedPlaceholder() {
      if (this.isReplyMode && this.replyTo) {
        return `回复 @${this.replyTo.name}...`
      }
      return this.placeholder
    }
  },
  
  methods: {
    // 处理输入
    handleInput(event) {
      const value = event.target.value
      this.inputText = value
      this.cursorPosition = event.target.selectionStart
      
      // 自动调整高度
      this.adjustTextareaHeight()
      
      // 检查@提及
      this.checkMention(value, this.cursorPosition)
      
      // 清除错误信息
      if (this.errorMessage) {
        this.errorMessage = ''
      }
      
      this.$emit('input', value)
    },
    
    // 处理聚焦
    handleFocus(event) {
      this.isFocused = true
      this.$emit('focus', event)
    },
    
    // 处理失焦
    handleBlur(event) {
      this.isFocused = false
      // 延迟隐藏弹窗，避免点击弹窗时立即关闭
      setTimeout(() => {
        this.showEmojiPicker = false
        this.showMentionList = false
      }, 200)
      this.$emit('blur', event)
    },
    
    // 处理键盘事件
    handleKeydown(event) {
      // Ctrl/Cmd + Enter 提交
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault()
        this.handleSubmit()
        return
      }
      
      // 处理提及列表导航
      if (this.showMentionList) {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault()
          // TODO: 实现键盘导航
        } else if (event.key === 'Enter') {
          event.preventDefault()
          // TODO: 选择当前高亮的用户
        } else if (event.key === 'Escape') {
          this.showMentionList = false
        }
      }
    },
    
    // 处理粘贴
    handlePaste(event) {
      // 可以在这里处理特殊的粘贴逻辑
      // 比如过滤内容、限制长度等
    },
    
    // 自动调整文本框高度
    adjustTextareaHeight() {
      this.$nextTick(() => {
        const textarea = this.$refs.textareaRef
        if (!textarea) return
        
        // 重置高度
        textarea.style.height = 'auto'
        
        // 计算新高度
        const lineHeight = 20 // 行高
        const minHeight = this.minRows * lineHeight
        const maxHeight = this.maxRows * lineHeight
        const scrollHeight = textarea.scrollHeight
        
        const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight)
        textarea.style.height = newHeight + 'px'
      })
    },
    
    // 检查@提及
    checkMention(text, cursorPos) {
      const beforeCursor = text.substring(0, cursorPos)
      const mentionMatch = beforeCursor.match(/@(\w*)$/)
      
      if (mentionMatch) {
        const query = mentionMatch[1]
        this.searchMentionUsers(query)
        this.showMentionList = true
      } else {
        this.showMentionList = false
      }
    },
    
    // 搜索提及用户
    searchMentionUsers(query) {
      // 清除之前的定时器
      if (this.mentionSearchTimer) {
        clearTimeout(this.mentionSearchTimer)
      }
      
      // 防抖搜索
      this.mentionSearchTimer = setTimeout(() => {
        this.$emit('mention-search', query)
      }, 300)
    },
    
    // 选择提及用户
    selectMentionUser(user) {
      const textarea = this.$refs.textareaRef
      const cursorPos = this.cursorPosition
      const text = this.inputText
      
      // 找到@符号的位置
      const beforeCursor = text.substring(0, cursorPos)
      const mentionMatch = beforeCursor.match(/@(\w*)$/)
      
      if (mentionMatch) {
        const mentionStart = beforeCursor.lastIndexOf('@')
        const beforeMention = text.substring(0, mentionStart)
        const afterCursor = text.substring(cursorPos)
        
        // 插入用户名
        const newText = beforeMention + `@${user.name} ` + afterCursor
        this.inputText = newText
        
        // 设置光标位置
        this.$nextTick(() => {
          const newCursorPos = mentionStart + user.name.length + 2
          textarea.setSelectionRange(newCursorPos, newCursorPos)
          textarea.focus()
        })
      }
      
      this.showMentionList = false
    },
    
    // 切换表情选择器
    toggleEmojiPicker() {
      this.showEmojiPicker = !this.showEmojiPicker
      this.showMentionList = false
    },
    
    // 插入表情
    insertEmoji(emoji) {
      const textarea = this.$refs.textareaRef
      const cursorPos = textarea.selectionStart
      const text = this.inputText
      
      const beforeCursor = text.substring(0, cursorPos)
      const afterCursor = text.substring(cursorPos)
      
      this.inputText = beforeCursor + emoji + afterCursor
      
      // 设置光标位置
      this.$nextTick(() => {
        const newCursorPos = cursorPos + emoji.length
        textarea.setSelectionRange(newCursorPos, newCursorPos)
        textarea.focus()
        this.adjustTextareaHeight()
      })
      
      this.showEmojiPicker = false
      this.$emit('emoji-select', emoji)
    },
    
    // 触发@提及
    triggerMention() {
      const textarea = this.$refs.textareaRef
      const cursorPos = textarea.selectionStart
      const text = this.inputText
      
      const beforeCursor = text.substring(0, cursorPos)
      const afterCursor = text.substring(cursorPos)
      
      // 如果光标前不是空格或开头，添加空格
      const needSpace = beforeCursor.length > 0 && !beforeCursor.endsWith(' ')
      const insertText = needSpace ? ' @' : '@'
      
      this.inputText = beforeCursor + insertText + afterCursor
      
      // 设置光标位置并触发搜索
      this.$nextTick(() => {
        const newCursorPos = cursorPos + insertText.length
        textarea.setSelectionRange(newCursorPos, newCursorPos)
        textarea.focus()
        this.checkMention(this.inputText, newCursorPos)
      })
    },
    
    // 取消回复
    cancelReply() {
      this.$emit('cancel-reply')
    },
    
    // 提交评论
    async handleSubmit() {
      if (!this.canSubmit) return
      
      const content = this.inputText.trim()
      if (!content) return
      
      this.isSubmitting = true
      this.errorMessage = ''
      
      try {
        const commentData = {
          content,
          replyTo: this.isReplyMode ? this.replyTo : null,
          mentions: this.extractMentions(content),
          timestamp: new Date().toISOString()
        }
        
        await this.$emit('submit', commentData)
        
        // 提交成功后清空输入
        this.inputText = ''
        this.adjustTextareaHeight()
        
      } catch (error) {
        this.errorMessage = error.message || '发布失败，请重试'
      } finally {
        this.isSubmitting = false
      }
    },
    
    // 提取@提及
    extractMentions(text) {
      const mentionRegex = /@(\w+)/g
      const mentions = []
      let match
      
      while ((match = mentionRegex.exec(text)) !== null) {
        mentions.push(match[1])
      }
      
      return mentions
    },
    
    // 处理头像错误
    handleAvatarError(event) {
      event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNGMEYwRjAiLz4KPGNpcmNsZSBjeD0iMjAiIGN5PSIxNiIgcj0iNiIgZmlsbD0iI0NDQ0NDQyIvPgo8cGF0aCBkPSJNMTAgMzJDMTAgMjYuNDc3MSAxNC40NzcxIDIyIDE5IDIySDIxQzI1LjUyMjkgMjIgMzAgMjYuNDc3MSAzMCAzMlYzNEgxMFYzMloiIGZpbGw9IiNDQ0NDQ0MiLz4KPC9zdmc+'
    },
    
    // 聚焦输入框
    focus() {
      this.$nextTick(() => {
        this.$refs.textareaRef?.focus()
      })
    },
    
    // 清空输入
    clear() {
      this.inputText = ''
      this.adjustTextareaHeight()
      this.errorMessage = ''
    },
    
    // 设置提及用户列表
    setMentionUsers(users) {
      this.mentionUsers = users || []
    }
  },
  
  mounted() {
    // 自动聚焦
    if (this.autoFocus) {
      this.focus()
    }
    
    // 点击外部关闭弹窗
    document.addEventListener('click', this.handleClickOutside)
  },
  
  beforeUnmount() {
    // 清理事件监听
    document.removeEventListener('click', this.handleClickOutside)
    
    // 清理定时器
    if (this.mentionSearchTimer) {
      clearTimeout(this.mentionSearchTimer)
    }
  },
  
  methods: {
    ...this.methods,
    
    // 处理点击外部
    handleClickOutside(event) {
      if (!this.$el.contains(event.target)) {
        this.showEmojiPicker = false
        this.showMentionList = false
      }
    }
  }
}
</script>

<style scoped>
.comment-input {
  width: 100%;
  max-width: 570px;
  margin: 0 auto;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
  position: relative;
}

.mobile-optimized {
  padding: 0 16px;
}

/* 回复模式提示 */
.reply-indicator {
  background: #F0F1F3;
  border-radius: 8px 8px 0 0;
  padding: 12px 16px;
  border-left: 3px solid #007AFF;
}

.reply-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.reply-text {
  font-size: 14px;
  color: #007AFF;
  font-weight: 500;
}

.cancel-reply-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  color: #8991A0;
  transition: all 0.2s ease;
  min-width: 24px;
  min-height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cancel-reply-btn:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #272727;
}

.cancel-icon {
  font-size: 18px;
  font-weight: bold;
}

/* 输入容器 */
.input-container {
  display: flex;
  gap: 12px;
  background: #FFFFFF;
  border: 1px solid #E5E5EA;
  border-radius: 12px;
  padding: 16px;
  transition: border-color 0.2s ease;
}

.reply-mode .input-container {
  border-radius: 0 0 12px 12px;
  border-top: none;
}

.input-container:focus-within {
  border-color: #007AFF;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

/* 用户头像 */
.user-avatar {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

/* 输入包装器 */
.input-wrapper {
  flex: 1;
  min-width: 0;
}

/* 文本框容器 */
.textarea-container {
  position: relative;
  margin-bottom: 12px;
}

.comment-textarea {
  width: 100%;
  border: none;
  outline: none;
  resize: none;
  font-family: inherit;
  font-size: 16px;
  line-height: 1.4;
  color: #272727;
  background: transparent;
  min-height: 20px;
  max-height: 120px;
  overflow-y: auto;
}

.comment-textarea::placeholder {
  color: #8991A0;
}

.comment-textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 字数统计 */
.char-count {
  position: absolute;
  bottom: -20px;
  right: 0;
  font-size: 12px;
  color: #8991A0;
}

.char-count.over-limit {
  color: #FF3B30;
}

/* 工具栏 */
.input-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.toolbar-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  color: #8991A0;
  transition: all 0.2s ease;
  min-width: 36px;
  min-height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toolbar-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #272727;
}

.toolbar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.emoji-icon,
.mention-icon {
  font-size: 18px;
}

/* 发布按钮 */
.submit-btn {
  background: #E5E5EA;
  border: none;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  color: #8991A0;
  transition: all 0.2s ease;
  min-height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.submit-btn.active {
  background: #007AFF;
  color: #FFFFFF;
}

.submit-btn.active:hover {
  background: #0056CC;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 表情选择器 */
.emoji-picker {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #FFFFFF;
  border: 1px solid #E5E5EA;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  margin-top: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
  gap: 4px;
  padding: 12px;
}

.emoji-item {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  font-size: 20px;
  transition: background-color 0.2s ease;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.emoji-item:hover {
  background: #F0F1F3;
}

/* 提及列表 */
.mention-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #FFFFFF;
  border: 1px solid #E5E5EA;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  margin-top: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.mention-empty {
  padding: 16px;
  text-align: center;
  color: #8991A0;
  font-size: 14px;
}

.mention-item {
  width: 100%;
  background: none;
  border: none;
  cursor: pointer;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: background-color 0.2s ease;
  text-align: left;
}

.mention-item:hover {
  background: #F0F1F3;
}

.mention-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.mention-name {
  font-size: 14px;
  color: #272727;
  font-weight: 500;
}

/* 错误信息 */
.error-message {
  margin-top: 8px;
  padding: 8px 12px;
  background: #FFEBEE;
  border: 1px solid #FFCDD2;
  border-radius: 6px;
  color: #C62828;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .comment-input {
    padding: 0 12px;
  }
  
  .input-container {
    padding: 12px;
    gap: 10px;
  }
  
  .user-avatar {
    width: 36px;
    height: 36px;
  }
  
  .comment-textarea {
    font-size: 16px; /* 防止iOS缩放 */
  }
  
  .toolbar-btn {
    min-width: 32px;
    min-height: 32px;
    padding: 6px;
  }
  
  .submit-btn {
    padding: 6px 12px;
    min-height: 32px;
    font-size: 13px;
  }
  
  .emoji-grid {
    grid-template-columns: repeat(auto-fill, minmax(36px, 1fr));
    padding: 8px;
  }
  
  .emoji-item {
    min-height: 36px;
    font-size: 18px;
  }
  
  .mention-item {
    padding: 10px 12px;
  }
  
  .mention-avatar {
    width: 28px;
    height: 28px;
  }
}

/* 触摸优化 */
.toolbar-btn,
.submit-btn,
.emoji-item,
.mention-item,
.cancel-reply-btn {
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

/* 无障碍支持 */
.comment-textarea:focus {
  outline: 2px solid #007AFF;
  outline-offset: 2px;
}

/* 键盘适配 */
@media screen and (max-height: 500px) {
  .emoji-picker,
  .mention-list {
    max-height: 120px;
  }
}

/* 性能优化 */
.input-container,
.emoji-picker,
.mention-list {
  contain: layout style;
}

/* 滚动优化 */
.emoji-picker,
.mention-list {
  -webkit-overflow-scrolling: touch;
}
</style>