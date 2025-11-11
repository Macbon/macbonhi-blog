<template>
  <div class="search-page">
    <!-- 顶部简化导航栏 -->
    <div class="simple-header">
      <div class="header-top">
        <div class="left-section">
          <div class="logo">
            <router-link to="/">
              <img src="https://cdn.acwing.com/media/user/profile/photo/86575_lg_94d33900ea.jpg" alt="logo" />
            </router-link>
          </div>
        </div>
        
        <div class="center-section">
          <div class="search-box">
            <a-input-search
              v-model:value="searchKeyword"
              placeholder="搜索文章、图库、日记和资源..."
              :loading="loading"
              enter-button
              @search="handleSearch"
            />
          </div>
        </div>
        
        <div class="right-section">
          <div class="theme-switch">
            <a-switch
              v-model:checked="isDark"
              checked-children="🌙"
              un-checked-children="🌞"
              @change="toggleTheme"
            />
          </div>
        </div>
      </div>

      <!-- 简化导航菜单 -->
      <nav class="simple-nav">
        <a-menu
          mode="horizontal"
          :selectedKeys="[activeTab]"
          class="nav-menu"
          :style="{ background: 'transparent', borderBottom: 'none' }"
          @select="handleNavSelect"
        >
          <a-menu-item key="articles">
            <span class="nav-link">文章</span>
          </a-menu-item>
          <a-menu-item key="gallery">
            <span class="nav-link">图库</span>
          </a-menu-item>
          <a-menu-item key="diary">
            <span class="nav-link">随记</span>
          </a-menu-item>
          <a-menu-item key="resources">
            <span class="nav-link">资源</span>
          </a-menu-item>
        </a-menu>
      </nav>
    </div>

    <div class="search-container">
      <!-- 搜索结果展示 -->
      <div class="search-results" v-if="hasResults">
        <!-- 文章结果 -->
        <template v-if="activeTab === 'articles'">
          <div class="result-list">
            <div class="section-title">
              <h2>文章搜索结果</h2>
              <div class="result-count">找到 {{ articleCount }} 个结果</div>
            </div>
            <div class="article-grid">
              <articleitem 
                v-for="item in currentPageData" 
                :key="item.id" 
                :data="item"
                @click="showArticleDetail(item)"
              />
            </div>
                        
            <!-- 添加调试输出 -->
            <div v-if="currentPageData.length > 0" style="display: none;">
              标签库数据: {{ JSON.stringify(labelStore.data) }}
              当前文章标签: {{ JSON.stringify(getArticleLabelIds(currentPageData[0].label)) }}
            </div>
            
            <!-- 分页控件 -->
            <a-pagination
              v-if="articleCount > pageSize"
              v-model:current="currentPage"
              :total="articleCount"
              :pageSize="pageSize"
              @change="handlePageChange"
              show-size-changer
              :pageSizeOptions="['9', '18', '27', '36']"
              @showSizeChange="onShowSizeChange"
            />
          </div>
        </template>
        
        <!-- 图库结果 -->
        <template v-else-if="activeTab === 'gallery'">
          <div class="result-list">
            <div class="section-title">
              <h2>图库搜索结果</h2>
              <div class="result-count">找到 {{ galleryCount }} 个结果</div>
            </div>
            <div class="gallery-grid">
              <Galleryitem 
                v-for="item in currentPageData" 
                :key="item.id" 
                :data="item"
                @click="showGalleryDetail(item)"
              />
            </div>
            
            <!-- 分页控件 -->
            <a-pagination
              v-if="galleryCount > pageSize"
              v-model:current="currentPage"
              :total="galleryCount"
              :pageSize="pageSize"
              @change="handlePageChange"
              show-size-changer
              :pageSizeOptions="['9', '18', '27', '36']"
              @showSizeChange="onShowSizeChange"
            />
          </div>
        </template>
        
        <!-- 日记结果 -->
        <template v-else-if="activeTab === 'diary'">
          <div class="result-list">
            <div class="section-title">
              <h2>日记搜索结果</h2>
              <div class="result-count">找到 {{ diaryCount }} 个结果</div>
            </div>
            <div class="diary-list">
              <diaryitem 
                v-for="item in currentPageData" 
                :key="item.id" 
                :data="item"
              />
            </div>
            
            <!-- 分页控件 -->
            <a-pagination
              v-if="diaryCount > pageSize"
              v-model:current="currentPage"
              :total="diaryCount"
              :pageSize="pageSize"
              @change="handlePageChange"
              show-size-changer
              :pageSizeOptions="['3', '6', '9', '12']"
              @showSizeChange="onShowSizeChange"
            />
          </div>
        </template>
        
        <!-- 资源结果 -->
        <template v-else-if="activeTab === 'resources'">
          <div class="result-list">
            <div class="section-title">
              <h2>资源搜索结果</h2>
              <div class="result-count">找到 {{ resourceCount }} 个结果</div>
            </div>
            <div class="resource-grid">
              <fileitem 
                v-for="item in currentPageData" 
                :key="item.id" 
                :data="item"
              />
            </div>
            
            <!-- 分页控件 -->
            <a-pagination
              v-if="resourceCount > pageSize"
              v-model:current="currentPage"
              :total="resourceCount"
              :pageSize="pageSize"
              @change="handlePageChange"
              show-size-changer
              :pageSizeOptions="['8', '16', '24', '32']"
              @showSizeChange="onShowSizeChange"
            />
          </div>
        </template>
        
        <!-- 空状态 -->
        <div class="empty-state" v-else-if="hasSearched && !loading">
          <div class="empty-state-content">
            <div class="empty-icon">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M29.3333 48C39.6971 48 48 39.6971 48 29.3333C48 18.9695 39.6971 10.6667 29.3333 10.6667C18.9695 10.6667 10.6667 18.9695 10.6667 29.3333C10.6667 39.6971 18.9695 48 29.3333 48Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M53.3333 53.3333L42.6667 42.6667" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <h3 class="empty-title">未找到相关内容</h3>
            <p class="empty-description">没有找到与"{{ searchKeyword }}"相关的内容，请尝试其他关键词</p>
          </div>
        </div>
        
        <!-- 初始状态 -->
        <div class="initial-state" v-else-if="!hasSearched && !loading">
          <div class="initial-state-content">
            <div class="initial-icon">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M29.3333 48C39.6971 48 48 39.6971 48 29.3333C48 18.9695 39.6971 10.6667 29.3333 10.6667C18.9695 10.6667 10.6667 18.9695 10.6667 29.3333C10.6667 39.6971 18.9695 48 29.3333 48Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M53.3333 53.3333L42.6667 42.6667" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <h3 class="initial-title">搜索内容</h3>
            <p class="initial-description">在上方搜索框输入关键词，查找文章、图库、日记或资源</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 文章详情抽屉 -->
    <a-drawer
      :open="articleDrawerVisible"
      height="95vh"
      placement="bottom"
      :closable="true"
      @close="closeArticleDrawer"
      :destroyOnClose="true"
      :footer="null"
      :headerStyle="{ display: 'none' }"
      :bodyStyle="{ padding: '24px', borderRadius: '16px 16px 0 0' }"
    >
      <a-spin :spinning="articleLoading">
        <ArticleGalleryContent v-if="selectedArticle" :articleData="selectedArticle" />
      </a-spin>
    </a-drawer>
    
    <!-- 图库详情抽屉 -->
    <a-drawer
      :open="galleryDrawerVisible"
      height="95vh"
      placement="bottom"
      :closable="true"
      @close="closeGalleryDrawer"
      :destroyOnClose="true"
      :footer="null"
      :headerStyle="{ display: 'none' }"
      :bodyStyle="{ padding: '24px', borderRadius: '16px 16px 0 0' }"
    >
      <a-spin :spinning="galleryLoading">
        <ArticleGalleryContent v-if="selectedGallery" :articleData="selectedGallery" />
      </a-spin>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { searchApi, getArticleDetailApi, updateArticleViewsApi, getLabelApi, getSubsetApi } from '../api';
