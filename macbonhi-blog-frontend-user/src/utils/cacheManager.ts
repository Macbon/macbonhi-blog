// ✅ 性能优化：缓存管理工具
// 提供缓存监控、统计和管理功能

import { apiCache } from './apiCache';

interface CacheStats {
  totalItems: number;
  memoryItems: number;
  localStorageItems: number;
  totalSize: string;
  hitRate: number;
  lastCleared: string | null;
}

class CacheManager {
  private hitCount = 0;
  private totalRequests = 0;
  private lastCleared: Date | null = null;

  /**
   * 记录缓存命中
   */
  recordHit() {
    this.hitCount++;
    this.totalRequests++;
  }

  /**
   * 记录缓存未命中
   */
  recordMiss() {
    this.totalRequests++;
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): CacheStats {
    const baseStats = apiCache.getStats();
    
    return {
      totalItems: baseStats.memoryItems + baseStats.localStorageItems,
      memoryItems: baseStats.memoryItems,
      localStorageItems: baseStats.localStorageItems,
      totalSize: this.calculateCacheSize(),
      hitRate: this.totalRequests > 0 ? (this.hitCount / this.totalRequests) * 100 : 0,
      lastCleared: this.lastCleared?.toISOString() || null
    };
  }

  /**
   * 计算缓存总大小
   */
  private calculateCacheSize(): string {
    try {
      let totalSize = 0;
      
      // 计算localStorage中API缓存的大小
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('api_cache_')) {
          totalSize += localStorage[key].length;
        }
      });
      
      // 转换为可读的大小单位
      if (totalSize < 1024) {
        return `${totalSize} B`;
      } else if (totalSize < 1024 * 1024) {
        return `${(totalSize / 1024).toFixed(2)} KB`;
      } else {
        return `${(totalSize / (1024 * 1024)).toFixed(2)} MB`;
      }
    } catch (error) {
      console.warn('计算缓存大小失败:', error);
      return 'Unknown';
    }
  }

  /**
   * 清理过期缓存
   */
  clearExpired() {
    try {
      let clearedCount = 0;
      
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('api_cache_')) {
          try {
            const cached = JSON.parse(localStorage[key]);
            const isExpired = Date.now() - cached.timestamp > cached.ttl;
            
            if (isExpired) {
              localStorage.removeItem(key);
              clearedCount++;
            }
          } catch (error) {
            // 无效的缓存项，直接删除
            localStorage.removeItem(key);
            clearedCount++;
          }
        }
      });
      
      console.log(`🧹 清理了 ${clearedCount} 个过期缓存项`);
      return clearedCount;
    } catch (error) {
      console.error('清理过期缓存失败:', error);
      return 0;
    }
  }

  /**
   * 清理所有缓存
   */
  clearAll() {
    apiCache.clear();
    this.lastCleared = new Date();
    this.hitCount = 0;
    this.totalRequests = 0;
    console.log('🗑️ 所有缓存已清理');
  }

  /**
   * 获取缓存健康度评分 (0-100)
   */
  getHealthScore(): number {
    const stats = this.getStats();
    let score = 100;
    
    // 缓存命中率权重 40%
    if (stats.hitRate < 50) score -= 40;
    else if (stats.hitRate < 70) score -= 20;
    else if (stats.hitRate < 90) score -= 10;
    
    // 缓存项数量权重 30%
    if (stats.totalItems > 200) score -= 30;
    else if (stats.totalItems > 100) score -= 15;
    
    // 缓存大小权重 30%
    const sizeNum = parseFloat(stats.totalSize);
    if (stats.totalSize.includes('MB')) {
      if (sizeNum > 10) score -= 30;
      else if (sizeNum > 5) score -= 15;
    }
    
    return Math.max(0, score);
  }

  /**
   * 获取缓存建议
   */
  getRecommendations(): string[] {
    const stats = this.getStats();
    const recommendations: string[] = [];
    
    if (stats.hitRate < 50) {
      recommendations.push('缓存命中率较低，建议优化缓存策略');
    }
    
    if (stats.totalItems > 150) {
      recommendations.push('缓存项过多，建议清理过期缓存');
    }
    
    const sizeNum = parseFloat(stats.totalSize);
    if (stats.totalSize.includes('MB') && sizeNum > 8) {
      recommendations.push('缓存占用空间过大，建议清理部分数据');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('缓存状态良好，继续保持！');
    }
    
    return recommendations;
  }

  /**
   * 导出缓存报告
   */
  exportReport(): string {
    const stats = this.getStats();
    const health = this.getHealthScore();
    const recommendations = this.getRecommendations();
    
    const report = {
      timestamp: new Date().toISOString(),
      statistics: stats,
      healthScore: health,
      recommendations,
      cacheItems: this.getCacheItemsList()
    };
    
    return JSON.stringify(report, null, 2);
  }

  /**
   * 获取缓存项列表
   */
  private getCacheItemsList(): Array<{key: string, size: number, age: number}> {
    const items: Array<{key: string, size: number, age: number}> = [];
    
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('api_cache_')) {
          try {
            const cached = JSON.parse(localStorage[key]);
            const age = Date.now() - cached.timestamp;
            
            items.push({
              key: key.replace('api_cache_', ''),
              size: localStorage[key].length,
              age: Math.round(age / 1000) // 转换为秒
            });
          } catch (error) {
            // 忽略无效的缓存项
          }
        }
      });
    } catch (error) {
      console.warn('获取缓存项列表失败:', error);
    }
    
    return items.sort((a, b) => b.size - a.size); // 按大小排序
  }
}

// 创建全局缓存管理器实例
export const cacheManager = new CacheManager();

// 开发环境下的缓存调试工具
if (process.env.NODE_ENV === 'development') {
  // 添加到全局对象，方便在开发者工具中调试
  (window as any).__cacheDebug = {
    stats: () => cacheManager.getStats(),
    clear: () => cacheManager.clearAll(),
    clearExpired: () => cacheManager.clearExpired(),
    health: () => cacheManager.getHealthScore(),
    recommendations: () => cacheManager.getRecommendations(),
    report: () => {
      const report = cacheManager.exportReport();
      console.log('📊 缓存报告:\n', report);
      return report;
    }
  };
  
  console.log('🔧 缓存调试工具已加载，使用 window.__cacheDebug 访问');
}