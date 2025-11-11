import { defineStore } from 'pinia'
import type { LabelData } from '../utils/typeof'


// 你可以任意命名 `defineStore()` 的返回值，但最好使用 store 的名字，同时以 `use` 开头且以 `Store` 结尾。
// (比如 `useUserStore`，`useCartStore`，`useProductStore`)
// 第一个参数是你的应用中 Store 的唯一 ID。
export const useLabelStore = defineStore('labels', {
  // 其他配置...

  state: () => {
    return {
      count: 0,
      data: [] as LabelData[],
      isInitialized: false  // 添加初始化标识
    }
  },

  getters: {
    // 通过ID获取标签名称
    getLabelName: (state) => (id: string | number) => {
      if (!id) return '';
      
      // 确保转换为字符串进行比较
      const label = state.data.find(item => String(item.id) === String(id));
      return label ? String(label.label_name) : `标签${id}`;
    }
  },
  
  actions: {
    // 初始化备用标签数据
    initializeBackupLabels() {
      // 如果标签数据为空，使用备用数据
      if (this.data.length === 0) {
        this.data = [
          { id: 4, label_name: "旅游", incount: 1, moment: "" },
          { id: 5, label_name: "文化", incount: 1, moment: "" }
        ];
      }
      this.isInitialized = true;
    },
    
    // 检查标签ID是否存在
    hasLabelId(id: string | number): boolean {
      return this.data.some(item => String(item.id) === String(id));
    }
  }
})

