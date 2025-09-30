<script setup lang="ts" name="create">
import { computed, onBeforeUnmount, reactive, ref } from 'vue';

interface CategoryOption {
  label: string;
  value: string;
}

interface UploadPreviewItem {
  url: string;
  name: string;
  type: 'image' | 'video' | 'file';
  status?: 'success' | 'uploading';
  size?: number;
}

const form = reactive({
  title: '',
  description: '',
  category: ''
});

const categories: CategoryOption[] = [
  { label: '设施维修', value: 'repair' },
  { label: '环境卫生', value: 'environment' },
  { label: '投诉建议', value: 'complaint' },
  { label: '邻里纠纷', value: 'neighbourhood' },
  { label: '安全隐患', value: 'safety' },
  { label: '其他事项', value: 'other' }
];

const maxAttachments = 3;
const fileList = ref<UploadPreviewItem[]>([]);
const toastRef = ref();
const objectUrlPool = new Set<string>();

const selectedCategoryLabel = computed(() => {
  if (!form.category) return '';
  return categories.find((item) => item.value === form.category)?.label ?? '';
});

const attachmentsCountLabel = computed(
  () => `已添加 ${fileList.value.length}/${maxAttachments} 个附件`
);

function showToast(message: string, type: 'default' | 'success' | 'warning' | 'error' = 'default') {
  const toast = toastRef.value as { show?: (config: { type?: string; message: string }) => void } | undefined;
  if (toast?.show) {
    toast.show({ type, message });
  } else {
    uni.showToast({ title: message, icon: type === 'error' ? 'error' : 'none' });
  }
}

function normalizeFiles(payload: any): any[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.file)) return payload.file;
  if (payload.file) return [payload.file];
  return [payload];
}

function resolveFileUrl(file: any): string {
  if (!file) return '';
  if (typeof file.url === 'string' && file.url) return file.url;
  if (typeof file.tempFilePath === 'string') return file.tempFilePath;
  if (typeof file.path === 'string') return file.path;
  if (typeof file.thumbTempFilePath === 'string') return file.thumbTempFilePath;

  if (typeof window !== 'undefined' && file instanceof File) {
    const objectUrl = URL.createObjectURL(file);
    objectUrlPool.add(objectUrl);
    return objectUrl;
  }

  if (typeof file.name === 'string' && typeof file.size === 'number') {
    try {
      const blob = new Blob([file], { type: file.type ?? 'application/octet-stream' });
      const objectUrl = URL.createObjectURL(blob);
      objectUrlPool.add(objectUrl);
      return objectUrl;
    } catch (error) {
      console.warn('无法为文件生成预览地址', error);
    }
  }

  return '';
}

function detectFileType(file: any): 'image' | 'video' | 'file' {
  const type = file?.type ?? '';
  if (typeof type === 'string') {
    if (type.startsWith('image')) return 'image';
    if (type.startsWith('video')) return 'video';
  }

  const url = resolveFileUrl(file);
  if (url) {
    const lower = url.toLowerCase();
    if (/\.(png|jpe?g|gif|bmp|webp)$/.test(lower)) return 'image';
    if (/\.(mp4|mov|avi|mkv|webm)$/.test(lower)) return 'video';
  }

  return 'file';
}

function handleAfterRead(payload: any) {
  if (fileList.value.length >= maxAttachments) {
    showToast('最多上传 3 个附件', 'warning');
    return;
  }

  const files = normalizeFiles(payload);
  const availableSlots = maxAttachments - fileList.value.length;
  const candidates = files.slice(0, availableSlots);

  if (!candidates.length) {
    showToast('附件数量已达上限', 'warning');
    return;
  }

  candidates.forEach((fileItem) => {
    const url = resolveFileUrl(fileItem);
    if (!url) {
      showToast('无法预览此文件，请重试', 'warning');
      return;
    }

    const type = detectFileType(fileItem);
    const name = fileItem.name || `附件-${fileList.value.length + 1}`;

    fileList.value.push({
      url,
      name,
      type,
      status: 'success',
      size: fileItem.size
    });
  });
}

function handleFileDelete(event: { index: number; file: UploadPreviewItem }) {
  const index = event?.index ?? -1;
  if (index < 0) return;

  const [removed] = fileList.value.splice(index, 1);
  if (removed?.url && objectUrlPool.has(removed.url) && typeof URL !== 'undefined') {
    URL.revokeObjectURL(removed.url);
    objectUrlPool.delete(removed.url);
  }
}

