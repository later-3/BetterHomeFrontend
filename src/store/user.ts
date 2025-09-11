import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
  state: () => {
    return {
      // 基础状态结构 - 第1步
      isLoggedIn: false,
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
    }
  },
  actions: {
    // 第2步：基础状态操作功能
    login(userInfo: {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
      community_id: string;
      community_name: string;
    }) {
      this.isLoggedIn = true;
      this.userInfo = { ...userInfo };
    },

    logout() {
      this.isLoggedIn = false;
      this.userInfo = {
        id: '',
        first_name: '',
        last_name: '',
        email: '',
        community_id: '',
        community_name: ''
      };
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
        paths: ['isLoggedIn', 'userInfo']
      }
    ]
  }
});
