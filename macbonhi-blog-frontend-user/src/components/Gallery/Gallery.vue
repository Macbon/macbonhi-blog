<template>
  <div class="article-container">
    <!-- 文章列表 -->
    <div class="article-list" v-if="articleList.length > 0">
      <div v-for="item in articleList" :key="item.id" class="article-item-wrapper">
        <!-- 添加调试输出，查看item的第一个元素的结构 -->
        <div v-if="item.id === articleList[0].id" style="display: none;">
          {{ logItemStructure(item) }}
        </div>
        <GalleryItem :data="item" @click="showArticleDetail(item)" />
      </div>
    </div>
    
    <!-- 空状态显示 -->
    <div class="empty-state" v-else>
      <div class="empty-state-content">
        <div class="empty-icon">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 8C13.7909 8 12 9.79086 12 12V52C12 54.2091 13.7909 56 16 56H48C50.2091 56 52 54.2091 52 52V20L40 8H16Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M40 8V20H52" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M28 32H36" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M28 40H44" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M28 48H44" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h3 class="empty-title">{{ getEmptyTitle() }}</h3>
        <p class="empty-description">{{ getEmptyDescription() }}</p>
      </div>
    </div>
    
    <!-- 加载更多按钮 -->
    <div class="load-more" v-if="articleList.length > 0">
      <a-button 
        :loading="loading" 
        @click="loadMore" 
        v-if="hasMore"
        type="primary"
        ghost
      >
        加载更多
      </a-button>
      <span v-else class="no-more">已加载全部内容</span>
    </div>

    <!-- 文章详情抽屉 -->
    <a-drawer
      height="95vh"
      placement="bottom"
      :closable="true"
      :open="drawerVisible"
      @close="closeDrawer"
      :footer="null"
      :headerStyle="{ display: 'none' }"
      :bodyStyle="{ padding: '24px', borderRadius: '16px 16px 0 0' }"
    >
      <ArticleContent v-if="currentArticle" :articleData="currentArticle" />
    </a-drawer>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed, reactive, watch } from 'vue';
import GalleryItem from './Galleryitem.vue';
import ArticleContent from '../ArticleGalleryContent/content.vue';
import { useArticle } from '../../hooks/useArticle';
import { useUserStore } from '../../store/user';
import { useLabelStore } from '../../store/label';
import { getLabelApi, updateArticleViewsApi } from '../../api/index';
import type { ArticalData as BaseArticalData } from '../../utils/typeof';

// 扩展ArticalData类型以包含content属性
interface ArticalData extends BaseArticalData {
  content?: string;
}

// 抽屉控制状态
const drawerVisible = ref<boolean>(false);
const currentArticle = ref<ArticalData | null>(null);

// 调试函数，输出item结构
const logItemStructure = (item: any) => {
  return item;
};

// 显示文章详情
const showArticleDetail = async (article: ArticalData) => {
  try {
    // 更新浏览量
    await updateArticleViewsApi({ articleId: article.id });
    
    // 本地更新浏览量显示
    article.views = (article.views || 0) + 1;
  } catch (error) {
    console.error('更新图库浏览量失败:', error);
  }

  // 处理文章内容，如果content是JSON字符串，尝试解析并格式化为HTML
  try {
    if (article.content && typeof article.content === 'string') {
      // 尝试解析JSON，如果是图片数组，就转为HTML格式
      const contentArray = JSON.parse(article.content);
      if (Array.isArray(contentArray)) {
        // 创建样式更美观的图片HTML
        const imagesHtml = contentArray.map(img => 
          `<div class="gallery-image-container">
            <img src="${img.url}" alt="${img.title || '图片'}" class="gallery-image" />
          </div>`
        ).join('');
        
        // 创建一个新的article对象，避免修改原始对象
        const processedArticle = {...article};
        // 替换content为HTML字符串
        processedArticle.content = imagesHtml;
        currentArticle.value = processedArticle;
      } else {
        // 如果不是数组，直接使用原始内容
        currentArticle.value = article;
      }
    } else {
      // 如果没有content属性或不是字符串类型，直接使用原始对象
      currentArticle.value = article;
    }
  } catch (error) {
    console.error('解析文章内容失败:', error);
    // 解析失败时仍然显示原始内容
    currentArticle.value = article;
  }
  
  // 显示抽屉
  drawerVisible.value = true;
};

