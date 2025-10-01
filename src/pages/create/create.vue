<script setup lang="ts" name="create">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { storeToRefs } from "pinia";
import { useUserStore } from "@/store/user";
import { workOrdersApi } from "@/utils/directus";
import {
  uploadMultipleFiles,
  getFilePath,
  uploadFileToDirectus,
} from "@/utils/fileUpload";
import UserStatusCard from "../../components/UserStatusCard.vue";
import type { WorkOrder } from "@/@types/directus-schema";

interface CategoryOption {
  label: string;
  value: WorkOrder["category"];
}

interface UploadPreviewItem {
  url: string;
  name: string;
  type: "image" | "video" | "file";
  status?: "success" | "uploading" | "failed";
  size?: number;
  filePath?: string; // 添加真实文件路径
  fileId?: string; // 添加上传后的文件ID
}

// 用户状态管理
const userStore = useUserStore();
const {
  isLoggedIn,
  profile,
  community,
  loading: userLoading,
  communityId,
} = storeToRefs(userStore);

const form = reactive({
  title: "",
  description: "",
  category: "" as WorkOrder["category"],
});

const categories: CategoryOption[] = [
  { label: "设施维修", value: "repair" },
  { label: "环境卫生", value: "complaint" },
  { label: "投诉建议", value: "suggestion" },
  { label: "咨询问题", value: "inquiry" },
  { label: "其他事项", value: "other" },
];

const maxAttachments = 3;
const fileList = ref<UploadPreviewItem[]>([]);
const toastRef = ref();
const objectUrlPool = new Set<string>();
const isSubmitting = ref(false);

// 计算属性
const selectedCategoryLabel = computed(() => {
  if (!form.category) return "";
  return categories.find((item) => item.value === form.category)?.label ?? "";
});

const attachmentsCountLabel = computed(
  () => `已添加 ${fileList.value.length}/${maxAttachments} 个附件`
);

const canSubmit = computed(() => {
  return (
    isLoggedIn.value &&
    form.title.trim() &&
    form.description.trim() &&
    form.category &&
    !isSubmitting.value
  );
});

const submitButtonText = computed(() => {
  if (!isLoggedIn.value) return "请先登录";
  if (isSubmitting.value) return "提交中...";
  if (!form.title.trim()) return "请填写标题";
  if (!form.description.trim()) return "请填写描述";
  if (!form.category) return "请选择类别";
  return "提交工单";
});

