import { createApp } from 'vue'
import Antd from 'ant-design-vue';
import './style.css'
import App from './App.vue'
import 'ant-design-vue/dist/reset.css';
import { createPinia } from 'pinia';
import './style/theme.css' 
import { useThemeStore } from './store/theme'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import router from './router'
import { startRoutePreloader } from './utils/routePreloader'

// 优化前: 导入所有图标并全局注册
// import * as Icons from "@ant-design/icons-vue";

// 优化后: 只导入实际使用到的图标
// 根据项目中使用到的图标按需导入，这里列出了常用图标作为示例
import { 
  UploadOutlined, 
  FileOutlined, 
  HomeOutlined,
  UserOutlined,
  SettingOutlined,
  PictureOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BarsOutlined
} from "@ant-design/icons-vue";

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
const app = createApp(App);

// 优化前: 注册所有图标，即使未使用
// const icons: any = Icons;
// for (const i in icons) {
//     app.component(i, icons[i]);
// }

// 优化后: 仅注册实际使用的图标
// 创建一个包含实际使用图标的对象
const usedIcons = {
  UploadOutlined, 
  FileOutlined, 
  HomeOutlined,
  UserOutlined,
  SettingOutlined,
  PictureOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BarsOutlined
};

// 只注册使用到的图标
for (const iconName in usedIcons) {
  app.component(iconName, usedIcons[iconName]);
}

// 先安装 Pinia
app.use(pinia)

// 然后初始化主题
const themeStore = useThemeStore()
themeStore.initTheme()

// 初始化缓存系统
import { useCacheStore } from './store/cache'
const cacheStore = useCacheStore()
cacheStore.initCache()

// 初始化内存监控和管理
import { memoryMonitor } from './utils/memoryMonitor'
import { memoryPressureManager } from './utils/memoryPressureManager'

if (import.meta.env.PROD) {
  // 生产环境启用内存监控
  memoryMonitor.startMonitoring(60000) // 每分钟检查一次
  
  // 添加内存压力处理
  memoryMonitor.onMemoryPressure(async (pressure) => {
    if (pressure === 'critical') {
      // 紧急清理
      await memoryPressureManager.forceCleanup()
    } else if (pressure === 'moderate') {
      // 常规压力管理
      await memoryPressureManager.manage()
    }
  })
  
  // 定期检查内存压力
  setInterval(async () => {
    await memoryPressureManager.manage()
  }, 5 * 60 * 1000) // 每5分钟检查一次
  
} else {
  // 开发环境也启用轻量级监控
  memoryMonitor.startMonitoring(120000) // 每2分钟检查一次
}

// 最后安装其他插件和挂载应用
app.use(Antd).use(router).mount('#app');

// 应用挂载完成后，启动路由预加载策略
// 在生产环境中启用预加载，开发环境中可以通过环境变量控制
const enablePreload = import.meta.env.PROD || import.meta.env.VITE_ENABLE_PRELOAD === 'true'

if (enablePreload) {
  // 等待应用完全初始化后再开始预加载
  setTimeout(() => {
    startRoutePreloader({
      enabled: true,
      delays: {
        critical: 2000,  // 应用启动2秒后预加载关键路由
        normal: 5000,    // 5秒后预加载普通路由  
        low: 10000       // 10秒后预加载低优先级路由
      },
      checkNetworkCondition: true
    })
  }, 1000)
} else {
  console.log('开发环境：路由预加载已禁用')
}