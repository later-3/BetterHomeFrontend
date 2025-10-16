<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import dayjs from "dayjs";

import type { WorkOrder, WorkOrdersDirectusFile } from "@/@types/directus-schema";
import { useWorkOrderStore } from "@/store/workOrders";
import workOrderDisplay from "@/utils/workOrderDisplay";
import {
  getFileUrl,
  getThumbnailUrl,
  isImageFile,
  isVideoFile,
} from "@/utils/fileUtils";
import env from "@/config/env";
import WorkOrderInfoTags, { type WorkOrderTagItem } from "./components/WorkOrderInfoTags.vue";

const detailPriorityVariantMap = {
  urgent: "urgent",
  high: "high",
  medium: "medium",
  low: "low",
} as const;

const detailStatusVariantMap: Record<NonNullable<WorkOrder["status"]>, WorkOrderTagItem["variant"]> = {
  submitted: "warning",
  accepted: "primary",
  in_progress: "primary",
  resolved: "medium",
  closed: "default",
};

const workOrderStore = useWorkOrderStore();

const workOrderId = ref<string>("");
const detail = ref<WorkOrder | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

const loadDetail = async (id: string) => {
  if (!id) {
    error.value = "工单编号缺失";
    loading.value = false;
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const data = await workOrderStore.fetchWorkOrderDetail(id);
    detail.value = data;
  } catch (err) {
    console.error("加载工单详情失败", err);
    error.value = (err as Error)?.message ?? "加载失败，请稍后重试";
  } finally {
    loading.value = false;
  }
};

type DisplayToken = ReturnType<typeof workOrderDisplay.getCategoryDisplay>;

const resolveFileRelations = (
  files: WorkOrder["files"] | null | undefined,
): WorkOrdersDirectusFile[] => {
  if (!Array.isArray(files)) return [];

  return files.filter((item): item is WorkOrdersDirectusFile => {
    return Boolean(item && typeof item === "object" && "directus_files_id" in item);
  });
};

const submitterDisplay = computed(() => {
  if (!detail.value) return null;
  return workOrderDisplay.getAssigneeDisplay(detail.value.submitter_id);
});

const assigneeDisplay = computed(() => {
  if (!detail.value) return null;
  return workOrderDisplay.getAssigneeDisplay(detail.value.assignee_id);
});

const submitterAvatarUrl = computed(() => {
  const avatarId = submitterDisplay.value?.avatarId;
  if (!avatarId) return null;
  return `${env.directusUrl}/assets/${avatarId}`;
});

const submitterRoleLabel = computed(() => submitterDisplay.value?.role ?? "身份信息");

const categoryToken = computed<DisplayToken>(() => {
  if (!detail.value) return null;
  return workOrderDisplay.getCategoryDisplay(detail.value.category);
});

const priorityToken = computed<DisplayToken>(() => {
  if (!detail.value) return null;
  return workOrderDisplay.getPriorityDisplay(detail.value.priority);
});

const statusToken = computed<DisplayToken>(() => {
  if (!detail.value) return null;
  return workOrderDisplay.getStatusDisplay(detail.value.status);
});

const priorityIconName = computed(() => {
  const priority = detail.value?.priority;
  switch (priority) {
    case "urgent":
      return "warning-fill";
    case "high":
      return "warning";
    case "medium":
      return "star-fill";
    case "low":
      return "arrow-down";
    default:
      return "info-circle";
  }
});

const createdAtDisplay = computed(() => {
  if (!detail.value?.date_created) return "";
  const absolute = dayjs(detail.value.date_created).format("YYYY-MM-DD HH:mm");
  const relative = workOrderDisplay.formatRelativeTime(detail.value.date_created);
  return relative ? `${absolute} · ${relative}` : absolute;
});

const deadlineDisplay = computed(() => {
  if (!detail.value?.deadline) return "";
  return dayjs(detail.value.deadline).format("YYYY-MM-DD HH:mm");
});

const communityName = computed(() => {
  if (!detail.value) return "";
  return workOrderDisplay.getCommunityName(detail.value.community_id);
});

