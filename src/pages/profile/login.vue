<script setup lang="ts" name="login">
import { ref, onMounted } from 'vue';
import { useUserStore } from '@/store/user';

// 表单数据
const username = ref('bob'); // 默认用户名
const password = ref('123'); // 默认密码
const loading = ref(false);
const errorInfo = ref('');
const testInput = ref(''); // 测试输入框

// 用户状态管理
const userStore = useUserStore();

// 确保默认值正确设置
onMounted(() => {
  // 强制设置默认值
  username.value = 'bob';
  password.value = '123';
});

// 输入事件处理
function handleUsernameInput(e: any) {
  username.value = e.target.value || e.detail.value;
}

function handlePasswordInput(e: any) {
  password.value = e.target.value || e.detail.value;
}

// 登录功能
async function handleLogin() {
  if (!username.value.trim()) {
    uni.showToast({ title: '请输入用户名', icon: 'none' });
    return;
  }
  
  if (!password.value.trim()) {
    uni.showToast({ title: '请输入密码', icon: 'none' });
    return;
  }
  
  loading.value = true;
  errorInfo.value = '';
  
  try {
    // 构造邮箱（用户名 + @test.com）
    const email = `${username.value.trim()}@test.com`;
    
    // 发送登录请求到Directus
    const res: any = await uni.request({
      url: '/api/auth/login',
      method: 'POST',
      data: {
        email: email,
        password: password.value
      },
      header: {
        'Content-Type': 'application/json'
      }
    });
    
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const data = res.data;
      const token = data?.data?.access_token || data?.access_token;
      
      if (token) {
        // 获取用户信息
        const userRes: any = await uni.request({
          url: '/api/users/me',
          method: 'GET',
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (userRes.statusCode >= 200 && userRes.statusCode < 300) {
          const userData = userRes.data?.data || userRes.data;
          
          // 保存用户状态
          userStore.login({
            id: userData.id,
            first_name: userData.first_name || username.value,
            last_name: userData.last_name || '',
            email: userData.email || email,
            community_id: userData.community_id || '',
            community_name: userData.community_name || ''
          });
          
          uni.showToast({ 
            title: '登录成功！', 
            icon: 'success',
            duration: 2000
          });
        } else {
          throw new Error('获取用户信息失败');
        }
      } else {
        throw new Error('未获取到有效的访问令牌');
      }
    } else {
      throw new Error(`登录失败: ${res.statusCode} - ${JSON.stringify(res.data)}`);
    }
  } catch (e: any) {
    errorInfo.value = `登录失败: ${e?.message || String(e)}`;
    uni.showToast({ title: '登录失败', icon: 'error' });
  } finally {
    loading.value = false;
  }
}

// 复制错误信息
function copyError() {
  if (!errorInfo.value) {
    uni.showToast({ title: '没有错误信息可复制', icon: 'none' });
    return;
  }
  
  try {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(errorInfo.value)
        .then(() => {
          uni.showToast({ title: '错误信息已复制', icon: 'success' });
        })
        .catch(() => {
          fallbackCopyTextToClipboard(errorInfo.value);
        });
    } else {
      fallbackCopyTextToClipboard(errorInfo.value);
    }
  } catch {
    uni.showToast({ title: '复制失败', icon: 'error' });
  }
}

// 降级复制方法
function fallbackCopyTextToClipboard(text: string) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  try {
    document.execCommand('copy');
    uni.showToast({ title: '复制成功', icon: 'success' });
  } catch {
    uni.showToast({ title: '复制失败，请手动选择复制', icon: 'error' });
  }
  
  document.body.removeChild(textArea);
}
</script>

<template>
  <view class="login-container">
    <!-- 页面标题 -->
    <view class="header">
      <text class="title">用户登录</text>
      <text class="subtitle">请输入您的登录信息</text>
    </view>

    <!-- 登录表单 -->
    <view class="form-section">
      <!-- 用户名输入框 -->
      <view class="input-group">
        <text class="input-label">用户名</text>
        <input 
          :value="username"
          @input="handleUsernameInput"
          class="input-field"
          type="text"
          placeholder="请输入用户名"
          maxlength="50"
        />
      </view>

      <!-- 密码输入框 -->
      <view class="input-group">
        <text class="input-label">密码</text>
        <input 
          :value="password"
          @input="handlePasswordInput"
          class="input-field"
          type="password"
          placeholder="请输入密码"
          maxlength="50"
        />
      </view>

      <!-- 登录按钮 -->
      <view class="button-section">
        <button 
          class="login-button" 
          :loading="loading"
          :disabled="loading"
          @click="handleLogin"
        >
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </view>

      <!-- 测试输入框 -->
      <view class="test-input-section">
        <text class="test-label">测试输入框：</text>
        <input 
          v-model="testInput"
          class="test-input"
          type="text"
          placeholder="请输入测试内容"
        />
        <text class="test-display">输入内容：{{ testInput }}</text>
      </view>
    </view>

    <!-- 错误信息显示 -->
    <view v-if="errorInfo" class="error-section">
      <view class="error-header">
        <text class="error-title">❌ 登录失败</text>
        <button size="mini" class="copy-btn" @click="copyError">复制错误</button>
      </view>
      <view class="error-content">
        <text class="error-text" selectable>{{ errorInfo }}</text>
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

/* 页面标题 */
.header {
  margin-bottom: 40px;
  text-align: center;
  padding-top: 60px;
}

.title {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  font-size: 28px;
  color: #333;
}

.subtitle {
  display: block;
  font-size: 16px;
  color: #666;
}

/* 表单区域 */
.form-section {
  margin-bottom: 30px;
  padding: 24px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

/* 输入组 */
.input-group {
  margin-bottom: 20px;
}

.input-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  font-size: 16px;
  color: #333;
}

.input-field {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e5e5e5;
  border-radius: 8px;
  font-size: 16px;
  color: #333;
  background: #fff;
  box-sizing: border-box;
}

.input-field:focus {
  border-color: #007aff;
  outline: none;
}

/* 按钮区域 */
.button-section {
  margin-top: 30px;
}

.login-button {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 8px;
  background-color: #007aff;
  font-size: 18px;
  font-weight: 500;
  color: white;
  cursor: pointer;
}

.login-button:active {
  background-color: #0056cc;
}

.login-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

/* 错误信息显示 */
.error-section {
  margin-top: 20px;
  padding: 16px;
  border-radius: 8px;
  background: #fff;
  border-left: 4px solid #dc3545;
  box-shadow: 0 2px 8px rgba(220, 53, 69, 0.1);
}

.error-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.error-title {
  font-weight: 600;
  font-size: 16px;
  color: #dc3545;
}

.copy-btn {
  padding: 4px 12px;
  border: none;
  border-radius: 4px;
  background-color: #dc3545;
  font-size: 12px;
  color: white;
  cursor: pointer;
}

.copy-btn:active {
  background-color: #c82333;
}

.error-content {
  padding: 12px;
  border-radius: 6px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
}

.error-text {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  line-height: 1.4;
  color: #dc3545;
  word-break: break-all;
}

/* 测试输入框样式 */
.test-input-section {
  margin-top: 20px;
  padding: 16px;
  border-radius: 8px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
}

.test-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #666;
}

.test-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  margin-bottom: 8px;
  box-sizing: border-box;
}

.test-display {
  display: block;
  font-size: 12px;
  color: #999;
}
</style>