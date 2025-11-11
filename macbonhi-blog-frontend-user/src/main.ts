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
// ✅ 性能优化：移除全量图标引入，改为按需引入
// 全量引入会增加 2-3MB 的 bundle 大小，严重影响首屏加载速度
// 现在各组件已采用按需引入方式：import { IconName } from '@ant-design/icons-vue'

// 防止以太坊相关脚本重新定义ethereum属性
if (typeof window !== 'undefined' && window.ethereum) {
  Object.defineProperty(Object.getPrototypeOf(window), 'ethereum', {
    value: window.ethereum,
    configurable: false,
    writable: false
  });
}

// 导入监控插件
import { MonitorPlugin } from './utils/monitor';

// 导入调试工具（仅开发环境）
if (import.meta.env.DEV) {
  import('./utils/debug');
}

// 🔧 修复：移除highlight.js默认CSS，使用content.vue中的自定义One Dark Pro主题
// import 'highlight.js/styles/vs2015.css';  // 已移除，避免与自定义样式冲突

// 导入并初始化Markdown渲染器
import { initMarkdownRenderer } from './utils/markdown';

// 异步初始化Markdown渲染器
initMarkdownRenderer().then(() => {
  console.log('✅ Markdown渲染器初始化完成');
}).catch(error => {
  console.warn('⚠️ Markdown渲染器初始化失败，将使用基础渲染:', error);
});

const pinia = createPinia();

pinia.use(piniaPluginPersistedstate);

const app = createApp(App);

// 先安装 Pinia
app.use(pinia)

// 然后初始化主题
const themeStore = useThemeStore()
themeStore.initTheme()

// 注册监控插件
app.use(MonitorPlugin);

// 最后安装其他插件和挂载应用
app.use(Antd).use(router).mount('#app');