import { useThemeStore } from '../store/theme';
import { useLabelStore } from '../store/label';
import { useSubsetStore } from '../store/subset';

// 导入各种item组件
import articleitem from '../components/Article/articleitem.vue';
import Galleryitem from '../components/Gallery/Galleryitem.vue';
import diaryitem from '../components/Diary/diaryitem.vue';
import fileitem from '../components/Files/fileitem.vue';
import ArticleGalleryContent from '../components/ArticleGalleryContent/content.vue';

// 定义响应数据类型
interface SearchResult {
  code: number;
  message: string;
  data: {
    articles: any[];
    galleries: any[];
    diaries: any[];
    resources: any[];
    articleCount: number;
    galleryCount: number;
    diaryCount: number;
    resourceCount: number;
  };
}

const route = useRoute();
const router = useRouter();
const themeStore = useThemeStore();
const labelStore = useLabelStore();
const subsetStore = useSubsetStore();

// 当前选中的标签页，默认为文章
const activeTab = ref('articles');

// 主题切换
const isDark = computed({
  get: () => themeStore.currentTheme === 'dark',
  set: (value) => {
    themeStore.setTheme(value ? 'dark' : 'light');
  }
});

function toggleTheme(checked: boolean) {
  isDark.value = checked;
}

// 搜索相关
const searchKeyword = ref(''); // 搜索关键词
const loading = ref(false); // 加载状态
const hasSearched = ref(false); // 是否已执行过搜索
const showAllResults = ref(false); // 是否显示所有结果

