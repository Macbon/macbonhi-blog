/**
 * 内存管理组合式函数
 * 帮助Vue组件自动管理内存，防止内存泄漏
 */

import { onBeforeUnmount, onMounted, getCurrentInstance } from 'vue'
import { memoryMonitor } from '../utils/memoryMonitor'

interface UseMemoryOptions {
  componentName?: string
  trackEventListeners?: boolean
  trackTimers?: boolean
  trackObservers?: boolean
  autoCleanup?: boolean
}

export function useMemoryManagement(options: UseMemoryOptions = {}) {
  const {
    componentName = 'UnknownComponent',
    trackEventListeners = true,
    trackTimers = true,
    trackObservers = true,
    autoCleanup = true
  } = options

  const instance = getCurrentInstance()
  const componentId = `${componentName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  let componentInfo: any = null

  // 存储需要清理的资源
  const resources = {
    eventListeners: new Set<{ element: EventTarget; type: string; listener: EventListener; options?: any }>(),
    timers: new Set<number>(),
    intervals: new Set<number>(),
    observers: new Set<{ observer: any; target?: Element | Document }>(),
    refs: new Set<any>()
  }

  onMounted(() => {
    componentInfo = memoryMonitor.registerComponent(componentName, componentId)
  })

  onBeforeUnmount(() => {
    if (autoCleanup) {
      cleanup()
    }
    memoryMonitor.unregisterComponent(componentId)
  })

  /**
   * 添加事件监听器（自动追踪）
   */
  const addEventListener = (
    element: EventTarget,
    type: string,
    listener: EventListener,
    options?: boolean | AddEventListenerOptions
  ) => {
    element.addEventListener(type, listener, options)
    
    if (trackEventListeners) {
      const eventInfo = { element, type, listener, options }
      resources.eventListeners.add(eventInfo)
      componentInfo?.eventListeners.add(eventInfo)
    }

    return () => removeEventListener(element, type, listener)
  }

  /**
   * 移除事件监听器
   */
  const removeEventListener = (
    element: EventTarget,
    type: string,
    listener: EventListener
  ) => {
    element.removeEventListener(type, listener)
    
    // 从追踪中移除
    resources.eventListeners.forEach(item => {
      if (item.element === element && item.type === type && item.listener === listener) {
        resources.eventListeners.delete(item)
        componentInfo?.eventListeners.delete(item)
      }
    })
  }

  /**
   * 设置定时器（自动追踪）
   */
  const setTimeout = (callback: () => void, delay: number): number => {
    const timerId = window.setTimeout(() => {
      callback()
      // 定时器执行完后自动从追踪中移除
      resources.timers.delete(timerId)
      componentInfo?.timers.delete(timerId)
    }, delay)

    if (trackTimers) {
      resources.timers.add(timerId)
      componentInfo?.timers.add(timerId)
    }

    return timerId
  }

  /**
   * 清除定时器
   */
  const clearTimeout = (timerId: number) => {
    window.clearTimeout(timerId)
    resources.timers.delete(timerId)
    componentInfo?.timers.delete(timerId)
  }

  /**
   * 设置间隔器（自动追踪）
   */
  const setInterval = (callback: () => void, delay: number): number => {
    const intervalId = window.setInterval(callback, delay)

    if (trackTimers) {
      resources.intervals.add(intervalId)
      componentInfo?.intervals.add(intervalId)
    }

    return intervalId
  }

  /**
   * 清除间隔器
   */
  const clearInterval = (intervalId: number) => {
    window.clearInterval(intervalId)
    resources.intervals.delete(intervalId)
    componentInfo?.intervals.delete(intervalId)
  }

  /**
   * 创建观察器（自动追踪）
   */
  const createObserver = <T extends { observe?: Function; disconnect?: Function; unobserve?: Function }>(
    observer: T,
    target?: Element | Document
  ): T => {
    if (trackObservers) {
      const observerInfo = { observer, target }
      resources.observers.add(observerInfo)
      componentInfo?.observers.add(observerInfo)
    }

    return observer
  }

  /**
   * 添加引用追踪
   */
  const trackRef = (ref: any) => {
    resources.refs.add(ref)
    componentInfo?.refs.add(ref)
    return ref
  }

  /**
   * 清理所有资源
   */
  const cleanup = () => {
    // 清理事件监听器
    resources.eventListeners.forEach(({ element, type, listener }) => {
      try {
        element.removeEventListener(type, listener)
      } catch (error) {
        console.warn('清理事件监听器失败:', error)
      }
    })
    resources.eventListeners.clear()

    // 清理定时器
    resources.timers.forEach(timerId => {
      clearTimeout(timerId)
    })
    resources.timers.clear()

    // 清理间隔器
    resources.intervals.forEach(intervalId => {
      clearInterval(intervalId)
    })
    resources.intervals.clear()

    // 清理观察器
    resources.observers.forEach(({ observer }) => {
      try {
        if (observer.disconnect) observer.disconnect()
        if (observer.unobserve) observer.unobserve()
      } catch (error) {
        console.warn('清理观察器失败:', error)
      }
    })
    resources.observers.clear()

    // 清理引用
    resources.refs.clear()

    console.log(`🧹 组件 ${componentName} 内存清理完成`)
  }

  /**
   * 获取资源统计
   */
  const getResourceStats = () => {
    return {
      eventListeners: resources.eventListeners.size,
      timers: resources.timers.size,
      intervals: resources.intervals.size,
      observers: resources.observers.size,
      refs: resources.refs.size
    }
  }

  /**
   * 检查是否有未清理的资源
   */
  const hasUncleanedResources = () => {
    const stats = getResourceStats()
    return Object.values(stats).some(count => count > 0)
  }

  return {
    // 资源管理方法
    addEventListener,
    removeEventListener,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    createObserver,
    trackRef,
    cleanup,
    
    // 统计和检查方法
    getResourceStats,
    hasUncleanedResources,
    
    // 组件信息
    componentId,
    componentName
  }
}