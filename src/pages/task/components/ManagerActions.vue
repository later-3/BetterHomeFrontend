<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from "vue";
import env from "@/config/env";
import { useUserStore } from "@/store/user";
import type { WorkOrder } from "@/@types/directus-schema";
import { uploadFiles } from "@directus/sdk";
import {
  uploadMultipleFiles,
  getFilePath,
} from "@/utils/fileUpload";
import {
  directusClient,
  handleDirectusError,
} from "@/utils/directus";

interface StatusOption {
  label: string;
  value: NonNullable<WorkOrder["status"]>;
  description: string;
}

interface StaffOption {
  id: string;
  name: string;
  roleLabel: string;
  rawRole?: string | null;
  userType?: string | null;
  email?: string | null;
}

interface UploadPreviewItem {
  url: string;
  name: string;
  type: "image" | "video" | "file";
  status?: "success" | "uploading" | "failed";
  size?: number;
  filePath?: string;
  fileId?: string;
  source?:
    | File
    | Blob
    | {
        path?: string;
        tempFilePath?: string;
        uri?: string;
        name?: string;
        size?: number;
        type?: string;
        file?: File | Blob;
      }
    | null;
}

type FormMode = "assignment" | "custom";

const ROLE_LABEL_MAP: Record<string, string> = {
  resident: "业主",
  admin: "管理员",
  property_manager: "物业经理",
  property_worker: "物业人员",
  property_woker: "物业人员",
  committee_member: "业委会成员",
  committee_normal: "业委会工作人员",
  Administrator: "管理员",
};

const MAX_ATTACHMENTS = 6;

const props = defineProps<{
  workOrderId: string;
  currentStatus?: WorkOrder["status"] | null;
}>();

const emit = defineEmits<{
  (e: "status-change", value: NonNullable<WorkOrder["status"]>): void;
  (e: "node-created"): void;
}>();

const userStore = useUserStore();

const statusSheetVisible = ref(false);
const createNodeVisible = ref(false);
const submittingStatus = ref(false);
const creatingNode = ref(false);

const selectedStatus = ref<NonNullable<WorkOrder["status"]> | null>(null);

const formMode = ref<FormMode>("assignment");

const assignmentForm = reactive({
  assigneeIds: [] as string[],
  note: "",
});

const customForm = reactive({
  title: "",
  description: "",
});

const fileList = ref<UploadPreviewItem[]>([]);
const objectUrlPool = new Set<string>();

const staffOptions = ref<StaffOption[]>([]);
const staffLoading = ref(false);
const staffLoaded = ref(false);
const staffError = ref<string | null>(null);

const statusOptions: StatusOption[] = [
  { value: "accepted", label: "已受理", description: "物业已确认并安排处理" },
  { value: "in_progress", label: "处理中", description: "正在安排或现场处理" },
  { value: "resolved", label: "已解决", description: "问题已处理完成" },
  { value: "closed", label: "已关闭", description: "工单关闭或撤销" },
];

const tokenReady = computed(() => Boolean(userStore.token));

const statusDisplay = computed(() => {
  const current = props.currentStatus ?? null;
  if (!current) return "--";
  const found = statusOptions.find((item) => item.value === current);
  return found?.label ?? current;
});

const selectedStaffSummary = computed(() => {
  if (!assignmentForm.assigneeIds.length) return "未选择人员";
  const names = staffOptions.value
    .filter((staff) => assignmentForm.assigneeIds.includes(staff.id))
    .map((staff) => staff.name);
  return names.join("、") || "未选择人员";
});

const openStatusSheet = () => {
  selectedStatus.value = props.currentStatus ?? null;
  statusSheetVisible.value = true;
};

const handleStatusSelect = (option: StatusOption) => {
  selectedStatus.value = option.value;
};

const closeStatusSheet = () => {
  statusSheetVisible.value = false;
};

