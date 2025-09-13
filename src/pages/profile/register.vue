<script setup lang="ts" name="register">
import { ref } from 'vue';
import { useUserStore } from '@/store/user';

// 用户状态管理
const userStore = useUserStore();

// 调试信息
const debugInfo = ref('');
const showDebugInfo = ref(false);

// 页面数据
const nickname = ref('');
const avatarPath = ref('/static/logo.png');
const communities = ref<any[]>([]);
const selectedCommunityIndex = ref(-1);

// 加载状态
const loading = ref(false);
const registerLoading = ref(false);

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
      communities.value = Array.isArray(res.data.data)
        ? res.data.data
        : [res.data.data];
      uni.showToast({
        title: `获取成功，共${communities.value.length}个小区`,
        icon: 'success'
      });
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

// 选择小区
function selectCommunity(index: number) {
  selectedCommunityIndex.value = index;
  uni.showToast({
    title: `已选择: ${communities.value[index].name}`,
    icon: 'success'
  });
}

// 注册功能 - 第5步：集成用户状态管理
async function handleRegister() {
  if (!nickname.value.trim()) {
    uni.showToast({ title: '请输入昵称', icon: 'none' });
    return;
  }

  if (selectedCommunityIndex.value === -1) {
    uni.showToast({ title: '请选择小区', icon: 'none' });
    return;
  }

  registerLoading.value = true;

  try {
    const selectedCommunity = communities.value[selectedCommunityIndex.value];

    // 调试信息
    const debugResult: Record<string, any> = {
      step: '第5步验证 - 注册页面状态集成',
      timestamp: new Date().toISOString(),
      action: 'register',
      input: {
        nickname: nickname.value,
        selectedCommunity: selectedCommunity.name
      },
      status: 'attempting',
      steps: [] as string[]
    };

    // 第一步：获取 resident 角色ID
    debugResult.steps.push('1. 获取 resident 角色ID');
    const rolesRes: any = await uni.request({
      url: '/api/roles',
      method: 'GET',
      header: {
        'Content-Type': 'application/json'
      }
    });

    if (rolesRes.statusCode !== 200) {
      throw new Error(`获取角色失败: ${rolesRes.statusCode}`);
    }

    const roles = rolesRes.data?.data || [];
    const residentRole = roles.find(
      (role: any) => role.name === 'resident' || role.name === 'Resident'
    );

    if (!residentRole) {
      throw new Error('未找到 resident 角色');
    }

    debugResult.steps.push(`✅ 找到 resident 角色: ${residentRole.id}`);

    // 第二步：头像上传调试系统
    let avatarFileId = null;
    if (avatarPath.value && avatarPath.value !== '/static/logo.png') {
      debugResult.steps.push('2. 开始头像上传调试流程');

      // 调试步骤1: 检查文件信息
      debugResult.steps.push(`2.1 文件路径: ${avatarPath.value}`);

      // 调试步骤2: 使用已验证成功的上传方式
      debugResult.steps.push(
        `2.2 使用成功的上传方式: 基础上传 - 移除Content-Type`
      );

      try {
        const uploadRes: any = await uni.uploadFile({
          url: '/api/files',
          filePath: avatarPath.value,
          name: 'file',
          header: {} // 让uni-app自动处理Content-Type
        });

        debugResult.steps.push(`   状态码: ${uploadRes.statusCode}`);
        debugResult.steps.push(`   响应数据: ${uploadRes.data}`);

        if (uploadRes.statusCode === 200 || uploadRes.statusCode === 201) {
          const uploadData = JSON.parse(uploadRes.data);
          avatarFileId = uploadData.data?.id;
          debugResult.steps.push(`   ✅ 头像上传成功! 文件ID: ${avatarFileId}`);
        } else {
          debugResult.steps.push(`   ❌ 上传失败: ${uploadRes.statusCode}`);
        }
      } catch (uploadError: any) {
        debugResult.steps.push(`   ❌ 上传异常: ${uploadError.message}`);
        debugResult.steps.push(`   错误详情: ${JSON.stringify(uploadError)}`);
      }

      if (!avatarFileId) {
        debugResult.steps.push('2.X 所有上传测试都失败，将跳过头像');
      }
    } else {
      debugResult.steps.push('2. 用户未选择头像，跳过上传');
    }

    // 第三步：准备用户注册数据（使用标准字段）
    const userData = {
      first_name: nickname.value.trim(),
      last_name: '用户',
      email: `${nickname.value.toLowerCase()}@test.com`,
      password: '123456',
      role: residentRole.id,
      community_on_signup: selectedCommunity.id, // 正确的字段名
            ...(avatarFileId ? { avatar: avatarFileId } : {}) // 如果有头像文件ID则添加
    };

    debugResult.steps.push('3. 准备用户数据');
    debugResult.userData = userData;

    // 第四步：注册用户
    debugResult.steps.push('4. 发送注册请求');
    const registerRes: any = await uni.request({
      url: '/api/users',
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      },
      data: userData
    });

    if (registerRes.statusCode !== 200 && registerRes.statusCode !== 201) {
      throw new Error(
        `用户注册失败: ${registerRes.statusCode} - ${
          registerRes.data?.message || '未知错误'
        }`
      );
    }

    const newUser = registerRes.data?.data || registerRes.data;
    debugResult.steps.push(`✅ 用户注册成功: ${newUser.id}`);

    // 第五步：更新用户状态（community_on_signup 应该已经在注册时处理）
    const userInfo = {
      id: newUser.id,
      first_name: userData.first_name,
      last_name: userData.last_name,
      email: userData.email,
      community_id: selectedCommunity.id,
      community_name: selectedCommunity.name
    };

    // 调用 login action 更新状态
    userStore.login(userInfo);

    // 更新调试信息
    debugResult.status = 'success';
    debugResult.userInfo = userInfo;
    debugResult.steps.push('✅ 用户状态已更新');

    debugInfo.value = JSON.stringify(debugResult, null, 2);

    uni.showToast({
      title: '注册成功！',
      icon: 'success',
      duration: 3000
    });

    // 注册成功，不自动跳转，让用户手动操作
    debugResult.steps.push('✅ 注册完成，请手动返回');
  } catch (error: any) {
    // 注册失败
    const errorResult = {
      step: '第5步验证 - 注册页面状态集成',
      timestamp: new Date().toISOString(),
      action: 'register',
      status: 'failed',
      error: {
        message: error.message,
        details: error.response?.data || error.data || '无详细信息'
      },
      input: {
        nickname: nickname.value,
        selectedCommunity: communities.value[selectedCommunityIndex.value]?.name
      }
    };

    debugInfo.value = JSON.stringify(errorResult, null, 2);
    showDebugInfo.value = true;

    uni.showToast({ title: '注册失败，请查看调试信息', icon: 'error' });
    console.error('注册失败:', error);
  } finally {
    registerLoading.value = false;
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

// 返回上一页
function goBack() {
  uni.navigateBack();
}
</script>

<template>
  <view class="register-container">
    <!-- 顶部导航栏 -->
    <view class="nav-bar">
      <view class="nav-back" @click="goBack">
        <text class="back-icon">←</text>
        <text class="back-text">返回</text>
      </view>
      <text class="nav-title">注册账号</text>
      <view class="nav-placeholder"></view>
    </view>

    <!-- 头像选择 -->
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

    <!-- 小区选择 -->
    <view class="community-section">
      <view class="section-title">选择小区</view>

      <!-- 获取小区按钮 -->
      <button
        v-if="communities.length === 0"
        class="get-community-btn"
        :disabled="loading"
        @click="getCommunityInfo"
      >
        {{ loading ? '获取中...' : '获取小区信息' }}
      </button>

      <!-- 小区列表 -->
      <view v-if="communities.length > 0" class="community-list">
        <view
          v-for="(community, index) in communities"
          :key="community.id || index"
          class="community-item"
          :class="{ selected: selectedCommunityIndex === index }"
          @click="selectCommunity(index)"
        >
          <view class="community-info">
            <text class="community-name">{{
              community.name || '未知小区'
            }}</text>
            <text class="community-address">{{
              community.address || '地址未知'
            }}</text>
          </view>
          <view v-if="selectedCommunityIndex === index" class="selected-mark">
            <text class="check-icon">✓</text>
          </view>
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

    <!-- 第5步调试信息显示 -->
    <view v-if="showDebugInfo" class="debug-display">
      <view class="debug-title">🔧 第5步调试信息</view>
      <textarea :value="debugInfo" readonly class="debug-textarea"></textarea>
      <button class="copy-btn" @click="copyDebugInfo">📋 复制调试信息</button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.register-container {
  min-height: 100vh;
  background: #f5f5f5;
}

// 顶部导航栏
.nav-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 30rpx;
  background: #fff;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  .nav-back {
    display: flex;
    align-items: center;
    padding: 10rpx;
    cursor: pointer;
    .back-icon {
      margin-right: 8rpx;
      font-size: 32rpx;
      color: #007aff;
    }
    .back-text {
      font-size: 28rpx;
      color: #007aff;
    }
    &:active {
      opacity: 0.7;
    }
  }
  .nav-title {
    font-weight: 600;
    font-size: 32rpx;
    color: #333;
  }
  .nav-placeholder {
    width: 120rpx; // 占位，保持标题居中
  }
}