function showToast(
  message: string,
  type: "default" | "success" | "warning" | "error" = "default"
) {
  const toast = toastRef.value as
    | { show?: (config: { type?: string; message: string }) => void }
    | undefined;
  if (toast?.show) {
    toast.show({ type, message });
  } else {
    uni.showToast({
      title: message,
      icon: type === "error" ? "error" : "none",
    });
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
  if (!file) return "";
  if (typeof file.url === "string" && file.url) return file.url;
  if (typeof file.tempFilePath === "string") return file.tempFilePath;
  if (typeof file.path === "string") return file.path;
  if (typeof file.thumbTempFilePath === "string") return file.thumbTempFilePath;

  if (typeof window !== "undefined" && file instanceof File) {
    const objectUrl = URL.createObjectURL(file);
    objectUrlPool.add(objectUrl);
    return objectUrl;
  }

  if (typeof file.name === "string" && typeof file.size === "number") {
    try {
      const blob = new Blob([file], {
        type: file.type ?? "application/octet-stream",
      });
      const objectUrl = URL.createObjectURL(blob);
      objectUrlPool.add(objectUrl);
      return objectUrl;
    } catch (error) {
      console.warn("无法为文件生成预览地址", error);
    }
  }

  return "";
}

function detectFileType(file: any): "image" | "video" | "file" {
  const type = file?.type ?? "";
  if (typeof type === "string") {
    if (type.startsWith("image")) return "image";
    if (type.startsWith("video")) return "video";
  }

  const url = resolveFileUrl(file);
  if (url) {
    const lower = url.toLowerCase();
    if (/\.(png|jpe?g|gif|bmp|webp)$/.test(lower)) return "image";
    if (/\.(mp4|mov|avi|mkv|webm)$/.test(lower)) return "video";
  }

  return "file";
}

function handleAfterRead(payload: any) {
  console.log("handleAfterRead - 接收到的payload:", payload);

  if (fileList.value.length >= maxAttachments) {
    showToast("最多上传 3 个附件", "warning");
    return;
  }

  const files = normalizeFiles(payload);
  console.log("handleAfterRead - 标准化后的文件:", files);

  const availableSlots = maxAttachments - fileList.value.length;
  const candidates = files.slice(0, availableSlots);

  if (!candidates.length) {
    showToast("附件数量已达上限", "warning");
    return;
  }

  candidates.forEach((fileItem, index) => {
    console.log(`handleAfterRead - 处理文件 ${index}:`, fileItem);

    const url = resolveFileUrl(fileItem);
    if (!url) {
      showToast("无法预览此文件，请重试", "warning");
      return;
    }

    const type = detectFileType(fileItem);
    const name = fileItem.name || `附件-${fileList.value.length + 1}`;

    // 获取真实文件路径，但不立即上传
    let filePath: string;
    try {
      filePath = getFilePath(fileItem);
      console.log(`handleAfterRead - 获取到文件路径:`, filePath);
    } catch (error: any) {
      console.error("handleAfterRead - 获取文件路径失败:", error);
      showToast(`无法获取文件路径: ${error.message}`, "error");
      return;
    }

    // 添加到文件列表，状态为待上传
    fileList.value.push({
      url,
      name,
      type,
      status: "success", // 本地文件选择成功
      size: fileItem.size,
      filePath,
    });

    console.log(`handleAfterRead - 文件已添加到列表，等待提交时上传:`, name);
  });
}

function handleFileDelete(event: { index: number; file: UploadPreviewItem }) {
  const index = event?.index ?? -1;
  if (index < 0) return;

  const [removed] = fileList.value.splice(index, 1);
  if (
    removed?.url &&
    objectUrlPool.has(removed.url) &&
    typeof URL !== "undefined"
  ) {
    URL.revokeObjectURL(removed.url);
    objectUrlPool.delete(removed.url);
  }
}

function selectCategory(value: WorkOrder["category"]) {
  form.category = form.category === value ? null : value;
}

// 登录检查和跳转
function handleLoginRequired() {
  uni.showModal({
    title: "需要登录",
    content: "请先登录后再创建工单",
    confirmText: "去登录",
    cancelText: "取消",
    success: (res) => {
      if (res.confirm) {
        uni.navigateTo({
          url: "/pages/profile/login",
        });
      }
    },
  });
}

// 提交工单
async function handleSubmit() {
  if (!isLoggedIn.value) {
    handleLoginRequired();
    return;
  }

  if (!canSubmit.value) {
    showToast("请完善表单信息", "warning");
    return;
  }

  isSubmitting.value = true;

  try {
    let fileIds: string[] = [];

    // 如果有文件需要上传，先上传所有文件
    if (fileList.value.length > 0) {
      showToast("正在上传附件...", "default");

      // 更新所有文件状态为上传中
      fileList.value.forEach((file) => {
        file.status = "uploading";
      });

      try {
        // 批量上传文件
        const filePaths = fileList.value.map((file) => file.filePath!);
        fileIds = await uploadMultipleFiles(filePaths);

        // 更新文件状态和ID
        fileList.value.forEach((file, index) => {
          if (fileIds[index]) {
            file.status = "success";
            file.fileId = fileIds[index];
          } else {
            file.status = "failed";
          }
        });

        console.log("handleSubmit - 所有文件上传完成，文件IDs:", fileIds);
        showToast("附件上传完成", "success");
      } catch (error: any) {
        // 文件上传失败，更新状态
        fileList.value.forEach((file) => {
          if (!file.fileId) {
            file.status = "failed";
          }
        });

        console.error("handleSubmit - 文件上传失败:", error);
        showToast(`附件上传失败: ${error.message}`, "error");
        return;
      }
    }

    // 创建工单数据
    const workOrderData: any = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      status: "submitted",
      priority: "medium",
      submitter_id: profile.value?.id,
      // 使用修复后的 community ID 获取逻辑
      community_id: community.value?.id || communityId.value,
      // 添加文件关联 - 使用Directus关系字段格式
      files:
        fileIds.length > 0
          ? {
              create: fileIds.map((fileId) => ({
                directus_files_id: fileId,
              })),
            }
          : undefined,
    };

    console.log("handleSubmit - 创建工单数据:", workOrderData);
    console.log("handleSubmit - 用户社区信息:", {
      "community.value": community.value,
      "communityId.value": communityId.value,
      "profile.value?.community_id": profile.value?.community_id,
      "final community_id": workOrderData.community_id,
    });
    console.log("handleSubmit - 完整用户信息:", {
      profile: profile.value,
      community: community.value,
      isLoggedIn: isLoggedIn.value,
    });
    const result = await workOrdersApi.createOne(workOrderData);

    showToast("工单提交成功！", "success");

    // 重置表单
    form.title = "";
    form.description = "";
    form.category = null;
    fileList.value = [];

    // 可选：跳转到工单列表或详情页
    setTimeout(() => {
      uni.switchTab({
        url: "/pages/task/task",
      });
    }, 1500);
  } catch (error: any) {
    console.error("提交工单失败:", error);
    const errorMessage = error?.message || "提交失败，请重试";
    showToast(errorMessage, "error");
  } finally {
    isSubmitting.value = false;
  }
}

