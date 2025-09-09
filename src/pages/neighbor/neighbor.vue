<script setup lang="ts" name="neighbor">
import { computed, ref } from 'vue';

/**
 * 邻里页面 - 获取业主动态
 * 从Directus获取所有业主发送的content数据
 */

// 基础配置
const apiBaseUrl = ref('/api');
const email = ref('molly@mail.com'); // 预设账户
const password = ref('123'); // 预设密码
const token = ref<string | null>(null);
const loading = ref(false);
const contentData = ref<any>(null);
const errorInfo = ref<any>(null);

// 格式化显示内容
const prettyContentData = computed(() => {
  try {
    return contentData.value ? JSON.stringify(contentData.value, null, 2) : '';
  } catch {
    return String(contentData.value || '');
  }
});

const prettyErrorInfo = computed(() => {
  try {
    return errorInfo.value ? JSON.stringify(errorInfo.value, null, 2) : '';
  } catch {
    return String(errorInfo.value || '');
  }
});

// 图片相关功能
const previewImage = ref<string>('');
const showImagePreview = ref(false);
const imageCache = ref<Record<string, string>>({});

// 获取图片URL（带Token认证）
function getImageUrl(attachment: any): string {
  if (!token.value) {
    return '';
  }

  // 处理不同格式的attachment
  let attachmentId = '';
  if (typeof attachment === 'string') {
    attachmentId = attachment;
  } else if (attachment && typeof attachment === 'object') {
    // 修复：优先使用 directus_files_id 而不是 id
    attachmentId = attachment.directus_files_id || attachment.id || '';
  }

  if (!attachmentId) {
    console.log('无效的attachment:', attachment);
    return '';
  }

  // 尝试不同的URL格式
  return `${apiBaseUrl.value}/assets/${attachmentId}?access_token=${token.value}`;
}

// 异步获取图片数据并转换为blob URL
async function getImageBlob(attachment: any): Promise<string> {
  if (!token.value) {
    return '';
  }

  let attachmentId = '';
  if (typeof attachment === 'string') {
    attachmentId = attachment;
  } else if (attachment && typeof attachment === 'object') {
    // 修复：优先使用 directus_files_id 而不是 id
    attachmentId = attachment.directus_files_id || attachment.id || '';
  }

  if (!attachmentId) {
    return '';
  }

  try {
    const res: any = await uni.request({
      url: `${apiBaseUrl.value}/assets/${attachmentId}`,
      method: 'GET',
      responseType: 'arraybuffer',
      header: {
        'Authorization': `Bearer ${token.value}`
      }
    });

    if (res.statusCode === 200) {
      // 将arraybuffer转换为blob URL
      const blob = new Blob([res.data], { type: 'image/jpeg' });
      return URL.createObjectURL(blob);
    }
  } catch (error) {
    console.error('获取图片失败:', error);
  }

  return '';
}

// 预览图片
function previewImageHandler(attachment: any) {
  const imageSrc = getImageUrl(attachment);
  if (imageSrc) {
    previewImage.value = imageSrc;
    showImagePreview.value = true;
  }
}

// 关闭图片预览
function closeImagePreview() {
  showImagePreview.value = false;
  previewImage.value = '';
}

// 图片加载错误处理
function onImageError(e: any) {
  console.log('图片加载失败:', e);
  // 可以在这里设置默认图片或其他处理
}

// 获取attachment ID的辅助函数
function getAttachmentId(attachment: any): string {
  if (typeof attachment === 'string') {
    return attachment;
  } else if (attachment && typeof attachment === 'object') {
    return attachment.id || attachment.directus_files_id || 'unknown';
  }
  return 'unknown';
}

