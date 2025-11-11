# macbonhi-blog 用户端代码架构分析

## 📋 目录
1. [项目概览](#项目概览)
2. [模块架构分析](#模块架构分析)
3. [组件封装设计](#组件封装设计)
4. [组件间通信机制](#组件间通信机制)
5. [Pinia状态管理](#pinia状态管理)
6. [监控系统详解](#监控系统详解)
7. [性能优化策略](#性能优化策略)

---

## 项目概览

### 技术栈
- **框架**: Vue 3.5.13 (Composition API + Options API 混用)
- **路由**: Vue Router 4.5.1
- **状态管理**: Pinia 3.0.2 + pinia-plugin-persistedstate
- **UI组件库**: Ant Design Vue 4.2.6
- **HTTP客户端**: Axios 1.9.0
- **Markdown渲染**: Marked 16.1.1 + Highlight.js 11.11.1
- **浏览器指纹**: FingerprintJS 4.6.2
- **构建工具**: Vite 6.3.5 + TypeScript 5.8.3
- **样式**: TailwindCSS 3.4.17

### 项目结构
```
src/
├── api/              # API接口定义
├── assets/           # 静态资源
├── components/       # 可复用组件
│   ├── Article/      # 文章组件
│   ├── Diary/        # 随笔组件
│   ├── Gallery/      # 图库组件
│   ├── Files/        # 文件组件
│   ├── Views/        # 布局组件（Header/Footer）
│   ├── comment/      # 评论组件
│   └── common/       # 通用组件
├── composables/      # 可组合函数
├── hooks/            # 业务逻辑Hooks
├── router/           # 路由配置
├── store/            # Pinia状态管理
├── types/            # TypeScript类型定义
├── utils/            # 工具函数
│   ├── monitor/      # 监控SDK（核心）
│   ├── apiCache.ts   # API缓存系统
│   ├── axios.ts      # Axios配置
│   ├── fingerprint.ts # 浏览器指纹
│   └── ...
└── views/            # 页面视图
```

---

## 模块架构分析

### 1. 路由模块 (`router/index.ts`)

#### 特点
- **懒加载策略**: 除首页外，所有页面组件均采用动态导入
- **布局模式**: 使用 `FullWidthView` 作为主布局，搜索页独立
- **监控集成**: 在路由守卫中集成了完整的监控逻辑

#### 路由监控点
```typescript
// 1. beforeEach - 记录路由跳转开始
router.beforeEach((to, from, next) => {
  const startTime = Date.now();
  to.meta.startTime = startTime; // 记录开始时间
  
  MonitorSDK.report({
    type: MonitorType.BEHAVIOR,
    event_name: 'route_change_start',
    behavior_info: {
      from: from.path,
      to: to.path,
      timestamp: startTime
    }
  });
});

// 2. afterEach - 记录路由跳转完成和性能
router.afterEach((to, from) => {
  const duration = Date.now() - (to.meta.startTime || 0);
  
  // 记录导航完成事件
  MonitorSDK.report({
    type: MonitorType.BEHAVIOR,
    event_name: 'route_change_complete',
    behavior_info: {
      duration: duration,
      routeName: to.name
    }
  });
  
  // 慢导航性能告警（>1秒）
  if (duration > 1000) {
    MonitorSDK.report({
      type: MonitorType.PERFORMANCE,
      performance_info: { slow_navigation: duration }
    });
  }
});

// 3. onError - 路由错误监控
router.onError((error) => {
  MonitorSDK.report({
    type: MonitorType.ERROR,
    error_info: {
      error_type: 'route_error',
      message: error.message,
      stack: error.stack
    }
  });
});
```

### 2. API模块 (`api/index.ts` + `utils/axios.ts`)

#### Axios拦截器监控
```typescript
// 请求拦截器 - 记录开始时间
service.interceptors.request.use((config) => {
  config.metadata = { startTime: Date.now() };
  return config;
});

// 响应拦截器 - 性能监控和错误捕获
service.interceptors.response.use(
  (response) => {
    const duration = Date.now() - response.config.metadata.startTime;
    
    // 慢请求监控（>1秒）
    if (duration > 1000) {
      MonitorSDK.report({
        type: MonitorType.PERFORMANCE,
        level: MonitorLevel.WARN,
        performance_info: { slow_request: duration },
        behavior_info: {
          actionType: 'slow_request',
          url: response.config.url,
          method: response.config.method,
          duration
        }
      });
    }
    
    return response;
  },
  (error) => {
    // 网络错误监控
    MonitorSDK.report({
      type: MonitorType.ERROR,
      error_info: {
        error_type: 'response_error',
        message: error.message,
        url: error.config?.url,
        status: error.response?.status
      }
    });
    
    return Promise.reject(error);
  }
);
```

#### API接口分类
- **用户认证**: `isRegisterApi`, `registerApi`, `loginApi`
- **文章管理**: `getArticleApi`, `addArticleApi`, `updateArticleApi`, `deleteArticleApi`
- **评论系统**: `getArticleCommentsApi`, `addCommentApi`, `addCommentReplyApi`
- **点赞功能**: `addPraiseApi`, `cancelPraiseApi`, `getPraiseStatusApi`
- **文件管理**: `uploadFileApi`, `getFileApi`, `downloadFileApi`
- **日记功能**: `getDiaryApi`, `createDiaryApi`, `getDiaryByDateApi`
- **监控上报**: `reportMonitorApi`, `getMonitorStatsApi` (✨ 核心)
- **搜索功能**: `searchApi`

### 3. 缓存模块 (`utils/apiCache.ts`)

#### 智能缓存系统
```typescript
class ApiCache {
  // 双层缓存：内存缓存 + localStorage
  private memoryCache = new Map<string, CacheItem>();
  private MAX_MEMORY_ITEMS = 100; // LRU策略
  
  async get<T>(key: string, fetcher: () => Promise<T>, options: CacheOptions) {
    // 1. 检查内存缓存
    const memoryItem = this.memoryCache.get(key);
    if (memoryItem && this.isValid(memoryItem)) {
      return memoryItem.data;
    }
    
    // 2. 检查localStorage缓存
    const localItem = this.getFromLocalStorage(key);
    if (localItem && this.isValid(localItem)) {
      this.setMemoryCache(key, localItem); // 回填内存
      return localItem.data;
    }
    
    // 3. 缓存未命中，获取新数据
    return await this.fetchAndCache(key, fetcher, ttl, storage);
  }
}
```

#### 缓存策略配置
- **文章列表**: 2分钟，localStorage
- **图库列表**: 5分钟，localStorage
- **文章详情**: 10分钟，localStorage
- **评论数据**: 1分钟，内存缓存
- **用户数据**: 30分钟，localStorage
- **分类数据**: 1小时，localStorage

---

## 组件封装设计

### 1. 组件分层架构

#### 视图层组件 (`views/`)
- **indexView.vue**: 首页，组合多个区块组件
- **ArticleView.vue**: 文章列表页
- **DiaryView.vue**: 随笔列表页
- **GalleryView.vue**: 图库页
- **FilesView.vue**: 文件下载页
- **searchView.vue**: 搜索页（最重，1254行）
- **AboutView.vue**: 关于页

#### 业务组件层 (`components/`)

##### 文章相关
- `Article/article.vue`: 文章列表容器
- `Article/articleitem.vue`: 文章卡片（可复用）
- `ArticleGalleryContent/content.vue`: 文章/图库详情展示

##### 评论系统
- `comment/commentSection.vue`: 评论区容器
- `comment/comment.vue`: 评论列表
- `comment/commentitem.vue`: 单条评论
- `comment/commentitem2.vue`: 评论回复项

##### 图库系统
- `Gallery/Gallery.vue`: 图库容器
- `Gallery/Galleryitem.vue`: 图库卡片

##### 日记系统
- `Diary/diary.vue`: 日记列表
- `Diary/diaryitem.vue`: 日记卡片
- `Diary/diaryDetail.vue`: 日记详情
- `DiaryCalender/DiaryCalender.vue`: 日记日历

##### 文件系统
- `Files/file.vue`: 文件列表
- `Files/fileitem.vue`: 文件卡片
- `Files/FileIcon.vue`: 文件图标

##### 首页组件
- `IndexCommpents/IndexArticle.vue`: 首页文章区块
- `IndexCommpents/IndexDiary.vue`: 首页随笔区块
- `IndexCommpents/IndexGallery.vue`: 首页图库区块
- `IndexCommpents/IndexDownload.vue`: 首页下载区块

##### 布局组件
- `Views/HeadBar.vue`: 顶部导航栏
- `Views/Footer.vue`: 页脚
- `QuickNav-DataView/QuickNav.vue`: 快捷导航

##### 通用组件
- `common/MonitorExample.vue`: 监控示例组件（✨ 重要）
- `colorchange/ThemeToggle.vue`: 主题切换

### 2. 组件封装模式

#### 容器-展示模式 (Container-Presentational)
```vue
<!-- 容器组件 - Article/article.vue -->
<template>
  <div class="article-list">
    <articleitem 
      v-for="article in articles" 
      :key="article.id"
      :data="article"
      @click="handleClick"
    />
  </div>
</template>

<script setup>
import { useArticle } from '@/hooks/useArticle';

// 容器组件负责数据逻辑
const { articles, loading, fetchArticles } = useArticle();

onMounted(() => {
  fetchArticles();
});

const handleClick = (article) => {
  emit('articleClick', article);
};
</script>
```

```vue
<!-- 展示组件 - Article/articleitem.vue -->
<template>
  <div class="article-card" @click="$emit('click', data)">
    <img :src="data.cover" />
    <h3>{{ data.title }}</h3>
    <p>{{ data.summary }}</p>
  </div>
</template>

<script setup>
// 展示组件只负责UI渲染
defineProps<{
  data: ArticalData
}>();

defineEmits<{
  click: [article: ArticalData]
}>();
</script>
```

---

## 组件间通信机制

### 1. Props Down / Events Up

#### 父组件向子组件传递数据
```vue
<!-- indexView.vue -->
<IndexArticle 
  @articleClick="showArticleDetail" 
  :limit="4" 
/>
```

#### 子组件向父组件发送事件
```vue
<!-- IndexArticle.vue -->
<script setup>
const emit = defineEmits<{
  articleClick: [article: any]
}>();

const handleArticleClick = (article) => {
  emit('articleClick', article);
};
</script>
```

### 2. Pinia Store（全局状态）

#### 跨组件共享状态
```typescript
// 评论组件A - 添加评论
import { useCommentStore } from '@/store/comment';

const commentStore = useCommentStore();
commentStore.incrementCommentCount(articleId);
```

```typescript
// 文章组件B - 显示评论数
import { useCommentStore } from '@/store/comment';

const commentStore = useCommentStore();
const count = computed(() => commentStore.getCommentCount(articleId));
```

### 3. 事件总线（通过 Vue Router）

#### 路由参数传递
```typescript
// HeadBar.vue - 搜索跳转
router.push({
  path: '/search',
  query: { keyword: searchValue }
});
```

```typescript
// searchView.vue - 接收参数
const route = useRoute();
const keyword = route.query.keyword;
```

### 4. Provide/Inject（跨层级组件）

虽然代码中未明显使用，但在 Vue 3 中这是跨层级组件通信的推荐方式。

---

## Pinia状态管理

### 1. Store模块划分

#### User Store (`store/user.ts`)
```typescript
export const useUserStore = defineStore('user', {
  state: () => ({
    id: -1,
    name: '',
    token: '',
  }),
  
  actions: {
    logout() {
      this.id = -1;
      this.name = '';
      this.token = '';
    }
  },

  // ✅ 持久化：存储到sessionStorage
  persist: {
    storage: sessionStorage,
  }
});
```

#### Theme Store (`store/theme.ts`)
```typescript
export const useThemeStore = defineStore('theme', () => {
  const currentTheme = ref<Theme>('light');
  
  const toggleTheme = () => {
    currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', currentTheme.value);
    localStorage.setItem('theme', currentTheme.value);
  };
  
  const initTheme = () => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
  };
  
  return { currentTheme, toggleTheme, setTheme, initTheme };
});
```

#### Comment Store (`store/comment.ts`)
```typescript
export const useCommentStore = defineStore('comment', {
  state: () => ({
    commentStates: {} as CommentState, // { [targetId]: { count } }
  }),

  actions: {
    setCommentCount(targetId: number, count: number) {
      if (!this.commentStates[targetId]) {
        this.commentStates[targetId] = { count: 0 };
      }
      this.commentStates[targetId].count = count;
    },
    
    incrementCommentCount(targetId: number) {
      if (!this.commentStates[targetId]) {
        this.commentStates[targetId] = { count: 0 };
      }
      this.commentStates[targetId].count++;
    },
    
    decrementCommentCount(targetId: number) {
      if (!this.commentStates[targetId] || this.commentStates[targetId].count <= 0) {
        return;
      }
      this.commentStates[targetId].count--;
    },
    
    getCommentCount(targetId: number): number {
      return this.commentStates[targetId]?.count || 0;
    }
  }
});
```

#### Praise Store (`store/praise.ts`)
```typescript
export const usePraiseStore = defineStore('praise', () => {
  // 使用 reactive 确保深层响应式
  const praiseStates = reactive<PraiseState>({});

  const setPraiseState = (articleId: number, count: number, isPraised: boolean) => {
    praiseStates[articleId] = { count, isPraised };
  };

  const getPraiseState = (articleId: number) => {
    return praiseStates[articleId] || { count: 0, isPraised: false };
  };

  const togglePraiseStatus = (articleId: number, isPraised: boolean, count: number) => {
    // 创建新对象确保触发响应式
    praiseStates[articleId] = { count, isPraised };
  };

  const setBatchPraiseStates = (states: Array<{id: number, count: number, isPraised: boolean}>) => {
    states.forEach(state => {
      praiseStates[state.id] = { count: state.count, isPraised: state.isPraised };
    });
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

### 2. Pinia持久化策略

#### 配置（`main.ts`）
```typescript
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate); // 全局插件

app.use(pinia);
```

#### 使用
- **User Store**: `sessionStorage` - 关闭浏览器清除
- **Theme Store**: `localStorage` - 永久保存（手动实现）
- **Comment/Praise Store**: 内存缓存 - 不持久化

---

## 监控系统详解 ⭐⭐⭐

### 1. 监控系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                     应用层 (Vue App)                          │
├─────────────────────────────────────────────────────────────┤
│  监控触发点                                                    │
│  ├─ Vue组件生命周期 (mounted)                                 │
│  ├─ 路由守卫 (beforeEach/afterEach/onError)                  │
│  ├─ Axios拦截器 (request/response)                            │
│  ├─ 全局错误处理 (errorHandler)                               │
│  └─ 用户交互事件 (click/input/etc)                            │
├─────────────────────────────────────────────────────────────┤
│                  监控SDK层 (MonitorSDK)                        │
│  ├─ 数据采集 (Performance/Error/Behavior/Custom)             │
│  ├─ 数据过滤 (智能过滤/采样率控制)                              │
│  ├─ 数据队列 (批量上报/断网重试)                                │
│  └─ 数据上报 (Beacon API → Fetch API → Image降级)             │
├─────────────────────────────────────────────────────────────┤
│                  网络层 (Network)                             │
│  ├─ navigator.sendBeacon() - 首选                             │
│  ├─ fetch() with keepalive - 降级                             │
│  └─ Image() - 最终降级                                         │
├─────────────────────────────────────────────────────────────┤
│                  后端API (/api/monitor/report)                │
└─────────────────────────────────────────────────────────────┘
```

### 2. 监控SDK实现 (`utils/monitor/sdk.ts`)

#### 核心类结构
```typescript
class Monitor {
  config: MonitorConfig;
  sessionId: string;           // 会话ID（浏览器指纹）
  breadcrumbs: any[];         // 用户行为轨迹（面包屑）
  isInitialized: boolean;     // 初始化状态
  reportQueue: any[];         // 上报队列（断网缓存）

  // 初始化
  init(config: MonitorConfig) {
    this.config = { ...this.config, ...config };
    this.sessionId = config.sessionId || this.generateSessionId();
    this.isInitialized = true;
    
    // 注册自动采集
    this.registerAutoTracking();
    
    // 处理队列中的数据
    this.flushQueue();
  }

  // 自动数据采集
  registerAutoTracking() {
    // 1. JS错误监控
    if (autoTrackJsError) {
      window.addEventListener('error', (event) => {
        this.report({
          type: MonitorType.ERROR,
          level: MonitorLevel.ERROR,
          error_info: {
            error_type: 'js_error',
            message: event.error.message,
            stack: event.error.stack,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
          }
        });
      }, true);
    }

    // 2. Promise错误监控
    if (autoTrackPromiseError) {
      window.addEventListener('unhandledrejection', (event) => {
        this.report({
          type: MonitorType.ERROR,
          level: MonitorLevel.ERROR,
          error_info: {
            error_type: 'promise_error',
            message: event.reason.message || String(event.reason),
            stack: event.reason.stack || ''
          }
        });
      });
    }

    // 3. 页面访问监控
    if (autoTrackPageview) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          this.report({
            type: MonitorType.BEHAVIOR,
            level: MonitorLevel.INFO,
            behavior_info: {
              actionType: 'page_view',
              value: location.href,
              title: document.title
            }
          });
        }, 100);
      });

      // 监听SPA路由变化
      const originalPushState = history.pushState;
      history.pushState = (...args) => {
        originalPushState.apply(history, args);
        setTimeout(() => this.trackRouteChange(), 0);
      };
      
      window.addEventListener('popstate', () => {
        setTimeout(() => this.trackRouteChange(), 0);
      });
    }

    // 4. 性能指标监控
    if (autoTrackPerformance) {
      window.addEventListener('load', () => {
        setTimeout(() => this.collectPerformance(), 1000);
      });
    }
  }

  // 性能指标收集
  collectPerformance() {
    const performanceInfo: PerformanceInfo = {};
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navigation) {
      performanceInfo.DNSTime = navigation.domainLookupEnd - navigation.domainLookupStart;
      performanceInfo.TCPTime = navigation.connectEnd - navigation.connectStart;
      performanceInfo.requestTime = navigation.responseStart - navigation.requestStart;
      performanceInfo.responseTime = navigation.responseEnd - navigation.responseStart;
      performanceInfo.domReadyTime = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
      performanceInfo.loadTime = navigation.loadEventEnd - navigation.startTime;
      performanceInfo.TTFB = navigation.responseStart - navigation.requestStart;
    }

    // Web Vitals指标
    const fcpEntries = performance.getEntriesByName('first-contentful-paint', 'paint');
    if (fcpEntries.length > 0) {
      performanceInfo.FCP = Math.round(fcpEntries[0].startTime);
    }

    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    if (lcpEntries.length > 0) {
      const lastEntry = lcpEntries[lcpEntries.length - 1] as any;
      performanceInfo.LCP = Math.round(lastEntry.startTime);
    }

    this.report({
      type: MonitorType.PERFORMANCE,
      level: MonitorLevel.INFO,
      performance_info: performanceInfo
    });
  }

  // 数据上报
  async sendData(data: any) {
    const { reportUrl } = this.config;
    const dataStr = JSON.stringify(data);

    try {
      // 1. 优先使用项目的API方法
      if (typeof window !== 'undefined' && (window as any).__monitorApi) {
        await (window as any).__monitorApi(data);
        return;
      }

      // 2. 使用Beacon API（推荐）
      if (navigator.sendBeacon && dataStr.length < 65536) {
        const blob = new Blob([dataStr], { type: 'application/json' });
        const result = navigator.sendBeacon(reportUrl, blob);
        if (result) return;
      }

      // 3. 降级到Fetch API
      await fetch(reportUrl, {
        method: 'POST',
        body: dataStr,
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors',
        credentials: 'omit',
        keepalive: true
      });
    } catch (error) {
      console.error('监控数据上报失败:', error);
      
      // 4. 最后的降级方案：Image请求
      const img = new Image();
      const simpleData = {
        event_type: data.event_type,
        page_url: data.page_url,
        timestamp: data.timestamp
      };
      img.src = `${reportUrl}?data=${encodeURIComponent(JSON.stringify(simpleData))}&t=${Date.now()}`;
    }
  }
}

export const MonitorSDK = new Monitor();
```

### 3. 监控插件集成 (`utils/monitor/index.ts`)

#### 初始化配置
```typescript
export async function initMonitor() {
  const browserId = await getBrowserFingerprint();
  
  MonitorSDK.init({
    appId: 'macbonhi-blog-user',
    appVersion: '1.0.0',
    reportUrl: `/api/monitor/report`,
    sessionId: browserId, // 浏览器指纹作为会话ID
    deviceInfo: getDeviceInfo(),
    
    // 监控开关
    autoTrackPageview: true,     // ✅ 页面访问监控
    autoTrackJsError: true,      // ✅ 错误监控
    autoTrackPromiseError: true, // ✅ Promise错误监控
    autoTrackResource: false,    // ❌ 关闭资源监控
    autoTrackPerformance: true,  // ✅ 性能监控
    
    // 性能优化配置
    maxBreadcrumbs: 10,          // 行为轨迹记录数：10条
    sampling: 0.3,               // 采样率：30%
    
    // 忽略列表
    ignoreUrls: [
      '/sockjs-node', 
      '/monitor/report',
      '/api/monitor',
      '/hot-update',
      '/__vite_ping',
      '/favicon.ico',
      '.map$'
    ]
  });
}
```

#### 智能过滤和批量上报
```typescript
// ✅ 批量上报系统
let reportQueue: any[] = [];
let lastFlushTime = Date.now();
const FLUSH_INTERVAL = 10000; // 10秒上报一次
const MAX_QUEUE_SIZE = 10;    // 队列最大10条记录

const originalReport = MonitorSDK.report.bind(MonitorSDK);
MonitorSDK.report = function(data) {
  // ✅ 智能过滤：只上报重要数据
  if (!shouldReport(data)) {
    return Promise.resolve();
  }
  
  // 添加到队列
  reportQueue.push(data);
  
  // 触发条件：队列满了 或 时间到了
  const now = Date.now();
  if (reportQueue.length >= MAX_QUEUE_SIZE || (now - lastFlushTime) >= FLUSH_INTERVAL) {
    flushReports();
  }
  
  return Promise.resolve();
};

// ✅ 智能过滤函数
function shouldReport(data: any): boolean {
  // 1. 错误始终上报（最高优先级）
  if (data.type === MonitorType.ERROR) {
    return true;
  }
  
  // 2. 性能数据采样上报（20%概率）
  if (data.type === MonitorType.PERFORMANCE) {
    return Math.random() < 0.2;
  }
  
  // 3. 页面访问始终上报
  if (data.behavior_info?.actionType === 'page_view') {
    return true;
  }
  
  // 4. 路由变化始终上报
  if (data.behavior_info?.actionType === 'route_change_complete') {
    return true;
  }
  
  // 5. 其他行为数据采样上报（10%概率）
  if (data.type === MonitorType.BEHAVIOR) {
    return Math.random() < 0.1;
  }
  
  // 默认不上报
  return false;
}

// ✅ 批量上报函数
async function flushReports() {
  if (reportQueue.length === 0) return;
  
  const reportsToSend = [...reportQueue];
  reportQueue = [];
  lastFlushTime = Date.now();
  
  try {
    await Promise.all(reportsToSend.map(report => originalReport(report)));
    console.log(`📊 监控数据批量上报成功: ${reportsToSend.length} 条记录`);
  } catch (error) {
    console.warn('⚠️ 监控数据上报失败:', error);
    // 重要数据重新加入队列重试
    const importantReports = reportsToSend.filter(report => 
      report.type === MonitorType.ERROR || 
      report.behavior_info?.actionType === 'page_view'
    );
    reportQueue.unshift(...importantReports);
  }
}
```

#### 页面卸载时数据上报（断网处理）
```typescript
// ✅ 页面卸载时强制上报剩余数据
window.addEventListener('beforeunload', () => {
  if (reportQueue.length > 0) {
    // 使用 sendBeacon API 确保数据能够发送
    try {
      const data = JSON.stringify(reportQueue);
      navigator.sendBeacon('/api/monitor/report', data);
    } catch (error) {
      console.warn('页面卸载时数据上报失败:', error);
    }
  }
});
```

### 4. Vue插件安装
```typescript
export const MonitorPlugin = {
  install: (app: App) => {
    initMonitor().then(sdk => {
      // 注册全局属性
      app.config.globalProperties.$monitor = sdk;
      
      // 注册Vue错误处理
      app.config.errorHandler = (err, vm, info) => {
        sdk.report({
          type: MonitorType.ERROR,
          level: MonitorLevel.ERROR,
          error_info: {
            error_type: 'vue_error',
            message: err instanceof Error ? err.message : String(err),
            stack: err instanceof Error ? err.stack : '',
            component: vm?.$options?.name || 'AnonymousComponent',
            info
          }
        });
        
        console.error('Vue Error:', err);
      };
      
      // 监控路由错误
      const router = app.config.globalProperties.$router;
      if (router) {
        router.onError((error: Error) => {
          sdk.report({
            type: MonitorType.ERROR,
            level: MonitorLevel.ERROR,
            error_info: {
              error_type: 'router_error',
              message: error.message,
              stack: error.stack || ''
            }
          });
        });
      }
    });
  }
};
```

### 5. 监控数据类型

#### 错误监控 (MonitorType.ERROR)
- **JS错误**: `error_type: 'js_error'`
- **Promise错误**: `error_type: 'promise_error'`
- **资源加载错误**: `error_type: 'resource_error'`
- **网络请求错误**: `error_type: 'response_error'`
- **Vue组件错误**: `error_type: 'vue_error'`
- **路由错误**: `error_type: 'route_error'`

#### 性能监控 (MonitorType.PERFORMANCE)
- **页面加载性能**: DNS时间、TCP时间、请求时间、响应时间、DOM解析时间
- **Web Vitals**: FCP、LCP、FID、CLS
- **慢请求**: 超过1秒的API请求
- **慢导航**: 超过1秒的路由跳转

#### 行为监控 (MonitorType.BEHAVIOR)
- **页面访问**: `actionType: 'page_view'`
- **路由变化**: `actionType: 'route_change_complete'`
- **组件访问**: `actionType: 'component_view'`
- **用户交互**: 按钮点击、输入等

#### 自定义事件 (MonitorType.CUSTOM)
- **SDK初始化**: `event_name: 'sdk_init_success'`
- **业务事件**: 任意自定义事件

### 6. 组件级监控示例

#### MonitorExample.vue
```vue
<template>
  <div class="monitor-example">
    <a-button @click="triggerCustomEvent">记录自定义事件</a-button>
    <a-button danger @click="triggerError">触发错误</a-button>
    <a-button @click="triggerPromiseError">触发Promise错误</a-button>
    <a-button @click="triggerNetworkError">触发网络错误</a-button>
  </div>
</template>

<script lang="ts">
export default defineComponent({
  name: 'MonitorExample',
  
  // ✅ 组件访问统计
  mounted() {
    this.$monitor.report({
      type: MonitorType.BEHAVIOR,
      level: MonitorLevel.INFO,
      event_name: 'component_view',
      behavior_info: {
        actionType: 'component_view',
        value: 'MonitorExample'
      }
    });
  },
  
  methods: {
    // ✅ 自定义事件监控
    triggerCustomEvent() {
      this.$monitor.report({
        type: MonitorType.CUSTOM,
        level: MonitorLevel.INFO,
        event_name: 'custom_button_click',
        behavior_info: {
          actionType: 'button_click',
          value: '记录自定义事件',
          element_path: 'MonitorExample > a-button:nth-child(1)'
        }
      });
    },
    
    // ✅ JS错误监控
    triggerError() {
      try {
        const obj = null;
        obj.nonExistentMethod();
      } catch (error) {
        this.$monitor.report({
          type: MonitorType.ERROR,
          level: MonitorLevel.ERROR,
          event_name: 'js_error',
          error_info: {
            error_type: 'js_error',
            message: error.message,
            stack: error.stack,
            component: 'MonitorExample'
          }
        });
      }
    }
  }
});
</script>
```

### 7. 监控生命周期总结

```
┌───────────────────────────────────────────────────────────┐
│ 1. 应用初始化阶段 (main.ts)                                 │
│    ├─ 创建Pinia实例                                         │
│    ├─ 初始化主题Store                                       │
│    ├─ 注册MonitorPlugin                                    │
│    │   └─ 执行initMonitor()                                │
│    │       ├─ 获取浏览器指纹 (FingerprintJS)               │
│    │       ├─ 初始化MonitorSDK                             │
│    │       ├─ 注册自动监控（error/promise/pageview/perf）   │
│    │       └─ 注入全局__monitorApi                         │
│    └─ 挂载Vue应用                                           │
├───────────────────────────────────────────────────────────┤
│ 2. 页面加载阶段 (window.load)                               │
│    ├─ 触发page_view事件（100ms延迟）                        │
│    └─ 收集性能指标（1000ms延迟）                             │
│        └─ 上报Performance数据                              │
├───────────────────────────────────────────────────────────┤
│ 3. 路由导航阶段 (router.beforeEach/afterEach)               │
│    ├─ beforeEach: 记录startTime                            │
│    │   └─ 上报route_change_start事件                       │
│    ├─ afterEach: 计算duration                              │
│    │   ├─ 上报route_change_complete事件                    │
│    │   └─ 如果duration>1000ms，上报slow_navigation         │
│    └─ onError: 上报route_error                             │
├───────────────────────────────────────────────────────────┤
│ 4. 组件生命周期阶段 (Vue组件)                                │
│    └─ mounted: 上报component_view事件                      │
├───────────────────────────────────────────────────────────┤
│ 5. 网络请求阶段 (axios拦截器)                                │
│    ├─ request拦截器: 记录startTime                          │
│    ├─ response拦截器: 计算duration                          │
│    │   └─ 如果duration>1000ms，上报slow_request            │
│    └─ error拦截器: 上报response_error                       │
├───────────────────────────────────────────────────────────┤
│ 6. 错误捕获阶段 (全局错误处理)                               │
│    ├─ window.error: 上报js_error                           │
│    ├─ window.unhandledrejection: 上报promise_error         │
│    └─ app.config.errorHandler: 上报vue_error               │
├───────────────────────────────────────────────────────────┤
│ 7. 用户交互阶段 (手动上报)                                   │
│    └─ 组件内调用this.$monitor.report()                     │
├───────────────────────────────────────────────────────────┤
│ 8. 数据上报阶段 (批量上报机制)                               │
│    ├─ 智能过滤: shouldReport()                              │
│    ├─ 加入队列: reportQueue.push()                         │
│    ├─ 触发上报:                                             │
│    │   ├─ 队列满（10条） OR                                 │
│    │   └─ 时间到（10秒）                                    │
│    └─ 批量发送: flushReports()                              │
│        ├─ 成功: 清空队列                                     │
│        └─ 失败: 重要数据重新入队                             │
├───────────────────────────────────────────────────────────┤
│ 9. 页面卸载阶段 (window.beforeunload)                       │
│    └─ 使用sendBeacon强制上报剩余数据                        │
└───────────────────────────────────────────────────────────┘
```

### 8. 断网处理机制 ✨

#### 断网时的数据缓存
```typescript
// 1. 数据加入队列而非立即发送
reportQueue.push(data);

// 2. 上报失败时重试
catch (error) {
  console.warn('⚠️ 监控数据上报失败:', error);
  // 重要数据（错误和页面访问）重新加入队列
  const importantReports = reportsToSend.filter(report => 
    report.type === MonitorType.ERROR || 
    report.behavior_info?.actionType === 'page_view'
  );
  reportQueue.unshift(...importantReports);
}

// 3. 页面卸载时使用Beacon API确保发送
window.addEventListener('beforeunload', () => {
  if (reportQueue.length > 0) {
    navigator.sendBeacon('/api/monitor/report', JSON.stringify(reportQueue));
  }
});
```

#### 上报策略的三层降级
```typescript
// 1. Beacon API（最佳）- 不阻塞页面，即使页面关闭也能发送
if (navigator.sendBeacon && dataStr.length < 65536) {
  const blob = new Blob([dataStr], { type: 'application/json' });
  navigator.sendBeacon(reportUrl, blob);
}

// 2. Fetch API with keepalive（备选）- 保持连接活跃
await fetch(reportUrl, {
  method: 'POST',
  body: dataStr,
  keepalive: true
});

// 3. Image请求（最后降级）- 兼容性最好
const img = new Image();
img.src = `${reportUrl}?data=${encodeURIComponent(JSON.stringify(simpleData))}`;
```

---

## 性能优化策略

### 1. 路由级懒加载
```typescript
// 首页同步加载
import IndexView from '../views/indexView.vue';

// 其他页面懒加载
const GalleryView = () => import('../views/GalleryView.vue');
const ArticleView = () => import('../views/ArticleView.vue');
```

### 2. API智能缓存
- 双层缓存：内存缓存 + localStorage
- LRU策略：最多100条内存缓存
- 不同数据不同TTL
- 支持强制刷新和预加载

### 3. 监控数据采样
- 错误数据：100%上报
- 性能数据：20%采样
- 页面访问：100%上报
- 路由变化：100%上报
- 其他行为：10%采样

### 4. 批量上报机制
- 10秒上报一次 OR 队列满10条
- 减少网络请求次数
- 降低服务器压力

### 5. 图片懒加载（推测）
虽然代码中未明确展示，但Gallery组件很可能使用了图片懒加载。

---

## 总结

### 架构优点
1. **模块化清晰**: 路由、Store、组件、工具函数分离明确
2. **监控系统完善**: 覆盖错误、性能、行为、自定义事件
3. **性能优化到位**: 懒加载、缓存、采样、批量上报
4. **用户体验友好**: 浏览器指纹、主题切换、断网处理
5. **类型安全**: TypeScript全面使用
6. **响应式设计**: Pinia响应式状态管理

### 可改进点
1. **组件通信**: 可考虑使用Provide/Inject减少props传递
2. **监控可视化**: 可添加监控面板展示实时数据
3. **错误边界**: 可添加错误边界组件防止整个应用崩溃
4. **单元测试**: 缺少测试覆盖
5. **文档注释**: 部分函数缺少详细注释

### 关键技术点
- ✅ 浏览器指纹技术（FingerprintJS）
- ✅ Beacon API上报
- ✅ 智能批量上报
- ✅ 断网数据缓存
- ✅ Web Vitals性能指标
- ✅ Vue 3 Composition API
- ✅ Pinia状态持久化
- ✅ Axios拦截器监控
- ✅ 路由守卫监控
- ✅ 双层API缓存系统

