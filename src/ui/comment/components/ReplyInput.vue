<template>
  <view v-if="visible" class="reply-input-overlay" @click="handleCancel">
    <view class="reply-input-container" @click.stop>
      <view class="reply-header">
        <text class="reply-title">回复 {{ replyTo?.name }}</text>
        <view class="close-btn" @click="handleCancel">✕</view>
      </view>

      <view class="reply-body">
        <view class="user-info">
          <image
            v-if="currentUser?.avatar"
            :src="resolveAssetUrl(currentUser.avatar)"
            class="user-avatar"
          />
          <view v-else class="user-avatar-placeholder">👤</view>
        </view>

        <view class="input-area">
          <textarea
            v-model="replyText"
            class="reply-textarea"
            placeholder="说点什么..."
            :maxlength="500"
            :auto-height="true"
            @input="handleInput"
          />
          <view class="input-footer">
            <text class="char-count">{{ replyText.length }}/500</text>
          </view>
        </view>
      </view>

      <view class="reply-actions">
        <button class="cancel-btn" @click="handleCancel">取消</button>
        <button
          class="submit-btn"
          :disabled="!canSubmit || submitting"
          @click="handleSubmit"
        >
          {{ submitting ? '发送中...' : '发送' }}
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface Props {
  visible: boolean;
  currentUser: {
    id: string;
    name: string;
    avatar?: string;
  } | null;
  replyTo: {
    id: string;
    name: string;
  } | null;
  resolveAssetUrl: (fileId: string) => string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  submit: [data: { text: string; replyTo: { id: string; name: string } }];
  cancel: [];
}>();

const replyText = ref('');
const submitting = ref(false);

const canSubmit = computed(() => {
  return replyText.value.trim().length > 0 && props.replyTo !== null;
});

function handleInput(e: any) {
  replyText.value = e.detail.value;
}

async function handleSubmit() {
  if (!canSubmit.value || submitting.value || !props.replyTo) {
    return;
  }

  submitting.value = true;

  try {
    await emit('submit', {
      text: replyText.value.trim(),
      replyTo: props.replyTo,
    });

    // 成功后重置输入框
    replyText.value = '';
  } catch (error) {
    console.error('Reply submission failed:', error);
  } finally {
    submitting.value = false;
  }
}

function handleCancel() {
  replyText.value = '';
  submitting.value = false;
  emit('cancel');
}
</script>

<style scoped>
.reply-input-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.reply-input-container {
  width: 100%;
  max-height: 60vh;
  background: #fff;
  border-radius: 16px 16px 0 0;
  padding: 20px;
  animation: slide-up 0.3s ease;
}

@keyframes slide-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.reply-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.reply-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #f5f5f5;
  font-size: 18px;
  color: #666;
  cursor: pointer;
}

.reply-body {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.user-info {
  flex-shrink: 0;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.user-avatar-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f0f0f0;
  font-size: 20px;
}

.input-area {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.reply-textarea {
  width: 100%;
  min-height: 80px;
  max-height: 200px;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
}

.input-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.char-count {
  font-size: 12px;
  color: #999;
}

.reply-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.cancel-btn,
.submit-btn {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
}

.submit-btn {
  background: #1aa86c;
  color: #fff;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
