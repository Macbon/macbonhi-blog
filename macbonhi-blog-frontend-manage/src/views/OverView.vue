<template>
    
    <a-space direction="vertical" style="display: flex;
                                         justify-content: space-between;" 
                                         size="large">
        <top-title title="总览" :isSearch="false" />
        
        <gather />

        <!-- 管理数据视图页面,控制其左右布局 -->
        <!-- 使用flex布局进行调整antd的space出现问题只能进行组件间间距的调整不能进行规定组件的大小 -->
        <div style="width: 100%; display: flex; gap: 24px;">
            <dataview style="flex: 1;" />
            <comments style="flex: 1;" :pageSize="7" :height="'800px'" />
        </div>

    </a-space> 
       
</template>

<script setup lang="ts">

import TopTitle from '../components/TopTitle.vue';
import gather from '../components/overview/gather.vue';
import dataview from '../components/overview/dataview.vue';
import { comments } from '../components/comments/index';


</script>

<style scoped>

</style>
