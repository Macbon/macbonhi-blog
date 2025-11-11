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
      // 按分类类型存储不同的分类数据
      dataByType: {
        0: [] as SubsetData[], // 文章分类
        1: [] as SubsetData[], // 图库分类
        2: [] as SubsetData[]  // 文件分类
      },
      // 保留原有data以兼容现有代码
      data: [] as SubsetData[]
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
    // 更新指定类型的分类数据
    updateSubsetsByType(type: number, subsets: SubsetData[], count: number) {
      this.dataByType[type] = subsets;
      // 更新当前活动的分类数据（兼容现有代码）
      this.data = subsets;
      this.count = count;
    },
    
    // 获取指定类型的分类数据
    getSubsetsByType(type: number) {
      return this.dataByType[type] || [];
    },
    
    subsetName(e?: number, type?: number) {
      // 如果指定了类型，从对应类型的数据中查找
      if (type !== undefined && this.dataByType[type]) {
        for (let i = 0; i < this.dataByType[type].length; i++){
          if (this.dataByType[type][i].id === e) {
            return this.dataByType[type][i].name
          }
        }
      } else {
        // 否则从当前活动的数据中查找（兼容现有代码）
        for (let i = 0; i < this.$state.data.length; i++){
          if (this.$state.data[i].id === e) {
            return this.$state.data[i].name
          }
        }
      }
      return "未分类"
    }
  }

})