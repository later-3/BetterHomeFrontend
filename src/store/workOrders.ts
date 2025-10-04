import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { Query } from "@directus/sdk";

import type { Schema, WorkOrder } from "@/@types/directus-schema";
import { workOrdersApi } from "@/utils/directus";
import { useUserStore } from "@/store/user";

const DEFAULT_PAGE_SIZE = 10;
const CALENDAR_HISTORY_MONTHS = 6; // 日历显示的历史月份数
const DAILY_WORK_ORDER_LIMIT = 100; // 单日工单查询数量限制

type WorkOrderQuery = Query<Schema, WorkOrder>;

interface FetchOptions {
  refresh?: boolean;
  page?: number;
  pageSize?: number;
  query?: WorkOrderQuery;
}

interface WorkOrderState {
  items: WorkOrder[];
  loading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  hasMore: boolean;
  initialized: boolean;
}

// 使用企业级标准定义字段，基于Directus schema
// 确保字段名称与Directus API返回的数据结构完全匹配
const BASE_FIELDS: NonNullable<WorkOrderQuery["fields"]> = [
  "id",
  "title",
  "description",
  "category",
  "priority",
  "status",
  "date_created",
  "submitter_id",
  "community_id",
  "assignee_id",
  "files.directus_files_id.*",
];

// 定义一个简化版本的字段查询，避免类型冲突
const SAFE_FIELDS: NonNullable<WorkOrderQuery["fields"]> = [
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
  "submitter_id.role",
  "community_id.id",
  "community_id.name",
  "assignee_id.id",
  "assignee_id.first_name",
  "assignee_id.last_name",
  "assignee_id.email",
  "assignee_id.avatar",
  "assignee_id.role",
  "files.directus_files_id.*",
];

// 规范化工单数据，确保类型安全
const normalizeWorkOrder = (item: any): WorkOrder => ({
  id: item.id,
  title: item.title,
  description: item.description,
  category: item.category,
  priority: item.priority,
  status: item.status,
  date_created: item.date_created,
  user_created: typeof item.user_created === 'string' ? item.user_created : undefined,
  user_updated: typeof item.user_updated === 'string' ? item.user_updated : undefined,
  date_updated: item.date_updated,
  deadline: item.deadline,
  resolved_at: item.resolved_at,
  submitter_id: item.submitter_id,
  assignee_id: item.assignee_id,
  community_id: item.community_id,
  rating: typeof item.rating === 'number' ? item.rating : undefined,
  feedback: typeof item.feedback === 'string' ? item.feedback : undefined,
  files: item.files
});

