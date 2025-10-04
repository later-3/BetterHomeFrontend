<script setup lang="ts">
import { computed } from "vue";
import type { WorkOrderListItem } from "@/store/workOrders";
import workOrderDisplay from "@/utils/workOrderDisplay";
import { getFileUrl, getThumbnailUrl, isImageFile, isVideoFile } from "@/utils/fileUtils";
import type { DirectusFile } from "@/@types/directus-schema";
import env from "@/config/env";

const props = defineProps<{
  workOrder: WorkOrderListItem;
}>();

const emit = defineEmits<{
  (e: "select", workOrder: WorkOrderListItem): void;
}>();

const workOrder = computed(() => props.workOrder);

// 显示创建人（submitter）而不是负责人（assignee）
const submitter = computed(() =>
  workOrderDisplay.getAssigneeDisplay(workOrder.value.submitter_id)
);

const category = computed(() =>
  workOrderDisplay.getCategoryDisplay(workOrder.value.category)
);

const priority = computed(() =>
  workOrderDisplay.getPriorityDisplay(workOrder.value.priority)
);

const createdAt = computed(() =>
  workOrderDisplay.formatRelativeTime(workOrder.value.date_created)
);

const description = computed(() =>
  workOrderDisplay.formatDescription(workOrder.value.description)
);

const communityName = computed(() =>
  workOrderDisplay.getCommunityName(workOrder.value.community_id)
);

const status = computed(() =>
  workOrderDisplay.getStatusDisplay(workOrder.value.status)
);

const assignee = computed(() =>
  workOrderDisplay.getAssigneeDisplay(workOrder.value.assignee_id)
);

// 获取创建人头像URL
const avatarUrl = computed(() => {
  // 直接从 workOrder 获取 submitter_id.avatar，跳过中间层
  const submitterId = workOrder.value.submitter_id;
  if (!submitterId || typeof submitterId === 'string') return null;

  const avatar = (submitterId as any).avatar;
  if (!avatar) return null;

  // 使用与 profile.vue 相同的方式构建 URL
  const fileId = typeof avatar === "string" ? avatar : avatar.id;
  return `${env.directusUrl}/assets/${fileId}`;
});

// 媒体项类型定义
interface MediaItem {
  type: 'image' | 'video';
  url?: string;
  label?: string;
}

// 获取媒体附件（图片缩略图 + 视频图标）
const mediaItems = computed(() => {
  if (!workOrder.value.files || !Array.isArray(workOrder.value.files)) {
    return [];
  }

  const items: MediaItem[] = [];

  // 遍历所有附件
  for (const fileRelation of workOrder.value.files) {
    // 检查是否为有效的文件关系对象
    if (fileRelation && typeof fileRelation === 'object' && 'directus_files_id' in fileRelation) {
      const file = fileRelation.directus_files_id;

      // 检查文件类型
      if (file && typeof file === 'object' && 'id' in file) {
        const directusFile = file as DirectusFile;

        if (isImageFile(directusFile)) {
          // 图片：使用缩略图（100x100）提升列表页加载速度
          const thumbnailUrl = getThumbnailUrl(directusFile, 100, 100);
          if (thumbnailUrl) {
            items.push({ type: 'image', url: thumbnailUrl });
          }
        } else if (isVideoFile(directusFile)) {
          // 视频：显示播放图标
          items.push({ type: 'video', label: '视频' });
        }
      }
    }
  }

  // 限制最多显示4个媒体项
  return items.slice(0, 4);
});

const handleClick = () => {
  emit("select", workOrder.value);
};
</script>

<template>
  <up-card
    :border="false"
    :padding="16"
    class="work-order-card"
    @click="handleClick"
  >
    <template #head>
      <view class="card-head">
        <view class="submitter">
          <up-avatar
            size="40"
            :src="avatarUrl || undefined"
            :text="avatarUrl ? '' : submitter.initials"
            shape="circle"
          />
          <view class="submitter-info">
            <up-text :text="submitter.name" bold size="15" />
            <up-text
              v-if="submitter.role"
              :text="submitter.role"
              size="12"
              type="info"
            />
          </view>
        </view>
        <view class="head-meta">
          <up-text
            v-if="createdAt"
            :text="createdAt"
            size="12"
            type="info"
          />
        </view>
      </view>
    </template>

    <template #body>
      <view class="card-body">
        <up-text :text="workOrder.title" bold size="17" />
        <up-text
          v-if="description"
          :text="description"
          size="14"
          type="info"
        />

        <!-- 媒体显示区域（图片 + 视频） -->
        <view v-if="mediaItems.length > 0" class="media-container">
          <view class="media-grid">
            <template v-for="(item, index) in mediaItems" :key="index">
              <!-- 图片缩略图 -->
              <up-image
                v-if="item.type === 'image'"
                :src="item.url"
                width="100px"
                height="100px"
                mode="aspectFill"
                radius="8"
              />
              <!-- 视频播放图标 -->
              <view
                v-else-if="item.type === 'video'"
                class="video-placeholder"
              >
                <view class="video-icon-wrapper">
                  <up-icon name="play-circle-fill" size="48" color="#FFFFFF" />
                </view>
              </view>
            </template>
          </view>
        </view>

        <!-- 状态行：类别、优先级、负责人、社区 -->
        <view class="status-row">
          <up-tag
            v-if="category"
            :text="category.label"
            :type="category.type || 'primary'"
            size="mini"
            plain
          />
          <up-tag
            v-if="priority"
            :text="priority.label"
            :type="priority.type || 'info'"
            size="mini"
            plain
          />
          <view v-if="assignee" class="status-item">
            <up-icon name="account" size="16" color="#64748B" />
            <up-text :text="assignee.name" size="12" type="info" />
          </view>
          <view v-if="communityName" class="status-item">
            <up-icon name="map" size="16" color="#64748B" />
            <up-text :text="communityName" size="12" type="info" />
          </view>
        </view>
      </view>
    </template>
  </up-card>
</template>

<style scoped>
.work-order-card {
  width: 100%;
  margin: 0 !important; /* 覆盖 uview-plus 默认 margin: 15px */
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  /* 确保与 body 左对齐 */
  padding: 0 !important;
  margin: 0 !important;
}

.submitter {
  display: flex;
  align-items: center;
  gap: 12px;
}

.submitter-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.head-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  /* 确保与 head 左对齐 */
  padding: 0 !important;
  margin: 0 !important;
}

.media-container {
  /* margin removed - controlled by card-body gap */
}

.media-grid {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.video-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%);
  border-radius: 8px;
  position: relative;
  overflow: hidden;
}

.video-placeholder::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.2) 0%, transparent 60%);
  pointer-events: none;
}

.video-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.status-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding-top: 4px;
  border-top: 1px solid #f1f5f9;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>