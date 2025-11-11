<template>
     <a-drawer
        v-model:open="openvalue"
        class="private-message-drawer"
        root-class-name="root-class-name"
        :root-style="{ color: 'blue' }"
        style="color: red"
        :title="'私信:' + count"
        placement="right">
            <div class="comments-content">
                <messageview v-for="item in commentsData" :key="item.id" :content="item" :isComment="false" @deleteComment="deleteComment" @markAsRead="markAsRead" />
            </div>

            <div class="pagination-container">
                <a-pagination v-model:current="current" simple :total="count" @change="pageChange"/>
            </div>
    </a-drawer>
</template>

<script setup lang="ts">

import { computed, defineProps, defineEmits, onMounted, ref, getCurrentInstance} from 'vue';
import type { privatemessageProps } from './reply';
import messageview from './messageview.vue';
import { getMessageApi, readMessageApi, getUnreadMessageCountApi, deleteMessageApi } from '../../api/index';
import { useUserStore } from '../../store/user';
import { useCode } from '../../hooks/code';

const userStore = useUserStore();
const { tackleCode } = useCode();

const emit = defineEmits(['update:open', 'updateUnreadStatus']);

const props = withDefaults(defineProps<privatemessageProps>(), {
    open: false,
    pageSize: 4,
});

const openvalue = computed({
    //获取值
    get: () => props.open,
    //当值变化时，发送更新事件到父组件
    set: (val: boolean) => {
        emit('update:open', val);
    }
})


const proxy:any = getCurrentInstance()?.proxy;

const current = ref(1);

//总数
const count = ref<number>(123);

//评论数据
const commentsData = ref();

//请求
type Request = {
    token?: string;
    pageSize: number;
    nowPage: number;
    count?:boolean;
}

const request: Request = {
    pageSize: props.pageSize,
    nowPage: 1,
    token: userStore.token,
}


//获取mock数据
const getCommentsData = (e:boolean) => {

    request.count = e;

    getMessageApi(request).then((res:any) => {
        if (tackleCode(res.code)) {
            let data = res.data;

            // 确保count是有效的正整数
            if (data.count !== undefined) {
                count.value = Math.max(0, data.count);
            }
            
            // 直接使用API返回的结果作为当前页数据
            if (data && data.result) {
                commentsData.value = data.result;
                
                // 获取数据后检查是否有未读消息
                const hasUnread = commentsData.value.some((item: any) => item.isread === 0);
                emit('updateUnreadStatus', hasUnread);
                
                // 如果没有返回有效的count值，进行估算
                if (data.count === undefined || data.count < 0) {
                    // 估算总数 = 当前页 * 每页大小 + 额外一页(如果当前页数据量等于页大小)
                    const estimatedTotal = (request.nowPage - 1) * request.pageSize + 
                                           data.result.length + 
                                           (data.result.length >= request.pageSize ? request.pageSize : 0);
                    count.value = Math.max(count.value, estimatedTotal);
                }
            } else {
                commentsData.value = []; // 空数组，防止渲染错误
                emit('updateUnreadStatus', false);
            }
        }
    }).catch(error => {
        console.error('获取消息失败:', error);
        commentsData.value = [];
    });
}

