<template>
  <div class="diary-detail">
    <div 
      v-if="props.data" 
      class="diary-detail-content"
    >
      <!-- 简洁的卡片容器 -->
      <div class="detail-card">
        <!-- 头部 -->
        <div class="detail-header">
          <h2 class="detail-title">{{ props.data.title }}</h2>
          <div class="detail-meta">
            <div class="detail-date">{{ momentl(props.data.moment!) }}</div>
            <span class="weather-icon" v-html="weather[props.data?.weather_id!].icon"></span>
          </div>
        </div>
        
        <!-- 正文内容 -->
        <div class="detail-content">
          <div class="detail-text">{{ props.data.content }}</div>
        </div>
        
        <!-- 图片区域 -->
        <div class="detail-images-container" v-if="pictures.length > 0">
          <div class="detail-images">
            <div v-for="(pic, index) in pictures" :key="index" class="detail-image-wrapper">
              <img 
                :src="pic" 
                class="detail-image"
                @click="previewImage = pic; previewVisible = true"
              >
            </div>
          </div>
        </div>
          
        <!-- 签名 - 始终显示 -->
        <div class="signature">
          <img src="/src/assets/name.png" alt="签名" class="signature-img">
        </div>
      </div>
    </div>
    
    <div v-else class="diary-empty">
      <div class="empty-icon">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 8C13.7909 8 12 9.79086 12 12V52C12 54.2091 13.7909 56 16 56H48C50.2091 56 52 54.2091 52 52V20L40 8H16Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M40 8V20H52" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M28 32H36" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h3>选择日记查看详情</h3>
      <p>点击左侧日记查看详细内容</p>
    </div>
    
    <!-- 图片预览 -->
    <a-modal
      :open="previewVisible"
      :footer="null"
      @cancel="previewVisible = false"
    >
      <img alt="预览图片" style="width: 100%" :src="previewImage" />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { momentl } from '../../utils/moment';
import { weather } from '../../utils/weather';
import { baseUrl } from '../../utils/env';
import type { DiaryData } from '../../utils/typeof';

const props = defineProps<{
  data?: DiaryData | null
}>();

const previewVisible = ref(false);
const previewImage = ref('');
const showDebugInfo = ref(true);
const isExpanded = ref(true); // 默认展开状态
const hasOverflow = ref(false);
const contentRef = ref<HTMLElement | null>(null);

// 检查内容是否溢出
const checkOverflow = async () => {
  await nextTick();
  const content = document.querySelector('.detail-text') as HTMLElement;
  if (content) {
    const isOverflowing = content.scrollHeight > content.clientHeight;
    hasOverflow.value = isOverflowing;
  }
};

// 监听数据变化，重新检查溢出状态
watch(() => props.data, () => {
  nextTick(() => {
    checkOverflow();
  });
});

onMounted(() => {
  checkOverflow();
  // 窗口大小变化时重新检查
  window.addEventListener('resize', checkOverflow);
});