// 头像区域
.avatar-section {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: 40rpx 30rpx;
  padding: 40rpx;
  border-radius: 16rpx;
  background: #fff;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
  .avatar-img {
    border: 4rpx solid #f0f0f0;
    border-radius: 80rpx;
    width: 160rpx;
    height: 160rpx;
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
  margin: 0 30rpx 30rpx;
  padding: 30rpx;
  border-radius: 16rpx;
  background: #fff;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
  .section-title {
    margin-bottom: 20rpx;
    font-weight: 600;
    font-size: 32rpx;
    color: #333;
  }
  .nickname-input {
    padding: 20rpx;
    border: 2rpx solid #e5e6eb;
    border-radius: 12rpx;
    width: 100%;
    background: #fafafa;
    font-size: 28rpx;
    color: #333;
    &::placeholder {
      color: #999;
    }
    &:focus {
      border-color: #007aff;
      outline: none;
    }
  }
}

// 小区选择区域
.community-section {
  margin: 0 30rpx 30rpx;
  padding: 30rpx;
  border-radius: 16rpx;
  background: #fff;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
  .section-title {
    margin-bottom: 20rpx;
    font-weight: 600;
    font-size: 32rpx;
    color: #333;
  }
  .get-community-btn {
    border: none;
    border-radius: 12rpx;
    width: 100%;
    height: 88rpx;
    background: #007aff;
    font-weight: 500;
    font-size: 28rpx;
    color: #fff;
    &:active {
      background: #0056d1;
    }
    &:disabled {
      background: #ccc;
      color: #999;
    }
  }
  .community-list {
    .community-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16rpx;
      padding: 24rpx;
      border: 2rpx solid #e5e6eb;
      border-radius: 12rpx;
      background: #fafafa;
      cursor: pointer;
      transition: all 0.3s ease;
      &:last-child {
        margin-bottom: 0;
      }
      &.selected {
        border-color: #007aff;
        background: #f0f8ff;
      }
      &:active {
        transform: scale(0.98);
      }
      .community-info {
        flex: 1;
        .community-name {
          display: block;
          margin-bottom: 8rpx;
          font-weight: 600;
          font-size: 28rpx;
          color: #333;
        }
        .community-address {
          display: block;
          font-size: 24rpx;
          color: #666;
        }
      }
      .selected-mark {
        .check-icon {
          font-weight: 600;
          font-size: 32rpx;
          color: #007aff;
        }
      }
    }
  }
}

