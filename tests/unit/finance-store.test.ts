import { beforeEach, describe, expect, it, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useFinanceStore } from "@/store/finance";
import { useUserStore } from "@/store/user";
import type {
  Billing,
  BillingPayment,
  Income,
  Expense,
  Employee,
  MaintenanceFundAccount,
} from "@/@types/directus-schema";

// Mock Directus API
vi.mock("@/utils/directus", () => ({
  billingsApi: {
    readMany: vi.fn(),
    createOne: vi.fn(),
    updateOne: vi.fn(),
  },
  billingPaymentsApi: {
    readMany: vi.fn(),
    createOne: vi.fn(),
  },
  incomesApi: {
    readMany: vi.fn(),
    createOne: vi.fn(),
  },
  expensesApi: {
    readMany: vi.fn(),
    createOne: vi.fn(),
  },
  employeesApi: {
    readMany: vi.fn(),
    createOne: vi.fn(),
  },
  salaryRecordsApi: {
    readMany: vi.fn(),
    createOne: vi.fn(),
  },
  maintenanceFundAccountsApi: {
    readMany: vi.fn(),
  },
  maintenanceFundPaymentsApi: {
    readMany: vi.fn(),
    createOne: vi.fn(),
  },
  maintenanceFundUsageApi: {
    readMany: vi.fn(),
    createOne: vi.fn(),
    updateOne: vi.fn(),
  },
}));