const submitStatusChange = async () => {
  if (!props.workOrderId || !selectedStatus.value) {
    closeStatusSheet();
    return;
  }

  try {
    submittingStatus.value = true;
    await userStore.ensureActiveSession({ refreshIfNearExpiry: true });
    if (!tokenReady.value) {
      throw new Error("当前登录状态无效，请重新登录");
    }

    await new Promise<UniApp.RequestSuccessCallbackResult>((resolve, reject) => {
      uni.request({
        url: `${env.directusUrl}/items/work_orders/${props.workOrderId}`,
        method: "PATCH",
        header: {
          Authorization: `Bearer ${userStore.token}`,
          "Content-Type": "application/json",
        },
        data: { status: selectedStatus.value },
        success: resolve,
        fail: (error) => reject(new Error(error?.errMsg ?? "网络错误")),
      });
    }).then((response) => {
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw new Error(
          `更新失败：${response.statusCode} ${JSON.stringify(response.data)}`
        );
      }
    });

    uni.showToast({ title: "状态已更新", icon: "success" });
    emit("status-change", selectedStatus.value);
  } catch (error: any) {
    uni.showToast({
      title: error?.message ?? "更新失败",
      icon: "none",
    });
  } finally {
    submittingStatus.value = false;
    closeStatusSheet();
  }
};

const ensureStaffLoaded = async () => {
  if (staffLoaded.value || staffLoading.value) return;

  try {
    staffLoading.value = true;
    staffError.value = null;

    await userStore.ensureActiveSession({ refreshIfNearExpiry: true });
    if (!tokenReady.value) {
      throw new Error("用户未登录");
    }

    const filter = encodeURIComponent(
      JSON.stringify({
        user_type: {
          _in: ["property_manager", "property_worker", "property_woker"],
        },
      })
    );

    const fields = [
      "id",
      "first_name",
      "last_name",
      "email",
      "user_type",
      "role.name",
    ]
      .map((field) => `fields[]=${field}`)
      .join("&");

    const url = `${env.directusUrl}/users?${fields}&filter=${filter}&limit=-1&sort[]=first_name`;

    const response = await new Promise<UniApp.RequestSuccessCallbackResult>(
      (resolve, reject) => {
        uni.request({
          url,
          method: "GET",
          header: {
            Authorization: `Bearer ${userStore.token}`,
          },
          success: resolve,
          fail: (error) => reject(new Error(error?.errMsg ?? "网络错误")),
        });
      }
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new Error(
        `获取人员失败：${response.statusCode} ${JSON.stringify(
          response.data
        )}`
      );
    }

    const payload = (response.data as any)?.data ?? [];
    staffOptions.value = Array.isArray(payload)
      ? payload
          .filter((item) => item && typeof item === "object")
          .map((item: any) => {
            const first = typeof item.first_name === "string" ? item.first_name : "";
            const last = typeof item.last_name === "string" ? item.last_name : "";
            const email = typeof item.email === "string" ? item.email : "";
            const roleRaw =
              (item.role && typeof item.role === "object" && item.role.name) ||
              null;
            const userType =
              typeof item.user_type === "string" ? item.user_type : null;
            const name =
              `${first}${last}`.trim() ||
              email ||
              (item.id ? `用户 ${String(item.id).slice(0, 6)}` : "未命名用户");
            const label =
              ROLE_LABEL_MAP[roleRaw ?? ""] ||
              ROLE_LABEL_MAP[userType ?? ""] ||
              roleRaw ||
              userType ||
              "物业人员";

            return {
              id: String(item.id),
              name,
              roleLabel: label,
              rawRole: roleRaw,
              userType,
              email,
            } as StaffOption;
          })
      : [];

    staffLoaded.value = true;
  } catch (error: any) {
    staffError.value = error?.message ?? "无法加载物业人员列表";
  } finally {
    staffLoading.value = false;
  }
};

const openCreateNode = () => {
  formMode.value = "assignment";
  resetAssignmentForm();
  resetCustomForm();
  ensureStaffLoaded().catch(() => undefined);
  createNodeVisible.value = true;
};

const closeCreateNode = () => {
  createNodeVisible.value = false;
};

watch(
  formMode,
  (mode) => {
    if (mode === "assignment") {
      ensureStaffLoaded().catch(() => undefined);
    }
  },
  { immediate: false }
);

function resetAssignmentForm() {
  assignmentForm.assigneeIds = [];
  assignmentForm.note = "";
}

function resetCustomForm() {
  customForm.title = "";
  customForm.description = "";
  resetAttachments();
}

function resetAttachments() {
  if (typeof URL !== "undefined") {
    fileList.value.forEach((item) => {
      if (item.url && objectUrlPool.has(item.url)) {
        URL.revokeObjectURL(item.url);
        objectUrlPool.delete(item.url);
      }
    });
  }
  fileList.value = [];
  objectUrlPool.clear();
}

