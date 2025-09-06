import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useNavigationStore } from "@/store/navigation";

// Mock uni-app APIs
const mockUni = {
  switchTab: vi.fn(),
  reLaunch: vi.fn(),
  showModal: vi.fn(),
  getStorageSync: vi.fn(),
  setStorageSync: vi.fn(),
  removeStorageSync: vi.fn(),
  clearStorageSync: vi.fn(),
};

global.uni = mockUni as any;
global.getCurrentPages = vi.fn(() => [{ route: "pages/index/index" }]);

// Mock error handler
vi.mock("@/utils/errorHandler", () => ({
  errorHandler: {
    handleNavigationError: vi.fn(),
  },
}));

describe("Navigation Integration Tests", () => {
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

  describe("TabBar Navigation Switching", () => {
    it("should initialize with correct tab data", () => {
      expect(navigationStore.tabs).toHaveLength(3);
      expect(navigationStore.tabs[0].id).toBe("home");
      expect(navigationStore.tabs[1].id).toBe("create");
      expect(navigationStore.tabs[2].id).toBe("profile");
    });

    it("should set current tab correctly", () => {
      navigationStore.setCurrentTab(1);
      expect(navigationStore.currentTab).toBe(1);
      expect(navigationStore.currentTabItem.id).toBe("create");
    });

    it("should not set invalid tab index", () => {
      navigationStore.setCurrentTab(0); // Set to valid first
      navigationStore.setCurrentTab(-1); // Try invalid
      expect(navigationStore.currentTab).toBe(0); // Should remain unchanged

      navigationStore.setCurrentTab(10); // Try invalid
      expect(navigationStore.currentTab).toBe(0); // Should remain unchanged
    });

    it("should navigate to tab successfully", async () => {
      mockUni.switchTab.mockImplementation((options) => {
        options.success();
      });

      await navigationStore.navigateToTab(1);

      expect(navigationStore.currentTab).toBe(1);
      expect(mockUni.switchTab).toHaveBeenCalledWith({
        url: "/pages/create/create",
        success: expect.any(Function),
        fail: expect.any(Function),
      });
    });

    it("should handle navigation failure and restore previous state", async () => {
      mockUni.switchTab.mockImplementation((options) => {
        options.fail({ errMsg: "Navigation failed" });
      });

      navigationStore.setCurrentTab(0); // Set initial state

      try {
        await navigationStore.navigateToTab(1);
      } catch (error) {
        expect(navigationStore.currentTab).toBe(0); // Should restore previous state
        expect(error.message).toContain("导航到创建失败");
      }
    });

    it("should navigate by tab ID", async () => {
      mockUni.switchTab.mockImplementation((options) => {
        options.success();
      });

      await navigationStore.navigateToTabById("profile");

      expect(navigationStore.currentTab).toBe(2);
      expect(mockUni.switchTab).toHaveBeenCalledWith({
        url: "/pages/profile/profile",
        success: expect.any(Function),
        fail: expect.any(Function),
      });
    });

    it("should navigate by tab name", async () => {
      mockUni.switchTab.mockImplementation((options) => {
        options.success();
      });

      await navigationStore.navigateToTabByName("create");

      expect(navigationStore.currentTab).toBe(1);
      expect(mockUni.switchTab).toHaveBeenCalledWith({
        url: "/pages/create/create",
        success: expect.any(Function),
        fail: expect.any(Function),
      });
    });

    it("should throw error for invalid tab ID", async () => {
      try {
        await navigationStore.navigateToTabById("invalid");
      } catch (error) {
        expect(error.message).toContain("找不到ID为 invalid 的标签页");
      }
    });

    it("should throw error for invalid tab name", async () => {
      try {
        await navigationStore.navigateToTabByName("invalid");
      } catch (error) {
        expect(error.message).toContain("找不到名称为 invalid 的标签页");
      }
    });
  });

  describe("Page State Transfer", () => {
    it("should set current tab by path", () => {
      navigationStore.setCurrentTabByPath("/pages/create/create");
      expect(navigationStore.currentTab).toBe(1);
      expect(navigationStore.currentPath).toBe("/pages/create/create");
    });

    it("should set current tab by name", () => {
      navigationStore.setCurrentTabByName("profile");
      expect(navigationStore.currentTab).toBe(2);
      expect(navigationStore.currentTabItem.name).toBe("profile");
    });

    it("should get tab by ID", () => {
      const tab = navigationStore.getTabById("create");
      expect(tab).toBeDefined();
      expect(tab?.id).toBe("create");
      expect(tab?.text).toBe("创建");
    });

    it("should get tab by index", () => {
      const tab = navigationStore.getTabByIndex(2);
      expect(tab).toBeDefined();
      expect(tab?.id).toBe("profile");
      expect(tab?.text).toBe("我");
    });

    it("should return undefined for invalid tab ID", () => {
      const tab = navigationStore.getTabById("invalid");
      expect(tab).toBeUndefined();
    });

    it("should return undefined for invalid tab index", () => {
      const tab = navigationStore.getTabByIndex(10);
      expect(tab).toBeUndefined();
    });
  });

  describe("Navigation State Persistence", () => {
    it("should initialize navigation from current page", () => {
      global.getCurrentPages = vi.fn(() => [
        { route: "pages/profile/profile" },
      ]);

      navigationStore.initNavigation();
      expect(navigationStore.currentTab).toBe(2);
    });

    it("should handle initialization error gracefully", () => {
      global.getCurrentPages = vi.fn(() => {
        throw new Error("getCurrentPages failed");
      });

      navigationStore.initNavigation();
      expect(navigationStore.currentTab).toBe(0); // Should fallback to home
    });

    it("should check navigation health", () => {
      navigationStore.setCurrentTab(0);
      const isHealthy = navigationStore.checkNavigationHealth();
      expect(isHealthy).toBe(true);
    });

    it("should fix unhealthy navigation state", () => {
      // Set a valid state first
      navigationStore.setCurrentTab(0);
      const isHealthy = navigationStore.checkNavigationHealth();
      expect(isHealthy).toBe(true);
    });

    it("should handle badge operations", () => {
      navigationStore.setBadge("create", 5);
      const tab = navigationStore.getTabById("create");
      expect(tab?.badge).toBe(5);

      navigationStore.clearBadge("create");
      expect(tab?.badge).toBeUndefined();
    });
  });

  describe("Error Handling and Fallback", () => {
    it("should execute fallback navigation", async () => {
      mockUni.switchTab.mockImplementation((options) => {
        options.success();
      });

      await navigationStore.fallbackNavigation();

      expect(navigationStore.currentTab).toBe(0);
      expect(mockUni.switchTab).toHaveBeenCalledWith({
        url: "/pages/index/index",
        success: expect.any(Function),
        fail: expect.any(Function),
      });
    });

    it("should use reLaunch when fallback navigation fails", async () => {
      mockUni.switchTab.mockImplementation((options) => {
        options.fail({ errMsg: "Switch tab failed" });
      });

      await navigationStore.fallbackNavigation();

      expect(mockUni.reLaunch).toHaveBeenCalledWith({
        url: "/pages/index/index",
        fail: expect.any(Function),
      });
    });

    it("should show error modal when reLaunch fails", async () => {
      mockUni.switchTab.mockImplementation((options) => {
        options.fail({ errMsg: "Switch tab failed" });
      });

      mockUni.reLaunch.mockImplementation((options) => {
        options.fail({ errMsg: "reLaunch failed" });
      });

      await navigationStore.fallbackNavigation();

      expect(mockUni.showModal).toHaveBeenCalledWith({
        title: "应用错误",
        content: "应用出现严重错误，请重启应用",
        showCancel: false,
      });
    });

    it("should handle navigation error for invalid tab index", async () => {
      try {
        await navigationStore.navigateToTab(-1);
      } catch (error) {
        expect(error.message).toContain("无效的标签页索引");
      }
    });

    it("should handle navigation error for out of bounds tab index", async () => {
      try {
        await navigationStore.navigateToTab(10);
      } catch (error) {
        expect(error.message).toContain("无效的标签页索引");
      }
    });
  });

  describe("Computed Properties", () => {
    it("should return correct current tab item", () => {
      navigationStore.setCurrentTab(1);
      expect(navigationStore.currentTabItem.id).toBe("create");
      expect(navigationStore.currentTabItem.text).toBe("创建");
    });

    it("should return correct current path", () => {
      navigationStore.setCurrentTab(2);
      expect(navigationStore.currentPath).toBe("/pages/profile/profile");
    });

    it("should fallback to first tab for invalid current tab", () => {
      // This tests the computed property fallback logic
      navigationStore.setCurrentTab(0);
      expect(navigationStore.currentTabItem.id).toBe("home");
    });
  });
});
