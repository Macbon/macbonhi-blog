import { defineStore } from 'pinia'
import type { SubsetData } from '../utils/typeof'


// 你可以任意命名 `defineStore()` 的返回值，但最好使用 store 的名字，同时以 `use` 开头且以 `Store` 结尾。
// (比如 `useUserStore`，`useCartStore`，`useProductStore`)
// 第一个参数是你的应用中 Store 的唯一 ID。
export const useSubsetStore = defineStore('subsets', {
  // 其他配置...

  state: () => {
    return {
      count: 0,
      data:[] as SubsetData[]
    }
  },

  getters: {
    exclude: (state) => {
      let arr = []

      let n = state.count;

      //拿到所有id计算未分组数
      for (let i = 0; i < state.data.length; i++){
        arr[i] = state.data[i].id;

        n = n - state.data[i].count;

      }

      return {id:arr.join(','), name:"未分类", count: n }
    }
  },

  actions: {
    subsetName(e?: number) {
      for (let i = 0; i < this.$state.data.length; i++){
        if (this.$state.data[i].id === e) {
          return this.$state.data[i].name
        }
      }
      return "未分类"
    }
  }

})