const resolveFileUrl = (file: any): string | null => {
  if (!file) return null;

  if (typeof file.url === "string") {
    if (
      typeof URL !== "undefined" &&
      file.url.startsWith("blob:") &&
      !objectUrlPool.has(file.url)
    ) {
      objectUrlPool.add(file.url);
    }
    return file.url;
  }

  if (typeof file.tempFilePath === "string") return file.tempFilePath;
  if (typeof file.path === "string") return file.path;
  if (typeof file.filePath === "string") return file.filePath;

  return null;
};

const detectFileType = (file: any): UploadPreviewItem["type"] => {
  const type = file?.type;
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
};

const normalizeFiles = (payload: any): any[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.file)) return payload.file;
  if (payload.file) return [payload.file];
  if (payload.tempFiles) return payload.tempFiles;
  return [payload];
};

function extractUploadableFile(
  item: UploadPreviewItem
): { file: File | Blob; name?: string } | null {
  const source = item.source;

  if (typeof File !== "undefined" && source instanceof File) {
    return { file: source, name: item.name };
  }

  if (source instanceof Blob) {
    return { file: source, name: item.name };
  }

  if (source && typeof source === "object") {
    const nested: any = source;
    if (
      nested.file &&
      (nested.file instanceof File || nested.file instanceof Blob)
    ) {
      return { file: nested.file, name: item.name || nested.file.name };
    }
  }

  return null;
}

async function uploadAttachments(): Promise<string[]> {
  if (!fileList.value.length) return [];

  const availableFilePaths = fileList.value
    .map((item) => item.filePath)
    .filter((path): path is string => Boolean(path));

  if (availableFilePaths.length === fileList.value.length) {
    try {
      return await uploadMultipleFiles(availableFilePaths);
    } catch (error) {
      console.warn(
        "uploadAttachments - 使用 uni.uploadFile 上传失败，尝试回退方案",
        error
      );
    }
  }

  if (typeof FormData === "undefined") {
    throw new Error("当前环境暂不支持附件上传");
  }

  const uploadable = fileList.value
    .map((item) => extractUploadableFile(item))
    .filter((value): value is { file: File | Blob; name?: string } => Boolean(value));

  if (!uploadable.length) {
    throw new Error("无法读取附件内容，请重新选择文件");
  }

  const createFormData = () => {
    const formData = new FormData();
    uploadable.forEach(({ file, name }, index) => {
      const fallbackName =
        file instanceof File && file.name ? file.name : `attachment-${index + 1}`;
      formData.append("file", file, name || fallbackName);
    });
    return formData;
  };

  const executeUpload = async () => {
    const response = await directusClient.request(uploadFiles(createFormData()));
    const uploaded = Array.isArray(response) ? response : [response];
    const fileIds = uploaded
      .map((item) =>
        item && typeof item === "object" && "id" in item
          ? ((item as { id?: string }).id ?? "")
          : ""
      )
      .filter(Boolean);

    if (!fileIds.length) {
      throw new Error("附件上传失败：未返回文件ID");
    }

    return fileIds;
  };

  let triedRefresh = false;

  try {
    await userStore.ensureActiveSession({ refreshIfNearExpiry: true });
    return await executeUpload();
  } catch (error: any) {
    const status =
      error?.response?.status ??
      error?.errors?.[0]?.extensions?.status ??
      (error?.errors?.[0]?.extensions?.code === "INVALID_CREDENTIALS"
        ? 401
        : undefined);

    if (status === 401 && !triedRefresh) {
      triedRefresh = true;
      await userStore.ensureActiveSession({ force: true });
      return await executeUpload();
    }

    handleDirectusError(error);
  }

  return [];
}

