<template>
    
    <div style="display: flex; flex-direction: column; gap: 24px;">
        <TopTitle title="摄影图库" :isSearch="true" @search="search"/>
        <Subset :classify="1" @nowSubset="nowSelect"/>
        <gallery :state="nowState" :subsetId="nowSubset" :searchTerm="searchTerm"/>
        
    </div>

</template>

<script setup lang="ts">

import TopTitle from '../components/TopTitle.vue';
import Subset from '../components/classification/subset.vue';
import gallery from '../components/gallery/gallery.vue';
import { ref } from 'vue';

const nowState = ref(-1);
const nowSubset = ref(-1);

const emit = defineEmits(['nowSubset']);

const nowSelect = (e: any) => {

    if (e.type == "state") {
        // 数据库中：0=未发布，1=已发布
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
        nowSubset.value = e.id; 
    }
}

//搜索词
const searchTerm = ref<string>('');

const search = (e: any) => {
    searchTerm.value = e;
}

</script>

<style scoped>
.gallery-tip {
    color: var(--gray-500) !important;
    transition: color 0.3s;
}
[data-theme="dark"] .gallery-tip {
    color: var(--gray-300) !important;
}
</style>