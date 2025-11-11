/**
 * 路由预加载工具
 * 用于优化页面加载性能，提前加载用户可能访问的路由组件
 */

import { preloadCriticalRoutes, preloadNormalRoutes, preloadLowRoutes } from '../router'

interface PreloadConfig {
  // 是否启用预加载
  enabled: boolean
  // 预加载延迟时间（毫秒）
  delays: {
    critical: number
    normal: number
    low: number
  }
  // 网络条件检查
  checkNetworkCondition: boolean
}

const defaultConfig: PreloadConfig = {
  enabled: true,
  delays: {
    critical: 1000,    // 1秒后预加载关键路由
    normal: 3000,      // 3秒后预加载普通路由
    low: 8000          // 8秒后预加载低优先级路由
  },
  checkNetworkCondition: true
}

/**
 * 检查网络条件是否适合预加载
 */
function isNetworkSuitable(): boolean {
  // 检查是否支持Network Information API
  if ('connection' in navigator) {
    const connection = (navigator as any).connection
    
    // 如果是慢速网络（2g或slow-2g），不进行预加载
    if (connection.effectiveType && 
        (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g')) {
      return false
    }
    
    // 如果启用了数据节省模式，不进行预加载
    if (connection.saveData) {
      return false
    }
  }
  
  return true
}

/**
 * 启动路由预加载
 */
export function startRoutePreloader(config: Partial<PreloadConfig> = {}) {
  const finalConfig = { ...defaultConfig, ...config }
  
  if (!finalConfig.enabled) {
    console.log('路由预加载已禁用')
    return
  }
  
  // 检查网络条件
  if (finalConfig.checkNetworkCondition && !isNetworkSuitable()) {
    console.log('网络条件不适合预加载，跳过路由预加载')
    return
  }
  
  console.log('开始路由预加载策略')
  
  // 预加载关键路由
  setTimeout(() => {
    console.log('预加载关键路由')
    preloadCriticalRoutes()
  }, finalConfig.delays.critical)
  
  // 预加载普通路由
  setTimeout(() => {
    console.log('预加载普通路由')
    preloadNormalRoutes()
  }, finalConfig.delays.normal)
  
  // 预加载低优先级路由
  setTimeout(() => {
    console.log('预加载低优先级路由')
    preloadLowRoutes()
  }, finalConfig.delays.low)
}

/**
 * 根据用户行为动态预加载
 */
export function preloadBasedOnUserBehavior(userActions: string[]) {
  // 根据用户的历史行为模式预加载相关路由
  const actionPatterns = {
    'article-focused': () => {
      import(/* webpackChunkName: "article" */ '../views/ArticalView.vue')
      import(/* webpackChunkName: "edit-article" */ '../views/EditArtical.vue')
    },
    'gallery-focused': () => {
      import(/* webpackChunkName: "gallery" */ '../views/GalleryView.vue')
      import(/* webpackChunkName: "edit-gallery" */ '../views/EditGallery.vue')
    },
    'admin-focused': () => {
      import(/* webpackChunkName: "settings" */ '../views/settingView.vue')
      import(/* webpackChunkName: "local-file" */ '../views/localFileView.vue')
    }
  }
  
  // 分析用户行为并触发相应预加载
  userActions.forEach(action => {
    if (action in actionPatterns) {
      (actionPatterns as any)[action]()
    }
  })
}

/**
 * 清除预加载相关的内存（如果需要）
 */
export function clearPreloadCache() {
  // 这里可以添加清除预加载缓存的逻辑
  console.log('清除路由预加载缓存')
}