<template>
    <div class="article-view">
        <!-- 分类导航 -->
        <div class="category-wrapper">
            <Subset @nowSubset="nowSelect" :classify="1" />
        </div>
        
        <Gallery :state="nowState" :subsetId="nowSubset" :searchTerm="searchTerm" />
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Gallery from '../components/Gallery/Gallery.vue';
import Subset from '../components/subset/subset.vue';


// 状态变量，与管理端保持一致
const nowState = ref(1); // 默认显示已发布文章
const nowSubset = ref(-1); // 默认不筛选分类
const searchTerm = ref(''); // 搜索词

// 分类切换处理
const nowSelect = (e: any) => {
    if (e.type == "state") {
        // 状态筛选：0=未发布，1=已发布
        nowState.value = e.id;
        nowSubset.value = -1;
    } else if (e.type == "all") {
        // 全部文章，不筛选状态和分类
        nowState.value = 1; // 用户端只显示已发布
        nowSubset.value = -1;
    } else if (e.type == "subset") {
        // 按分类筛选
        nowState.value = 1; // 用户端只显示已发布
        nowSubset.value = e.id;
    }
};
</script>

<style scoped>
.article-view {
    width: 100%;
    padding-top: 112px; /* 80px + 32px = 112px, 假设headbar高度为80px */
    min-height: 100vh;
    background-color: var(--background-color);
}

.category-wrapper {
    display: flex;
    justify-content: center;
    width: 100%;
    margin-bottom: 30px;
    overflow: visible;
    padding: 4px 0;
}
</style>