/**
 * 全局错误处理器
 * 捕获应用中未处理的错误并进行统一处理
 */

import { errorHandler } from './errorHandler';

/**
 * 初始化全局错误处理
 */
export function initGlobalErrorHandler() {
  // 捕获Vue组件中的未处理错误
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      console.error('[Global Error]', event.error);
      errorHandler.handlePageError(
        event.error || new Error(event.message),
        'global',
        {
          fallbackMessage: '应用发生未知错误',
          showToast: true
        }
      );
    });

    // 捕获Promise中的未处理错误
    window.addEventListener('unhandledrejection', (event) => {
      console.error('[Unhandled Promise Rejection]', event.reason);
      const error =
        event.reason instanceof Error
          ? event.reason
          : new Error(String(event.reason));

      errorHandler.handlePageError(error, 'promise', {
        fallbackMessage: '异步操作发生错误',
        showToast: true
      });

      // 阻止默认的控制台错误输出
      event.preventDefault();
    });
  }

  // uni-app 特有的错误处理
  if (typeof uni !== 'undefined') {
    // 监听应用错误
    uni.onError?.((error) => {
      console.error('[Uni App Error]', error);
      errorHandler.handlePageError(new Error(error), 'uni-app', {
        fallbackMessage: '应用运行时错误',
        showToast: true
      });
    });

    // 监听页面未找到错误
    uni.onPageNotFound?.((res) => {
      console.error('[Page Not Found]', res);
      errorHandler.handleNavigationError(
        new Error(`页面未找到: ${res.path}`),
        res.path,
        {
          fallbackMessage: '页面不存在，已为您跳转到首页'
        }
      );
    });
  }
}

/**
 * 手动报告错误
 * @param error 错误对象
 * @param context 错误上下文
 */
export function reportError(error: Error, context = 'manual') {
  errorHandler.handlePageError(error, context, {
    fallbackMessage: '操作失败，请重试'
  });
}

/**
 * 创建错误边界装饰器
 * 用于包装可能出错的函数
 */
export function withErrorBoundary<T extends (...args: any[]) => any>(
  fn: T,
  context = 'function'
): T {
  return ((...args: any[]) => {
    try {
      const result = fn(...args);

      // 如果返回Promise，需要处理Promise中的错误
      if (result && typeof result.then === 'function') {
        return result.catch((error: Error) => {
          errorHandler.handlePageError(error, context, {
            fallbackMessage: '操作失败，请重试'
          });
          throw error;
        });
      }

      return result;
    } catch (error) {
      errorHandler.handlePageError(error as Error, context, {
        fallbackMessage: '操作失败，请重试'
      });
      throw error;
    }
  }) as T;
}

/**
 * 创建异步错误边界装饰器
 */
export function withAsyncErrorBoundary<
  T extends (...args: any[]) => Promise<any>
>(fn: T, context = 'async-function'): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      errorHandler.handlePageError(error as Error, context, {
        fallbackMessage: '操作失败，请重试'
      });
      throw error;
    }
  }) as T;
}
