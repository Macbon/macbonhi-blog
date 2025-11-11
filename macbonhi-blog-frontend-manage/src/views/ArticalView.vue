<template>
    
    <div style="display: flex; flex-direction: column; gap: 24px;">
        <TopTitle title="文章页面" :isSearch="true" @search="search" />
        <Subset :classify="0" @nowSubset="nowSelect" v-show="query"/>
        <Article :state="nowState" :subsetId="nowSubset" :searchTerm="searchTerm"/>
        
    </div>
</template>

<script setup lang="ts">
import TopTitle from '../components/TopTitle.vue';
import Subset from '../components/classification/subset.vue';
import Article from '../components/articles/article.vue';
import { ref } from 'vue';

const nowState = ref(-1);
const nowSubset = ref(-1);

const emit = defineEmits(['nowSubset']);

const nowSelect = (e: any) => {

    if (e.type == "state") {
        // 如果数据库中：0=未发布，1=已发布
        // 但显示顺序反了，可能需要调整这里的逻辑
        nowState.value = e.id;
        nowSubset.value = -1;
        
    } else if (e.type == "all") {
        nowState.value = -1;
        nowSubset.value = -1;
        
    } else if (e.type == "subset") {
        nowState.value = -1;
        nowSubset.value = e.id;
        
    } else if (e.type == "exclude") {
        nowState.value = -1;
        // e.id 应该是所有已存在分组的ID字符串，如 "1,2,3,4"
        nowSubset.value = e.id; // 这个会作为string类型传递给后端
    }
}

//搜索词
const searchTerm = ref<string>('');
const query = ref<boolean>(true);

const search = (e: any) => {
    searchTerm.value = e;
    if (e) {
        query.value = false;
    } else {
        query.value = true;
    }
}

</script>

<style scoped>
</style>