// 注册按钮区域
.register-section {
  margin: 0 30rpx 40rpx;
  .register-btn {
    border: none;
    border-radius: 12rpx;
    width: 100%;
    height: 88rpx;
    background: #ff6b35;
    font-weight: 500;
    font-size: 28rpx;
    color: #fff;
    transition: all 0.3s ease;
    &:active {
      background: #e55a2b;
      transform: scale(0.98);
    }
    &:disabled {
      background: #ccc;
      color: #999;
      transform: none;
    }
  }
}

// 第5步调试信息显示区域
.debug-display {
  margin: 0 30rpx 40rpx;
  padding: 30rpx;
  border: 2rpx solid #722ed1;
  border-radius: 16rpx;
  background: #fff;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
  .debug-title {
    margin-bottom: 20rpx;
    font-weight: 600;
    font-size: 28rpx;
    color: #722ed1;
  }
  .debug-textarea {
    padding: 20rpx;
    border: 1rpx solid #e5e6eb;
    border-radius: 8rpx;
    width: 100%;
    height: 300rpx;
    background: #fafafa;
    resize: none;
    line-height: 1.4;
    font-family: monospace;
    font-size: 24rpx;
    color: #333;
  }
  .copy-btn {
    margin-top: 20rpx;
    border: 2rpx solid #722ed1;
    border-radius: 8rpx;
    width: 100%;
    height: 60rpx;
    background: transparent;
    font-size: 24rpx;
    color: #722ed1;
    &:active {
      background: #f9f0ff;
      transform: scale(0.98);
    }
  }
}
</style>
