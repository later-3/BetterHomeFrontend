<script setup lang="ts" name="login">
import { ref } from 'vue';
import { useUserStore } from '@/store/user';
import type { LoginCredentials } from '@/store/user'

// --- 登录与通用状态 ---
const credentials = ref<LoginCredentials>({
  email: 'bob@test.com',
  password: '123'
});


// 用户状态管理
const userStore = useUserStore();

async function login() {
  if (!credentials.value.email || !credentials.value.password) {
    uni.showToast({ title: '请输入邮箱和密码', icon: 'none' });
    return;
  }

  try {
    await userStore.login(credentials.value);
    uni.showToast({ title: '登录成功', icon: 'success' });
  } catch (error) {
    // handleDirectusError 已经显示了错误 toast
    // 这里可以添加额外的错误处理逻辑，或者留空
  }
}
</script>

<template>
  <view class="login-container">
    <!-- 登录区 -->
    <view class="section">
      <view class="form-title">🔐 登录认证</view>
      <view class="row">
        <text class="label">邮箱 *</text>
        <input v-model="credentials.email" class="input" type="email" placeholder="请输入邮箱" />
      </view>
      <view class="row">
        <text class="label">密码 *</text>
        <input v-model="credentials.password" class="input" type="password" placeholder="请输入密码" />
      </view>
      <view class="row gap">
        <u-button type="primary" :loading="userStore.loading" @click="login">登录</u-button>
        <text v-if="userStore.isLoggedIn" class="token">已登录</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.login-container {
  padding: 20px;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.section {
  margin-bottom: 20px;
  padding: 16px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.gap button {
  margin-right: 8px;
}

.label {
  width: 80px;
  font-size: 14px;
  color: #555;
}

.input {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid #e5e6eb;
  border-radius: 6px;
  height: 36px;
  background: #fafafa;
}

.token {
  margin-left: 8px;
  font-size: 12px;
  color: #07c160;
}

.form-title {
  margin-bottom: 12px;
  font-weight: bold;
  font-size: 16px;
  color: #333;
}
</style>
