import { createWebHistory, createRouter } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useUserStore } from '../store/user'
import { routePerformanceMonitor } from '../utils/routePerformance'

// 布局组件使用静态导入（因为是基础布局，需要立即可用）
import IndexView from '../views/IndexView.vue'
import FullWidthView from '../views/FullWidthView.vue'

// 页面组件使用动态导入（懒加载）实现代码分割
// 使用 webpackChunkName 注释来指定chunk名称，便于调试和优化
const Overview = () => import(/* webpackChunkName: "overview" */ '../views/OverView.vue')
const LocalFileView = () => import(/* webpackChunkName: "local-file" */ '../views/localFileView.vue')
const ArticleView = () => import(/* webpackChunkName: "article" */ '../views/ArticalView.vue')
const GalleryView = () => import(/* webpackChunkName: "gallery" */ '../views/GalleryView.vue')
const DiaryView = () => import(/* webpackChunkName: "diary" */ '../views/DiaryView.vue')
const EditGallery = () => import(/* webpackChunkName: "edit-gallery" */ '../views/EditGallery.vue')
const EditArticle = () => import(/* webpackChunkName: "edit-article" */ '../views/EditArtical.vue')
const LoginView = () => import(/* webpackChunkName: "auth" */ '../views/LoginRegisterView.vue')
const NotFound = () => import(/* webpackChunkName: "error" */ '../views/notFound.vue')
const SettingView = () => import(/* webpackChunkName: "settings" */ '../views/settingView.vue')

// 路由预加载策略
const preloadRoutes = {
  // 高优先级路由（用户登录后很可能访问的页面）
  critical: ['overview', 'article'],
  // 中优先级路由（用户可能访问的页面）
  normal: ['gallery', 'diary', 'local-file'],
  // 低优先级路由（使用频率较低的页面）
  low: ['settings', 'edit-article', 'edit-gallery']
}

// 预加载函数
const preloadComponent = (importFn: () => Promise<any>) => {
  // 在空闲时间预加载组件
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => importFn())
  } else {
    // 降级处理：使用setTimeout
    setTimeout(() => importFn(), 100)
  }
}

// 导出预加载函数供其他地方使用
export const preloadCriticalRoutes = () => {
  preloadComponent(Overview)
  preloadComponent(ArticleView)
}

export const preloadNormalRoutes = () => {
  preloadComponent(GalleryView)
  preloadComponent(DiaryView)
  preloadComponent(LocalFileView)
}

export const preloadLowRoutes = () => {
  preloadComponent(SettingView)
  preloadComponent(EditArticle)
  preloadComponent(EditGallery)
}

const routes: RouteRecordRaw[] = [
  {
    // 带侧边栏的布局 - 需要登录权限的页面
    path: '/',
    component: IndexView,
    meta: { 
      requiresAuth: true,
      title: '管理后台'
    },
    children: [
      {
        path: '',
        redirect: '/overview'
      },
      {
        path: 'overview',
        name: 'Overview',
        component: Overview,
        meta: { 
          title: '数据概览',
          icon: 'DashboardOutlined',
          keepAlive: true // 缓存该组件
        }
      },
      {
        path: 'local-file',
        name: 'LocalFile',
        component: LocalFileView,
        meta: { 
          title: '文件管理',
          icon: 'FolderOutlined'
        }
      },
      {
        path: 'articles',
        name: 'ArticleView',
        component: ArticleView,
        meta: { 
          title: '文章管理',
          icon: 'FileTextOutlined'
        }
      },
      {
        path: 'gallery',
        name: 'PhotoView',
        component: GalleryView,
        meta: { 
          title: '相册管理',
          icon: 'PictureOutlined'
        }
      },
      {
        path: 'diary',
        name: 'DiaryView',
        component: DiaryView,
        meta: { 
          title: '日记管理',
          icon: 'BookOutlined'
        }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: SettingView,
        meta: { 
          title: '系统设置',
          icon: 'SettingOutlined'
        }
      }
    ],
  },
  // 全宽布局的页面（编辑页面不需要侧边栏）
  {
    path: '/editor',
    component: FullWidthView,
    meta: { 
      requiresAuth: true,
      title: '编辑器'
    },
    children: [
      {
        path: 'gallery/:id?',
        name: 'EditPhoto',
        component: EditGallery,
        meta: { 
          title: '编辑相册',
          hideInMenu: true
        }
      },
      {
        path: 'article/:id?',
        name: 'EditArticle',
        component: EditArticle,
        meta: { 
          title: '编辑文章',
          hideInMenu: true
        }
      }
    ]
  },
  // 无需权限的页面
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { 
      title: '登录',
      hideInMenu: true,
      guestOnly: true // 只有未登录用户可访问
    }
  },
  {
    path: '/register',
    name: 'Register', 
    component: LoginView,
    meta: { 
      title: '注册',
      hideInMenu: true,
      guestOnly: true
    }
  },
  {
    path: '/404',
    name: 'NotFound',
    component: NotFound,
    meta: { 
      title: '页面未找到',
      hideInMenu: true
    }
  },
  // 添加通配符路径，匹配所有未定义的路由，重定向到404页面
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
  }
]

