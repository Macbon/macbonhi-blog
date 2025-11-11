# 组件通信模式实战案例

## 📋 目录
1. [Props Down / Events Up 模式](#props-down--events-up-模式)
2. [Pinia Store 全局状态](#pinia-store-全局状态)
3. [Provide / Inject 跨层级通信](#provide--inject-跨层级通信)
4. [Vue Router 路由参数](#vue-router-路由参数)
5. [组合式函数 (Composables) 共享逻辑](#组合式函数-composables-共享逻辑)
6. [自定义Hooks业务复用](#自定义hooks业务复用)

---

## Props Down / Events Up 模式

### 案例1: 文章列表 → 文章卡片 → 文章详情

#### 数据流向图
```
indexView.vue (祖父组件)
    ↓ props: limit=4
    ↓ @articleClick="showArticleDetail"
    ↓
IndexArticle.vue (父组件)
    ↓ props: limit=4
    ↓ v-for循环
    ↓ :data="article"
    ↓ @click="handleArticleClick"
    ↓
articleitem.vue (子组件)
    ↓ props: { data }
    ↓ 用户点击卡片
    ↓ emit('click', data)
    ↑
IndexArticle.vue
    ↑ 接收click事件
    ↑ emit('articleClick', article)
    ↑
indexView.vue
    ↑ 接收articleClick事件
    ↑ showArticleDetail(article)
    ↑ 打开Drawer展示详情
```

#### 代码实现

**祖父组件: indexView.vue**
```vue
<template>
  <div class="home-page">
    <!-- 文章区 -->
    <section class="article-section">
      <IndexArticle 
        @articleClick="showArticleDetail" 
        :limit="4" 
      />
    </section>
    
    <!-- 文章详情抽屉 -->
    <a-drawer
      :open="drawerVisible"
      @close="closeDrawer"
    >
      <ArticleContent 
        v-if="currentArticle" 
        :articleData="currentArticle" 
      />
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import IndexArticle from '@/components/IndexCommpents/IndexArticle.vue';
import ArticleContent from '@/components/ArticleGalleryContent/content.vue';
import type { ArticalData } from '@/utils/typeof';

// 响应式数据
const drawerVisible = ref(false);
const currentArticle = ref<ArticalData | null>(null);

// ✅ 接收子组件事件
const showArticleDetail = (article: ArticalData) => {
  console.log('📄 显示文章详情:', article.title);
  currentArticle.value = article;
  drawerVisible.value = true;
  
  // ✅ 可选：上报监控事件
  MonitorSDK.report({
    type: MonitorType.BEHAVIOR,
    event_name: 'article_view',
    behavior_info: {
      actionType: 'view_article',
      articleId: article.id,
      articleTitle: article.title
    }
  });
};

const closeDrawer = () => {
  drawerVisible.value = false;
};
</script>
```

**父组件: IndexArticle.vue**
```vue
<template>
  <div class="index-article">
    <div v-if="loading" class="loading">加载中...</div>
    
    <div v-else class="article-grid">
      <articleitem
        v-for="article in displayArticles"
        :key="article.id"
        :data="article"
        @click="handleArticleClick"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import articleitem from '@/components/Article/articleitem.vue';
import { useArticle } from '@/hooks/useArticle';
import type { ArticalData } from '@/utils/typeof';

// ✅ 接收Props
interface Props {
  limit?: number;
}
const props = withDefaults(defineProps<Props>(), {
  limit: 6
});

// ✅ 定义Events
const emit = defineEmits<{
  articleClick: [article: ArticalData]
}>();

// 使用Hooks获取数据
const { articles, loading, fetchArticles } = useArticle();

// 计算属性：限制显示数量
const displayArticles = computed(() => {
  return articles.value.slice(0, props.limit);
});

// ✅ 处理子组件事件并向上传递
const handleArticleClick = (article: ArticalData) => {
  console.log('🔔 IndexArticle: 接收到点击事件', article.title);
  emit('articleClick', article);
};

onMounted(() => {
  fetchArticles({ 
    pageSize: props.limit,
    classify: 0 // 文章类型
  });
});
</script>
```

**子组件: articleitem.vue**
```vue
<template>
  <div 
    class="article-card" 
    @click="handleClick"
  >
    <div class="cover">
      <img :src="data.coverImage" :alt="data.title" />
    </div>
    
    <div class="content">
      <h3 class="title">{{ data.title }}</h3>
      <p class="summary">{{ data.summary }}</p>
      
      <div class="meta">
        <span class="date">{{ formatDate(data.createTime) }}</span>
        <span class="views">{{ data.views }} 次浏览</span>
        <span class="comments">{{ data.commentCount }} 评论</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ArticalData } from '@/utils/typeof';

// ✅ 接收Props
interface Props {
  data: ArticalData;
}
const props = defineProps<Props>();

// ✅ 定义Events
const emit = defineEmits<{
  click: [article: ArticalData]
}>();

// ✅ 点击处理：向父组件发送事件
const handleClick = () => {
  console.log('🖱️ articleitem: 用户点击卡片', props.data.title);
  emit('click', props.data);
};

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString('zh-CN');
};
</script>
```

---

## Pinia Store 全局状态

### 案例2: 评论数量的跨组件同步

#### 数据流向图
```
[用户在ArticleContent组件添加评论]
    ↓
addComment(content) → 调用API
    ↓
API成功返回
    ↓
useCommentStore().incrementCommentCount(articleId)
    ↓
Store更新: commentStates[1001].count = 5
    ↓
[所有使用此Store的组件自动更新]
    ├─ ArticleContent组件: 显示"5条评论"
    ├─ articleitem组件: 显示"5 评论"
    └─ CommentSection组件: 显示"共5条评论"
```

#### 代码实现

**Store定义: store/comment.ts**
```typescript
import { defineStore } from 'pinia';

interface CommentState {
  [targetId: number]: {
    count: number;
  };
}

export const useCommentStore = defineStore('comment', {
  state: () => ({
    // ✅ 使用对象存储多个目标的评论状态
    commentStates: {} as CommentState,
  }),

  getters: {
    // ✅ Getter: 获取指定目标的评论数
    getCommentCount: (state) => (targetId: number) => {
      return state.commentStates[targetId]?.count || 0;
    },
  },

  actions: {
    // ✅ 设置评论数量
    setCommentCount(targetId: number, count: number) {
      if (!this.commentStates[targetId]) {
        this.commentStates[targetId] = { count: 0 };
      }
      this.commentStates[targetId].count = count;
      console.log(`📝 评论数量已更新: ${targetId} → ${count}`);
    },
    
    // ✅ 增加评论数量（+1）
    incrementCommentCount(targetId: number) {
      if (!this.commentStates[targetId]) {
        this.commentStates[targetId] = { count: 0 };
      }
      this.commentStates[targetId].count++;
      console.log(`➕ 评论数量+1: ${targetId} → ${this.commentStates[targetId].count}`);
    },
    
    // ✅ 减少评论数量（-1）
    decrementCommentCount(targetId: number) {
      if (!this.commentStates[targetId] || this.commentStates[targetId].count <= 0) {
        return;
      }
      this.commentStates[targetId].count--;
      console.log(`➖ 评论数量-1: ${targetId} → ${this.commentStates[targetId].count}`);
    },
    
    // ✅ 获取评论状态
    getCommentState(targetId: number) {
      return this.commentStates[targetId] || { count: 0 };
    }
  }
});
```

**组件A: 文章详情（ArticleContent.vue）**
```vue
<template>
  <div class="article-content">
    <h1>{{ articleData.title }}</h1>
    <div class="article-meta">
      <span>{{ articleData.views }} 次浏览</span>
      <!-- ✅ 使用Store中的评论数 -->
      <span>{{ commentCount }} 条评论</span>
    </div>
    
    <!-- 评论区 -->
    <CommentSection 
      :targetId="articleData.id" 
      :targetType="0"
      @commentAdded="handleCommentAdded"
      @commentDeleted="handleCommentDeleted"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useCommentStore } from '@/store/comment';
import CommentSection from '@/components/comment/commentSection.vue';
import { getArticleCommentsApi } from '@/api';

interface Props {
  articleData: ArticalData;
}
const props = defineProps<Props>();

// ✅ 使用评论Store
const commentStore = useCommentStore();

// ✅ 计算属性：从Store获取评论数
const commentCount = computed(() => {
  return commentStore.getCommentCount(props.articleData.id);
});

// ✅ 组件挂载时获取评论数
onMounted(async () => {
  const res = await getArticleCommentsApi({
    targetId: props.articleData.id,
    targetType: 0
  });
  
  if (res.code === 200) {
    // 初始化评论数量
    commentStore.setCommentCount(props.articleData.id, res.data.count);
  }
});

// ✅ 评论添加成功处理
const handleCommentAdded = () => {
  commentStore.incrementCommentCount(props.articleData.id);
};

// ✅ 评论删除成功处理
const handleCommentDeleted = () => {
  commentStore.decrementCommentCount(props.articleData.id);
};
</script>
```

**组件B: 文章卡片（articleitem.vue）**
```vue
<template>
  <div class="article-card">
    <h3>{{ data.title }}</h3>
    <div class="meta">
      <span>{{ data.views }} 浏览</span>
      <!-- ✅ 同样从Store获取评论数 -->
      <span>{{ commentCount }} 评论</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useCommentStore } from '@/store/comment';
import type { ArticalData } from '@/utils/typeof';

interface Props {
  data: ArticalData;
}
const props = defineProps<Props>();

// ✅ 使用评论Store
const commentStore = useCommentStore();

// ✅ 计算属性：从Store获取评论数（响应式更新）
const commentCount = computed(() => {
  return commentStore.getCommentCount(props.data.id);
});
</script>
```

**组件C: 评论区（CommentSection.vue）**
```vue
<template>
  <div class="comment-section">
    <!-- ✅ 显示评论总数 -->
    <div class="comment-header">
      <h3>评论 ({{ commentCount }})</h3>
    </div>
    
    <!-- 评论输入框 -->
    <div class="comment-input">
      <a-textarea v-model:value="commentContent" />
      <a-button @click="submitComment">发表评论</a-button>
    </div>
    
    <!-- 评论列表 -->
    <div class="comment-list">
      <commentitem
        v-for="comment in comments"
        :key="comment.id"
        :data="comment"
        @delete="handleDelete"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useCommentStore } from '@/store/comment';
import { getArticleCommentsApi, addCommentApi, deleteCommentApi } from '@/api';
import commentitem from './commentitem.vue';

interface Props {
  targetId: number;    // 文章ID
  targetType: number;  // 0=文章, 1=评论, 3=随笔
}
const props = defineProps<Props>();

const emit = defineEmits<{
  commentAdded: []
  commentDeleted: []
}>();

// ✅ 使用评论Store
const commentStore = useCommentStore();

const comments = ref<any[]>([]);
const commentContent = ref('');

// ✅ 计算属性：从Store获取评论数
const commentCount = computed(() => {
  return commentStore.getCommentCount(props.targetId);
});

// 获取评论列表
const fetchComments = async () => {
  const res = await getArticleCommentsApi({
    targetId: props.targetId,
    targetType: props.targetType
  });
  
  if (res.code === 200) {
    comments.value = res.data.result;
    // ✅ 更新Store中的评论数
    commentStore.setCommentCount(props.targetId, res.data.count);
  }
};

// 提交评论
const submitComment = async () => {
  if (!commentContent.value.trim()) return;
  
  const res = await addCommentApi({
    targetId: props.targetId,
    targetType: props.targetType,
    content: commentContent.value
  });
  
  if (res.code === 200) {
    commentContent.value = '';
    
    // ✅ 更新Store：评论数+1
    commentStore.incrementCommentCount(props.targetId);
    
    // 重新获取评论列表
    await fetchComments();
    
    // 通知父组件
    emit('commentAdded');
  }
};

// 删除评论
const handleDelete = async (commentId: number) => {
  const res = await deleteCommentApi({ commentId });
  
  if (res.code === 200) {
    // ✅ 更新Store：评论数-1
    commentStore.decrementCommentCount(props.targetId);
    
    // 重新获取评论列表
    await fetchComments();
    
    // 通知父组件
    emit('commentDeleted');
  }
};

onMounted(() => {
  fetchComments();
});
</script>
```

### 案例3: 点赞状态的跨组件同步

**Store定义: store/praise.ts**
```typescript
import { defineStore } from 'pinia';
import { reactive } from 'vue';

interface PraiseState {
  [articleId: number]: {
    count: number;      // 点赞数量
    isPraised: boolean; // 当前用户是否已点赞
  };
}

export const usePraiseStore = defineStore('praise', () => {
  // ✅ 使用reactive确保深层响应式
  const praiseStates = reactive<PraiseState>({});

  // ✅ 设置文章点赞状态
  const setPraiseState = (articleId: number, count: number, isPraised: boolean) => {
    praiseStates[articleId] = { count, isPraised };
    console.log(`❤️ 点赞状态已更新: ${articleId} → count=${count}, isPraised=${isPraised}`);
  };

  // ✅ 获取文章点赞状态
  const getPraiseState = (articleId: number) => {
    return praiseStates[articleId] || { count: 0, isPraised: false };
  };

  // ✅ 切换点赞状态
  const togglePraiseStatus = (articleId: number, isPraised: boolean, count: number) => {
    // 创建新对象确保触发响应式
    praiseStates[articleId] = { count, isPraised };
    console.log(`🔄 点赞状态切换: ${articleId} → ${isPraised ? '已点赞' : '未点赞'}`);
  };

  // ✅ 批量设置点赞状态（性能优化）
  const setBatchPraiseStates = (states: Array<{id: number, count: number, isPraised: boolean}>) => {
    states.forEach(state => {
      praiseStates[state.id] = { count: state.count, isPraised: state.isPraised };
    });
    console.log(`📦 批量设置点赞状态: ${states.length} 条`);
  };

  return {
    praiseStates,
    setPraiseState,
    getPraiseState,
    togglePraiseStatus,
    setBatchPraiseStates
  };
});
```

**使用点赞Store的组件**
```vue
<template>
  <div class="article-card">
    <h3>{{ data.title }}</h3>
    
    <!-- ✅ 点赞按钮：显示状态和数量 -->
    <button 
      :class="['praise-btn', { 'praised': isPraised }]"
      @click="handlePraise"
    >
      <HeartOutlined v-if="!isPraised" />
      <HeartFilled v-else />
      {{ praiseCount }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { usePraiseStore } from '@/store/praise';
import { addPraiseApi, cancelPraiseApi } from '@/api';
import { getBrowserFingerprint } from '@/utils/fingerprint';
import { HeartOutlined, HeartFilled } from '@ant-design/icons-vue';

interface Props {
  data: ArticalData;
}
const props = defineProps<Props>();

// ✅ 使用点赞Store
const praiseStore = usePraiseStore();

// ✅ 计算属性：从Store获取点赞状态
const praiseState = computed(() => {
  return praiseStore.getPraiseState(props.data.id);
});

const isPraised = computed(() => praiseState.value.isPraised);
const praiseCount = computed(() => praiseState.value.count);

// ✅ 处理点赞/取消点赞
const handlePraise = async () => {
  const browserId = await getBrowserFingerprint();
  
  try {
    if (isPraised.value) {
      // 取消点赞
      const res = await cancelPraiseApi({
        targetId: props.data.id,
        targetType: 0,
        browserId
      });
      
      if (res.code === 200) {
        // ✅ 更新Store
        praiseStore.togglePraiseStatus(
          props.data.id, 
          false, 
          praiseCount.value - 1
        );
      }
    } else {
      // 添加点赞
      const res = await addPraiseApi({
        targetId: props.data.id,
        targetType: 0,
        browserId
      });
      
      if (res.code === 200) {
        // ✅ 更新Store
        praiseStore.togglePraiseStatus(
          props.data.id, 
          true, 
          praiseCount.value + 1
        );
      }
    }
  } catch (error) {
    console.error('点赞操作失败:', error);
  }
};
</script>
```

---

## Vue Router 路由参数

### 案例4: 搜索功能的路由参数传递

#### 数据流向图
```
HeadBar组件 (导航栏)
    ↓
用户输入搜索关键词: "Vue 3"
    ↓
点击搜索按钮 / 回车
    ↓
onSearch(value)
    ↓
router.push({
  path: '/search',
  query: { keyword: 'Vue 3' }
})
    ↓
路由跳转到 /search?keyword=Vue%203
    ↓
searchView组件
    ↓
const route = useRoute();
const keyword = route.query.keyword; // "Vue 3"
    ↓
调用searchApi({ keyword })
    ↓
显示搜索结果
```

#### 代码实现

**组件A: HeadBar.vue（导航栏）**
```vue
<template>
  <a-layout-header class="headbar">
    <div class="logo">...</div>
    
    <nav class="nav">...</nav>
    
    <!-- ✅ 搜索框 -->
    <div class="right">
      <a-input-search
        v-model:value="search"
        placeholder="文章/图库/日记资源"
        style="width: 220px"
        @search="onSearch"
      />
    </div>
  </a-layout-header>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const search = ref('');

// ✅ 搜索处理：通过路由参数传递
function onSearch(value: string) {
  if (value.trim()) {
    console.log('🔍 搜索关键词:', value);
    
    // ✅ 跳转到搜索页面，携带query参数
    router.push({
      path: '/search',
      query: { 
        keyword: value.trim() 
      }
    });
    
    // 清空输入框
    search.value = '';
  }
}
</script>
```

**组件B: searchView.vue（搜索页面）**
```vue
<template>
  <div class="search-view">
    <!-- ✅ 显示搜索关键词 -->
    <div class="search-header">
      <h2>搜索结果: "{{ keyword }}"</h2>
      <p>找到 {{ totalResults }} 条结果</p>
    </div>
    
    <!-- 搜索结果 -->
    <div class="search-results">
      <div v-if="loading">搜索中...</div>
      
      <div v-else>
        <!-- 文章结果 -->
        <div v-if="articleResults.length > 0" class="result-section">
          <h3>文章 ({{ articleResults.length }})</h3>
          <articleitem 
            v-for="article in articleResults"
            :key="article.id"
            :data="article"
          />
        </div>
        
        <!-- 图库结果 -->
        <div v-if="galleryResults.length > 0" class="result-section">
          <h3>图库 ({{ galleryResults.length }})</h3>
          <Galleryitem 
            v-for="gallery in galleryResults"
            :key="gallery.id"
            :data="gallery"
          />
        </div>
        
        <!-- 日记结果 -->
        <div v-if="diaryResults.length > 0" class="result-section">
          <h3>随笔 ({{ diaryResults.length }})</h3>
          <diaryitem 
            v-for="diary in diaryResults"
            :key="diary.id"
            :data="diary"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { searchApi } from '@/api';
import articleitem from '@/components/Article/articleitem.vue';
import Galleryitem from '@/components/Gallery/Galleryitem.vue';
import diaryitem from '@/components/Diary/diaryitem.vue';

const route = useRoute();

// ✅ 从路由参数获取搜索关键词
const keyword = computed(() => route.query.keyword as string || '');

const loading = ref(false);
const articleResults = ref<any[]>([]);
const galleryResults = ref<any[]>([]);
const diaryResults = ref<any[]>([]);

const totalResults = computed(() => {
  return articleResults.value.length + 
         galleryResults.value.length + 
         diaryResults.value.length;
});

// ✅ 执行搜索
const performSearch = async () => {
  if (!keyword.value) return;
  
  loading.value = true;
  
  try {
    const res = await searchApi({
      keyword: keyword.value,
      limit: 50
    });
    
    if (res.code === 200) {
      // 按类型分类搜索结果
      articleResults.value = res.data.filter(item => item.classify === 0);
      galleryResults.value = res.data.filter(item => item.classify === 1);
      diaryResults.value = res.data.filter(item => item.classify === 3);
      
      console.log('✅ 搜索完成:', {
        keyword: keyword.value,
        articles: articleResults.value.length,
        galleries: galleryResults.value.length,
        diaries: diaryResults.value.length
      });
    }
  } catch (error) {
    console.error('搜索失败:', error);
  } finally {
    loading.value = false;
  }
};

// ✅ 监听路由参数变化（用户可能在搜索页再次搜索）
watch(keyword, (newKeyword) => {
  if (newKeyword) {
    performSearch();
  }
}, { immediate: true });

onMounted(() => {
  // ✅ 上报搜索行为
  if (keyword.value) {
    MonitorSDK.report({
      type: MonitorType.BEHAVIOR,
      event_name: 'search',
      behavior_info: {
        actionType: 'search',
        keyword: keyword.value
      }
    });
  }
});
</script>
```

---

## 组合式函数 (Composables) 共享逻辑

### 案例5: 主题切换的可组合函数

**Composable: composables/useTheme.ts**
```typescript
import { computed } from 'vue';
import { useThemeStore } from '@/store/theme';

export function useTheme() {
  const themeStore = useThemeStore();
  
  // ✅ 当前主题
  const currentTheme = computed(() => themeStore.currentTheme);
  
  // ✅ 是否为暗色主题
  const isDark = computed(() => themeStore.currentTheme === 'dark');
  
  // ✅ 切换主题
  const toggleTheme = () => {
    themeStore.toggleTheme();
    
    // ✅ 上报主题切换事件
    MonitorSDK.report({
      type: MonitorType.CUSTOM,
      event_name: 'theme_toggle',
      behavior_info: {
        actionType: 'theme_change',
        theme: themeStore.currentTheme
      }
    });
  };
  
  // ✅ 设置主题
  const setTheme = (theme: 'light' | 'dark') => {
    themeStore.setTheme(theme);
  };
  
  return {
    currentTheme,
    isDark,
    toggleTheme,
    setTheme
  };
}
```

**在多个组件中使用**

**组件A: HeadBar.vue**
```vue
<template>
  <a-layout-header class="headbar">
    <!-- ✅ 主题切换开关 -->
    <a-switch
      v-model:checked="isDark"
      checked-children="🌙"
      un-checked-children="🌞"
      class="theme-switch"
      @change="toggleTheme"
    />
  </a-layout-header>
</template>

<script setup lang="ts">
import { useTheme } from '@/composables/useTheme';

// ✅ 使用可组合函数
const { isDark, toggleTheme } = useTheme();
</script>
```

**组件B: ThemeToggle.vue**
```vue
<template>
  <button 
    class="theme-toggle-btn"
    @click="toggleTheme"
  >
    <span v-if="isDark">🌙 暗色模式</span>
    <span v-else>☀️ 亮色模式</span>
  </button>
</template>

<script setup lang="ts">
import { useTheme } from '@/composables/useTheme';

// ✅ 使用同一个可组合函数
const { isDark, toggleTheme } = useTheme();
</script>
```

---

## 自定义Hooks业务复用

### 案例6: 文章列表的Hooks复用

**Hooks: hooks/useArticle.ts**
```typescript
import { ref, reactive } from 'vue';
import { getArticleApi } from '@/api';
import { useUserStore } from '@/store/user';

export function useArticle() {
  const userStore = useUserStore();
  
  // ✅ 响应式状态
  const articles = ref<any[]>([]);
  const loading = ref(false);
  const pagination = reactive({
    current: 1,
    pageSize: 6,
    total: 0
  });
  const hasMore = ref(true);

  // ✅ 获取文章列表
  const fetchArticles = async (params: {
    page?: number;
    pageSize?: number;
    categoryId?: number;
    searchTerm?: string;
    reset?: boolean;
    classify?: number;
  } = {}) => {
    const { 
      page = pagination.current, 
      pageSize = pagination.pageSize, 
      categoryId, 
      searchTerm, 
      reset = false,
      classify = 0
    } = params;
    
    try {
      loading.value = true;
      
      // 重置数据
      if (reset || page === 1) {
        articles.value = [];
        pagination.current = 1;
      }
      
      // 调用API
      const apiParams = {
        token: userStore.token || 'guest',
        nowpage: page,
        pagesize: pageSize,
        count: true,
        classify: classify,
        ...(categoryId !== undefined && categoryId !== -1 && { subsetId: categoryId }),
        ...(searchTerm && { keyword: searchTerm })
      };
      
      const response = await getArticleApi(apiParams);
      
      if (response && response.data) {
        const newArticles = response.data.result || [];
        const total = response.data.count || 0;
        
        // 追加或替换数据
        if (page > 1 && !reset) {
          const existingIds = new Set(articles.value.map(a => a.id));
          const uniqueNewArticles = newArticles.filter(a => !existingIds.has(a.id));
          articles.value = [...articles.value, ...uniqueNewArticles];
        } else {
          articles.value = newArticles;
        }
        
        pagination.total = total;
        pagination.current = page;
        hasMore.value = articles.value.length < total;
      }
    } catch (error) {
      console.error('获取文章列表出错:', error);
    } finally {
      loading.value = false;
    }
  };

  // ✅ 加载更多
  const loadMore = async (categoryId?: number, searchTerm?: string) => {
    if (loading.value || !hasMore.value) return;
    
    await fetchArticles({
      page: pagination.current + 1,
      categoryId,
      searchTerm
    });
  };

  // ✅ 根据分类加载
  const fetchArticlesByCategory = async (categoryId: number) => {
    await fetchArticles({
      categoryId,
      reset: true
    });
  };

  // ✅ 搜索文章
  const searchArticles = async (searchTerm: string) => {
    await fetchArticles({
      searchTerm,
      reset: true
    });
  };

  return {
    articles,
    loading,
    pagination,
    hasMore,
    fetchArticles,
    loadMore,
    fetchArticlesByCategory,
    searchArticles
  };
}
```

**在多个组件中使用同一个Hooks**

**组件A: ArticleView.vue（文章列表页）**
```vue
<template>
  <div class="article-view">
    <!-- 分类筛选 -->
    <div class="category-filter">
      <a-button 
        v-for="category in categories"
        :key="category.id"
        @click="handleCategoryChange(category.id)"
      >
        {{ category.name }}
      </a-button>
    </div>
    
    <!-- 文章列表 -->
    <div class="article-list">
      <articleitem 
        v-for="article in articles"
        :key="article.id"
        :data="article"
      />
    </div>
    
    <!-- 加载更多 -->
    <a-button 
      v-if="hasMore"
      :loading="loading"
      @click="loadMore()"
    >
      加载更多
    </a-button>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useArticle } from '@/hooks/useArticle';
import articleitem from '@/components/Article/articleitem.vue';

// ✅ 使用Hooks
const { 
  articles, 
  loading, 
  hasMore, 
  fetchArticles, 
  loadMore,
  fetchArticlesByCategory 
} = useArticle();

// 分类切换
const handleCategoryChange = (categoryId: number) => {
  fetchArticlesByCategory(categoryId);
};

onMounted(() => {
  fetchArticles({ classify: 0 });
});
</script>
```

**组件B: IndexArticle.vue（首页文章区块）**
```vue
<template>
  <div class="index-article">
    <div class="article-grid">
      <articleitem 
        v-for="article in displayArticles"
        :key="article.id"
        :data="article"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useArticle } from '@/hooks/useArticle';
import articleitem from '@/components/Article/articleitem.vue';

interface Props {
  limit?: number;
}
const props = withDefaults(defineProps<Props>(), {
  limit: 4
});

// ✅ 使用同一个Hooks（独立实例）
const { articles, fetchArticles } = useArticle();

// 限制显示数量
const displayArticles = computed(() => {
  return articles.value.slice(0, props.limit);
});

onMounted(() => {
  fetchArticles({ 
    pageSize: props.limit,
    classify: 0 
  });
});
</script>
```

---

## 总结

### 组件通信模式选择指南

| 场景 | 推荐方式 | 理由 |
|------|---------|------|
| 父子组件通信 | Props Down / Events Up | Vue标准模式，清晰直观 |
| 跨组件共享状态 | Pinia Store | 响应式更新，便于维护 |
| 跨层级通信 | Provide / Inject | 避免props层层传递 |
| 页面间参数传递 | Vue Router Query/Params | 支持浏览器历史记录 |
| 逻辑复用 | Composables / Hooks | 代码复用，类型安全 |
| 全局事件 | Event Bus (不推荐) | 难以追踪，建议用Store替代 |

### 最佳实践

1. **优先使用Props和Events**：对于父子组件，这是最直接的方式
2. **合理使用Store**：只在需要跨组件共享的状态使用Store
3. **提取可复用逻辑**：使用Composables或Hooks提高代码复用
4. **类型安全**：充分利用TypeScript类型检查
5. **避免过度设计**：根据实际需求选择合适的通信方式

### 本项目使用的通信模式统计

- ✅ **Props Down / Events Up**: 80% 的组件通信
- ✅ **Pinia Store**: 评论、点赞、用户、主题等全局状态
- ✅ **Vue Router**: 页面跳转和参数传递
- ✅ **Composables/Hooks**: 主题、文章、日记等业务逻辑复用
- ❌ **Provide/Inject**: 未明显使用（但推荐在深层嵌套组件中使用）

