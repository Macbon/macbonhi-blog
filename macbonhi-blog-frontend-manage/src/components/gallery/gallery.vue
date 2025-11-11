<template>
    <div class="gallery-card">
        <div class="gallery-content">
            <!-- 有数据时显示图库列表 -->
            <div class="gallery-content-files" v-if="articleList.length > 0">
                <galleryItem 
                    v-for="item in articleList" 
                    :data="item" 
                    :key="item.id" 
                    @delete="deleteArticle"
                />
            </div>
            
            <!-- 无数据时显示空状态 -->
            <div class="empty-state" v-else>
                <div class="empty-state-content">
                    <div class="empty-icon">
                        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8 52C8 54.2091 9.79086 56 12 56H52C54.2091 56 56 54.2091 56 52V20C56 17.7909 54.2091 16 52 16H44V12C44 9.79086 42.2091 8 40 8H24C21.7909 8 20 9.79086 20 12V16H12C9.79086 16 8 17.7909 8 20V52Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M20 16V12C20 9.79086 21.7909 8 24 8H40C42.2091 8 44 9.79086 44 12V16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M32 28V40" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M26 34H38" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <h3 class="empty-title">{{ getEmptyTitle() }}</h3>
                    <p class="empty-description">{{ getEmptyDescription() }}</p>
                    <div class="empty-actions" v-if="showCreateButton">
                        <a-button type="primary" @click="createNewGallery">
                            创建图库
                        </a-button>
                    </div>
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
</template>

<script setup lang="ts">
import { ref, onMounted, watch, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import galleryItem from './gallery-item.vue';
import { useArticle } from '../../hooks/article';
import { useUserStore } from '../../store/user';
import { useCommentStore } from '../../store/comment';
import { getArticleCommentsApi } from '../../api/index';

const router = useRouter();
const userStore = useUserStore();
const commentStore = useCommentStore(); // 引入评论store

const { getdata, articleList, count, changeArticleState, deleteArticle } = useArticle();

// 批量获取图库评论数
const fetchCommentsForGalleries = async (galleries: any[]) => {
    for (const gallery of galleries) {
        try {
            // 图库也使用 getArticleCommentsApi，但传入 diary_id（根据实际API调整）
            const response = await getArticleCommentsApi({
                article_id: gallery.id, // 或者 gallery_id，根据后端API确定
                count: true
            });
            
            if (response.code === 200 && response.data) {
                const commentCount = response.data.count || 0;
                console.log(`图库${gallery.id}获取到评论数: ${commentCount}`);
                commentStore.setCommentCount(gallery.id, commentCount);
            } else {
                console.log(`图库${gallery.id}评论数获取失败，使用默认值0`);
                commentStore.setCommentCount(gallery.id, 0);
            }
        } catch (error) {
            console.error(`获取图库${gallery.id}评论数失败:`, error);
            commentStore.setCommentCount(gallery.id, 0);
        }
    }
};

// 获取图库数据和评论数
const fetchGalleryWithComments = async (requestParams: any) => {
    await getdata(requestParams);
    
    console.log('管理端图库列表数据:', articleList.value);
    
    // 由于API没有返回评论数，我们需要单独获取
    if (articleList.value.length > 0) {
        console.log('开始批量获取图库评论数...');
        await fetchCommentsForGalleries(articleList.value);
        console.log('图库评论数获取完成');
    }
};

const current = ref(1);
const loading = ref(false); // 加载状态

const props = defineProps({
    pageSize: {
        type: Number,
        default: 6,
    },
    subsetId: {
        type: Number,
        default: -1,
    },
    state: {
        type: Number,
        default: 1,  // 临时改为1，测试已发布图库是否有评论数
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
    classify: 1 
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
        return '未找到相关图库';
    }
    
    if (props.subsetId === 0) {
        return '暂无未分组图库';
    } else if (props.subsetId > 0) {
        return '该分组暂无图库';
    } else if (props.state === 0) {
        return '暂无未发布图库';
    } else if (props.state === 1) {
        return '暂无已发布图库';
    } else {
        return '暂无图库';
    }
};

// 获取空状态描述
const getEmptyDescription = () => {
    if (loading.value) {
        return '正在加载图库数据...';
    }
    
    if (props.searchTerm) {
        return `没有找到包含"${props.searchTerm}"的图库，请尝试其他关键词`;
    }
    
    if (props.subsetId === 0) {
        return '还没有未分组的图库，可以创建新的图库或将现有图库移至此分组';
    } else if (props.subsetId > 0) {
        return '这个分组还没有图库，可以创建新的图库或将现有图库移至此分组';
    } else if (props.state === 0) {
        return '还没有未发布的图库，创建新图库后可以在这里看到草稿';
    } else if (props.state === 1) {
        return '还没有已发布的图库，发布图库后可以在这里看到';
    } else {
        return '还没有创建任何图库，点击下方按钮创建你的第一个图库';
    }
};

// 创建新图库
const createNewGallery = () => {
    router.push({ name: 'EditPhoto' });
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
    fetchGalleryWithComments(request);
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
        Promise.resolve(fetchGalleryWithComments(request)).finally(() => {
            loading.value = false;
        });
    },
    { deep: true }
);

onMounted(async () => {
    loading.value = true;
    await fetchGalleryWithComments(request);
    loading.value = false;
});

// 处理文章状态变更
const handleArticleState = (eventData: {id: number, state: number}) => {
    const { id, state } = eventData;
    changeArticleState(id, state);
};
</script>

<style scoped>
.gallery-card {
    display: flex; 
    gap: 24px; 
    width: 100%;
    background-color: var(--background-topbar) !important;
    padding: 24px;
    border-radius: 8px;
    flex-direction: column;
    transition: background 0.3s, border-color 0.3s;
}

[data-theme="dark"] .gallery-card {
    background-color: var(--background-topbar) !important;
}

.gallery-content {
    flex: 1;
    padding: 32px 24px;
    width: 100%;
    margin: 0;
    background: transparent;
    min-height: 400px; /* 确保有最小高度 */
}

.gallery-content-files {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(238px, 1fr));
    gap: 32px 24px;
    justify-content: center;
    align-items: start;
}

/* 空状态样式 */
.empty-state {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 400px;
    width: 100%;
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

/* 分页器样式 */
.article-pagination {
    padding: 16px 0 24px;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    border-top: 1px solid var(--gray-200);
    background: transparent;
}

[data-theme="dark"] .article-pagination {
    border-top: 1px solid var(--gray-400);
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