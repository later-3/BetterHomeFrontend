<template>
  <div v-if="visible" class="reply-input">
    <!-- 回复提示条 -->
    <div class="reply-indicator">
      <div class="reply-info">
        <span
          v-if="replyTo"
          class="reply-text"
        >回复 @{{ replyTo.name }}</span>
        <button class="cancel-btn" @click="handleCancel" aria-label="取消回复">
          <span class="cancel-icon">×</span>
        </button>
      </div>
    </div>
    
    <!-- 输入区域 -->
    <div class="input-container">
      <!-- 用户头像 -->
      <div class="user-avatar">
        <img 
          v-if="currentUser?.avatar" 
          :src="resolveAssetUrl(currentUser.avatar)" 
          :alt="currentUser.name"
          class="avatar-img"
          @error="handleAvatarError"
        />
        <div v-else class="avatar-placeholder">👤</div>
      </div>
      
      <!-- 输入区 -->
      <div class="input-wrapper">
        <!-- 文本框 -->
        <div class="textarea-container">
          <textarea
            ref="textareaRef"
            v-model="inputText"
            :placeholder="placeholder"
            :maxlength="maxLength"
            :disabled="isSubmitting"
            :focus="visible"
            auto-height
            class="reply-textarea"
            @input="handleInput"
            @focus="handleFocus"
            @blur="handleBlur"
          ></textarea>
          
          <!-- 字数统计 -->
          <div class="char-count" :class="{ 'over-limit': isOverLimit }">
            {{ inputText.length }}/{{ maxLength }}
          </div>
        </div>
        
        <!-- 工具栏 -->
        <div class="toolbar">
          <div class="toolbar-left">
            <!-- 预留表情按钮位置 -->
          </div>
          <button 
            class="submit-btn"
            :class="{ 'active': canSubmit, 'loading': isSubmitting }"
            :disabled="!canSubmit || isSubmitting"
            @click="handleSubmit"
          >
            <span v-if="isSubmitting" class="loading-spinner"></span>
            <span v-else>回复</span>
          </button>
        </div>
      </div>
    </div>
    
    <!-- 错误提示 -->
    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'

interface User {
  id: string
  name: string
  avatar?: string
}

interface ReplyTo {
  id: string
  name: string
}

const props = defineProps<{
  visible: boolean
  currentUser: User | null
  replyTo: ReplyTo | null
  resolveAssetUrl: (fileId: string) => string
  placeholder?: string
  maxLength?: number
}>()

const emit = defineEmits<{
  submit: [data: { text: string; replyTo: ReplyTo }]
  cancel: []
}>()

// 响应式数据
const inputText = ref('')
const isSubmitting = ref(false)
const errorMessage = ref('')
const textareaRef = ref<HTMLTextAreaElement>()

// 计算属性
const canSubmit = computed(() => {
  return inputText.value.trim().length > 0 && 
         inputText.value.length <= (props.maxLength || 500) &&
         !isSubmitting.value
})

const isOverLimit = computed(() => {
  return inputText.value.length > (props.maxLength || 500)
})

const placeholder = computed(() => {
  return props.placeholder || `回复 @${props.replyTo?.name || ''}...`
})

// 监听visible变化，处理显示隐藏
watch(() => props.visible, (newVisible) => {
  if (!newVisible) {
    // 隐藏时清空内容和错误
    inputText.value = ''
    errorMessage.value = ''
  }
})

// 事件处理
function handleInput() {
  adjustTextareaHeight()
  if (errorMessage.value) {
    errorMessage.value = ''
  }
}

function handleFocus() {
  // 聚焦时的处理
}

function handleBlur() {
  // 失焦时的处理
}

function adjustTextareaHeight() {
  // uni-app环境下使用auto-height属性自动调整高度
  // 不需要手动操作DOM
}

async function handleSubmit() {
  if (!canSubmit.value || !props.replyTo) return
  
  const text = inputText.value.trim()
  if (!text) return
  
  isSubmitting.value = true
  errorMessage.value = ''
  
  try {
    await emit('submit', {
      text,
      replyTo: props.replyTo
    })
    
    // 提交成功后清空输入
    inputText.value = ''
    
  } catch (error: any) {
    errorMessage.value = error.message || '回复失败，请重试'
  } finally {
    isSubmitting.value = false
  }
}

function handleCancel() {
  emit('cancel')
}

function handleAvatarError(event: Event) {
  const target = event.target as HTMLImageElement
  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNGMEYwRjAiLz4KPGNpcmNsZSBjeD0iMjAiIGN5PSIxNiIgcj0iNiIgZmlsbD0iI0NDQ0NDQyIvPgo8cGF0aCBkPSJNMTAgMzJDMTAgMjYuNDc3MSAxNC40NzcxIDIyIDE5IDIySDIxQzI1LjUyMjkgMjIgMzAgMjYuNDc3MSAzMCAzMlYzNEgxMFYzMloiIGZpbGw9IiNDQ0NDQ0MiLz4KPC9zdmc+'
}

// 暴露方法给父组件
defineExpose({
  clear: () => {
    inputText.value = ''
  }
})
</script>

<style scoped>
.reply-input {
  width: 100%;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-top: 16px;
}

/* 回复提示条 */
.reply-indicator {
  background: #f0f1f3;
  padding: 12px 16px;
  border-left: 3px solid #007aff;
}

.reply-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.reply-text {
  font-size: 14px;
  color: #007aff;
  font-weight: 500;
}

.cancel-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  color: #8991a0;
  transition: all 0.2s ease;
  min-width: 24px;
  min-height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cancel-btn:hover {
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
  padding: 16px;
}

/* 用户头像 */
.user-avatar {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: white;
  border-radius: 50%;
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

.reply-textarea {
  width: 100%;
  border: none;
  outline: none;
  resize: none;
  font-family: inherit;
  font-size: 16px;
  line-height: 20px;
  color: #272727;
  background: transparent;
  min-height: 20px;
  max-height: 80px;
  overflow-y: auto;
}

.reply-textarea::placeholder {
  color: #8991a0;
}

.reply-textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 字数统计 */
.char-count {
  position: absolute;
  bottom: -20px;
  right: 0;
  font-size: 12px;
  color: #8991a0;
}

.char-count.over-limit {
  color: #ff3b30;
}

/* 工具栏 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.toolbar-left {
  display: flex;
  gap: 8px;
}

/* 提交按钮 */
.submit-btn {
  background: #e5e5ea;
  border: none;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  color: #8991a0;
  transition: all 0.2s ease;
  min-height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.submit-btn.active {
  background: #007aff;
  color: #ffffff;
}

.submit-btn.active:hover {
  background: #0056cc;
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

/* 错误信息 */
.error-message {
  margin: 0 16px 16px;
  padding: 8px 12px;
  background: #ffebee;
  border: 1px solid #ffcdd2;
  border-radius: 6px;
  color: #c62828;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .input-container {
    padding: 12px;
    gap: 10px;
  }
  
  .user-avatar {
    width: 36px;
    height: 36px;
  }
  
  .reply-textarea {
    font-size: 16px; /* 防止iOS缩放 */
  }
  
  .submit-btn {
    padding: 6px 12px;
    min-height: 32px;
    font-size: 13px;
  }
}

/* 触摸优化 */
.cancel-btn,
.submit-btn {
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

/* 无障碍支持 */
.reply-textarea:focus {
  outline: 2px solid #007aff;
  outline-offset: 2px;
}
</style>
