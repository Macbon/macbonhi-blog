/**
 * 内存压力管理器
 * 监控内存使用情况并在压力过大时自动采取优化措施
 */

import { memoryMonitor } from './memoryMonitor'
import { useCacheStore } from '../store/cache'

interface MemoryPressureStrategy {
  name: string
  priority: number // 优先级，数字越大优先级越高
  condition: () => boolean // 触发条件
  action: () => Promise<void> | void // 执行的优化动作
  description: string
}

class MemoryPressureManager {
  private strategies: MemoryPressureStrategy[] = []
  private isManaging = false
  private lastCleanupTime = 0
  private cleanupCooldown = 30000 // 30秒冷却时间

  constructor() {
    this.initializeStrategies()
  }

  /**
   * 初始化内存优化策略
   */
  private initializeStrategies() {
    // 策略1: 清理过期缓存
    this.addStrategy({
      name: 'cleanExpiredCache',
      priority: 1,
      condition: () => this.getMemoryUsagePercent() > 60,
      action: () => {
        const cacheStore = useCacheStore()
        cacheStore.cleanExpiredCache()
        console.log('🧹 执行策略: 清理过期缓存')
      },
      description: '清理所有过期的缓存项'
    })

    // 策略2: 智能缓存清理
    this.addStrategy({
      name: 'smartCacheCleanup',
      priority: 2,
      condition: () => this.getMemoryUsagePercent() > 70,
      action: () => {
        const cacheStore = useCacheStore()
        cacheStore.smartCleanup()
        console.log('🧹 执行策略: 智能缓存清理')
      },
      description: '基于LRU算法清理缓存'
    })

    // 策略3: 清理DOM节点
    this.addStrategy({
      name: 'cleanDOMNodes',
      priority: 3,
      condition: () => this.getDOMNodeCount() > 5000,
      action: () => {
        this.cleanupDOMNodes()
        console.log('🧹 执行策略: 清理DOM节点')
      },
      description: '清理不必要的DOM节点'
    })

    // 策略4: 清理事件监听器
    this.addStrategy({
      name: 'cleanEventListeners',
      priority: 4,
      condition: () => this.getMemoryUsagePercent() > 80,
      action: () => {
        this.cleanupOrphanedListeners()
        console.log('🧹 执行策略: 清理事件监听器')
      },
      description: '清理孤立的事件监听器'
    })

    // 策略5: 强制垃圾回收
    this.addStrategy({
      name: 'forceGarbageCollection',
      priority: 5,
      condition: () => this.getMemoryUsagePercent() > 85,
      action: () => {
        if ('gc' in window && typeof (window as any).gc === 'function') {
          (window as any).gc()
          console.log('🧹 执行策略: 强制垃圾回收')
        }
      },
      description: '强制执行垃圾回收（如果支持）'
    })

    // 策略6: 紧急清理
    this.addStrategy({
      name: 'emergencyCleanup',
      priority: 6,
      condition: () => this.getMemoryUsagePercent() > 90,
      action: async () => {
        // 执行所有可用的清理策略
        const cacheStore = useCacheStore()
        cacheStore.clearAllCache()
        this.cleanupDOMNodes()
        this.cleanupOrphanedListeners()
        
        // 延迟强制GC
        setTimeout(() => {
          if ('gc' in window && typeof (window as any).gc === 'function') {
            (window as any).gc()
          }
        }, 100)
        
        console.warn('⚠️ 执行策略: 紧急内存清理')
      },
      description: '紧急情况下的全面清理'
    })
  }

  /**
   * 添加策略
   */
  addStrategy(strategy: MemoryPressureStrategy) {
    this.strategies.push(strategy)
    // 按优先级排序
    this.strategies.sort((a, b) => a.priority - b.priority)
  }

  /**
   * 移除策略
   */
  removeStrategy(name: string) {
    this.strategies = this.strategies.filter(s => s.name !== name)
  }