function handleSaveDraft() {
  if (!isLoggedIn.value) {
    handleLoginRequired();
    return;
  }
  showToast("草稿功能即将开放", "warning");
}

// 页面初始化时检查登录状态
onMounted(async () => {
  if (userStore.token && !userStore.profile) {
    await userStore.hydrate();
  }

  if (!isLoggedIn.value) {
    handleLoginRequired();
    return;
  }

  // 如果已登录但社区信息缺失，尝试重新获取
  if (!community.value || !community.value.id) {
    console.log("create.vue - 社区信息缺失，尝试重新获取");
    try {
      await userStore.fetchContext();
    } catch (error) {
      console.error("create.vue - 获取社区信息失败:", error);
    }
  }
});

onBeforeUnmount(() => {
  if (typeof URL === "undefined") return;
  objectUrlPool.forEach((url) => URL.revokeObjectURL(url));
  objectUrlPool.clear();
});
</script>

<template>
  <view class="create-page">
    <!-- 用户状态卡片 -->
    <UserStatusCard v-if="isLoggedIn" theme="blue" />

    <!-- 未登录提示 -->
    <view v-else class="login-prompt">
      <view class="prompt-content">
        <text class="prompt-icon">🔐</text>
        <text class="prompt-title">需要登录</text>
        <text class="prompt-desc">请先登录后再创建工单</text>
        <u-button
          type="primary"
          size="normal"
          text="立即登录"
          @click="handleLoginRequired"
        />
      </view>
    </view>

    <u-card :border="false" class="section-card">
      <template #body>
        <view class="form-section">
          <view class="section-caption">工单信息</view>

          <view class="field-card">
            <u-input
              v-model="form.title"
              placeholder="标题：例如 3号楼电梯卡顿"
              maxlength="100"
              clearable
              :disabled="!isLoggedIn"
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
              :disabled="!isLoggedIn"
            />
          </view>
        </view>

        <view class="section-divider" />

        <view class="form-section">
          <view class="section-caption">工单类别</view>
          <view class="tag-wrapper">
            <u-tag
              v-for="item in categories"
              :key="item.value"
              :text="item.label"
              shape="circle"
              size="large"
              :type="form.category === item.value ? 'primary' : 'info'"
              :plain="form.category !== item.value"
              :disabled="!isLoggedIn"
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
              :disabled="!isLoggedIn"
              @after-read="handleAfterRead"
              @delete="handleFileDelete"
            />
          </view>
          <u-text
            class="attachments-count"
            color="#6B7280"
            :text="attachmentsCountLabel"
          />
        </view>
      </template>
    </u-card>

    <view class="actions">
      <u-button
        class="action-button"
        type="info"
        plain
        text="保存草稿"
        :disabled="!isLoggedIn"
        @click="handleSaveDraft"
      />
      <u-button
        class="action-button"
        type="primary"
        :text="submitButtonText"
        :disabled="!canSubmit"
        :loading="isSubmitting"
        @click="handleSubmit"
      />
    </view>

    <u-toast ref="toastRef" />
  </view>
