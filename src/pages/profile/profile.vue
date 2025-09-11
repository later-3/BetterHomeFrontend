<script setup lang="ts" name="profile">
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useUserStore } from '@/store/user';

// 第1步验证：访问基础状态结构
const userStore = useUserStore();
const { isLoggedIn, userInfo, loggedIn } = storeToRefs(userStore);
const showDebugInfo = ref(false);
const debugInfo = ref('');

// 跳转到注册页面
function goToRegister() {
  uni.navigateTo({
    url: '/pages/profile/register'
  });
}

// 跳转到登录页面
function goToLogin() {
  uni.navigateTo({
    url: '/pages/profile/login'
  });
}

// 第1步验证：显示当前状态结构
function showCurrentState() {
  try {
    const stateInfo = {
      step: "第1步验证 - 基础状态结构",
      storeExists: !!userStore,
      storeType: typeof userStore,
      timestamp: new Date().toISOString(),
      
      // 直接访问响应式状态（通过 storeToRefs 解构的）
      state: {
        isLoggedIn: {
          value: isLoggedIn.value,
          type: typeof isLoggedIn.value
        },
        userInfo: {
          value: userInfo.value,
          type: typeof userInfo.value,
          hasId: !!userInfo.value?.id
        }
      },
      
      // 访问 getter
      getters: {
        loggedIn: {
          value: loggedIn.value,
          type: typeof loggedIn.value
        }
      },
      
      // Store 实例信息
      storeInstance: {
        hasActions: typeof userStore === 'object' && userStore !== null,
        storeId: userStore.$id || 'unknown'
      }
    };
    
    debugInfo.value = JSON.stringify(stateInfo, null, 2);
    showDebugInfo.value = true;
    
  } catch (error) {
    const errorInfo = {
      step: "第1步验证失败",
      error: error.message,
      storeExists: !!userStore,
      timestamp: new Date().toISOString()
    };
    
    debugInfo.value = JSON.stringify(errorInfo, null, 2);
    showDebugInfo.value = true;
    
    console.error('❌ 第1步验证失败:', error);
  }
}

// 复制调试信息
function copyDebugInfo() {
  uni.setClipboardData({
    data: debugInfo.value,
    success: () => {
      uni.showToast({ title: '已复制到剪贴板', icon: 'success' });
    },
    fail: () => {
      uni.showToast({ title: '复制失败', icon: 'error' });
    }
  });
}

// 第2步验证：测试 login action
function testLogin() {
  const testUserInfo = {
    id: 'test_user_123',
    first_name: 'Test',
    last_name: 'User',
    email: 'test@example.com',
    community_id: 'community_456',
    community_name: 'Test Community'
  };
  
  userStore.login(testUserInfo);
  
  const actionResult = {
    step: "第2步验证 - Login Action",
    action: 'login',
    timestamp: new Date().toISOString(),
    input: testUserInfo,
    newState: {
      isLoggedIn: isLoggedIn.value,
      userInfo: userInfo.value,
      loggedIn: loggedIn.value
    }
  };
  
  debugInfo.value = JSON.stringify(actionResult, null, 2);
  showDebugInfo.value = true;
  
  uni.showToast({ 
    title: '已调用 login action', 
    icon: 'success' 
  });
}

// 第2步验证：测试 logout action
function testLogout() {
  userStore.logout();
  
  const actionResult = {
    step: "第2步验证 - Logout Action",
    action: 'logout',
    timestamp: new Date().toISOString(),
    newState: {
      isLoggedIn: isLoggedIn.value,
      userInfo: userInfo.value,
      loggedIn: loggedIn.value
    }
  };
  
  debugInfo.value = JSON.stringify(actionResult, null, 2);
  showDebugInfo.value = true;
  
  uni.showToast({ 
    title: '已调用 logout action', 
    icon: 'success' 
  });
}

