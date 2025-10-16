<script setup lang="ts">
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import env from "@/config/env";
import { useUserStore } from "@/store/user";
import { workOrdersApi } from "@/utils/directus";

const userStore = useUserStore();
const { token } = storeToRefs(userStore);

const fileId = ref("");
const includeThumbnail = ref(true);
const limit = ref<string>("10");
const page = ref<string>("1");
const loading = ref(false);
const listLoading = ref(false);
const detailLoading = ref(false);
const errorText = ref<string | null>(null);
const listErrorText = ref<string | null>(null);
const detailErrorText = ref<string | null>(null);
const responseText = ref("");
const listResponseText = ref("");
const detailResponseText = ref("");
const sdkListResponseText = ref("");
const sdkListParsing = ref<string | null>(null);
const restListResponseText = ref("");
const restListParsing = ref<string | null>(null);
const restPreviewItems = ref<Array<{ id: string; fileIds: string[]; files: any[] }>>([]);
const previewUrl = ref<string | null>(null);
const detailId = ref("");
const parsedWorkOrders = ref<
  Array<{
    id: string;
    fileIds: string[];
    rawFiles: any;
  }>
>([]);
const parsedDetailFiles = ref<string[]>([]);

function previewAsset(fileId: string) {
  previewUrl.value = `${env.directusUrl}/assets/${fileId}`;
}

const tokenPreview = computed(() => {
  if (!token.value) return "无 Token";
  const value = token.value;
  if (value.length <= 32) return value;
  return `${value.substring(0, 8)}…${value.substring(value.length - 8)}`;
});

const requestUrl = computed(() => {
  if (!fileId.value) return "";
  const base = `${env.directusUrl}/files/${fileId.value}`;
  return base;
});

const imageSource = computed(() => {
  if (!fileId.value) return "";
  if (!includeThumbnail.value) {
    return `${env.directusUrl}/assets/${fileId.value}`;
  }
  return `${env.directusUrl}/assets/${fileId.value}?width=600&height=600&fit=cover`;
});

const workOrderListUrl = computed(() => {
  const limitValue = Number(limit.value) || 10;
  const pageValue = Number(page.value) || 1;
  const params: string[] = [];
  params.push(`limit=${limitValue}`);
  params.push(`page=${pageValue}`);
  params.push(`sort%5B%5D=${encodeURIComponent("-date_created")}`);
  const fields = [
    "id",
    "title",
    "description",
    "category",
    "priority",
    "status",
    "date_created",
    "submitter_id.id",
    "submitter_id.first_name",
    "submitter_id.last_name",
    "submitter_id.email",
    "submitter_id.avatar",
    "submitter_id.role.name",
    "community_id.id",
    "community_id.name",
    "assignee_id.id",
    "assignee_id.first_name",
    "assignee_id.last_name",
    "assignee_id.email",
    "assignee_id.avatar",
    "assignee_id.role.name",
    "files.directus_files_id.%2A",
    "files.id",
  ];
  fields.forEach((field) => {
    params.push(`fields%5B%5D=${field}`);
  });
  return `${env.directusUrl}/items/work_orders?${params.join("&")}`;
});

const workOrderDetailUrl = computed(() => {
  if (!detailId.value) return "";
  const params = new URLSearchParams();
  const fields = [
    "id",
    "title",
    "description",
    "files.id",
    "files.directus_files_id.*",
    "submitter_id",
    "submitter_id.*",
  ];
  fields.forEach((field) => params.append("fields[]", field));
  return `${env.directusUrl}/items/work_orders/${detailId.value}?${params.toString()}`;
});

async function fetchFile() {
  if (!fileId.value) {
    uni.showToast({ title: "请输入文件ID", icon: "none" });
    return;
  }

  loading.value = true;
  errorText.value = null;
  responseText.value = "";
  previewUrl.value = null;

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token.value) {
      headers.Authorization = `Bearer ${token.value}`;
    }

    const res: UniApp.RequestSuccessCallbackResult = await uni.request({
      url: requestUrl.value,
      method: "GET",
      header: headers,
    });

    responseText.value = JSON.stringify(res.data, null, 2);

    if (res.statusCode >= 200 && res.statusCode < 300) {
      previewUrl.value = imageSource.value;
      uni.showToast({ title: "请求成功", icon: "success" });
    } else {
      throw new Error(
        `状态码 ${res.statusCode}: ${typeof res.data === "string" ? res.data : JSON.stringify(res.data)}`
      );
    }
  } catch (err: any) {
    errorText.value = err?.message || String(err);
    uni.showToast({ title: "请求失败", icon: "none" });
  } finally {
    loading.value = false;
  }
}

