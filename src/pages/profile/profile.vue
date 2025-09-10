<script setup lang="ts" name="profile">
import { ref } from 'vue';

// 昵称
const nickname = ref('');

// 头像
const avatarPath = ref('/static/logo.png');

// 小区信息
const communities = ref<any[]>([]);
const loading = ref(false);

// 注册相关
const registerLoading = ref(false);
const registerError = ref('');
const uploadedAvatarId = ref('');

// 选择头像
async function chooseAvatar() {
  try {
    const res: any = await uni.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera']
    });

    if (res.tempFilePaths && res.tempFilePaths[0]) {
      avatarPath.value = res.tempFilePaths[0];
      uni.showToast({ title: '头像选择成功', icon: 'success' });
    }
  } catch (error: any) {
    uni.showToast({ title: '头像选择失败', icon: 'error' });
  }
}

// 获取小区信息
async function getCommunityInfo() {
  loading.value = true;
  try {
    const res: any = await uni.request({
      url: '/api/items/communities',
      method: 'GET',
      header: {
        'Content-Type': 'application/json'
      }
    });

    if (res.statusCode === 200 && res.data?.data) {
      // 确保数据是数组格式
      communities.value = Array.isArray(res.data.data) ? res.data.data : [res.data.data];
      uni.showToast({ title: `获取成功，共${communities.value.length}个小区`, icon: 'success' });
    } else {
      throw new Error(`获取失败: ${res.statusCode}`);
    }
  } catch (error: any) {
    uni.showToast({ title: '获取小区信息失败', icon: 'error' });
    console.error('获取小区信息失败:', error);
  } finally {
    loading.value = false;
  }
}

// 复制错误信息
function copyError() {
  if (registerError.value) {
    uni.setClipboardData({
      data: registerError.value,
      success: () => {
        uni.showToast({ title: '已复制到剪贴板', icon: 'success' });
      }
    });
  }
}