// 第4步验证：测试持久化配置 - 增强调试版本
function testPersistence() {
  try {
    const debugResults = {
      step: "第4步验证 - 持久化配置调试",
      timestamp: new Date().toISOString(),
      
      // 1. 插件基础验证
      pluginCheck: (() => {
        try {
          const piniaInstance = userStore.$pinia;
          const plugins = piniaInstance._p || [];
          return {
            piniaExists: !!piniaInstance,
            pluginCount: plugins.length,
            hasPeristPlugin: plugins.some(p => p.toString().includes('persist') || p.name?.includes('persist')),
            storeHasPersist: !!userStore.$persist,
            storePersistMethods: Object.keys(userStore).filter(key => key.includes('persist'))
          };
        } catch (e) {
          return { error: e.message };
        }
      })(),
      
      // 2. 存储API验证
      storageApiCheck: (() => {
        const results = {};
        
        // 测试uni存储API
        try {
          uni.setStorageSync('debug-test-uni', 'test-value');
          const retrieved = uni.getStorageSync('debug-test-uni');
          uni.removeStorageSync('debug-test-uni');
          results.uniStorage = { 
            available: true, 
            testPassed: retrieved === 'test-value' 
          };
        } catch (e) {
          results.uniStorage = { 
            available: false, 
            error: e.message 
          };
        }
        
        // 测试localStorage
        try {
          localStorage.setItem('debug-test-local', 'test-value');
          const retrieved = localStorage.getItem('debug-test-local');
          localStorage.removeItem('debug-test-local');
          results.localStorage = { 
            available: true, 
            testPassed: retrieved === 'test-value' 
          };
        } catch (e) {
          results.localStorage = { 
            available: false, 
            error: e.message 
          };
        }
        
        return results;
      })(),
      
      // 3. 当前存储状态检查
      storageStateCheck: (() => {
        const results = {
          localStorage: {},
          uniStorage: {}
        };
        
        // 检查localStorage
        try {
          const allLocalKeys = [];
          for (let i = 0; i < localStorage.length; i++) {
            allLocalKeys.push(localStorage.key(i));
          }
          results.localStorage = {
            allKeys: allLocalKeys,
            userRelatedKeys: allLocalKeys.filter(key => 
              key.includes('user') || key.includes('pinia') || key.includes('store')
            )
          };
        } catch (e) {
          results.localStorage.error = e.message;
        }
        
        // 检查uni存储
        try {
          const uniKeys = uni.getStorageInfoSync();
          results.uniStorage = {
            info: uniKeys,
            userRelatedKeys: uniKeys.keys?.filter(key => 
              key.includes('user') || key.includes('pinia') || key.includes('store')
            ) || []
          };
        } catch (e) {
          results.uniStorage.error = e.message;
        }
        
        return results;
      })(),
      
      // 4. Store配置检查 - 修复版本
      storeConfigCheck: (() => {
        const storeInfo = {
          storeId: userStore.$id,
          storeState: {
            isLoggedIn: isLoggedIn.value,
            userInfo: userInfo.value,
            loggedIn: loggedIn.value
          }
        };
        
        // 尝试多种方式访问持久化配置
        const persistInfo = {};
        
        // 方法1: 检查 $options
        if (userStore.$options) {
          persistInfo.optionsExist = true;
          persistInfo.optionsPersist = userStore.$options.persist || null;
        } else {
          persistInfo.optionsExist = false;
        }
        
        // 方法2: 检查 $persist 相关属性
        persistInfo.persistMethods = Object.keys(userStore).filter(key => 
          key.includes('persist') || key.includes('Persist')
        );
        
        // 方法3: 检查 Pinia 实例上的插件信息
        try {
          const pinia = userStore.$pinia;
          if (pinia && pinia._s) {
            const storeInstance = pinia._s.get('user');
            if (storeInstance) {
              persistInfo.storeInstanceKeys = Object.keys(storeInstance).filter(key => 
                key.includes('persist') || key.includes('Persist')
              );
            }
          }
        } catch (e) {
          persistInfo.piniaAccessError = e.message;
        }
        
        // 方法4: 检查实际存储中是否有数据
        try {
          const storedUser = uni.getStorageSync('user');
          persistInfo.actualStoredData = storedUser ? {
            exists: true,
            data: storedUser
          } : {
            exists: false
          };
        } catch (e) {
          persistInfo.storageAccessError = e.message;
        }
        
        return {
          ...storeInfo,
          persistenceInfo: persistInfo
        };
      })(),
      
      // 5. 手动存储测试
      manualStorageTest: (() => {
        try {
          const testData = { test: true, timestamp: Date.now() };
          
          // 测试手动uni存储
          uni.setStorageSync('manual-test-user', testData);
          const retrieved = uni.getStorageSync('manual-test-user');
          
          return {
            success: true,
            stored: testData,
            retrieved: retrieved,
            matches: JSON.stringify(testData) === JSON.stringify(retrieved)
          };
        } catch (e) {
          return {
            success: false,
            error: e.message
          };
        }
      })(),
      
      nextSteps: [
        "1. 检查插件是否正确加载",
        "2. 确认存储API可用性",
        "3. 验证Store配置正确性",
        "4. 测试手动存储操作",
        "5. 根据结果调整配置"
      ]
    };
    
    debugInfo.value = JSON.stringify(debugResults, null, 2);
    showDebugInfo.value = true;
    
    uni.showToast({ 
      title: '调试信息已生成', 
      icon: 'success' 
    });
    
  } catch (error) {
    const errorInfo = {
      step: "第4步调试失败",
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    };
    
    debugInfo.value = JSON.stringify(errorInfo, null, 2);
    showDebugInfo.value = true;
  }
}
</script>

