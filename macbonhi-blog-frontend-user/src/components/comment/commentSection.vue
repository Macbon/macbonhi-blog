<template>
    <div class="comment-section">
        <div class="comment-section-header">
            <h2>评论 {{ commentCount }}</h2>
        </div>
        
        <!-- 评论列表 -->
        <div class="comment-list">
            <commentitem 
                v-for="comment in comments" 
                :key="comment.id" 
                :comment="comment"
                :browser-id="browserId"
                @refresh="refreshComments"
            />
        </div>
        
        <!-- 分页 -->
        <div class="pagination" v-if="totalPages > 1">
            <button 
                :disabled="currentPage === 1" 
                @click="changePage(currentPage - 1)"
                class="page-btn"
            >
                上一页
            </button>
            
            <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
            
            <button 
                :disabled="currentPage === totalPages" 
                @click="changePage(currentPage + 1)"
                class="page-btn"
            >
                下一页
            </button>
        </div>
        
        <!-- 无评论提示 -->
        <div class="no-comments" v-if="commentCount === 0">
            暂无评论，快来发表第一条评论吧！
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, defineExpose } from 'vue';
import commentitem from './commentitem.vue';
import { getArticleCommentsApi, getDiaryCommentsApi } from '../../api/index';
import { useCommentStore } from '../../store/comment'; // 导入评论store

// 组件接收参数
const props = defineProps({
    targetId: {
        type: Number,
        required: true
    },
    targetType: {
        type: Number,
        default: 0 // 0: 文章, 3: 随笔
    },
    browserId: {
        type: String,
        required: true
    }
});

// 获取评论Store
const commentStore = useCommentStore();

// 数据定义
const comments = ref<any[]>([]);
const commentCount = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const totalPages = ref(1);

const fetchComments = async () => {
    // 验证必要参数
    if (!props.browserId || props.browserId.trim() === '') {
        console.warn('browserId 未准备好，延迟获取评论');
        return;
    }
    
    try {
        
        const apiMethod = props.targetType === 0 
            ? getArticleCommentsApi 
            : getDiaryCommentsApi;
        
        const res = await apiMethod({
            article_id: props.targetType === 0 ? props.targetId : undefined,
            diary_id: props.targetType === 3 ? props.targetId : undefined,
            browser_id: props.browserId,
            pageSize: pageSize.value,
            nowPage: currentPage.value,
            count: true
        });
        
        
        if (res.code === 200) {
            comments.value = res.data.comments || [];
            commentCount.value = res.data.count || 0;
            
            // 更新全局评论数量状态
            commentStore.setCommentCount(props.targetId, res.data.count || 0);
            
            totalPages.value = Math.ceil((res.data.count || 0) / pageSize.value);
            
        }
    } catch (error) {
        console.error('获取评论失败:', error);
    }
};

const refreshComments = () => {
    fetchComments();
};

const changePage = (page:any) => {
    currentPage.value = page;
};

// 生命周期
onMounted(() => {
    // 只有在有有效的browserId时才获取评论
    if (props.browserId && props.browserId.trim() !== '') {
        fetchComments();
    }
});

// 监听browserId变化
watch(() => props.browserId, (newBrowserId) => {
    if (newBrowserId && newBrowserId.trim() !== '') {
        fetchComments();
    }
}, { immediate: true });

// 监听页码变化
watch(currentPage, () => {
    fetchComments();
});

// 监听目标ID变化
watch(() => props.targetId, () => {
    currentPage.value = 1;
    fetchComments();
});

// 暴露方法给父组件
defineExpose({
    refreshComments
});
</script>

<style scoped>
.comment-section {
    margin-top: 30px;
}

.comment-section-header {
    margin-bottom: 20px;
    border-bottom: 1px solid #f0f0f0;
    padding-bottom: 10px;
}

.comment-section-header h2 {
    font-size: 18px;
    font-weight: bold;
    color: #333;
}

.comment-list {
    margin-bottom: 20px;
}

.pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 20px;
    gap: 15px;
}

.page-btn {
    padding: 5px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background-color: #fff;
    cursor: pointer;
}

.page-btn:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
    color: #999;
}

.page-info {
    color: #666;
}

.no-comments {
    text-align: center;
    padding: 30px 0;
    color: #999;
}
</style>
