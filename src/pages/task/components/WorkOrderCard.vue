<script setup lang="ts">
import { computed } from "vue";
import type { WorkOrderListItem } from "@/store/workOrders";
import workOrderDisplay from "@/utils/workOrderDisplay";
import { getFileUrl, getThumbnailUrl, isImageFile } from "@/utils/fileUtils";
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

const status = computed(() =>
  workOrderDisplay.getStatusDisplay(workOrder.value.status)
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

const attachmentCount = computed(() =>
  workOrderDisplay.getAttachmentCount(workOrder.value.files)
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

// 获取图片附件的缩略图URL（列表页使用缩略图提升性能）
const imageUrls = computed(() => {
  if (!workOrder.value.files || !Array.isArray(workOrder.value.files)) {
    return [];
  }

  const urls: string[] = [];

  // 遍历所有附件
  for (const fileRelation of workOrder.value.files) {
    // 检查是否为有效的文件关系对象
    if (fileRelation && typeof fileRelation === 'object' && 'directus_files_id' in fileRelation) {
      const file = fileRelation.directus_files_id;

      // 检查文件是否为图片
      if (file && typeof file === 'object' && 'id' in file) {
        const directusFile = file as DirectusFile;
        if (isImageFile(directusFile)) {
          // 使用缩略图（100x100）而不是原图，提升列表页加载速度
          const thumbnailUrl = getThumbnailUrl(directusFile, 100, 100);
          if (thumbnailUrl) {
            urls.push(thumbnailUrl);
          }
        }
      }
    }
  }

  // 限制最多显示4个图片
  return urls.slice(0, 4);
});

const handleClick = () => {
  emit("select", workOrder.value);
};
</script>

<template>
  <up-card
    :border="false"
    :padding="24"
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
            custom-style="margin-right: 8px;"
          />
          <up-tag
            v-if="category"
            shape="circle"
            size="mini"
            :text="category.label"
            :type="category.type || 'primary'"
            plain
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
          custom-style="margin-top: 8px;"
        />

        <!-- 图片显示区域 -->
        <view v-if="imageUrls.length > 0" class="images-container">
          <view class="images-grid">
            <up-image
              v-for="(imageUrl, index) in imageUrls"
              :key="index"
              :src="imageUrl"
              width="100px"
              height="100px"
              mode="aspectFill"
              radius="8"
            />
          </view>
        </view>

        <view class="meta-row">
          <up-tag
            v-if="status"
            :text="status.label"
            :type="status.type || 'info'"
            size="mini"
            effect="dark"
          />
          <up-tag
            v-if="priority"
            :text="priority.label"
            :type="priority.type || 'info'"
            size="mini"
            plain
          />
          <view v-if="communityName" class="meta-location">
            <up-icon name="map" size="18" color="#64748B" />
            <up-text :text="communityName" size="12" type="info" />
          </view>
        </view>
      </view>
    </template>

    <template v-if="attachmentCount > 0" #foot>
      <view class="card-foot">
        <up-icon name="attach" size="18" color="#64748B" />
        <up-text :text="`${attachmentCount} 个附件`" size="12" type="info" />
      </view>
    </template>
  </up-card>
</template>

<style scoped>
.work-order-card {
  width: 100%;
  margin-bottom: 16px;
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
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
  gap: 12px;
}

.images-container {
  margin-top: 8px;
}

.images-grid {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.meta-location {
  display: flex;
  align-items: center;
  gap: 4px;
}

.card-foot {
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>