// 测试图片访问权限
async function testImageAccess() {
  if (!token.value) {
    return;
  }

  loading.value = true;
  errorInfo.value = null;

  try {
    console.log('开始测试图片访问，Token:', token.value.substring(0, 20) + '...');

    // 尝试多种访问方式
    const testMethods = [
      // 方式1: 使用Bearer Header
      {
        name: '使用Bearer Header',
        request: () => uni.request({
          url: `${apiBaseUrl.value}/assets/2`,
          method: 'GET',
          header: {
            'Authorization': `Bearer ${token.value}`,
            'Content-Type': 'application/json'
          }
        })
      },
      // 方式2: 使用access_token参数
      {
        name: '使用access_token参数',
        request: () => uni.request({
          url: `${apiBaseUrl.value}/assets/2?access_token=${token.value}`,
          method: 'GET'
        })
      },
      // 方式3: 检查files端点
      {
        name: '检查files端点',
        request: () => uni.request({
          url: `${apiBaseUrl.value}/files/2`,
          method: 'GET',
          header: {
            'Authorization': `Bearer ${token.value}`,
            'Content-Type': 'application/json'
          }
        })
      }
    ];

    const results: any[] = [];
    for (const method of testMethods) {
      try {
        console.log(`测试: ${method.name}`);
        const res: any = await method.request();
        console.log(`${method.name} 结果:`, res.statusCode, res.data);
        results.push({
          method: method.name,
          status: res.statusCode,
          success: res.statusCode < 400,
          data: typeof res.data === 'string' ? res.data.substring(0, 200) : JSON.stringify(res.data),
          fullResponse: res.data
        });
      } catch (error) {
        console.log(`${method.name} 失败:`, error);
        results.push({
          method: method.name,
          status: 'error',
          success: false,
          error: String(error)
        });
      }
    }

    contentData.value = {
      success: true,
      testType: 'imageAccess',
      results: results,
      timestamp: new Date().toISOString()
    };

  } catch (e: any) {
    errorInfo.value = {
      action: 'testImageAccess',
      success: false,
      error: e?.message || String(e),
      details: e
    };
  } finally {
    loading.value = false;
  }
}

// 登录获取Token
async function login() {
  loading.value = true;
  errorInfo.value = null;

  try {
    const res: any = await uni.request({
      url: `${apiBaseUrl.value}/auth/login`,
      method: 'POST',
      data: { email: email.value, password: password.value },
      header: { 'Content-Type': 'application/json' }
    });

    if (res.statusCode && res.statusCode >= 400) {
      throw new Error(
        `登录失败: ${res.statusCode} - ${JSON.stringify(res.data)}`
      );
    }

    const data: any = res.data;
    const t = data?.data?.access_token || data?.access_token;
    token.value = t || null;

    if (token.value) {
      uni.showToast({ title: '登录成功', icon: 'success' });
    } else {
      throw new Error('未获取到有效Token');
    }
  } catch (e: any) {
    errorInfo.value = {
      action: 'login',
      success: false,
      error: e?.message || String(e),
      details: e,
      tips: ['检查网络连接', '确认Directus服务状态', '验证账号密码']
    };
    uni.showToast({ title: '登录失败', icon: 'error' });
  } finally {
    loading.value = false;
  }
}

