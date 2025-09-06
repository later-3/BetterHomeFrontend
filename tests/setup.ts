import { vi } from "vitest";
import {
  ref,
  reactive,
  computed,
  onMounted,
  onUnmounted,
  watch,
  watchEffect,
  nextTick,
  readonly,
  onLoad,
} from "vue";

// Mock uni-app APIs
global.uni = {
  showToast: vi.fn(),
  showModal: vi.fn(),
  switchTab: vi.fn(),
  navigateTo: vi.fn(),
  redirectTo: vi.fn(),
  reLaunch: vi.fn(),
  navigateBack: vi.fn(),
  getSystemInfo: vi.fn(() => ({
    model: "iPhone",
    system: "iOS 15.0",
  })),
  getStorageSync: vi.fn(),
  setStorageSync: vi.fn(),
  removeStorageSync: vi.fn(),
  clearStorageSync: vi.fn(),
};

// Make Vue composition API available globally
global.ref = ref;
global.reactive = reactive;
global.computed = computed;
global.onMounted = onMounted;
global.onUnmounted = onUnmounted;
global.watch = watch;
global.watchEffect = watchEffect;
global.nextTick = nextTick;
global.readonly = readonly;

// Mock uni-app specific lifecycle hooks
global.onLoad = vi.fn();
global.onTabItemTap = vi.fn();
global.getCurrentPages = vi.fn(() => [{ route: "pages/index/index" }]);

// Mock Pinia
import { defineStore } from "pinia";
global.defineStore = defineStore;

// Mock Pinia store
global.useStore = vi.fn(() => ({
  userInfo: { name: "Test User" },
  logged: true,
  userId: "12345",
  getSystemInfo: () => ({
    model: "iPhone",
    system: "iOS 15.0",
  }),
}));