</template>

<style lang="scss" scoped>
.create-page {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding: 32rpx 24rpx 140rpx;
  min-height: 100vh;
  background: #f5f7fa;
  gap: 20rpx;
}
.login-prompt {
  padding: 60rpx 40rpx;
  border-radius: 24rpx;
  background: #fff;
  box-shadow: 0 12rpx 28rpx rgba(15, 23, 42, 0.05);
  text-align: center;
}
.prompt-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;
}
.prompt-icon {
  line-height: 1;
  font-size: 80rpx;
}
.prompt-title {
  font-weight: 600;
  font-size: 32rpx;
  color: #1f2937;
}
.prompt-desc {
  margin-bottom: 16rpx;
  font-size: 28rpx;
  color: #6b7280;
}
.section-card {
  --card-padding: 28rpx;
  border-radius: 24rpx;
}
.form-section {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}
.section-caption {
  font-weight: 600;
  font-size: 26rpx;
  color: #0f172a;
}
.field-card {
  display: flex;
  flex-direction: column;
  padding: 24rpx 28rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 12rpx 28rpx rgba(15, 23, 42, 0.05);
  gap: 18rpx;
}
.field-card--textarea {
  padding-bottom: 32rpx;
}
.section-divider {
  margin: 24rpx 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    rgba(148, 163, 184, 0.25),
    rgba(148, 163, 184, 0)
  );
}
.field-title {
  font-weight: 600;
  font-size: 28rpx;
  color: #111827;
}
.field-card ::v-deep(.u-input),
.field-card ::v-deep(.u-textarea) {
  padding: 0 20rpx;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 18rpx;
  background: #f8fafc;
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
.upload-button {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40rpx;
  border: 2rpx dashed #dcdfe6;
  border-radius: 12rpx;
  background: #fafafa;
}
.upload-text {
  margin-top: 16rpx;
  font-size: 24rpx;
  color: #909399;
}
.file-item {
  display: flex;
  overflow: hidden;
  position: relative;
  justify-content: center;
  align-items: center;
  border-radius: 12rpx;
  width: 160rpx;
  height: 160rpx;
  background: #f5f7fa;
}
.file-item.file-uploading {
  opacity: 0.6;
}
.file-item.file-failed {
  border: 2rpx solid #f56c6c;
}
.file-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.file-icon {
  display: flex;
  justify-content: center;
  align-items: center;
}
.upload-status {
  display: flex;
  position: absolute;
  right: 8rpx;
  top: 8rpx;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  width: 40rpx;
  height: 40rpx;
  background: rgba(0, 0, 0, 0.6);
}
.upload-status.success {
  background: rgba(103, 194, 58, 0.9);
}
.upload-status.failed {
  background: rgba(245, 108, 108, 0.9);
}
.delete-btn {
  display: flex;
  position: absolute;
  right: 4rpx;
  top: 4rpx;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  width: 32rpx;
  height: 32rpx;
  background: rgba(0, 0, 0, 0.6);
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
  text-align: center;
  font-size: 22rpx;
}
@media (min-width: 768px) {
  .create-page {
    margin: 0 auto;
    max-width: 640px;
  }
}
</style>
