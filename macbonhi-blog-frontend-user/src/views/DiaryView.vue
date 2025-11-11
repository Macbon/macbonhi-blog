<template>
    <div class="diary-view">
        <div class="diary-content">
            <!-- 左侧日记列表 -->
            <div class="diary-list-container">
                <div class="diary-list-wrapper">
                    <Diary :pageSize="4" :searchTerm="searchTerm" @select-diary="selectDiary"/>
                </div>
                
                <!-- 评论组件 -->
                <div class="diary-comments" v-if="currentDiary && currentDiary.id">
                    <div class="comments-wrapper">
                        <Comment 
                            :target-id="Number(currentDiary.id)" 
                            :target-type="3"
                        />
                    </div>
                </div>
            </div>
            
            <!-- 右侧日记详情 -->
            <div class="diary-detail-container">
                <DiaryDetail :data="currentDiary" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Diary from '../components/Diary/diary.vue';
import DiaryDetail from '../components/Diary/diaryDetail.vue';
import Comment from '../components/comment/comment.vue';
import type { DiaryData } from '../utils/typeof';

const searchTerm = ref(''); // 搜索词
const currentDiary = ref<DiaryData | null>(null);

// 选择日记显示详情
const selectDiary = (diary: DiaryData) => {
    currentDiary.value = diary;
};
</script>

<style scoped>
.diary-view {
    width: 100%;
    padding-top: 112px;
    min-height: 100vh;
    background-color: var(--background-color);
    overflow-y: auto; /* 允许整体页面滚动 */
}

.diary-content {
    display: flex;
    gap: 48px;
    max-width: 100%;
    padding-bottom: 50px;
    min-height: calc(100vh - 112px - 50px); /* 最小高度为视窗高度 */
    height: auto; /* 允许内容增长超出视窗高度 */
}

.diary-list-container {
    width: 35%;
    padding-left: 24px;
    padding-top: 40px;
    display: flex;
    flex-direction: column;
    min-height: 800px; /* 设置最小高度 */
    height: auto; /* 允许内容增长 */
}

.diary-list-wrapper {
    height: auto; /* 改为自适应高度 */
    min-height: 650px; /* 设置最小高度，确保能容纳4个日记项目 */
    overflow-y: auto; /* 保留滚动能力，但高度足够不需要立即滚动 */
    padding-right: 16px;
}

.diary-detail-container {
    width: 65%;
    min-height: 650px; /* 调整最小高度与日记列表一致 */
    background-color: var(--background-color);
    border-radius: 24px;
    display: flex;
    flex-direction: column;
}

/* 评论部分样式 */
.diary-comments {
    min-height: 350px; /* 减小最小高度 */
    display: flex;
    flex-direction: column;
    margin-top: 10px; /* 减小顶部间距 */

}

.comments-title {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 10px; /* 减小标题底部间距 */
    color: var(--text-color);
}

.comments-wrapper {
    flex: 1;
    overflow-y: auto; /* 独立滚动 */
    padding-right: 16px;
}

/* 深色模式适配 */
[data-theme="dark"] .comments-title {
    color: var(--gray-200);
}

/* 滚动条样式 */
.diary-list-wrapper::-webkit-scrollbar,
.comments-wrapper::-webkit-scrollbar {
    width: 4px;
}

.diary-list-wrapper::-webkit-scrollbar-thumb,
.comments-wrapper::-webkit-scrollbar-thumb {
    background-color: var(--gray-300);
    border-radius: 4px;
}

.diary-list-wrapper::-webkit-scrollbar-track,
.comments-wrapper::-webkit-scrollbar-track {
    background-color: var(--gray-100);
    border-radius: 4px;
}

@media (max-width: 1200px) {
    .diary-content {
        flex-direction: column;
        height: auto;
    }
    
    .diary-list-container {
        width: 100%;
        padding-left: 24px;
        padding-right: 24px;
        height: auto;
        min-height: auto;
    }
    
    .diary-list-wrapper {
        height: auto;
        min-height: 650px;
    }
    
    .diary-detail-container {
        width: calc(100% - 48px);
        margin: 0 24px;
        height: auto;
        min-height: 600px;
    }
    
    .diary-comments {
        height: auto;
        min-height: 350px; /* 调整响应式下的最小高度 */
    }
}
</style>