// 关闭抽屉
const closeDrawer = () => {
  drawerVisible.value = false;
  // 延迟清空当前文章，确保过渡效果完成
  setTimeout(() => {
    currentArticle.value = null;
  }, 300);
};

// 接收参数
const props = defineProps({
  state: {
    type: Number,
    default: 1, // 默认显示已发布
  },
  subsetId: {
    type: Number,
    default: -1, // 默认不筛选分类
  },
  searchTerm: {
    type: String,
    default: '',
  },
  pageSize: {
    type: Number,
    default: 9,
  }
});

// 使用store获取token
const userStore = useUserStore();

// 使用文章API hook
const { articles: articleList, pagination, loading, fetchArticles } = useArticle();

// 使用标签数据的store
const labelStore = useLabelStore();

// 获取标签数据的函数
const fetchLabels = async () => {
  try {
    const request = {
      token: userStore.token
    };
    
    // 调用标签API
    const res = await getLabelApi(request);
    if (res && res.data && 'code' in res.data) {
      // 如果返回数据中包含code字段并且是成功状态码
      if (res.data.code === 200) {
        labelStore.data = res.data.data || [];
      }
    } else {
      // 直接尝试使用返回的数据
      labelStore.data = res.data || [];
    }
  } catch (error) {
    console.error('加载标签失败', error);
  }
};

// 分页相关 - 统一使用8条分页
const currentPage = ref(1);
const pageSize = 8; // 统一使用8条分页
const hasMore = computed(() => articleList.value.length < pagination.total);

// 请求参数接口
interface RequestParams {
  token: string;
  pageSize: number;
  nowPage: number;
  state: number;
  subsetId: number | null;
  count: boolean;
  classify: number;
  searchTerm: string;
}

// 请求参数
const requestParams = reactive<RequestParams>({
  token: userStore.token,
  pageSize: props.pageSize,
  nowPage: 1,
  state: props.state, // 只显示已发布的文章
  subsetId: props.subsetId,
  count: true, // 获取总数
  classify: 1, 
  searchTerm: props.searchTerm
});

// 重置文章列表
const resetArticles = () => {
  currentPage.value = 1;
  
  // 重置为初始参数
  requestParams.pageSize = pageSize;
  requestParams.nowPage = 1;

  // 清空当前列表
  articleList.value = [];
  
};

// 加载更多 - 简化逻辑
const loadMore = () => {
  // 简单递增页码
  currentPage.value++;
  requestParams.nowPage = currentPage.value;
  requestParams.pageSize = pageSize;
  
  
  loadArticles(true); 
};

// 获取文章数据
const loadArticles = async (append = false) => {
  console.log('📡 Gallery: 调用 fetchArticles...', requestParams, append);
  
  const params = {
    page: append ? currentPage.value + 1 : 1,
    pageSize: requestParams.pageSize || pageSize,
    categoryId: requestParams.subsetId,
    searchTerm: requestParams.searchTerm,
    reset: !append,
    forceRefresh: false,
    classify: 1 
  };
  
  await fetchArticles(params);
  
  if (append) {
    currentPage.value += 1;
  } else {
    currentPage.value = 1;
  }
};

// 获取空状态标题
const getEmptyTitle = () => {
  if (loading.value) {
    return '加载中...';
  }
  
  if (props.searchTerm) {
    return '未找到相关图库';
  }
  
  if (props.subsetId === 0) {
    return '暂无未分组图库';
  } else if (props.subsetId > 0) {
    return '该分组暂无图库';
  } else {
    return '暂无图库';
  }
};

// 获取空状态描述
const getEmptyDescription = () => {
  if (loading.value) {
    return '正在加载图库数据...';
  }
  
  if (props.searchTerm) {
    return `没有找到包含"${props.searchTerm}"的图库，请尝试其他关键词`;
  }
  
  if (props.subsetId === 0) {
    return '该分类下暂无图库';
  } else if (props.subsetId > 0) {
    return '该分类下暂无图库';
  } else {
    return '当前暂无图库';
  }
};

