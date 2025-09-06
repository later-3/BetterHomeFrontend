import { errorHandler } from '@/utils/errorHandler';
import { performanceDebugger } from '@/utils/performanceDebugger';

export interface TabItem {
  id: string;
  name: string;
  path: string;
  text: string;
  icon: string;
  activeIcon: string;
  badge?: number;
}

export interface TabBarState {
  currentTab: number;
  tabs: TabItem[];
}

const useNavigationStore = defineStore(
  'navigation',
  () => {
    // 定义导航标签页数据
    const tabs = ref<TabItem[]>([
      {
        id: 'home',
        name: 'index',
        path: '/pages/index/index',
        text: '首页',
        icon: 'static/icons/home.png',
        activeIcon: 'static/icons/home-active.png'
      },
      {
        id: 'create',
        name: 'create',
        path: '/pages/create/create',
        text: '创建',
        icon: 'static/icons/add.png',
        activeIcon: 'static/icons/add-active.png'
      },
      {
        id: 'profile',
        name: 'profile',
        path: '/pages/profile/profile',
        text: '我',
        icon: 'static/icons/profile.png',
        activeIcon: 'static/icons/profile-active.png'
      }
    ]);

    // 当前激活的标签页索引
    const currentTab = ref<number>(0);

    // 计算属性：当前激活的标签页
    const currentTabItem = computed(() => {
      return tabs.value[currentTab.value] || tabs.value[0];
    });

    // 计算属性：当前页面路径
    const currentPath = computed(() => {
      return currentTabItem.value?.path || '/pages/index/index';
    });

    // 设置当前标签页
    const setCurrentTab = (index: number) => {
      if (index >= 0 && index < tabs.value.length) {
        currentTab.value = index;
      }
    };

    // 根据路径设置当前标签页
    const setCurrentTabByPath = (path: string) => {
      const index = tabs.value.findIndex((tab) => tab.path === path);
      if (index !== -1) {
        currentTab.value = index;
      }
    };

    // 根据页面名称设置当前标签页
    const setCurrentTabByName = (name: string) => {
      const index = tabs.value.findIndex((tab) => tab.name === name);
      if (index !== -1) {
        currentTab.value = index;
      }
    };

    // 导航到指定标签页
    const navigateToTab = (index: number): Promise<void> => {
      return new Promise((resolve, reject) => {
        try {
          if (index < 0 || index >= tabs.value.length) {
            const error = new Error(`无效的标签页索引: ${index}`);
            errorHandler.handleNavigationError(error, `tab-${index}`, {
              fallbackMessage: '导航失败，标签页不存在'
            });
            reject(error);
            return;
          }

          const previousTab = currentTab.value;
          const targetTab = tabs.value[index];

          // 开始性能监控
          const navigationId = performanceDebugger.startNavigation(
            targetTab.id
          );
          performanceDebugger.startMetric('navigation-state-update');

          // 先更新状态
          setCurrentTab(index);
          performanceDebugger.endMetric('navigation-state-update');

          performanceDebugger.startMetric('uni-switchTab');
          uni.switchTab({
            url: targetTab.path,
            success: () => {
              performanceDebugger.endMetric('uni-switchTab');
              performanceDebugger.endNavigation(navigationId, true);
              console.log(`导航到 ${targetTab.text} 成功`);
              resolve();
            },
            fail: (error) => {
              performanceDebugger.endMetric('uni-switchTab');
              performanceDebugger.endNavigation(
                navigationId,
                false,
                error.errMsg
              );
              console.error(`导航到 ${targetTab.text} 失败:`, error);

              // 恢复之前的状态
              setCurrentTab(previousTab);

              // 处理导航错误
              const navError = new Error(
                `导航到${targetTab.text}失败: ${error.errMsg || '未知错误'}`
              );
              errorHandler.handleNavigationError(navError, targetTab.path, {
                fallbackMessage: `无法打开${targetTab.text}，请重试`
              });

              reject(navError);
            }
          });
        } catch (error) {
          const navError = error as Error;
          errorHandler.handleNavigationError(navError, `tab-${index}`, {
            fallbackMessage: '导航过程中发生错误'
          });
          reject(navError);
        }
      });
    };

    // 设置标签页徽章
    const setBadge = (tabId: string, badge?: number) => {
      const tab = tabs.value.find((t) => t.id === tabId);
      if (tab) {
        tab.badge = badge;
      }
    };

    // 清除标签页徽章
    const clearBadge = (tabId: string) => {
      setBadge(tabId, undefined);
    };

    // 获取标签页信息
    const getTabById = (id: string) => {
      return tabs.value.find((tab) => tab.id === id);
    };

    const getTabByIndex = (index: number) => {
      return tabs.value[index];
    };

    // 安全导航到指定标签页（通过ID）
    const navigateToTabById = async (tabId: string): Promise<void> => {
      try {
        const tabIndex = tabs.value.findIndex((tab) => tab.id === tabId);
        if (tabIndex === -1) {
          throw new Error(`找不到ID为 ${tabId} 的标签页`);
        }
        await navigateToTab(tabIndex);
      } catch (error) {
        const navError = error as Error;
        errorHandler.handleNavigationError(navError, `/tab/${tabId}`, {
          fallbackMessage: `无法打开${tabId}页面，请重试`
        });
        throw navError;
      }
    };

    // 安全导航到指定标签页（通过名称）
    const navigateToTabByName = async (tabName: string): Promise<void> => {
      try {
        const tabIndex = tabs.value.findIndex((tab) => tab.name === tabName);
        if (tabIndex === -1) {
          throw new Error(`找不到名称为 ${tabName} 的标签页`);
        }
        await navigateToTab(tabIndex);
      } catch (error) {
        const navError = error as Error;
        errorHandler.handleNavigationError(navError, `/tab/${tabName}`, {
          fallbackMessage: `无法打开${tabName}页面，请重试`
        });
        throw navError;
      }
    };

    // 导航回退机制
    const fallbackNavigation = async (): Promise<void> => {
      try {
        console.log('执行导航回退到首页');
        await navigateToTab(0); // 回退到首页
      } catch (error) {
        console.error('导航回退失败，尝试重新加载应用:', error);
        // 最后的回退方案：重新加载应用
        uni.reLaunch({
          url: '/pages/index/index',
          fail: (err) => {
            console.error('重新加载应用失败:', err);
            uni.showModal({
              title: '应用错误',
              content: '应用出现严重错误，请重启应用',
              showCancel: false
            });
          }
        });
      }
    };

    // 检查导航状态健康性
    const checkNavigationHealth = (): boolean => {
      try {
        // 检查当前标签页索引是否有效
        if (currentTab.value < 0 || currentTab.value >= tabs.value.length) {
          console.warn('导航状态异常：当前标签页索引无效');
          setCurrentTab(0); // 重置为首页
          return false;
        }

        // 检查标签页数据完整性
        const currentTabData = tabs.value[currentTab.value];
        if (!currentTabData || !currentTabData.path) {
          console.warn('导航状态异常：当前标签页数据不完整');
          setCurrentTab(0); // 重置为首页
          return false;
        }

        return true;
      } catch (error) {
        console.error('导航健康检查失败:', error);
        setCurrentTab(0); // 重置为首页
        return false;
      }
    };

    // 初始化导航状态（根据当前页面路径）
    const initNavigation = () => {
      try {
        const pages = getCurrentPages();
        if (pages.length > 0) {
          const currentPage = pages[pages.length - 1];
          const currentRoute = `/${currentPage.route}`;
          setCurrentTabByPath(currentRoute);
        }

        // 执行健康检查
        if (!checkNavigationHealth()) {
          console.warn('导航初始化后健康检查失败，已重置为首页');
        }
      } catch (error) {
        console.error('导航初始化失败:', error);
        errorHandler.handleNavigationError(error as Error, '/init', {
          fallbackMessage: '导航初始化失败'
        });
        // 设置为默认状态
        setCurrentTab(0);
      }
    };

    return {
      // 状态
      tabs: readonly(tabs),
      currentTab: readonly(currentTab),

      // 计算属性
      currentTabItem,
      currentPath,

      // 方法
      setCurrentTab,
      setCurrentTabByPath,
      setCurrentTabByName,
      navigateToTab,
      navigateToTabById,
      navigateToTabByName,
      setBadge,
      clearBadge,
      getTabById,
      getTabByIndex,
      initNavigation,
      fallbackNavigation,
      checkNavigationHealth
    };
  },
  {
    persist: {
      enabled: true,
      strategies: [
        {
          key: 'navigation',
          storage: {
            getItem: (key: string) => uni.getStorageSync(key),
            setItem: (key: string, value: any) =>
              uni.setStorageSync(key, value),
            removeItem: (key: string) => uni.removeStorageSync(key),
            clear: () => uni.clearStorageSync(),
            key: (_index: number) => '',
            get length() {
              return 0;
            }
          },
          paths: ['currentTab'] // 只持久化当前标签页索引
        }
      ]
    }
  }
);

export default useNavigationStore;
