<script setup lang="ts" name="login">
import { ref } from 'vue';
import { useUserStore } from '@/store/user';

// --- 登录与通用状态 ---
const apiBaseUrl = ref('/api');
const email = ref('bob@test.com');
const password = ref('123');
const token = ref<string | null>(null);
const loading = ref(false);

// 用户状态管理
const userStore = useUserStore();

async function login() {
  if (!email.value || !password.value) {
    uni.showToast({ title: '请输入邮箱和密码', icon: 'none' });
    return;
  }

  loading.value = true;
  try {
    const res: any = await uni.request({
      url: `${apiBaseUrl.value}/auth/login`,
      method: 'POST',
      data: {
        email: email.value,
        password: password.value
      },
      header: {
        'Content-Type': 'application/json'
      }
    });

    if (res.statusCode === 200 && res.data?.data?.access_token) {
      token.value = res.data.data.access_token;
      
      // 获取用户信息
      const userRes: any = await uni.request({
        url: `${apiBaseUrl.value}/users/me`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token.value}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (userRes.statusCode >= 200 && userRes.statusCode < 300) {
        const userData = userRes.data?.data || userRes.data;
        
        // 保存用户状态
        userStore.login({
          id: userData.id,
          first_name: userData.first_name || 'bob',
          last_name: userData.last_name || '',
          email: userData.email || email.value,
          community_id: userData.community_id || '',
          community_name: userData.community_name || ''
        });
      }
      
      uni.showToast({ title: '登录成功', icon: 'success' });
    } else {
      throw new Error(`登录失败: ${res.statusCode} - ${JSON.stringify(res.data)}`);
    }
  } catch (error: any) {
    uni.showToast({ title: '登录失败', icon: 'error' });
  } finally {
    loading.value = false;
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
        <input
          v-model="email"
          class="input"
          type="email"
          placeholder="请输入邮箱"
        />
      </view>
      <view class="row">
        <text class="label">密码 *</text>
        <input
          v-model="password"
          class="input"
          type="password"
          placeholder="请输入密码"
        />
      </view>
      <view class="row gap">
        <button type="primary" :disabled="loading" @tap="login">
          登录
        </button>
        <text v-if="token" class="token">已登录</text>
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
  color: #555;
  font-size: 14px;
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
  color: #07c160;
  font-size: 12px;
}

.form-title {
  margin-bottom: 12px;
  font-weight: bold;
  font-size: 16px;
  color: #333;
}
</style>