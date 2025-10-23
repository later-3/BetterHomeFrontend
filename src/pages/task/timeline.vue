<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import dayjs from "dayjs";

import env from "@/config/env";
import { useUserStore } from "@/store/user";
import { useWorkOrderStore } from "@/store/workOrders";
import type { WorkOrder } from "@/@types/directus-schema";
import workOrderDisplay from "@/utils/workOrderDisplay";
import ManagerActions from "./components/ManagerActions.vue";

interface TimelineActor {
  name: string;
  email?: string | null;
}

interface TimelineAttachment {
  id: string;
  title?: string | null;
  type?: string | null;
}

interface TimelineNode {
  id: string;
  nodeType: string;
  displayTitle: string;
  tagType: "primary" | "success" | "warning" | "info";
  createdAt: string;
  timeDisplay: string;
  relativeTime: string;
  body: string;
  actor: TimelineActor | null;
  attachments: TimelineAttachment[];
}

const NODE_TYPE_DISPLAY: Record<
  string,
  { title: string; tag: TimelineNode["tagType"] }
> = {
  submitted: { title: "业主提交工单", tag: "warning" },
  accepted: { title: "物业已受理", tag: "primary" },
  in_progress: { title: "处理中", tag: "primary" },
  resolved: { title: "已解决", tag: "success" },
  updated_by_submitter: { title: "业主补充信息", tag: "info" },
  updated_by_assignee: { title: "物业进度更新", tag: "primary" },
};

const userStore = useUserStore();
const workOrderStore = useWorkOrderStore();

const loading = ref(true);
const error = ref<string | null>(null);
const workOrderId = ref<string>("");
const nodes = ref<TimelineNode[]>([]);
const workOrderDetail = ref<WorkOrder | null>(null);

const hasNodes = computed(() => nodes.value.length > 0);
const currentIndex = computed(() =>
  nodes.value.length > 0 ? nodes.value.length - 1 : 0
);
const latestNode = computed(() =>
  nodes.value.length > 0 ? nodes.value[nodes.value.length - 1] : null
);

const isPropertyManager = computed(() => {
  const type = userStore.profile?.user_type;
  if (!type) return false;
  return ["property_manager", "property_worker", "property_woker", "admin"].includes(type);
});

const statusToken = computed(() => {
  const status = workOrderDetail.value?.status;
  const token = workOrderDisplay.getStatusDisplay(status);
  return {
    label: token?.label ?? "暂无进度",
    tag: (token?.type ?? "info") as "primary" | "success" | "warning" | "error" | "info" | "default",
  };
});

const formatTime = (value: string) =>
  dayjs(value).format("YYYY-MM-DD HH:mm");

const resolveNodeDisplay = (nodeType: string) =>
  NODE_TYPE_DISPLAY[nodeType] ?? {
    title: "进度更新",
    tag: "info" as TimelineNode["tagType"],
  };

const resolveActor = (raw: any): TimelineActor | null => {
  if (!raw || typeof raw !== "object") return null;
  const firstName = typeof raw.first_name === "string" ? raw.first_name : "";
  const lastName = typeof raw.last_name === "string" ? raw.last_name : "";
  const fullName = `${firstName}${lastName}`.trim();
  const email = typeof raw.email === "string" ? raw.email : null;

  if (!fullName && !email) return null;
  return {
    name: fullName || email || "未知用户",
    email,
  };
};

const mapAttachments = (list: any): TimelineAttachment[] => {
  if (!Array.isArray(list)) return [];
  const attachments: TimelineAttachment[] = [];

  for (const item of list) {
    if (
      item &&
      typeof item === "object" &&
      item.directus_files_id &&
      typeof item.directus_files_id === "object"
    ) {
      const file = item.directus_files_id as Record<string, any>;
      if (file.id) {
        attachments.push({
          id: String(file.id),
          title: typeof file.title === "string" ? file.title : null,
          type: typeof file.type === "string" ? file.type : null,
        });
      }
    }
  }

  return attachments;
};

const parseNodeDescription = (
  raw: string | null | undefined,
  fallbackTitle: string
): { title: string; body: string } => {
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  if (!trimmed) {
    return { title: fallbackTitle, body: "" };
  }

  const lines = trimmed.split(/\r?\n/);
  const firstLine = lines[0]?.trim() ?? "";
  const rest = lines.slice(1).join("\n").trim();

  if (firstLine.startsWith("指派给：")) {
    return { title: "指派处理", body: trimmed };
  }

  if (firstLine.startsWith("标题：")) {
    const customTitle = firstLine.replace(/^标题：/, "").trim() || fallbackTitle;
    return {
      title: customTitle,
      body: rest,
    };
  }

  return {
    title: fallbackTitle,
    body: trimmed,
  };
};

