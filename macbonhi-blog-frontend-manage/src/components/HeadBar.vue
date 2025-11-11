<template>
    <div class="header-container" :class="{ 'edit-page': isEditPage }">
        <!-- 导航区域 -->
        <div class="logo-section">
            <router-link to="/">
                <img src="../assets/Group 11.png" alt="Blog Logo" class="logo" />
            </router-link>
        </div>
        
        <!-- 搜索区域组件化 -->
        <SearchSection v-if="showSearch" />
        
        <!-- 分离用户信息区域 -->
        <UserProfileSection v-if="userStore.token" />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useUserStore } from '../store/user';
import { useRoute } from 'vue-router';
import { defineAsyncComponent } from 'vue';

// 优化前: 所有功能都在HeadBar组件内实现
// 优化后: 拆分为多个小组件，并使用异步加载

// 异步加载搜索组件
const SearchSection = defineAsyncComponent(() => 
    import('./sections/SearchSection.vue')
);

// 异步加载用户资料组件 - 只在用户登录后才需要
const UserProfileSection = defineAsyncComponent(() => 
    import('./sections/UserProfileSection.vue')
);

const userStore = useUserStore();
const route = useRoute();

// 根据路由决定是否显示搜索框
const showSearch = computed(() => {
    // 只在某些页面显示搜索功能
    return !['login', 'register', 'editArticle', 'editPhoto'].some(
        path => route.path.includes(path)
    );
});

// 判断是否为编辑页面
const isEditPage = computed(() => {
    return route.name === 'EditArticle' || route.name === 'EditPhoto';
});

// 监听编辑页面状态，动态添加/移除body class
watch(isEditPage, (newVal) => {
    if (newVal) {
        document.body.classList.add('edit-page');
    } else {
        document.body.classList.remove('edit-page');
    }
}, { immediate: true });

// 组件卸载时清理class
onUnmounted(() => {
    document.body.classList.remove('edit-page');
});
</script>

<style scoped>
.header-container {
    display: flex;
    align-items: center;
    padding: 0 20px;
    height: 64px;
    background-color: var(--primary-bg-color);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
}

/* 编辑页面时取消固定定位 */
.header-container.edit-page {
    position: static;
    box-shadow: none;
}

.logo-section {
    margin-right: 40px;
}

.logo {
    height: 40px;
}
</style>
