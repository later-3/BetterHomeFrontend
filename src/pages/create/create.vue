<script setup lang="ts" name="create">
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import UserStatusCard from '../../components/UserStatusCard.vue';
import { useUserStore } from '@/store/user';

// 用户状态管理
const userStore = useUserStore();
const { loggedIn } = storeToRefs(userStore);

// --- 登录与通用状态 ---
const apiBaseUrl = ref('/api');
const email = ref('');
const password = ref('');
const token = ref<string | null>(null);
const loading = ref(false);

// 发帖数据
const postTitle = ref('');
const postDescription = ref('');
const postType = ref('post'); // 默认类型
const imagePath = ref('');
const uploadedFileId = ref<string>('');

// 类型选项
const typeOptions = [
  { label: '业主圈帖子', value: 'post' },
  { label: '物业公告', value: 'announcement' },
  { label: '投诉工单', value: 'complaint' }
];

// 处理类型选择变化
function onTypeChange(e: any) {
  postType.value = e.detail.value;
}

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
      uni.showToast({ title: '登录成功', icon: 'success' });
    } else {
      throw new Error(
        `登录失败: ${res.statusCode} - ${JSON.stringify(res.data)}`
      );
    }
  } catch (error: any) {
    uni.showToast({ title: '登录失败', icon: 'error' });
  } finally {
    loading.value = false;
  }
}

// 选择图片
async function chooseImage() {
  try {
    const res: any = await uni.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera']
    });

    if (res.tempFilePaths && res.tempFilePaths[0]) {
      imagePath.value = res.tempFilePaths[0];
    }
  } catch (error: any) {
    uni.showToast({ title: '图片选择失败', icon: 'error' });
  }
}

// 上传图片到Directus
async function uploadToDirectus() {
  if (!token.value) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    return;
  }

  if (!imagePath.value) {
    uni.showToast({ title: '请先选择图片', icon: 'none' });
    return;
  }

  loading.value = true;

  try {
    const res: any = await uni.uploadFile({
      url: `${apiBaseUrl.value}/files`,
      filePath: imagePath.value,
      name: 'file',
      header: {
        Authorization: `Bearer ${token.value}`
      }
    });

    if (res.statusCode === 200) {
      const responseData = JSON.parse(res.data);
      if (responseData?.data?.id) {
        uploadedFileId.value = responseData.data.id;
        uni.showToast({ title: '图片上传成功', icon: 'success' });
      } else {
        throw new Error('上传响应中缺少文件ID');
      }
    } else {
      throw new Error(`上传失败: ${res.statusCode}`);
    }
  } catch (error: any) {
    uni.showToast({ title: '图片上传失败', icon: 'error' });
  } finally {
    loading.value = false;
  }
}

