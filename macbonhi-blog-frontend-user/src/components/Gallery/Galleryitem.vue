<template>
  <div class="article-item">
    <div class="article-image">
      <img :src="cover" alt="封面图"/>
      

      
      <!-- 半透明蒙版 -->
      <div class="hover-overlay"></div>
      
      <!-- 默认状态下的标题 (非悬停时) -->
      <div class="default-title">
        <h3>{{ props.data?.title || '祝福' }}</h3>
      </div>
      
      <!-- 悬停时的内容覆盖层 -->
      <div class="content-overlay">
        <div class="content-wrapper">
          <h3 class="article-title">{{ props.data?.title || '未命名' }}</h3>
          <p class="article-intro">{{ props.data?.introduce }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, computed, ref } from 'vue';
import type { ArticalData } from '../../utils/typeof';
import { useLabelStore } from '../../store/label';
import { useSubsetStore } from '../../store/subset';
import { baseUrl } from '../../utils/env';

const labelStore = useLabelStore();
const subsetStore = useSubsetStore();

// 增强ArticalData类型，添加content属性
interface EnhancedArticalData extends ArticalData {
    content?: string;
}

type ArticalDataProps = {
    data?: EnhancedArticalData,
    imageCount?: number
}

const props = withDefaults(defineProps<ArticalDataProps>(), {
    imageCount: 8
});



// 将标签ID转换为标签名称
const getLabelNameById = (labelId: string | number): string => {
  const label = labelStore.data.find(item => item.id == labelId);
  return label ? String(label.label_name) : `标签${labelId}`;
};

// 处理标签字符串并返回标签名称数组
const displayLabels = computed(() => {
    if (!props.data?.label) return [];
    
    const labelString = String(props.data.label);
    const labelIds = labelString.split(',').map(id => id.trim()).filter(id => id);

    return labelIds.map(id => getLabelNameById(id));
});

// 获取文章所属分类名称
const categoryName = computed(() => {
  if (!props.data?.subset_id) return '未分类';
  return subsetStore.subsetName(props.data.subset_id) || '未分类';
});

// 封面地址
const cover = computed(() => {
    if (!props.data?.cover) return '';
    
    const coverPath = props.data.cover;
    // 如果已经是完整URL，直接返回
    if (coverPath.startsWith('http')) {
        return coverPath;
    }
    // 如果是相对路径，进行拼接
    if (coverPath.startsWith('/')) {
        return baseUrl + coverPath;
    } else {
        return baseUrl + '/' + coverPath;
    }
});
</script>

<style scoped>
.article-item {
  width: 100%;
  position: relative;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s ease;
  aspect-ratio: 20.13 / 30.38; /* 根据图中比例设置宽高比 */
}

.article-image {
  width: 100%;
  height: 100%;
  border-radius: 24px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.article-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}



/* 半透明蒙版 - 只在悬停时显示 */
.hover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.1); /* 几乎透明的蒙版 */
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 1;
}

/* 默认状态下的标题 */
.default-title {
  position: absolute;
  bottom: 20px;
  left: 20px;
  z-index: 2;
  transition: opacity 0.3s ease;
}

.default-title h3 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
}

/* 文字信息覆盖层 */
.content-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0) 120px);
  color: white;
  z-index: 2;
  opacity: 0;
  transition: all 0.3s ease;
}

.content-wrapper {
  transform: translateY(20px);
  transition: all 0.3s ease;
}

.article-title {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
}

.article-intro {
  margin: 0;
  font-size: 16px;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* 悬停效果 */
.article-item:hover .article-image img {
  transform: scale(1.05);
}

.article-item:hover .hover-overlay {
  opacity: 1;
}

.article-item:hover .content-overlay {
  opacity: 1;
}

.article-item:hover .content-wrapper {
  transform: translateY(0);
}

.article-item:hover .default-title {
  opacity: 0;
}


</style>