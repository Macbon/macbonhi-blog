<template>
  <div class="diary-container">
    <div class="diary-sidebar">
      <!-- 使用日历组件 -->
      <DiaryCalender 
        @dateSelected="handleDateSelected"
        @monthChanged="handleMonthChanged"
      />
      <div class="diary-category">
        <h3 class="category-title">那些</h3>
        <h4 class="category-subtitle">浅浅的叙述</h4>
        <p class="category-desc">希望能留有痕迹</p>
      </div>
    </div>
    <div class="diary-content" v-if="currentDiary">
      <div class="diary-header">
        <h3 class="diary-title">{{ currentDiary.title }}</h3>
        <div class="diary-date">
          <span>{{ momentm(currentDiary.moment) }}</span>
          <span class="weather-icon" v-html="getWeatherIcon(currentDiary.weather_id)"></span>
        </div>
      </div>
      <div class="diary-body">
        <p class="diary-text">{{ formatDiaryContent(currentDiary.content) }}</p>
      </div>
      <!-- 图片区域 -->
      <div class="diary-images" v-if="diaryPictures.length > 0">
        <div v-for="(pic, index) in diaryPictures.slice(0, 3)" :key="index" class="diary-image-wrapper">
          <img 
            :src="pic" 
            class="diary-image"
          >
        </div>
        <div v-if="diaryPictures.length > 3" class="more-images">
          +{{ diaryPictures.length - 3 }}
        </div>
      </div>
      <div class="diary-signature">
        <img src="/src/assets/name.png" alt="签名" />
      </div>
    </div>
    <div v-else class="diary-empty">
      <p>暂无日记内容</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from '../../store/user';
import { useDiary } from '../../hooks/diary';
import { weather } from '../../utils/weather';
import { momentm } from '../../utils/moment';
import DiaryCalender from '../../components/DiaryCalender/DiaryCalender.vue';
import { baseUrl } from '../../utils/env';

// 用户数据
const userStore = useUserStore();

// 日记相关
const { getDiaryByDate, getNearest } = useDiary();
const currentDiary = ref<any>(null);

// 处理日记图片
const diaryPictures = computed(() => {
  if (!currentDiary.value?.picture) return [];
  
  try {
    // 尝试解析图片数据
    let pictureData;
    
    // 如果是数组，尝试合并
    if (Array.isArray(currentDiary.value.picture)) {
      const combinedStr = currentDiary.value.picture.join('');
      // 尝试解析JSON
      try {
        pictureData = JSON.parse(combinedStr);
      } catch (e) {
        console.error('解析合并后的图片数据失败:', e);
        
        // 尝试逐个解析数组中的元素
        const urls = [];
        for (const item of currentDiary.value.picture) {
          try {
            if (typeof item === 'string') {
              const parsedItem = JSON.parse(item);
              if (parsedItem && parsedItem.url) {
                const url = parsedItem.url;
                urls.push(url.startsWith('http') ? url : `${baseUrl}/${url.replace(/^\//, '')}`);
              }
            }
          } catch (parseError) {
            console.error('解析单个图片项失败:', parseError);
          }
        }
        
        if (urls.length > 0) {
          return urls;
        }
        return []; // 解析失败返回空数组
      }
    } else if (typeof currentDiary.value.picture === 'string') {
      // 如果是字符串，直接尝试解析
      try {
        pictureData = JSON.parse(currentDiary.value.picture);
      } catch (e) {
        console.error('解析图片字符串失败:', e);
        // 可能是直接的URL字符串
        if (typeof currentDiary.value.picture === 'string' && 
            (currentDiary.value.picture.includes('http') || currentDiary.value.picture.includes('/'))) {
          const url = currentDiary.value.picture;
          return [url.startsWith('http') ? url : `${baseUrl}/${url.replace(/^\//, '')}`];
        }
        return []; // 解析失败返回空数组
      }
    } else {
      return [];
    }
    
    // 提取URL
    if (Array.isArray(pictureData)) {
      const urls = pictureData
        .filter(item => item && item.url)
        .map(item => {
          const url = item.url;
          return url.startsWith('http') ? url : `${baseUrl}/${url.replace(/^\//, '')}`;
        });
      return urls;
    } else if (pictureData && pictureData.url) {
      const url = pictureData.url;
      const finalUrl = url.startsWith('http') ? url : `${baseUrl}/${url.replace(/^\//, '')}`;
      return [finalUrl];
    }
    
    return [];
  } catch (error) {
    console.error('解析日记图片数据失败:', error);
    return [];
  }
});

// 处理日期选择
const handleDateSelected = async (date: Date, hasDiary: boolean) => {
  try {
    let diary = null;
    
    if (hasDiary) {
      // 如果选择的日期有日记，获取该日期的日记
      diary = await getDiaryByDate(date, userStore.token);
    } else {
      // 否则获取最近的日记
      diary = await getNearest(date, userStore.token);
    }
    
    if (diary) {
      currentDiary.value = diary;
    }
  } catch (error) {
    console.error('获取日记失败:', error);
  }
};

// 处理月份变化
const handleMonthChanged = async (date: Date) => {

};

// 获取天气图标
const getWeatherIcon = (weatherId: number | null | undefined) => {
  if (!weatherId) return '';
  return weather[weatherId]?.icon || '';
};

// 格式化日记内容
const formatDiaryContent = (content: string | null | undefined) => {
  if (!content) return '暂无内容';
  
  // 限制展示内容长度
  if (content.length > 300) {
    return content.substring(0, 300) + '...';
  }
  return content;
};

// 组件挂载时加载第一篇日记
onMounted(async () => {
  try {
    const today = new Date();
    const diary = await getNearest(today, userStore.token);
    if (diary) {
      currentDiary.value = diary;
    }
  } catch (error) {
    console.error('加载初始日记失败:', error);
  }
});
</script>

<style scoped>
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
  background-image: linear-gradient(180deg, transparent 95%, #ddd 0);
  background-size: 100% 2.2em;
  background-position: 0 bottom;  /* 从底部开始 */
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

/* 响应式调整 */
@media (max-width: 1024px) {
  .diary-container {
    flex-direction: column;
  }
  
  .diary-sidebar {
    flex: 0 0 auto;
  }
}
</style> 