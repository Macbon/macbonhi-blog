import { ref, reactive } from 'vue';
import { getArticleApi } from '../api';
import { apiCache, CacheConfig, CacheKeys } from '../utils/apiCache';
import { useUserStore } from '../store/user';

export function useArticle() {
  // 获取用户store
  const userStore = useUserStore();
  
  // 文章列表数据
  const articles = ref<any[]>([]);
  // 加载状态
  const loading = ref(false);
  // 分页信息
  const pagination = reactive({
    current: 1,
    pageSize: 6,
    total: 0
  });
  // 是否有更多数据
  const hasMore = ref(true);

  /**
   * 获取文章列表 - ✅ 集成智能缓存
   * @param params 过滤参数
   */
  const fetchArticles = async (params: {
    page?: number;
    pageSize?: number;
    categoryId?: number;
    searchTerm?: string;
    reset?: boolean;
    forceRefresh?: boolean; // 新增：强制刷新选项
    classify?: number; // 新增：内容类型 0=文章，1=图库
  } = {}) => {
    const { 
      page = pagination.current, 
      pageSize = pagination.pageSize, 
      categoryId, 
      searchTerm, 
      reset = false,
      forceRefresh = false,
      classify = 0 // 默认为文章类型
    } = params;
    
    try {
      loading.value = true;
      
      // 如果是重置或第一页，清空当前列表
      if (reset || page === 1) {
        articles.value = [];
        pagination.current = 1;
      }
      
      // ✅ 使用缓存系统获取数据
      const cacheKey = CacheKeys.articles({ page, pageSize, categoryId, searchTerm });
      
      // ✅ 修复：使用原来的POST API和参数格式
      const apiParams = {
        token: userStore.token || 'guest', // 游客使用guest token
        nowpage: page,                    // 后端使用 nowpage
        pagesize: pageSize,               // 后端使用 pagesize  
        count: true,                      // 后端使用 count
        classify: classify,               // 直接使用传入的classify参数：0=文章，1=图库
        ...(categoryId !== undefined && categoryId !== -1 && { subsetId: categoryId }),
        ...(searchTerm && { keyword: searchTerm })
      };
      
      console.log('🔍 useArticle fetchArticles - 发送参数:', apiParams);
      
      // ✅ 临时移除缓存，直接调用API进行调试
      console.log('🚀 直接调用API (跳过缓存)...');
      const response = await getArticleApi(apiParams);
      
      console.log('📥 useArticle fetchArticles - 收到响应:', response);
      
      // ✅ 修复：适配原API的数据结构
      if (response && response.data) {
        const newArticles = response.data.result || [];  // 原API返回 result 字段
        const total = response.data.count || 0;          // 原API返回 count 字段
        
        console.log('📊 useArticle fetchArticles - 解析数据:', {
          newArticles: newArticles.length,
          total,
          page,
          reset: reset || page === 1
        });
        
        // 如果是加载更多（非重置），则追加数据
        if (page > 1 && !reset) {
          // 避免重复数据
          const existingIds = new Set(articles.value.map(a => a.id));
          const uniqueNewArticles = newArticles.filter(a => !existingIds.has(a.id));
          articles.value = [...articles.value, ...uniqueNewArticles];
          console.log('➕ 追加文章数据:', uniqueNewArticles.length, '篇');
        } else {
          articles.value = newArticles;
          console.log('🔄 重置文章数据:', newArticles.length, '篇');
        }
        
        pagination.total = total;
        pagination.current = page;
        
        // 判断是否还有更多数据
        hasMore.value = articles.value.length < total;
        
        console.log('✅ 文章数据更新完成:', {
          articlesCount: articles.value.length,
          total: pagination.total,
          hasMore: hasMore.value
        });
      } else {
        console.error('❌ API响应格式异常:', response);
      }
    } catch (error) {
      console.error('获取文章列表出错:', error);
    } finally {
      loading.value = false;
    }
  };

  /**
   * 加载更多文章
   */
  const loadMore = async (categoryId?: number, searchTerm?: string) => {
    if (loading.value || !hasMore.value) return;
    
    await fetchArticles({
      page: pagination.current + 1,
      categoryId,
      searchTerm
    });
  };

  /**
   * 根据分类ID重置并加载文章
   */
  const fetchArticlesByCategory = async (categoryId: number) => {
    await fetchArticles({
      categoryId,
      reset: true
    });
  };

  /**
   * 根据关键词搜索文章
   */
  const searchArticles = async (searchTerm: string) => {
    await fetchArticles({
      searchTerm,
      reset: true
    });
  };

  /**
   * 清除文章缓存
   */
  const clearCache = (params?: any) => {
    if (params) {
      const cacheKey = CacheKeys.articles(params);
      apiCache.invalidate(cacheKey);
    } else {
      // 清除所有文章相关缓存
      apiCache.clear();
    }
  };

  /**
   * 预加载文章数据（性能优化）
   */
  const preloadArticles = async (params: any) => {
    const cacheKey = CacheKeys.articles(params);
    
    // ✅ 修复：使用原来的POST API
    const apiParams = {
      token: userStore.token || 'guest', // 游客使用guest token
      nowpage: params.page,
      pagesize: params.pageSize,
      count: true,
      classify: params.classify,   // 直接使用传入的classify参数：0=文章，1=图库
      ...(params.categoryId !== undefined && params.categoryId !== -1 && { subsetId: params.categoryId }),
      ...(params.searchTerm && { keyword: params.searchTerm })
    };
    
    await apiCache.preload(
      cacheKey,
      () => getArticleApi(apiParams),
      CacheConfig.ARTICLES
    );
  };

  console.log('🏁 useArticle: hook 初始化完成，返回方法...');
  
  return {
    articles,
    loading,
    pagination,
    hasMore,
    fetchArticles,
    loadMore,
    fetchArticlesByCategory,
    searchArticles,
    clearCache,      // 新增：缓存管理
    preloadArticles  // 新增：预加载功能
  };
} 