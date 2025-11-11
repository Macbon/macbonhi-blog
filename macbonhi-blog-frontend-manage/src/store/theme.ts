// stores/theme.ts
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type Theme = 'light' | 'dark'

export const useThemeStore = defineStore('theme', () => {
  const currentTheme = ref<Theme>('light')
  
  // 切换主题
  const toggleTheme = () => {
    currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light'
  }
  
  // 设置主题 - 优化后添加条件判断，避免重复操作
  const setTheme = (theme: Theme) => {
    // 优化点：只在主题确实改变时才更新状态和DOM
    if (currentTheme.value !== theme) {
      currentTheme.value = theme
      
      // 直接更新DOM，避免等待下一个监听周期
      updateDOMTheme(theme)
      saveThemeToStorage(theme)
    }
  }
  
  // 初始化主题 - 提取DOM操作和存储操作为独立函数
  const initTheme = () => {
    const savedTheme = localStorage.getItem('theme') as Theme
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light')
    setTheme(initialTheme)
    
    // 添加系统主题变化的监听，提升用户体验
    setupSystemThemeListener()
  }
  
  // 新增：监听系统主题变化
  const setupSystemThemeListener = () => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    // 添加媒体查询变化监听
    const handleChange = (e: MediaQueryListEvent) => {
      // 仅在用户未手动设置主题时跟随系统
      if (!localStorage.getItem('theme')) {
        const newTheme = e.matches ? 'dark' : 'light'
        setTheme(newTheme)
      }
    }
    
    // 现代浏览器的事件监听方式
    mediaQuery.addEventListener('change', handleChange)
    
    // 返回清除函数，在组件卸载时调用
    return () => mediaQuery.removeEventListener('change', handleChange)
  }
  
  // 提取DOM更新为单独函数，便于复用和测试
  const updateDOMTheme = (theme: Theme) => {
    // 检查当前DOM上的主题是否需要更新
    const currentDomTheme = document.documentElement.getAttribute('data-theme')
    
    if (currentDomTheme !== theme) {
      document.documentElement.setAttribute('data-theme', theme)
    }
  }
  
  // 提取存储操作为单独函数
  const saveThemeToStorage = (theme: Theme) => {
    // 检查当前存储的主题是否需要更新
    const storedTheme = localStorage.getItem('theme')
    
    if (storedTheme !== theme) {
      localStorage.setItem('theme', theme)
    }
  }
  
  // 优化后的监听器：使用flush:'post'并添加条件判断
  watch(currentTheme, (theme) => {
    updateDOMTheme(theme)
    saveThemeToStorage(theme)
  }, { 
    flush: 'post' // 在DOM更新后执行，减少同一tick中的多次更新
  })
  
  return {
    currentTheme,
    toggleTheme,
    setTheme,
    initTheme
  }
})