function selectCategory(value: string) {
  form.category = form.category === value ? '' : value;
}

function handleSaveDraft() {
  showToast('草稿功能即将开放', 'warning');
}

function handleSubmit() {
  showToast('提交功能待接入，请稍后', 'warning');
}

onBeforeUnmount(() => {
  if (typeof URL === 'undefined') return;
  objectUrlPool.forEach((url) => URL.revokeObjectURL(url));
  objectUrlPool.clear();
});
</script>

<template>
  <view class="create-page">
    <u-card :border="false" class="section-card">
      <template #body>

        <view class="form-section">
          <view class="section-caption">事项信息</view>

          <view class="field-card">
            <u-input
              v-model="form.title"
              placeholder="标题：例如 3号楼电梯卡顿"
              maxlength="100"
              clearable
            />
          </view>

          <view class="field-card field-card--textarea">
            <u-textarea
              v-model="form.description"
              placeholder="详细描述：请补充现场情况、时间、影响范围等细节"
              height="220rpx"
              maxlength="1000"
              showConfirmBar="false"
              count
            />
          </view>
        </view>

        <view class="section-divider" />

        <view class="form-section">
          <view class="section-caption">事项标签</view>
          <view class="tag-wrapper">
            <u-tag
              v-for="item in categories"
              :key="item.value"
              :text="item.label"
              shape="circle"
              size="large"
              :type="form.category === item.value ? 'primary' : 'info'"
              :plain="form.category !== item.value"
              @click="selectCategory(item.value)"
            />
          </view>
        </view>

        <view class="section-divider" />

        <view class="form-section">
          <view class="section-caption">现场附件</view>
          <view class="upload-wrapper">
            <u-upload
              :file-list="fileList"
              :max-count="maxAttachments"
              :multiple="true"
              accept="file"
              :preview-full-image="true"
              @after-read="handleAfterRead"
              @delete="handleFileDelete"
            />
          </view>
          <u-text class="attachments-count" color="#6B7280" :text="attachmentsCountLabel" />
        </view>
      </template>
    </u-card>

    <view class="actions">
      <u-button
        class="action-button"
        type="info"
        plain
        text="保存草稿"
        @click="handleSaveDraft"
      />
      <u-button
        class="action-button"
        type="primary"
        text="提交事项"
        @click="handleSubmit"
      />
    </view>

    <u-toast ref="toastRef" />
  </view>
</template>

<style lang="scss" scoped>
.create-page {
  min-height: 100vh;
  padding: 32rpx 24rpx 140rpx;
  box-sizing: border-box;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.section-card {
  border-radius: 24rpx;
  --card-padding: 28rpx;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.section-caption {
  font-size: 26rpx;
  font-weight: 600;
  color: #0f172a;
}

.field-card {
  padding: 24rpx 28rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 12rpx 28rpx rgba(15, 23, 42, 0.05);
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.field-card--textarea {
  padding-bottom: 32rpx;
}

.section-divider {
  height: 1px;
  margin: 24rpx 0;
  background: linear-gradient(90deg, rgba(148, 163, 184, 0.25), rgba(148, 163, 184, 0));
}

.field-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #111827;
}

.field-card ::v-deep(.u-input),
.field-card ::v-deep(.u-textarea) {
  background: #f8fafc;
  border-radius: 18rpx;
  border: 1px solid rgba(148, 163, 184, 0.2);
  padding: 0 20rpx;
}

.field-card ::v-deep(.u-textarea) {
  padding: 20rpx;
}

.field-card ::v-deep(.u-textarea__textarea) {
  line-height: 1.6;
}

.tag-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.tag-selected {
  margin-top: 16rpx;
}

.attachments-hint {
  padding: 16rpx;
  border-radius: 16rpx;
  background: rgba(31, 41, 55, 0.04);
  font-size: 24rpx;
  color: #4b5563;
}

.upload-wrapper {
  margin-top: 24rpx;
}

.attachments-count {
  margin-top: 16rpx;
}

.actions {
  display: flex;
  gap: 16rpx;
}

.action-button {
  flex: 1;
}

.submit-tip {
  margin-top: -8rpx;
  font-size: 22rpx;
  text-align: center;
}

@media (min-width: 768px) {
  .create-page {
    max-width: 640px;
    margin: 0 auto;
  }
}
</style>
