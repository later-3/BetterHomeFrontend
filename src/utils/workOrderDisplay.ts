import type { WorkOrder } from "@/@types/directus-schema";
import type { DirectusFile, DirectusUser } from "@/@types/directus-schema";

export type WorkOrderCategory = NonNullable<WorkOrder["category"]>;
export type WorkOrderPriority = NonNullable<WorkOrder["priority"]>;
export type WorkOrderStatus = NonNullable<WorkOrder["status"]>;

export interface DisplayToken {
  label: string;
  /** 对应 u-tag 的 type */
  type?: "primary" | "success" | "warning" | "error" | "info";
  icon?: string;
}

const WORK_ORDER_CATEGORY_DISPLAY: Record<WorkOrderCategory, DisplayToken> = {
  repair: { label: "设施维修", type: "primary", icon: "wrench" },
  complaint: { label: "投诉建议", type: "warning", icon: "feedback" },
  suggestion: { label: "优化建议", type: "success", icon: "lightbulb" },
  inquiry: { label: "咨询", type: "info", icon: "question-circle" },
  other: { label: "其他事项", type: "info", icon: "more" },
};

const WORK_ORDER_PRIORITY_DISPLAY: Record<WorkOrderPriority, DisplayToken> = {
  urgent: { label: "紧急", type: "error", icon: "fire" },
  high: { label: "重要", type: "warning", icon: "alert" },
  medium: { label: "普通", type: "success", icon: "star" },
  low: { label: "较低", type: "info", icon: "arrow-down" },
};

const WORK_ORDER_STATUS_DISPLAY: Record<WorkOrderStatus, DisplayToken> = {
  submitted: { label: "已提交", type: "warning", icon: "upload" },
  accepted: { label: "已受理", type: "primary", icon: "check-circle" },
  in_progress: { label: "处理中", type: "primary", icon: "spinner" },
  resolved: { label: "已解决", type: "success", icon: "checkbox-circle" },
  closed: { label: "已关闭", type: "info", icon: "close-circle" },
};

// Role 英文到中文的映射
const ROLE_DISPLAY_MAP: Record<string, string> = {
  'resident': '业主',
  'admin': '管理员',
  'property_manager': '物业人员',
  'Administrator': '管理员', // Directus 默认管理员角色
};

export interface WorkOrderAssigneeDisplay {
  name: string;
  role?: string | null;
  avatarId?: string;
  avatar?: DirectusFile | string | null;
  initials: string;
}

export function getCategoryDisplay(category?: WorkOrder["category"]): DisplayToken | null {
  if (!category) return null;
  return WORK_ORDER_CATEGORY_DISPLAY[category];
}

export function getPriorityDisplay(priority?: WorkOrder["priority"]): DisplayToken | null {
  if (!priority) return null;
  return WORK_ORDER_PRIORITY_DISPLAY[priority];
}

export function getStatusDisplay(status?: WorkOrder["status"]): DisplayToken | null {
  if (!status) return null;
  return WORK_ORDER_STATUS_DISPLAY[status];
}

function toDirectusUser(value: WorkOrder["assignee_id"]): DirectusUser | null {
  if (!value) return null;
  if (typeof value === "string") {
    return {
      id: value,
      first_name: "",
      last_name: "",
      email: "",
      status: "active",
      role: null,
    } as DirectusUser;
  }
  return value as DirectusUser;
}

export function getAssigneeDisplay(
  assignee: WorkOrder["assignee_id"]
): WorkOrderAssigneeDisplay {
  const user = toDirectusUser(assignee);
  if (!user) {
    return {
      name: "未分配",
      role: null,
      avatar: null,
      initials: "?",
    };
  }

  // 只使用 first_name，不显示 last_name
  const displayName = user.first_name || user.email || "未命名用户";
  const initials = displayName
    .replace(/\s+/g, "")
    .slice(0, 2)
    .toUpperCase();

  let avatarId: string | undefined;
  let avatar: DirectusFile | string | null = null;

  if (typeof user.avatar === "string") {
    avatarId = user.avatar;
    avatar = user.avatar;
  } else if (user.avatar && typeof user.avatar === "object") {
    avatar = user.avatar as DirectusFile;
    avatarId = (user.avatar as DirectusFile).id ?? undefined;
  }

  // 获取角色名称并映射为中文
  let roleName: string | null = null;
  if (typeof user.role === "object" && user.role && "name" in user.role) {
    const roleNameRaw = String((user.role as { name?: string }).name ?? "");
    // 使用映射表转换，如果映射表中没有则保持原值
    roleName = ROLE_DISPLAY_MAP[roleNameRaw] || roleNameRaw;
  }

  return {
    name: displayName,
    role: roleName,
    avatar,
    avatarId,
    initials: initials || "?",
  };
}

export function getCommunityName(community: WorkOrder["community_id"]): string {
  if (!community) return "";
  if (typeof community === "string") return community;
  if (typeof community === "object" && "name" in community) {
    return String((community as { name?: string }).name ?? "");
  }
  return "";
}

export function getAttachmentCount(files: WorkOrder["files"]): number {
  if (!files) return 0;
  if (Array.isArray(files)) {
    return files.length;
  }
  return 0;
}

export function formatRelativeTime(dateInput?: string | null): string {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "";

  const diff = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return "刚刚";
  if (diff < hour) return `${Math.floor(diff / minute)}分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)}小时前`;
  if (diff < day * 7) return `${Math.floor(diff / day)}天前`;
  return date.toLocaleDateString();
}

export function formatDescription(description?: string | null, max = 140): string {
  if (!description) return "";
  if (description.length <= max) return description;
  return `${description.slice(0, max)}...`;
}

export const workOrderDisplay = {
  getCategoryDisplay,
  getPriorityDisplay,
  getStatusDisplay,
  getAssigneeDisplay,
  getCommunityName,
  getAttachmentCount,
  formatRelativeTime,
  formatDescription,
};

export default workOrderDisplay;