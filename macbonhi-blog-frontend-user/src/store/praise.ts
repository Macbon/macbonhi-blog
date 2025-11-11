import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'

interface PraiseState {
  [articleId: number]: {
    count: number
    isPraised: boolean
  }
}

export const usePraiseStore = defineStore('praise', () => {
  // 使用 reactive 而不是 ref，确保深层响应式
  const praiseStates = reactive<PraiseState>({})

  // 设置文章点赞状态
  const setPraiseState = (articleId: number, count: number, isPraised: boolean) => {
    // 使用 Vue.set 的等效方式确保响应式
    praiseStates[articleId] = { count, isPraised }
  }

  // 获取文章点赞状态
  const getPraiseState = (articleId: number) => {
    return praiseStates[articleId] || { count: 0, isPraised: false }
  }

  // 更新点赞数量
  const updatePraiseCount = (articleId: number, count: number) => {
    if (praiseStates[articleId]) {
      praiseStates[articleId].count = count
    } else {
      praiseStates[articleId] = { count, isPraised: false }
    }
  }

  // 切换点赞状态 - 确保触发响应式更新
  const togglePraiseStatus = (articleId: number, isPraised: boolean, count: number) => {
    // 创建新对象确保触发响应式
    praiseStates[articleId] = { 
      count: count, 
      isPraised: isPraised 
    }
  }

  // 批量设置点赞状态
  const setBatchPraiseStates = (states: Array<{id: number, count: number, isPraised: boolean}>) => {
    states.forEach(state => {
      praiseStates[state.id] = { count: state.count, isPraised: state.isPraised }
    })
  }

  // 清除文章点赞状态（用于调试）
  const clearPraiseState = (articleId: number) => {
    delete praiseStates[articleId]
  }

  return {
    praiseStates,
    setPraiseState,
    getPraiseState,
    updatePraiseCount,
    togglePraiseStatus,
    setBatchPraiseStates,
    clearPraiseState
  }
})