  /**
   * 执行内存压力管理
   */
  async manage() {
    if (this.isManaging) return
    
    const now = Date.now()
    if (now - this.lastCleanupTime < this.cleanupCooldown) {
      return // 在冷却期内
    }

    this.isManaging = true
    
    try {
      const memoryStats = memoryMonitor.getMemoryStats()
      const memoryPercent = this.getMemoryUsagePercent()
      
      console.log('🔍 内存使用情况检查:', {
        使用率: `${memoryPercent.toFixed(1)}%`,
        组件数量: memoryStats?.componentsCount || 0,
        DOM节点: this.getDOMNodeCount()
      })

      let executed = false
      
      // 按优先级执行策略
      for (const strategy of this.strategies) {
        if (strategy.condition()) {
          try {
            await strategy.action()
            executed = true
            
            // 执行后等待一小段时间，让内存有时间释放
            await new Promise(resolve => setTimeout(resolve, 100))
            
            // 如果内存使用率已经降到安全水平，停止执行更多策略
            if (this.getMemoryUsagePercent() < 60) {
              break
            }
            
          } catch (error) {
            console.error(`执行内存优化策略 ${strategy.name} 失败:`, error)
          }
        }
      }
      
      if (executed) {
        this.lastCleanupTime = now
        
        // 执行完成后的统计
        setTimeout(() => {
          const newMemoryPercent = this.getMemoryUsagePercent()
          console.log(`✅ 内存优化完成，使用率从 ${memoryPercent.toFixed(1)}% 降至 ${newMemoryPercent.toFixed(1)}%`)
        }, 500)
      }
      
    } finally {
      this.isManaging = false
    }
  }

  /**
   * 获取内存使用百分比
   */
  private getMemoryUsagePercent(): number {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory
      return (memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit) * 100
    }
    return 0
  }

  /**
   * 获取DOM节点数量
   */
  private getDOMNodeCount(): number {
    return document.querySelectorAll('*').length
  }

  /**
   * 清理DOM节点
   */
  private cleanupDOMNodes() {
    // 清理隐藏的或不需要的DOM节点
    const hiddenElements = document.querySelectorAll('[style*="display: none"]')
    let removedCount = 0
    
    hiddenElements.forEach(element => {
      // 只清理非关键的隐藏元素
      if (!element.hasAttribute('data-keep') && 
          !element.classList.contains('ant-') && // 不清理antd组件
          element.children.length === 0) {
        element.remove()
        removedCount++
      }
    })
    
    if (removedCount > 0) {
      console.log(`清理了 ${removedCount} 个DOM节点`)
    }
  }

  /**
   * 清理孤立的事件监听器
   */
  private cleanupOrphanedListeners() {
    // 这里主要是统计和警告，实际清理由组件的内存管理器处理
    const componentStats = memoryMonitor.getComponentStats()
    const leakedComponents = componentStats?.filter(c => c.status === 'leaked') || []
    
    if (leakedComponents.length > 0) {
      console.warn('发现可能的内存泄漏组件:', leakedComponents.map(c => c.name))
    }
  }

  /**
   * 获取当前策略状态
   */
  getStrategiesStatus() {
    return this.strategies.map(strategy => ({
      name: strategy.name,
      priority: strategy.priority,
      description: strategy.description,
      canExecute: strategy.condition(),
      isActive: strategy.condition() && this.getMemoryUsagePercent() > 50
    }))
  }

  /**
   * 手动触发清理
   */
  async forceCleanup() {
    console.log('🧹 手动触发内存清理...')
    this.lastCleanupTime = 0 // 重置冷却时间
    await this.manage()
  }

  /**
   * 获取内存统计
   */
  getMemoryStats() {
    return {
      memoryUsagePercent: this.getMemoryUsagePercent(),
      domNodeCount: this.getDOMNodeCount(),
      isManaging: this.isManaging,
      lastCleanupTime: this.lastCleanupTime,
      strategiesCount: this.strategies.length,
      activeStrategies: this.strategies.filter(s => s.condition()).length
    }
  }
}

// 创建全局实例
export const memoryPressureManager = new MemoryPressureManager()

// 开发环境下添加到全局对象
if (import.meta.env.DEV) {
  (window as any).__memoryPressure__ = {
    manage: () => memoryPressureManager.manage(),
    forceCleanup: () => memoryPressureManager.forceCleanup(),
    getStats: () => memoryPressureManager.getMemoryStats(),
    getStrategies: () => memoryPressureManager.getStrategiesStatus()
  }

  console.log('🔧 内存压力管理器已启用，使用 __memoryPressure__ 查看状态')
}