// 分页相关
const currentPage = ref(1);
const pageSize = ref(9); // 默认页大小设为9（文章类型的默认值）

// 搜索结果数据
const articles = ref<any[]>([]);
const galleries = ref<any[]>([]);
const diaries = ref<any[]>([]);
const resources = ref<any[]>([]);

// 计数
const articleCount = ref(0);
const galleryCount = ref(0);
const diaryCount = ref(0);
const resourceCount = ref(0);

// 计算总数
const totalCount = computed(() => {
  return articleCount.value + galleryCount.value + diaryCount.value + resourceCount.value;
});

// 是否有结果
const hasResults = computed(() => {
  return totalCount.value > 0;
});

// 当前标签页的页大小
const currentPageSize = computed(() => {
  switch (activeTab.value) {
    case 'articles': return 9;  // 文章 pageSize=9
    case 'gallery': return 9;   // 图库 pageSize=9，修改为9
    case 'diary': return 3;     // 日记 pageSize=3
    case 'resources': return 8; // 资源 pageSize=8
    default: return 9;
  }
});

// 更新当前页大小
watch(activeTab, (newValue) => {
  pageSize.value = currentPageSize.value;
});

// 当前标签页的总数
const currentTabTotalCount = computed(() => {
  switch (activeTab.value) {
    case 'articles': return articleCount.value;
    case 'gallery': return galleryCount.value;
    case 'diary': return diaryCount.value;
    case 'resources': return resourceCount.value;
    default: return totalCount.value;
  }
});

// 总页数
const totalPages = computed(() => {
  return Math.ceil(currentTabTotalCount.value / pageSize.value);
});

// 当前页数据
const currentPageData = computed(() => {
  let startIndex = (currentPage.value - 1) * pageSize.value;
  let endIndex = startIndex + pageSize.value;
  
  switch (activeTab.value) {
    case 'articles': return articles.value.slice(startIndex, endIndex);
    case 'gallery': return galleries.value.slice(startIndex, endIndex);
    case 'diary': return diaries.value.slice(startIndex, endIndex);
    case 'resources': return resources.value.slice(startIndex, endIndex);
    default: return [];
  }
});

// 获取标签数据的函数
const fetchLabels = async () => {
  try {

    
    // 如果已经有备用标签数据，不再重复加载
    if (labelStore.isInitialized) {

      return;
    }
    
    // 调用标签API
    const res = await getLabelApi({});
    
    if (res && res.data && Array.isArray(res.data)) {
      labelStore.data = res.data;

      labelStore.isInitialized = true;
    } else if (res && res.data && typeof res.data === 'object' && 'code' in res.data && res.data.code === 200) {
      labelStore.data = res.data.data || [];

      labelStore.isInitialized = true;
    } else {
      console.error('标签数据格式不符合预期:', res);
      // 使用备用标签数据
      labelStore.initializeBackupLabels();
    }
  } catch (error) {
    console.error('加载标签失败', error);
    // 加载失败时使用备用标签数据
    labelStore.initializeBackupLabels();
  }
};

