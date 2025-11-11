import { defineStore } from 'pinia'

// 使用节流函数提高性能
function throttle(fn: Function, delay: number) {
  let lastCall = 0;
  return function(...args: any[]) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return fn(...args);
    }
  };
}

// 优化后的store定义
export const useUserStore = defineStore('user', {
  state: () => ({
    id: -1,
    name: '',
    token: '',
    // 添加非持久化字段
    notifications: [] as any[],
    preferences: {
      theme: '', // 使用主题store管理主题，避免重复
      fontSize: 'medium',
      language: 'zh-CN'
    }
  }),
  
  actions: {
    // 添加登出方法
    logout() {
      this.id = -1
      this.name = ''
      this.token = ''
      // 清空非持久化字段
      this.notifications = []
      // 重置偏好设置但保留主题(由theme store管理)
      this.preferences = {
        ...this.preferences,
        fontSize: 'medium',
        language: 'zh-CN'
      }
    },
    
    // 添加更新用户信息的方法，避免直接修改state
    updateUserInfo(userInfo: {id?: number, name?: string, token?: string}) {
      if (userInfo.id !== undefined) this.id = userInfo.id
      if (userInfo.name !== undefined) this.name = userInfo.name
      if (userInfo.token !== undefined) this.token = userInfo.token
    },
    
    // 添加更新偏好设置的方法
    updatePreference(key: string, value: any) {
      if (key in this.preferences) {
        this.preferences[key as keyof typeof this.preferences] = value
      }
    }
  },

  // 修复持久化配置 - 使用兼容的格式
  persist: true  // 简化配置，存储所有状态
})