// 处理图片数据
const pictures = computed(() => {
  if (!props.data?.picture) return [];
  
  try {
    // 尝试修复和解析JSON
    let pictureData;
    
    // 如果是数组，尝试合并
    if (Array.isArray(props.data.picture)) {
      const combinedStr = props.data.picture.join('');
      // 尝试多种方式解析
      try {
        // 1. 直接解析
        pictureData = JSON.parse(combinedStr);
      } catch (e: any) {
        try {
          // 2. 修复常见的JSON错误
          let fixedStr = combinedStr
            .replace(/([{,])\s*(\w+):/g, '$1"$2":') // 为未加引号的键名添加引号
            .replace(/:\s*'([^']*)'/g, ':"$1"')     // 将单引号替换为双引号
            .replace(/,\s*}/g, '}')                 // 移除对象最后一个属性后的逗号
            .replace(/,\s*]/g, ']');                // 移除数组最后一个元素后的逗号
            
          pictureData = JSON.parse(fixedStr);
        } catch (e2: any) {
          // 3. 直接提取URL信息
          const urlMatch = combinedStr.match(/\"url\":\"(http[^\"]+)\"/);
          if (urlMatch && urlMatch[1]) {
            return [urlMatch[1]];
          } else {
            throw new Error('无法解析图片数据: ' + e2.message);
          }
        }
      }
    } else if (typeof props.data.picture === 'string') {
      // 如果是字符串，直接尝试解析
      try {
        pictureData = JSON.parse(props.data.picture);
      } catch (e: any) {
        // 尝试从字符串中提取URL
        const urlMatch = props.data.picture.match(/\"url\":\"(http[^\"]+)\"/);
        if (urlMatch && urlMatch[1]) {
          return [urlMatch[1]];
        } else {
          throw new Error('无法解析字符串图片数据: ' + e.message);
        }
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
  } catch (error: any) {
    console.error('解析图片数据失败:', error);
    return [];
  }
});
</script>

<style scoped>
.diary-detail {
  background: transparent;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.diary-detail-content {
  padding: 24px;
  flex-grow: 1;
  position: relative;
  height: 100%;
}

/* 简洁的卡片容器 */
.detail-card {
  background: var(--background-topbar);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 32px 48px;
  margin: 0 auto;
  max-width: 100%;
  position: relative;
  font-family: "HanziPenSC", "Hannotate SC", cursive;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 头部样式 */
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  justify-content: center;
  margin-bottom: 32px;
  border-bottom: 2px solid var(--blue-500);
  padding-bottom: 24px;
}

.detail-title {
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
  line-height: 1.3;
  flex: 1;
  margin-right: 24px;
}

.detail-meta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.detail-date {
  color: #666;
  font-size: 16px;
  font-weight: 500;
}

.weather-icon {
  display: inline-flex;
}

.weather-icon svg {
  width: 24px;
  height: 24px;
}

/* 正文内容 */
.detail-content {
  margin-bottom: 32px;
  flex-grow: 1;
  position: relative;
}

.detail-text {
  font-size: 20px;
  line-height: 2.5;
  color: #2c3e50;
  white-space: pre-wrap;
  margin: 0;
  background-image: linear-gradient(180deg, transparent 97%, #ddd 0);
  background-size: 100% 2.5em;
  background-position-y: 1px;
  padding: 0 0.5em;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* 添加纸张堆叠效果 */
.detail-card::before,
.detail-card::after {
  content: "";
  height: 98%;
  position: absolute;
  width: 100%;
  z-index: -1;
  border-radius: 12px;
}

.detail-card::before {
  background-color: var(--background-topbar);
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.2);
  left: -5px;
  top: 4px;
  transform: rotate(-1.1deg);
}
  
.detail-card::after {
  background-color: var(--background-topbar);
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.15);
  left: 5px;
  top: 2px;
  transform: rotate(1.5deg);
}

/* 图片区域 */
.detail-images-container {
  margin-bottom: 16px;
}

.detail-images {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.detail-image-wrapper {
  flex: 0 0 auto;
}

.detail-image {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s ease;
  border: 1px solid #e8e8e8;
}

.detail-image:hover {
  transform: scale(1.02);
}

/* 签名样式 */
.signature {
  position: relative;
  display: flex;
  justify-content: flex-end;
  margin-top: auto;
  padding-top: 16px;
}

.signature-img {
  width: 100px;
  height: auto;
  opacity: 0.7;
}

/* 空状态样式 */
.diary-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 24px;
  color: var(--gray-500);
}

.empty-icon {
  color: var(--gray-400);
  margin-bottom: 16px;
}

.diary-empty h3 {
  font-size: 18px;
  color: var(--text-color);
  margin-bottom: 8px;
}

.diary-empty p {
  font-size: 14px;
}

/* 深色模式适配 */
[data-theme="dark"] .detail-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

[data-theme="dark"] .detail-header {
  border-bottom-color: #404040;
}

[data-theme="dark"] .detail-title {
  color: #ffffff;
}

[data-theme="dark"] .detail-date {
  color: #cccccc;
}

[data-theme="dark"] .detail-text {
  color: #ffffff;
  background-image: linear-gradient(180deg, transparent 97%, #555 0);
}

[data-theme="dark"] .detail-image {
  border-color: #404040;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .diary-detail-content {
    padding: 16px;
  }
  
  .detail-card {
    padding: 24px;
  }
  
  .detail-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .detail-meta {
    align-items: flex-start;
    flex-direction: row;
    gap: 16px;
  }
  
  .detail-title {
    margin-right: 0;
  }
  
  .detail-images {
    gap: 12px;
  }
  
  .detail-image {
    width: 100px;
    height: 100px;
  }
  
  .signature-img {
    width: 50px;
  }
}

/* 确保在小屏幕上图片不会超出容器 */
@media (max-width: 480px) {
  .detail-images {
    flex-wrap: wrap;
  }
  
  .detail-image {
    width: calc(50% - 8px);
    height: 80px;
  }
}
</style>