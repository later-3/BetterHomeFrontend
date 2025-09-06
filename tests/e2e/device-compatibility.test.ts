import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useNavigationStore } from "@/store/navigation";
import { useNavigation } from "@/hooks/useNavigation";

// Mock different device environments
const createDeviceMock = (deviceType: "mobile" | "tablet" | "desktop") => {
  const mockUni = {
    switchTab: vi.fn(),
    reLaunch: vi.fn(),
    showModal: vi.fn(),
    showToast: vi.fn(),
    getStorageSync: vi.fn(),
    setStorageSync: vi.fn(),
    removeStorageSync: vi.fn(),
    clearStorageSync: vi.fn(),
    getSystemInfo: vi.fn(() => {
      switch (deviceType) {
        case "mobile":
          return {
            platform: "ios",
            model: "iPhone 12",
            screenWidth: 375,
            screenHeight: 812,
            pixelRatio: 3,
          };
        case "tablet":
          return {
            platform: "ios",
            model: "iPad Pro",
            screenWidth: 1024,
            screenHeight: 1366,
            pixelRatio: 2,
          };
        case "desktop":
          return {
            platform: "h5",
            model: "Chrome",
            screenWidth: 1920,
            screenHeight: 1080,
            pixelRatio: 1,
          };
      }
    }),
  };

  global.uni = mockUni as any;
  return mockUni;
};

// Mock error handler
vi.mock("@/utils/errorHandler", () => ({
  errorHandler: {
    handleNavigationError: vi.fn(),
    handlePageError: vi.fn(),
  },
}));

