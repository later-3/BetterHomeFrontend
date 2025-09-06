/**
 * 导航性能调试工具
 * 用于监控和调试导航性能问题
 */

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

interface NavigationPerformanceData {
  navigationId: string;
  tabId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  error?: string;
  metrics: PerformanceMetric[];
}

class PerformanceDebugger {
  private static instance: PerformanceDebugger;
  private metrics: Map<string, PerformanceMetric> = new Map();
  private navigationData: NavigationPerformanceData[] = [];
  private isEnabled = false;
  private maxRecords = 100;

  private constructor() {
    // 在开发环境下自动启用
    // 兼容多环境：Node（进程变量）、Vite（import.meta.env）与通用 globalThis；避免直接引用 process 导致类型错误
    const isDev =
      (globalThis as any)?.process?.env?.NODE_ENV === "development" ||
      (globalThis as any)?.import?.meta?.env?.MODE === "development" ||
      (globalThis as any)?.import?.meta?.env?.DEV === true;

    this.isEnabled = !!isDev;
  }

  static getInstance(): PerformanceDebugger {
    if (!PerformanceDebugger.instance) {
      PerformanceDebugger.instance = new PerformanceDebugger();
    }
    return PerformanceDebugger.instance;
  }

  /**
   * 启用性能调试
   */
  enable(): void {
    this.isEnabled = true;
    console.log("🔍 导航性能调试已启用");
  }

  /**
   * 禁用性能调试
   */
  disable(): void {
    this.isEnabled = false;
    console.log("🔍 导航性能调试已禁用");
  }

  /**
   * 开始记录性能指标
   */
  startMetric(name: string, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata,
    };

