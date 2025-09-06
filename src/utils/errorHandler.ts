/**
 * 错误处理工具类
 * 提供统一的错误处理、日志记录和用户反馈机制
 */

export interface ErrorInfo {
  message: string;
  code?: string | number;
  stack?: string;
  timestamp: number;
  page?: string;
  action?: string;
  userAgent?: string;
}

export interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  fallbackMessage?: string;
  duration?: number;
}

class ErrorHandler {
  private errorLogs: ErrorInfo[] = [];
  private maxLogSize = 100; // 最大日志条数

  /**
   * 处理页面加载错误
   */
  handlePageError(
    error: Error,
    pageName: string,
    options: ErrorHandlerOptions = {}
  ) {
    const {
      showToast = true,
      logError = true,
      fallbackMessage = '页面加载失败，请重试',
      duration = 2000
    } = options;

    const errorInfo: ErrorInfo = {
      message: error.message || fallbackMessage,
      code: 'PAGE_LOAD_ERROR',
      stack: error.stack,
      timestamp: Date.now(),
      page: pageName,
      action: 'page_load',
      userAgent: this.getUserAgent()
    };

    if (logError) {
      this.logError(errorInfo);
    }

    if (showToast) {
      uni.showToast({
        title: fallbackMessage,
        icon: 'none',
        duration
      });
    }

    return errorInfo;
  }

  /**
   * 处理导航错误
   */
  handleNavigationError(
    error: Error,
    targetPath: string,
    options: ErrorHandlerOptions = {}
  ) {
    const {
      showToast = true,
      logError = true,
      fallbackMessage = '导航失败，请重试',
      duration = 2000
    } = options;

    const errorInfo: ErrorInfo = {
      message: error.message || fallbackMessage,
      code: 'NAVIGATION_ERROR',
      stack: error.stack,
      timestamp: Date.now(),
      page: targetPath,
      action: 'navigation',
      userAgent: this.getUserAgent()
    };

    if (logError) {
      this.logError(errorInfo);
    }

    if (showToast) {
      uni.showToast({
        title: fallbackMessage,
        icon: 'none',
        duration
      });
    }

    // 导航失败时回退到首页
    this.fallbackToHome();

    return errorInfo;
  }

  /**
   * 处理API请求错误
   */
  handleApiError(
    error: Error,
    apiPath: string,
    options: ErrorHandlerOptions = {}
  ) {
    const {
      showToast = true,
      logError = true,
      fallbackMessage = '网络请求失败，请检查网络连接',
      duration = 2000
    } = options;

    const errorInfo: ErrorInfo = {
      message: error.message || fallbackMessage,
      code: 'API_ERROR',
      stack: error.stack,
      timestamp: Date.now(),
      page: apiPath,
      action: 'api_request',
      userAgent: this.getUserAgent()
    };

    if (logError) {
      this.logError(errorInfo);
    }

    if (showToast) {
      uni.showToast({
        title: fallbackMessage,
        icon: 'none',
        duration
      });
    }

    return errorInfo;
  }

  /**
   * 处理组件渲染错误
   */
  handleComponentError(
    error: Error,
    componentName: string,
    options: ErrorHandlerOptions = {}
  ) {
    const {
      showToast = false, // 组件错误默认不显示toast
      logError = true,
      fallbackMessage = '组件渲染失败'
    } = options;

    const errorInfo: ErrorInfo = {
      message: error.message || fallbackMessage,
      code: 'COMPONENT_ERROR',
      stack: error.stack,
      timestamp: Date.now(),
      page: componentName,
      action: 'component_render',
      userAgent: this.getUserAgent()
    };

    if (logError) {
      this.logError(errorInfo);
    }

    if (showToast) {
      uni.showToast({
        title: fallbackMessage,
        icon: 'none',
        duration: 2000
      });
    }

    return errorInfo;
  }

  /**
   * 记录错误日志
   */
  private logError(errorInfo: ErrorInfo) {
    // 添加到本地日志
    this.errorLogs.unshift(errorInfo);

    // 保持日志大小限制
    if (this.errorLogs.length > this.maxLogSize) {
      this.errorLogs = this.errorLogs.slice(0, this.maxLogSize);
    }

    // 控制台输出
    console.error('[ErrorHandler]', errorInfo);

    // 存储到本地存储
    try {
      uni.setStorageSync(
        'error_logs',
        JSON.stringify(this.errorLogs.slice(0, 50))
      );
    } catch (e) {
      console.warn('Failed to save error logs to storage:', e);
    }

    // 这里可以添加上报到服务器的逻辑
    // this.reportToServer(errorInfo);
  }

  /**
   * 获取用户代理信息
   */
  private getUserAgent(): string {
    try {
      const systemInfo = uni.getSystemInfoSync();
      return `${systemInfo.platform} ${systemInfo.system} ${systemInfo.version}`;
    } catch (e) {
      return 'Unknown';
    }
  }

  /**
   * 回退到首页
   */
  private fallbackToHome() {
    try {
      uni.switchTab({
        url: '/pages/index/index',
        fail: (err) => {
          console.error('Failed to fallback to home:', err);
          // 如果switchTab失败，尝试使用reLaunch
          uni.reLaunch({
            url: '/pages/index/index'
          });
        }
      });
    } catch (e) {
      console.error('Critical navigation error:', e);
    }
  }

  /**
   * 获取错误日志
   */
  getErrorLogs(): ErrorInfo[] {
    return [...this.errorLogs];
  }

  /**
   * 清除错误日志
   */
  clearErrorLogs() {
    this.errorLogs = [];
    try {
      uni.removeStorageSync('error_logs');
    } catch (e) {
      console.warn('Failed to clear error logs from storage:', e);
    }
  }

  /**
   * 从存储中恢复错误日志
   */
  restoreErrorLogs() {
    try {
      const storedLogs = uni.getStorageSync('error_logs');
      if (storedLogs) {
        this.errorLogs = JSON.parse(storedLogs);
      }
    } catch (e) {
      console.warn('Failed to restore error logs from storage:', e);
    }
  }
}

// 创建全局错误处理器实例
export const errorHandler = new ErrorHandler();

// 在应用启动时恢复错误日志
errorHandler.restoreErrorLogs();
