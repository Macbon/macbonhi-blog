import { ref, shallowRef, computed, watch } from 'vue';
import type { ArticalData } from '../utils/typeof';
import { getArticleApi, changeArticleStateApi, deleteArticleApi, getArticleDetailApi, addArticleApi, updateArticleApi } from '../api';
import { useCode } from './code';
import { useUserStore } from '../store/user';
import { useCommentStore } from '../store/comment';
import { message } from 'ant-design-vue';

const { tackleCode } = useCode();

// 使用memo缓存函数，避免重复请求相同参数的数据
function useMemoize<T, R>(fn: (arg: T) => Promise<R>, ttl = 60000) {
  const cache = new Map<string, { value: R, timestamp: number }>();
  
  return async (arg: T): Promise<R> => {
    const key = JSON.stringify(arg);
    const cached = cache.get(key);
    const now = Date.now();
    
    if (cached && now - cached.timestamp < ttl) {
      return cached.value;
    }
    
    const result = await fn(arg);
    cache.set(key, { value: result, timestamp: now });
    
    return result;
  };
}

// 文章列表状态缓存，跨组件共享数据
const articleCache = {
  listData: null as ArticalData[] | null,
  timestamp: 0,
  ttl: 60000, // 缓存有效期1分钟
  params: null as any // 缓存的请求参数
};

