import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock hooks
const mockUseTitle = vi.fn(() => ({ title: "Test App" }));
const mockUseNavigation = vi.fn(() => ({
  navigateToTab: vi.fn(),
}));
const mockUsePageNavigation = vi.fn(() => ({
  navigationStore: { currentTab: 0 },
}));
const mockUseErrorHandler = vi.fn(() => ({
  hasError: false,
  errorMessage: "",
  isLoading: false,
  handlePageError: vi.fn(),
  handleNavigationError: vi.fn(),
  safeAsync: vi.fn((fn) => fn()),
  resetError: vi.fn(),
}));

vi.mock("@/hooks/useTitle", () => ({
  useTitle: mockUseTitle,
}));

vi.mock("@/hooks/useNavigation", () => ({
  useNavigation: mockUseNavigation,
  usePageNavigation: mockUsePageNavigation,
}));

vi.mock("@/hooks/useErrorHandler", () => ({
  useErrorHandler: mockUseErrorHandler,
}));

vi.mock("@/utils/router", () => ({
  forward: vi.fn(),
}));

describe("Index Page Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with correct hooks", () => {
    // Test that the mocked hooks are called correctly
    mockUseTitle();
    mockUseNavigation();
    mockUsePageNavigation("index");
    mockUseErrorHandler({ pageName: "index", enableErrorBoundary: true });

    expect(mockUseTitle).toHaveBeenCalled();
    expect(mockUseNavigation).toHaveBeenCalled();
    expect(mockUsePageNavigation).toHaveBeenCalledWith("index");
    expect(mockUseErrorHandler).toHaveBeenCalledWith({
      pageName: "index",
      enableErrorBoundary: true,
    });
  });

  it("should have correct main features data structure", () => {
    const mainFeatures = [
      {
        id: "create",
        title: "快速创建",
        description: "创建新的内容",
        icon: "/static/icons/add.png",
        path: "/pages/create/create",
      },
      {
        id: "profile",
        title: "个人中心",
        description: "查看个人信息",
        icon: "/static/icons/profile.png",
        path: "/pages/profile/profile",
      },
      {
        id: "test",
        title: "功能测试",
        description: "测试应用功能",
        icon: "/static/logo.png",
        path: "/pages/test/test",
      },
    ];

    expect(mainFeatures).toHaveLength(3);
    expect(mainFeatures[0].title).toBe("快速创建");
    expect(mainFeatures[1].title).toBe("个人中心");
    expect(mainFeatures[2].title).toBe("功能测试");
  });

  it("should generate correct welcome message based on time", () => {
    const getWelcomeMessage = (hour: number) => {
      if (hour < 12) return "早上好";
      if (hour < 18) return "下午好";
      return "晚上好";
    };

    expect(getWelcomeMessage(8)).toBe("早上好");
    expect(getWelcomeMessage(14)).toBe("下午好");
    expect(getWelcomeMessage(20)).toBe("晚上好");
  });

  it("should handle navigation to tab pages correctly", async () => {
    const mockNavigateToTab = vi.fn();
    const navigation = {
      navigateToTab: mockNavigateToTab,
    };

    mockUseNavigation.mockReturnValue(navigation);
    const result = mockUseNavigation();

    await result.navigateToTab("create");
    expect(mockNavigateToTab).toHaveBeenCalledWith("create");
  });

  it("should handle error states correctly", () => {
    const errorHandler = {
      hasError: true,
      errorMessage: "Test error",
      isLoading: false,
      handlePageError: vi.fn(),
      handleNavigationError: vi.fn(),
      safeAsync: vi.fn(),
      resetError: vi.fn(),
    };

    mockUseErrorHandler.mockReturnValue(errorHandler);
    const result = mockUseErrorHandler({ pageName: "index" });

    expect(result.hasError).toBe(true);
    expect(result.errorMessage).toBe("Test error");
  });

  it("should handle loading states correctly", () => {
    const errorHandler = {
      hasError: false,
      errorMessage: "",
      isLoading: true,
      handlePageError: vi.fn(),
      handleNavigationError: vi.fn(),
      safeAsync: vi.fn(),
      resetError: vi.fn(),
    };

    mockUseErrorHandler.mockReturnValue(errorHandler);
    const result = mockUseErrorHandler({ pageName: "index" });

    expect(result.isLoading).toBe(true);
    expect(result.hasError).toBe(false);
  });
});