    this.metrics.set(name, metric);
  }

  /**
   * 结束记录性能指标
   */
  endMetric(name: string): number | null {
    if (!this.isEnabled) return null;

    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`⚠️ 性能指标 "${name}" 未找到`);
      return null;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    // 输出性能指标
    this.logMetric(metric);

    // 清理已完成的指标
    this.metrics.delete(name);

    return metric.duration;
  }

  /**
   * 开始记录导航性能
   */
  startNavigation(tabId: string): string {
    if (!this.isEnabled) return "";

    const navigationId = `nav_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const navigationData: NavigationPerformanceData = {
      navigationId,
      tabId,
      startTime: performance.now(),
      success: false,
      metrics: [],
    };

    this.navigationData.push(navigationData);

    // 限制记录数量
    if (this.navigationData.length > this.maxRecords) {
      this.navigationData.shift();
    }

    console.log(`🚀 开始导航到 ${tabId} (ID: ${navigationId})`);
    return navigationId;
  }

  /**
   * 结束记录导航性能
   */
  endNavigation(navigationId: string, success: boolean, error?: string): void {
    if (!this.isEnabled || !navigationId) return;

    const navigationData = this.navigationData.find(
      (data) => data.navigationId === navigationId
    );
    if (!navigationData) {
      console.warn(`⚠️ 导航记录 "${navigationId}" 未找到`);
      return;
    }

    navigationData.endTime = performance.now();
    navigationData.duration = navigationData.endTime - navigationData.startTime;
    navigationData.success = success;
    navigationData.error = error;

    // 输出导航性能报告
    this.logNavigationPerformance(navigationData);
  }

  /**
   * 记录导航相关的性能指标
   */
  recordNavigationMetric(
    navigationId: string,
    metricName: string,
    duration: number,
    metadata?: Record<string, any>
  ): void {
    if (!this.isEnabled || !navigationId) return;

    const navigationData = this.navigationData.find(
      (data) => data.navigationId === navigationId
    );
    if (!navigationData) return;

    const metric: PerformanceMetric = {
      name: metricName,
      startTime: 0, // 相对时间
      duration,
      metadata,
    };

    navigationData.metrics.push(metric);
  }

  /**
   * 获取性能统计信息
   */
  getPerformanceStats(): {
    totalNavigations: number;
    successfulNavigations: number;
    failedNavigations: number;
    averageDuration: number;
    slowestNavigation: NavigationPerformanceData | null;
    fastestNavigation: NavigationPerformanceData | null;
  } {
    const completedNavigations = this.navigationData.filter(
      (data) => data.endTime !== undefined
    );
    const successfulNavigations = completedNavigations.filter(
      (data) => data.success
    );
    const failedNavigations = completedNavigations.filter(
      (data) => !data.success
    );

    const durations = completedNavigations
      .map((data) => data.duration!)
      .filter((d) => d > 0);
    const averageDuration =
      durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0;

    const slowestNavigation = completedNavigations.reduce(
      (slowest, current) => {
        return !slowest || current.duration! > slowest.duration!
          ? current
          : slowest;
      },
      null as NavigationPerformanceData | null
    );

    const fastestNavigation = completedNavigations.reduce(
      (fastest, current) => {
        return !fastest || current.duration! < fastest.duration!
          ? current
          : fastest;
      },
      null as NavigationPerformanceData | null
    );

    return {
      totalNavigations: completedNavigations.length,
      successfulNavigations: successfulNavigations.length,
      failedNavigations: failedNavigations.length,
      averageDuration,
      slowestNavigation,
      fastestNavigation,
    };
  }

  /**
   * 输出性能报告
   */
  printPerformanceReport(): void {
    if (!this.isEnabled) {
      console.log("🔍 性能调试未启用");
      return;
    }

    const stats = this.getPerformanceStats();

    console.log("\n📊 导航性能报告");
    console.log("=".repeat(40));
    console.log(`总导航次数: ${stats.totalNavigations}`);
    console.log(`成功导航: ${stats.successfulNavigations}`);
    console.log(`失败导航: ${stats.failedNavigations}`);
    console.log(`平均耗时: ${stats.averageDuration.toFixed(2)}ms`);

    if (stats.fastestNavigation) {
      console.log(
        `最快导航: ${stats.fastestNavigation.duration!.toFixed(2)}ms (${
          stats.fastestNavigation.tabId
        })`
      );
    }

    if (stats.slowestNavigation) {
      console.log(
        `最慢导航: ${stats.slowestNavigation.duration!.toFixed(2)}ms (${
          stats.slowestNavigation.tabId
        })`
      );
    }

    // 性能建议
    this.printPerformanceRecommendations(stats);

    console.log("=".repeat(40));
  }

  /**
   * 检测性能问题
   */
  detectPerformanceIssues(): string[] {
    const issues: string[] = [];
    const stats = this.getPerformanceStats();

    // 检测平均响应时间
    if (stats.averageDuration > 100) {
      issues.push(
        `平均导航时间过长: ${stats.averageDuration.toFixed(2)}ms (建议 < 100ms)`
      );
    }

    // 检测失败率
    const failureRate =
      stats.totalNavigations > 0
        ? stats.failedNavigations / stats.totalNavigations
        : 0;
    if (failureRate > 0.05) {
      issues.push(
        `导航失败率过高: ${(failureRate * 100).toFixed(1)}% (建议 < 5%)`
      );
    }

    // 检测性能波动
    const durations = this.navigationData
      .filter((data) => data.duration !== undefined)
      .map((data) => data.duration!);

    if (durations.length > 5) {
      const average = durations.reduce((a, b) => a + b, 0) / durations.length;
      const variance =
        durations.reduce(
          (sum, duration) => sum + (duration - average) ** 2,
          0
        ) / durations.length;
      const standardDeviation = Math.sqrt(variance);
      const coefficientOfVariation = standardDeviation / average;

      if (coefficientOfVariation > 0.5) {
        issues.push(
          `导航性能波动较大: CV=${(coefficientOfVariation * 100).toFixed(
            1
          )}% (建议 < 50%)`
        );
      }
    }

    return issues;
  }

  /**
   * 清理性能数据
   */
  clearData(): void {
    this.metrics.clear();
    this.navigationData.length = 0;
    console.log("🧹 性能数据已清理");
  }

  private logMetric(metric: PerformanceMetric): void {
    const duration = metric.duration!.toFixed(2);
    const metadata = metric.metadata
      ? ` (${JSON.stringify(metric.metadata)})`
      : "";
    console.log(`⏱️ ${metric.name}: ${duration}ms${metadata}`);
  }

  private logNavigationPerformance(data: NavigationPerformanceData): void {
    const status = data.success ? "✅" : "❌";
    const duration = data.duration!.toFixed(2);
    const error = data.error ? ` - ${data.error}` : "";

    console.log(`${status} 导航到 ${data.tabId}: ${duration}ms${error}`);

    // 输出相关指标
    if (data.metrics.length > 0) {
      data.metrics.forEach((metric) => {
        console.log(`  📊 ${metric.name}: ${metric.duration!.toFixed(2)}ms`);
      });
    }

    // 性能警告
    if (data.duration! > 100) {
      console.warn(`⚠️ 导航耗时过长: ${duration}ms`);
    }
  }

  private printPerformanceRecommendations(stats: any): void {
    console.log("\n💡 性能建议:");

    if (stats.averageDuration > 50) {
      console.log("  • 考虑优化导航逻辑以减少响应时间");
    }

    if (stats.failedNavigations > 0) {
      console.log("  • 检查导航错误处理机制");
    }

    if (stats.totalNavigations < 10) {
      console.log("  • 数据样本较少，建议进行更多测试");
    } else {
      console.log("  • 性能数据充足，可进行深入分析");
    }
  }
}

// 导出单例实例
export const performanceDebugger = PerformanceDebugger.getInstance();

// 导出类型
export type { PerformanceMetric, NavigationPerformanceData };