// 获取分类数据的函数
const fetchSubsets = async () => {
  try {

    // 调用分类API
    const res = await getSubsetApi({}) as any;
    if (res && res.code === 200) {
      subsetStore.data = res.data || [];

    }
  } catch (error) {
    console.error('加载分类失败', error);
  }
};

// 处理搜索
const handleSearch = async (value: string) => {
  if (!value.trim()) {
    message.warning('请输入搜索关键词');
    return;
  }
  
  searchKeyword.value = value.trim();
  hasSearched.value = true;
  currentPage.value = 1;
  
  // 更新URL，方便分享搜索结果
  router.push({
    path: '/search',
    query: { 
      keyword: searchKeyword.value,
      type: activeTab.value
    }
  });
  
  // 先确保标签数据已加载
  if (labelStore.data.length === 0) {
    await fetchLabels();
  }
  
  await fetchSearchResults();
};

// 处理分页切换
const handlePageChange = (page: number) => {
  currentPage.value = page;
};

// 处理每页显示数量变化
const onShowSizeChange = (current: number, size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
};

// 获取搜索结果
const fetchSearchResults = async () => {
  if (!searchKeyword.value) return;
  
  loading.value = true;
  
  try {
    // 确保标签和分类数据已加载
    if (labelStore.data.length === 0) {

      await fetchLabels();
    }
    
    if (subsetStore.data.length === 0) {

      await fetchSubsets();
    }
    
    // 调用搜索API
    const result = await searchApi({
      keyword: searchKeyword.value,
      type: activeTab.value
    }) as any; // 使用any类型暂时避开类型检查
    
    // 成功响应处理
    if (result && result.code === 200) {
      articles.value = result.data?.articles || [];
      galleries.value = result.data?.galleries || [];
      diaries.value = result.data?.diaries || [];
      resources.value = result.data?.resources || [];
      
      
      // 处理文章数据，确保每个文章项都包含标签和分类信息
      articles.value = articles.value.map(article => {
        // 确保文章有标签字段
        if (!article.label && article.labels) {
          article.label = article.labels; // 兼容不同的API返回格式
        }
        
        // 如果还是没有标签，则设为空字符串防止报错
        if (!article.label) {
          article.label = '';
        }
        
        // 确保文章有分类ID
        if (!article.subset_id && article.subsetId) {
          article.subset_id = article.subsetId;
        } else if (!article.subset_id && article.category_id) {
          article.subset_id = article.category_id;
        }
        
        // 获取并展示标签名称
        const labelIds = getArticleLabelIds(article.label);

        if (labelIds.length > 0) {
          // 测试标签名称是否能正确获取
          const labelNames = labelIds.map(id => {
            const name = getLabelName(id);

            return name;
          });

        }
        
        return article;
      });
      
      
      articleCount.value = result.data?.articleCount || 0;
      galleryCount.value = result.data?.galleryCount || 0;
      diaryCount.value = result.data?.diaryCount || 0;
      resourceCount.value = result.data?.resourceCount || 0;
    } else {
      message.error(result?.message || '搜索失败，请稍后重试');
    }
  } catch (error) {
    console.error('搜索失败:', error);
    message.error('网络错误，请检查连接后重试');
  } finally {
    loading.value = false;
  }
};

// 从URL获取搜索参数
const getSearchParamsFromUrl = () => {
  const keyword = route.query.keyword as string;
  const type = route.query.type as string;
  
  if (keyword) {
    searchKeyword.value = keyword;
    hasSearched.value = true;
    
    if (type && ['articles', 'gallery', 'diary', 'resources'].includes(type)) {
      activeTab.value = type;
      pageSize.value = currentPageSize.value;
    } else {
      // 如果没有有效的type参数，默认使用文章
      activeTab.value = 'articles';
      pageSize.value = currentPageSize.value;
    }
  }
};

// 监听路由变化
watch(
  () => route.query,
  () => {
    getSearchParamsFromUrl();
    if (searchKeyword.value) {
      fetchSearchResults();
    }
  },
  { deep: true }
);