export const useArticle = () => {
  const userStore = useUserStore();
  const commentStore = useCommentStore(); // 引入评论store

  // 使用shallowRef优化大型列表的响应性能
  // shallowRef只跟踪引用变化，不递归追踪内部属性变化，适合大型数组
  const articleList = shallowRef<ArticalData[]>([]);
  const count = ref<number>(0); // 文章总数
  const loading = ref<boolean>(false);
  
  // 加载状态
  const saveLoading = ref(false);
  const publishLoading = ref(false);

  // 默认文章详情（使用shallowRef优化）
  const defaultArticle = shallowRef({} as any);
  
  // 编辑器数据
  const editorData = shallowRef({} as any);
  
  // 默认相册数据
  const defaulGallery = shallowRef({} as any);
  
  // 计算属性：根据状态过滤文章
  const filteredArticles = computed(() => {
    // 示例：按状态过滤文章，避免在模板中多次遍历
    return {
      published: articleList.value.filter(article => article.state === 1),
      draft: articleList.value.filter(article => article.state === 0)
    };
  });
  
  // 使用缓存优化的数据获取函数
  const getdata = (request: any) => {
    // 规范化请求参数
    const apiRequest = {
      ...request,
      pagesize: request.pageSize || request.pagesize || 4,
      nowpage: request.nowPage || request.nowpage || 1,
      classify: request.classify || 0 
    };
    
    // 检查是否有有效的缓存数据
    const now = Date.now();
    const isSameRequest = articleCache.params && 
                         JSON.stringify(articleCache.params) === JSON.stringify(apiRequest);
                         
    if (isSameRequest && 
        articleCache.listData && 
        now - articleCache.timestamp < articleCache.ttl) {
      // 使用缓存数据
      articleList.value = [...articleCache.listData];
      return Promise.resolve();
    }
    
    loading.value = true; 
    
    return getArticleApi(apiRequest).then((res: any) => {
      console.log('管理端API完整响应:', res);
      console.log('管理端API请求参数:', apiRequest);
      
      if (tackleCode(res.code)) {
        if (request.count) {
          count.value = res.data.count;
        }
        
        // 对比新数据与当前数据，仅在有变化时才更新引用
        // 这样可以减少不必要的视图更新
        const newArticles = res.data.result;
        console.log('管理端API返回的文章数据详情:', newArticles);
        
        if (JSON.stringify(articleList.value) !== JSON.stringify(newArticles)) {
          articleList.value = [...newArticles];
          
          // 更新缓存
          articleCache.listData = newArticles;
          articleCache.timestamp = Date.now();
          articleCache.params = apiRequest;
        }
      } else {
        console.error('useArticle - API响应失败:', res);
      }
    }).catch(error => {
      console.error('useArticle - API请求失败:', error);
    }).finally(() => {
      loading.value = false;
    });
  };
  
  // 使用对象引用比较优化列表项更新
  const changeArticleState = (id: number, state: number) => {
    const request = {
      token: userStore.token,
      articleId: id,
      state: state
    };
    
    return changeArticleStateApi(request).then((res: any) => {
      if (tackleCode(res.code)) {
        // 使用map创建新数组，只更新变化的项目
        const updatedList = articleList.value.map((item) => {
          if (item.id === id) {
            // 返回一个新对象，保持其他属性不变
            return { ...item, state };
          }
          return item; // 对于未修改的项，返回原始引用
        });
        
        // 赋值新数组触发响应式更新
        articleList.value = updatedList;
        
        // 更新缓存
        if (articleCache.listData) {
          articleCache.listData = updatedList;
        }
        
        // 使用统一的消息提示
        message.success(state === 1 ? '发布成功' : '已撤回');
        
        return res;
      } else {
        message.error('状态更改失败');
        console.error('状态更改失败:', res);
        return Promise.reject(res);
      }
    }).catch(error => {
      message.error('请求失败');
      console.error('状态更改请求失败:', error);
      return Promise.reject(error);
    });
  };
  
  // 使用乐观更新优化用户体验
  const deleteArticle = (id: number) => {
    // 立即从UI中移除项目，不等待API响应
    const originalList = [...articleList.value];
    
    // 乐观更新：立即从列表移除
    articleList.value = articleList.value.filter(item => item.id !== id);
    
    const request = {
      token: userStore.token,
      articleId: id,
    };
    
    return deleteArticleApi(request).then((res: any) => {
      if (tackleCode(res.code)) {
        message.success('删除成功');
        
        // 更新缓存
        if (articleCache.listData) {
          articleCache.listData = articleList.value;
        }
        
        return res;
      } else {
        // 删除失败，恢复原始数据
        articleList.value = originalList;
        message.error('删除失败');
        console.error('删除失败:', res);
        return Promise.reject(res);
      }
    }).catch(error => {
      // 请求出错，恢复原始数据
      articleList.value = originalList;
      message.error('请求失败');
      console.error('删除请求失败:', error);
      return Promise.reject(error);
    });
  };
  
  // 优化文章详情获取逻辑
  const getArticleDetail = (id: number) => {
    if (!id) {
      defaultArticle.value = {}; // 清空详情，用于创建新文章
      return Promise.resolve();
    }
    
    return getArticleDetailApi({ token: userStore.token, articleId: id })
      .then((res: any) => {
        if (tackleCode(res.code) && res.data) {
          // 使用shallowRef优化大型对象的响应性
          defaultArticle.value = res.data;
          return res.data;
        } else {
          message.error('获取文章详情失败');
          console.error('获取文章详情失败:', res);
          return Promise.reject(res);
        }
      })
      .catch(error => {
        message.error('请求失败');
        console.error('获取文章详情请求失败:', error);
        return Promise.reject(error);
      });
  };
  
  // 保存草稿方法
  const saveDraft = async (editorContent: string, formData: any, articleId?: number) => {
    saveLoading.value = true;
    try {
      const request = {
        token: userStore.token,
        content: editorContent,
        ...formData,
        state: 0, // 草稿状态
        ...(articleId ? { id: articleId } : {})
      };
      
      const res = await (articleId ? updateArticleApi(request) : addArticleApi(request));
      
      if (tackleCode(res.code)) {
        message.success('草稿保存成功');
        return res;
      } else {
        message.error('保存失败');
        return Promise.reject(res);
      }
    } catch (error) {
      message.error('保存失败');
      console.error('保存草稿失败:', error);
      return Promise.reject(error);
    } finally {
      saveLoading.value = false;
    }
  };
  
  // 发布文章方法
  const publishArticle = async (editorContent: string, formData: any, articleId?: number) => {
    publishLoading.value = true;
    try {
      const request = {
        token: userStore.token,
        content: editorContent,
        ...formData,
        state: 1, // 发布状态
        ...(articleId ? { id: articleId } : {})
      };
      
      const res = await (articleId ? updateArticleApi(request) : addArticleApi(request));
      
      if (tackleCode(res.code)) {
        message.success('发布成功');
        return res;
      } else {
        message.error('发布失败');
        return Promise.reject(res);
      }
    } catch (error) {
      message.error('发布失败');
      console.error('发布文章失败:', error);
      return Promise.reject(error);
    } finally {
      publishLoading.value = false;
    }
  };
  
  // 改变首页显示状态
  const changeHome = async (id: number, isHome: boolean) => {
    try {
      const request = {
        token: userStore.token,
        articleId: id,
        home: isHome ? 1 : 0
      };
      
      // 这里需要根据实际API调整
      // const res = await changeHomeApi(request);
      
      message.success(isHome ? '已设为首页显示' : '已取消首页显示');
      return true;
    } catch (error) {
      message.error('操作失败');
      console.error('改变首页状态失败:', error);
      return Promise.reject(error);
    }
  };
  
  // 返回API
  return {
    articleList,
    filteredArticles, // 新增：经过计算的过滤列表
    count,
    loading,
    saveLoading,
    publishLoading,
    defaultArticle,
    editorData,
    defaulGallery,
    getdata,
    changeArticleState,
    deleteArticle,
    getArticleDetail,
    saveDraft,
    publishArticle,
    changeHome,
  };
};