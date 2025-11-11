<template>
    <div class="files-view">
        <!-- 分类导航 -->
        <div class="category-wrapper">
            <Subset @nowSubset="nowSelect" :classify="2" :isDownloadPage="true" />
        </div>
        
        <File :key="`file-${nowSubset}-${nowState}`" :state="nowState" :subsetId="nowSubset" :searchTerm="searchTerm" :pageSize="8" />
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import File from '../components/Files/file.vue';
import Subset from '../components/subset/subset.vue';


// 状态变量，与文章页面保持一致的结构
const nowState = ref(1); // 默认显示已发布文件
const nowSubset = ref(-1); // 默认不筛选分类
const searchTerm = ref(''); // 搜索词

// 分类切换处理
const nowSelect = (e: any) => {

    if (e.type == "state") {
        // 状态筛选：0=未发布，1=已发布
        nowState.value = e.id;
        nowSubset.value = -1;
    } else if (e.type == "all") {
        // 全部文件，不筛选状态和分类
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
.files-view {
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