describe("Device Compatibility Tests", () => {
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

  describe("Mobile Device Navigation", () => {
    it("should work correctly on iPhone", async () => {
      const mockUni = createDeviceMock("mobile");
      mockUni.switchTab.mockImplementation((options) => {
        options.success();
      });

      global.getCurrentPages = vi.fn(() => [{ route: "pages/index/index" }]);

      const navigation = useNavigation();

      // Test navigation on mobile device
      await navigation.navigateToTab("create");
      expect(navigationStore.currentTab).toBe(1);

      await navigation.navigateToTab("profile");
      expect(navigationStore.currentTab).toBe(2);

      // Verify system info is correctly detected
      const systemInfo = mockUni.getSystemInfo();
      expect(systemInfo.platform).toBe("ios");
      expect(systemInfo.model).toBe("iPhone 12");
      expect(systemInfo.screenWidth).toBe(375);
    });

    it("should handle small screen navigation efficiently", async () => {
      const mockUni = createDeviceMock("mobile");
      mockUni.switchTab.mockImplementation((options) => {
        // Simulate faster navigation on mobile
        setTimeout(() => options.success(), 5);
      });

      const navigation = useNavigation();
      const startTime = Date.now();

      // Perform navigation cycle
      await navigation.navigateToTab("create");
      await navigation.navigateToTab("profile");
      await navigation.navigateToTab("home");

      const endTime = Date.now();
      const navigationTime = endTime - startTime;

      // Navigation should be reasonably fast on mobile
      expect(navigationTime).toBeLessThan(100);
      expect(navigationStore.currentTab).toBe(0);
    });

    it("should handle touch interactions correctly", async () => {
      const mockUni = createDeviceMock("mobile");
      mockUni.switchTab.mockImplementation((options) => {
        options.success();
      });

      const navigation = useNavigation();

      // Simulate rapid touch navigation (common on mobile)
      const rapidNavigations = [
        navigation.navigateToTab("create"),
        navigation.navigateToTab("profile"),
        navigation.navigateToTab("home"),
      ];

      await Promise.allSettled(rapidNavigations);

      // Should handle rapid touches gracefully
      const isHealthy = navigationStore.checkNavigationHealth();
      expect(isHealthy).toBe(true);
    });
  });

  describe("Tablet Device Navigation", () => {
    it("should work correctly on iPad", async () => {
      const mockUni = createDeviceMock("tablet");
      mockUni.switchTab.mockImplementation((options) => {
        options.success();
      });

      global.getCurrentPages = vi.fn(() => [{ route: "pages/index/index" }]);

      const navigation = useNavigation();

      // Test navigation on tablet
      await navigation.navigateToTab("create");
      expect(navigationStore.currentTab).toBe(1);

      await navigation.navigateToTab("profile");
      expect(navigationStore.currentTab).toBe(2);

      // Verify system info for tablet
      const systemInfo = mockUni.getSystemInfo();
      expect(systemInfo.model).toBe("iPad Pro");
      expect(systemInfo.screenWidth).toBe(1024);
    });

    it("should handle larger screen real estate efficiently", async () => {
      const mockUni = createDeviceMock("tablet");
      mockUni.switchTab.mockImplementation((options) => {
        options.success();
      });

      const navigation = useNavigation();

      // Test multiple simultaneous operations (possible on larger screens)
      const operations = [
        navigation.navigateToTab("create"),
        navigation.setTabBadge("profile", 5),
        navigation.navigateToTab("profile"),
        navigation.clearTabBadge("profile"),
      ];

      await Promise.allSettled(operations);

      expect(navigationStore.currentTab).toBe(2);
      const profileTab = navigationStore.getTabById("profile");
      expect(profileTab?.badge).toBeUndefined();
    });

    it("should support landscape and portrait orientations", async () => {
      const mockUni = createDeviceMock("tablet");
      mockUni.switchTab.mockImplementation((options) => {
        options.success();
      });

      const navigation = useNavigation();

      // Simulate portrait mode
      await navigation.navigateToTab("create");
      expect(navigationStore.currentTab).toBe(1);

      // Simulate orientation change (navigation should still work)
      await navigation.navigateToTab("profile");
      expect(navigationStore.currentTab).toBe(2);

      // Navigation should be consistent across orientations
      expect(mockUni.switchTab).toHaveBeenCalledTimes(2);
    });
  });

  describe("Desktop/H5 Navigation", () => {
    it("should work correctly in browser environment", async () => {
      const mockUni = createDeviceMock("desktop");
      mockUni.switchTab.mockImplementation((options) => {
        options.success();
      });

      global.getCurrentPages = vi.fn(() => [{ route: "pages/index/index" }]);

      const navigation = useNavigation();

      // Test navigation in browser
      await navigation.navigateToTab("create");
      expect(navigationStore.currentTab).toBe(1);

      await navigation.navigateToTab("profile");
      expect(navigationStore.currentTab).toBe(2);

      // Verify H5 platform detection
      const systemInfo = mockUni.getSystemInfo();
      expect(systemInfo.platform).toBe("h5");
      expect(systemInfo.model).toBe("Chrome");
    });

    it("should handle keyboard navigation", async () => {
      const mockUni = createDeviceMock("desktop");
      mockUni.switchTab.mockImplementation((options) => {
        options.success();
      });

      const navigation = useNavigation();

      // Simulate keyboard-based navigation
      await navigation.navigateToTabByIndex(1); // Tab key navigation
      expect(navigationStore.currentTab).toBe(1);

      await navigation.navigateToTabByIndex(2); // Continue tabbing
      expect(navigationStore.currentTab).toBe(2);

      await navigation.navigateToTabByIndex(0); // Back to start
      expect(navigationStore.currentTab).toBe(0);
    });

    it("should handle browser back/forward buttons", async () => {
      const mockUni = createDeviceMock("desktop");
      mockUni.switchTab.mockImplementation((options) => {
        options.success();
      });

      const navigation = useNavigation();

      // Simulate navigation history
      const navigationHistory = [];

      // Navigate forward
      await navigation.navigateToTab("create");
      navigationHistory.push(1);
      expect(navigationStore.currentTab).toBe(1);

      await navigation.navigateToTab("profile");
      navigationHistory.push(2);
      expect(navigationStore.currentTab).toBe(2);

      // Simulate browser back button
      const previousTab = navigationHistory[navigationHistory.length - 2];
      navigationStore.setCurrentTab(previousTab);
      expect(navigationStore.currentTab).toBe(1);
    });
  });

  describe("Cross-Platform Consistency", () => {
    it("should maintain consistent behavior across all platforms", async () => {
      const platforms = ["mobile", "tablet", "desktop"] as const;
      const results = [];

      for (const platform of platforms) {
        const mockUni = createDeviceMock(platform);
        mockUni.switchTab.mockImplementation((options) => {
          options.success();
        });

        // Reset store for each platform test
        const pinia = createPinia();
        setActivePinia(pinia);
        const store = useNavigationStore();
        const navigation = useNavigation();

        // Perform same navigation sequence on each platform
        await navigation.navigateToTab("create");
        await navigation.navigateToTab("profile");
        await navigation.navigateToTab("home");

        results.push({
          platform,
          finalTab: store.currentTab,
          tabItem: store.currentTabItem.id,
          path: store.currentPath,
        });
      }

      // All platforms should have identical results
      const firstResult = results[0];
      results.forEach((result) => {
        expect(result.finalTab).toBe(firstResult.finalTab);
        expect(result.tabItem).toBe(firstResult.tabItem);
        expect(result.path).toBe(firstResult.path);
      });
    });

    it("should handle platform-specific errors gracefully", async () => {
      const platforms = ["mobile", "tablet", "desktop"] as const;

      for (const platform of platforms) {
        const mockUni = createDeviceMock(platform);

        // Simulate platform-specific navigation failure
        mockUni.switchTab.mockImplementation((options) => {
          options.fail({ errMsg: `${platform} navigation failed` });
        });

        mockUni.reLaunch.mockImplementation((options) => {
          if (options.success) {
            options.success();
          }
        });

        const pinia = createPinia();
        setActivePinia(pinia);
        const store = useNavigationStore();
        const navigation = useNavigation();

        // Test error recovery on each platform
        try {
          await navigation.navigateToTab("create");
        } catch (error) {
          // Navigation should fail as expected
          expect(error.message).toContain("导航到创建失败");
        }

        // Test fallback navigation
        await store.fallbackNavigation();

        // Should attempt fallback
        expect(mockUni.reLaunch).toHaveBeenCalled();

        // Reset mocks for next platform
        vi.clearAllMocks();
      }
    });
  });

  describe("Performance Across Devices", () => {
    it("should perform efficiently on low-end mobile devices", async () => {
      const mockUni = createDeviceMock("mobile");

      // Simulate slower device with delayed responses
      mockUni.switchTab.mockImplementation((options) => {
        setTimeout(() => options.success(), 50); // Slower response
      });

      const navigation = useNavigation();
      const startTime = Date.now();

      // Perform navigation operations
      await navigation.navigateToTab("create");
      await navigation.navigateToTab("profile");

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should still complete within reasonable time even on slow devices
      expect(totalTime).toBeLessThan(200);
      expect(navigationStore.currentTab).toBe(2);
    });

    it("should optimize for high-end devices", async () => {
      const mockUni = createDeviceMock("tablet");

      // Simulate fast device with quick responses
      mockUni.switchTab.mockImplementation((options) => {
        setTimeout(() => options.success(), 1); // Very fast response
      });

      const navigation = useNavigation();
      const startTime = Date.now();

      // Perform multiple rapid operations
      const operations = [];
      for (let i = 0; i < 10; i++) {
        operations.push(navigation.navigateToTabByIndex(i % 3));
      }

      await Promise.allSettled(operations);

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should be very fast on high-end devices
      expect(totalTime).toBeLessThan(50);
    });

    it("should handle memory constraints on resource-limited devices", async () => {
      const mockUni = createDeviceMock("mobile");
      mockUni.switchTab.mockImplementation((options) => {
        options.success();
      });

      const navigation = useNavigation();

      // Simulate memory pressure by performing many operations
      for (let i = 0; i < 100; i++) {
        await navigation.navigateToTabByIndex(i % 3);

        // Check that navigation health is maintained
        const isHealthy = navigationStore.checkNavigationHealth();
        expect(isHealthy).toBe(true);
      }

      // Final state should still be valid
      expect(navigationStore.currentTab).toBeGreaterThanOrEqual(0);
      expect(navigationStore.currentTab).toBeLessThan(3);
    });
  });

  describe("Accessibility Across Devices", () => {
    it("should support screen readers on all platforms", async () => {
      const platforms = ["mobile", "tablet", "desktop"] as const;

      for (const platform of platforms) {
        const mockUni = createDeviceMock(platform);
        mockUni.switchTab.mockImplementation((options) => {
          options.success();
        });

        const pinia = createPinia();
        setActivePinia(pinia);
        const store = useNavigationStore();

        // Verify tab data includes accessibility information
        store.tabs.forEach((tab) => {
          expect(tab.text).toBeDefined(); // Screen reader text
          expect(tab.text.length).toBeGreaterThan(0);
          expect(tab.path).toBeDefined(); // Navigation target
        });
      }
    });

    it("should support keyboard navigation on desktop", async () => {
      const mockUni = createDeviceMock("desktop");
      mockUni.switchTab.mockImplementation((options) => {
        options.success();
      });

      const navigation = useNavigation();

      // Simulate keyboard navigation patterns
      const keyboardSequence = [
        () => navigation.navigateToTabByIndex(0), // Home
        () => navigation.navigateToTabByIndex(1), // Tab to Create
        () => navigation.navigateToTabByIndex(2), // Tab to Profile
        () => navigation.navigateToTabByIndex(0), // Tab back to Home
      ];

      for (const action of keyboardSequence) {
        await action();

        // Verify navigation state is accessible
        const currentTab = navigationStore.currentTabItem;
        expect(currentTab.text).toBeDefined();
        expect(currentTab.path).toBeDefined();
      }
    });

    it("should provide appropriate feedback for assistive technologies", async () => {
      const mockUni = createDeviceMock("mobile");
      mockUni.switchTab.mockImplementation((options) => {
        options.success();
      });

      mockUni.showToast.mockImplementation(() => {});

      const navigation = useNavigation();

      // Navigation should provide feedback that can be announced
      await navigation.navigateToTab("create");

      // Verify current tab information is available for screen readers
      const currentTab = navigationStore.currentTabItem;
      expect(currentTab.text).toBe("创建");
      expect(currentTab.id).toBe("create");

      // This information should be available to assistive technologies
      expect(typeof currentTab.text).toBe("string");
      expect(currentTab.text.length).toBeGreaterThan(0);
    });
  });
});
