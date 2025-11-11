<template>
    <div class="comments">
        <div class="comments-title">
            <span class="comments-title-text">
                评论: {{ count }}
            </span>
        </div>
        <div class="comments-container">
            <div class="comments-content">
                <messageview v-for="item in commentsData" :key="item.id" :content="item" :isComment="true" @deleteComment="deleteComment" @markAsRead="markAsRead(item.id)" />
            </div>
            
            <div class="comments-pagination">
                <a-pagination size="small" v-model:current="current" :total="count" :page-size="props.pageSize" @change="pageChange"/>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">

import { onMounted, ref, getCurrentInstance } from 'vue';
import messageview from './messageview.vue';
import type { replyProps } from './reply';
import { getCommentsApi, deleteCommentApi, readCommentApi } from '../../api/index';
import { useUserStore } from '../../store/user';
import { useCode } from '../../hooks/code';

const userStore = useUserStore();
const { tackleCode } = useCode();

const proxy:any = getCurrentInstance()?.proxy;

const current = ref(1);

const props = withDefaults(defineProps<replyProps>(), {
    pageSize: 7,
});

//总数
const count = ref<number>(123);

//评论数据
const commentsData = ref();

//请求
type Request = {

    token?: string;
    pageSize: number;
    nowPage: number;
    count?: boolean;
}

const request: Request = {
    token: userStore.token,
    pageSize: props.pageSize,
    nowPage: 1,
}



const getCommentsData = (e:any) => {
    request.count = e;
    
    getCommentsApi(request).then((res:any) => {
        if (tackleCode(res.code)) {
  
            // 如果是请求总数的情况，才更新count值
            if (e === true && res.data.count !== undefined) {
                // 确保count是一个有效的正整数
                count.value = Math.max(0, res.data.count);
            }
            
            // 直接使用API返回的结果作为当前页数据
            if (res.data && res.data.result) {
                commentsData.value = res.data.result;
                // 如果没有返回总数，但需要显示分页
                if (e === true && (res.data.count === undefined || res.data.count < 0)) {
                    // 估算总数 = 当前页 * 每页大小 + 额外一页(如果当前页数据量等于页大小)
                    const estimatedTotal = (request.nowPage - 1) * request.pageSize + 
                                          res.data.result.length + 
                                          (res.data.result.length >= request.pageSize ? request.pageSize : 0);
                    count.value = Math.max(count.value, estimatedTotal);
                }
            } else {
                commentsData.value = [];
            }
        }
    }).catch(error => {
        console.error('获取评论失败:', error);
        commentsData.value = [];
    });
}

// 删除评论
const deleteComment = (id: number) => {
    // 调用删除评论API
    deleteCommentApi({
        token: userStore.token,
        id: id
    }).then((res: any) => {
        if (tackleCode(res.code)) {
            // 删除成功
            // 更新总评论数
            count.value--;
            
            // 重新计算当前页应该显示的数据
            const totalPages = Math.ceil(count.value / request.pageSize);
            
            // 如果当前页已经不存在（例如删除了最后一页的唯一条目）
            if (request.nowPage > totalPages && totalPages > 0) {
                request.nowPage = totalPages;
            }
            
            // 重新获取当前页数据
            getCommentsData(true);
            
            // 显示成功消息
            proxy.$message.success('删除成功');
        } else {
            // 删除失败
            proxy.$message.error('删除失败: ' + (res.message || '未知错误'));
        }
    }).catch(error => {
        console.error('删除评论出错:', error);
        proxy.$message.error('删除请求失败，请稍后重试');
    });
}

//已读评论
const markAsRead = (id: number) => {

    let request = {
        token: userStore.token,
        id: id,
    }
    readCommentApi(request).then((res:any) => {
        if (tackleCode(res.code)) {
            proxy.$message.success('已读成功');
        } else {
            proxy.$message.error('已读失败');
        }
    })
}

//翻页
const pageChange = (page: number) => { 

    current.value = page; // 确保current值更新
    request.nowPage = page;
    // 翻页时不需要重新获取总数
    getCommentsData(false);
}

onMounted(() => {
    getCommentsData(true);
})

</script>

<style scoped>
.comments {
    width: 100%;
    height: 900px;
    padding: 24px;
    border-radius: 8px;
    background-color: var(--background-topbar);
    transition: all 0.3s ease;
}

.comments-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 16px;
}

.comments-title-text {
    font-size: 18px;
    font-weight: 600;
    flex: 1;
    color: var(--text-color);
}

.comments-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.comments-content {
    height: 800px;
    overflow-y: auto;
}

.comments-content::-webkit-scrollbar {
    display: none;
}

.comments-pagination {
    padding: 32px 24px;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    border-top: 1px solid var(--gray-200);
}

/* 深色模式适配 */
[data-theme="dark"] .comments {
    background-color: var(--background-topbar);
    border-color: var(--gray-700);
}

[data-theme="dark"] .comments-pagination {
    border-top-color: var(--gray-700);
}

/* 分页器样式适配 */
:deep(.ant-pagination-item) {
    background-color: var(--background-topbar);
    border-color: var(--gray-300);
}

:deep(.ant-pagination-item a) {
    color: var(--text-color);
}

:deep(.ant-pagination-item-active) {
    background-color: var(--blue-600);
    border-color: var(--blue-600);
}

:deep(.ant-pagination-item-active a) {
    color: #fff;
}

:deep(.ant-pagination-prev .ant-pagination-item-link),
:deep(.ant-pagination-next .ant-pagination-item-link) {
    background-color: var(--background-topbar);
    border-color: var(--gray-300);
    color: var(--text-color);
}

/* 深色模式下的分页器样式 */
[data-theme="dark"] :deep(.ant-pagination-item) {
    background-color: var(--background-color);
    border-color: var(--gray-700);
}

[data-theme="dark"] :deep(.ant-pagination-prev .ant-pagination-item-link),
[data-theme="dark"] :deep(.ant-pagination-next .ant-pagination-item-link) {
    background-color: var(--background-color);
    border-color: var(--gray-700);
}


[data-theme="dark"] :deep(.ant-pagination-item-active) {
    background-color: var(--blue-600);
    border-color: var(--blue-600);
}

[data-theme="dark"] :deep(.ant-pagination-item:hover),
[data-theme="dark"] :deep(.ant-pagination-prev:hover .ant-pagination-item-link),
[data-theme="dark"] :deep(.ant-pagination-next:hover .ant-pagination-item-link) {
    border-color: var(--blue-400);
}

[data-theme="dark"] :deep(.ant-pagination-item:hover a),
[data-theme="dark"] :deep(.ant-pagination-prev:hover .ant-pagination-item-link),
[data-theme="dark"] :deep(.ant-pagination-next:hover .ant-pagination-item-link) {
    color: var(--blue-400);
}
</style>
