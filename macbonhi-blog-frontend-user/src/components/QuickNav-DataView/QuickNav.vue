<template>
  <div class="quick-nav">
    <!-- 左侧统计 -->
    <div class="quick-nav-left">
      <div class="stat-card gradient1">
        <div class="stat-num">{{ totalVisits }}</div>
        <div class="stat-label">总访问量</div>
      </div>
      <div class="stat-card gradient2">
        <div class="stat-num">{{ todayVisits }}</div>
        <div class="stat-label">今日访问</div>
      </div>
    </div>
    <!-- 右侧广告轮播 -->
    <div class="quick-nav-right">
      <a-carousel class="carousel-container" autoplay>
        <div v-for="ad in ads" :key="ad.title" class="ad-slide">
          <div class="ad-content" :style="{ backgroundImage: `url(${ad.img})` }">
            <div class="ad-text-container">
              <div class="ad-title">{{ ad.title }}</div>
              <div class="ad-desc">{{ ad.desc }}</div>
            </div>
            <div class="ad-btns">
              <a-button class="theme-btn" size="large" style="margin-left: 16px;" @click="goToGitHub">博客源码</a-button>
            </div>
          </div>
        </div>
      </a-carousel>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import request from '../../utils/axios';
import { message } from 'ant-design-vue';
import bgImage from '../../assets/l.jpg';

// 访问量数据
const totalVisits = ref<string>('0');
const todayVisits = ref<string>('0');
const isLoading = ref(false);

// GitHub仓库跳转
const goToGitHub = () => {
  window.open('https://github.com/Macbon/macbonhi-blog', '_blank');
};

// 广告数据
const ads = ref([
  {
    title: 'Macbonhi Blog',
    desc: '记录生活，分享技术，探索世界的个人博客空间\nMacbonhi Blog致力于提供高质量的技术文章、生活随笔和有趣的见解，是一个充满创意与思考的独立博客平台。',
    img: bgImage,
  },
  // 可继续添加更多广告
]);

// 格式化数字（大于1000的显示为k）
const formatNumber = (num: number): string => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
};

// 获取访问统计数据
const fetchVisitStats = async () => {
  isLoading.value = true;
  
  try {
    const response = await request.get('/monitor/visit-stats');

    console.log(response);
    if (response.code === 200) {
      const { total_visits, today_visits } = response.data;
      
      // 更新数据
      totalVisits.value = formatNumber(total_visits);
      todayVisits.value = today_visits.toString();
      
    } else {
      console.error('获取访问统计数据失败:', response.data?.message || '未知错误');
      // 设置默认值
      totalVisits.value = formatNumber(90568);
      todayVisits.value = '118';
    }
  } catch (error) {
    console.error('获取访问统计数据错误:', error);
    message.error('获取访问统计数据失败，显示默认数据');
    
    // 设置默认值
    totalVisits.value = formatNumber(90568);
    todayVisits.value = '118';
  } finally {
    isLoading.value = false;
  }
};

// 组件挂载时获取数据
onMounted(() => {
  fetchVisitStats();
});
</script>

<style scoped>
.quick-nav {
  display: flex;
  gap: 32px;
  width: 100%;
  margin: 40px 0;
  height: 100%;
}
.quick-nav-left {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 220px;
}
.stat-card {
  border-radius: 24px;
  padding: 32px 24px;
  background: var(--background-topbar);
  box-shadow: 0 2px 8px var(--gray-200);
  text-align: center;
  transition: all 0.3s ease;
}
.gradient1 {
  background: linear-gradient(135deg, var(--background-topbar) 0%, var(--pink-100) 100%);
}
.gradient2 {
  background: linear-gradient(135deg, var(--background-topbar) 0%, var(--blue-100) 100%);
}
.stat-num {
  font-size: 48px;
  font-weight: bold;
  color: var(--text-color);
  transition: color 0.3s ease;
}
.stat-label {
  font-size: 20px;
  color: var(--gray-500);
  margin-top: 8px;
  transition: color 0.3s ease;
}
.quick-nav-right {
  flex: 1;
  min-width: 0;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 2px 8px var(--gray-200);
  transition: all 0.3s ease;
  display: flex;
}
.carousel-container {
  width: 100%;
  height: 100%;
}
.ad-slide {
  width: 100%;
  height: 100%;
}
.ad-content {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 100%;
  height: 100%;
  padding: 32px;
  position: relative;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border-radius: 24px;
}
.ad-text-container {
  max-width: 70%;
}
.ad-title {
  font-size: 32px;
  font-weight: bold;
  color: var(--gray-100);
  margin-bottom: 16px;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
.ad-desc {
  font-size: 18px;
  color: var(--gray-100);
  white-space: pre-line;
  line-height: 1.5;
}
.ad-btns {
  align-self: flex-start;
  margin-top: auto;
}

/* 按钮主题适配 */
.theme-btn {
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.theme-btn.primary {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
  color: var(--gray-100);
}

:deep(.theme-btn.primary:hover) {
  background-color: var(--primary-hover);
  border-color: var(--primary-hover);
}

:deep(.theme-btn:not(.primary)) {
  background-color: var(--background-topbar);
  border-color: var(--gray-300);
  color: var(--text-color);
}

:deep(.theme-btn:not(.primary):hover) {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

@media (max-width: 900px) {
  .quick-nav {
    flex-direction: column;
    gap: 16px;
  }
  .quick-nav-right {
    min-height: 300px;
  }
  .ad-content {
    align-items: flex-start;
  }
  .ad-text-container {
    max-width: 100%;
  }
}

/* 修复轮播组件高度 */
:deep(.ant-carousel) {
  width: 100%;
  height: 100%;
}

:deep(.slick-slider),
:deep(.slick-list),
:deep(.slick-track),
:deep(.slick-slide > div) {
  height: 100%;
}

:deep(.slick-slide) {
  pointer-events: none;
}

:deep(.slick-slide.slick-active) {
  pointer-events: auto;
}
</style>

