import axios from '../utils/axios';

// 文章相关API
export const articleApi = {
  /**
   * 获取文章列表
   * @param params 请求参数
   * @returns 文章列表和总数
   */
  getArticles: async (params: {
    page?: number;        // 当前页码
    pageSize?: number;    // 每页显示数量
    categoryId?: number;  // 分类ID
    searchTerm?: string;  // 搜索关键词
    showCount?: boolean;  // 是否返回总数
  }) => {
    try {
      const { page = 1, pageSize = 6, categoryId, searchTerm, showCount = true } = params;
      
      const response = await axios.get(`/articles`, {
        params: {
          page,
          pageSize,
          categoryId: categoryId !== -1 ? categoryId : undefined, // -1 表示全部分类
          searchTerm: searchTerm || undefined,
          state: 1, // 只获取已发布的文章
          showCount
        }
      });
      
      return {
        articles: response.data.data || [],
        total: response.data.total || 0,
        success: true
      };
    } catch (error) {
      console.error('获取文章列表失败:', error);
      return {
        articles: [],
        total: 0,
        success: false
      };
    }
  },

  /**
   * 获取文章详情
   * @param id 文章ID
   * @returns 文章详情
   */
  getArticleById: async (id: number) => {
    try {
      const response = await axios.get(`/articles/${id}`);
      return {
        article: response.data.data,
        success: true
      };
    } catch (error) {
      console.error('获取文章详情失败:', error);
      return {
        article: null,
        success: false
      };
    }
  },
  
  /**
   * 增加文章浏览量
   * @param id 文章ID
   */
  increaseViews: async (id: number) => {
    try {
      await axios.post(`/articles/${id}/view`);
      return true;
    } catch (error) {
      console.error('增加浏览量失败:', error);
      return false;
    }
  }
}; 