<template>
  <div class="home-page">
    <!-- Hero区 -->
    <HeroBanner class="hero-banner"/>
    
    <!-- 快捷入口/滚动屏 -->
    <QuickNav />
    
    <!-- 文章区 -->
    <section class="home-section article-section">
      <div class="section-header">
        <h2 class="section-title">博客文章</h2>
        <p class="section-desc">我的所思、所想，像模像样的文章...</p>
      </div>
      <IndexArticle @articleClick="showArticleDetail" :limit="4" />
      <div class="section-footer">
        <button class="more-btn" @click="goToArticlePage">更多</button>
      </div>
    </section>
    
    <!-- 随笔随记区 -->
    <section class="home-section diary-section">
      <div class="section-header">
        <h2 class="section-title">随笔随记</h2>
        <p class="section-desc">我的日常记录...</p>
      </div>
      <IndexDiary />
      <div class="section-footer">
        <button class="more-btn" @click="goToDiaryPage">更多</button>
      </div>
    </section>
    
    <!-- 图库区 -->
    <section class="home-section gallery-section">
      <div class="section-header">
        <h2 class="section-title">摄影图库</h2>
        <p class="section-desc">将美好的回忆和漂亮的相片留下来...</p>
      </div>
      <IndexGallery @galleryClick="handleGalleryClick" :limit="5" />
      <div class="section-footer">
        <button class="more-btn" @click="goToGalleryPage">更多</button>
      </div>
    </section>
    
    <!-- 下载区 -->
    <section class="home-section download-section">
      <div class="section-header">
        <h2 class="section-title">下载</h2>
        <p class="section-desc">一些有用的资源和工具</p>
      </div>
      <IndexDownload :limit="4" />
      <div class="section-footer">
        <button class="more-btn" @click="goToDownloadPage">更多</button>
      </div>
    </section>
    
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
// 只需引入各区块组件即可，内容后续细化
import HeroBanner from '../views/HeroBanner.vue'
import QuickNav from '../components/QuickNav-DataView/QuickNav.vue'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import { useSubsetStore } from '../store/subset'
import ArticleContent from '../components/ArticleGalleryContent/content.vue'
import type { ArticalData } from '../utils/typeof'
import { getBrowserFingerprint } from '../utils/fingerprint'
import { useSubset } from '../hooks/subset'
import { reportMonitorApi } from '../api/index'
import IndexGallery from '../components/IndexCommpents/IndexGallery.vue'
import IndexArticle from '../components/IndexCommpents/IndexArticle.vue'
import IndexDiary from '../components/IndexCommpents/IndexDiary.vue'
import IndexDownload from '../components/IndexCommpents/IndexDownload.vue'

// 路由
const router = useRouter()

// 用户数据
const userStore = useUserStore()
const subsetStore = useSubsetStore()

// 使用subset hook获取分类数据
const { rawSubset } = useSubset()

// 浏览器指纹
const browserId = ref('')

// 文章详情抽屉
const drawerVisible = ref(false)
const currentArticle = ref<ArticalData | null>(null)

// 显示文章详情
const showArticleDetail = (article: ArticalData) => {
  currentArticle.value = article
  drawerVisible.value = true
}

// 关闭抽屉
const closeDrawer = () => {
  drawerVisible.value = false
}

// 跳转到文章页面
const goToArticlePage = () => {
  router.push('/article')
}

// 跳转到日记页面
const goToDiaryPage = () => {
  router.push('/diary')
}

// 处理图库点击
const handleGalleryClick = (gallery: ArticalData) => {
}

// 跳转到图库页面
const goToGalleryPage = () => {
  router.push('/gallery')
}

// 跳转到下载页面
const goToDownloadPage = () => {
  router.push('/files')
}

// 上报首页访问统计
const reportPageView = async () => {
  try {
    const browserId = await getBrowserFingerprint()
    await reportMonitorApi({
      event_type: 'behavior',           // 🔧 修复：使用正确的事件类型
      event_name: 'page_view',         // 🔧 修复：使用正确的事件名称
      page_url: window.location.href,  // 🔧 修复：使用正确的字段名
      app_id: 'blog_frontend',
      session_id: browserId,
      device_info: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        screen: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      timestamp: Date.now(),
      referrer: document.referrer || '',
      level: 'info'
    })
    console.log('✅ 首页访问统计上报成功')
  } catch (error) {
    console.error('❌ 首页访问统计上报失败:', error)
  }
}