<template>
  <view class="profile-container">
    
    <!-- 第3步：已登录状态UI -->
    <view v-if="loggedIn" class="logged-in-view">
      <view class="user-info-section">
        <view class="avatar-display">
          <image class="avatar-img" src="/static/logo.png" />
        </view>
        
        <view class="user-details">
          <view class="detail-item">
            <text class="detail-label">姓名</text>
            <text class="detail-value">{{ userInfo.first_name }} {{ userInfo.last_name }}</text>
          </view>
          <view class="detail-item">
            <text class="detail-label">邮箱</text>
            <text class="detail-value">{{ userInfo.email }}</text>
          </view>
          <view class="detail-item">
            <text class="detail-label">小区</text>
            <text class="detail-value">{{ userInfo.community_name || '未设置' }}</text>
          </view>
        </view>
      </view>

      <!-- 第2步验证：Action 测试按钮 -->
      <view class="debug-section">
        <button class="action-test-btn logout-test" @click="testLogout">🔧 第2步验证：测试 Logout Action</button>
      </view>

      <!-- 第4步验证：持久化测试按钮 -->
      <view class="debug-section">
        <button class="persistence-test-btn" @click="testPersistence">💾 第4步验证：测试持久化配置</button>
      </view>

      <!-- 第1步验证：状态调试按钮 -->
      <view class="debug-section">
        <button class="debug-btn" @click="showCurrentState">🔍 第1步验证：查看状态结构</button>
      </view>
    </view>

    <!-- 第3步：未登录状态UI -->
    <view v-else class="not-logged-in-view">
      <view class="welcome-section">
        <image class="welcome-avatar" src="/static/logo.png" />
        <text class="welcome-title">欢迎使用BetterHome</text>
        <text class="welcome-subtitle">请选择登录或注册</text>
      </view>

      <!-- 登录注册按钮 -->
      <view class="action-section">
        <button class="login-btn" @click="goToLogin">登录</button>
        <button class="register-btn" @click="goToRegister">注册</button>
      </view>

      <!-- 第2步验证：Action 测试按钮 -->
      <view class="debug-section">
        <button class="action-test-btn login-test" @click="testLogin">🔧 第2步验证：测试 Login Action</button>
      </view>

      <!-- 第4步验证：持久化测试按钮 -->
      <view class="debug-section">
        <button class="persistence-test-btn" @click="testPersistence">💾 第4步验证：测试持久化配置</button>
      </view>

      <!-- 第1步验证：状态调试按钮 -->
      <view class="debug-section">
        <button class="debug-btn" @click="showCurrentState">🔍 第1步验证：查看状态结构</button>
      </view>
    </view>

    <!-- 调试信息显示 -->
    <view v-if="showDebugInfo" class="debug-display">
      <textarea :value="debugInfo" readonly style="width: 100%; height: 300px; font-family: monospace; border: 1px solid #ccc; padding: 10px;"></textarea>
      <button @click="copyDebugInfo" style="margin-top: 10px;">📋 复制调试信息</button>
    </view>

  </view>