async function fetchWorkOrderList() {
  listLoading.value = true;
  listErrorText.value = null;
  listResponseText.value = "";
  parsedWorkOrders.value = [];
  try {
    const headers: Record<string, string> = {};
    if (token.value) {
      headers.Authorization = `Bearer ${token.value}`;
    }
    const res: UniApp.RequestSuccessCallbackResult = await uni.request({
      url: workOrderListUrl.value,
      method: "GET",
      header: headers,
    });
    listResponseText.value = JSON.stringify(res.data, null, 2);
    const dataList = Array.isArray((res.data as any)?.data)
      ? ((res.data as any).data as any[])
      : [];
    parsedWorkOrders.value = dataList.map((item) => {
      const files = Array.isArray(item.files) ? item.files : [];
      const fileIds = files
        .map((f) => {
          const directusFile = (f as any)?.directus_files_id;
          if (!directusFile) return null;
          if (typeof directusFile === "string") return directusFile;
          if (typeof directusFile === "object") return directusFile.id ?? null;
          return null;
        })
        .filter((id): id is string => Boolean(id));

      return {
        id: item.id,
        fileIds,
        rawFiles: files,
      };
    });

    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw new Error(
        `状态码 ${res.statusCode}: ${typeof res.data === "string" ? res.data : JSON.stringify(res.data)}`
      );
    }
    uni.showToast({ title: "列表请求成功", icon: "success" });
  } catch (err: any) {
    listErrorText.value = err?.message || String(err);
    uni.showToast({ title: "列表请求失败", icon: "none" });
  } finally {
    listLoading.value = false;
  }
}

async function fetchWorkOrderDetail() {
  if (!detailId.value) {
    uni.showToast({ title: "请输入工单ID", icon: "none" });
    return;
  }
  detailLoading.value = true;
  detailErrorText.value = null;
  detailResponseText.value = "";
  parsedDetailFiles.value = [];
  try {
    const headers: Record<string, string> = {};
    if (token.value) {
      headers.Authorization = `Bearer ${token.value}`;
    }
    const res: UniApp.RequestSuccessCallbackResult = await uni.request({
      url: workOrderDetailUrl.value,
      method: "GET",
      header: headers,
    });
    detailResponseText.value = JSON.stringify(res.data, null, 2);
    const data = (res.data as any)?.data ?? (res.data as any);
    const files = Array.isArray(data?.files) ? data.files : [];
    parsedDetailFiles.value = files
      .map((f: any) => {
        const directusFile = f?.directus_files_id;
        if (!directusFile) return null;
        if (typeof directusFile === "string") return directusFile;
        if (typeof directusFile === "object") return directusFile.id ?? null;
        return null;
      })
      .filter((id: string | null): id is string => Boolean(id));

    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw new Error(
        `状态码 ${res.statusCode}: ${typeof res.data === "string" ? res.data : JSON.stringify(res.data)}`
      );
    }
    uni.showToast({ title: "工单详情成功", icon: "success" });
  } catch (err: any) {
    detailErrorText.value = err?.message || String(err);
    uni.showToast({ title: "工单详情失败", icon: "none" });
  } finally {
    detailLoading.value = false;
  }
}

async function fetchWorkOrdersViaRest() {
  restListResponseText.value = "";
  restListParsing.value = null;
  restPreviewItems.value = [];
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token.value) {
      headers.Authorization = `Bearer ${token.value}`;
    }
    const res: UniApp.RequestSuccessCallbackResult = await uni.request({
      url: workOrderListUrl.value,
      method: "GET",
      header: headers,
    });
    restListResponseText.value = JSON.stringify(res.data, null, 2);
    const dataList = Array.isArray((res.data as any)?.data)
      ? ((res.data as any).data as any[])
      : [];
    const parsed = dataList.map((item) => {
      const files = Array.isArray(item.files) ? item.files : [];
      const fileIds = files
        .map((file) => {
          const directusFile = file?.directus_files_id;
          if (!directusFile) return null;
          if (typeof directusFile === "string") return directusFile;
          if (typeof directusFile === "object") return directusFile.id ?? null;
          return null;
        })
        .filter((id): id is string => Boolean(id));
      return {
        id: item.id,
        files,
        fileIds,
      };
    });
    restListParsing.value = JSON.stringify(parsed, null, 2);
    restPreviewItems.value = parsed;
    uni.showToast({ title: "REST 请求成功", icon: "success" });
  } catch (err: any) {
    restListResponseText.value = err?.message || String(err);
    uni.showToast({ title: "REST 请求失败", icon: "none" });
  }
}