function handleAfterRead(payload: any) {
  if (fileList.value.length >= MAX_ATTACHMENTS) {
    uni.showToast({ title: `最多上传 ${MAX_ATTACHMENTS} 个附件`, icon: "none" });
    return;
  }

  const files = normalizeFiles(payload);
  const availableSlots = MAX_ATTACHMENTS - fileList.value.length;
  const candidates = files.slice(0, availableSlots);

  if (!candidates.length) {
    uni.showToast({ title: "附件数量已达上限", icon: "none" });
    return;
  }

  candidates.forEach((fileItem) => {
    const url = resolveFileUrl(fileItem);
    if (!url) {
      uni.showToast({ title: "无法预览此文件，请重试", icon: "none" });
      return;
    }

    const type = detectFileType(fileItem);
    const name = fileItem.name || `附件-${fileList.value.length + 1}`;

    let filePath: string;
    try {
      filePath = getFilePath(fileItem);
    } catch (error: any) {
      uni.showToast({ title: error?.message ?? "无法获取文件路径", icon: "none" });
      return;
    }

    fileList.value.push({
      url,
      name,
      type,
      status: "success",
      size: fileItem.size,
      filePath,
      source: fileItem?.file ?? fileItem ?? null,
    });
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

async function submitAssignmentNode() {
  if (!assignmentForm.assigneeIds.length) {
    uni.showToast({ title: "请选择需要指派的人员", icon: "none" });
    return;
  }

  const actorId = userStore.profile?.id;
  if (!actorId) {
    throw new Error("未获取到当前用户信息");
  }

  const selectedStaff = staffOptions.value.filter((staff) =>
    assignmentForm.assigneeIds.includes(staff.id)
  );
  const assigneeNames = selectedStaff.map((staff) => staff.name).join("、");

  const descriptionLines: string[] = [];
  descriptionLines.push(`指派给：${assigneeNames || "未指定人员"}`);
  if (assignmentForm.note.trim()) {
    descriptionLines.push(assignmentForm.note.trim());
  }

  const description = descriptionLines.join("\n");

  const primaryAssignee = assignmentForm.assigneeIds[0] ?? null;
  if (primaryAssignee) {
    await new Promise<UniApp.RequestSuccessCallbackResult>((resolve, reject) => {
      uni.request({
        url: `${env.directusUrl}/items/work_orders/${props.workOrderId}`,
        method: "PATCH",
        header: {
          Authorization: `Bearer ${userStore.token}`,
          "Content-Type": "application/json",
        },
        data: { assignee_id: primaryAssignee },
        success: resolve,
        fail: (error) => reject(new Error(error?.errMsg ?? "网络错误")),
      });
    }).then((response) => {
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw new Error(
          `指派失败：${response.statusCode} ${JSON.stringify(response.data)}`
        );
      }
    });
  }

  await new Promise<UniApp.RequestSuccessCallbackResult>((resolve, reject) => {
    uni.request({
      url: `${env.directusUrl}/items/work_order_nodes`,
      method: "POST",
      header: {
        Authorization: `Bearer ${userStore.token}`,
        "Content-Type": "application/json",
      },
      data: {
        work_order_id: props.workOrderId,
        node_type: "updated_by_assignee",
        description,
        actor_id: actorId,
      },
      success: resolve,
      fail: (error) => reject(new Error(error?.errMsg ?? "网络错误")),
    });
  }).then((response) => {
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new Error(
        `创建失败：${response.statusCode} ${JSON.stringify(response.data)}`
      );
    }
  });
}

async function submitCustomNode() {
  if (!customForm.title.trim()) {
    uni.showToast({ title: "请填写节点标题", icon: "none" });
    return;
  }
  if (!customForm.description.trim()) {
    uni.showToast({ title: "请填写节点说明", icon: "none" });
    return;
  }

  const actorId = userStore.profile?.id;
  if (!actorId) {
    throw new Error("未获取到当前用户信息");
  }

  let fileIds: string[] = [];
  if (fileList.value.length > 0) {
    fileList.value.forEach((file) => (file.status = "uploading"));
    try {
      fileIds = await uploadAttachments();
      fileList.value.forEach((file, index) => {
        file.status = fileIds[index] ? "success" : "failed";
        if (fileIds[index]) {
          file.fileId = fileIds[index];
        }
      });
    } catch (error: any) {
      fileList.value.forEach((file) => {
        if (!file.fileId) {
          file.status = "failed";
        }
      });
      throw new Error(error?.message ?? "附件上传失败");
    }
  }

  const description = `标题：${customForm.title.trim()}\n${customForm.description.trim()}`;

  const payload: Record<string, any> = {
    work_order_id: props.workOrderId,
    node_type: "updated_by_assignee",
    description,
    actor_id: actorId,
  };

  if (fileIds.length > 0) {
    payload.files = {
      create: fileIds.map((fileId) => ({
        directus_files_id: fileId,
      })),
    };
  }

  await new Promise<UniApp.RequestSuccessCallbackResult>((resolve, reject) => {
    uni.request({
      url: `${env.directusUrl}/items/work_order_nodes`,
      method: "POST",
      header: {
        Authorization: `Bearer ${userStore.token}`,
        "Content-Type": "application/json",
      },
      data: payload,
      success: resolve,
      fail: (error) => reject(new Error(error?.errMsg ?? "网络错误")),
    });
  }).then((response) => {
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new Error(
        `创建失败：${response.statusCode} ${JSON.stringify(response.data)}`
      );
    }
  });
}

