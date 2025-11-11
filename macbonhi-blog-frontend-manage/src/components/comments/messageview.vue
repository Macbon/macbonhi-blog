<template>
    <div class="message-view" align="start" @click="handleClick" :class="{ 'animate-highlight': isClicked, 'unread-message': !isRead }">
        <!-- 头像栏 -->
        <a-avatar class="message-view-avatar" src="https://www.antdv.com/assets/logo.1ef800a8.svg" v-if="isComment"/>

        <!-- 评论栏 -->
        <div class="message-view-comment">
            <div class="message-header">
                <div class="user-name">{{content?.user_name}}</div>
                <div class="message-time">{{content?.moment ? momentl(content.moment) : ''}}</div>
            </div>

            <div class="message-content">
                {{content?.content}}
            </div>

            <div class="message-footer" v-if="isComment">
                <a-tag class="custom-tag" v-if="content?.article!.id! > -1">{{content?.article?.title}}</a-tag>
                <a-tag class="custom-tag" v-else>文章已被删除</a-tag>

                <a-typography-text type="danger" v-show="content?.complaint !> 0">
                    举报：{{content?.complaint}}
                </a-typography-text>
            </div>

            <div class="button-delete">
                <RestOutlined @click="deleteComment(props.content!.id)" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { commentsprops } from './reply';
import { momentl } from '../../utils/moment';
import { ref, onMounted } from 'vue';

const emits = defineEmits(['deleteComment', 'markAsRead']);

// 已读状态变量
const isRead = ref(false);
// 点击动画状态
const isClicked = ref(false);

const props = withDefaults(defineProps<commentsprops>(), {
    isComment: true,
});

// 初始化已读状态
onMounted(() => {
    // 根据后端数据判断是否已读
    // 假设后端数据中有isread字段，1表示已读，0表示未读
    isRead.value = props.content?.isread === 1;
});

// 处理点击事件
const handleClick = () => {
    if (!isRead.value) {
        isRead.value = true;
        // 向父组件发送已读状态更新
        emits('markAsRead', props.content?.id);
    }
    
    // 只有在未读变已读时才触发动画
    if (!isRead.value) {
        // 触发动画效果
        isClicked.value = true;
        setTimeout(() => {
            isClicked.value = false;
        }, 300); // 动画持续时间
    }
}

const deleteComment = (id: number) => {
    emits('deleteComment', id);
}
</script>

<style scoped>

.message-view {
    width: 100%;
    display: flex;
    gap: 16px;
}

.message-view-avatar{
    margin-top: 8px;
}

.message-view-comment {
    position: relative;
    border-bottom: 1px solid var(--gray-200);
    width: 100%;
    padding-bottom: 16px;
    gap: 8px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    transition: all 0.3s ease;
}

.message-header {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    margin-top: 8px;
}

.user-name {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-color);
}

.message-time {
    font-size: 12px;
    color: var(--gray-500);
}

.message-content {
    font-size: 16px;
    color: var(--text-color);
}

.message-footer {
    display: flex;
    align-items: center;
    gap: 4px;
}

.button-delete {
    position: absolute;
    right: 16px;
    top: 0;
    cursor: pointer;
    display: none;
    color: var(--gray-500);
    font-size: 16px;
    transition: color 0.3s ease;
}

.button-delete:hover {
    color: var(--red-600);
}

/* 鼠标悬停时显示删除按钮 */
.message-view-comment:hover .button-delete {
    display: block;
}

/* 深色模式适配 */
[data-theme="dark"] .message-view-comment {
    border-bottom-color: var(--gray-700);
}

[data-theme="dark"] .button-delete {
    color: var(--gray-400);
}

[data-theme="dark"] .button-delete:hover {
    color: var(--red-400);
}

/* 标签样式适配 */
:deep(.custom-tag) {
    background-color: var(--blue-100);
    border-color: var(--blue-200);
    color: var(--blue-600);
    font-weight: 500;
    font-size: 13px;
    transition: all 0.3s;
}

[data-theme="dark"] :deep(.custom-tag) {
    background-color: var(--blue-900);
    border-color: var(--blue-800);
    color: var(--blue-400);
}

/* 添加高亮动画效果 */
.animate-highlight {
    animation: highlight 0.3s ease;
}

@keyframes highlight {
    0% {
        background-color: transparent;
    }
    50% {
        background-color: var(--blue-100);
    }
    100% {
        background-color: transparent;
    }
}

/* 深色模式下的动画颜色 */
[data-theme="dark"] .animate-highlight {
    animation: highlight-dark 0.3s ease;
}

@keyframes highlight-dark {
    0% {
        background-color: transparent;
    }
    50% {
        background-color: var(--blue-900);
    }
    100% {
        background-color: transparent;
    }
}

/* 未读消息样式 */
.unread-message .message-view-comment {
    background-color: rgba(var(--blue-100-rgb, 237, 242, 247), 0.2);
    border-left: 4px solid var(--blue-500, #3182ce);
    padding-left: 12px;
    position: relative;
}

.unread-message .message-view-comment::before {
    content: '新';
    position: absolute;
    right: 10px;
    bottom: 10px;
    background-color: var(--blue-500, #3182ce);
    color: white;
    font-size: 12px;
    padding: 1px 5px;
    border-radius: 4px;
    font-weight: bold;
}

[data-theme="dark"] .unread-message .message-view-comment {
    background-color: rgba(var(--blue-900-rgb, 26, 54, 93), 0.2);
    border-left: 4px solid var(--blue-600, #2b6cb0);
}

[data-theme="dark"] .unread-message .message-view-comment::before {
    background-color: var(--blue-600, #2b6cb0);
}
</style>