describe("Finance Store v2.0", () => {
  let financeStore: ReturnType<typeof useFinanceStore>;
  let userStore: ReturnType<typeof useUserStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    financeStore = useFinanceStore();
    userStore = useUserStore();

    // Mock user session
    vi.spyOn(userStore, "ensureActiveSession").mockResolvedValue(undefined);
    userStore.profile = {
      id: "user-123",
      first_name: "Test",
      last_name: "User",
    } as any;
    userStore.community = {
      id: "community-123",
      name: "Test Community",
    } as any;
  });

  describe("Basic State", () => {
    it("should initialize with empty state", () => {
      expect(financeStore.billings).toEqual([]);
      expect(financeStore.billingPayments).toEqual([]);
      expect(financeStore.incomes).toEqual([]);
      expect(financeStore.expenses).toEqual([]);
      expect(financeStore.employees).toEqual([]);
      expect(financeStore.salaryRecords).toEqual([]);
      expect(financeStore.maintenanceFundAccounts).toEqual([]);
      expect(financeStore.maintenanceFundPayments).toEqual([]);
      expect(financeStore.maintenanceFundUsage).toEqual([]);
      expect(financeStore.loading).toBe(false);
      expect(financeStore.error).toBe(null);
      expect(financeStore.initialized).toBe(false);
    });

    it("should reset all state", () => {
      // Use $patch to set state
      financeStore.$patch((state: any) => {
        state.billings = [{ id: "1" }];
        state.loading = true;
        state.initialized = true;
      });

      // Verify state is set
      expect(financeStore.billings).toEqual([{ id: "1" }]);

      // Reset
      financeStore.reset();

      // Verify reset
      expect(financeStore.billings).toEqual([]);
      expect(financeStore.loading).toBe(false);
      expect(financeStore.initialized).toBe(false);
    });
  });

  describe("Income-Related Getters", () => {
    it("should calculate totalPropertyFeeIncome correctly", () => {
      const mockPayments: Partial<BillingPayment>[] = [
        { id: "1", amount: 500 },
        { id: "2", amount: 300 },
        { id: "3", amount: 200 },
      ];
      financeStore.$patch((state: any) => {
        state.billingPayments = mockPayments;
      });

      expect(financeStore.totalPropertyFeeIncome).toBe(1000);
    });

    it("should calculate totalPublicIncome correctly", () => {
      const mockIncomes: Partial<Income>[] = [
        { id: "1", amount: 1000, income_type: "advertising" },
        { id: "2", amount: 500, income_type: "parking" },
      ];
      financeStore.$patch((state: any) => {
        state.incomes = mockIncomes;
      });

      expect(financeStore.totalPublicIncome).toBe(1500);
    });

    it("should calculate totalIncome correctly", () => {
      const mockPayments: Partial<BillingPayment>[] = [
        { id: "1", amount: 500 },
      ];
      const mockIncomes: Partial<Income>[] = [
        { id: "1", amount: 300, income_type: "parking" },
      ];
      financeStore.$patch((state: any) => {
        state.billingPayments = mockPayments;
        state.incomes = mockIncomes;
      });

      expect(financeStore.totalIncome).toBe(800);
    });

    it("should group incomes by type", () => {
      const mockIncomes: Partial<Income>[] = [
        { id: "1", amount: 1000, income_type: "advertising" },
        { id: "2", amount: 500, income_type: "advertising" },
        { id: "3", amount: 300, income_type: "parking" },
      ];
      financeStore.$patch((state: any) => {
        state.incomes = mockIncomes;
      });

      const grouped = financeStore.incomesByType;
      expect(grouped).toHaveLength(2);
      expect(grouped.find((g) => g.type === "advertising")?.total).toBe(1500);
      expect(grouped.find((g) => g.type === "parking")?.total).toBe(300);
    });

    it("should filter myBillings by current user", () => {
      const mockBillings: Partial<Billing>[] = [
        { id: "1", owner_id: "user-123", billing_amount: 500 },
        { id: "2", owner_id: "user-456", billing_amount: 300 },
        { id: "3", owner_id: "user-123", billing_amount: 200 },
      ];
      financeStore.$patch((state: any) => {
        state.billings = mockBillings;
      });

      expect(financeStore.myBillings).toHaveLength(2);
      expect(financeStore.myTotalBilling).toBe(700);
    });

    it("should calculate myTotalPaid correctly", () => {
      const mockBillings: Partial<Billing>[] = [
        {
          id: "1",
          owner_id: "user-123",
          billing_amount: 500,
          paid_amount: 300,
        },
        {
          id: "2",
          owner_id: "user-123",
          billing_amount: 200,
          paid_amount: 200,
        },
      ];
      financeStore.$patch((state: any) => {
        state.billings = mockBillings;
      });

      expect(financeStore.myTotalPaid).toBe(500);
      expect(financeStore.myTotalUnpaid).toBe(200);
    });
  });

  describe("Expense-Related Getters", () => {
    it("should calculate totalExpense correctly (only approved)", () => {
      const mockExpenses: Partial<Expense>[] = [
        { id: "1", amount: 1000, status: "approved", expense_type: "salary" },
        { id: "2", amount: 500, status: "pending", expense_type: "utilities" },
        { id: "3", amount: 300, status: "approved", expense_type: "maintenance" },
      ];
      financeStore.$patch((state: any) => {
        state.expenses = mockExpenses;
      });

      expect(financeStore.totalExpense).toBe(1300);
    });

    it("should group expenses by type", () => {
      const mockExpenses: Partial<Expense>[] = [
        { id: "1", amount: 1000, status: "approved", expense_type: "salary" },
        { id: "2", amount: 500, status: "approved", expense_type: "salary" },
        { id: "3", amount: 300, status: "approved", expense_type: "utilities" },
      ];
      financeStore.$patch((state: any) => {
        state.expenses = mockExpenses;
      });

      const grouped = financeStore.expensesByType;
      expect(grouped).toHaveLength(2);
      expect(grouped.find((g) => g.type === "salary")?.total).toBe(1500);
      expect(grouped.find((g) => g.type === "utilities")?.total).toBe(300);
    });

    it("should calculate balance correctly", () => {
      const mockPayments: Partial<BillingPayment>[] = [
        { id: "1", amount: 1000 },
      ];
      const mockIncomes: Partial<Income>[] = [
        { id: "1", amount: 500, income_type: "parking" },
      ];
      const mockExpenses: Partial<Expense>[] = [
        { id: "1", amount: 800, status: "approved", expense_type: "salary" },
      ];
      financeStore.$patch((state: any) => {
        state.billingPayments = mockPayments;
        state.incomes = mockIncomes;
        state.expenses = mockExpenses;
      });

      // totalIncome = 1000 + 500 = 1500
      // totalExpense = 800
      // balance = 1500 - 800 = 700
      expect(financeStore.balance).toBe(700);
    });

    it("should group employees by position", () => {
      const mockEmployees: Partial<Employee>[] = [
        { id: "1", position_type: "security", employment_status: "active" },
        { id: "2", position_type: "security", employment_status: "active" },
        { id: "3", position_type: "cleaning", employment_status: "active" },
        { id: "4", position_type: "security", employment_status: "resigned" },
      ];
      financeStore.$patch((state: any) => {
        state.employees = mockEmployees;
      });

      const grouped = financeStore.employeesByPosition;
      expect(grouped).toHaveLength(2);
      expect(grouped.find((g) => g.position === "security")?.count).toBe(2);
      expect(grouped.find((g) => g.position === "cleaning")?.count).toBe(1);
    });
  });

  describe("Maintenance Fund Getters", () => {
    it("should find myMFAccount by user ID", () => {
      const mockAccounts: Partial<MaintenanceFundAccount>[] = [
        { id: "1", owner_id: "user-123", balance: 5000 },
        { id: "2", owner_id: "user-456", balance: 3000 },
      ];
      financeStore.$patch((state: any) => {
        state.maintenanceFundAccounts = mockAccounts;
      });

      expect(financeStore.myMFAccount?.id).toBe("1");
      expect(financeStore.myMFBalance).toBe(5000);
    });

    it("should return 0 balance if no account found", () => {
      financeStore.$patch((state: any) => {
        state.maintenanceFundAccounts = [];
      });

      expect(financeStore.myMFAccount).toBeNull();
      expect(financeStore.myMFBalance).toBe(0);
    });

    it("should calculate totalMFBalance correctly", () => {
      const mockAccounts: Partial<MaintenanceFundAccount>[] = [
        { id: "1", owner_id: "user-123", balance: 5000 },
        { id: "2", owner_id: "user-456", balance: 3000 },
        { id: "3", owner_id: "user-789", balance: 2000 },
      ];
      financeStore.$patch((state: any) => {
        state.maintenanceFundAccounts = mockAccounts;
      });

      expect(financeStore.totalMFBalance).toBe(10000);
    });
  });

  describe("Pagination State", () => {
    it("should track pagination for all collections", () => {
      expect(financeStore.billingsHasMore).toBe(true);
      expect(financeStore.billingPaymentsHasMore).toBe(true);
      expect(financeStore.incomesHasMore).toBe(true);
      expect(financeStore.expensesHasMore).toBe(true);
      expect(financeStore.employeesHasMore).toBe(true);
      expect(financeStore.salaryRecordsHasMore).toBe(true);
      expect(financeStore.maintenanceFundAccountsHasMore).toBe(true);
      expect(financeStore.maintenanceFundPaymentsHasMore).toBe(true);
      expect(financeStore.maintenanceFundUsageHasMore).toBe(true);
    });
  });
});
