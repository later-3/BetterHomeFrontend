import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { Query } from "@directus/sdk";
import type {
  Schema,
  Billing,
  BillingPayment,
  Income,
  Expense,
  Employee,
  SalaryRecord,
  MaintenanceFundAccount,
  MaintenanceFundPayment,
  MaintenanceFundUsage,
} from "@/@types/directus-schema";
import {
  billingsApi,
  billingPaymentsApi,
  incomesApi,
  expensesApi,
  employeesApi,
  salaryRecordsApi,
  maintenanceFundAccountsApi,
  maintenanceFundPaymentsApi,
  maintenanceFundUsageApi,
} from "@/utils/directus";
import { useUserStore } from "@/store/user";

const DEFAULT_PAGE_SIZE = 20;

// ============================================================
// Type Definitions
// ============================================================

type BillingQuery = Query<Schema, Billing>;
type BillingPaymentQuery = Query<Schema, BillingPayment>;
type IncomeQuery = Query<Schema, Income>;
type ExpenseQuery = Query<Schema, Expense>;
type EmployeeQuery = Query<Schema, Employee>;
type SalaryRecordQuery = Query<Schema, SalaryRecord>;
type MaintenanceFundAccountQuery = Query<Schema, MaintenanceFundAccount>;
type MaintenanceFundPaymentQuery = Query<Schema, MaintenanceFundPayment>;
type MaintenanceFundUsageQuery = Query<Schema, MaintenanceFundUsage>;

// ============================================================
// State Interface
// ============================================================

interface FinanceState {
  // 应收账单
  billings: Billing[];
  billingsPage: number;
  billingsHasMore: boolean;

  // 实收记录
  billingPayments: BillingPayment[];
  billingPaymentsPage: number;
  billingPaymentsHasMore: boolean;

  // 公共收益
  incomes: Income[];
  incomesPage: number;
  incomesHasMore: boolean;

  // 支出记录
  expenses: Expense[];
  expensesPage: number;
  expensesHasMore: boolean;

  // 员工信息
  employees: Employee[];
  employeesPage: number;
  employeesHasMore: boolean;

  // 工资发放记录
  salaryRecords: SalaryRecord[];
  salaryRecordsPage: number;
  salaryRecordsHasMore: boolean;

  // 维修基金账户
  maintenanceFundAccounts: MaintenanceFundAccount[];
  maintenanceFundAccountsPage: number;
  maintenanceFundAccountsHasMore: boolean;

  // 维修基金缴纳记录
  maintenanceFundPayments: MaintenanceFundPayment[];
  maintenanceFundPaymentsPage: number;
  maintenanceFundPaymentsHasMore: boolean;

  // 维修基金使用记录
  maintenanceFundUsage: MaintenanceFundUsage[];
  maintenanceFundUsagePage: number;
  maintenanceFundUsageHasMore: boolean;

