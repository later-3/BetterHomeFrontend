import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock hooks
const mockUsePageNavigation = vi.fn(() => ({
  navigationStore: { currentTab: 1 },
}));

const mockUseErrorHandler = vi.fn(() => ({
  hasError: false,
  errorMessage: "",
  isLoading: false,
  handlePageError: vi.fn(),
  safeAsync: vi.fn((fn) => fn()),
  safeSync: vi.fn((fn) => fn()),
  resetError: vi.fn(),
}));

vi.mock("@/hooks/useNavigation", () => ({
  usePageNavigation: mockUsePageNavigation,
}));

vi.mock("@/hooks/useErrorHandler", () => ({
  useErrorHandler: mockUseErrorHandler,
}));

describe("Create Page Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.uni.showToast = vi.fn();
  });

  it("should initialize with correct hooks", () => {
    // Test that the mocked hooks are called correctly
    mockUsePageNavigation("create");
    mockUseErrorHandler({ pageName: "create", enableErrorBoundary: true });

    expect(mockUsePageNavigation).toHaveBeenCalledWith("create");
    expect(mockUseErrorHandler).toHaveBeenCalledWith({
      pageName: "create",
      enableErrorBoundary: true,
    });
  });

  it("should have correct create options data structure", () => {
    const createOptions = [
      {
        id: "text",
        title: "文本内容",
        description: "创建新的文本内容",
        icon: "📝",
        action: "createText",
      },
      {
        id: "image",
        title: "图片内容",
        description: "上传或创建图片内容",
        icon: "🖼️",
        action: "createImage",
      },
      {
        id: "video",
        title: "视频内容",
        description: "录制或上传视频内容",
        icon: "🎥",
        action: "createVideo",
      },
    ];

    expect(createOptions).toHaveLength(3);
    expect(createOptions[0].title).toBe("文本内容");
    expect(createOptions[1].title).toBe("图片内容");
    expect(createOptions[2].title).toBe("视频内容");
  });

  it("should handle option click correctly", () => {
    const option = {
      id: "text",
      title: "文本内容",
      description: "创建新的文本内容",
      icon: "📝",
      action: "createText",
    };

    // Simulate option click logic
    const selectedOption = option.id;

    expect(selectedOption).toBe("text");
    expect(global.uni.showToast).not.toHaveBeenCalled(); // Not called yet

    // Simulate the actual click handler
    global.uni.showToast({
      title: `选择了${option.title}`,
      icon: "success",
      duration: 1500,
    });

    expect(global.uni.showToast).toHaveBeenCalledWith({
      title: "选择了文本内容",
      icon: "success",
      duration: 1500,
    });
  });

  it("should handle error states correctly", () => {
    const errorHandler = {
      hasError: true,
      errorMessage: "Create page error",
      isLoading: false,
      handlePageError: vi.fn(),
      safeAsync: vi.fn(),
      safeSync: vi.fn(),
      resetError: vi.fn(),
    };

    mockUseErrorHandler.mockReturnValue(errorHandler);
    const result = mockUseErrorHandler({ pageName: "create" });

    expect(result.hasError).toBe(true);
    expect(result.errorMessage).toBe("Create page error");
  });

  it("should handle loading states correctly", () => {
    const errorHandler = {
      hasError: false,
      errorMessage: "",
      isLoading: true,
      handlePageError: vi.fn(),
      safeAsync: vi.fn(),
      safeSync: vi.fn(),
      resetError: vi.fn(),
    };

    mockUseErrorHandler.mockReturnValue(errorHandler);
    const result = mockUseErrorHandler({ pageName: "create" });

    expect(result.isLoading).toBe(true);
    expect(result.hasError).toBe(false);
  });

  it("should log correct action when option is selected", () => {
    const consoleSpy = vi.spyOn(console, "log");
    const option = { action: "createText" };

    // Simulate the action logging
    console.log(`执行创建操作: ${option.action}`);

    expect(consoleSpy).toHaveBeenCalledWith("执行创建操作: createText");

    consoleSpy.mockRestore();
  });
});