// 组件挂载时
onMounted(async () => {
  try {
    // 先加载标签和分类数据
    await Promise.all([fetchLabels(), fetchSubsets()]);
    
    getSearchParamsFromUrl();
    if (searchKeyword.value) {
      fetchSearchResults();
    }
  } catch (error) {
    console.error('组件初始化失败:', error);
    // 确保即使初始化失败也能使用备用标签数据
    labelStore.initializeBackupLabels();
  }
});

// 处理导航菜单选择
const handleNavSelect = ({ key }: { key: string }) => {
  if (key === activeTab.value) return;
  
  activeTab.value = key;
  currentPage.value = 1;
  pageSize.value = currentPageSize.value;
  
  // 更新URL
  router.push({
    path: '/search',
    query: { 
      keyword: searchKeyword.value,
      type: key === 'all' ? undefined : key
    }
  });
  
  // 重新获取搜索结果
  if (searchKeyword.value) {
    fetchSearchResults();
  }
};

// 文章详情抽屉相关
const articleDrawerVisible = ref(false);
const selectedArticle = ref<any>(null);
const articleLoading = ref(false);

// 判断内容是否为图库类型
const isGalleryContent = (content: string): boolean => {
  try {
    const parsed = JSON.parse(content);
    // 如果是数组且每个元素都有url属性，则认为是图库
    return Array.isArray(parsed) && parsed.length > 0 && parsed.every((item: any) => item.url);
  } catch (error) {
    // 解析失败，不是JSON格式，认为是普通文章
    return false;
  }
};

// 处理文章内容的显示
const processArticleContent = (articleData: any) => {
  // 如果内容是JSON格式但不是图库类型，可能需要特殊处理
  try {
    if (articleData.content && typeof articleData.content === 'string') {
      JSON.parse(articleData.content);
      // 如果能解析为JSON但不是图库类型，可能是其他结构化数据
      // 这里可以添加其他类型的处理逻辑
    }
  } catch (error) {
    // 不是JSON格式，是普通HTML内容，无需特殊处理
  }
  
  return articleData;
};

const showArticleDetail = async (item: any) => {
  articleLoading.value = true;
  try {
    // 更新浏览量
    try {
      await updateArticleViewsApi({ articleId: item.id });
      
      // 本地更新浏览量显示
      item.views = (item.views || 0) + 1;
    } catch (error) {
      console.error('更新浏览量失败:', error);
    }
    
    // 获取文章详情
    const result = await getArticleDetailApi({
      articleId: item.id,
      token: localStorage.getItem('token')
    }) as any; // 使用any类型暂时避开类型检查
    
    if (result && result.code === 200) {
      const articleData = result.data;
      
      // 检查是否为图库内容误显示为文章
      if (articleData.content && typeof articleData.content === 'string' && isGalleryContent(articleData.content)) {
        // 如果是图库内容，使用图库显示方式
        message.info('检测到图库内容，将使用图库方式显示');
        showGalleryContent(articleData);
        articleLoading.value = false;
        return;
      }
      
      // 处理文章内容
      selectedArticle.value = processArticleContent(articleData);
      articleDrawerVisible.value = true;
    } else {
      message.error('获取文章详情失败');
    }
  } catch (error) {
    console.error('获取文章详情失败:', error);
    message.error('网络错误，请稍后重试');
  } finally {
    articleLoading.value = false;
  }
};

const closeArticleDrawer = () => {
  selectedArticle.value = null;
  articleDrawerVisible.value = false;
};

// 图库详情抽屉相关
const galleryDrawerVisible = ref(false);
const selectedGallery = ref<any>(null);
const galleryLoading = ref(false);

// 处理图库内容的显示
const showGalleryContent = (galleryData: any) => {
  try {
    if (galleryData.content && typeof galleryData.content === 'string') {
      // 尝试解析JSON，如果是图片数组，就转为HTML格式
      const contentArray = JSON.parse(galleryData.content);
      if (Array.isArray(contentArray)) {
        // 创建样式更美观的图片HTML
        const imagesHtml = contentArray.map((img: any) => 
          `<div class="gallery-image-container">
            <img src="${img.url}" alt="${img.title || '图片'}" class="gallery-image" />
          </div>`
        ).join('');
        
        // 替换content为HTML字符串
        galleryData.content = imagesHtml;
      }
    }
  } catch (error) {
    console.error('解析图库内容失败:', error);
    // 解析失败时仍然显示原始内容
  }
  
  selectedGallery.value = galleryData;
  galleryDrawerVisible.value = true;
};

