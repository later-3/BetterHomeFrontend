/**
 * 错误处理 Composable
 * 为Vue组件提供统一的错误处理能力
 */

import { getCurrentInstance, onErrorCaptured, readonly, ref } from "vue";
import { type ErrorHandlerOptions, errorHandler } from "@/utils/errorHandler";

export interface UseErrorHandlerOptions {
  pageName?: string;
  enableErrorBoundary?: boolean;
  onError?: (error: Error) => void;
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const { pageName = "Unknown", enableErrorBoundary = true, onError } = options;

  const instance = getCurrentInstance();
  const hasError = ref(false);
  const errorMessage = ref("");
  const isLoading = ref(false);

  /**
   * 处理页面加载错误
   */
  const handlePageError = (
    error: Error,
    customOptions?: ErrorHandlerOptions
  ) => {
    hasError.value = true;
    errorMessage.value = error.message;

    const errorInfo = errorHandler.handlePageError(
      error,
      pageName,
      customOptions
    );

    if (onError) {
      onError(error);
    }

    return errorInfo;
  };

  /**
   * 处理导航错误
   */
  const handleNavigationError = (
    error: Error,
    targetPath: string,
    customOptions?: ErrorHandlerOptions
  ) => {
    const errorInfo = errorHandler.handleNavigationError(
      error,
      targetPath,
      customOptions
    );

    if (onError) {
      onError(error);
    }

    return errorInfo;
  };

  /**
   * 处理API错误
   */
  const handleApiError = (
    error: Error,
    apiPath: string,
    customOptions?: ErrorHandlerOptions
  ) => {
    const errorInfo = errorHandler.handleApiError(
      error,
      apiPath,
      customOptions
    );

    if (onError) {
      onError(error);
    }

    return errorInfo;
  };

  /**
   * 安全执行异步操作
   */
  const safeAsync = async <T>(
    asyncFn: () => Promise<T>,
    errorOptions?: ErrorHandlerOptions
  ): Promise<T | null> => {
    try {
      isLoading.value = true;
      hasError.value = false;
      errorMessage.value = "";

      const result = await asyncFn();
      return result;
    } catch (error) {
      const err = error as Error;
      handlePageError(err, errorOptions);
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 安全执行同步操作
   */
  const safeSync = <T>(
    syncFn: () => T,
    errorOptions?: ErrorHandlerOptions
  ): T | null => {
    try {
      hasError.value = false;
      errorMessage.value = "";

      return syncFn();
    } catch (error) {
      const err = error as Error;
      handlePageError(err, errorOptions);
      return null;
    }
  };

  /**
   * 重置错误状态
   */
  const resetError = () => {
    hasError.value = false;
    errorMessage.value = "";
  };

  /**
   * 重试操作
   */
  const retry = async <T>(
    operation: () => Promise<T> | T,
    maxRetries = 3,
    delay = 1000
  ): Promise<T | null> => {
    let lastError: Error | null = null;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const result = await operation();
        resetError();
        return result;
      } catch (error) {
        lastError = error as Error;

        if (i < maxRetries - 1) {
          // 等待后重试
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // 所有重试都失败了
    if (lastError) {
      handlePageError(lastError, {
        fallbackMessage: `操作失败，已重试${maxRetries}次`,
      });
    }

    return null;
  };

  /**
   * 错误边界处理
   */
  if (enableErrorBoundary && instance) {
    onErrorCaptured((error: Error, instance, info) => {
      console.error("[Error Boundary]", error, info);

      const componentName =
        instance?.$options.name ||
        instance?.$options.__name ||
        "Unknown Component";
      errorHandler.handleComponentError(error, componentName);

      hasError.value = true;
      errorMessage.value = error.message;

      if (onError) {
        onError(error);
      }

      // 返回false阻止错误继续传播
      return false;
    });
  }

  return {
    // 状态
    hasError: readonly(hasError),
    errorMessage: readonly(errorMessage),
    isLoading: readonly(isLoading),

    // 方法
    handlePageError,
    handleNavigationError,
    handleApiError,
    safeAsync,
    safeSync,
    resetError,
    retry,
  };
}