  // 状态管理
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

// ============================================================
// Field Configurations
// ============================================================

const BILLING_FIELDS = [
  "id",
  "community_id.id",
  "community_id.name",
  "building_id.id",
  "building_id.name",
  "owner_id.id",
  "owner_id.first_name",
  "owner_id.last_name",
  "period",
  "billing_amount",
  "area",
  "unit_price",
  "status",
  "paid_amount",
  "due_date",
  "late_fee",
  "notes",
  "date_created",
  "date_updated",
] as unknown as NonNullable<BillingQuery["fields"]>;

const BILLING_PAYMENT_FIELDS = [
  "id",
  "billing_id.id",
  "billing_id.period",
  "community_id.id",
  "community_id.name",
  "owner_id.id",
  "owner_id.first_name",
  "owner_id.last_name",
  "amount",
  "paid_at",
  "period", // 所属账期（权责发生制）
  "payment_method",
  "payer_name",
  "payer_phone",
  "transaction_no",
  "proof_files",
  "notes",
  "date_created",
] as unknown as NonNullable<BillingPaymentQuery["fields"]>;

const INCOME_FIELDS = [
  "id",
  "community_id.id",
  "community_id.name",
  "income_type",
  "title",
  "description",
  "amount",
  "income_date",
  "period",
  "payment_method",
  "transaction_no",
  "related_info",
  "proof_files",
  "notes",
  "date_created",
  "date_updated",
] as unknown as NonNullable<IncomeQuery["fields"]>;

const EXPENSE_FIELDS = [
  "id",
  "community_id.id",
  "community_id.name",
  "expense_type",
  "title",
  "description",
  "amount",
  "paid_at",
  "period",
  "payment_method",
  "category",
  "related_info",
  "status",
  "approved_by.id",
  "approved_by.first_name",
  "approved_by.last_name",
  "approved_at",
  "proof_files",
  "created_by.id",
  "created_by.first_name",
  "created_by.last_name",
  "date_created",
  "date_updated",
] as unknown as NonNullable<ExpenseQuery["fields"]>;

const EMPLOYEE_FIELDS = [
  "id",
  "community_id.id",
  "community_id.name",
  "name",
  "phone",
  "id_card_last4",
  "position_type",
  "position_title",
  "employment_status",
  "hire_date",
  "resignation_date",
  "base_salary",
  "notes",
  "date_created",
] as unknown as NonNullable<EmployeeQuery["fields"]>;

const SALARY_RECORD_FIELDS = [
  "id",
  "employee_id.id",
  "employee_id.name",
  "community_id.id",
  "community_id.name",
  "period",
  "base_salary",
  "bonus",
  "subsidy",
  "deduction",
  "social_security",
  "housing_fund",
  "actual_amount",
  "payment_date",
  "payment_method",
  "expense_id.id",
  "proof_files",
  "date_created",
] as unknown as NonNullable<SalaryRecordQuery["fields"]>;

const MAINTENANCE_FUND_ACCOUNT_FIELDS = [
  "id",
  "community_id.id",
  "community_id.name",
  "building_id.id",
  "building_id.name",
  "owner_id.id",
  "owner_id.first_name",
  "owner_id.last_name",
  "house_area",
  "unit_number",
  "total_paid",
  "total_used",
  "balance",
  "last_payment_date",
  "date_created",
  "date_updated",
] as unknown as NonNullable<MaintenanceFundAccountQuery["fields"]>;

const MAINTENANCE_FUND_PAYMENT_FIELDS = [
  "id",
  "account_id.id",
  "community_id.id",
  "community_id.name",
  "owner_id.id",
  "owner_id.first_name",
  "owner_id.last_name",
  "amount",
  "paid_at",
  "payment_method",
  "payment_type",
  "transaction_no",
  "proof_files",
  "notes",
  "date_created",
] as unknown as NonNullable<MaintenanceFundPaymentQuery["fields"]>;

const MAINTENANCE_FUND_USAGE_FIELDS = [
  "id",
  "work_order_id.id",
  "work_order_id.title",
  "community_id.id",
  "community_id.name",
  "project_name",
  "project_type",
  "description",
  "contractor",
  "contract_no",
  "estimated_amount",
  "actual_amount",
  "approval_status",
  "approved_by.id",
  "approved_by.first_name",
  "approved_by.last_name",
  "approved_at",
  "rejection_reason",
  "usage_date",
  "expense_id.id",
  "proof_files",
  "date_created",
  "date_updated",
] as unknown as NonNullable<MaintenanceFundUsageQuery["fields"]>;

// ============================================================
// Store Definition
// ============================================================

export const useFinanceStore = defineStore("finance", () => {
  // ============================================================
  // State
  // ============================================================

  const state = ref<FinanceState>({
    // 应收账单
    billings: [],
    billingsPage: 1,
    billingsHasMore: true,

    // 实收记录
    billingPayments: [],
    billingPaymentsPage: 1,
    billingPaymentsHasMore: true,

    // 公共收益
    incomes: [],
    incomesPage: 1,
    incomesHasMore: true,

    // 支出记录
    expenses: [],
    expensesPage: 1,
    expensesHasMore: true,

    // 员工信息
    employees: [],
    employeesPage: 1,
    employeesHasMore: true,

    // 工资发放记录
    salaryRecords: [],
    salaryRecordsPage: 1,
    salaryRecordsHasMore: true,

    // 维修基金账户
    maintenanceFundAccounts: [],
    maintenanceFundAccountsPage: 1,
    maintenanceFundAccountsHasMore: true,

    // 维修基金缴纳记录
    maintenanceFundPayments: [],
    maintenanceFundPaymentsPage: 1,
    maintenanceFundPaymentsHasMore: true,

    // 维修基金使用记录
    maintenanceFundUsage: [],
    maintenanceFundUsagePage: 1,
    maintenanceFundUsageHasMore: true,

    // 状态管理
    loading: false,
    error: null,
    initialized: false,
  });

  const userStore = useUserStore();

  // ============================================================
  // Basic Getters
  // ============================================================

  const loading = computed(() => state.value.loading);
  const error = computed(() => state.value.error);
  const initialized = computed(() => state.value.initialized);

  // ============================================================
  // Income-Related Getters
  // ============================================================

  // 物业费总收入（基于billing_payments实收）
  const totalPropertyFeeIncome = computed(() =>
    state.value.billingPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
  );

  // 公共收益总收入
  const totalPublicIncome = computed(() =>
    state.value.incomes.reduce((sum, income) => sum + Number(income.amount || 0), 0)
  );

  // 总收入
  const totalIncome = computed(
    () => totalPropertyFeeIncome.value + totalPublicIncome.value
  );

  // 按类型分组的收入
  const incomesByType = computed(() => {
    const grouped = new Map<string, { type: string; total: number; items: Income[] }>();

    state.value.incomes.forEach((income) => {
      const type = income.income_type;
      if (!grouped.has(type)) {
        grouped.set(type, { type, total: 0, items: [] });
      }
      const group = grouped.get(type)!;
      group.total += Number(income.amount || 0);
      group.items.push(income);
    });

    return Array.from(grouped.values());
  });

  // 我的账单
  const myBillings = computed(() => {
    const userId = userStore.profile?.id;
    if (!userId) return [];
    return state.value.billings.filter((b) => {
      const ownerId = typeof b.owner_id === "string" ? b.owner_id : b.owner_id?.id;
      return ownerId === userId;
    });
  });

  // 我的总应缴
  const myTotalBilling = computed(() =>
    myBillings.value.reduce((sum, b) => sum + Number(b.billing_amount || 0), 0)
  );

  // 我的总已缴
  const myTotalPaid = computed(() =>
    myBillings.value.reduce((sum, b) => sum + Number(b.paid_amount || 0), 0)
  );

  // 我的总欠费
  const myTotalUnpaid = computed(
    () => myTotalBilling.value - myTotalPaid.value
  );

  // ============================================================
  // Expense-Related Getters
  // ============================================================

  // 总支出
  const totalExpense = computed(() =>
    state.value.expenses
      .filter((e) => e.status === "approved")
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0)
  );

  // 按类型分组的支出
  const expensesByType = computed(() => {
    const grouped = new Map<string, { type: string; total: number; items: Expense[] }>();

    state.value.expenses
      .filter((e) => e.status === "approved")
      .forEach((expense) => {
        const type = expense.expense_type;
        if (!grouped.has(type)) {
          grouped.set(type, { type, total: 0, items: [] });
        }
        const group = grouped.get(type)!;
        group.total += Number(expense.amount || 0);
        group.items.push(expense);
      });

    return Array.from(grouped.values());
  });

  // 结余（总收入 - 总支出）
  const balance = computed(() => totalIncome.value - totalExpense.value);

  // 按岗位分组的员工
  const employeesByPosition = computed(() => {
    const grouped = new Map<string, { position: string; count: number; employees: Employee[] }>();

    state.value.employees
      .filter((e) => e.employment_status === "active")
      .forEach((employee) => {
        const position = employee.position_type;
        if (!grouped.has(position)) {
          grouped.set(position, { position, count: 0, employees: [] });
        }
        const group = grouped.get(position)!;
        group.count += 1;
        group.employees.push(employee);
      });

    return Array.from(grouped.values());
  });

  // ============================================================
  // Maintenance Fund Getters
  // ============================================================

  // 我的维修基金账户
  const myMFAccount = computed(() => {
    const userId = userStore.profile?.id;
    if (!userId) return null;
    return state.value.maintenanceFundAccounts.find((account) => {
      const ownerId = typeof account.owner_id === "string" ? account.owner_id : account.owner_id?.id;
      return ownerId === userId;
    });
  });

  // 我的维修基金余额
  const myMFBalance = computed(() => Number(myMFAccount.value?.balance || 0));

  // 社区维修基金总余额
  const totalMFBalance = computed(() =>
    state.value.maintenanceFundAccounts.reduce((sum, account) => sum + Number(account.balance || 0), 0)
  );

  // ============================================================
  // Actions - Income Related
  // ============================================================

  /**
   * 获取我的账单（应收）
   */
  const fetchMyBillings = async (refresh = false) => {
    if (state.value.loading) return;

    try {
      await userStore.ensureActiveSession({ refreshIfNearExpiry: true });
    } catch (error) {
      throw error;
    }

    const userId = userStore.profile?.id;
    if (!userId) {
      throw new Error("用户未登录");
    }

    state.value.loading = true;
    state.value.error = null;

    if (refresh) {
      state.value.billings = [];
      state.value.billingsPage = 1;
      state.value.billingsHasMore = true;
    }

    try {
      const query: BillingQuery = {
        limit: DEFAULT_PAGE_SIZE,
        page: state.value.billingsPage,
        fields: BILLING_FIELDS,
        sort: ["-period", "-date_created"],
        filter: {
          owner_id: { _eq: userId },
        },
      };

      const response = await billingsApi.readMany(query) as any;
      const items = (Array.isArray(response?.data) ? response.data : []) as Billing[];

      if (refresh) {
        state.value.billings = items;
      } else {
        state.value.billings = [...state.value.billings, ...items];
      }

      state.value.billingsPage += 1;
      state.value.billingsHasMore = items.length >= DEFAULT_PAGE_SIZE;
      state.value.initialized = true;

      return items;
    } catch (error) {
      state.value.error = (error as Error)?.message ?? "加载账单数据失败";
      throw error;
    } finally {
      state.value.loading = false;
    }
  };

  /**
   * 获取指定账单的收款记录
   */
  const fetchMyBillingPayments = async (billingId: string, refresh = false) => {
    if (state.value.loading) return;

    try {
      await userStore.ensureActiveSession({ refreshIfNearExpiry: true });
    } catch (error) {
      throw error;
    }

    state.value.loading = true;
    state.value.error = null;

    if (refresh) {
      state.value.billingPayments = [];
      state.value.billingPaymentsPage = 1;
      state.value.billingPaymentsHasMore = true;
    }

    try {
      const query: BillingPaymentQuery = {
        limit: DEFAULT_PAGE_SIZE,
        page: state.value.billingPaymentsPage,
        fields: BILLING_PAYMENT_FIELDS,
        sort: ["-paid_at"],
        filter: {
          billing_id: { _eq: billingId },
        },
      };

      const response = await billingPaymentsApi.readMany(query) as any;
      const items = (Array.isArray(response?.data) ? response.data : []) as BillingPayment[];

      if (refresh) {
        state.value.billingPayments = items;
      } else {
        state.value.billingPayments = [...state.value.billingPayments, ...items];
      }

      state.value.billingPaymentsPage += 1;
      state.value.billingPaymentsHasMore = items.length >= DEFAULT_PAGE_SIZE;

      return items;
    } catch (error) {
      state.value.error = (error as Error)?.message ?? "加载收款记录失败";
      throw error;
    } finally {
      state.value.loading = false;
    }
  };

  /**
   * 获取社区公共收益
   */
  const fetchCommunityIncomes = async (refresh = false) => {
    if (state.value.loading) return;

    try {
      await userStore.ensureActiveSession({ refreshIfNearExpiry: true });
    } catch (error) {
      throw error;
    }

    const communityId = userStore.community?.id;
    if (!communityId) {
      throw new Error("无法获取社区信息");
    }

    state.value.loading = true;
    state.value.error = null;

    if (refresh) {
      state.value.incomes = [];
      state.value.incomesPage = 1;
      state.value.incomesHasMore = true;
    }

    try {
      const query: IncomeQuery = {
        limit: DEFAULT_PAGE_SIZE,
        page: state.value.incomesPage,
        fields: INCOME_FIELDS,
        sort: ["-income_date"],
        filter: {
          community_id: { _eq: communityId },
        },
      };

      const response = await incomesApi.readMany(query) as any;
      const items = (Array.isArray(response?.data) ? response.data : []) as Income[];

      if (refresh) {
        state.value.incomes = items;
      } else {
        state.value.incomes = [...state.value.incomes, ...items];
      }

      state.value.incomesPage += 1;
      state.value.incomesHasMore = items.length >= DEFAULT_PAGE_SIZE;

      return items;
    } catch (error) {
      state.value.error = (error as Error)?.message ?? "加载公共收益数据失败";
      throw error;
    } finally {
      state.value.loading = false;
    }
  };

  /**
   * 录入收款记录（物业费实收）
   */
  const createBillingPayment = async (data: Partial<BillingPayment>) => {
    try {
      await userStore.ensureActiveSession({ refreshIfNearExpiry: true });
      const result = await billingPaymentsApi.createOne(data);

      // 刷新账单列表（更新paid_amount）
      await fetchMyBillings(true);

      return result;
    } catch (error) {
      throw error;
    }
  };

  /**
   * 录入公共收益
   */
  const createIncome = async (data: Partial<Income>) => {
    try {
      await userStore.ensureActiveSession({ refreshIfNearExpiry: true });
      const result = await incomesApi.createOne(data);

      // 刷新公共收益列表
      await fetchCommunityIncomes(true);

      return result;
    } catch (error) {
      throw error;
    }
  };

  /**
   * 根据账期获取物业费实收（权责发生制）
   * @param periods 账期数组，如 ['2025-01', '2025-02']
   */
  const fetchBillingPaymentsByPeriods = async (periods: string[]) => {
    try {
      await userStore.ensureActiveSession({ refreshIfNearExpiry: true });
    } catch (error) {
      throw error;
    }

    const communityId = userStore.community?.id;
    if (!communityId) {
      throw new Error("无法获取社区信息");
    }

    try {
      const query: BillingPaymentQuery = {
        fields: BILLING_PAYMENT_FIELDS,
        filter: {
          community_id: { _eq: communityId },
          period: { _in: periods },
        },
        limit: -1, // 获取所有数据
      };

      const response = await billingPaymentsApi.readMany(query) as any;
      // API 直接返回数组，不是 { data: [...] } 格式
      return (Array.isArray(response) ? response : []) as BillingPayment[];
    } catch (error) {
      throw error;
    }
  };

  /**
   * 根据账期获取公共收益
   * @param periods 账期数组，如 ['2025-01', '2025-02']
   */
  const fetchIncomesByPeriods = async (periods: string[]) => {
    try {
      await userStore.ensureActiveSession({ refreshIfNearExpiry: true });
    } catch (error) {
      throw error;
    }

    const communityId = userStore.community?.id;
    if (!communityId) {
      throw new Error("无法获取社区信息");
    }

    try {
      const query: IncomeQuery = {
        fields: INCOME_FIELDS,
        filter: {
          community_id: { _eq: communityId },
          period: { _in: periods },
        },
        limit: -1, // 获取所有数据
      };

      const response = await incomesApi.readMany(query) as any;
      // API 直接返回数组，不是 { data: [...] } 格式
      return (Array.isArray(response) ? response : []) as Income[];
    } catch (error) {
      throw error;
    }
  };

  // ============================================================
  // Actions - Expense Related
  // ============================================================

  /**
   * 获取社区支出记录
   */
  const fetchCommunityExpenses = async (refresh = false) => {
    if (state.value.loading) return;

    try {
      await userStore.ensureActiveSession({ refreshIfNearExpiry: true });
    } catch (error) {
      throw error;
    }

    const communityId = userStore.community?.id;
    if (!communityId) {
      throw new Error("无法获取社区信息");
    }

    state.value.loading = true;
    state.value.error = null;

    if (refresh) {
      state.value.expenses = [];
      state.value.expensesPage = 1;
      state.value.expensesHasMore = true;
    }

    try {
      const query: ExpenseQuery = {
        limit: DEFAULT_PAGE_SIZE,
        page: state.value.expensesPage,
        fields: EXPENSE_FIELDS,
        sort: ["-paid_at"],
        filter: {
          community_id: { _eq: communityId },
        },
      };

      const response = await expensesApi.readMany(query) as any;
      const items = (Array.isArray(response?.data) ? response.data : []) as Expense[];

      if (refresh) {
        state.value.expenses = items;
      } else {
        state.value.expenses = [...state.value.expenses, ...items];
      }

      state.value.expensesPage += 1;
      state.value.expensesHasMore = items.length >= DEFAULT_PAGE_SIZE;

      return items;
    } catch (error) {
      state.value.error = (error as Error)?.message ?? "加载支出数据失败";
      throw error;
    } finally {
      state.value.loading = false;
    }
  };

  /**
   * 获取员工列表
   */
  const fetchEmployees = async (refresh = false) => {
    if (state.value.loading) return;

    try {
      await userStore.ensureActiveSession({ refreshIfNearExpiry: true });
    } catch (error) {
      throw error;
    }

    const communityId = userStore.community?.id;
    if (!communityId) {
      throw new Error("无法获取社区信息");
    }

    state.value.loading = true;
    state.value.error = null;

    if (refresh) {
      state.value.employees = [];
      state.value.employeesPage = 1;
      state.value.employeesHasMore = true;
    }

    try {
      const query: EmployeeQuery = {
        limit: DEFAULT_PAGE_SIZE,
        page: state.value.employeesPage,
        fields: EMPLOYEE_FIELDS,
        sort: ["-date_created"],
        filter: {
          community_id: { _eq: communityId },
        },
      };

      const response = await employeesApi.readMany(query) as any;
      const items = (Array.isArray(response?.data) ? response.data : []) as Employee[];

      if (refresh) {
        state.value.employees = items;
      } else {
        state.value.employees = [...state.value.employees, ...items];
      }

      state.value.employeesPage += 1;
      state.value.employeesHasMore = items.length >= DEFAULT_PAGE_SIZE;

      return items;
    } catch (error) {
      state.value.error = (error as Error)?.message ?? "加载员工数据失败";
      throw error;
    } finally {
      state.value.loading = false;
    }
  };

  /**
   * 获取指定月份的工资记录
   */
  const fetchSalaryRecords = async (period: string, refresh = false) => {
    if (state.value.loading) return;

    try {
      await userStore.ensureActiveSession({ refreshIfNearExpiry: true });
    } catch (error) {
      throw error;
    }

    const communityId = userStore.community?.id;
    if (!communityId) {
      throw new Error("无法获取社区信息");
    }

    state.value.loading = true;
    state.value.error = null;

    if (refresh) {
      state.value.salaryRecords = [];
      state.value.salaryRecordsPage = 1;
      state.value.salaryRecordsHasMore = true;
    }

    try {
      const query: SalaryRecordQuery = {
        limit: DEFAULT_PAGE_SIZE,
        page: state.value.salaryRecordsPage,
        fields: SALARY_RECORD_FIELDS,
        sort: ["-payment_date"],
        filter: {
          community_id: { _eq: communityId },
          period: { _eq: period },
        },
      };

      const response = await salaryRecordsApi.readMany(query) as any;
      const items = (Array.isArray(response?.data) ? response.data : []) as SalaryRecord[];

      if (refresh) {
        state.value.salaryRecords = items;
      } else {
        state.value.salaryRecords = [...state.value.salaryRecords, ...items];
      }

      state.value.salaryRecordsPage += 1;
      state.value.salaryRecordsHasMore = items.length >= DEFAULT_PAGE_SIZE;

      return items;
    } catch (error) {
      state.value.error = (error as Error)?.message ?? "加载工资记录失败";
      throw error;
    } finally {
      state.value.loading = false;
    }
  };

  /**
   * 录入支出记录
   */
  const createExpense = async (data: Partial<Expense>) => {
    try {
      await userStore.ensureActiveSession({ refreshIfNearExpiry: true });
      const result = await expensesApi.createOne(data);

      // 刷新支出列表
      await fetchCommunityExpenses(true);

      return result;
    } catch (error) {
      throw error;
    }
  };

  /**
   * 添加员工
   */
  const createEmployee = async (data: Partial<Employee>) => {
    try {
      await userStore.ensureActiveSession({ refreshIfNearExpiry: true });
      const result = await employeesApi.createOne(data);

      // 刷新员工列表
      await fetchEmployees(true);

      return result;
    } catch (error) {
      throw error;
    }
  };

  /**
   * 批量录入工资（一个月的所有员工工资）
   */
  const createSalaryRecords = async (records: Partial<SalaryRecord>[]) => {
    try {
      await userStore.ensureActiveSession({ refreshIfNearExpiry: true });

      // 批量创建工资记录
      const results = await Promise.all(
        records.map((record) => salaryRecordsApi.createOne(record))
      );

      // 刷新工资记录列表（使用第一条记录的period）
      if (records.length > 0 && records[0].period) {
        await fetchSalaryRecords(records[0].period, true);
      }

      return results;
    } catch (error) {
      throw error;
    }
  };

  /**
   * 根据账期获取支出记录
   * @param periods 账期数组，如 ['2025-01', '2025-02']
   */
  const fetchExpensesByPeriods = async (periods: string[]) => {
    try {
      await userStore.ensureActiveSession({ refreshIfNearExpiry: true });
    } catch (error) {
      throw error;
    }

    const communityId = userStore.community?.id;
    if (!communityId) {
      throw new Error("无法获取社区信息");
    }

    try {
      const query: ExpenseQuery = {
        fields: EXPENSE_FIELDS,
        filter: {
          community_id: { _eq: communityId },
          period: { _in: periods },
          status: { _eq: "approved" }, // 只统计已审核的支出
        },
        limit: -1, // 获取所有数据
      };

      const response = await expensesApi.readMany(query) as any;
      // API 直接返回数组，不是 { data: [...] } 格式
      return (Array.isArray(response) ? response : []) as Expense[];
    } catch (error) {
      throw error;
    }
  };

  /**
   * 计算指定账期的财务汇总（权责发生制）
   * @param periods 账期数组，如 ['2025-01', '2025-02']
   * @returns 财务汇总数据
   */
  const calculateFinancialSummary = async (periods: string[]) => {
    try {
      // 并行获取三类数据
      const [billingPayments, incomes, expenses] = await Promise.all([
        fetchBillingPaymentsByPeriods(periods),
        fetchIncomesByPeriods(periods),
        fetchExpensesByPeriods(periods),
      ]);

      // 计算物业费实收
      const propertyFeeIncome = billingPayments.reduce(
        (sum, payment) => sum + Number(payment.amount || 0),
        0
      );

      // 计算公共收益
      const publicIncome = incomes.reduce(
        (sum, income) => sum + Number(income.amount || 0),
        0
      );

      // 计算总收入
      const totalIncome = propertyFeeIncome + publicIncome;

      // 计算总支出
      const totalExpense = expenses.reduce(
        (sum, expense) => sum + Number(expense.amount || 0),
        0
      );

      // 计算结余
      const balance = totalIncome - totalExpense;

      // 按类型分组公共收益
      const incomesByType = new Map<string, { type: string; total: number; count: number }>();
      incomes.forEach((income) => {
        const type = income.income_type;
        if (!incomesByType.has(type)) {
          incomesByType.set(type, { type, total: 0, count: 0 });
        }
        const group = incomesByType.get(type)!;
        group.total += Number(income.amount || 0);
        group.count += 1;
      });

      // 按类型分组支出
      const expensesByType = new Map<string, { type: string; total: number; count: number }>();
      expenses.forEach((expense) => {
        const type = expense.expense_type;
        if (!expensesByType.has(type)) {
          expensesByType.set(type, { type, total: 0, count: 0 });
        }
        const group = expensesByType.get(type)!;
        group.total += Number(expense.amount || 0);
        group.count += 1;
      });

      return {
        // 汇总数据
        propertyFeeIncome,
        publicIncome,
        totalIncome,
        totalExpense,
        balance,

        // 分组数据
        incomesByType: Array.from(incomesByType.values()),
        expensesByType: Array.from(expensesByType.values()),

        // 原始数据
        billingPayments,
        incomes,
        expenses,
      };
    } catch (error) {
      throw error;
    }
  };

  // ============================================================
  // Actions - Maintenance Fund Related
  // ============================================================

  /**
   * 获取我的维修基金账户
   */
  const fetchMyMFAccount = async () => {
    try {
      await userStore.ensureActiveSession({ refreshIfNearExpiry: true });
    } catch (error) {
      throw error;
    }

    const userId = userStore.profile?.id;
    if (!userId) {
      throw new Error("用户未登录");
    }

    state.value.loading = true;
    state.value.error = null;

    try {
      const query: MaintenanceFundAccountQuery = {
        fields: MAINTENANCE_FUND_ACCOUNT_FIELDS,
        filter: {
          owner_id: { _eq: userId },
        },
        limit: 1,
      };

      const response = await maintenanceFundAccountsApi.readMany(query) as any;
      const items = (Array.isArray(response?.data) ? response.data : []) as MaintenanceFundAccount[];

      // 只有一个账户，直接设置
      if (items.length > 0) {
        state.value.maintenanceFundAccounts = items;
      } else {
        state.value.maintenanceFundAccounts = [];
      }

      return items[0] || null;
    } catch (error) {
      state.value.error = (error as Error)?.message ?? "加载维修基金账户失败";
      throw error;
    } finally {
      state.value.loading = false;
    }
  };

  /**
   * 获取我的维修基金缴纳记录
   */
  const fetchMyMFPayments = async (refresh = false) => {
    try {
      await userStore.ensureActiveSession({ refreshIfNearExpiry: true });
    } catch (error) {
      throw error;
    }

    const userId = userStore.profile?.id;
    if (!userId) {
      throw new Error("用户未登录");
    }

    state.value.loading = true;
    state.value.error = null;

    if (refresh) {
      state.value.maintenanceFundPayments = [];
      state.value.maintenanceFundPaymentsPage = 1;
      state.value.maintenanceFundPaymentsHasMore = true;
    }

    try {
      const query: MaintenanceFundPaymentQuery = {
        limit: DEFAULT_PAGE_SIZE,
        page: state.value.maintenanceFundPaymentsPage,
        fields: MAINTENANCE_FUND_PAYMENT_FIELDS,
        sort: ["-paid_at"],
        filter: {
          owner_id: { _eq: userId },
        },
      };

      const response = await maintenanceFundPaymentsApi.readMany(query) as any;
      const items = (Array.isArray(response?.data) ? response.data : []) as MaintenanceFundPayment[];

      if (refresh) {
        state.value.maintenanceFundPayments = items;
      } else {
        state.value.maintenanceFundPayments = [...state.value.maintenanceFundPayments, ...items];
      }

      state.value.maintenanceFundPaymentsPage += 1;
      state.value.maintenanceFundPaymentsHasMore = items.length >= DEFAULT_PAGE_SIZE;

      return items;
    } catch (error) {
      state.value.error = (error as Error)?.message ?? "加载维修基金缴纳记录失败";
      throw error;
    } finally {
      state.value.loading = false;
    }
  };

  /**
   * 获取社区维修基金使用记录
   */
  const fetchCommunityMFUsage = async (refresh = false) => {
    try {
      await userStore.ensureActiveSession({ refreshIfNearExpiry: true });
    } catch (error) {
      throw error;
    }

    const communityId = userStore.community?.id;
    if (!communityId) {
      throw new Error("无法获取社区信息");
    }

    state.value.loading = true;
    state.value.error = null;

    if (refresh) {
      state.value.maintenanceFundUsage = [];
      state.value.maintenanceFundUsagePage = 1;
      state.value.maintenanceFundUsageHasMore = true;
    }

    try {
      const query: MaintenanceFundUsageQuery = {
        limit: DEFAULT_PAGE_SIZE,
        page: state.value.maintenanceFundUsagePage,
        fields: MAINTENANCE_FUND_USAGE_FIELDS,
        sort: ["-date_created"],
        filter: {
          community_id: { _eq: communityId },
        },
      };

      const response = await maintenanceFundUsageApi.readMany(query) as any;
      const items = (Array.isArray(response?.data) ? response.data : []) as MaintenanceFundUsage[];

      if (refresh) {
        state.value.maintenanceFundUsage = items;
      } else {
        state.value.maintenanceFundUsage = [...state.value.maintenanceFundUsage, ...items];
      }

      state.value.maintenanceFundUsagePage += 1;
      state.value.maintenanceFundUsageHasMore = items.length >= DEFAULT_PAGE_SIZE;

      return items;
    } catch (error) {
      state.value.error = (error as Error)?.message ?? "加载维修基金使用记录失败";
      throw error;
    } finally {
      state.value.loading = false;
    }
  };

  /**
   * 录入维修基金缴纳记录
   */
  const createMFPayment = async (data: Partial<MaintenanceFundPayment>) => {
    try {
      await userStore.ensureActiveSession({ refreshIfNearExpiry: true });
      const result = await maintenanceFundPaymentsApi.createOne(data);

      // 刷新账户和缴纳记录
      await fetchMyMFAccount();
      await fetchMyMFPayments(true);

      return result;
    } catch (error) {
      throw error;
    }
  };

  /**
   * 创建维修基金使用记录（关联工单）
   */
  const createMFUsage = async (data: Partial<MaintenanceFundUsage>) => {
    try {
      await userStore.ensureActiveSession({ refreshIfNearExpiry: true });
      const result = await maintenanceFundUsageApi.createOne(data);

      // 刷新使用记录
      await fetchCommunityMFUsage(true);

      return result;
    } catch (error) {
      throw error;
    }
  };

  /**
   * 审批维修基金使用申请（业委会专用）
   */
  const approveMFUsage = async (
    id: string,
    data: {
      approval_status: "approved" | "rejected";
      rejection_reason?: string;
      approved_by?: string;
      approved_at?: string;
    }
  ) => {
    try {
      await userStore.ensureActiveSession({ refreshIfNearExpiry: true });
      const result = await maintenanceFundUsageApi.updateOne(id, data);

      // 刷新使用记录
      await fetchCommunityMFUsage(true);

      return result;
    } catch (error) {
      throw error;
    }
  };

  // ============================================================
  // Actions - Reset
  // ============================================================

  const reset = () => {
    // Reset billings
    state.value.billings = [];
    state.value.billingsPage = 1;
    state.value.billingsHasMore = true;

    // Reset billing payments
    state.value.billingPayments = [];
    state.value.billingPaymentsPage = 1;
    state.value.billingPaymentsHasMore = true;

    // Reset incomes
    state.value.incomes = [];
    state.value.incomesPage = 1;
    state.value.incomesHasMore = true;

    // Reset expenses
    state.value.expenses = [];
    state.value.expensesPage = 1;
    state.value.expensesHasMore = true;

    // Reset employees
    state.value.employees = [];
    state.value.employeesPage = 1;
    state.value.employeesHasMore = true;

    // Reset salary records
    state.value.salaryRecords = [];
    state.value.salaryRecordsPage = 1;
    state.value.salaryRecordsHasMore = true;

    // Reset maintenance fund accounts
    state.value.maintenanceFundAccounts = [];
    state.value.maintenanceFundAccountsPage = 1;
    state.value.maintenanceFundAccountsHasMore = true;

    // Reset maintenance fund payments
    state.value.maintenanceFundPayments = [];
    state.value.maintenanceFundPaymentsPage = 1;
    state.value.maintenanceFundPaymentsHasMore = true;

    // Reset maintenance fund usage
    state.value.maintenanceFundUsage = [];
    state.value.maintenanceFundUsagePage = 1;
    state.value.maintenanceFundUsageHasMore = true;

    // Reset state management
    state.value.loading = false;
    state.value.error = null;
    state.value.initialized = false;
  };

  // ============================================================
  // Return Store Interface
  // ============================================================

  return {
    // State (as computed refs for reactivity)
    billings: computed(() => state.value.billings),
    billingPayments: computed(() => state.value.billingPayments),
    incomes: computed(() => state.value.incomes),
    expenses: computed(() => state.value.expenses),
    employees: computed(() => state.value.employees),
    salaryRecords: computed(() => state.value.salaryRecords),
    maintenanceFundAccounts: computed(() => state.value.maintenanceFundAccounts),
    maintenanceFundPayments: computed(() => state.value.maintenanceFundPayments),
    maintenanceFundUsage: computed(() => state.value.maintenanceFundUsage),

    // Pagination state
    billingsHasMore: computed(() => state.value.billingsHasMore),
    billingPaymentsHasMore: computed(() => state.value.billingPaymentsHasMore),
    incomesHasMore: computed(() => state.value.incomesHasMore),
    expensesHasMore: computed(() => state.value.expensesHasMore),
    employeesHasMore: computed(() => state.value.employeesHasMore),
    salaryRecordsHasMore: computed(() => state.value.salaryRecordsHasMore),
    maintenanceFundAccountsHasMore: computed(() => state.value.maintenanceFundAccountsHasMore),
    maintenanceFundPaymentsHasMore: computed(() => state.value.maintenanceFundPaymentsHasMore),
    maintenanceFundUsageHasMore: computed(() => state.value.maintenanceFundUsageHasMore),

    // Basic getters
    loading,
    error,
    initialized,

    // Income-related getters
    totalPropertyFeeIncome,
    totalPublicIncome,
    totalIncome,
    incomesByType,
    myBillings,
    myTotalBilling,
    myTotalPaid,
    myTotalUnpaid,

    // Expense-related getters
    totalExpense,
    expensesByType,
    balance,
    employeesByPosition,

    // Maintenance fund getters
    myMFAccount,
    myMFBalance,
    totalMFBalance,

    // Income-related actions
    fetchMyBillings,
    fetchMyBillingPayments,
    fetchCommunityIncomes,
    createBillingPayment,
    createIncome,
    fetchBillingPaymentsByPeriods,
    fetchIncomesByPeriods,

    // Expense-related actions
    fetchCommunityExpenses,
    fetchEmployees,
    fetchSalaryRecords,
    createExpense,
    createEmployee,
    createSalaryRecords,
    fetchExpensesByPeriods,

    // Financial summary
    calculateFinancialSummary,

    // Maintenance fund actions
    fetchMyMFAccount,
    fetchMyMFPayments,
    fetchCommunityMFUsage,
    createMFPayment,
    createMFUsage,
    approveMFUsage,

    // Actions
    reset,
  };
});

export default useFinanceStore;
