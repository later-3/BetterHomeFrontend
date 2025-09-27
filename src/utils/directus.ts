import {
  createDirectus,
  rest,
  authentication,
  readItems,
  readItem,
  createItem,
  updateItem,
  deleteItem,
  type Query,
  type QueryItem,
  type RegularCollections,
  type CollectionType
} from '@directus/sdk';
import type { Schema } from '@/@types/directus-schema';
import env from '@/config/env';
import { createUniFetch } from './uni-fetch';

const DIRECTUS_TOKEN_STORAGE_KEY = 'directus_token';
const isUniAvailable = typeof uni !== 'undefined';

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
  return typeof stored === 'string' && stored ? stored : null;
}

const uniFetch = createUniFetch();

const directus = createDirectus<Schema>(env.directusUrl, {
  globals: {
    fetch: uniFetch
  }
})
  .with(rest())
  .with(authentication('json'));

const persistedToken = readPersistedToken();
if (persistedToken) {
  void directus.setToken(persistedToken);
}

export function handleDirectusError(error: any): never {
  const message =
    error?.errors?.[0]?.message ||
    error?.data?.errors?.[0]?.message ||
    error?.message ||
    '请求失败';

  if (isUniAvailable) {
    uni.showToast({ title: String(message), icon: 'none' });
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
    withErrorHandling(directus.request(readItems<Schema, C, TQuery>(collection, query))),
  readOne: <const TQuery extends ItemQuery<C>>(id: string | number, query?: TQuery) =>
    withErrorHandling(directus.request(readItem<Schema, C, TQuery>(collection, id, query))),
  createOne: <const TQuery extends MutationQuery<C>>(payload: Partial<CollectionItem<C>>, query?: TQuery) =>
    withErrorHandling(directus.request(createItem<Schema, C, TQuery>(collection, payload, query))),
  updateOne: <const TQuery extends MutationQuery<C>>(id: string | number, payload: Partial<CollectionItem<C>>, query?: TQuery) =>
    withErrorHandling(directus.request(updateItem<Schema, C, TQuery>(collection, id, payload, query))),
  deleteOne: (id: string | number) => withErrorHandling(directus.request(deleteItem(collection, id)))
});

export const postsApi = createCollectionApi('posts');
export const workOrdersApi = createCollectionApi('work_orders');
export const commentsApi = createCollectionApi('comments');
export const communitiesApi = createCollectionApi('communities');
export const buildingsApi = createCollectionApi('buildings');

export function setAuthToken(token: string | null) {
  persistToken(token);
  return directus.setToken(token ?? null);
}

export function getAuthToken() {
  return directus.getToken();
}

export const directusClient = directus;

export default directus;

export type {
  Schema,
  Announcement,
  Post,
  WorkOrder,
  Comment
} from '@/@types/directus-schema';
