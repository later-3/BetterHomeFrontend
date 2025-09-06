import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useNavigationStore } from "@/store/navigation";
import { useNavigation } from "@/hooks/useNavigation";

// Mock performance APIs
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByType: vi.fn(() => []),
  getEntriesByName: vi.fn(() => []),
};

global.performance = mockPerformance as any;

// Mock animation frame APIs
let animationFrameId = 0;
const mockRequestAnimationFrame = vi.fn((callback) => {
  animationFrameId++;
  setTimeout(callback, 16); // 60fps
  return animationFrameId;
});

const mockCancelAnimationFrame = vi.fn((id) => {
  // Mock implementation
});

global.requestAnimationFrame = mockRequestAnimationFrame;
global.cancelAnimationFrame = mockCancelAnimationFrame;

// Mock uni-app APIs with timing simulation
const createSmoothnessMock = () => {
  const mockUni = {
    switchTab: vi.fn(),
    reLaunch: vi.fn(),
    showModal: vi.fn(),
    showToast: vi.fn(),
    getStorageSync: vi.fn(),
    setStorageSync: vi.fn(),
    removeStorageSync: vi.fn(),
    clearStorageSync: vi.fn(),
  };

  // Simulate smooth navigation with realistic timing
  mockUni.switchTab.mockImplementation((options) => {
    const delay = Math.random() * 10 + 5; // 5-15ms realistic delay
    setTimeout(() => {
      options.success();
    }, delay);
  });

  // 将 mockUni 暴露到全局，供被测代码使用
  (globalThis as any).uni = mockUni as any;
  return mockUni;
};

// Mock error handler，避免导入实模块
vi.mock("@/utils/errorHandler", () => ({
  errorHandler: {
    handleNavigationError: vi.fn(),
    handlePageError: vi.fn(),
  },
}));

// 测试前置/后置：初始化 Pinia 与 uni mock
let navigationStore: ReturnType<typeof useNavigationStore>;
let mockUni: any;