const fetchTimelineNodes = async (id: string) => {
  loading.value = true;
  error.value = null;

  try {
    await userStore.ensureActiveSession({ refreshIfNearExpiry: true });
  } catch (err) {
    error.value = (err as Error)?.message ?? "用户未登录";
    loading.value = false;
    return;
  }

  const token = userStore.token;
  if (!token) {
    error.value = "缺少认证信息";
    loading.value = false;
    return;
  }

  const filter = encodeURIComponent(
    JSON.stringify({ work_order_id: { _eq: id } })
  );
  const querySegments = [
    `filter=${filter}`,
    "sort[]=date_created",
    "fields[]=id",
    "fields[]=node_type",
    "fields[]=description",
    "fields[]=date_created",
    "fields[]=actor_id.first_name",
    "fields[]=actor_id.last_name",
    "fields[]=actor_id.email",
    "fields[]=files.directus_files_id.id",
    "fields[]=files.directus_files_id.title",
    "fields[]=files.directus_files_id.type",
  ];
  const url = `${env.directusUrl}/items/work_order_nodes?${querySegments.join(
    "&"
  )}`;

  try {
    const response = await new Promise<UniApp.RequestSuccessCallbackResult>(
      (resolve, reject) => {
        uni.request({
          url,
          method: "GET",
          header: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          success: resolve,
          fail: (err) => {
            reject(new Error(err?.errMsg ?? "网络请求失败"));
          },
        });
      }
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new Error(
        `加载时间轴失败：${response.statusCode} ${
          typeof response.data === "string"
            ? response.data
            : JSON.stringify(response.data)
        }`
      );
    }

    const payload = (response.data as any)?.data ?? [];
    const mapped: TimelineNode[] = Array.isArray(payload)
      ? payload.map((item: any) => {
          const nodeType =
            typeof item?.node_type === "string" ? item.node_type : "unknown";
          const display = resolveNodeDisplay(nodeType);
          const createdAt = String(item?.date_created ?? "");
          const relative = workOrderDisplay.formatRelativeTime(createdAt);
          const parsed = parseNodeDescription(
            typeof item?.description === "string" ? item.description : "",
            display.title
          );
          return {
            id: String(item?.id ?? ""),
            nodeType,
            displayTitle: parsed.title,
            tagType: display.tag,
            createdAt,
            timeDisplay: createdAt ? formatTime(createdAt) : "时间未知",
            relativeTime: relative,
            body: parsed.body,
            actor: resolveActor(item?.actor_id),
            attachments: mapAttachments(item?.files),
          };
        })
      : [];

    nodes.value = mapped;
  } catch (err) {
    console.error("[timeline] load failed", err);
    error.value = (err as Error)?.message ?? "加载时间轴失败";
  } finally {
    loading.value = false;
  }
};

const handleRetry = () => {
  if (workOrderId.value) {
    void Promise.all([
      fetchWorkOrderDetail(workOrderId.value),
      fetchTimelineNodes(workOrderId.value),
    ]);
  }
};

const fetchWorkOrderDetail = async (id: string) => {
  try {
    await userStore.ensureActiveSession({ refreshIfNearExpiry: true });
  } catch {
    return;
  }

  try {
    const detail = await workOrderStore.fetchWorkOrderDetail(id);
    workOrderDetail.value = detail;
  } catch (err) {
    console.error("[timeline] load detail failed", err);
  }
};

const handleStatusUpdated = async () => {
  if (!workOrderId.value) return;
  await fetchWorkOrderDetail(workOrderId.value);
  await fetchTimelineNodes(workOrderId.value);
};

const handleNodeCreated = async () => {
  if (!workOrderId.value) return;
  await fetchTimelineNodes(workOrderId.value);
};

onLoad((options) => {
  const id =
    typeof options?.workOrderId === "string" ? options.workOrderId : "";
  workOrderId.value = id;

  if (!id) {
    error.value = "缺少工单编号";
    loading.value = false;
    return;
  }

  void fetchWorkOrderDetail(id);
  void fetchTimelineNodes(id);
});
</script>

