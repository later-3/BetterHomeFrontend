import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
  state: () => {
    return {
      // 基础状态结构 - 第1步
      isLoggedIn: false,
      token: '', // 添加token字段
      tokenExpiry: null as Date | null, // 添加token过期时间
      userInfo: {
        id: '',
        first_name: '',
        last_name: '',
        email: '',
        community_id: '',
        community_name: ''
      }
    };
  },
  getters: {
    // 简单的登录状态判断
    loggedIn: (state) => {
      return state.isLoggedIn && !!state.userInfo.id;
    },
    // 检查token是否即将过期（提前5分钟警告）
    tokenNearExpiry: (state) => {
      if (!state.tokenExpiry) return false;
      const now = new Date();
      const warningTime = new Date(state.tokenExpiry.getTime() - 5 * 60 * 1000); // 提前5分钟
      return now >= warningTime;
    },
    // 检查token是否已过期
    tokenExpired: (state) => {
      if (!state.tokenExpiry) return false;
      return new Date() >= state.tokenExpiry;
    }
  },
  actions: {
    // 第2步：基础状态操作功能
    login(
      userInfo: {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
        community_id: string;
        community_name: string;
      },
      token?: string,
      expiryMinutes?: number
    ) {
      this.isLoggedIn = true;
      this.userInfo = { ...userInfo };
      if (token) {
        this.token = token;
        // 设置token过期时间，默认2小时（移动应用标准）
        const expiry = expiryMinutes || 120; // 2小时
        this.tokenExpiry = new Date(Date.now() + expiry * 60 * 1000);
      }
    },

    logout() {
      this.isLoggedIn = false;
      this.token = '';
      this.tokenExpiry = null;
      this.userInfo = {
        id: '',
        first_name: '',
        last_name: '',
        email: '',
        community_id: '',
        community_name: ''
      };
    },

    // 刷新token的有效期（当获取到新token时调用）
    refreshToken(newToken: string, expiryMinutes?: number) {
      this.token = newToken;
      const expiry = expiryMinutes || 120; // 2小时
      this.tokenExpiry = new Date(Date.now() + expiry * 60 * 1000);
    }
  },
  // 第4步：添加持久化配置 - 使用strategies格式
  persist: {
    enabled: true,
    strategies: [
      {
        key: 'user',
        storage: {
          getItem: (key: string) => uni.getStorageSync(key),
          setItem: (key: string, value: any) => uni.setStorageSync(key, value),
          removeItem: (key: string) => uni.removeStorageSync(key),
          clear: () => uni.clearStorageSync(),
          key: (_index: number) => '',
          get length() {
            return 0;
          }
        },
        paths: ['isLoggedIn', 'userInfo', 'token', 'tokenExpiry']
      }
    ]
  }
});

export default useUserStore;
