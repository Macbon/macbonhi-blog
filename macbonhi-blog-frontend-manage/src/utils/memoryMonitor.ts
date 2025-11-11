/**
 * 内存监控和管理工具
 * 用于检测内存泄漏、监控内存使用情况，并提供内存优化建议
 */

interface MemoryMetrics {
  timestamp: number
  heapUsed?: number
  heapTotal?: number
  totalJSHeapSize?: number
  usedJSHeapSize?: number
  jsHeapSizeLimit?: number
  domNodes: number
  eventListeners: number
  timers: number
}

interface ComponentMemoryInfo {
  name: string
  mountTime: number
  unmountTime?: number
  eventListeners: Set<{ element: EventTarget; type: string; listener: EventListener }>
  timers: Set<number>
  intervals: Set<number>
  observers: Set<{ observer: any; target?: Element | Document }>
  refs: Set<any>
}

class MemoryMonitor {
  private metrics: MemoryMetrics[] = []
  private componentRegistry = new Map<string, ComponentMemoryInfo>()
  private maxMetricsCount = 100
  private isMonitoring = false
  private monitoringInterval?: number
  private memoryPressureCallbacks = new Set<(pressure: 'low' | 'moderate' | 'critical') => void>()

  /**
   * 开始内存监控
   */
  startMonitoring(interval: number = 30000) {
    if (this.isMonitoring) return

    this.isMonitoring = true
    this.collectMetrics()

    this.monitoringInterval = window.setInterval(() => {
      this.collectMetrics()
      this.checkMemoryPressure()
      this.detectLeaks()
    }, interval)

    console.log('🔍 内存监控已启动')
  }

  /**
   * 停止内存监控
   */
  stopMonitoring() {
    if (!this.isMonitoring) return

    this.isMonitoring = false
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = undefined
    }

