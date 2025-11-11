<template>
  <button @click="toggleTheme" class="theme-toggle-btn">
    <img 
      v-if="isDark" 
      src="../../assets/moon.svg" 
      alt="切换到浅色模式"
      class="theme-icon"
    />
    <img 
      v-else 
      src="../../assets/sun.svg" 
      alt="切换到深色模式"
      class="theme-icon"
    />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useThemeStore } from '../../store/theme'

const themeStore = useThemeStore()
const { currentTheme } = storeToRefs(themeStore)

const isDark = computed(() => currentTheme.value === 'dark')

// 使用 store 的方法
const toggleTheme = () => {
  themeStore.toggleTheme()
}
</script>

<style scoped>
.theme-toggle-btn {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 1px solid var(--background-topbar);
  background-color: var(--background-topbar);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.theme-toggle-btn:hover {
  background-color: var(--gray-100);
}

.theme-icon {
  width: 20px;
  height: 20px;
  filter: var(--icon-filter, none);
}

/* 深色模式下的图标颜色调整 */
[data-theme="dark"] .theme-icon {
  filter: brightness(0) invert(1);
}
</style>