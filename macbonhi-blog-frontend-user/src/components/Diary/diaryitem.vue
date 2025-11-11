<template>
  <div class="diary-item" :class="`weather-${props.data?.weather_id || 1}`">
    <!-- 顶部百分比指标 -->
    <div class="percentage-top" v-if="props.data?.top_percentage">{{ props.data?.top_percentage }}</div>
    
    <!-- 天气图标（固定在右上角） -->
    <div class="weather-icon-container">
      <span class="weather-icon" v-html="weather[props.data?.weather_id!].icon"></span>
    </div>
    
    <!-- 第一部分：顶部 -->
    <div class="diary-top">
      <div class="diary-date">{{ momentm(props.data?.moment!) }}</div>
      <div class="diary-title">
        {{ props.data?.title }}
      </div>
    </div>
    
    <!-- 第二部分：内容展示 -->
    <div class="diary-content">
      <p>{{ props.data?.content }}</p>
    </div>
    
    <!-- 第三部分：图片展示 -->
    <div class="diary-images" v-if="pictures.length > 0">
      <img 
        v-for="(pic, index) in pictures.slice(0, 3)" 
        :key="index" 
        :src="pic" 
        class="diary-image"
        loading="lazy"
      >
      <div v-if="pictures.length > 3" class="more-images">
        +{{ pictures.length - 3 }}
      </div>
    </div>
    
    <!-- 底部百分比指标 -->
    <div class="percentage-bottom" v-if="props.data?.bottom_percentage">{{ props.data?.bottom_percentage }}</div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, computed, ref } from 'vue';
import type { DiaryData } from '../../utils/typeof';
import { momentm } from '../../utils/moment';
import { weather } from '../../utils/weather';
import { baseUrl } from '../../utils/env';

type DiaryDataProps = {
  data?: DiaryData & {
    top_percentage?: string,
    bottom_percentage?: string
  }
}

const props = withDefaults(defineProps<DiaryDataProps>(), {});

// 图片预览状态
const previewVisible = ref(false);
const previewImage = ref('');

// 获取天气图标
const getWeatherIcon = () => {
  if (!props.data?.weather_id) return '';
  return weather[props.data?.weather_id]?.icon || '';
};

// 处理图片数据
const pictures = computed(() => {
  if (!props.data?.picture) return [];
  
  try {
    let pictureStr = '';
    if (Array.isArray(props.data.picture)) {
      pictureStr = props.data.picture.join('');
    } else {
      pictureStr = props.data.picture;
    }

    const pictureData = JSON.parse(pictureStr);
    
    const urls = Array.isArray(pictureData)
      ? pictureData.map(item => {
          const url = item.url;
          return url.startsWith('http') ? url : `${baseUrl}/${url.replace(/^\//, '')}`;
        })
      : pictureData.url ? [pictureData.url.startsWith('http') ? pictureData.url : `${baseUrl}/${pictureData.url.replace(/^\//, '')}`] : [];

    return urls;
  } catch (error) {
    console.error('解析图片数据失败:', error);
    return [];
  }
});

// 处理图片点击
const handleImageClick = (url: string) => {
  previewImage.value = url;
  previewVisible.value = true;
};
</script>

<style scoped>
.diary-item {
  width: 100%;
  max-width: 600px;
  border-radius: 8px;
  box-shadow: 0 2px 8px 0 #00000014;
  border-radius: 16px;
  padding: 20px;
  margin: 0 auto 15px;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  background: var(--background-topbar)!important;
  border: 1px solid #e0e0e0;
}

.percentage-top {
  position: absolute;
  top: 0;
  right: 0;
  background-color: #f44336;
  color: white;
  padding: 3px 8px;
  font-size: 12px;
  font-weight: bold;
  border-bottom-left-radius: 8px;
}

.percentage-bottom {
  position: absolute;
  bottom: 0;
  right: 0;
  background-color: #f44336;
  color: white;
  padding: 3px 8px;
  font-size: 12px;
  font-weight: bold;
  border-top-left-radius: 8px;
}

.diary-top {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.diary-date {
  font-size: 14px;
  color: var(--gray-500);
}

.diary-title {
  font-size: 22px;
  font-weight: 600;
  color: var(--text-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.weather-icon-container {
  position: absolute;
  top: 24px;
  right: 24px;
  z-index: 2;
}

.weather-icon {
  display: flex;
}

.diary-content {
  font-size: 16px;
  line-height: 1.6;
  color: var(--text-color);
  margin-bottom: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.diary-images {
  display: flex;
  gap: 8px;
}

.diary-image {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
}

.more-images {
  width: 60px;
  height: 60px;
  background-color: rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  color: var(--text-color);
  font-size: 14px;
}

.diary-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

[data-theme="dark"] .diary-item {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

[data-theme="dark"] .diary-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
</style>