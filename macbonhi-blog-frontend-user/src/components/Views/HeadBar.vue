<template>
  <a-layout-header class="headbar">
    <!-- 左侧LOGO -->
    <div class="logo">
      <img src="https://cdn.acwing.com/media/user/profile/photo/86575_lg_94d33900ea.jpg" alt="logo" />
    </div>
    <!-- 中间导航 -->
    <nav class="nav">
      <a-menu
        mode="horizontal"
        :selectedKeys="[activeKey]"
        class="nav-menu"
        :style="{ background: 'transparent', borderBottom: 'none' }"
      >
        <a-menu-item v-for="item in navs" :key="item.key">
          <router-link :to="item.path" class="nav-link">{{ item.label }}</router-link>
        </a-menu-item>
      </a-menu>
    </nav>
    <!-- 右侧搜索和主题切换 -->
    <div class="right">
      <a-input-search
        v-model:value="search"
        placeholder="文章/图库/日记资源"
        style="width: 220px"
        @search="onSearch"
      />
      <a-switch
        v-model:checked="isDark"
        checked-children="🌙"
        un-checked-children="🌞"
        class="theme-switch"
        @change="toggleTheme"
      />
    </div>
  </a-layout-header>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useThemeStore } from '../../store/theme';

const route = useRoute();
const router = useRouter();
const themeStore = useThemeStore();

// 修改导航数据结构，添加 path 属性
const navs = [
  { key: 'index', label: '首页', path: '/index' },
  { key: 'article', label: '文章', path: '/article' },
  { key: 'diary', label: '随记', path: '/diary' },
  { key: 'gallery', label: '图库', path: '/gallery' },
  { key: 'files', label: '下载', path: '/files' },
  { key: 'about', label: '关于', path: '/about' },
];

// 根据当前路由路径自动设置活动菜单项
const activeKey = computed(() => {
  const path = route.path.split('/')[1] || 'index';
  return path;
});

const search = ref('');
const isDark = computed({
  get: () => themeStore.currentTheme === 'dark',
  set: (value) => {
    themeStore.setTheme(value ? 'dark' : 'light');
  }
});

function onSearch(value: string) {
  if (value.trim()) {
    // 跳转到搜索页面并传递搜索参数
    router.push({
      path: '/search',
      query: { keyword: value.trim() }
    });
  }
}

function toggleTheme(checked: boolean) {
  isDark.value = checked;
}

</script>

<style scoped>
.headbar {
  position: fixed;
  top: 0;
  left: 0;  
  width: 100%;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--background-color);
  padding: 0 32px;
  box-shadow: 0 2px 8px var(--gray-200);
  z-index: 100;
  transition: background-color 0.3s ease;
}
.logo img {
  height: 40px;
  width: 40px;
  border-radius: 50%;
}
.logo {
  width: 220px;
  display: flex;
  align-items: center;
}
.nav {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}
.nav-menu {
  border-bottom: none;
  background: transparent;
  display: flex;
  gap: 10px;
}
.nav-menu .ant-menu-item {
  font-size: 16px;
  margin: 0 16px;
  position: relative;
}

.nav-menu .ant-menu-item-selected {
  color: var(--blue-600) !important;
  font-weight: bold;
  border-bottom: 2px solid var(--blue-600) !important;
  background: transparent !important;
}

.nav-link {
  color: var(--text-color)!important;
  text-decoration: none;
  display: block;
  transition: color 0.3s ease;
}

.nav-link:hover {
  color: var(--blue-500);
}

.nav-menu .ant-menu-item-selected .nav-link {
  color: var(--blue-600);
}

/* 修改 router-link 样式 */
.nav-menu .ant-menu-item a {
  color: inherit;
  text-decoration: none;
  display: block;
}

.right {
  width: 250px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.theme-switch {
  margin-left: 8px;
}

/* 搜索框样式适配 */
:deep(.ant-input-search .ant-input) {
  background: var(--background-color);
  color: var(--text-color);
  border-color: var(--gray-300);
}

:deep(.ant-input-search .ant-input:hover),
:deep(.ant-input-search .ant-input:focus) {
  border-color: var(--blue-500);
}

:deep(.ant-input-search .ant-input::placeholder) {
  color: var(--gray-500);
}

@media (max-width: 768px) {
  .headbar {
    flex-direction: column;
    height: auto;
    padding: 0 8px;
  }
  .nav {
    justify-content: flex-start;
    width: 100%;
  }
  .right {
    width: 100%;
    justify-content: flex-end;
    margin-top: 8px;
  }
}
</style>