export const useWorkOrderStore = defineStore("work-orders", () => {
  const state = ref<WorkOrderState>({
    items: [],
    loading: false,
    error: null,
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    hasMore: true,
    initialized: false,
  });

  const items = computed(() => state.value.items);
  const loading = computed(() => state.value.loading);
  const error = computed(() => state.value.error);
  const hasMore = computed(() => state.value.hasMore);
  const initialized = computed(() => state.value.initialized);

  const userStore = useUserStore();

  const setError = (message: string | null) => {
    state.value.error = message;
  };

  const setLoading = (value: boolean) => {
    state.value.loading = value;
  };

  const reset = () => {
    state.value.items = [];
    state.value.page = 1;
    state.value.hasMore = true;
    state.value.initialized = false;
  };

  const fetchWorkOrders = async (options: FetchOptions = {}) => {
    if (state.value.loading) return;

    const refresh = options.refresh ?? false;
    const pageSize = options.pageSize ?? state.value.pageSize;
    const page = options.page ?? (refresh ? 1 : state.value.page);

    try {
      await userStore.ensureActiveSession({ refreshIfNearExpiry: true });
    } catch (error) {
      setError((error as Error).message);
      throw error;
    }

    setLoading(true);
    setError(null);

    if (refresh) {
      reset();
    }

    try {
      // 使用符合Directus SDK规范的查询对象
      const query: WorkOrderQuery = {
        limit: pageSize,
        page,
        fields: SAFE_FIELDS, // 使用简化的字段查询
        sort: ["-date_created"],
        // 不使用meta属性，因为不在Query类型中
        ...options.query,
      };

      const response = await workOrdersApi.readMany(query);
      const workOrderItems: WorkOrder[] = Array.isArray(response)
        ? response.map(normalizeWorkOrder)
        : [];

      if (refresh) {
        state.value.items = workOrderItems;
      } else {
        state.value.items = [...state.value.items, ...workOrderItems];
      }

      const received = workOrderItems.length;
      // 不使用meta属性，因为会导致类型错误
      const total = undefined;

      state.value.page = page + 1;
      state.value.pageSize = pageSize;
      state.value.hasMore = received >= pageSize;

      if (typeof total === "number") {
        state.value.hasMore = state.value.items.length < total;
      }

      state.value.initialized = true;

      return workOrderItems;
    } catch (error) {
      const message = (error as Error)?.message ?? "获取工单失败";
      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    await fetchWorkOrders({ refresh: true, page: 1 });
  };

  const loadMore = async () => {
    if (!state.value.hasMore || state.value.loading) return [];
    return fetchWorkOrders({ page: state.value.page });
  };

  // 按日期查询工单（支持类别筛选）
  const fetchWorkOrdersByDate = async (date: string, category?: string) => {
    if (state.value.loading) return;

    try {
      await userStore.ensureActiveSession({ refreshIfNearExpiry: true });
    } catch (error) {
      setError((error as Error).message);
      throw error;
    }

    setLoading(true);
    setError(null);

    try {
      // 将本地日期转换为UTC时间范围
      // 例如：2025-10-04 (本地) → [2025-10-03T16:00:00Z, 2025-10-04T16:00:00Z] (UTC+8的情况)
      const localStart = new Date(`${date}T00:00:00`);
      const localEnd = new Date(`${date}T23:59:59`);

      const startDate = localStart.toISOString();
      const endDate = localEnd.toISOString();

      // 构建筛选条件
      const filters: any[] = [
        {
          date_created: {
            _gte: startDate
          }
        },
        {
          date_created: {
            _lte: endDate
          }
        }
      ];

      // 如果有类别筛选，添加类别条件
      if (category) {
        filters.push({
          category: {
            _eq: category
          }
        });
      }

      const query: WorkOrderQuery = {
        limit: DAILY_WORK_ORDER_LIMIT,
        fields: SAFE_FIELDS,
        sort: ["-date_created"],
        filter: {
          _and: filters
        }
      };

      const response = await workOrdersApi.readMany(query);
      const workOrderItems: WorkOrder[] = Array.isArray(response)
        ? response.map(normalizeWorkOrder)
        : [];

      // 替换当前列表
      state.value.items = workOrderItems;
      state.value.hasMore = false; // 单日查询不分页
      state.value.initialized = true;

      return workOrderItems;
    } catch (error) {
      const message = (error as Error)?.message ?? "获取工单失败";
      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 按类别查询工单
  const fetchWorkOrdersByCategory = async (category?: string) => {
    if (state.value.loading) return;

    try {
      await userStore.ensureActiveSession({ refreshIfNearExpiry: true });
    } catch (error) {
      setError((error as Error).message);
      throw error;
    }

    setLoading(true);
    setError(null);

    try {
      const query: WorkOrderQuery = {
        limit: DAILY_WORK_ORDER_LIMIT,
        fields: SAFE_FIELDS,
        sort: ["-date_created"],
      };

      // 如果有类别筛选，添加过滤条件
      if (category) {
        query.filter = {
          category: {
            _eq: category
          }
        };
      }

      const response = await workOrdersApi.readMany(query);
      const workOrderItems: WorkOrder[] = Array.isArray(response)
        ? response.map(normalizeWorkOrder)
        : [];

      state.value.items = workOrderItems;
      state.value.hasMore = false;
      state.value.initialized = true;

      return workOrderItems;
    } catch (error) {
      const message = (error as Error)?.message ?? "获取工单失败";
      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 获取最新的一条工单（用于检测新工单）
  const fetchLatestWorkOrder = async (category?: string, date?: string) => {
    try {
      await userStore.ensureActiveSession({ refreshIfNearExpiry: true });
    } catch (error) {
      throw error;
    }

    try {
      const query: WorkOrderQuery = {
        limit: 1,
        fields: ["id", "date_created"],
        sort: ["-date_created"],
      };

      // 构建筛选条件
      const filters: any[] = [];

      // 如果有日期筛选
      if (date) {
        const localStart = new Date(`${date}T00:00:00`);
        const localEnd = new Date(`${date}T23:59:59`);
        const startDate = localStart.toISOString();
        const endDate = localEnd.toISOString();

        filters.push(
          {
            date_created: {
              _gte: startDate
            }
          },
          {
            date_created: {
              _lte: endDate
            }
          }
        );
      }

      // 如果有类别筛选
      if (category) {
        filters.push({
          category: {
            _eq: category
          }
        });
      }

      // 应用筛选条件
      if (filters.length > 0) {
        query.filter = {
          _and: filters
        };
      }

      const response = await workOrdersApi.readMany(query);
      const workOrderItems: WorkOrder[] = Array.isArray(response)
        ? response.map(normalizeWorkOrder)
        : [];

      return workOrderItems.length > 0 ? workOrderItems[0] : null;
    } catch (error) {
      console.error("获取最新工单失败", error);
      throw error;
    }
  };

  return {
    items,
    loading,
    error,
    hasMore,
    initialized,
    page: computed(() => state.value.page),
    pageSize: computed(() => state.value.pageSize),
    fetchWorkOrders,
    fetchWorkOrdersByDate,
    fetchWorkOrdersByCategory,
    fetchLatestWorkOrder,
    refresh,
    loadMore,
    reset,
  };
});

export type WorkOrderListItem = WorkOrder;