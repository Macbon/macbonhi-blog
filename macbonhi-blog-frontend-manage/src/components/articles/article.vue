<template>
    <div style="display: flex; gap: 24px; width: 100%;">
        <div class="article-body">
            <div style="display: flex; gap: 24px; flex-direction: column; background-color: var(--background-color);">

                <!-- 有数据时显示文章列表 -->
                <template v-if="articleList.length > 0">
                    <articleitem 
                        v-for="item in articleList" 
                        :data="item" 
                        :key="item.id" 
                        @delete="deleteArticle" 
                        @state="handleArticleState"
                    />
                </template>

                <!-- 无数据时显示空状态 -->
                <div class="empty-state" v-else>
                    <div class="empty-state-content">
                        <div class="empty-icon">
                            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M16 8C13.7909 8 12 9.79086 12 12V52C12 54.2091 13.7909 56 16 56H48C50.2091 56 52 54.2091 52 52V20L40 8H16Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M40 8V20H52" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M28 32H36" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M28 40H44" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M28 48H44" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <h3 class="empty-title">{{ getEmptyTitle() }}</h3>
                        <p class="empty-description">{{ getEmptyDescription() }}</p>
                        <div class="empty-actions" v-if="showCreateButton">
                            <a-button type="primary" @click="createNewArticle">
                                写文章
                            </a-button>
                        </div>
                    </div>
                </div>

                <!-- 只有在有数据且总数大于页面大小时才显示分页器 -->
                <div class="article-pagination" v-if="articleList.length > 0 && count > props.pageSize">
                    <a-pagination 
                        size="small" 
                        v-model:current="current" 
                        :total="count" 
                        :page-size="props.pageSize" 
                        @change="pageChange"
                        show-size-changer
                    />
                </div>
            </div>
        </div>

        <labelviwe class="article-label">
        </labelviwe>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import labelviwe from '../label/label.vue';
import articleitem from './articleitem.vue';
import { useArticle } from '../../hooks/article';
import { useUserStore } from '../../store/user';
import { useCommentStore } from '../../store/comment';
import { getArticleCommentsApi } from '../../api/index';

const router = useRouter();
const userStore = useUserStore();
const commentStore = useCommentStore(); // 引入评论store

const { getdata, articleList, count, changeArticleState, deleteArticle } = useArticle();

// 批量获取文章评论数
const fetchCommentsForArticles = async (articles: any[]) => {
    for (const article of articles) {
        try {
            const response = await getArticleCommentsApi({
                article_id: article.id,
                count: true // 只获取数量，不获取详细评论
            });
            
            if (response.code === 200 && response.data) {
                const commentCount = response.data.count || 0;
                console.log(`文章${article.id}获取到评论数: ${commentCount}`);
                commentStore.setCommentCount(article.id, commentCount);
            } else {
                console.log(`文章${article.id}评论数获取失败，使用默认值0`);
                commentStore.setCommentCount(article.id, 0);
            }
        } catch (error) {
            console.error(`获取文章${article.id}评论数失败:`, error);
            commentStore.setCommentCount(article.id, 0);
        }
    }
};

// 获取文章数据和评论数
const fetchArticlesWithComments = async (requestParams: any) => {
    await getdata(requestParams);
    
    console.log('管理端文章列表数据:', articleList.value);
    
    // 由于API没有返回评论数，我们需要单独获取
    if (articleList.value.length > 0) {
        console.log('开始批量获取评论数...');
        await fetchCommentsForArticles(articleList.value);
        console.log('评论数获取完成');
    }
};

const current = ref(1);
const loading = ref(false); // 加载状态

const props = defineProps({
    pageSize: {
        type: Number,
        default: 3,
    },
    subsetId: {
        type: Number,
        default: -1,
    },
    state: {
        type: Number,
        default: 1,  // 临时改为1，测试已发布文章是否有评论数
    },
    searchTerm: {
        type: String,
        default: '',
    },
});

const request = reactive({
    token: userStore.token,
    pageSize: props.pageSize,
    nowPage: 1,
    state: props.state,
    subsetId: props.subsetId,
    searchTerm: props.searchTerm,
    count: true,
    classify: 0 
});

// 判断是否显示创建按钮
const showCreateButton = computed(() => {
    // 只有在没有搜索条件且不是特定状态筛选时才显示创建按钮
    return !props.searchTerm && props.state === 0 && props.subsetId === -1;
});

// 获取空状态标题
const getEmptyTitle = () => {
    if (loading.value) {
        return '加载中...';
    }
    
    if (props.searchTerm) {
        return '未找到相关文章';
    }
    
    if (props.subsetId === 0) {
        return '暂无未分组文章';
    } else if (props.subsetId > 0) {
        return '该分组暂无文章';
    } else if (props.state === 0) {
        return '暂无未发布文章';
    } else if (props.state === 1) {
        return '暂无已发布文章';
    } else {
        return '暂无文章';
    }
};

