
<template>
  <div class="search-section">
    <a-input-search
      v-model:value="searchText"
      placeholder="搜索文章..."
      @search="onSearch"
      :loading="loading"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const searchText = ref('');
const loading = ref(false);

const onSearch = (value: string) => {
  if (!value.trim()) return;
  
  loading.value = true;
  
  // 跳转到搜索结果页面 - 使用命名路由避免base路径问题
  router.push({
    name: 'ArticleView',
    query: { search: value.trim() }
  }).finally(() => {
    loading.value = false;
  });
};
</script>

<style scoped>
.search-section {
  flex: 1;
  max-width: 400px;
  margin: 0 20px;
}
</style>