// 监听props变化，重新获取数据
watch(
  () => [props.subsetId, props.state, props.searchTerm],
  () => {     

    requestParams.subsetId = props.subsetId
    requestParams.state = props.state;
    requestParams.searchTerm = props.searchTerm;
    requestParams.nowPage = 1;
    currentPage.value = 1;

      resetArticles();
      // 重新获取数据
      loading.value = true;
          Promise.resolve(loadArticles(false)).finally(() => {
        loading.value = false;
    });
  },
  { deep: true }
);

// 在组件挂载时加载标签数据
onMounted(async () => {
  // 先加载标签数据
  await fetchLabels();
  // 再加载文章数据
  loading.value = true;
  await loadArticles(false); 
  loading.value = false;
});

</script>

<style scoped>
.article-container {
  width: 100%;
  padding: 20px 0;
  max-width: 1440px;
  margin: 0 auto;
}

.article-list {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  justify-content: center;
}

.article-item-wrapper {
  display: flex;
  justify-content: center;
  width: 100%;
}

/* 空状态样式 */
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  width: 100%;
  background: var(--background-color);
  border-radius: 8px;
  margin: 20px 0;
}

.empty-state-content {
  text-align: center;
  max-width: 400px;
  padding: 40px 20px;
}

.empty-icon {
  margin-bottom: 24px;
  color: var(--gray-400);
  display: flex;
  justify-content: center;
}

[data-theme="dark"] .empty-icon {
  color: var(--gray-500);
}

.empty-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 12px 0;
}

.empty-description {
  font-size: 14px;
  color: var(--gray-500);
  line-height: 1.5;
  margin: 0 0 32px 0;
}

[data-theme="dark"] .empty-description {
  color: var(--gray-400);
}

.load-more {
  margin-top: 56px;
  display: flex;
  justify-content: center;
}

.no-more {
  color: var(--gray-500);
  font-size: 14px;
}

/* 自定义加载更多按钮样式 */
:deep(.ant-btn),
:deep(.ant-btn-ghost) {
  width: 118px;
  height: 48px;
  background: #F4F2EC;
  border: 1px solid #0B1926;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0B1926;
  font-size: 14px;
  font-weight: 500;
}

:deep(.ant-btn:hover) {
  background: #E9E6DC;
  border-color: #0B1926;
  color: #0B1926;
}

/* 深色模式适配 */
[data-theme="dark"] :deep(.ant-btn),
[data-theme="dark"] :deep(.ant-btn-ghost) {
  background: #2A2D33;
  border: 1px solid #E5E5E5;
  color: #E5E5E5;
}

[data-theme="dark"] :deep(.ant-btn:hover) {
  background: #3A3D45;
  border-color: #E5E5E5;
  color: #E5E5E5;
}

/* 响应式布局调整 */
@media (max-width: 1200px) {
  .article-list {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 900px) {
  .article-list {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .article-list {
    grid-template-columns: 1fr;
  }
}

/* 抽屉样式覆盖 */
:deep(.ant-drawer-content) {
  border-radius: 16px 16px 0 0;
  overflow: hidden;
}

:deep(.ant-drawer-body) {
  padding: 24px;
  max-height: 90vh;
  overflow-y: auto;
}

/* 抽屉内图片画廊样式 */
.gallery-image-container {
  margin: 20px 0;
  text-align: center;
}

.gallery-image {
  max-width: 100%;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.gallery-image:hover {
  transform: scale(1.02);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.image-caption {
  margin-top: 8px;
  font-size: 14px;
  color: var(--gray-600);
  max-width: 90%;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.4;
}

[data-theme="dark"] .image-caption {
  color: var(--gray-400);
}

[data-theme="dark"] .gallery-image {
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.08);
}

[data-theme="dark"] .gallery-image:hover {
  box-shadow: 0 8px 16px rgba(255, 255, 255, 0.15);
}
</style>