// 获取Content数据
async function getContents() {
  if (!token.value) {
    uni.showToast({ title: '请先登录获取Token', icon: 'none' });
    return;
  }

  loading.value = true;
  errorInfo.value = null;
  contentData.value = null;

  try {
    const res: any = await uni.request({
      url: `/api/items/contents`,
      method: 'GET',
      data: {
        limit: 5,
        fields: 'id,title,body,type,attachments.*'
      },
      header: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.value}`
      }
    });

    if (res.statusCode >= 200 && res.statusCode < 300) {
      contentData.value = {
        success: true,
        total: res.data?.data?.length || 0,
        data: res.data?.data || res.data,
        requestInfo: {
          url: '/api/items/contents',
          method: 'GET',
          statusCode: res.statusCode,
          timestamp: new Date().toISOString()
        }
      };
      uni.showToast({
        title: `获取成功! ${contentData.value.total}条数据`,
        icon: 'success'
      });
    } else {
      throw new Error(
        `请求失败: ${res.statusCode} - ${JSON.stringify(res.data)}`
      );
    }
  } catch (e: any) {
    errorInfo.value = {
      action: 'getContents',
      success: false,
      error: e?.message || String(e),
      details: e,
      requestInfo: {
        url: '/api/items/contents',
        method: 'GET',
        hasToken: !!token.value,
        tokenPrefix: `${token.value?.substring(0, 10)}...`,
        timestamp: new Date().toISOString()
      },
      possibleCauses: [
        '用户没有contents集合的读取权限',
        '某些字段权限被限制',
        'Directus数据库连接问题',
        'Token过期或无效'
      ],
      tips: [
        '检查Token是否过期',
        '确认权限配置正确',
        '验证Directus服务状态',
        '检查网络连接'
      ]
    };
    uni.showToast({ title: '获取失败，查看错误信息', icon: 'error' });
  } finally {
    loading.value = false;
  }
}

// 复制内容到剪贴板
function copyContent() {
  const text = prettyContentData.value;
  if (!text) {
    uni.showToast({ title: '没有数据可复制', icon: 'none' });
    return;
  }

  try {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          uni.showToast({ title: '数据已复制', icon: 'success' });
        })
        .catch(() => {
          fallbackCopyTextToClipboard(text);
        });
    } else {
      fallbackCopyTextToClipboard(text);
    }
  } catch {
    uni.showToast({ title: '复制失败', icon: 'error' });
  }
}

function copyError() {
  const text = prettyErrorInfo.value;
  if (!text) {
    uni.showToast({ title: '没有错误信息可复制', icon: 'none' });
    return;
  }

  try {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          uni.showToast({ title: '错误信息已复制', icon: 'success' });
        })
        .catch(() => {
          fallbackCopyTextToClipboard(text);
        });
    } else {
      fallbackCopyTextToClipboard(text);
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
  <view class="page-container">
    <!-- 页面标题 -->
    <view class="header">
      <text class="title">业主圈</text>
      <text class="subtitle">获取业主动态数据</text>
    </view>

    <!-- 操作区域 -->
    <view class="section">
      <view class="account-info">
        <text class="label">预设账户: {{ email }}</text>
        <text class="token-status" :class="{ 'has-token': token }">
          {{ token ? 'Token已获取' : '未登录' }}
        </text>
      </view>

      <view class="buttons">
        <button
          class="btn-primary"
          :loading="loading"
          :disabled="loading"
          @click="login"
        >
          {{ loading ? '登录中...' : '获取Token' }}
        </button>
      </view>

      <view v-if="token" class="buttons">
        <button
          class="btn-default"
          :loading="loading"
          :disabled="loading"
          @click="getContents"
        >
          获取数据
        </button>
      </view>

      <view v-if="token" class="buttons">
        <button
          class="btn-warn"
          :loading="loading"
          :disabled="loading"
          @click="testImageAccess"
        >
          测试图片访问
        </button>
      </view>
    </view>

    <!-- 成功数据展示 - 现在以卡片形式展示 -->
    <view v-if="contentData && contentData.success" class="section">
      <view class="result-header">
        <text class="section-title">📊 业主动态 ({{ contentData.total }}条)</text>
        <button size="mini" class="btn-primary" @click="copyContent">
          复制数据
        </button>
      </view>

      <!-- 内容卡片展示 -->
      <view class="content-list">
        <view
          v-for="item in contentData.data"
          :key="item.id"
          class="content-card"
        >
          <view class="card-header">
            <text class="post-title">{{ item.title || '无标题' }}</text>
            <text class="post-type">{{ item.type }}</text>
          </view>
          <view class="card-body">
            <text class="post-content">{{ item.body || '无内容' }}</text>

            <!-- 图片提示信息 -->
            <!-- 实际图片显示 -->
            <view v-if="item.attachments && item.attachments.length > 0" class="image-gallery">
              <text class="gallery-title">📷 图片 ({{ item.attachments.length }})</text>
              <view class="image-grid">
                <view
                  v-for="(attachment, index) in item.attachments.slice(0, 4)"
                  :key="index"
                  class="image-item"
                  @click="previewImageHandler(attachment)"
                >
                  <image
                    :src="getImageUrl(attachment)"
                    class="post-image"
                    mode="aspectFill"
                    @error="onImageError"
                    :lazy-load="true"
                  />
                  <!-- 如果超过4张图片，显示+N -->
                  <view v-if="index === 3 && item.attachments.length > 4" class="more-images-overlay">
                    <text class="more-text">+{{ item.attachments.length - 4 }}</text>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 错误信息展示 -->
    <view v-if="errorInfo" class="section">
      <view class="result-header">
        <text class="section-title">❌ 错误信息</text>
        <button size="mini" class="btn-warn" @click="copyError">复制错误</button>
      </view>
      <scroll-view class="data-box error-box" scroll-y>
        <text selectable>{{ prettyErrorInfo }}</text>
      </scroll-view>
    </view>

    <!-- 占位提示 -->
    <view v-if="!contentData && !errorInfo" class="section">
      <view class="placeholder">
        <text class="placeholder-text">📱 点击上方按钮开始获取数据</text>
        <text class="placeholder-desc">
          🏠 这里将展示社区业主发布的动态内容
        </text>
      </view>
    </view>

    <!-- 图片预览弹窗 -->
    <view v-if="showImagePreview" class="image-preview-modal" @click="closeImagePreview">
      <image :src="previewImage" class="preview-image" mode="aspectFit" />
      <view class="close-btn" @click="closeImagePreview">
        <text class="close-icon">✕</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.page-container {
  padding: 12px;
  padding-bottom: 70px; /* 为底部TabBar留出空间 */
  min-height: 100vh;
  background-color: #f5f5f5;
  font-size: 14px;
}
/* 页面标题 */
.header {
  margin-bottom: 20px;
  text-align: center;
}
.title {
  display: block;
  margin-bottom: 6px;
  font-weight: bold;
  font-size: 24px;
  color: #333;
}
.subtitle {
  display: block;
  font-size: 14px;
  color: #666;
}
/* 通用区块 */
.section {
  margin-bottom: 16px;
  padding: 16px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
/* 账户信息 */
.account-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px 12px;
  border-radius: 6px;
  background: #f8f9fa;
}
.label {
  font-size: 14px;
  color: #555;
}
.token-status {
  padding: 2px 8px;
  border-radius: 12px;
  background: #eee;
  font-size: 12px;
  color: #999;
}
.token-status.has-token {
  background: #e8f5e8;
  color: #07c160;
}
/* 按钮区域 */
.buttons {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}
.buttons button {
  flex: 1;
}
/* 按钮样式 */
.btn-primary {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background-color: #007aff;
  color: white;
}
.btn-default {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background-color: #6c757d;
  color: white;
}
.btn-warn {
  padding: 4px 8px;
  border: none;
  border-radius: 6px;
  background-color: #dc3545;
  color: white;
}
/* 结果区域标题 */
.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.section-title {
  font-weight: bold;
  font-size: 16px;
  color: #333;
}
/* 内容卡片列表 */
.content-list {
  margin-top: 16px;
}
.content-card {
  margin-bottom: 12px;
  padding: 12px;
  border-left: 4px solid #007aff;
  border-radius: 8px;
  background: #f8f9fa;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.post-title {
  font-weight: bold;
  font-size: 16px;
  color: #333;
}
.post-type {
  padding: 2px 8px;
  border-radius: 12px;
  background: #007aff;
  font-size: 12px;
  color: white;
}
.card-body {
  margin-top: 8px;
}
.post-content {
  line-height: 1.5;
  font-size: 14px;
  color: #666;
}
/* 数据展示框 */
.data-box {
  padding: 12px;
  border: 1px solid #e5e6eb;
  border-radius: 6px;
  height: 300px;
  line-height: 1.4;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  white-space: pre-wrap;
}
.error-box {
  border-color: #fecaca;
  background: #fef2f2;
  color: #dc2626;
}
/* 图片展示 */
.image-gallery {
  margin-top: 12px;
}
.gallery-title {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #666;
}
/* 图片占位符 */
.image-placeholder {
  margin-bottom: 12px;
  padding: 20px;
  border: 2px dashed #dee2e6;
  border-radius: 8px;
  background: #f8f9fa;
  text-align: center;
}
.placeholder-icon {
  display: block;
  margin-bottom: 8px;
  font-size: 24px;
}
.placeholder-title {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
  font-size: 14px;
  color: #333;
}
.placeholder-desc {
  display: block;
  font-size: 12px;
  color: #666;
}
/* 附件列表 */
.attachment-list {
  margin-top: 8px;
}
.attachment-item {
  margin-bottom: 4px;
  padding: 6px 10px;
  border-radius: 4px;
  background: #e9ecef;
}
.attachment-text {
  font-size: 12px;
  color: #495057;
}
.debug-info {
  margin-bottom: 8px;
  padding: 8px;
  border-radius: 4px;
  background: #f0f0f0;
  font-size: 11px;
}
.debug-text {
  color: #666;
  word-break: break-all;
}
.image-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}
.image-item {
  overflow: hidden;
  position: relative;
  border-radius: 8px;
  cursor: pointer;
  aspect-ratio: 1;
}
.post-image {
  border-radius: 8px;
  width: 100%;
  height: 100%;
  transition: transform 0.2s ease;
}
.image-item:active .post-image {
  transform: scale(0.95);
}
.more-images-overlay {
  display: flex;
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.6);
}
.more-text {
  font-weight: bold;
  font-size: 16px;
  color: white;
}
/* 图片预览弹窗 */
.image-preview-modal {
  display: flex;
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 1000;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.9);
}
.preview-image {
  max-width: 90vw;
  max-height: 90vh;
}
.close-btn {
  display: flex;
  position: absolute;
  right: 20px;
  top: 40px;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
}
.close-icon {
  font-weight: bold;
  font-size: 18px;
  color: white;
}
/* 占位内容 */
.placeholder {
  padding: 40px 20px;
  text-align: center;
}
.placeholder-text {
  display: block;
  margin-bottom: 16px;
  font-weight: 500;
  font-size: 16px;
  color: #666;
}
.placeholder-desc {
  display: block;
  line-height: 1.6;
  font-size: 14px;
  color: #999;
}
</style>