const detailInfoTags = computed<WorkOrderTagItem[]>(() => {
  const tags: WorkOrderTagItem[] = [];

  if (categoryToken.value) {
    tags.push({ text: categoryToken.value.label, icon: "grid", variant: "primary" });
  }

  if (priorityToken.value) {
    const rawPriority = detail.value?.priority;
    const variant = rawPriority ? detailPriorityVariantMap[rawPriority] ?? "warning" : "warning";
    tags.push({
      text: priorityToken.value.label,
      icon: priorityIconName.value,
      variant: variant as WorkOrderTagItem["variant"],
    });
  }

  if (detail.value?.status) {
    const rawStatus = detail.value.status;
    const variant = detailStatusVariantMap[rawStatus] ?? "primary";
    tags.push({
      text: rawStatus,
      variant: variant as WorkOrderTagItem["variant"],
    });
  }

  if (communityName.value) {
    tags.push({ text: communityName.value, icon: "map" });
  }

  if (deadlineDisplay.value) {
    tags.push({ text: `截止：${deadlineDisplay.value}`, icon: "calendar" });
  }

  if (assigneeDisplay.value?.name) {
    tags.push({ text: assigneeDisplay.value.name, icon: "account" });
  }

  return tags;
});

const imageUrls = computed(() => {
  const relations = resolveFileRelations(detail.value?.files ?? null);
  const urls: string[] = [];

  for (const relation of relations) {
    const file = relation.directus_files_id;
    if (!file || typeof file !== "object" || !isImageFile(file)) continue;

    const url = getThumbnailUrl(file, 500, 500) ?? getFileUrl(file);
    if (url) {
      console.log("[work-order-detail] image media", {
        workOrderId: detail.value?.id,
        fileId: file.id,
        type: file.type,
        thumbnailUrl: getThumbnailUrl(file, 500, 500),
        originalUrl: getFileUrl(file),
      });
      urls.push(url);
    }
  }
  return urls;
});

interface VideoResource {
  id: string;
  url: string;
  duration?: number | null;
  title?: string | null;
}

const videoResources = computed<VideoResource[]>(() => {
  const relations = resolveFileRelations(detail.value?.files ?? null);
  const videos: VideoResource[] = [];
  for (const relation of relations) {
    const file = relation.directus_files_id;
    if (!file || typeof file !== "object" || !isVideoFile(file)) continue;

    const url = getFileUrl(file);
    if (!url) continue;

    console.log("[work-order-detail] video media", {
      workOrderId: detail.value?.id,
      fileId: file.id,
      type: file.type,
      thumbnailUrl: null,
      originalUrl: url,
    });

    videos.push({
      id: file.id,
      url,
      duration: file.duration ?? null,
      title: file.filename_download ?? file.title ?? null,
    });
  }
  return videos;
});

const handleRetry = () => {
  if (workOrderId.value) {
    void loadDetail(workOrderId.value);
  }
};

const handleImagePreview = (currentIndex: number) => {
  if (!imageUrls.value.length) return;
  uni.previewImage({
    current: imageUrls.value[currentIndex],
    urls: imageUrls.value,
  });
};

onLoad((options) => {
  const id = typeof options?.id === "string" ? options.id : "";
  workOrderId.value = id;
  void loadDetail(id);
});
</script>

