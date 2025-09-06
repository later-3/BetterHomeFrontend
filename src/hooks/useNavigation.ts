import useNavigationStore from '@/store/navigation';
import { errorHandler } from '@/utils/errorHandler';

/**
 * 导航相关的组合式函数
 */
export function useNavigation() {
  const navigationStore = useNavigationStore();

  /**
   * 初始化页面导航状态
   * @param pageName 页面名称
   */
  const initPageNavigation = (pageName: string) => {
    navigationStore.setCurrentTabByName(pageName);
  };

  /**
   * 导航到指定标签页
   * @param tabId 标签页ID
   */
  const navigateToTab = async (tabId: string): Promise<void> => {
    try {
      await navigationStore.navigateToTabById(tabId);
    } catch (error) {
      console.error(`导航到标签页 ${tabId} 失败:`, error);
      throw error; // 重新抛出错误，让调用者处理
    }
  };

  /**
   * 导航到指定索引的标签页
   * @param index 标签页索引
   */
  const navigateToTabByIndex = async (index: number): Promise<void> => {
    try {
      await navigationStore.navigateToTab(index);
    } catch (error) {
      console.error(`导航到标签页索引 ${index} 失败:`, error);
      throw error; // 重新抛出错误，让调用者处理
    }
  };

  /**
   * 设置标签页徽章
   * @param tabId 标签页ID
   * @param badge 徽章数量
   */
  const setTabBadge = (tabId: string, badge?: number) => {
    navigationStore.setBadge(tabId, badge);
  };

  /**
   * 清除标签页徽章
   * @param tabId 标签页ID
   */
  const clearTabBadge = (tabId: string) => {
    navigationStore.clearBadge(tabId);
  };

  /**
   * 处理标签页切换事件
   * 这个函数可以在页面的onTabItemTap事件中调用
   * @param item 标签页项目信息
   */
  const handleTabItemTap = async (item: any) => {
    try {
      console.log('标签页切换:', item);
      if (item.index !== undefined) {
        await navigationStore.navigateToTab(item.index);
      }
    } catch (error) {
      console.error('标签页切换失败:', error);
      // 错误已经在store中处理，这里只需要记录日志
    }
  };

  /**
   * 安全导航方法 - 带有错误处理和回退机制
   * @param tabId 标签页ID
   * @param fallbackTabId 回退标签页ID（默认为首页）
   */
  const safeNavigateToTab = async (
    tabId: string,
    fallbackTabId = 'home'
  ): Promise<boolean> => {
    try {
      await navigateToTab(tabId);
      return true;
    } catch (error) {
      console.warn(`导航到 ${tabId} 失败，尝试回退到 ${fallbackTabId}`);
      try {
        if (fallbackTabId !== tabId) {
          await navigateToTab(fallbackTabId);
        } else {
          // 如果回退页面就是目标页面，直接使用store的回退机制
          await navigationStore.fallbackNavigation();
        }
        return false;
      } catch (fallbackError) {
        console.error('回退导航也失败了:', fallbackError);
        return false;
      }
    }
  };

  return {
    // 状态
    navigationStore,
    currentTab: computed(() => navigationStore.currentTab),
    currentTabItem: computed(() => navigationStore.currentTabItem),
    tabs: computed(() => navigationStore.tabs),

    // 方法
    initPageNavigation,
    navigateToTab,
    navigateToTabByIndex,
    setTabBadge,
    clearTabBadge,
    handleTabItemTap,
    safeNavigateToTab
  };
}

/**
 * 页面导航初始化的组合式函数
 * 在页面的onLoad中调用
 * @param pageName 页面名称
 */
export function usePageNavigation(pageName: string) {
  const { initPageNavigation, navigationStore, handleTabItemTap } =
    useNavigation();

  onLoad(() => {
    try {
      initPageNavigation(pageName);
      // 执行导航健康检查
      navigationStore.checkNavigationHealth();
    } catch (error) {
      console.error(`页面 ${pageName} 导航初始化失败:`, error);
      errorHandler.handlePageError(error as Error, pageName, {
        fallbackMessage: '页面导航初始化失败'
      });
    }
  });

  // 监听标签页切换事件
  onTabItemTap(async (item) => {
    try {
      console.log(`标签页切换到: ${item.text}, 索引: ${item.index}`);
      await handleTabItemTap(item);
    } catch (error) {
      console.error('标签页切换事件处理失败:', error);
    }
  });

  return {
    navigationStore,
    currentTab: computed(() => navigationStore.currentTab),
    currentTabItem: computed(() => navigationStore.currentTabItem)
  };
}
