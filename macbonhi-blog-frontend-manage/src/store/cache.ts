import { defineStore } from 'pinia';

/**
 * 缓存项接口
 */
interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  expiry: number;
  size: number; // 估算的内存大小（字节）
  accessCount: number; // 访问次数
  lastAccessed: number; // 最后访问时间
}

/**
 * 缓存配置接口
 */
interface CacheConfig {
  maxMemorySize: number; // 最大内存限制（字节）
  maxItems: number; // 最大缓存项数量
  cleanupInterval: number; // 清理间隔（毫秒）
  enableAutoCleanup: boolean; // 是否启用自动清理
}

/**
 * 缓存状态接口
 */
interface CacheState {
  cacheMap: Record<string, CacheItem>;
  config: CacheConfig;
  totalMemoryUsage: number;
  cleanupTimerId?: number;
}

/**
 * 估算对象内存大小（简单实现）
 */
function estimateObjectSize(obj: any): number {
  const str = JSON.stringify(obj);
  return new Blob([str]).size;
}

/**
 * 缓存存储
 * 用于减少API请求，提高前端性能，并控制内存使用
 */
export const useCacheStore = defineStore('cache', {
  state: (): CacheState => ({
    cacheMap: {},
    config: {
      maxMemorySize: 50 * 1024 * 1024, // 50MB
      maxItems: 1000,
      cleanupInterval: 5 * 60 * 1000, // 5分钟
      enableAutoCleanup: true
    },
    totalMemoryUsage: 0,
    cleanupTimerId: undefined
  }),
  
  getters: {
    /**
     * 获取缓存统计信息
     */
    cacheStats(): { 
      count: number; 
      keys: string[]; 
      memoryUsage: number; 
      memoryUsagePercent: number;
      config: CacheConfig;
    } {
      return {
        count: Object.keys(this.cacheMap).length,
        keys: Object.keys(this.cacheMap),
        memoryUsage: this.totalMemoryUsage,
        memoryUsagePercent: (this.totalMemoryUsage / this.config.maxMemorySize) * 100,
        config: this.config
      };
    },

    /**
     * 检查是否需要清理
     */
    needsCleanup(): boolean {
      const itemCount = Object.keys(this.cacheMap).length;
      return (
        this.totalMemoryUsage > this.config.maxMemorySize * 0.8 || // 超过80%内存使用
        itemCount > this.config.maxItems * 0.8 // 超过80%项目数量
      );
    }
  },
  
  actions: {
    /**
     * 初始化缓存（启动自动清理）
     */
    initCache() {
      if (this.config.enableAutoCleanup && !this.cleanupTimerId) {
        this.startAutoCleanup();
      }
    },

    /**
     * 设置缓存
     * @param key 缓存键
     * @param data 缓存数据
     * @param expiry 过期时间(毫秒)，默认5分钟
     */
    setCache<T>(key: string, data: T, expiry: number = 5 * 60 * 1000) {
      // 检查是否需要清理空间
      if (this.needsCleanup) {
        this.smartCleanup();
      }

      // 计算数据大小
      const size = estimateObjectSize(data);
      const now = Date.now();

      // 如果已存在，先减去旧的大小
      if (this.cacheMap[key]) {
        this.totalMemoryUsage -= this.cacheMap[key].size;
      }

      this.cacheMap[key] = {
        data,
        timestamp: now,
        expiry,
        size,
        accessCount: 0,
        lastAccessed: now
      };

      this.totalMemoryUsage += size;

      // 如果单个缓存项超过最大内存的10%，发出警告
      if (size > this.config.maxMemorySize * 0.1) {
        console.warn(`缓存项 ${key} 过大 (${(size / 1024 / 1024).toFixed(2)}MB)，可能影响性能`);
      }
    },
    
    /**
     * 获取缓存
     * @param key 缓存键
     * @returns 缓存数据，如果不存在或已过期返回null
     */
    getCache<T>(key: string): T | null {
      const item = this.cacheMap[key];
      
      if (!item) return null;
      
      const now = Date.now();
      
      if (now - item.timestamp > item.expiry) {
        // 过期了，删除并更新内存使用量
        this.totalMemoryUsage -= item.size;
        delete this.cacheMap[key];
        return null;
      }
      
      // 更新访问统计
      item.accessCount++;
      item.lastAccessed = now;
      
      return item.data as T;
    },
    
    /**
     * 检查缓存是否存在且有效
     * @param key 缓存键
     */
    hasValidCache(key: string): boolean {
      const item = this.cacheMap[key];
      if (!item) return false;
      return Date.now() - item.timestamp <= item.expiry;
    },
    
    /**
     * 获取缓存剩余有效时间(毫秒)
     * @param key 缓存键
     * @returns 剩余有效时间，如果不存在或已过期返回0
     */
    getCacheRemainingTime(key: string): number {
      const item = this.cacheMap[key];
      if (!item) return 0;
      
      const elapsed = Date.now() - item.timestamp;
      const remaining = item.expiry - elapsed;
      
      return Math.max(0, remaining);
    },
    
        /**
     * 移除指定缓存
     * @param key 缓存键
     */
    removeCache(key: string) {
      const item = this.cacheMap[key];
      if (item) {
        this.totalMemoryUsage -= item.size;
        delete this.cacheMap[key];
      }
    },

    /**
     * 清空所有缓存
     */
    clearAllCache() {
      this.cacheMap = {};
      this.totalMemoryUsage = 0;
    },
    
    /**
     * 清除特定前缀的缓存
     * @param prefix 前缀
     */
    clearCacheByPrefix(prefix: string) {
      Object.keys(this.cacheMap).forEach(key => {
        if (key.startsWith(prefix)) {
          const item = this.cacheMap[key];
          if (item) {
            this.totalMemoryUsage -= item.size;
          }
          delete this.cacheMap[key];
        }
      });
    },
    
    /**
     * 刷新缓存有效期
     * @param key 缓存键
     * @param newExpiry 新的过期时间(毫秒)，默认使用原过期时间
     */
    refreshCache(key: string, newExpiry?: number) {
      const item = this.cacheMap[key];
      if (!item) return;
      
      this.cacheMap[key] = {
        ...item,
        timestamp: Date.now(),
        expiry: newExpiry || item.expiry
      };
    },
    
    /**
     * 清理所有过期缓存
     */
    cleanExpiredCache() {
      const now = Date.now();
      let cleanedCount = 0;
      let freedMemory = 0;

      Object.entries(this.cacheMap).forEach(([key, item]) => {
        if (now - item.timestamp > item.expiry) {
          freedMemory += item.size;
          delete this.cacheMap[key];
          cleanedCount++;
        }
      });

      this.totalMemoryUsage -= freedMemory;

      if (cleanedCount > 0) {
        console.log(`🧹 清理了 ${cleanedCount} 个过期缓存项，释放 ${(freedMemory / 1024 / 1024).toFixed(2)}MB 内存`);
      }
    },

    /**
     * 智能清理缓存（基于LRU算法）
     */
    smartCleanup() {
      const items = Object.entries(this.cacheMap);
      
      // 先清理过期的
      this.cleanExpiredCache();
      
      // 如果还需要更多空间，使用LRU策略
      if (this.needsCleanup) {
        const sortedItems = items
          .filter(([_, item]) => Date.now() - item.timestamp <= item.expiry) // 只考虑未过期的
          .sort((a, b) => {
            // LRU + 访问频率的混合策略
            const scoreA = (a[1].lastAccessed / 1000) + (a[1].accessCount * 100);
            const scoreB = (b[1].lastAccessed / 1000) + (b[1].accessCount * 100);
            return scoreA - scoreB; // 分数低的优先清理
          });

        const itemsToRemove = Math.ceil(sortedItems.length * 0.3); // 清理30%的缓存
        let removedCount = 0;
        let freedMemory = 0;

        for (let i = 0; i < itemsToRemove && i < sortedItems.length; i++) {
          const [key, item] = sortedItems[i];
          freedMemory += item.size;
          delete this.cacheMap[key];
          removedCount++;
        }

        this.totalMemoryUsage -= freedMemory;

        console.log(`🧹 智能清理了 ${removedCount} 个缓存项，释放 ${(freedMemory / 1024 / 1024).toFixed(2)}MB 内存`);
      }
    },

    /**
     * 启动自动清理
     */
    startAutoCleanup() {
      if (this.cleanupTimerId) return;

      this.cleanupTimerId = window.setInterval(() => {
        this.cleanExpiredCache();
        
        if (this.needsCleanup) {
          this.smartCleanup();
        }
      }, this.config.cleanupInterval);

      console.log('🕐 缓存自动清理已启动');
    },

    /**
     * 停止自动清理
     */
    stopAutoCleanup() {
      if (this.cleanupTimerId) {
        clearInterval(this.cleanupTimerId);
        this.cleanupTimerId = undefined;
        console.log('⏹️ 缓存自动清理已停止');
      }
    },

    /**
     * 更新缓存配置
     */
    updateConfig(newConfig: Partial<CacheConfig>) {
      this.config = { ...this.config, ...newConfig };
      
      // 如果启用了自动清理但当前没有运行，则启动
      if (this.config.enableAutoCleanup && !this.cleanupTimerId) {
        this.startAutoCleanup();
      } else if (!this.config.enableAutoCleanup && this.cleanupTimerId) {
        this.stopAutoCleanup();
      }
    }
  }
  
  // 临时移除持久化配置，等安装插件后再启用
});