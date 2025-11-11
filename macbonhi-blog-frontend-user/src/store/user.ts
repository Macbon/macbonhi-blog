import { defineStore } from 'pinia'

// 正确定义store
export const useUserStore = defineStore('user', {
  state: () => ({
    id: -1,
    name: '',
    token: '',
  }),
  
  actions: {
    // 添加登出方法
    logout() {
      this.id = -1
      this.name = ''
      this.token = ''
    }
  },

  //正确的持久化配置
  persist: {
    storage:sessionStorage,
  }
})