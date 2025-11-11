/**
 * 路由性能监控工具
 * 用于监控和分析路由切换性能，帮助优化用户体验
 */

interface RouteMetrics {
  path: string
  name: string
  loadTime: number
  timestamp: number
  fromRoute?: string
  chunkSize?: number
  cacheHit?: boolean
}

class RoutePerformanceMonitor {
  private metrics: RouteMetrics[] = []
  private routeStartTimes = new Map<string, number>()
  private maxMetricsCount = 50 // 最多保存50条记录

  /**
   * 记录路由开始加载时间
   */
  startRouteLoad(routeName: string, path: string) {
    this.routeStartTimes.set(routeName, performance.now())
  }

  /**
   * 记录路由加载完成时间
   */
  endRouteLoad(routeName: string, path: string, fromRoute?: string) {
    const startTime = this.routeStartTimes.get(routeName)
    if (startTime) {
      const loadTime = performance.now() - startTime
      
      const metric: RouteMetrics = {
        path,
        name: routeName,
        loadTime: Math.round(loadTime * 100) / 100, // 保留两位小数
        timestamp: Date.now(),
        fromRoute
      }

      this.addMetric(metric)
      this.routeStartTimes.delete(routeName)

      // 在开发环境输出性能信息
      if (import.meta.env.DEV) {
        console.log(`🚀 路由加载完成: ${routeName}`, {
          path,
          loadTime: `${metric.loadTime}ms`,
          fromRoute
        })
      }
    }
  }

  /**
   * 添加性能指标
   */
  private addMetric(metric: RouteMetrics) {
    this.metrics.push(metric)
    
    // 限制记录数量
    if (this.metrics.length > this.maxMetricsCount) {
      this.metrics.shift()
    }
  }

  /**
   * 获取路由性能统计
   */
  getRouteStats() {
    if (this.metrics.length === 0) {
      return null
    }

    const routeGroups = this.groupMetricsByRoute()
    const stats = Object.entries(routeGroups).map(([routeName, metrics]) => {
      const loadTimes = metrics.map(m => m.loadTime)
      const avgLoadTime = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length
      const minLoadTime = Math.min(...loadTimes)
      const maxLoadTime = Math.max(...loadTimes)

      return {
        routeName,
        visitCount: metrics.length,
        avgLoadTime: Math.round(avgLoadTime * 100) / 100,
        minLoadTime,
        maxLoadTime,
        lastVisit: Math.max(...metrics.map(m => m.timestamp))
      }
    })

    return {
      totalRouteChanges: this.metrics.length,
      avgLoadTime: Math.round((this.metrics.reduce((sum, m) => sum + m.loadTime, 0) / this.metrics.length) * 100) / 100,
      routeStats: stats.sort((a, b) => b.visitCount - a.visitCount)
    }
  }

  /**
   * 按路由分组指标
   */
  private groupMetricsByRoute() {
    return this.metrics.reduce((groups, metric) => {
      if (!groups[metric.name]) {
        groups[metric.name] = []
      }
      groups[metric.name].push(metric)
      return groups
    }, {} as Record<string, RouteMetrics[]>)
  }

  /**
   * 获取慢路由报告
   */
  getSlowRoutes(threshold: number = 1000) {
    const stats = this.getRouteStats()
    if (!stats) return []

    return stats.routeStats.filter(route => route.avgLoadTime > threshold)
  }

  /**
   * 清除性能数据
   */
  clearMetrics() {
    this.metrics = []
    this.routeStartTimes.clear()
  }

  /**
   * 导出性能数据（用于分析）
   */
  exportMetrics() {
    return {
      metrics: [...this.metrics],
      stats: this.getRouteStats(),
      timestamp: Date.now()
    }
  }

  /**
   * 检查是否有性能问题
   */
  checkPerformanceIssues() {
    const stats = this.getRouteStats()
    if (!stats) return []

    const issues = []

    // 检查平均加载时间过长的路由
    const slowRoutes = this.getSlowRoutes(1000)
    if (slowRoutes.length > 0) {
      issues.push({
        type: 'slow-routes',
        message: `发现 ${slowRoutes.length} 个加载缓慢的路由`,
        routes: slowRoutes.map(r => r.routeName)
      })
    }

    // 检查整体平均加载时间
    if (stats.avgLoadTime > 800) {
      issues.push({
        type: 'high-avg-load-time',
        message: `整体平均加载时间过长: ${stats.avgLoadTime}ms`,
        value: stats.avgLoadTime
      })
    }

    return issues
  }
}

// 创建全局实例
export const routePerformanceMonitor = new RoutePerformanceMonitor()

/**
 * 在开发环境中提供性能调试工具
 */
if (import.meta.env.DEV) {
  // 添加到全局对象，方便在控制台调用
  (window as any).__routePerf__ = {
    getStats: () => routePerformanceMonitor.getRouteStats(),
    getSlowRoutes: (threshold?: number) => routePerformanceMonitor.getSlowRoutes(threshold),
    checkIssues: () => routePerformanceMonitor.checkPerformanceIssues(),
    exportData: () => routePerformanceMonitor.exportMetrics(),
    clear: () => routePerformanceMonitor.clearMetrics()
  }

  console.log('🔧 路由性能监控工具已启用，使用 __routePerf__ 查看性能数据')
}