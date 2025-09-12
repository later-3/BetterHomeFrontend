import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useNavigation, usePageNavigation } from '@/hooks/useNavigation';
import { useNavigationStore } from '@/store/navigation';

// Mock uni-app APIs
const mockUni = {
  switchTab: vi.fn(),
  reLaunch: vi.fn(),
  showModal: vi.fn(),
  getStorageSync: vi.fn(),
  setStorageSync: vi.fn(),
  removeStorageSync: vi.fn(),
  clearStorageSync: vi.fn()
};

global.uni = mockUni as any;
global.getCurrentPages = vi.fn(() => [{ route: 'pages/index/index' }]);

// Mock Vue composition API
global.computed = vi.fn((fn) => ({ value: fn() }));
global.onLoad = vi.fn();
global.onTabItemTap = vi.fn();

// Mock error handler
vi.mock('@/utils/errorHandler', () => ({
  errorHandler: {
    handleNavigationError: vi.fn(),
    handlePageError: vi.fn()
  }
}));

describe('Navigation Hooks Integration Tests', () => {
  let navigationStore: ReturnType<typeof useNavigationStore>;

  beforeEach(() => {
    const pinia = createPinia();
    setActivePinia(pinia);
    navigationStore = useNavigationStore();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('useNavigation Hook', () => {
    it('should initialize navigation hook correctly', () => {
      const navigation = useNavigation();

      expect(navigation.navigationStore).toBeDefined();
      expect(navigation.currentTab).toBeDefined();
      expect(navigation.currentTabItem).toBeDefined();
      expect(navigation.tabs).toBeDefined();
      expect(navigation.navigateToTab).toBeInstanceOf(Function);
      expect(navigation.navigateToTabByIndex).toBeInstanceOf(Function);
    });

    it('should initialize page navigation state', () => {
      const navigation = useNavigation();
      const setCurrentTabByNameSpy = vi.spyOn(
        navigationStore,
        'setCurrentTabByName'
      );

      navigation.initPageNavigation('create');

      expect(setCurrentTabByNameSpy).toHaveBeenCalledWith('create');
    });

    it('should navigate to tab by ID', async () => {
      mockUni.switchTab.mockImplementation((options) => {
        options.success();
      });

      const navigation = useNavigation();
      await navigation.navigateToTab('profile');

      expect(navigationStore.currentTab).toBe(2);
      expect(mockUni.switchTab).toHaveBeenCalledWith({
        url: '/pages/profile/profile',
        success: expect.any(Function),
        fail: expect.any(Function)
      });
    });

    it('should navigate to tab by index', async () => {
      mockUni.switchTab.mockImplementation((options) => {
        options.success();
      });

      const navigation = useNavigation();
      await navigation.navigateToTabByIndex(1);

      expect(navigationStore.currentTab).toBe(1);
      expect(mockUni.switchTab).toHaveBeenCalledWith({
        url: '/pages/create/create',
        success: expect.any(Function),
        fail: expect.any(Function)
      });
    });

    it('should handle navigation error and rethrow', async () => {
      mockUni.switchTab.mockImplementation((options) => {
        options.fail({ errMsg: 'Navigation failed' });
      });

      const navigation = useNavigation();
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      try {
        await navigation.navigateToTab('profile');
      } catch (error) {
        expect(error.message).toContain('导航到我失败');
        expect(consoleSpy).toHaveBeenCalledWith(
          '导航到标签页 profile 失败:',
          expect.any(Error)
        );
      }

      consoleSpy.mockRestore();
    });

    it('should set and clear tab badges', () => {
      const navigation = useNavigation();

      navigation.setTabBadge('create', 5);
      let tab = navigationStore.getTabById('create');
      expect(tab?.badge).toBe(5);

      navigation.clearTabBadge('create');
      tab = navigationStore.getTabById('create');
      expect(tab?.badge).toBeUndefined();
    });

    it('should handle tab item tap event', async () => {
      mockUni.switchTab.mockImplementation((options) => {
        options.success();
      });

      const navigation = useNavigation();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await navigation.handleTabItemTap({ index: 2, text: '我' });

      expect(navigationStore.currentTab).toBe(2);
      expect(consoleSpy).toHaveBeenCalledWith('标签页切换:', {
        index: 2,
        text: '我'
      });

      consoleSpy.mockRestore();
    });

    it('should handle tab item tap error gracefully', async () => {
      mockUni.switchTab.mockImplementation((options) => {
        options.fail({ errMsg: 'Navigation failed' });
      });

      const navigation = useNavigation();
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await navigation.handleTabItemTap({ index: 2, text: '我' });

      expect(consoleSpy).toHaveBeenCalledWith(
        '标签页切换失败:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should perform safe navigation with success', async () => {
      mockUni.switchTab.mockImplementation((options) => {
        options.success();
      });

      const navigation = useNavigation();
      const result = await navigation.safeNavigateToTab('create');

      expect(result).toBe(true);
      expect(navigationStore.currentTab).toBe(1);
    });

    it('should perform safe navigation with fallback', async () => {
      mockUni.switchTab
        .mockImplementationOnce((options) => {
          // First call fails (target tab)
          options.fail({ errMsg: 'Navigation failed' });
        })
        .mockImplementationOnce((options) => {
          // Second call succeeds (fallback tab)
          options.success();
        });

      const navigation = useNavigation();
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await navigation.safeNavigateToTab('create', 'home');

      expect(result).toBe(false);
      expect(navigationStore.currentTab).toBe(0); // Should be at home
      expect(consoleSpy).toHaveBeenCalledWith(
        '导航到 create 失败，尝试回退到 home'
      );

      consoleSpy.mockRestore();
    });

    it('should handle complete navigation failure', async () => {
      mockUni.switchTab.mockImplementation((options) => {
        options.fail({ errMsg: 'Navigation failed' });
      });
      mockUni.reLaunch.mockImplementation((options) => {
        options.success();
      });

      const navigation = useNavigation();
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {});
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const result = await navigation.safeNavigateToTab('create', 'home');

      expect(result).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('usePageNavigation Hook', () => {
    it('should initialize page navigation on load', () => {
      const onLoadCallback = vi.fn();
      global.onLoad = vi.fn((callback) => {
        onLoadCallback.mockImplementation(callback);
      });

      const pageNavigation = usePageNavigation('profile');

      expect(global.onLoad).toHaveBeenCalled();
      expect(pageNavigation.navigationStore).toBeDefined();
      expect(pageNavigation.currentTab).toBeDefined();
      expect(pageNavigation.currentTabItem).toBeDefined();

      // Simulate onLoad execution
      onLoadCallback();
      expect(navigationStore.currentTab).toBe(2); // profile tab
    });

    it('should handle page navigation initialization error', () => {
      const onLoadCallback = vi.fn();
      global.onLoad = vi.fn((callback) => {
        onLoadCallback.mockImplementation(callback);
      });

      // Mock setCurrentTabByName to throw error
      vi.spyOn(navigationStore, 'setCurrentTabByName').mockImplementation(
        () => {
          throw new Error('Navigation init failed');
        }
      );

      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      usePageNavigation('profile');
      onLoadCallback();

      expect(consoleSpy).toHaveBeenCalledWith(
        '页面 profile 导航初始化失败:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should handle tab item tap events', () => {
      const onTabItemTapCallback = vi.fn();
      global.onTabItemTap = vi.fn((callback) => {
        onTabItemTapCallback.mockImplementation(callback);
      });

      mockUni.switchTab.mockImplementation((options) => {
        options.success();
      });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      usePageNavigation('index');

      expect(global.onTabItemTap).toHaveBeenCalled();

      // Simulate tab item tap
      onTabItemTapCallback({ text: '创建', index: 1 });

      expect(consoleSpy).toHaveBeenCalledWith('标签页切换到: 创建, 索引: 1');

      consoleSpy.mockRestore();
    });

    it('should handle tab item tap error', () => {
      const onTabItemTapCallback = vi.fn();
      global.onTabItemTap = vi.fn((callback) => {
        onTabItemTapCallback.mockImplementation(callback);
      });

      mockUni.switchTab.mockImplementation((options) => {
        options.fail({ errMsg: 'Navigation failed' });
      });

      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      usePageNavigation('index');

      // Simulate tab item tap with error
      onTabItemTapCallback({ text: '创建', index: 1 });

      expect(consoleSpy).toHaveBeenCalledWith(
        '导航到 创建 失败:',
        expect.any(Object)
      );

      consoleSpy.mockRestore();
    });

    it('should perform navigation health check on load', () => {
      const onLoadCallback = vi.fn();
      global.onLoad = vi.fn((callback) => {
        onLoadCallback.mockImplementation(callback);
      });

      const healthCheckSpy = vi.spyOn(navigationStore, 'checkNavigationHealth');

      usePageNavigation('index');
      onLoadCallback();

      expect(healthCheckSpy).toHaveBeenCalled();
    });
  });

  describe('Navigation State Synchronization', () => {
    it('should maintain consistent state across hooks', () => {
      const navigation = useNavigation();
      const pageNavigation = usePageNavigation('create');

      // Both hooks should reference the same store
      expect(navigation.navigationStore).toBe(pageNavigation.navigationStore);

      // State changes should be reflected in both hooks
      navigation.navigationStore.setCurrentTab(2);
      // Since computed is mocked, we need to check the store directly
      expect(navigation.navigationStore.currentTab).toBe(2);
      expect(pageNavigation.navigationStore.currentTab).toBe(2);
    });

    it('should handle concurrent navigation requests', async () => {
      mockUni.switchTab.mockImplementation((options) => {
        setTimeout(() => options.success(), 10);
      });

      const navigation = useNavigation();

      // Start multiple navigation requests
      const promise1 = navigation.navigateToTab('create');
      const promise2 = navigation.navigateToTab('profile');

      // Wait for both to complete
      await Promise.allSettled([promise1, promise2]);

      // The last navigation should win
      expect(navigationStore.currentTab).toBe(2); // profile
    });
  });
});