<template>
  <view class="timeline-page">
    <view v-if="loading" class="state-wrapper">
      <u-loading-page :loading="true" loading-text="正在加载进度..." />
    </view>

    <view v-else-if="error" class="state-wrapper">
      <up-empty mode="error" :text="error" text-size="14" />
      <up-button
        class="retry-btn"
        type="primary"
        size="small"
        text="重试"
        @click="handleRetry"
      />
    </view>

    <scroll-view
      v-else
      scroll-y
      :show-scrollbar="false"
      class="timeline-scroll"
    >
      <view class="header-card">
        <view class="header-title">
          <text class="header-label">当前处理状态</text>
          <up-tag
            :text="statusToken.label"
            :type="statusToken.tag"
            size="mini"
          />
        </view>
        <view v-if="latestNode" class="header-meta">
          <text class="header-time">
            {{ latestNode.timeDisplay }}
            <text v-if="latestNode.relativeTime">
              · {{ latestNode.relativeTime }}
            </text>
          </text>
          <text v-if="latestNode.actor" class="header-actor">
            更新人：{{ latestNode.actor.name }}
          </text>
        </view>
        <text v-else class="header-placeholder">暂无进度更新</text>

        <ManagerActions
          v-if="isPropertyManager && workOrderId"
          :work-order-id="workOrderId"
          :current-status="workOrderDetail?.status ?? null"
          @status-change="handleStatusUpdated"
          @node-created="handleNodeCreated"
        />
      </view>

      <view class="timeline-section">
        <view class="section-title">进度时间轴</view>

        <view v-if="!hasNodes" class="empty-wrapper">
          <up-empty
            mode="history"
            text="暂无处理节点，可联系物业了解进度"
            text-size="14"
          />
        </view>

        <view v-else class="timeline-wrapper">
          <u-steps
            direction="column"
            :current="currentIndex"
            activeColor="#1AA86C"
            dot
          >
            <u-steps-item
              v-for="(node, index) in nodes"
              :key="node.id || index"
              :title="node.displayTitle"
              :desc="node.timeDisplay"
            >
              <view class="step-content">
                <up-tag
                  class="step-tag"
                  size="mini"
                  :type="node.tagType"
                  :text="node.displayTitle"
                  plain
                />
                <text v-if="node.relativeTime" class="step-relative">
                  {{ node.relativeTime }}
                </text>
                <text
                  v-if="node.actor"
                  class="step-actor"
                >
                  处理人：{{ node.actor.name }}
                </text>
                <text
                  v-if="node.body"
                  class="step-description"
                >
                  {{ node.body }}
                </text>
                <view
                  v-if="node.attachments.length"
                  class="step-attachments"
                >
                  <up-tag
                    v-for="file in node.attachments"
                    :key="file.id"
                    size="mini"
                    type="info"
                    plain
                    :text="file.title || '附件'"
                  />
                </view>
              </view>
            </u-steps-item>
          </u-steps>
        </view>
      </view>

      <view class="scroll-spacer" />
    </scroll-view>
  </view>
</template>

<style scoped>
.timeline-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f4f5f7;
}

.timeline-scroll {
  flex: 1;
  padding: 16px;
  box-sizing: border-box;
}

.state-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 32px;
  gap: 16px;
}

.retry-btn {
  width: 96px;
}

.header-card {
  display: flex;
  flex-direction: column;
  padding: 16px;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.06);
  gap: 12px;
}

.header-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-label {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
}

.header-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #475569;
  font-size: 13px;
}

.header-time {
  color: #0f172a;
  font-weight: 500;
}

.header-actor {
  color: #64748b;
}

.header-placeholder {
  font-size: 13px;
  color: #94a3b8;
}

.timeline-section {
  margin-top: 24px;
  padding: 16px;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.06);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 12px;
}

.empty-wrapper {
  padding: 24px 0;
}

.timeline-wrapper {
  padding: 12px 4px;
}

.step-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
}

.step-tag {
  align-self: flex-start;
}

.step-relative {
  font-size: 12px;
  color: #94a3b8;
}

.step-actor {
  font-size: 13px;
  color: #475569;
}

.step-description {
  font-size: 14px;
  color: #0f172a;
  line-height: 1.5;
}

.step-attachments {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.scroll-spacer {
  height: 32px;
}
</style>
