<template>
    <div class="index-view">
        <!-- 侧边栏菜单 -->
        <Meaubar />
        <!-- 主内容区域 -->
        <router-view />
    </div>
</template>

<script setup lang="ts">
import Meaubar from '../components/Meaubar.vue'
</script >

<style scoped>
    .index-view{
        padding: 32px 32px 32px 232px;
    }
</style>