// 初始化数据
onMounted(async () => {
  try {
    // 获取浏览器指纹
    browserId.value = await getBrowserFingerprint()

    // 上报首页访问统计
    await reportPageView()

    // 获取所有需要的分类数据
    await Promise.all([
      rawSubset(0),  // 文章分类
      rawSubset(2)   // 文件分类
    ])
  } catch (error) {
    console.error('初始化数据失败:', error)
  }
})
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
  background: transparent;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding: 0 20px;
}

.home-section {
  margin: 0 auto;
  width: 100%;
  padding: 30px 0;
  box-sizing: border-box;
}

.section-header {
  margin-bottom: 32px;
}

.section-title {
  font-size: 24px;
  font-weight: bold;
  margin: 0 0 8px 0;
  color: var(--text-color);
}

.section-desc {
  font-size: 14px;
  color: var(--gray-500);
  margin: 0;
}

.section-footer {
  display: flex;
  justify-content: center;
  margin-top: 40px;
}

.more-btn {
  background-color: transparent;
  border: 1px solid #ccc;
  color: var(--text-color);
  padding: 8px 24px;
  border-radius: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.more-btn:hover {
  background-color: var(--gray-100);
}

/* 深色模式适配 */
[data-theme="dark"] .more-btn:hover {
  background-color: var(--gray-700);
}

/* 文章区样式 */
.article-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.article-item {
  border-radius: 8px;
  overflow: hidden;
  background: var(--background-topbar);
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;
  cursor: pointer;
}

.article-item:hover {
  transform: translateY(-4px);
}

.article-cover {
  width: 100%;
  height: 0;
  padding-bottom: 56.25%; /* 16:9 比例 */
  position: relative;
  overflow: hidden;
}

.article-cover img {
  position: absolute;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.article-content {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.article-title {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
}

.article-date {
  color: var(--gray-500);
  font-size: 12px;
  margin: 0 0 12px 0;
}

.article-desc {
  color: var(--gray-600);
  font-size: 14px;
  line-height: 1.5;
  margin: 0 0 16px 0;
  flex: 1;
}

.article-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.article-tag {
  background-color: var(--gray-100);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.article-stats {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--gray-500);
}

/* 随笔随记区样式 */
.diary-container {
  display: flex;
  gap: 32px;
}

.diary-sidebar {
  flex: 0 0 260px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.diary-category {
  padding: 16px;
  background: var(--background-color);

}

.category-title {
  font-size: 24px;
  margin: 0 0 8px 0;
}

.category-subtitle {
  font-size: 32px;
  color: var(--gray-400);
  margin: 0 0 8px 0;
}

.category-desc {
  font-size: 16px;
  color: var(--gray-600);
}

.diary-content {
  flex: 1;
  background: var(--background-topbar);
  border-radius: 12px;
  padding: 32px;
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  max-height: 550px;
  font-family: "HanziPenSC", "Hannotate SC", cursive;
}

/* 添加日记纸张堆叠效果 */
.diary-content::before,
.diary-content::after {
  content: "";
  height: 98%;
  position: absolute;
  width: 100%;
  z-index: -1;
  border-radius: 12px;
  left: 0;
  top: 0;
}

.diary-content::before {
  background-color: var(--background-topbar);
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.2);
  left: -5px;
  top: 4px;
  transform: rotate(-1.1deg);
}
  
.diary-content::after {
  background-color: var(--background-topbar);
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.15);
  left: 5px;
  top: 2px;
  transform: rotate(1.5deg);
}

.diary-empty {
  flex: 1;
  background: var(--background-topbar);
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gray-500);
  font-size: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.diary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--blue-500);
}

.diary-title {
  font-size: 22px;
  margin: 0;
  font-weight: 600;
  color: #2c3e50;
  flex: 1;
}

.diary-date {
  color: #666;
  font-size: 15px;
  display: flex;
  gap: 8px;
  align-items: center;
  font-weight: 500;
}

.weather-icon {
  display: flex;
  font-size: 18px;
}

.diary-body {
  font-size: 16px;
  line-height: 1.8;
  margin-bottom: 24px;
  flex-grow: 1;
  overflow: hidden;
  position: relative;
}

