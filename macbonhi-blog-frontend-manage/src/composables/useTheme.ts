// useTheme.ts - 改进版
import { ref, watch, onMounted } from 'vue'

export type Theme = 'light' | 'dark'

// 将状态提升到模块级别，使其全局共享
const currentTheme = ref<Theme>('light')

export const useTheme = () => {
  
  // 切换主题
  const toggleTheme = () => {
    currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light'
  }
  
  // 设置主题
  const setTheme = (theme: Theme) => {
    currentTheme.value = theme
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }
  
  // 监听主题变化
  watch(currentTheme, (newTheme) => {
    setTheme(newTheme)
  })
  
  // 初始化主题 - 只在第一次调用时执行
  const initTheme = () => {
    const savedTheme = localStorage.getItem('theme') as Theme
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light')
    setTheme(initialTheme)
  }
  
  // 每个组件挂载时不需要重复初始化
  onMounted(() => {
    // 检查是否已经初始化
    if (!document.documentElement.getAttribute('data-theme')) {
      initTheme()
    }
  })
  
  return {
    currentTheme,
    toggleTheme,
    setTheme,
    initTheme
  }
}