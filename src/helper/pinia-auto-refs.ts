// "https://github.com/Allen-1998/pinia-auto-refs"
/* eslint-disable */
/* prettier-ignore */
// @ts-nocheck
import type { AutoToRefs, ToRef } from 'vue'

import appStore from '@/store/app'
import financeStore from '@/store/finance'
import navigationStore from '@/store/navigation'
import setupStore from '@/store/setup'
import testStore from '@/store/test'
import userStore from '@/store/user'
import workOrdersStore from '@/store/workOrders'

import store from '@/store'

declare module 'vue' {
  export type AutoToRefs<T> = {
    [K in keyof T]: T[K] extends Function ? T[K] : ToRef<T[K]>
  }
}

const storeExports = {
  app: appStore,
  finance: financeStore,
  navigation: navigationStore,
  setup: setupStore,
  test: testStore,
  user: userStore,
  workOrders: workOrdersStore,
}

export function useStore<T extends keyof typeof storeExports>(storeName: T) {
  const targetStore = storeExports[storeName](store)
  const storeRefs = storeToRefs(targetStore)
  return { ...targetStore, ...storeRefs } as unknown as AutoToRefs<ReturnType<typeof storeExports[T]>>
}