.diary-text {
  font-size: 20px;
  line-height: 2.2;
  color: #2c3e50;
  white-space: pre-wrap;
  margin: 0;
  word-wrap: break-word;
  overflow-wrap: break-word;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 8;
  -webkit-box-orient: vertical;
  
  /* 添加笔记本线条背景 */
  background-image: linear-gradient(180deg, transparent 97%, #ddd 0);
  background-size: 100% 2.2em;
  background-position-y: 1px;
  padding: 0 0.5em;
}

/* 深色模式适配背景线条 */
[data-theme="dark"] .diary-text {
  color: #ffffff;
  background-image: linear-gradient(180deg, transparent 97%, #555 0);
}

[data-theme="dark"] .diary-title {
  color: #ffffff;
}

[data-theme="dark"] .diary-date {
  color: #cccccc;
}

/* 图片区域 */
.diary-images {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.diary-image-wrapper {
  flex: 0 0 auto;
}

.diary-image {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s ease;
  border: 1px solid #e8e8e8;
}

.diary-image:hover {
  transform: scale(1.05);
}

.more-images {
  width: 100px;
  height: 100px;
  background-color: rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: var(--text-color);
  font-size: 14px;
  border: 1px dashed #e0e0e0;
}

.diary-signature {
  text-align: right;
  margin-top: auto;
  padding-top: 16px;
}

.diary-signature img {
  height: 40px;
  opacity: 0.7;
}

/* 深色模式适配 */
[data-theme="dark"] .diary-content,
[data-theme="dark"] .diary-empty {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

[data-theme="dark"] .diary-image {
  border-color: var(--gray-700);
}

/* 图库区样式 */
.gallery-container {
  position: relative;
  background: var(--background-topbar);
  border-radius: 8px;
  overflow: hidden;
}

.gallery-nav {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  display: flex;
  gap: 8px;
}

.nav-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.7);
  color: var(--gray-900);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gallery-main {
  display: flex;
  height: 500px;
}

.gallery-image {
  flex: 1;
  overflow: hidden;
}

.gallery-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gallery-info {
  flex: 0 0 350px;
  padding: 24px;
  background-color: rgba(0, 0, 0, 0.02);
}

.gallery-title {
  font-size: 24px;
  margin: 0 0 8px 0;
}

.gallery-date {
  font-size: 14px;
  color: var(--gray-500);
  margin-bottom: 12px;
}

.gallery-meta {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  color: var(--gray-500);
}

.gallery-desc {
  font-size: 15px;
  line-height: 1.7;
}

.gallery-thumbnails {
  display: flex;
  gap: 8px;
  padding: 16px;
  background-color: rgba(0, 0, 0, 0.03);
}

.thumbnail-item {
  width: 80px;
  height: 80px;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
}

.thumbnail-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 下载区样式 */
.download-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.download-item {
  display: flex;
  gap: 16px;
  background: var(--background-topbar);
  border-radius: 8px;
  padding: 24px;
}

.file-icon {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  font-size: 32px;
  height: 64px;
  width: 64px;
}

.download-content {
  flex: 1;
}

.download-title {
  font-size: 18px;
  margin: 0 0 4px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.download-desc {
  font-size: 14px;
  color: var(--gray-600);
  margin: 0 0 8px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 42px;
}

.download-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
  font-size: 12px;
  color: var(--gray-500);
}

.download-stats {
  display: flex;
  gap: 12px;
}

.download-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  border: 1px solid var(--gray-300);
  background: none;
  padding: 6px 14px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 13px;
}

.action-btn.primary {
  background-color: var(--blue-500);
  color: white;
  border-color: var(--blue-500);
  padding: 6px 18px;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
}

.action-btn.primary:hover {
  background-color: var(--blue-600);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

/* 响应式调整 */
@media (max-width: 1024px) {
  .article-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .download-container {
    grid-template-columns: repeat(1, 1fr);
  }
  
  .diary-container {
    flex-direction: column;
  }
  
  .diary-sidebar {
    flex: 0 0 auto;
  }
  
  .gallery-main {
    flex-direction: column;
    height: auto;
  }
  
  .gallery-info {
    flex: 0 0 auto;
  }
}

@media (max-width: 768px) {
  .article-grid {
    grid-template-columns: 1fr;
  }
  
  .gallery-thumbnails {
    overflow-x: auto;
  }
}

/* 添加点赞样式 */
.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--gray-500);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.stat-item:hover {
  background-color: var(--gray-100);
}

[data-theme="dark"] .stat-item:hover {
  background-color: var(--gray-700);
}
</style>