async function fetchWorkOrdersViaSdk() {
  sdkListResponseText.value = "";
  sdkListParsing.value = null;
  try {
    const limitValue = Number(limit.value) || 10;
    const pageValue = Number(page.value) || 1;
    const fields = [
      "id",
      "title",
      {
        files: [
          "id",
          {
            directus_files_id: ["id", "type", "filename_download", "storage", "filename_disk"]
          }
        ]
      },
      {
        submitter_id: ["id", "first_name", "last_name", "avatar"]
      },
    ];
    const result = await workOrdersApi.readMany({
      limit: limitValue,
      page: pageValue,
      fields: fields as any,
      sort: ["-date_created"],
    });
    sdkListResponseText.value = JSON.stringify(result, null, 2);
    const parsed = Array.isArray(result)
      ? result.map((item: any) => ({
          id: item.id,
          rawFiles: item.files,
        }))
      : [];
    sdkListParsing.value = JSON.stringify(parsed, null, 2);
    uni.showToast({ title: "SDK 请求成功", icon: "success" });
  } catch (err: any) {
    sdkListResponseText.value = String(err?.message ?? err);
    uni.showToast({ title: "SDK 请求失败", icon: "none" });
  }
}

function copyToClipboard(value: string) {
  if (!value) {
    uni.showToast({ title: "内容为空", icon: "none" });
    return;
  }
  uni.setClipboardData({
    data: value,
    success: () => {
      uni.showToast({ title: "已复制", icon: "success" });
    },
  });
}
</script>

