import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { Query, QueryItem } from "@directus/sdk";

import type { Schema, WorkOrder } from "@/@types/directus-schema";
import { workOrdersApi } from "@/utils/directus";
import dayjs from "dayjs";
import { useUserStore } from "@/store/user";

const DEFAULT_PAGE_SIZE = 10;
const CALENDAR_HISTORY_MONTHS = 6; // 日历显示的历史月份数
const DAILY_WORK_ORDER_LIMIT = 100; // 单日工单查询数量限制

type WorkOrderQuery = Query<Schema, WorkOrder>;
type WorkOrderItemQuery = QueryItem<Schema, WorkOrder>;

interface WorkOrderFilters {
  submitterId?: string;
}

interface FetchOptions {
  refresh?: boolean;
  page?: number;
  pageSize?: number;
  query?: WorkOrderQuery;
  filters?: WorkOrderFilters;
}

interface WorkOrderState {
  items: WorkOrder[];
  loading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  hasMore: boolean;
  initialized: boolean;
  filters: WorkOrderFilters;
}

// 使用企业级标准定义字段，基于Directus schema
// 确保字段名称与Directus API返回的数据结构完全匹配
const BASE_FIELDS = [
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
] as unknown as NonNullable<WorkOrderQuery["fields"]>;

// 定义一个简化版本的字段查询，避免类型冲突
const SAFE_FIELDS = [
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
  "submitter_id.role.name", // 获取角色名称而不是ID
  "community_id.id",
  "community_id.name",
  "assignee_id.id",
  "assignee_id.first_name",
  "assignee_id.last_name",
  "assignee_id.email",
  "assignee_id.avatar",
  "assignee_id.role.name", // 获取角色名称而不是ID
  "files.directus_files_id.*",
  "files.id",
] as unknown as NonNullable<WorkOrderQuery["fields"]>;

const DETAIL_FIELDS = [
  ...SAFE_FIELDS,
  "deadline",
  "resolved_at",
  "rating",
  "feedback",
  "community_id.address",
] as unknown as NonNullable<WorkOrderQuery["fields"]>;

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

const resolveSubmitterId = (
  submitter: WorkOrder["submitter_id"]
): string | null => {
  if (!submitter) return null;
  if (typeof submitter === "string") return submitter;
  if (typeof submitter === "object" && submitter !== null) {
    const candidate = (submitter as Record<string, any>).id;
    if (typeof candidate === "string" && candidate) {
      return candidate;
    }
  }
  return null;
};

const filterBySubmitter = (items: WorkOrder[], submitterId?: string) => {
  if (!submitterId) return items;
  return items.filter(
    (item) => resolveSubmitterId(item.submitter_id) === submitterId
  );
};

const combineFilters = (existing: any, additions: any[]): any => {
  if (!additions.length) return existing;

  const additionFilter = additions.length === 1
    ? additions[0]
    : { _and: additions };

  if (!existing) {
    return additionFilter;
  }

  return {
    _and: [existing, additionFilter],
  };
};

