import { ref, getCurrentInstance } from 'vue';
import type { ArticalData as BaseArticalData } from '../utils/typeof';
import { getArticleApi, getArticleDetailApi } from '../api';
import { useCode } from './code';
import { useUserStore } from '../store/user';

// 扩展ArticalData类型以包含content属性
interface ArticalData extends BaseArticalData {
    content?: string;
}

export const useArticle = () => {
    // ✅ 修复：将useCode移到函数内部，避免顶层执行导致的初始化问题
    const { tackleCode } = useCode();
    // 响应式数据
    const articleList = ref<ArticalData[]>([]);
    const count = ref(0);
    const loading = ref(false);

    // 用户store
    const userStore = useUserStore();
    
    // 文章详情
    const article = ref<ArticalData>();
    const detailLoading = ref(false);
    const publishLoading = ref(false);

    const getdata = async (request: any, append = false) => {
        // 创建新的请求对象，避免修改原始请求
        const apiRequest = {
            ...request,
            pagesize: request.pageSize || request.pagesize || 9, // 统一使用9条分页
            classify: request.classify || 0
        };
        
        // 简化逻辑：统一使用页码参数
        if (append && articleList.value.length > 0) {
            // 追加模式：使用传入的页码
            if (request.nowPage) {
                apiRequest.nowpage = request.nowPage;
            }
        } else {
            // 替换模式：从第1页开始
            apiRequest.nowpage = 1;
        }
        
        // 确保删除可能导致混淆的offset参数
        if ('offset' in apiRequest) {
            delete apiRequest.offset;
        }
        
        loading.value = true; 
        
        try {
            const res: any = await getArticleApi(apiRequest);
            loading.value = false;
            
            if (tackleCode(res.code)) {
                if (request.count) {
                    count.value = res.data.count;
                }
                
                if (append && articleList.value.length > 0) {
                    // 追加模式：简单追加新数据
                    const currentIds = new Set(articleList.value.map(item => item.id));
        
                    // 过滤重复数据（避免意外的重复）
                    const newData = res.data.result.filter((item: {id: number}) => !currentIds.has(item.id));
                    
                    // 直接追加所有新数据
                    articleList.value = [...articleList.value, ...newData];
                    
                } else {
                    // 替换模式：用新数据替换现有数据
                    articleList.value = [...res.data.result];
                }
            }
            
            return res;
        } catch (error) {
            console.error('useArticle - API请求失败:', error);
            loading.value = false;
            return { error };
        }
    }

    // 获取文章详情
    const getArticleDetail = (id: number) => {
        detailLoading.value = true;
        const request = {
            id,
            token: userStore.token
        }
        getArticleDetailApi(request).then((res: any) => {
            if (tackleCode(res.code)) {
                article.value = res.data;
                return;
            }
        }).finally(() => {
            detailLoading.value = false;
        })
    }

    return {
        articleList,
        count,
        loading,
        article,
        detailLoading,
        getdata,
        publishLoading,
        getArticleDetail
    }
}