<template>
  <view class="page">
    <up-card :border="false" class="section">
      <template #body>
        <text class="section-title">当前 Token</text>
        <view class="row-between">
          <text class="section-value">{{ tokenPreview }}</text>
          <up-button
            size="mini"
            text="复制"
            type="primary"
            @click="copyToClipboard(token || '')"
          />
        </view>
      </template>
    </up-card>

    <up-card :border="false" class="section">
      <template #body>
        <text class="section-title">文件 ID</text>
        <up-input
          v-model="fileId"
          placeholder="输入 Directus 文件 ID"
          clearable
          border="surround"
          class="input"
        />
        <view class="switch-row">
          <up-switch v-model="includeThumbnail" size="20" />
          <text class="switch-text">使用缩略图参数</text>
        </view>
        <up-button
          class="trigger"
          type="primary"
          :loading="loading"
          text="发起请求"
          @click="fetchFile"
        />
      </template>
    </up-card>

    <up-card :border="false" class="section">
      <template #body>
        <text class="section-title">请求 URL</text>
        <view class="row-between">
          <text class="section-value wrap">{{ requestUrl }}</text>
          <up-button
            size="mini"
            text="复制"
            type="primary"
            @click="copyToClipboard(requestUrl)"
          />
        </view>
        <text class="section-title">图片 URL</text>
        <view class="row-between">
          <text class="section-value wrap">{{ imageSource }}</text>
          <up-button
            size="mini"
            text="复制"
            type="primary"
            @click="copyToClipboard(imageSource)"
          />
        </view>
      </template>
    </up-card>

    <up-card v-if="previewUrl" :border="false" class="section">
      <template #body>
        <text class="section-title">图片预览</text>
        <image :src="previewUrl" mode="aspectFit" class="preview-image" />
      </template>
    </up-card>

    <up-card v-if="errorText" :border="false" class="section error">
      <template #body>
        <text class="section-title">错误信息</text>
        <text class="section-value wrap error-text">{{ errorText }}</text>
      </template>
    </up-card>

    <up-card v-if="responseText" :border="false" class="section">
      <template #body>
        <text class="section-title">响应内容</text>
        <up-button
          size="mini"
          text="复制响应"
          type="primary"
          class="copy-button"
          @click="copyToClipboard(responseText)"
        />
        <scroll-view scroll-y class="response-box">
          <text>{{ responseText }}</text>
        </scroll-view>
      </template>
    </up-card>

    <up-card :border="false" class="section">
      <template #body>
        <text class="section-title">工单列表调试</text>
        <view class="row">
          <up-input
            v-model="limit"
            type="number"
            placeholder="limit"
            border="surround"
            class="input-half"
          />
          <up-input
            v-model="page"
            type="number"
            placeholder="page"
            border="surround"
            class="input-half"
          />
        </view>
        <view class="row-between">
          <text class="section-value wrap">{{ workOrderListUrl }}</text>
          <up-button
            size="mini"
            text="复制"
            type="primary"
            @click="copyToClipboard(workOrderListUrl)"
          />
        </view>
        <up-button
          class="trigger"
          type="primary"
          :loading="listLoading"
          text="请求工单列表"
          @click="fetchWorkOrderList"
        />
        <view v-if="listErrorText" class="section error">
          <text class="section-title">列表错误</text>
          <text class="section-value wrap error-text">{{ listErrorText }}</text>
        </view>
        <view v-if="listResponseText" class="response-wrapper">
          <up-button
            size="mini"
            text="复制JSON"
            type="primary"
            class="copy-button"
            @click="copyToClipboard(listResponseText)"
          />
        </view>
        <scroll-view v-if="listResponseText" scroll-y class="response-box">
          <text>{{ listResponseText }}</text>
        </scroll-view>
        <view
          v-if="parsedWorkOrders.length"
          class="parsed-list"
        >
          <text class="section-subtitle">解析结果</text>
          <view
            v-for="item in parsedWorkOrders"
            :key="item.id"
            class="parsed-item"
          >
            <view class="row-between">
              <text class="parsed-id">工单ID: {{ item.id }}</text>
              <up-button
                size="mini"
                text="复制"
                type="primary"
                @click="copyToClipboard(item.id)"
              />
            </view>
            <view v-if="item.fileIds.length" class="file-id-list">
              <text class="section-subtitle-small">文件ID列表</text>
              <view
                v-for="fid in item.fileIds"
                :key="fid"
                class="file-id-row"
              >
                <text class="section-value wrap">{{ fid }}</text>
                <up-button
                  size="mini"
                  text="复制"
                  type="primary"
                  @click="copyToClipboard(fid)"
                />
              </view>
            </view>
            <view v-else class="no-files">
              <text class="section-value">未解析到文件ID</text>
            </view>
          </view>
        </view>
      </template>
    </up-card>

    <up-card :border="false" class="section">
      <template #body>
        <text class="section-title">SDK 工单列表调试</text>
        <up-button
          class="trigger"
          type="primary"
          text="通过 SDK 请求工单"
          @click="fetchWorkOrdersViaSdk"
        />
        <view v-if="sdkListResponseText" class="response-wrapper">
          <up-button
            size="mini"
            text="复制JSON"
            type="primary"
            class="copy-button"
            @click="copyToClipboard(sdkListResponseText)"
          />
        </view>
        <scroll-view v-if="sdkListResponseText" scroll-y class="response-box">
          <text>{{ sdkListResponseText }}</text>
        </scroll-view>
        <view v-if="sdkListParsing" class="section">
          <text class="section-subtitle">解析文件字段</text>
          <scroll-view scroll-y class="response-box">
            <text>{{ sdkListParsing }}</text>
          </scroll-view>
        </view>
      </template>
    </up-card>

    <up-card :border="false" class="section">
      <template #body>
        <text class="section-title">REST 工单列表调试（与 store 同步）</text>
        <up-button
          class="trigger"
          type="primary"
          text="REST 请求工单"
          @click="fetchWorkOrdersViaRest"
        />
        <view v-if="restListResponseText" class="response-wrapper">
          <up-button
            size="mini"
            text="复制JSON"
            type="primary"
            class="copy-button"
            @click="copyToClipboard(restListResponseText)
            "
          />
        </view>
        <scroll-view
          v-if="restListResponseText"
          scroll-y
          class="response-box"
        >
          <text>{{ restListResponseText }}</text>
        </scroll-view>
        <view v-if="restPreviewItems.length" class="parsed-files">
          <text class="section-subtitle">解析结果（带文件 ID）</text>
          <view
            v-for="item in restPreviewItems"
            :key="item.id"
            class="parsed-item"
          >
            <view class="row-between">
              <text class="parsed-id">工单ID: {{ item.id }}</text>
              <up-button
                size="mini"
                text="复制"
                type="primary"
                @click="copyToClipboard(item.id)"
              />
            </view>
            <view v-if="item.fileIds.length" class="file-id-list">
              <text class="section-subtitle-small">文件ID列表</text>
              <view
                v-for="fid in item.fileIds"
                :key="fid"
                class="file-id-row"
              >
                <text class="section-value wrap">{{ fid }}</text>
                <up-button
                  size="mini"
                  text="复制"
                  type="primary"
                  @click="copyToClipboard(fid)"
                />
                <up-button
                  size="mini"
                  text="预览"
                  type="primary"
                  @click="previewAsset(fid)"
                />
              </view>
            </view>
            <view v-else class="no-files">
              <text class="section-value">未解析到文件ID</text>
            </view>
          </view>
        </view>
      </template>
    </up-card>

    <up-card :border="false" class="section">
      <template #body>
        <text class="section-title">工单详情调试</text>
        <up-input
          v-model="detailId"
          placeholder="输入工单ID"
          clearable
          border="surround"
        />
        <view class="row-between">
          <text class="section-value wrap">{{ workOrderDetailUrl }}</text>
          <up-button
            size="mini"
            text="复制"
            type="primary"
            @click="copyToClipboard(workOrderDetailUrl)"
          />
        </view>
        <up-button
          class="trigger"
          type="primary"
          :loading="detailLoading"
          text="请求工单详情"
          @click="fetchWorkOrderDetail"
        />
        <view v-if="detailErrorText" class="section error">
          <text class="section-title">详情错误</text>
          <text class="section-value wrap error-text">{{ detailErrorText }}</text>
        </view>
        <view v-if="detailResponseText" class="response-wrapper">
          <up-button
            size="mini"
            text="复制JSON"
            type="primary"
            class="copy-button"
            @click="copyToClipboard(detailResponseText)"
          />
        </view>
        <scroll-view v-if="detailResponseText" scroll-y class="response-box">
          <text>{{ detailResponseText }}</text>
        </scroll-view>
        <view v-if="parsedDetailFiles.length" class="parsed-files">
          <text class="section-subtitle">解析到的文件ID</text>
          <view
            v-for="fid in parsedDetailFiles"
            :key="fid"
            class="file-id-row"
          >
            <text class="section-value wrap">{{ fid }}</text>
            <up-button
              size="mini"
              text="复制"
              type="primary"
              @click="copyToClipboard(fid)"
            />
          </view>
        </view>
        <view v-else-if="detailResponseText" class="no-files">
          <text class="section-value">未解析到文件ID</text>
        </view>
      </template>
    </up-card>
  </view>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  padding: 24rpx;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  background: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(15, 23, 42, 0.04);
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #1f2937;
}

