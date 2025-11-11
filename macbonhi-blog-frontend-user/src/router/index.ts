import { createWebHistory, createRouter, RouteLocationNormalized, RouteRecordRaw } from 'vue-router'
import { useUserStore } from '../store/user'
import { MonitorSDK, MonitorType, MonitorLevel } from '../utils/monitor/sdk'

// ✅ 性能优化：实现路由级懒加载，减少首屏 JS Bundle 大小

// 导入布局组件（保持同步导入，因为它是基础组件）
import FullWidthView from '../views/FullWidthView.vue'

// ✅ 懒加载页面组件 - 按优先级分类
// 关键页面：首页保持同步加载，确保最快访问速度
import IndexView from '../views/indexView.vue'

// 次要页面：懒加载，带预加载提示
const GalleryView = () => import('../views/GalleryView.vue')
const FilesView = () => import('../views/FilesView.vue')
const DiaryView = () => import('../views/DiaryView.vue')
const ArticleView = () => import('../views/ArticleView.vue')
const AboutView = () => import('../views/AboutView.vue')

// 重型页面：懒加载，1254行的搜索页面是最大的性能负担
const SearchView = () => import('../views/searchView.vue')

// 扩展路由元数据类型
declare module 'vue-router' {
  interface RouteMeta {
    startTime?: number;
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: FullWidthView,
    children: [
      {
        path: '',
        redirect: '/index'
      },
      {
        path: '/index',
        name: 'Index',
        component: IndexView,
      },
      {
        path: '/gallery',
        name: 'Gallery',
        component: GalleryView,
      },
      {
        path: '/files',
        name: 'Files',
        component: FilesView,
      },
      {
        path: '/diary',
        name: 'Diary',
        component: DiaryView,
      },
      {
        path: '/article',
        name: 'Article',
        component: ArticleView,
      },
      {
        path: '/about',
        name: 'About',
        component: AboutView,
      }
    ]
  },
  // 搜索页面作为独立路由，脱离FullWidthView布局
  {
    path: '/search',
    name: 'Search',
    component: SearchView,
  }
]       

const router = createRouter({
  history: createWebHistory(),
  routes,
})

//在路由请求之前
router.beforeEach((to, from, next) => {
  // 添加路由跳转开始时间戳
  const startTime = Date.now();
  
  // 记录在route对象上，以便在afterEach中使用
  to.meta.startTime = startTime;

  // 记录路由开始跳转事件
  MonitorSDK.report({
    type: MonitorType.BEHAVIOR,
    level: MonitorLevel.INFO,
    event_type: 'behavior',
    event_name: 'route_change_start',
    page_url: to.path,
    behavior_info: {
      actionType: 'route_change_start',
      from: from.path,
      to: to.path,
      timestamp: startTime
    }
  });
  
  // 可以在这里添加权限检查
  // const userStore = useUserStore();
  // if (to.meta.requiresAuth && !userStore.token) {
  //   next('/login');
  // } else {
  //   next();
  // }
  
  next();
});

// 在路由导航完成后
router.afterEach((to, from) => {
  const endTime = Date.now();
  const duration = endTime - (to.meta.startTime || endTime);
  
  // 记录路由完成事件
  MonitorSDK.report({
    type: MonitorType.BEHAVIOR,
    level: MonitorLevel.INFO,
    event_type: 'behavior',
    event_name: 'route_change_complete',
    page_url: to.path,
    behavior_info: {
      actionType: 'route_change_complete',
      from: from.path,
      to: to.path,
      routeName: to.name,
      duration: duration
    },
    // 如果导航时间超过1秒，同时记录性能指标
    ...(duration > 1000 ? {
      type: MonitorType.PERFORMANCE,
      event_type: 'performance',
      performance_info: {
        slow_navigation: duration
      }
    } : {})
  });
});

// 路由错误监控
router.onError((error) => {
  MonitorSDK.report({
    type: MonitorType.ERROR,
    level: MonitorLevel.ERROR,
    event_type: 'error',
    event_name: 'route_error',
    error_info: {
      error_type: 'route_error',
      message: error.message,
      stack: error.stack
    }
  });
});

export default router;