const showGalleryDetail = async (item: any) => {
  galleryLoading.value = true;
  try {
    // 更新浏览量
    try {
      await updateArticleViewsApi({ articleId: item.id });
      
      // 本地更新浏览量显示
      item.views = (item.views || 0) + 1;
    } catch (error) {
      console.error('更新浏览量失败:', error);
    }
    
    // 获取图库详情
    const result = await getArticleDetailApi({
      articleId: item.id,
      token: localStorage.getItem('token')
    }) as any; // 使用any类型暂时避开类型检查
    
    if (result && result.code === 200) {
      // 处理图库内容
      showGalleryContent(result.data);
    } else {
      message.error('获取图库详情失败');
    }
  } catch (error) {
    console.error('获取图库详情失败:', error);
    message.error('网络错误，请稍后重试');
  } finally {
    galleryLoading.value = false;
  }
};

const closeGalleryDrawer = () => {
  selectedGallery.value = null;
  galleryDrawerVisible.value = false;
};

// 获取分类名称
const getSubsetName = (subsetId: number | string) => {
  if (!subsetId) return '未分类';
  const subset = subsetStore.data.find(item => item.id == subsetId);
  return subset ? subset.name : '未分类';
};

// 获取标签ID数组
const getArticleLabelIds = (labelString: string) => {
  if (!labelString) return [];

  // 尝试解析JSON格式
  try {
    // 如果是JSON格式的字符串
    if (typeof labelString === 'string' && (labelString.startsWith('[') || labelString.startsWith('{'))) {
      const parsed = JSON.parse(labelString);
      if (Array.isArray(parsed)) {
        return parsed.map(id => String(id));
      } else if (typeof parsed === 'object' && parsed !== null) {
        return Object.values(parsed).map(id => String(id));
      }
    }
    
    // 如果是逗号分隔的字符串
    if (typeof labelString === 'string' && labelString.includes(',')) {
      return labelString.split(',').map(id => id.trim()).filter(id => id);
    }
    
    return [String(labelString)];
  } catch (e) {
    console.error('解析标签失败:', e);
    // 如果解析失败，按照逗号分隔处理
    if (typeof labelString === 'string') {
      return labelString.split(',').map(id => id.trim()).filter(id => id);
    }
    
    // 最后的兜底，确保返回数组
    return [String(labelString)];
  }
};

// 获取标签名称
const getLabelName = (labelId: string | number) => {
  return labelStore.getLabelName(labelId);
};
</script>

<style scoped>
.search-page {
  width: 100%;
  min-height: 100vh;
  background-color: var(--background-color);
}