<template>
  <view class="detail-page">
    <view v-if="loading" class="loading-state">
      <u-loading-page :loading="true" loading-text="加载中..." />
    </view>

    <view v-else-if="error" class="error-state">
      <up-empty mode="error" :text="error" text-size="14" />
      <up-button class="retry-btn" type="primary" size="small" text="重试" @click="handleRetry" />
    </view>

    <scroll-view
      v-else
      class="detail-scroll"
      scroll-y
      :show-scrollbar="false"
    >
      <view class="card overview-card">
        <view class="overview-header">
          <view class="overview-avatar">
            <up-avatar
              size="48"
              shape="circle"
              :src="submitterAvatarUrl || undefined"
              :text="submitterAvatarUrl ? '' : submitterDisplay?.initials"
            />
            <view class="overview-meta">
              <up-text
                :text="submitterDisplay?.name || '访客用户'"
                size="15"
                bold
              />
              <!-- 角色标签已通过身份 chip 显示，此处不再重复 -->
              <up-text
                v-if="createdAtDisplay"
                :text="createdAtDisplay"
                size="12"
                type="info"
              />
            </view>
          </view>
          <up-tag
            size="mini"
            type="info"
            plain
            class="identity-tag"
            :text="submitterRoleLabel"
          />
        </view>

        <view class="overview-body">
          <up-text
            class="overview-title"
            :text="detail?.title || '未命名事项'"
            size="17"
            bold
          />
          <up-text
            v-if="detail?.description"
            class="overview-description"
            :text="detail.description"
            size="14"
            type="info"
          />

          <WorkOrderInfoTags :items="detailInfoTags" />
        </view>
      </view>

      <view v-if="imageUrls.length" class="media-stream">
        <view class="media-list">
          <view
            v-for="(url, index) in imageUrls"
            :key="`${url}-${index}`"
            class="media-card"
            @click="handleImagePreview(index)"
          >
            <up-image
              class="media-image"
              :src="url"
              width="100%"
              height="auto"
              mode="widthFix"
              radius="12"
              :show-loading="true"
              :show-error="true"
            />
          </view>
        </view>
      </view>

      <view v-if="videoResources.length" class="media-stream">
        <view class="media-list">
          <view
            v-for="video in videoResources"
            :key="video.id"
            class="media-card"
          >
            <view class="video-wrapper">
              <video
                class="video-player"
                :src="video.url"
                controls
                :show-fullscreen-btn="true"
                show-mute-btn
                :enable-progress-gesture="true"
              />
              <view class="video-badge" v-if="video.duration">
                <up-icon name="play-circle-fill" size="16" color="#FFFFFF" />
                <text>{{ Math.round(video.duration) }}s</text>
              </view>
            </view>
            <up-text
              v-if="video.title"
              class="video-caption"
              :text="video.title"
              size="13"
            />
          </view>
        </view>
      </view>

      <view class="card placeholder-card">
        <view class="placeholder-header">
          <text class="section-title">处理进度</text>
          <up-tag size="mini" type="warning" text="开发中" plain />
        </view>
        <view class="placeholder-body">
          <text class="placeholder-text">时间轴功能即将上线</text>
          <view class="placeholder-divider" />
        </view>
      </view>

      <view class="card placeholder-card">
        <view class="placeholder-header">
          <text class="section-title">留言沟通</text>
          <up-tag size="mini" type="info" text="待开放" plain />
        </view>
        <view class="placeholder-body">
          <text class="placeholder-text">评论功能筹备中</text>
          <view class="placeholder-divider" />
        </view>
      </view>

      <view class="scroll-spacer" />
    </scroll-view>

    <view class="action-bar">
      <view class="action-buttons">
        <up-button
          class="action-button"
          type="primary"
          text="联系物业"
        />
        <up-button
          class="action-button"
          type="success"
          plain
          text="再次报修"
        />
      </view>
    </view>
  </view>
</template>

<style scoped>
.detail-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f4f5f7;
}
.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex: 1;
  padding: 32px;
  gap: 16px;
}
.retry-btn {
  width: 96px;
}
.detail-scroll {
  flex: 1;
  box-sizing: border-box;
  padding: 16px 16px 120px;
}
.card {
  padding: 16px;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.06);
}
.overview-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}
.overview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.overview-avatar {
  display: flex;
  align-items: center;
  gap: 12px;
}
.overview-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.identity-tag {
  align-self: flex-start;
}
.overview-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.overview-title {
  color: #0f172a;
}
.overview-description {
  line-height: 1.6;
  color: #475569;
}
.media-stream {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}
.media-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.media-card {
  overflow: hidden;
  border-radius: 16px;
  background: #000;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
}
.media-image {
  display: block;
  width: 100%;
}
.video-wrapper {
  position: relative;
  background: #000;
}
.video-player {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000;
}
.video-badge {
  display: flex;
  position: absolute;
  right: 12px;
  bottom: 12px;
  align-items: center;
  padding: 8px 12px;
  border-radius: 20px;
  background: rgba(15, 23, 42, 0.75);
  font-size: 12px;
  color: #fff;
  gap: 6px;
}
.video-caption {
  padding: 12px 0 0;
  color: #0f172a;
}
.placeholder-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}
.placeholder-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.placeholder-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px 0;
}
.placeholder-text {
  font-size: 14px;
  color: #64748b;
}
.placeholder-divider {
  border-radius: 999px;
  width: 64px;
  height: 4px;
  background: #e2e8f0;
}
.action-bar {
  position: sticky;
  bottom: 0;
  padding: 12px 16px calc(env(safe-area-inset-bottom, 16px) + 12px);
  background: rgba(244, 245, 247, 0.98);
  box-shadow: 0 -4px 16px rgba(15, 23, 42, 0.08);
}
.action-buttons {
  display: flex;
  gap: 12px;
}
.action-button {
  flex: 1;
}
.scroll-spacer {
  height: 32px;
}
</style>