// 删除评论
const deleteComment = (id: number) => {
    // 调用删除私信API
    deleteMessageApi({
        token: userStore.token,
        id: id
    }).then((res: any) => {
        if (tackleCode(res.code)) {
            // 删除成功
            // 更新总私信数
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
        console.error('删除私信出错:', error);
        proxy.$message.error('删除请求失败，请稍后重试');
    });
}

//翻页
const pageChange = (page: number) => { 

    request.nowPage = page;
    getCommentsData(false);
}

// 标记消息为已读
const markAsRead = (id: number) => {
  readMessageApi({
    token: userStore.token,
    id: id
  }).then((res: any) => {
    if (tackleCode(res.code)) {
      // 更新本地数据的已读状态
      if (commentsData.value) {
        const message = commentsData.value.find((item: any) => item.id === id);
        if (message) {
          message.isread = 1;
        }
      }
      
      // 重新检查是否还有未读消息（可选发送到HeadBar组件）
      checkHasUnreadMessages();
    }
  }).catch(error => {
    console.error('标记消息已读失败:', error);
  });
};

// 检查是否还有未读消息
const checkHasUnreadMessages = () => {
  // 检查当前页面是否有未读消息
  const hasUnread = commentsData.value && commentsData.value.some((item: any) => item.isread === 0);
  
  // 如果当前页没有未读消息，可能需要调用API检查其他页面
  if (!hasUnread) {
    getUnreadMessageCountApi({ token: userStore.token })
      .then((res: any) => {
        if (tackleCode(res.code)) {
          // 发送事件通知HeadBar更新红点状态
          const hasAnyUnread = res.data > 0;
          emit('updateUnreadStatus', hasAnyUnread);
        }
      })
      .catch((error: any) => {
        console.error('获取未读消息数量失败:', error);
      });
  }
};

onMounted(() => {
    getCommentsData(true);
})


</script>

<style scoped>
.private-message-drawer {
    :deep(.ant-drawer-header) {
        background-color: var(--background-topbar);
        border-bottom: 1px solid var(--gray-200);
    }

    :deep(.ant-drawer-title) {
        color: var(--text-color);
    }

    :deep(.ant-drawer-body) {
        background-color: var(--background-topbar);
        padding: 24px;
    }
}

.comments-content {
    overflow-y: auto;
    height: calc(100vh - 180px);
}

.comments-content::-webkit-scrollbar {
    display: none;
}

.pagination-container {
    position: absolute;
    bottom: 24px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    padding: 16px 0;
    background-color: var(--background-topbar);
    border-top: 1px solid var(--gray-200);
}

/* 深色模式适配 */
[data-theme="dark"] .private-message-drawer {
    :deep(.ant-drawer-header) {
        background-color: var(--background-topbar);
        border-bottom-color: var(--gray-700);
    }

    :deep(.ant-drawer-body) {
        background-color: var(--background-topbar);
    }
}

[data-theme="dark"] .pagination-container {
    background-color: var(--background-topbar);
    border-top-color: var(--gray-700);
}

/* 分页器样式适配 */
:deep(.ant-pagination-simple .ant-pagination-simple-pager) {
    color: var(--text-color);
}

:deep(.ant-pagination-simple .ant-pagination-simple-pager input) {
    background-color: var(--background-topbar);
    border-color: var(--gray-300);
    color: var(--text-color);
}

:deep(.ant-pagination-simple .ant-pagination-simple-pager input:hover) {
    border-color: var(--blue-600);
}

:deep(.ant-pagination-simple .ant-pagination-simple-pager input:focus) {
    border-color: var(--blue-600);
    box-shadow: 0 0 0 2px var(--blue-100);
}

:deep(.ant-pagination-prev .ant-pagination-item-link svg),
:deep(.ant-pagination-next .ant-pagination-item-link svg) {
    color: var(--text-color); /* 或你想要的颜色 */
    fill: var(--text-color);
    transition: color 0.3s;
}

/* 深色模式下的分页器样式 */
[data-theme="dark"] :deep(.ant-pagination-simple .ant-pagination-simple-pager input) {
    background-color: var(--gray-800);
    border-color: var(--gray-700);
}

[data-theme="dark"] :deep(.ant-pagination-simple .ant-pagination-simple-pager input:hover) {
    border-color: var(--blue-400);
}

[data-theme="dark"] :deep(.ant-pagination-simple .ant-pagination-simple-pager input:focus) {
    border-color: var(--blue-400);
    box-shadow: 0 0 0 2px var(--blue-900);
}

[data-theme="dark"] :deep(.ant-pagination-prev .ant-pagination-item-link svg),
[data-theme="dark"] :deep(.ant-pagination-next .ant-pagination-item-link svg) {
    color: var(--text-color); /* 深色下的主题色 */
    fill: var(--text-color);
}
[data-theme="dark"] :deep(.ant-pagination-prev .ant-pagination-item-link:hover svg),
[data-theme="dark"] :deep(.ant-pagination-next .ant-pagination-item-link:hover svg) {
    color: var(--blue-400); /* 悬停时高亮 */
    fill: var(--blue-400);
}


</style>