/* 简化版顶部导航 */
.simple-header {
  position: sticky;
  top: 0;
  left: 0;
  width: 100%;
  background: var(--background-color);
  box-shadow: 0 2px 8px var(--gray-200);
  z-index: 100;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.header-top {
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
}

.left-section {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
}

.center-section {
  flex: 1;
  display: flex;
  justify-content: center;
  margin: 0 24px;
}

.right-section {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
}

.logo img {
  height: 28px;
  width: 28px;
  border-radius: 50%;
}

.search-box {
  width: 400px;
  max-width: 100%;
}

/* 搜索框高度调整 */
:deep(.ant-input-search) {
  line-height: 1;
}

:deep(.ant-input-search .ant-input) {
  height: 28px;
  padding-top: 2px;
  padding-bottom: 2px;
}

:deep(.ant-input-search .ant-input-search-button) {
  height: 28px;
  line-height: 28px;
}

.theme-switch {
  transform: scale(0.85);
}

/* 简化导航菜单 */
.simple-nav {
  display: flex;
  justify-content: center;
  padding: 0 0 2px;
  margin-top: -2px;
}

.nav-menu {
  border-bottom: none;
  background: transparent;
  display: flex;
  gap: 10px;
  line-height: 32px;
  min-height: auto;
}

:deep(.ant-menu-horizontal) {
  line-height: 32px;
  height: 32px;
}

.nav-menu .ant-menu-item {
  font-size: 14px;
  margin: 0 14px;
  position: relative;
  padding: 0 4px; 
  line-height: 32px;
  height: 32px;
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

.search-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.search-results {
  margin-top: 24px;
}

.result-section {
  margin-bottom: 32px;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

/* 文章网格布局 - 每行3个 */
.article-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

/* 图库网格布局 - 每行3个 */
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

/* 日记列表布局 - 每行1个 */
.diary-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 资源网格布局 - 每行4个 */
.resource-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

/* 分页器样式 */
:deep(.ant-pagination) {
  margin-top: 32px;
  display: flex;
  justify-content: center;
}

/* 空状态样式 */
.empty-state, .initial-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  width: 100%;
}

.empty-state-content, .initial-state-content {
  text-align: center;
  max-width: 400px;
  padding: 40px 20px;
}

.empty-icon, .initial-icon {
  margin-bottom: 24px;
  color: var(--gray-400);
  display: flex;
  justify-content: center;
}

.empty-title, .initial-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 12px 0;
}

.empty-description, .initial-description {
  font-size: 14px;
  color: var(--gray-500);
  line-height: 1.5;
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .gallery-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  
  .resource-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 992px) {
  .article-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .gallery-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .resource-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .header-top {
    flex-wrap: wrap;
    height: auto;
    padding: 12px 16px;
  }
  
  .left-section {
    order: 1;
  }
  
  .right-section {
    order: 2;
  }
  
  .center-section {
    order: 3;
    flex: 0 0 100%;
    margin: 10px 0 0 0;
  }
  
  .search-box {
    width: 100%;
  }
  
  .simple-nav {
    overflow-x: auto;
    justify-content: flex-start;
    padding: 0 8px 8px;
  }
  
  .nav-menu {
    justify-content: flex-start;
    flex-wrap: nowrap;
    min-width: 480px;
  }
  
  .article-grid {
    grid-template-columns: 1fr;
  }
  
  .gallery-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .resource-grid {
    grid-template-columns: 1fr;
  }
}

/* 深色模式适配 */
[data-theme="dark"] .simple-header {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

[data-theme="dark"] .search-tabs {
  border-bottom-color: #303030;
}

[data-theme="dark"] .empty-icon,
[data-theme="dark"] .initial-icon {
  color: var(--gray-500);
}

[data-theme="dark"] .empty-description,
[data-theme="dark"] .initial-description {
  color: var(--gray-400);
}

/* 备用标签显示组件样式 */
.backup-tags-display {
  margin-top: 20px;
  border-top: 1px solid var(--gray-200);
  padding-top: 20px;
}

.backup-article-item {
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px dashed var(--gray-200);
}

.backup-article-item h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
}

.backup-tags {
  font-size: 14px;
  color: var(--gray-600);
}

.backup-category {
  font-weight: bold;
  color: var(--blue-600);
}

.backup-tag {
  color: var(--green-600);
}

/* 抽屉样式 - 适配ArticleGalleryContent组件 */
:deep(.ant-drawer-body) {
  padding: 0;
  overflow: hidden;
}

:deep(.ant-drawer-content) {
  background-color: var(--background-color);
}

/* 图库图片样式 */
:deep(.gallery-image-container) {
  margin: 16px 0;
  text-align: center;
}

:deep(.gallery-image) {
  max-width: 100%;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
  cursor: pointer;
}

:deep(.gallery-image:hover) {
  transform: scale(1.02);
}

[data-theme="dark"] :deep(.gallery-image) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* 文章内容样式 */
:deep(.article-content) {
  line-height: 1.8;
  font-size: 16px;
  padding: 0 16px;
}

:deep(.article-content img) {
  max-width: 100%;
  border-radius: 8px;
  margin: 16px 0;
}

:deep(.article-content p) {
  margin-bottom: 16px;
}

:deep(.article-content h1),
:deep(.article-content h2),
:deep(.article-content h3) {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
}

:deep(.article-content pre) {
  background-color: var(--gray-100);
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 16px 0;
}

[data-theme="dark"] :deep(.article-content pre) {
  background-color: var(--gray-800);
}
</style>