// 获取空状态描述
const getEmptyDescription = () => {
    if (loading.value) {
        return '正在加载文章数据...';
    }
    
    if (props.searchTerm) {
        return `没有找到包含"${props.searchTerm}"的文章，请尝试其他关键词`;
    }
    
    if (props.subsetId === 0) {
        return '还没有未分组的文章，可以创建新文章或将现有文章移至此分组';
    } else if (props.subsetId > 0) {
        return '这个分组还没有文章，可以创建新文章或将现有文章移至此分组';
    } else if (props.state === 0) {
        return '还没有未发布的文章，创建新文章后可以在这里看到草稿';
    } else if (props.state === 1) {
        return '还没有已发布的文章，发布文章后可以在这里看到';
    } else {
        return '还没有创建任何文章';
    }
};

// 创建新文章
const createNewArticle = () => {
    router.push({ name: 'EditArticle' });
};

// 翻页函数
const pageChange = (page: number, pageSize?: number) => {
    request.nowPage = page;
    current.value = page;
    
    if (pageSize && pageSize !== request.pageSize) {
        request.pageSize = pageSize;
        request.nowPage = 1;
        current.value = 1;
    }

    loading.value = true;
    fetchArticlesWithComments(request);
};

// 监听props变化，重新获取数据
watch(
    () => [props.subsetId, props.state, props.searchTerm],
    () => {     
        request.subsetId = props.subsetId;
        request.state = props.state;
        request.searchTerm = props.searchTerm;
        request.nowPage = 1;
        current.value = 1;
        // 重新获取数据
        loading.value = true;
        Promise.resolve(fetchArticlesWithComments(request)).finally(() => {
            loading.value = false;
        });
    },
    { deep: true }
);

onMounted(async () => {
    loading.value = true;
    await fetchArticlesWithComments(request);
    loading.value = false;
});

// 处理文章状态变更
const handleArticleState = (eventData: {id: number, state: number}) => {
    const { id, state } = eventData;
    changeArticleState(id, state);
};
</script>

<style scoped>
.article-body {
    width: 200px;
    flex: 1;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    gap: 24px;
    background: var(--background-color);
    color: var(--text-color);
}

.article-label {
    width: 300px;
    height: 400px;
    flex: none;
}

.article-pagination {
    border-radius: 0px 0px 8px 8px;
    padding: 16px 0 24px;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    border-top: 1px solid var(--gray-200);
    background: var(--background-topbar);
}

/* 空状态样式 */
.empty-state {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 400px;
    width: 100%;
    background: var(--background-topbar);
    border-radius: 8px;
}

.empty-state-content {
    text-align: center;
    max-width: 400px;
    padding: 40px 20px;
}

.empty-icon {
    margin-bottom: 24px;
    color: var(--gray-400);
    display: flex;
    justify-content: center;
}

[data-theme="dark"] .empty-icon {
    color: var(--gray-500);
}

.empty-title {
    font-size: 20px;
    font-weight: 600;
    color: var(--text-color);
    margin: 0 0 12px 0;
}

.empty-description {
    font-size: 14px;
    color: var(--gray-500);
    line-height: 1.5;
    margin: 0 0 32px 0;
}

[data-theme="dark"] .empty-description {
    color: var(--gray-400);
}

.empty-actions {
    display: flex;
    justify-content: center;
    gap: 12px;
}

/* 深色主题适配 */
[data-theme="dark"] .article-body {
    background: var(--background-color);
    color: var(--text-color);
}

[data-theme="dark"] .article-label {
    background: var(--background-color);
    color: var(--text-color);
}

[data-theme="dark"] .article-pagination {
    border-top: 1px solid var(--gray-500);
    background: var(--background-topbar);
}

[data-theme="dark"] .empty-state {
    background: var(--background-topbar);
}

/* 分页器适配 */
:deep(.ant-pagination) {
    background: transparent;
    color: var(--text-color);
}

[data-theme="dark"] :deep(.ant-pagination) {
    background: transparent;
    color: var(--text-color);
}

:deep(.ant-pagination-item) {
    background: var(--background-topbar);
    color: var(--text-color);
    border-color: var(--gray-200);
}

[data-theme="dark"] :deep(.ant-pagination-item) {
    background: var(--background-color);
    color: var(--text-color);
    border-color: var(--gray-400);
}

:deep(.ant-pagination-item-active) {
    background: var(--blue-100);
    color: var(--blue-600);
    border-color: var(--blue-200);
}

[data-theme="dark"] :deep(.ant-pagination-item-active) {
    background: var(--blue-900);
    color: var(--blue-400);
    border-color: var(--blue-800);
}

:deep(.ant-pagination-item-link) {
    color: var(--text-color);
    background: transparent;
}

[data-theme="dark"] :deep(.ant-pagination-item-link) {
    color: var(--text-color);
    background: transparent;
}

/* 分页器总数显示样式 */
:deep(.ant-pagination-total-text) {
    color: var(--gray-500);
}

[data-theme="dark"] :deep(.ant-pagination-total-text) {
    color: var(--gray-400);
}
</style>