const submitTimelineNode = async () => {
  if (!props.workOrderId) {
    closeCreateNode();
    return;
  }

  try {
    creatingNode.value = true;
    await userStore.ensureActiveSession({ refreshIfNearExpiry: true });
    if (!tokenReady.value) {
      throw new Error("当前登录状态无效，请重新登录");
    }

    if (formMode.value === "assignment") {
      await submitAssignmentNode();
    } else {
      await submitCustomNode();
    }

    uni.showToast({ title: "已添加进度", icon: "success" });
    emit("node-created");
    resetAssignmentForm();
    resetCustomForm();
    closeCreateNode();
  } catch (error: any) {
    uni.showToast({
      title: error?.message ?? "添加失败",
      icon: "none",
    });
  } finally {
    creatingNode.value = false;
  }
};

onBeforeUnmount(() => {
  resetAttachments();
});
</script>

<template>
  <view class="manager-actions">
    <view class="manager-header">
      <text class="manager-title">物业操作</text>
      <text class="manager-desc">仅物业人员可见</text>
    </view>
    <view class="manager-status">
      <text class="status-label">当前状态</text>
      <text class="status-value">{{ statusDisplay }}</text>
    </view>
    <view class="manager-buttons">
      <up-button
        type="primary"
        size="medium"
        text="修改状态"
        :loading="submittingStatus"
        @click="openStatusSheet"
      />
      <up-button
        type="success"
        size="medium"
        text="新增进度"
        :loading="creatingNode"
        @click="openCreateNode"
      />
    </view>

    <up-popup
      :show="statusSheetVisible"
      mode="bottom"
      round="20"
      @close="closeStatusSheet"
      @mask-click="closeStatusSheet"
    >
      <view class="sheet-container">
        <view class="sheet-header">
          <text class="sheet-title">选择工单状态</text>
          <up-icon name="close" size="20" color="#94A3B8" @click="closeStatusSheet" />
        </view>
        <scroll-view class="sheet-list" scroll-y>
          <view
            v-for="option in statusOptions"
            :key="option.value"
            class="sheet-item"
            :class="{ 'sheet-item--active': option.value === selectedStatus }"
            @click="handleStatusSelect(option)"
          >
            <view class="item-text">
              <text class="item-label">{{ option.label }}</text>
              <text class="item-desc">{{ option.description }}</text>
            </view>
            <up-icon
              v-if="option.value === selectedStatus"
              name="checkmark"
              size="20"
              color="#1AA86C"
            />
          </view>
        </scroll-view>
        <view class="sheet-footer">
          <up-button
            type="primary"
            text="确认更新"
            :loading="submittingStatus"
            :disabled="!selectedStatus"
            @click="submitStatusChange"
            shape="circle"
          />
        </view>
      </view>
    </up-popup>

    <up-popup
      :show="createNodeVisible"
      mode="bottom"
      round="20"
      @close="closeCreateNode"
      @mask-click="closeCreateNode"
    >
      <view class="modal-container">
        <view class="modal-header">
          <text class="modal-title">添加处理进度</text>
          <up-icon name="close" size="20" color="#94A3B8" @click="closeCreateNode" />
        </view>
        <scroll-view class="modal-body" scroll-y>
          <view class="form-item">
            <text class="form-label">节点类型</text>
            <up-radio-group
              v-model="formMode"
              placement="row"
              size="16"
              activeColor="#1AA86C"
            >
              <up-radio name="assignment" label="指派处理" />
              <up-radio name="custom" label="记录进度" />
            </up-radio-group>
          </view>

          <template v-if="formMode === 'assignment'">
            <view class="form-item">
              <text class="form-label">执行人员</text>
              <view v-if="staffLoading" class="placeholder-text">
                正在加载物业人员...
              </view>
              <view v-else-if="staffError" class="error-text">
                {{ staffError }}
              </view>
              <view v-else-if="!staffOptions.length" class="placeholder-text">
                尚未配置物业人员，请联系管理员
              </view>
              <view v-else class="staff-checkboxes">
                <up-checkbox-group v-model="assignmentForm.assigneeIds" placement="column">
                  <up-checkbox
                    v-for="staff in staffOptions"
                    :key="staff.id"
                    :name="staff.id"
                  >
                    <view class="staff-item">
                      <text class="staff-name">{{ staff.name }}</text>
                      <text class="staff-role">{{ staff.roleLabel }}</text>
                    </view>
                  </up-checkbox>
                </up-checkbox-group>
              </view>
              <view class="form-tip">
                已选择：{{ selectedStaffSummary }}
              </view>
            </view>
            <view class="form-item">
              <text class="form-label">补充说明</text>
              <up-textarea
                v-model="assignmentForm.note"
                placeholder="例如：约定上门时间、备注注意事项等"
                count
                maxlength="300"
                height="120"
              />
            </view>
            <view class="form-tip">
              提示：指派多个成员时，工单负责人默认为列表中的第一位
            </view>
          </template>

          <template v-else>
            <view class="form-item">
              <text class="form-label">标题</text>
              <up-input
                v-model="customForm.title"
                placeholder="例如：现场排查进度"
                maxlength="60"
              />
            </view>
            <view class="form-item">
              <text class="form-label">说明</text>
              <up-textarea
                v-model="customForm.description"
                placeholder="填写处理动作、现场情况或下一步安排"
                count
                maxlength="800"
                height="140"
              />
            </view>
            <view class="form-item">
              <text class="form-label">附件</text>
              <u-upload
                :file-list="fileList"
                :max-count="MAX_ATTACHMENTS"
                :multiple="true"
                accept="file"
                :preview-full-image="true"
                @after-read="handleAfterRead"
                @delete="handleFileDelete"
              />
              <text class="form-tip">支持上传图片或视频，最多 {{ MAX_ATTACHMENTS }} 个附件</text>
            </view>
          </template>
        </scroll-view>
        <view class="modal-footer">
          <up-button
            type="success"
            :text="formMode === 'assignment' ? '指派并记录' : '提交进度'"
            :loading="creatingNode"
            shape="circle"
            @click="submitTimelineNode"
          />
        </view>
      </view>
    </up-popup>
  </view>