.section-value {
  font-size: 26rpx;
  color: #4b5563;
}

.wrap {
  word-break: break-all;
}

.input {
  width: 100%;
  padding: 24rpx;
  border-radius: 12rpx;
  background: #f5f7fb;
  font-size: 28rpx;
  color: #1f2937;
}

.switch-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 16rpx;
}

.switch-text {
  font-size: 26rpx;
  color: #4b5563;
}

.trigger {
  margin-top: 12rpx;
}

.preview {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  background: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(15, 23, 42, 0.04);
}

.preview-image {
  width: 100%;
  max-height: 480rpx;
  border-radius: 12rpx;
  background: #e5e7eb;
}

.response-box {
  max-height: 400rpx;
  padding: 16rpx;
  border-radius: 12rpx;
  background: #f5f7fb;
  font-family: monospace;
  font-size: 24rpx;
  color: #374151;
}

.response-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12rpx;
}

.error {
  border: 1px solid #f97316;
}

.error-text {
  color: #b91c1c;
}

.row-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12rpx;
}

.row {
  display: flex;
  gap: 12rpx;
}

.input-half {
  flex: 1;
}

.section-subtitle {
  margin-top: 16rpx;
  font-size: 26rpx;
  font-weight: 600;
  color: #1f2937;
}

.section-subtitle-small {
  margin-top: 12rpx;
  font-size: 24rpx;
  font-weight: 500;
  color: #1f2937;
}

.parsed-item {
  margin-top: 16rpx;
  padding: 16rpx;
  border-radius: 12rpx;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.parsed-id {
  font-size: 26rpx;
  font-weight: 600;
  color: #1f2937;
}

.file-id-list {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.file-id-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12rpx;
  padding: 12rpx;
  border-radius: 12rpx;
  background: #ffffff;
  box-shadow: 0 4rpx 12rpx rgba(15, 23, 42, 0.04);
}

.no-files {
  padding: 12rpx;
  border-radius: 12rpx;
  background: #fef3c7;
  color: #b45309;
}

.parsed-files {
  margin-top: 16rpx;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}
</style>
