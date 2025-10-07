import {
  createDirectus,
  rest,
  authentication,
  readItems,
  readItem,
  createItem,
  updateItem,
  deleteItem,
  registerUser,
  type Query,
  type QueryItem,
  type RegularCollections,
  type CollectionType,
} from "@directus/sdk";
import type { Schema } from "@/@types/directus-schema";
import env from "@/config/env";
import { createUniFetch } from "./uni-fetch";
import { MiniURL, MiniURLSearchParams } from "./url-polyfill-miniprogram";

const DIRECTUS_TOKEN_STORAGE_KEY = "directus_token";
const isUniAvailable = typeof uni !== "undefined";

function persistToken(token: string | null) {
  if (!isUniAvailable) return;
  if (token) {
    uni.setStorageSync(DIRECTUS_TOKEN_STORAGE_KEY, token);
  } else {
    uni.removeStorageSync(DIRECTUS_TOKEN_STORAGE_KEY);
  }
}

function readPersistedToken(): string | null {
  if (!isUniAvailable) return null;
  const stored = uni.getStorageSync(DIRECTUS_TOKEN_STORAGE_KEY);
  return typeof stored === "string" && stored ? stored : null;
}

const uniFetch = createUniFetch();

// ============================================
// 全局 Polyfill 注入（关键！）
// 必须同时注入到全局对象，因为其他库可能也需要这些 API
// ============================================
if (typeof globalThis !== "undefined") {
  if (!globalThis.URL) {
    (globalThis as any).URL = MiniURL;
  }
  if (!globalThis.URLSearchParams) {
    (globalThis as any).URLSearchParams = MiniURLSearchParams;
  }
}

// @ts-ignore - 微信小程序环境
if (typeof global !== "undefined") {
  if (!global.URL) {
    (global as any).URL = MiniURL;
  }
  if (!global.URLSearchParams) {
    (global as any).URLSearchParams = MiniURLSearchParams;
  }
}

// @ts-ignore - 可能存在的 window 对象
if (typeof window !== "undefined") {
  if (!window.URL) {
    (window as any).URL = MiniURL;
  }
  if (!window.URLSearchParams) {
    (window as any).URLSearchParams = MiniURLSearchParams;
  }
}
// ============================================

// 使用 Directus 官方推荐的 globals 选项传递 polyfills
// 参考：https://directus.io/docs/guides/connect/sdk
// 注意：这个 globals 只对 Directus SDK 内部有效，所以上面的全局注入仍然必要
const directus = createDirectus<Schema>(env.directusUrl, {
  globals: {
    fetch: uniFetch,
    URL: MiniURL as any, // 传递我们的 URL polyfill
    URLSearchParams: MiniURLSearchParams as any, // 传递 URLSearchParams polyfill
  },
})
  .with(rest())
  .with(authentication("json"));

const persistedToken = readPersistedToken();
if (persistedToken) {
  void directus.setToken(persistedToken);
}

export function handleDirectusError(error: any): never {
  const message =
    error?.errors?.[0]?.message ||
    error?.data?.errors?.[0]?.message ||
    error?.message ||
    "请求失败";

  if (isUniAvailable) {
    uni.showToast({ title: String(message), icon: "none" });
  }

  throw error;
}

function withErrorHandling<T>(promise: Promise<T>): Promise<T> {
  return promise.catch((error) => handleDirectusError(error));
}

type Collection = RegularCollections<Schema>;
type CollectionArray<C extends Collection> = Schema[C];
type CollectionItem<C extends Collection> = CollectionType<Schema, C>;
type ReadQuery<C extends Collection> = Query<Schema, CollectionItem<C>>;
type MutationQuery<C extends Collection> = Query<Schema, CollectionArray<C>>;
type ItemQuery<C extends Collection> = QueryItem<Schema, CollectionItem<C>>;

export const createCollectionApi = <C extends Collection>(collection: C) => ({
  readMany: <const TQuery extends ReadQuery<C>>(query?: TQuery) =>
    withErrorHandling(
      directus.request(readItems<Schema, C, TQuery>(collection, query))
    ),
  readOne: <const TQuery extends ItemQuery<C>>(
    id: string | number,
    query?: TQuery
  ) =>
    withErrorHandling(
      directus.request(readItem<Schema, C, TQuery>(collection, id, query))
    ),
  createOne: <const TQuery extends MutationQuery<C>>(
    payload: Partial<CollectionItem<C>>,
    query?: TQuery
  ) =>
    withErrorHandling(
      directus.request(
        createItem<Schema, C, TQuery>(collection, payload, query)
      )
    ),
  updateOne: <const TQuery extends MutationQuery<C>>(
    id: string | number,
    payload: Partial<CollectionItem<C>>,
    query?: TQuery
  ) =>
    withErrorHandling(
      directus.request(
        updateItem<Schema, C, TQuery>(collection, id, payload, query)
      )
    ),
  deleteOne: (id: string | number) =>
    withErrorHandling(directus.request(deleteItem(collection, id))),
});

export const postsApi = createCollectionApi("posts");
export const workOrdersApi = createCollectionApi("work_orders");
export const commentsApi = createCollectionApi("comments");
export const communitiesApi = createCollectionApi("communities");
export const buildingsApi = createCollectionApi("buildings");

// Finance v2.0 API (will be added in Phase 2, Task 2.2)
// export const billingsApi = createCollectionApi("billings");
// export const billingPaymentsApi = createCollectionApi("billing_payments");
// export const incomesApi = createCollectionApi("incomes");
// export const expensesApi = createCollectionApi("expenses");
// export const employeesApi = createCollectionApi("employees");
// export const salaryRecordsApi = createCollectionApi("salary_records");
// export const maintenanceFundAccountsApi = createCollectionApi("maintenance_fund_accounts");
// export const maintenanceFundPaymentsApi = createCollectionApi("maintenance_fund_payments");
// export const maintenanceFundUsageApi = createCollectionApi("maintenance_fund_usage");

export function setAuthToken(token: string | null) {
  persistToken(token);
  return directus.setToken(token ?? null);
}

export function getAuthToken() {
  return directus.getToken();
}

export const directusClient = directus;
export const registerDirectusUser = (
  email: string,
  password: string,
  options?: Parameters<typeof registerUser>[2]
) => directus.request(registerUser(email, password, options));
export default directus;

export type {
  Schema,
  Announcement,
  Post,
  WorkOrder,
  Comment,
  // Finance v2.0 types will be added in Phase 2
  // Billing,
  // BillingPayment,
  // Income,
  // Expense,
  // Employee,
  // SalaryRecord,
  // MaintenanceFundAccount,
  // MaintenanceFundPayment,
  // MaintenanceFundUsage,
} from "@/@types/directus-schema";