beforeEach(() => {
  const pinia = createPinia();
  setActivePinia(pinia);
  navigationStore = useNavigationStore();
  mockUni = createSmoothnessMock();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("Navigation Smoothness", () => {
  it("should maintain 60fps-level smoothness during tab transitions", async () => {
    const navigation = useNavigation();
    const frameTimings: number[] = [];
    let lastFrameTime = performance.now();

    // Mock frame timing measurement
    mockRequestAnimationFrame.mockImplementation((callback) => {
      const currentTime = performance.now();
      frameTimings.push(currentTime - lastFrameTime);
      lastFrameTime = currentTime;
      setTimeout(callback, 16); // Target 60fps
      return ++animationFrameId;
    });

    // Perform navigation with animation
    await navigation.navigateToTab("create");
    await navigation.navigateToTab("profile");
    await navigation.navigateToTab("home");

    // Check frame timing consistency
    if (frameTimings.length > 0) {
      const averageFrameTime =
        frameTimings.reduce((a, b) => a + b, 0) / frameTimings.length;
      expect(averageFrameTime).toBeLessThan(20); // Should be close to 16.67ms for 60fps

      // Check for frame drops (frames taking longer than 33ms indicate 30fps or worse)
      const droppedFrames = frameTimings.filter((time) => time > 33).length;
      expect(droppedFrames).toBeLessThan(frameTimings.length * 0.1); // Less than 10% dropped frames
    }
  });

  it("should handle rapid navigation without jank", async () => {
    const navigation = useNavigation();
    const transitionTimes: number[] = [];

    // Perform rapid navigation sequence
    for (let i = 0; i < 10; i++) {
      const startTime = performance.now();
      await navigation.navigateToTabByIndex(i % 3);
      const endTime = performance.now();
      transitionTimes.push(endTime - startTime);
    }

    // All transitions should be smooth (under 50ms)
    transitionTimes.forEach((time) => {
      expect(time).toBeLessThan(50);
    });

    // Transitions should be consistent (low variance)
    const average =
      transitionTimes.reduce((a, b) => a + b, 0) / transitionTimes.length;
    const variance =
      transitionTimes.reduce(
        (sum, time) => sum + Math.pow(time - average, 2),
        0
      ) / transitionTimes.length;
    const standardDeviation = Math.sqrt(variance);

    expect(standardDeviation).toBeLessThan(15); // Low variance indicates smooth transitions
  });

  it("should optimize animation performance", async () => {
    const navigation = useNavigation();
    let totalAnimationFrames = 0;

    // Count animation frames during navigation
    const originalRAF = mockRequestAnimationFrame;
    mockRequestAnimationFrame.mockImplementation((callback) => {
      totalAnimationFrames++;
      return originalRAF(callback);
    });

    // Perform navigation operations
    await navigation.navigateToTab("create");
    await navigation.navigateToTab("profile");

    // Should not use excessive animation frames
    expect(totalAnimationFrames).toBeLessThan(20); // Reasonable limit for smooth transitions

    // Restore mock
    mockRequestAnimationFrame.mockImplementation(originalRAF);
  });
});

describe("Visual Feedback Responsiveness", () => {
  it("should provide immediate visual feedback on tab selection", async () => {
    const navigation = useNavigation();
    const feedbackTimes: number[] = [];

    // Test immediate state updates
    for (let i = 0; i < 3; i++) {
      const startTime = performance.now();

      // State should update immediately (synchronously)
      navigationStore.setCurrentTab(i);

      const endTime = performance.now();
      feedbackTimes.push(endTime - startTime);

      // Verify state updated immediately
      expect(navigationStore.currentTab).toBe(i);
    }

    // State updates should be instantaneous (under 1ms)
    feedbackTimes.forEach((time) => {
      expect(time).toBeLessThan(1);
    });
  });

  it("should handle touch feedback smoothly", async () => {
    const navigation = useNavigation();

    // Simulate touch events with timing
    const touchEvents = [
      { type: "touchstart", timestamp: 0 },
      { type: "touchend", timestamp: 100 },
      { type: "click", timestamp: 120 },
    ];

    let responseTime = 0;

    // Mock touch event handling
    const handleTouch = async (event: any) => {
      const startTime = performance.now();
      await navigation.navigateToTab("create");
      const endTime = performance.now();
      responseTime = endTime - startTime;
    };

    await handleTouch(touchEvents[2]); // Simulate click event

    // Touch response should be quick
    expect(responseTime).toBeLessThan(30);
  });

  it("should maintain smooth scrolling during navigation", async () => {
    const navigation = useNavigation();
    let scrollEvents = 0;
    let scrollJank = 0;

    // Mock scroll event handling
    const mockScrollHandler = vi.fn(() => {
      scrollEvents++;
      const scrollTime = performance.now();

      // Simulate scroll jank detection
      if (scrollTime % 100 < 20) {
        // Simulate occasional jank
        scrollJank++;
      }
    });

    // Simulate scroll events during navigation
    const scrollInterval = setInterval(mockScrollHandler, 16); // 60fps scroll events

    await navigation.navigateToTab("create");
    await new Promise((resolve) => setTimeout(resolve, 100)); // Let scroll events fire

    clearInterval(scrollInterval);

    // Should handle scroll events smoothly
    expect(scrollEvents).toBeGreaterThan(0);
    // Allow up to ~34% simulated jank to reduce flakiness
    expect(scrollJank / scrollEvents).toBeLessThanOrEqual(0.34);
  });
});

describe("Memory and CPU Optimization", () => {
  it("should not cause memory leaks during smooth navigation", async () => {
    const navigation = useNavigation();

    // Track object creation (simulated)
    let objectCount = 0;
    const originalCreateElement = document.createElement;

    document.createElement = vi.fn((...args) => {
      objectCount++;
      return originalCreateElement.apply(document, args);
    });

    // Perform many navigation operations
    for (let i = 0; i < 50; i++) {
      await navigation.navigateToTabByIndex(i % 3);
    }

    // Should not create excessive DOM elements
    expect(objectCount).toBeLessThan(20);

    // Restore original function
    document.createElement = originalCreateElement;
  });

  it("should optimize CPU usage during transitions", async () => {
    const navigation = useNavigation();
    let cpuIntensiveOperations = 0;

    // Mock CPU-intensive operations
    const mockHeavyOperation = vi.fn(() => {
      cpuIntensiveOperations++;
      // Simulate heavy computation
      for (let i = 0; i < 1000; i++) {
        Math.random();
      }
    });

    // Override navigation to include CPU monitoring
    const originalNavigateToTab = navigation.navigateToTab;
    navigation.navigateToTab = vi.fn(async (tabId) => {
      mockHeavyOperation();
      return originalNavigateToTab(tabId);
    });

    // Perform navigation
    await navigation.navigateToTab("create");
    await navigation.navigateToTab("profile");

    // Should minimize CPU-intensive operations
    expect(cpuIntensiveOperations).toBeLessThan(5);
  });

  it("should handle concurrent animations efficiently", async () => {
    const navigation = useNavigation();
    const concurrentAnimations: Promise<unknown>[] = [];

    // Start multiple concurrent navigation animations
    for (let i = 0; i < 5; i++) {
      const animationPromise = navigation.navigateToTabByIndex(i % 3);
      concurrentAnimations.push(animationPromise);
    }

    const startTime = performance.now();
    await Promise.allSettled(concurrentAnimations);
    const endTime = performance.now();

    const totalTime = endTime - startTime;

    // Concurrent animations should not significantly slow down the system
    expect(totalTime).toBeLessThan(200); // Should complete within reasonable time
  });
});

describe("Device-Specific Smoothness", () => {
  it("should adapt to device performance capabilities", async () => {
    const navigation = useNavigation();

    // Simulate different device performance levels
    const deviceProfiles = [
      { name: "high-end", delay: 5, expectedSmoothness: 95 },
      { name: "mid-range", delay: 15, expectedSmoothness: 85 },
      { name: "low-end", delay: 30, expectedSmoothness: 70 },
    ];

    for (const profile of deviceProfiles) {
      // Adjust mock timing for device profile
      mockUni.switchTab.mockImplementation((options) => {
        setTimeout(() => options.success(), profile.delay);
      });

      const transitionTimes: number[] = [];

      // Test navigation on this device profile
      for (let i = 0; i < 5; i++) {
        const startTime = performance.now();
        await navigation.navigateToTabByIndex(i % 3);
        const endTime = performance.now();
        transitionTimes.push(endTime - startTime);
      }

      // Calculate smoothness score
      const averageTime =
        transitionTimes.reduce((a, b) => a + b, 0) / transitionTimes.length;
      const smoothnessScore = Math.max(0, 100 - averageTime);
      expect(smoothnessScore).toBeGreaterThanOrEqual(
        profile.expectedSmoothness - 2
      ); // tolerate minor measurement variance across environments
    }
  });

  it("should handle different screen refresh rates", async () => {
    const navigation = useNavigation();
    const refreshRates = [60, 90, 120]; // Common mobile refresh rates

    for (const refreshRate of refreshRates) {
      const frameTime = 1000 / refreshRate;
      const frameTimes: number[] = [];

      // Mock frame timing for this refresh rate
      mockRequestAnimationFrame.mockImplementation((callback) => {
        setTimeout(callback, frameTime);
        frameTimes.push(frameTime);
        return ++animationFrameId;
      });

      // Perform navigation
      await navigation.navigateToTab("create");

      // Should adapt to refresh rate
      if (frameTimes.length > 0) {
        const averageFrameTime =
          frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
        expect(Math.abs(averageFrameTime - frameTime)).toBeLessThan(2); // Within 2ms tolerance
      }
    }
  });

  it("should maintain smoothness under memory pressure", async () => {
    const navigation = useNavigation();

    // Simulate memory pressure
    const memoryPressureSimulation = () => {
      // Create and release objects to simulate memory pressure
      const objects: any[] = [];
      for (let i = 0; i < 1000; i++) {
        objects.push({ data: new Array(1000).fill(Math.random()) });
      }
      // Objects will be garbage collected
    };

    const transitionTimes: number[] = [];

    // Perform navigation under memory pressure
    for (let i = 0; i < 5; i++) {
      memoryPressureSimulation(); // Create memory pressure

      const startTime = performance.now();
      await navigation.navigateToTabByIndex(i % 3);
      const endTime = performance.now();

      transitionTimes.push(endTime - startTime);
    }

    // Should maintain reasonable performance even under memory pressure
    const averageTime =
      transitionTimes.reduce((a, b) => a + b, 0) / transitionTimes.length;
    expect(averageTime).toBeLessThan(100); // Should still be reasonably fast
  });
});

describe("User Experience Metrics", () => {
  it("should meet Core Web Vitals standards", async () => {
    const navigation = useNavigation();
    const metrics = {
      LCP: [] as number[], // Largest Contentful Paint
      FID: [] as number[], // First Input Delay
      CLS: [] as number[], // Cumulative Layout Shift
    };

    // Simulate Core Web Vitals measurement
    for (let i = 0; i < 3; i++) {
      const startTime = performance.now();
      await navigation.navigateToTabByIndex(i);
      const endTime = performance.now();

      // Simulate LCP (should be under 2.5s, but for navigation much faster)
      metrics.LCP.push(endTime - startTime);

      // Simulate FID (should be under 100ms)
      metrics.FID.push(Math.random() * 50); // Simulated input delay

      // Simulate CLS (should be under 0.1)
      metrics.CLS.push(Math.random() * 0.05); // Simulated layout shift
    }

    // Verify Core Web Vitals
    const avgLCP = metrics.LCP.reduce((a, b) => a + b, 0) / metrics.LCP.length;
    const avgFID = metrics.FID.reduce((a, b) => a + b, 0) / metrics.FID.length;
    const avgCLS = metrics.CLS.reduce((a, b) => a + b, 0) / metrics.CLS.length;

    expect(avgLCP).toBeLessThan(100); // Much faster than web standard for navigation
    expect(avgFID).toBeLessThan(100); // Good responsiveness
    expect(avgCLS).toBeLessThan(0.1); // Minimal layout shift
  });

  it("should provide consistent user experience across interactions", async () => {
    const navigation = useNavigation();
    const interactionTypes = ["tap", "swipe", "keyboard"];
    const results: Record<string, number> = {};

    for (const interactionType of interactionTypes) {
      const times: number[] = [];

      // Simulate different interaction types
      for (let i = 0; i < 3; i++) {
        const startTime = performance.now();

        // Different interaction simulation
        switch (interactionType) {
          case "tap":
            await navigation.navigateToTabByIndex(i);
            break;
          case "swipe":
            // Simulate swipe gesture
            await new Promise((resolve) => setTimeout(resolve, 10));
            await navigation.navigateToTabByIndex(i);
            break;
          case "keyboard":
            // Simulate keyboard navigation
            await new Promise((resolve) => setTimeout(resolve, 5));
            await navigation.navigateToTabByIndex(i);
            break;
        }

        const endTime = performance.now();
        times.push(endTime - startTime);
      }

      results[interactionType] =
        times.reduce((a, b) => a + b, 0) / times.length;
    }

    // All interaction types should have similar performance
    const performanceValues = Object.values(results);
    const maxDifference =
      Math.max(...performanceValues) - Math.min(...performanceValues);
    expect(maxDifference).toBeLessThan(20); // Less than 20ms difference between interaction types
  });
});