</template>

<style scoped>
.manager-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
  padding: 16px;
  border-radius: 16px;
  background: #f0fdf4;
  border: 1px solid rgba(26, 168, 108, 0.15);
}
.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.manager-title {
  font-size: 15px;
  font-weight: 600;
  color: #166534;
}
.manager-desc {
  font-size: 12px;
  color: #65a30d;
}
.manager-status {
  display: flex;
  gap: 8px;
  font-size: 13px;
  color: #0f172a;
}
.status-label {
  color: #475569;
}
.status-value {
  font-weight: 600;
}
.manager-buttons {
  display: flex;
  gap: 12px;
}
.sheet-container {
  display: flex;
  flex-direction: column;
  padding: 16px;
  max-height: 75vh;
}
.sheet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.sheet-title {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
}
.sheet-list {
  flex: 1;
  padding: 4px 0;
}
.sheet-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-radius: 12px;
  background: #f8fafc;
  margin-bottom: 10px;
  transition: background 0.2s;
}
.sheet-item--active {
  background: rgba(26, 168, 108, 0.12);
  border: 1px solid rgba(26, 168, 108, 0.5);
}
.item-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.item-label {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
}
.item-desc {
  font-size: 12px;
  color: #64748b;
}
.sheet-footer {
  margin-top: 12px;
}
.modal-container {
  display: flex;
  flex-direction: column;
  max-height: 80vh;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;
}
.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
}
.modal-body {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.form-label {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}
.form-tip {
  margin-top: 4px;
  font-size: 12px;
  color: #94a3b8;
}
.modal-footer {
  padding: 16px;
  border-top: 1px solid #e2e8f0;
}
.placeholder-text {
  font-size: 13px;
  color: #94a3b8;
}
.error-text {
  font-size: 13px;
  color: #ef4444;
}
.staff-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.staff-item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}
.staff-name {
  font-size: 14px;
  color: #0f172a;
  font-weight: 600;
}
.staff-role {
  font-size: 12px;
  color: #94a3b8;
}
</style>