const router = createRouter({
  history: createWebHistory('/admin/'),
  routes,
})

// 路由守卫 - 权限控制和性能优化
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  
  // 开始性能监控
  if (to.name) {
    routePerformanceMonitor.startRouteLoad(to.name as string, to.path)
  }
  
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 管理后台`
  }
  
  // 导航预加载策略 - 根据目标路由预加载相关资源
  const preloadForRoute = (routeName: string) => {
    switch (routeName) {
      case 'Overview':
        // 进入概览页面时，预加载常用组件
        preloadComponent(ArticleView)
        preloadComponent(GalleryView)
        break
      case 'ArticleView':
        // 进入文章管理时，预加载编辑器
        preloadComponent(EditArticle)
        break
      case 'PhotoView':
        // 进入相册管理时，预加载编辑器
        preloadComponent(EditGallery)
        break
      case 'DiaryView':
        // 进入日记管理时，预加载相关组件
        preloadComponent(ArticleView) // 日记和文章功能相似
        break
    }
  }
  
  // 执行预加载
  if (to.name) {
    preloadForRoute(to.name as string)
  }
  
  // 检查是否需要登录权限
  if (to.meta.requiresAuth) {
    if (!userStore.token) {
      // 保存用户想要访问的页面，登录后跳转
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
      return
    }
    
    // 验证token的有效性（可选：实际项目中可能需要验证token是否过期）
    try {
      // 这里可以添加token验证逻辑
      // await userStore.validateToken()
      next()
    } catch (error) {
      // token无效，清除并跳转到登录页
      userStore.logout()
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
    }
  } 
  // 检查是否是只有未登录用户可访问的页面
  else if (to.meta.guestOnly) {
    if (userStore.token) {
      // 已登录用户访问登录/注册页面，重定向到首页
      next('/')
      return
    }
    next()
  } 
  // 公开页面
  else {
    next()
  }
})

// 路由加载后的钩子 - 用于页面加载完成后的处理
router.afterEach((to, from) => {
  // 结束性能监控
  if (to.name) {
    routePerformanceMonitor.endRouteLoad(
      to.name as string, 
      to.path, 
      from.name as string
    )
  }
  
  // 页面切换完成后的处理
  // 可以在这里添加埋点、分析等逻辑
  
  // 滚动到页面顶部（除非是同一个页面的不同参数）
  if (to.path !== from.path) {
    window.scrollTo(0, 0)
  }
  
  // 智能预加载：根据当前页面预加载相关页面
  const currentRouteName = to.name as string
  
  // 如果刚登录成功，预加载关键路由
  if (currentRouteName === 'Overview' && from.name === 'Login') {
    preloadNormalRoutes()
    // 延迟预加载低优先级路由
    setTimeout(() => {
      preloadLowRoutes()
    }, 2000)
  }
  
  // 基于用户行为的智能预加载
  switch (currentRouteName) {
    case 'Overview':
      // 从概览页很可能去文章管理或相册管理
      preloadComponent(ArticleView)
      preloadComponent(GalleryView)
      break
    case 'ArticleView':
      // 从文章列表很可能去编辑文章
      preloadComponent(EditArticle)
      break
    case 'PhotoView':
      // 从相册列表很可能去编辑相册
      preloadComponent(EditGallery)
      break
  }
})


export default router;