</template>

<style lang="scss" scoped>
.profile-container {
  padding: 30rpx;
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 120rpx; // 为底部导航留出空间
}

// 已登录状态样式
.logged-in-view {
  .user-info-section {
    margin-bottom: 40rpx;
    padding: 40rpx;
    background: #fff;
    border-radius: 16rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);

    .avatar-display {
      display: flex;
      justify-content: center;
      margin-bottom: 30rpx;

      .avatar-img {
        width: 120rpx;
        height: 120rpx;
        border-radius: 60rpx;
        border: 4rpx solid #e8f5e8;
      }
    }

    .user-details {
      .detail-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20rpx 0;
        border-bottom: 1rpx solid #f0f0f0;

        &:last-child {
          border-bottom: none;
        }

        .detail-label {
          font-size: 28rpx;
          color: #666;
          font-weight: 500;
        }

        .detail-value {
          font-size: 28rpx;
          color: #1aa86c;
          font-weight: 600;
        }
      }
    }
  }
}

// 未登录状态样式
.not-logged-in-view {
  .welcome-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 60rpx;
    padding: 60rpx 40rpx;
    background: #fff;
    border-radius: 16rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);

    .welcome-avatar {
      width: 160rpx;
      height: 160rpx;
      border-radius: 80rpx;
      margin-bottom: 30rpx;
      border: 4rpx solid #f0f0f0;
    }

    .welcome-title {
      font-size: 36rpx;
      font-weight: 600;
      color: #333;
      margin-bottom: 10rpx;
    }

    .welcome-subtitle {
      font-size: 26rpx;
      color: #999;
    }
  }
}

// 操作按钮区域
.action-section {
  display: flex;
  gap: 20rpx;
  padding: 0 20rpx;
  margin-bottom: 20rpx;

  button {
    flex: 1;
    height: 88rpx;
    border: none;
    border-radius: 12rpx;
    font-weight: 500;
    font-size: 28rpx;
    transition: all 0.3s ease;

    &:active {
      transform: scale(0.98);
    }
  }

  .login-btn {
    background: #007aff;
    color: #fff;

    &:active {
      background: #0056d1;
    }
  }

  .register-btn {
    background: #ff6b35;
    color: #fff;

    &:active {
      background: #e55a2b;
    }
  }

  .logout-btn {
    background: #ff4757;
    color: #fff;

    &:active {
      background: #ff3742;
    }
  }
}

// 调试按钮区域
.debug-section {
  padding: 0 20rpx;
  margin-bottom: 20rpx;

  .debug-btn {
    width: 100%;
    height: 60rpx;
    border: 2rpx solid #007aff;
    border-radius: 8rpx;
    background: transparent;
    font-size: 24rpx;
    color: #007aff;

    &:active {
      background: #f0f8ff;
    }
  }

  .action-test-btn {
    width: 100%;
    height: 60rpx;
    border-radius: 8rpx;
    font-size: 24rpx;
    margin-bottom: 10rpx;

    &:active {
      transform: scale(0.98);
    }

    &.login-test {
      border: 2rpx solid #52c41a;
      background: transparent;
      color: #52c41a;

      &:active {
        background: #f6ffed;
      }
    }

    &.logout-test {
      border: 2rpx solid #ff4d4f;
      background: transparent;
      color: #ff4d4f;

      &:active {
        background: #fff2f0;
      }
    }
  }

  .persistence-test-btn {
    width: 100%;
    height: 60rpx;
    border: 2rpx solid #722ed1;
    border-radius: 8rpx;
    background: transparent;
    font-size: 24rpx;
    color: #722ed1;
    margin-bottom: 10rpx;

    &:active {
      background: #f9f0ff;
      transform: scale(0.98);
    }
  }
}

// 调试信息显示区域
.debug-display {
  margin-top: 20rpx;
  padding: 20rpx;
}

</style>