// 发布内容
async function handleUpload() {
  if (!token.value) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    return;
  }

  if (!postTitle.value.trim() || !postDescription.value.trim()) {
    uni.showToast({ title: '请填写标题和描述', icon: 'none' });
    return;
  }

  loading.value = true;

  try {
    // 如果有图片但还没上传，先上传
    if (imagePath.value && !uploadedFileId.value) {
      await uploadToDirectus();
      if (!uploadedFileId.value) {
        throw new Error('图片上传失败');
      }
    }

    // 准备发布数据
    const postData: any = {
      title: postTitle.value.trim(),
      body: postDescription.value.trim(),
      type: postType.value
    };

    // 如果有上传的文件，添加到attachments
    if (uploadedFileId.value) {
      postData.attachments = [
        {
          directus_files_id: uploadedFileId.value,
          contents_id: '+'
        }
      ];
    }

    const res: any = await uni.request({
      url: `${apiBaseUrl.value}/items/contents`,
      method: 'POST',
      data: postData,
      header: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.value}`
      }
    });

    if (res.statusCode >= 200 && res.statusCode < 300) {
      uni.showToast({ title: '发布成功！', icon: 'success' });

      // 清空表单
      postTitle.value = '';
      postDescription.value = '';
      postType.value = 'post';
      imagePath.value = '';
      uploadedFileId.value = '';
    } else {
      throw new Error(
        `发布失败: ${res.statusCode} - ${JSON.stringify(res.data)}`
      );
    }
  } catch (error: any) {
    uni.showToast({ title: '发布失败', icon: 'error' });
  } finally {
    loading.value = false;
  }
}

// 清空表单
function clearForm() {
  postTitle.value = '';
  postDescription.value = '';
  postType.value = 'post';
  imagePath.value = '';
  uploadedFileId.value = '';
  uni.showToast({ title: '表单已清空', icon: 'success' });
}
</script>

<template>
  <view class="create-poc">
    <!-- 用户状态显示 -->
    <UserStatusCard theme="blue" />

    <!-- 登录区 - 仅在未登录时显示 -->
    <view v-if="!loggedIn" class="section">
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
        <!-- <button type="primary" :disabled="loading" @tap="login">登录</button> -->
        <uni-button type="primary"  @click="login">登录</uni-button>
        <text v-if="token" class="token">已登录</text>
      </view>
    </view>

    <!-- 发帖区 -->
    <view class="section">
      <view class="form-title">✏️ 发布内容</view>

      <!-- 内容类型选择 -->
      <view class="row">
        <text class="label">类型 *</text>
        <radio-group class="radio-group" @change="onTypeChange">
          <label
            v-for="option in typeOptions"
            :key="option.value"
            class="radio-item"
          >
            <radio :value="option.value" :checked="postType === option.value" />
            <text class="radio-label">{{ option.label }}</text>
          </label>
        </radio-group>
      </view>

      <!-- 标题 -->
      <view class="row">
        <text class="label">标题 *</text>
        <input
          v-model="postTitle"
          class="input"
          type="text"
          placeholder="请输入标题"
          maxlength="100"
        />
      </view>

      <!-- 内容描述 -->
      <view class="row">
        <text class="label">内容 *</text>
        <textarea
          v-model="postDescription"
          class="textarea"
          placeholder="请输入内容描述..."
          maxlength="1000"
          show-confirm-bar="false"
        />
      </view>

      <!-- 图片选择 -->
      <view class="row">
        <text class="label">图片</text>
        <!-- @ts-ignore -->
        <uni-button
          size="mini"
          type="default"
          :disabled="loading"
          @click="chooseImage"
        >
          {{ imagePath ? '重新选择' : '选择图片' }}
        </uni-button>
      </view>

      <!-- 图片预览 -->
      <view v-if="imagePath" class="image-preview">
        <image :src="imagePath" class="preview-image" mode="aspectFit" />
        <view class="image-path">路径: {{ imagePath }}</view>
        <!-- @ts-ignore -->
        <uni-button
          size="mini"
          type="warn"
          :disabled="loading"
          @click="uploadToDirectus"
        >
          {{ uploadedFileId ? '重新上传' : '上传图片' }}
        </uni-button>
        <text v-if="uploadedFileId" class="upload-success">
          ✅ 已上传，文件ID: {{ uploadedFileId }}
        </text>
      </view>

      <!-- 发布按钮 -->
      <view class="row">
        <!-- @ts-ignore -->
        <uni-button
          type="primary"
          :disabled="!postTitle.trim() || !postDescription.trim() || loading"
          :loading="loading"
          style="width: 100%;"
          @click="handleUpload"
        >
          {{ loading ? '发布中...' : '发布内容' }}
        </uni-button>
      </view>

      <!-- 清空按钮 -->
      <view class="row">
        <!-- @ts-ignore -->
        <uni-button
          type="default"
          :disabled="loading"
          style="width: 100%;"
          @click="clearForm"
        >
          清空表单
        </uni-button>
      </view>
    </view>
  </view>
</template>

<style scoped>
.create-poc {
  padding: 12px;
  font-size: 14px;
}
.section {
  margin-bottom: 12px;
  padding: 12px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
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
.textarea {
  flex: 1;
  padding: 8px;
  border: 1px solid #e5e6eb;
  border-radius: 6px;
  min-height: 80px;
  background: #fafafa;
  line-height: 1.4;
  font-size: 14px;
}
.image-preview {
  margin-top: 12px;
  padding: 12px;
  border: 1px solid #e5e6eb;
  border-radius: 6px;
  background: #f8f9fa;
}
.preview-image {
  margin-bottom: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 120px;
  height: 120px;
}
.image-path {
  margin-bottom: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  background: #fff;
  font-size: 12px;
  color: #666;
  word-break: break-all;
}
.upload-success {
  margin-left: 8px;
  font-size: 12px;
  color: #07c160;
}
/* 单选框样式 */
.radio-group {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 8px;
}
.radio-item {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  background: #f8f9fa;
}
.radio-item:has(radio:checked) {
  border-color: #28a745;
  background: #e8f5e8;
}
.radio-label {
  margin-left: 8px;
  font-size: 14px;
  color: #333;
}
</style>