// 注册功能 - 使用确认可用的方案
async function handleRegister() {
  if (!nickname.value.trim()) {
    uni.showToast({ title: '请输入昵称', icon: 'none' });
    return;
  }

  registerLoading.value = true;
  registerError.value = '';

  let residentRoleId = null;
  let userData: any = {};

  try {
    // 第一步：获取resident角色ID
    
    try {
      const rolesRes: any = await uni.request({
        url: '/api/roles',
        method: 'GET',
        header: {
          'Content-Type': 'application/json'
        }
      });
      
      if (rolesRes.statusCode === 200 && rolesRes.data?.data) {
        const roles = rolesRes.data.data;
        const residentRole = roles.find((role: any) => 
          role.name === 'resident' || role.name === 'Resident'
        );
        
        if (residentRole) {
          residentRoleId = residentRole.id;
          console.log('找到resident角色ID:', residentRoleId);
        } else {
          console.log('未找到resident角色，可用角色:', roles.map((r: any) => ({ name: r.name, id: r.id })));
        }
      }
    } catch (error) {
      console.log('获取角色失败:', error);
    }

    // 使用正确的Directus字段
    userData = {
      first_name: nickname.value.trim(),
      last_name: '用户', // 默认姓氏
      email: `${nickname.value.trim().toLowerCase()}@test.com`, // 生成测试邮箱
      password: '123456' // 默认密码
    };

    // 如果找到了resident角色，添加到用户数据中
    if (residentRoleId) {
      userData.role = residentRoleId;
    }

    console.log('用户注册数据:', userData);

    // 尝试不同的注册方式
    let success = false;
    let userId = null;
    let response = null;

    // 方式1: 尝试直接创建用户
    try {
      response = await uni.request({
        url: '/api/users',
        method: 'POST',
        data: userData,
        header: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.statusCode >= 200 && response.statusCode < 300) {
        success = true;
        userId = response.data?.data?.id;
        console.log('方式1成功，用户ID:', userId);
      }
    } catch (error) {
      console.log('方式1失败:', error);
    }

    // 方式2: 如果方式1失败，尝试注册端点（如果存在）
    if (!success) {
      try {
        response = await uni.request({
          url: '/api/auth/register',
          method: 'POST', 
          data: userData,
          header: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.statusCode >= 200 && response.statusCode < 300) {
          success = true;
          userId = response.data?.data?.id || response.data?.id;
          console.log('方式2成功，用户ID:', userId);
        }
      } catch (error) {
        console.log('方式2失败:', error);
      }
    }

    // 方式3: 尝试系统用户表
    if (!success) {
      try {
        response = await uni.request({
          url: '/api/items/directus_users',
          method: 'POST',
          data: userData,
          header: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.statusCode >= 200 && response.statusCode < 300) {
          success = true;
          userId = response.data?.data?.id;
          console.log('方式3成功，用户ID:', userId);
        }
      } catch (error) {
        console.log('方式3失败:', error);
      }
    }

    const res = response;

    console.log('最终注册响应:', res);

    if (success && userId) {
      // 第二步：如果基本注册成功，尝试添加小区信息
      if (communities.value.length >= 2) {
        try {
          const communityId = communities.value[1].id;
          
          const updateRes: any = await uni.request({
            url: `/api/users/${userId}`,
            method: 'PATCH',
            data: {
              community_id: communityId
            },
            header: {
              'Content-Type': 'application/json'
            }
          });

          console.log('更新小区信息响应:', updateRes);
          
          if (updateRes.statusCode >= 200 && updateRes.statusCode < 300) {
            uni.showToast({ title: '注册成功并关联小区!', icon: 'success' });
          } else {
            uni.showToast({ title: '注册成功，但小区关联失败', icon: 'none' });
          }
        } catch (updateError) {
          console.log('更新小区信息失败:', updateError);
          uni.showToast({ title: '注册成功，但小区关联失败', icon: 'none' });
        }
      } else {
        uni.showToast({ title: '注册成功!', icon: 'success' });
      }
      
      registerError.value = '';
      
      // 清空表单
      nickname.value = '';
      avatarPath.value = '/static/logo.png';
      
    } else {
      throw new Error(`所有注册方式都失败了\n最后响应: ${res ? `HTTP ${res.statusCode} - ${JSON.stringify(res.data, null, 2)}` : '无响应'}`);
    }

  } catch (error: any) {
    const errorInfo = {
      message: error.message || '注册失败',
      timestamp: new Date().toLocaleString(),
      nickname: nickname.value,
      communityId: communities.value.length >= 2 ? communities.value[1].id : 'unknown',
      communities: communities.value.map(c => ({ id: c.id, name: c.name })),
      avatarPath: avatarPath.value,
      residentRoleId: residentRoleId || 'not found',
      userData: userData || {},
      error: error
    };
    
    registerError.value = JSON.stringify(errorInfo, null, 2);
    uni.showToast({ title: '注册失败', icon: 'error' });
    console.error('注册失败详细信息:', errorInfo);
  } finally {
    registerLoading.value = false;
  }
}
</script>

<template>
  <view class="profile-container">
    <!-- 头像 -->
    <view class="avatar-section">
      <image class="avatar-img" :src="avatarPath" @click="chooseAvatar" />
      <text class="avatar-tip">点击更换头像</text>
    </view>

    <!-- 昵称输入 -->
    <view class="nickname-section">
      <view class="section-title">昵称</view>
      <input
        v-model="nickname"
        class="nickname-input"
        type="text"
        placeholder="请输入昵称"
      />
    </view>

    <!-- 获取小区信息 -->
    <view class="community-section">
      <button
        class="get-community-btn"
        :disabled="loading"
        @click="getCommunityInfo"
      >
        {{ loading ? '获取中...' : '获取小区信息' }}
      </button>
    </view>

    <!-- 小区信息显示 -->
    <view v-if="communities.length > 0" class="communities-info">
      <view class="section-title">小区信息 (共{{ communities.length }}个)</view>
      <view 
        v-for="(community, index) in communities" 
        :key="community.id || index"
        class="community-item"
      >
        <view class="community-title">小区 {{ index + 1 }}</view>
        <view class="info-item">
          <text class="info-label">名称:</text>
          <input
            class="info-input"
            type="text"
            :value="community.name || ''"
            readonly
          />
        </view>
        <view class="info-item">
          <text class="info-label">地址:</text>
          <input
            class="info-input"
            type="text"
            :value="community.address || ''"
            readonly
          />
        </view>
        <view class="info-item">
          <text class="info-label">描述:</text>
          <textarea
            class="info-textarea"
            :value="community.description || ''"
            readonly
          />
        </view>
      </view>
    </view>

    <!-- 注册按钮 -->
    <view class="register-section">
      <button 
        class="register-btn" 
        :disabled="registerLoading" 
        @click="handleRegister"
      >
        {{ registerLoading ? '注册中...' : '注册' }}
      </button>
    </view>

    <!-- 错误信息显示 -->
    <view v-if="registerError" class="error-section">
      <view class="error-header">
        <text class="error-title">注册失败原因分析</text>
        <button class="copy-btn" @click="copyError">复制</button>
      </view>
      <textarea 
        class="error-textarea"
        :value="registerError"
        readonly
        placeholder="这里会显示注册失败的详细信息"
      />
    </view>
  </view>
</template>

<style lang="scss" scoped>
.profile-container {
  padding: 30rpx;
  min-height: 100vh;
  background: #f5f5f5;
}

// 头像区域
.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 40rpx;
  padding: 40rpx;
  background: #fff;
  border-radius: 12rpx;

  .avatar-img {
    width: 160rpx;
    height: 160rpx;
    border: 4rpx solid #f0f0f0;
    border-radius: 80rpx;
    cursor: pointer;
    transition: opacity 0.3s ease;
    
    &:active {
      opacity: 0.8;
    }
  }

  .avatar-tip {
    margin-top: 20rpx;
    font-size: 24rpx;
    color: #999;
  }
}

// 昵称区域
.nickname-section {
  margin-bottom: 30rpx;
  padding: 30rpx;
  background: #fff;
  border-radius: 12rpx;

  .section-title {
    margin-bottom: 20rpx;
    font-weight: 600;
    font-size: 32rpx;
    color: #333;
  }

  .nickname-input {
    width: 100%;
    padding: 20rpx;
    border: 2rpx solid #e5e6eb;
    border-radius: 8rpx;
    background: #fafafa;
    font-size: 28rpx;
    color: #333;

    &::placeholder {
      color: #999;
    }

    &:focus {
      border-color: #1aa86c;
      outline: none;
    }
  }
}

// 获取小区信息按钮
.community-section {
  margin-bottom: 30rpx;

  .get-community-btn {
    width: 100%;
    height: 88rpx;
    border: none;
    border-radius: 12rpx;
    background: #1aa86c;
    font-weight: 500;
    font-size: 28rpx;
    color: #fff;

    &:active {
      background: #168f5a;
    }

    &:disabled {
      background: #ccc;
      color: #999;
    }
  }
}

// 小区信息显示
.communities-info {
  margin-bottom: 30rpx;

  .section-title {
    margin-bottom: 20rpx;
    padding: 0 30rpx;
    font-weight: 600;
    font-size: 32rpx;
    color: #333;
  }

  .community-item {
    margin-bottom: 20rpx;
    padding: 30rpx;
    background: #fff;
    border-radius: 12rpx;

    &:last-child {
      margin-bottom: 0;
    }

    .community-title {
      margin-bottom: 20rpx;
      padding: 10rpx 20rpx;
      background: #f0f8f0;
      border-radius: 8rpx;
      font-weight: 600;
      font-size: 28rpx;
      color: #1aa86c;
      text-align: center;
    }

    .info-item {
      display: flex;
      align-items: flex-start;
      margin-bottom: 20rpx;

      &:last-child {
        margin-bottom: 0;
      }

      .info-label {
        width: 80rpx;
        margin-right: 20rpx;
        font-size: 28rpx;
        color: #666;
        line-height: 88rpx;
      }

      .info-input {
        flex: 1;
        padding: 20rpx;
        border: 2rpx solid #e5e6eb;
        border-radius: 8rpx;
        background: #f9f9f9;
        font-size: 28rpx;
        color: #333;
      }

      .info-textarea {
        flex: 1;
        padding: 20rpx;
        border: 2rpx solid #e5e6eb;
        border-radius: 8rpx;
        background: #f9f9f9;
        min-height: 120rpx;
        font-size: 28rpx;
        color: #333;
        resize: none;
      }
    }
  }
}

// 注册按钮
.register-section {
  margin-bottom: 30rpx;

  .register-btn {
    width: 100%;
    height: 88rpx;
    border: none;
    border-radius: 12rpx;
    background: #ff6b35;
    font-weight: 500;
    font-size: 28rpx;
    color: #fff;

    &:active {
      background: #e55a2b;
    }

    &:disabled {
      background: #ccc;
      color: #999;
    }
  }
}

// 错误信息显示
.error-section {
  padding: 30rpx;
  background: #fff;
  border-radius: 12rpx;
  border: 2rpx solid #ff4757;

  .error-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;

    .error-title {
      font-weight: 600;
      font-size: 28rpx;
      color: #ff4757;
    }

    .copy-btn {
      padding: 8rpx 20rpx;
      border: 2rpx solid #ff4757;
      border-radius: 6rpx;
      background: transparent;
      font-size: 24rpx;
      color: #ff4757;

      &:active {
        background: #ff4757;
        color: #fff;
      }
    }
  }

  .error-textarea {
    width: 100%;
    min-height: 200rpx;
    padding: 20rpx;
    border: 2rpx solid #ffebee;
    border-radius: 8rpx;
    background: #fafafa;
    font-family: monospace;
    font-size: 24rpx;
    color: #666;
    line-height: 1.4;
    resize: none;
  }
}
</style>
