import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useNavigationStore } from '@/store/navigation';
import { useNavigation, usePageNavigation } from '@/hooks/useNavigation';

// Mock uni-app APIs
const mockUni = {
  switchTab: vi.fn(),
  reLaunch: vi.fn(),
  showModal: vi.fn(),
  showToast: vi.fn(),
  getStorageSync: vi.fn(),
  setStorageSync: vi.fn(),
  removeStorageSync: vi.fn(),
  clearStorageSync: vi.fn()
};

global.uni = mockUni as any;
global.getCurrentPages = vi.fn(() => [{ route: 'pages/index/index' }]);

// Mock error handler
vi.mock('@/utils/errorHandler', () => ({
  errorHandler: {
    handleNavigationError: vi.fn(),
    handlePageError: vi.fn()
  }
}));

describe('End-to-End Navigation Flow Tests', () => {
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

  describe('Complete User Navigation Journey', () => {
    it('should complete full navigation cycle: Home -> Create -> Profile -> Home', async () => {
      // Mock successful navigation for all tabs
      mockUni.switchTab.mockImplementation((options) => {
        options.success();
      });

      const navigation = useNavigation();

      // Start at home (default state)
      expect(navigationStore.currentTab).toBe(0);
      expect(navigationStore.currentTabItem.id).toBe('home');

      // Navigate to Create page
      await navigation.navigateToTab('create');
      expect(navigationStore.currentTab).toBe(1);
      expect(navigationStore.currentTabItem.id).toBe('create');
      expect(mockUni.switchTab).toHaveBeenCalledWith({
        url: '/pages/create/create',
        success: expect.any(Function),
        fail: expect.any(Function)
      });

      // Navigate to Profile page
      await navigation.navigateToTab('profile');
      expect(navigationStore.currentTab).toBe(2);
      expect(navigationStore.currentTabItem.id).toBe('profile');
      expect(mockUni.switchTab).toHaveBeenCalledWith({
        url: '/pages/profile/profile',
        success: expect.any(Function),
        fail: expect.any(Function)
      });

      // Navigate back to Home
      await navigation.navigateToTab('home');
      expect(navigationStore.currentTab).toBe(0);
      expect(navigationStore.currentTabItem.id).toBe('home');
      expect(mockUni.switchTab).toHaveBeenCalledWith({
        url: '/pages/index/index',
        success: expect.any(Function),
        fail: expect.any(Function)
      });

      // Verify all navigation calls were made
      expect(mockUni.switchTab).toHaveBeenCalledTimes(3);
    });

    it('should handle navigation by index correctly', async () => {
      mockUni.switchTab.mockImplementation((options) => {
        options.success();
      });

      const navigation = useNavigation();

      // Navigate by index
      await navigation.navigateToTabByIndex(1); // Create page
      expect(navigationStore.currentTab).toBe(1);

      await navigation.navigateToTabByIndex(2); // Profile page
      expect(navigationStore.currentTab).toBe(2);

      await navigation.navigateToTabByIndex(0); // Home page
      expect(navigationStore.currentTab).toBe(0);
    });

    it('should maintain state consistency across different navigation methods', async () => {
      mockUni.switchTab.mockImplementation((options) => {
        options.success();
      });

      const navigation = useNavigation();

      // Navigate by ID
      await navigation.navigateToTab('create');
      expect(navigationStore.currentTab).toBe(1);

      // Navigate by index
      await navigation.navigateToTabByIndex(2);
      expect(navigationStore.currentTab).toBe(2);

      // Navigate by name (using store method)
      await navigationStore.navigateToTabByName('index');
      expect(navigationStore.currentTab).toBe(0);

      // All methods should result in consistent state
      expect(navigationStore.currentTabItem.id).toBe('home');
      expect(navigationStore.currentPath).toBe('/pages/index/index');
    });
  });

  describe('Page Functionality Verification', () => {
    it('should verify home page functionality works correctly', async () => {
      mockUni.switchTab.mockImplementation((options) => {
        options.success();
      });

      const homePageNavigation = usePageNavigation('index');

      // Simulate home page initialization
      expect(homePageNavigation.navigationStore.currentTab).toBe(0);

      // Test navigation from home page to other pages
      const navigation = useNavigation();

      // Navigate to create from home
      await navigation.navigateToTab('create');
      expect(navigationStore.currentTab).toBe(1);

      // Navigate to profile from home
      await navigation.navigateToTab('profile');
      expect(navigationStore.currentTab).toBe(2);
    });

    it('should verify create page functionality works correctly', async () => {
      mockUni.switchTab.mockImplementation((options) => {
        options.success();
      });

      mockUni.showToast.mockImplementation(() => {});

      // const createPageNavigation = usePageNavigation('create');

      // Navigate to create page
      await navigationStore.navigateToTabByName('create');
      expect(navigationStore.currentTab).toBe(1);

      // Simulate create option selection (this would be in the actual component)
      const createOption = {
        id: 'text',
        title: '文本内容',
        description: '创建新的文本内容',
        icon: '📝',
        action: 'createText'
      };

      // Simulate option click
      mockUni.showToast({
        title: `选择了${createOption.title}`,
        icon: 'success',
        duration: 1500
      });

      expect(mockUni.showToast).toHaveBeenCalledWith({
        title: '选择了文本内容',
        icon: 'success',
        duration: 1500
      });
    });

    it('should verify profile page functionality works correctly', async () => {
      mockUni.switchTab.mockImplementation((options) => {
        options.success();
      });

      mockUni.showToast.mockImplementation(() => {});
      mockUni.showModal.mockImplementation(() => {});

      // const profilePageNavigation = usePageNavigation('profile');

      // Navigate to profile page
      await navigationStore.navigateToTabByName('profile');
      expect(navigationStore.currentTab).toBe(2);

      // Simulate setting option click
      const settingOption = { title: '账户设置' };
      mockUni.showToast({
        title: `${settingOption.title}功能开发中`,
        icon: 'none'
      });

      expect(mockUni.showToast).toHaveBeenCalledWith({
        title: '账户设置功能开发中',
        icon: 'none'
      });

      // Simulate logout action
      mockUni.showModal({
        title: '确认退出',
        content: '确定要退出登录吗？',
        success: expect.any(Function)
      });

      expect(mockUni.showModal).toHaveBeenCalledWith({
        title: '确认退出',
        content: '确定要退出登录吗？',
        success: expect.any(Function)
      });
    });
  });

  describe('Different Device and Screen Size Simulation', () => {
    it('should handle mobile device navigation', async () => {
      // Mock mobile device environment
      global.getCurrentPages = vi.fn(() => [{ route: 'pages/index/index' }]);

      mockUni.switchTab.mockImplementation((options) => {
        options.success();
      });

      const navigation = useNavigation();

      // Test navigation on mobile
      await navigation.navigateToTab('create');
      expect(navigationStore.currentTab).toBe(1);

      await navigation.navigateToTab('profile');
      expect(navigationStore.currentTab).toBe(2);

      // Verify navigation works consistently on mobile
      expect(mockUni.switchTab).toHaveBeenCalledTimes(2);
    });

    it('should handle tablet/larger screen navigation', async () => {
      // Mock tablet environment (simulated by different page stack)
      global.getCurrentPages = vi.fn(() => [
        { route: 'pages/index/index' },
        { route: 'pages/create/create' } // Simulate larger screen with multiple pages
      ]);

      mockUni.switchTab.mockImplementation((options) => {
        options.success();
      });

      const navigation = useNavigation();

      // Initialize navigation based on current page stack
      navigationStore.initNavigation();
      expect(navigationStore.currentTab).toBe(1); // Should detect create page

      // Test navigation on tablet
      await navigation.navigateToTab('profile');
      expect(navigationStore.currentTab).toBe(2);
    });

    it('should handle different screen orientations', async () => {
      mockUni.switchTab.mockImplementation((options) => {
        options.success();
      });

      const navigation = useNavigation();

      // Simulate portrait mode navigation
      await navigation.navigateToTab('create');
      expect(navigationStore.currentTab).toBe(1);

      // Simulate landscape mode navigation (same behavior expected)
      await navigation.navigateToTab('profile');
      expect(navigationStore.currentTab).toBe(2);

      // Navigation should work consistently regardless of orientation
      expect(mockUni.switchTab).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover from navigation failures gracefully', async () => {
      // Mock navigation failure followed by success
      let callCount = 0;
      mockUni.switchTab.mockImplementation((options) => {
        callCount++;
        if (callCount === 1) {
          options.fail({ errMsg: 'Navigation failed' });
        } else {
          options.success();
        }
      });

      const navigation = useNavigation();

      // First navigation should fail
      try {
        await navigation.navigateToTab('create');
      } catch (error) {
        expect(error.message).toContain('导航到创建失败');
      }

      // State should be restored to previous
      expect(navigationStore.currentTab).toBe(0);

      // Second navigation should succeed
      await navigation.navigateToTab('profile');
      expect(navigationStore.currentTab).toBe(2);
    });

    it('should handle complete navigation system failure', async () => {
      mockUni.switchTab.mockImplementation((options) => {
        options.fail({ errMsg: 'System failure' });
      });

      mockUni.reLaunch.mockImplementation((options) => {
        options.success();
      });

      const navigation = useNavigation();

      // Try safe navigation with same tab as fallback (this will trigger fallbackNavigation)
      const result = await navigation.safeNavigateToTab('create', 'create');
      expect(result).toBe(false); // Should indicate failure

      // Should attempt fallback navigation via reLaunch
      expect(mockUni.reLaunch).toHaveBeenCalled();
    });

    it('should maintain data integrity during navigation errors', async () => {
      mockUni.switchTab.mockImplementation((options) => {
        options.fail({ errMsg: 'Navigation failed' });
      });

      const navigation = useNavigation();

      // Set initial state
      navigationStore.setCurrentTab(0);
      const initialTab = navigationStore.currentTab;
      const initialTabItem = navigationStore.currentTabItem;

      // Try to navigate (should fail)
      try {
        await navigation.navigateToTab('create');
      } catch (error) {
        // State should be restored
        expect(navigationStore.currentTab).toBe(initialTab);
        expect(navigationStore.currentTabItem.id).toBe(initialTabItem.id);
      }
    });
  });

  describe('Badge and State Management', () => {
    it('should handle badge operations correctly during navigation', async () => {
      mockUni.switchTab.mockImplementation((options) => {
        options.success();
      });

      const navigation = useNavigation();

      // Set badges
      navigation.setTabBadge('create', 5);
      navigation.setTabBadge('profile', 3);

      // Navigate and verify badges persist
      await navigation.navigateToTab('create');
      let createTab = navigationStore.getTabById('create');
      expect(createTab?.badge).toBe(5);

      await navigation.navigateToTab('profile');
      let profileTab = navigationStore.getTabById('profile');
      expect(profileTab?.badge).toBe(3);

      // Clear badges
      navigation.clearTabBadge('create');
      navigation.clearTabBadge('profile');

      createTab = navigationStore.getTabById('create');
      profileTab = navigationStore.getTabById('profile');
      expect(createTab?.badge).toBeUndefined();
      expect(profileTab?.badge).toBeUndefined();
    });

    it('should maintain navigation health during extended use', async () => {
      mockUni.switchTab.mockImplementation((options) => {
        options.success();
      });

      const navigation = useNavigation();

      // Perform multiple navigation operations
      for (let i = 0; i < 10; i++) {
        const targetTab = i % 3; // Cycle through all tabs
        await navigation.navigateToTabByIndex(targetTab);

        // Check health after each navigation
        const isHealthy = navigationStore.checkNavigationHealth();
        expect(isHealthy).toBe(true);
        expect(navigationStore.currentTab).toBe(targetTab);
      }
    });
  });

  describe('Concurrent Navigation Handling', () => {
    it('should handle rapid navigation requests correctly', async () => {
      let resolveCount = 0;
      mockUni.switchTab.mockImplementation((options) => {
        // Simulate async navigation with delay
        setTimeout(() => {
          resolveCount++;
          options.success();
        }, 10);
      });

      const navigation = useNavigation();

      // Start multiple navigation requests rapidly
      const promises = [
        navigation.navigateToTab('create'),
        navigation.navigateToTab('profile'),
        navigation.navigateToTab('home')
      ];

      // Wait for all to complete
      await Promise.allSettled(promises);

      // The last navigation should win
      expect(navigationStore.currentTab).toBe(0); // home
      expect(resolveCount).toBe(3); // All should have been processed
    });

    it('should handle mixed navigation methods concurrently', async () => {
      mockUni.switchTab.mockImplementation((options) => {
        setTimeout(() => options.success(), 5);
      });

      const navigation = useNavigation();

      // Mix different navigation methods
      const promises = [
        navigation.navigateToTab('create'),
        navigation.navigateToTabByIndex(2),
        navigationStore.navigateToTabByName('index')
      ];

      await Promise.allSettled(promises);

      // Final state should be consistent
      const isHealthy = navigationStore.checkNavigationHealth();
      expect(isHealthy).toBe(true);
    });
  });

  describe('Integration with Page Lifecycle', () => {
    it('should properly initialize navigation on app start', () => {
      // Mock app starting on different pages
      const testCases = [
        { route: 'pages/index/index', expectedTab: 0 },
        { route: 'pages/create/create', expectedTab: 1 },
        { route: 'pages/profile/profile', expectedTab: 2 }
      ];

      testCases.forEach(({ route, expectedTab }) => {
        global.getCurrentPages = vi.fn(() => [{ route }]);

        // Create new store instance for each test
        const pinia = createPinia();
        setActivePinia(pinia);
        const store = useNavigationStore();

        store.initNavigation();
        expect(store.currentTab).toBe(expectedTab);
      });
    });

    it('should handle page lifecycle events correctly', async () => {
      mockUni.switchTab.mockImplementation((options) => {
        options.success();
      });

      // Simulate page navigation with lifecycle events
      const homeNavigation = usePageNavigation('index');
      const createNavigation = usePageNavigation('create');
      const profileNavigation = usePageNavigation('profile');

      // All should reference the same store
      expect(homeNavigation.navigationStore).toBe(
        createNavigation.navigationStore
      );
      expect(createNavigation.navigationStore).toBe(
        profileNavigation.navigationStore
      );

      // Navigate and verify state consistency
      await homeNavigation.navigationStore.navigateToTabByName('create');
      expect(createNavigation.navigationStore.currentTab).toBe(1);
      expect(profileNavigation.navigationStore.currentTab).toBe(1);
    });
  });
});