    console.log('⏹️ 内存监控已停止')
  }

  /**
   * 收集内存指标
   */
  private collectMetrics() {
    const metrics: MemoryMetrics = {
      timestamp: Date.now(),
      domNodes: this.getDOMNodeCount(),
      eventListeners: this.getEventListenerCount(),
      timers: this.getTimerCount()
    }

    // 如果支持 performance.memory API
    if ('memory' in performance) {
      const memInfo = (performance as any).memory
      metrics.totalJSHeapSize = memInfo.totalJSHeapSize
      metrics.usedJSHeapSize = memInfo.usedJSHeapSize
      metrics.jsHeapSizeLimit = memInfo.jsHeapSizeLimit
    }

    this.metrics.push(metrics)

    // 限制记录数量
    if (this.metrics.length > this.maxMetricsCount) {
      this.metrics.shift()
    }
  }

  /**
   * 获取DOM节点数量
   */
  private getDOMNodeCount(): number {
    return document.querySelectorAll('*').length
  }

  /**
   * 获取事件监听器数量（估算）
   */
  private getEventListenerCount(): number {
    let count = 0
    this.componentRegistry.forEach(info => {
      count += info.eventListeners.size
    })
    return count
  }

  /**
   * 获取定时器数量（估算）
   */
  private getTimerCount(): number {
    let count = 0
    this.componentRegistry.forEach(info => {
      count += info.timers.size + info.intervals.size
    })
    return count
  }

  /**
   * 注册组件
   */
  registerComponent(name: string, componentId: string = name): ComponentMemoryInfo {
    const info: ComponentMemoryInfo = {
      name,
      mountTime: Date.now(),
      eventListeners: new Set(),
      timers: new Set(),
      intervals: new Set(),
      observers: new Set(),
      refs: new Set()
    }

    this.componentRegistry.set(componentId, info)
    return info
  }

  /**
   * 注销组件
   */
  unregisterComponent(componentId: string) {
    const info = this.componentRegistry.get(componentId)
    if (info) {
      info.unmountTime = Date.now()
      
      // 清理未释放的资源
      this.cleanupComponentResources(info)
      
      // 延迟删除，用于泄漏检测
      setTimeout(() => {
        this.componentRegistry.delete(componentId)
      }, 60000) // 1分钟后删除记录
    }
  }

  /**
   * 清理组件资源
   */
  private cleanupComponentResources(info: ComponentMemoryInfo) {
    // 清理事件监听器
    info.eventListeners.forEach(({ element, type, listener }) => {
      try {
        element.removeEventListener(type, listener)
      } catch (e) {
        console.warn('清理事件监听器失败:', e)
      }
    })

    // 清理定时器
    info.timers.forEach(timerId => {
      clearTimeout(timerId)
    })

    // 清理间隔器
    info.intervals.forEach(intervalId => {
      clearInterval(intervalId)
    })

    // 清理观察器
    info.observers.forEach(({ observer }) => {
      try {
        if (observer.disconnect) observer.disconnect()
        if (observer.unobserve) observer.unobserve()
      } catch (e) {
        console.warn('清理观察器失败:', e)
      }
    })

    // 清理引用
    info.refs.clear()
  }

  /**
   * 检测内存压力
   */
  private checkMemoryPressure() {
    if (this.metrics.length < 2) return

    const latest = this.metrics[this.metrics.length - 1]
    const previous = this.metrics[this.metrics.length - 2]

    if (!latest.usedJSHeapSize || !previous.usedJSHeapSize) return

    const memoryIncrease = latest.usedJSHeapSize - previous.usedJSHeapSize
    const memoryUsageRatio = latest.usedJSHeapSize / (latest.jsHeapSizeLimit || 2 * 1024 * 1024 * 1024)

    let pressure: 'low' | 'moderate' | 'critical' = 'low'

    if (memoryUsageRatio > 0.9 || memoryIncrease > 50 * 1024 * 1024) { // 90%使用率或增长50MB
      pressure = 'critical'
    } else if (memoryUsageRatio > 0.7 || memoryIncrease > 20 * 1024 * 1024) { // 70%使用率或增长20MB
      pressure = 'moderate'
    }

    if (pressure !== 'low') {
      console.warn(`⚠️ 内存压力：${pressure}`, {
        使用率: `${(memoryUsageRatio * 100).toFixed(1)}%`,
        增长: `${(memoryIncrease / 1024 / 1024).toFixed(1)}MB`,
        总用量: `${(latest.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB`
      })

      this.memoryPressureCallbacks.forEach(callback => {
        try {
          callback(pressure)
        } catch (e) {
          console.error('内存压力回调执行失败:', e)
        }
      })
    }
  }

  /**
   * 检测内存泄漏
   */
  private detectLeaks() {
    const now = Date.now()
    const leakedComponents: string[] = []

    this.componentRegistry.forEach((info, componentId) => {
      // 组件卸载后仍存在资源未清理
      if (info.unmountTime && now - info.unmountTime > 30000) { // 30秒后还有资源
        if (info.eventListeners.size > 0 || info.timers.size > 0 || info.intervals.size > 0) {
          leakedComponents.push(componentId)
        }
      }
    })

    if (leakedComponents.length > 0) {
      console.error('🚨 检测到可能的内存泄漏:', leakedComponents)
    }
  }

  /**
   * 获取内存统计信息
   */
  getMemoryStats() {
    if (this.metrics.length === 0) return null

    const latest = this.metrics[this.metrics.length - 1]
    const oldest = this.metrics[0]

    return {
      current: latest,
      growth: latest.usedJSHeapSize && oldest.usedJSHeapSize 
        ? latest.usedJSHeapSize - oldest.usedJSHeapSize 
        : 0,
      componentsCount: this.componentRegistry.size,
      metricsCount: this.metrics.length,
      monitoring: this.isMonitoring
    }
  }

  /**
   * 获取组件内存信息
   */
  getComponentStats() {
    const stats: Array<{
      name: string
      id: string
      mountTime: number
      unmountTime?: number
      lifespan?: number
      eventListeners: number
      timers: number
      intervals: number
      observers: number
      refs: number
      status: 'active' | 'unmounted' | 'leaked'
    }> = []

    const now = Date.now()

    this.componentRegistry.forEach((info, componentId) => {
      const lifespan = (info.unmountTime || now) - info.mountTime
      let status: 'active' | 'unmounted' | 'leaked' = 'active'

      if (info.unmountTime) {
        status = 'unmounted'
        // 检查是否泄漏
        if (now - info.unmountTime > 30000 && 
            (info.eventListeners.size > 0 || info.timers.size > 0 || info.intervals.size > 0)) {
          status = 'leaked'
        }
      }

      stats.push({
        name: info.name,
        id: componentId,
        mountTime: info.mountTime,
        unmountTime: info.unmountTime,
        lifespan,
        eventListeners: info.eventListeners.size,
        timers: info.timers.size,
        intervals: info.intervals.size,
        observers: info.observers.size,
        refs: info.refs.size,
        status
      })
    })

    return stats.sort((a, b) => b.mountTime - a.mountTime)
  }

  /**
   * 强制垃圾回收（如果支持）
   */
  forceGC() {
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc()
      console.log('🧹 手动触发垃圾回收')
    } else {
      console.warn('当前环境不支持手动垃圾回收')
    }
  }

  /**
   * 添加内存压力回调
   */
  onMemoryPressure(callback: (pressure: 'low' | 'moderate' | 'critical') => void) {
    this.memoryPressureCallbacks.add(callback)
    return () => this.memoryPressureCallbacks.delete(callback)
  }

  /**
   * 清除所有数据
   */
  clear() {
    this.metrics = []
    this.componentRegistry.clear()
    this.memoryPressureCallbacks.clear()
  }

  /**
   * 导出内存数据
   */
  exportData() {
    return {
      metrics: [...this.metrics],
      components: this.getComponentStats(),
      stats: this.getMemoryStats(),
      timestamp: Date.now()
    }
  }
}

// 创建全局实例
export const memoryMonitor = new MemoryMonitor()

// 开发环境下添加到全局对象
if (import.meta.env.DEV) {
  (window as any).__memoryMonitor__ = {
    start: (interval?: number) => memoryMonitor.startMonitoring(interval),
    stop: () => memoryMonitor.stopMonitoring(),
    stats: () => memoryMonitor.getMemoryStats(),
    components: () => memoryMonitor.getComponentStats(),
    export: () => memoryMonitor.exportData(),
    forceGC: () => memoryMonitor.forceGC(),
    clear: () => memoryMonitor.clear()
  }

  console.log('🔧 内存监控工具已启用，使用 __memoryMonitor__ 查看内存状态')
}