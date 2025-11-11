// ✅ 性能优化：智能API缓存系统
// 减少重复请求，提升用户体验和系统性能

interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  ttl: number; // 生存时间(毫秒)
}

interface CacheOptions {
  ttl?: number; // 默认5分钟
  forceRefresh?: boolean; // 强制刷新
  storage?: 'memory' | 'localStorage'; // 存储方式
}

class ApiCache {
  private memoryCache = new Map<string, CacheItem>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5分钟
  private readonly MAX_MEMORY_ITEMS = 100; // 内存缓存最大条目数

  /**
   * 获取缓存数据或执行获取函数
   */
  async get<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    options: CacheOptions = {}
  ): Promise<T> {
    const { 
      ttl = this.DEFAULT_TTL, 
      forceRefresh = false,
      storage = 'memory'
    } = options;

    // 强制刷新时直接获取新数据
    if (forceRefresh) {
      const data = await this.fetchAndCache(key, fetcher, ttl, storage);
      return data;
    }

    // 先检查内存缓存
    const memoryItem = this.memoryCache.get(key);
    if (memoryItem && this.isValid(memoryItem)) {
      console.log(`📦 Cache hit (memory): ${key}`);
      return memoryItem.data;
    }

    // 检查localStorage缓存
    if (storage === 'localStorage') {
      const localItem = this.getFromLocalStorage(key);
      if (localItem && this.isValid(localItem)) {
        // 回填到内存缓存
        this.setMemoryCache(key, localItem);
        console.log(`📦 Cache hit (localStorage): ${key}`);
        return localItem.data as T;
      }
    }

    // 缓存未命中，获取新数据
    console.log(`🔄 Cache miss, fetching: ${key}`);
    const data = await this.fetchAndCache(key, fetcher, ttl, storage);
    return data;
  }

  /**
   * 获取数据并缓存
   */
  private async fetchAndCache<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    ttl: number,
    storage: 'memory' | 'localStorage'
  ): Promise<T> {
    try {
      const data = await fetcher();
      const cacheItem: CacheItem<T> = {
        data: data as T,
        timestamp: Date.now(),
        ttl
      };

      // 保存到内存缓存
      this.setMemoryCache(key, cacheItem);

      // 保存到localStorage
      if (storage === 'localStorage') {
        this.setLocalStorageCache(key, cacheItem);
      }

      return data;
    } catch (error) {
      console.error(`❌ Failed to fetch data for key: ${key}`, error);
      throw error;
    }
  }

  /**
   * 设置内存缓存
   */
  private setMemoryCache<T>(key: string, item: CacheItem<T>) {
    // 控制内存缓存大小，采用LRU策略
    if (this.memoryCache.size >= this.MAX_MEMORY_ITEMS) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }
    
    this.memoryCache.set(key, item);
  }

  /**
   * 设置localStorage缓存
   */
  private setLocalStorageCache<T>(key: string, item: CacheItem<T>) {
    try {
      const cacheKey = `api_cache_${key}`;
      localStorage.setItem(cacheKey, JSON.stringify(item));
    } catch (error) {
      console.warn(`⚠️ Failed to save to localStorage: ${key}`, error);
    }
  }

  /**
   * 从localStorage获取缓存
   */
  private getFromLocalStorage<T>(key: string): CacheItem<T> | null {
    try {
      const cacheKey = `api_cache_${key}`;
      const cached = localStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn(`⚠️ Failed to read from localStorage: ${key}`, error);
      return null;
    }
  }

  /**
   * 检查缓存项是否有效
   */
  private isValid(item: CacheItem): boolean {
    return Date.now() - item.timestamp < item.ttl;
  }

  /**
   * 手动清除指定缓存
   */
  invalidate(key: string) {
    this.memoryCache.delete(key);
    try {
      localStorage.removeItem(`api_cache_${key}`);
      console.log(`🗑️ Cache invalidated: ${key}`);
    } catch (error) {
      console.warn(`⚠️ Failed to invalidate localStorage cache: ${key}`, error);
    }
  }

  /**
   * 清除所有缓存
   */
  clear() {
    this.memoryCache.clear();
    try {
      // 清除所有API缓存相关的localStorage项
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('api_cache_')) {
          localStorage.removeItem(key);
        }
      });
      console.log('🧹 All cache cleared');
    } catch (error) {
      console.warn('⚠️ Failed to clear localStorage cache', error);
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats() {
    const memorySize = this.memoryCache.size;
    const localStorageSize = Object.keys(localStorage).filter(key => 
      key.startsWith('api_cache_')
    ).length;

    return {
      memoryItems: memorySize,
      localStorageItems: localStorageSize,
      maxMemoryItems: this.MAX_MEMORY_ITEMS
    };
  }

  /**
   * 预加载数据（可选的性能优化）
   */
  async preload<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    options: CacheOptions = {}
  ) {
    // 在后台预加载数据，不阻塞当前操作
    setTimeout(async () => {
      try {
        await this.get(key, fetcher, { ...options, forceRefresh: true });
        console.log(`⚡ Preloaded: ${key}`);
      } catch (error) {
        console.warn(`⚠️ Preload failed: ${key}`, error);
      }
    }, 100);
  }
}

// 创建全局缓存实例
export const apiCache = new ApiCache();

// 针对不同数据类型的缓存配置
export const CacheConfig = {
  // 文章列表：缓存2分钟，使用localStorage持久化
  ARTICLES: {
    ttl: 2 * 60 * 1000,
    storage: 'localStorage' as const
  },
  
  // 图库列表：缓存5分钟，使용localStorage持久化
  GALLERY: {
    ttl: 5 * 60 * 1000,
    storage: 'localStorage' as const
  },
  
  // 文章详情：缓存10分钟，使用localStorage持久化
  ARTICLE_DETAIL: {
    ttl: 10 * 60 * 1000,
    storage: 'localStorage' as const
  },
  
  // 评论数据：缓存1分钟，仅内存缓存
  COMMENTS: {
    ttl: 1 * 60 * 1000,
    storage: 'memory' as const
  },
  
  // 用户数据：缓存30分钟，使用localStorage持久化
  USER_INFO: {
    ttl: 30 * 60 * 1000,
    storage: 'localStorage' as const
  },
  
  // 分类数据：缓存1小时，使用localStorage持久化
  CATEGORIES: {
    ttl: 60 * 60 * 1000,
    storage: 'localStorage' as const
  }
} as const;

// 缓存键生成工具
export const CacheKeys = {
  articles: (params: any) => `articles_${JSON.stringify(params)}`,
  article: (id: number) => `article_${id}`,
  gallery: (params: any) => `gallery_${JSON.stringify(params)}`,
  comments: (articleId: number) => `comments_${articleId}`,
  userInfo: (userId: number) => `user_${userId}`,
  categories: () => 'categories',
  praise: (articleId: number) => `praise_${articleId}`
};