export const useWorkOrderStore = defineStore("work-orders", () => {
  const state = ref<WorkOrderState>({
    items: [],
    loading: false,
    error: null,
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    hasMore: true,
    initialized: false,
    filters: {},
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
    state.value.filters = {};
  };

  const fetchWorkOrders = async (options: FetchOptions = {}) => {
    if (state.value.loading) return;

    const refresh = options.refresh ?? false;
    const pageSize = options.pageSize ?? state.value.pageSize;
    const page = options.page ?? (refresh ? 1 : state.value.page);
    const requestedFilters: WorkOrderFilters = options.filters
      ? { ...options.filters }
      : refresh
        ? {}
        : { ...state.value.filters };

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
      state.value.filters = { ...requestedFilters };
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

      // 组合筛选条件
      const additions: any[] = [];

      if (requestedFilters.submitterId) {
        additions.push({
          submitter_id: {
            _eq: requestedFilters.submitterId,
          },
        });
      }

      if (additions.length) {
        const combined = combineFilters(query.filter, additions);
        if (combined) {
          query.filter = combined;
        } else {
          delete (query as Record<string, any>).filter;
        }
      }

      const response = await workOrdersApi.readMany(query);
      const workOrderItems: WorkOrder[] = Array.isArray(response)
        ? response.map(normalizeWorkOrder)
        : [];

      const filteredItems = filterBySubmitter(
        workOrderItems,
        requestedFilters.submitterId
      );

      if (refresh) {
        state.value.items = filteredItems;
      } else {
        state.value.items = [...state.value.items, ...filteredItems];
      }

      const received = filteredItems.length;
      // 不使用meta属性，因为会导致类型错误
      const total = undefined;

      state.value.page = page + 1;
      state.value.pageSize = pageSize;
      state.value.hasMore = received >= pageSize;

      if (typeof total === "number") {
        state.value.hasMore = state.value.items.length < total;
      }

      state.value.initialized = true;

      if (!refresh && options.filters) {
        state.value.filters = { ...requestedFilters };
      }

      return filteredItems;
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
    return fetchWorkOrders({
      page: state.value.page,
      filters: { ...state.value.filters },
    });
  };

  // 按日期查询工单（支持类别筛选）
  const fetchWorkOrdersByDate = async (
    date: string,
    category?: string,
    submitterId?: string
  ) => {
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

      if (submitterId) {
        filters.push({
          submitter_id: {
            _eq: submitterId,
          },
        });
      }

      const query: WorkOrderQuery = {
        limit: DAILY_WORK_ORDER_LIMIT,
        fields: SAFE_FIELDS,
        sort: ["-date_created"],
        filter: {
          _and: filters,
        },
      };

      const response = await workOrdersApi.readMany(query);
      const workOrderItems: WorkOrder[] = Array.isArray(response)
        ? response.map(normalizeWorkOrder)
        : [];

      const filteredItems = filterBySubmitter(workOrderItems, submitterId);

      // 替换当前列表
      state.value.items = filteredItems;
      state.value.hasMore = false; // 单日查询不分页
      state.value.initialized = true;

      return filteredItems;
    } catch (error) {
      const message = (error as Error)?.message ?? "获取工单失败";
      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 按类别查询工单
  const fetchWorkOrdersByCategory = async (
    category?: string,
    submitterId?: string
  ) => {
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
      const filters: any[] = [];

      if (category) {
        filters.push({
          category: {
            _eq: category as WorkOrder["category"],
          },
        });
      }

      if (submitterId) {
        filters.push({
          submitter_id: {
            _eq: submitterId,
          },
        });
      }

      if (filters.length === 1) {
        query.filter = filters[0] as any;
      } else if (filters.length > 1) {
        query.filter = { _and: filters } as any;
      }

      const response = await workOrdersApi.readMany(query);
      const workOrderItems: WorkOrder[] = Array.isArray(response)
        ? response.map(normalizeWorkOrder)
        : [];

      const filteredItems = filterBySubmitter(workOrderItems, submitterId);

      state.value.items = filteredItems;
      state.value.hasMore = false;
      state.value.initialized = true;

      return filteredItems;
    } catch (error) {
      const message = (error as Error)?.message ?? "获取工单失败";
      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 获取最新的一条工单（用于检测新工单）
  const fetchLatestWorkOrder = async (
    category?: string,
    date?: string,
    submitterId?: string
  ) => {
    try {
      await userStore.ensureActiveSession({ refreshIfNearExpiry: true });
    } catch (error) {
      throw error;
    }

    try {
      const query: WorkOrderQuery = {
        limit: 1,
        fields: ["id", "date_created", "submitter_id"],
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
            _eq: category as WorkOrder["category"],
          },
        });
      }

      if (submitterId) {
        filters.push({
          submitter_id: {
            _eq: submitterId,
          },
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

      const filteredItems = filterBySubmitter(workOrderItems, submitterId);

      return filteredItems.length > 0 ? filteredItems[0] : null;
    } catch (error) {
      console.error("获取最新工单失败", error);
      throw error;
    }
  };

  const fetchWorkOrderDatesByYear = async (
    year?: number,
    submitterId?: string
  ) => {
    try {
      await userStore.ensureActiveSession({ refreshIfNearExpiry: true });
    } catch (error) {
      throw error;
    }

    const targetYear = year ?? dayjs().year();
    const rangeStart = dayjs()
      .year(targetYear)
      .startOf("year")
      .toISOString();
    const rangeEnd = dayjs()
      .year(targetYear)
      .endOf("year")
      .toISOString();

    const filters: any[] = [
      {
        date_created: {
          _between: [rangeStart, rangeEnd],
        },
      },
    ];

    if (submitterId) {
      filters.push({
        submitter_id: {
          _eq: submitterId,
        },
      });
    }

    const query: WorkOrderQuery = {
      fields: ["date_created"],
      filter:
        filters.length === 1
          ? (filters[0] as any)
          : ({ _and: filters } as any),
      limit: -1,
      sort: ["date_created"],
    };

    const response = await workOrdersApi.readMany(query as any);
    const records = Array.isArray(response)
      ? (response as Array<{ date_created?: string | null }>)
      : [];
    const dateSet = new Set<string>();

    for (const record of records) {
      if (record?.date_created) {
        dateSet.add(dayjs(record.date_created).format("YYYY-MM-DD"));
      }
    }

    return Array.from(dateSet).sort();
  };

  const fetchWorkOrderDetail = async (id: string) => {
    try {
      await userStore.ensureActiveSession({ refreshIfNearExpiry: true });
    } catch (error) {
      throw error;
    }

    try {
      const query: WorkOrderItemQuery = {
        fields: DETAIL_FIELDS,
      };

      const response = await workOrdersApi.readOne(id, query);
      return normalizeWorkOrder(response);
    } catch (error) {
      console.error("获取工单详情失败", error);
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
    fetchWorkOrderDetail,
    fetchWorkOrderDatesByYear,
    refresh,
    loadMore,
    reset,
  };
});

export type WorkOrderListItem = WorkOrder;
