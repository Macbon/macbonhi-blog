<template>
  <div class="gallery-container" v-if="currentGallery">
    <!-- 背景图片 -->
    <div class="gallery-background" :style="{ backgroundImage: `url(${currentGalleryMainImage})` }" @click="showGalleryDetail(currentGallery)">
      <!-- 固定在右上角的信息区 -->
      <div class="gallery-info" @click.stop="showGalleryDetail(currentGallery)">
        <h3 class="gallery-title">{{ String(currentGallery.title) }}</h3>
        <p class="gallery-date">{{ momentm(currentGallery.moment) }}</p>
        <p class="gallery-desc">{{ currentGallery.introduce || '暂无描述' }}</p>
      </div>
      
      <!-- 左下角缩略图区域 -->
      <div class="gallery-thumbnails" v-if="galleryImages.length > 0">
        <div 
          v-for="(image, index) in getThumbnailImages" 
          :key="index" 
          class="thumbnail-item"
          @click.stop="showGalleryDetail(currentGallery)"
        >
          <img :src="image" :alt="`图片 ${index + 1}`" />
        </div>
      </div>
      
      <!-- 控制按钮 -->
      <div class="gallery-controls" v-if="galleryList.length > 1">
        <button class="nav-btn prev" @click.stop="prevGallery">&lt;</button>
        <button class="nav-btn next" @click.stop="nextGallery">&gt;</button>
      </div>
    </div>
  </div>
  <div class="gallery-empty" v-else>
    <p>暂无图库内容</p>
  </div>

  <!-- 图库详情抽屉 -->
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
    <ArticleContent v-if="selectedGallery" :articleData="selectedGallery" />
  </a-drawer>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed, defineProps, defineEmits } from 'vue';
import { useRouter } from 'vue-router';
import { useArticle } from '../../hooks/useArticle';
import { useUserStore } from '../../store/user';
import { useCommentStore } from '../../store/comment';
import { baseUrl } from '../../utils/env';
import { momentm } from '../../utils/moment';
import { getArticleCommentsApi } from '../../api/index';
import ArticleContent from '../ArticleGalleryContent/content.vue';
import type { ArticalData } from '../../utils/typeof';

// 扩展ArticalData类型以包含content属性
interface EnhancedArticalData extends ArticalData {
  content?: string;
}

// 路由
const router = useRouter();

// 用户数据
const userStore = useUserStore();
const commentStore = useCommentStore();

// Props定义
const props = defineProps({
  limit: {
    type: Number,
    default: 5, // 默认获取5个图库
  }
});

// 组件事件
const emit = defineEmits(['galleryClick']);

// 获取图库数据 - 需要同时获取 articles 数据
const { articles, fetchArticles } = useArticle();

// 图库相关数据
const galleryList = ref<EnhancedArticalData[]>([]);
const currentGalleryIndex = ref(0);
const currentGallery = computed(() => galleryList.value[currentGalleryIndex.value]);

// 抽屉控制
const drawerVisible = ref(false);
const selectedGallery = ref<EnhancedArticalData | null>(null);

// 获取当前图库的所有图片
const galleryImages = computed(() => {
  if (!currentGallery.value?.content) return [];
  
  try {
    // 尝试解析图片数据
    const contentData = JSON.parse(currentGallery.value.content);
    
    if (Array.isArray(contentData)) {
      // 提取图片URL
      return contentData.map(item => {
        if (item && item.url) {
          const url = item.url;
          return url.startsWith('http') ? url : `${baseUrl}/${url.replace(/^\//, '')}`;
        }
        return '';
      }).filter(url => url !== '');
    }
  } catch (error) {
    console.error('解析图库图片数据失败:', error);
  }
  
  return [];
});

// 缩略图显示逻辑
const getThumbnailImages = computed(() => {
  if (galleryImages.value.length === 1) {
    // 只有一张图时，显示这张图作为缩略图
    return [galleryImages.value[0]];
  } else if (galleryImages.value.length > 1) {
    // 多张图时，显示除第一张外的最多2张图
    return galleryImages.value.slice(1, 3);
  }
  return [];
});

// 图片数量
const galleryImageCount = computed(() => galleryImages.value.length);

// 主图展示
const currentGalleryMainImage = computed(() => {
  if (galleryImages.value.length > 0) {
    return galleryImages.value[0];
  } else if (currentGallery.value?.cover) {
    // 如果没有图片内容但有封面，显示封面
    const coverPath = currentGallery.value.cover;
    if (coverPath.startsWith('http')) {
      return coverPath;
    }
    if (coverPath.startsWith('/')) {
      return baseUrl + coverPath;
    } else {
      return baseUrl + '/' + coverPath;
    }
  }
  return '../../assets/name.png'; // 默认图片
});

// 切换到上一个图库
const prevGallery = () => {
  if (currentGalleryIndex.value > 0) {
    currentGalleryIndex.value--;
  } else {
    // 循环到最后一个
    currentGalleryIndex.value = galleryList.value.length - 1;
  }
};

// 切换到下一个图库
const nextGallery = () => {
  if (currentGalleryIndex.value < galleryList.value.length - 1) {
    currentGalleryIndex.value++;
  } else {
    // 循环到第一个
    currentGalleryIndex.value = 0;
  }
};

// 显示图库详情抽屉
const showGalleryDetail = (gallery: EnhancedArticalData) => {
  if (!gallery) return;
  
  // 处理图库内容，如果content是JSON字符串，尝试解析并格式化为HTML
  try {
    if (gallery.content && typeof gallery.content === 'string') {
      // 尝试解析JSON，如果是图片数组，就转为HTML格式
      const contentArray = JSON.parse(gallery.content);
      if (Array.isArray(contentArray)) {
        // 创建样式更美观的图片HTML
        const imagesHtml = contentArray.map(img => 
          `<div class="gallery-image-container">
            <img src="${img.url}" alt="${img.title || '图片'}" class="gallery-image" />
          </div>`
        ).join('');
        
        // 创建一个新的gallery对象，避免修改原始对象
        const processedGallery = {...gallery};
        // 替换content为HTML字符串
        processedGallery.content = imagesHtml;
        selectedGallery.value = processedGallery;
      } else {
        // 如果不是数组，直接使用原始内容
        selectedGallery.value = gallery;
      }
    } else {
      // 如果没有content属性或不是字符串类型，直接使用原始对象
      selectedGallery.value = gallery;
    }
  } catch (error) {
    console.error('解析图库内容失败:', error);
    // 解析失败时仍然显示原始内容
    selectedGallery.value = gallery;
  }
  
  // 发出点击事件
  emit('galleryClick', gallery);
  
  // 显示抽屉
  drawerVisible.value = true;
};

// 关闭抽屉
const closeDrawer = () => {
  drawerVisible.value = false;
  // 延迟清空当前图库，确保过渡效果完成
  setTimeout(() => {
    selectedGallery.value = null;
  }, 300);
};

// 获取首页图库列表
const fetchHomeGalleries = async () => {
  const params = {
    token: userStore.token,
    pageSize: props.limit,  // 获取指定数量的图库
    nowPage: 1,
    state: 1,     // 只获取已发布的
    subsetId: -1, // 不限制分类
    count: true,
    classify: 1   // 1表示图库类型
  };
  
  try {
    // 使用新版本hook获取图库数据
    console.log('📡 IndexGallery: 调用 fetchArticles...');
    
    const fetchParams = {
      page: 1,
      pageSize: 6,
      reset: true,
      forceRefresh: false,
      classify: 1 // 🔥 关键修复：1表示图库类型，categoryId应该是分类ID
    };
    
    await fetchArticles(fetchParams);
    
    // 从articles状态中读取数据并转换为图库格式
    galleryList.value = articles.value.map(article => ({
      ...article,
      id: article.id,
      title: article.title,
      cover: article.cover,
      createTime: article.createTime
    }));
    
    console.log('图库数据获取完成:', galleryList.value.length);
  } catch (error) {
    console.error('获取图库列表失败:', error);
  }
};

// 批量获取图库评论数
const fetchCommentsForGalleries = async (galleries: any[]) => {
  console.log('📝 开始批量获取图库评论数...', galleries.length);
  for (const gallery of galleries) {
    try {
      const response = await getArticleCommentsApi({
        token: userStore.token || 'guest', // 🔥 修复：添加token
        article_id: gallery.id,
        count: true // 只获取数量，不获取详细评论
      });
      
      if (response.code === 200 && response.data) {
        const commentCount = response.data.count || 0;
        console.log(`图库${gallery.id}获取到评论数: ${commentCount}`);
        commentStore.setCommentCount(gallery.id, commentCount);
      } else {
        console.log(`图库${gallery.id}评论数获取失败，使用默认值0`);
        commentStore.setCommentCount(gallery.id, 0);
      }
    } catch (error) {
      console.error(`获取图库${gallery.id}评论数失败:`, error);
      commentStore.setCommentCount(gallery.id, 0);
    }
  }
  console.log('✅ 图库评论数获取完成');
};

// 组件挂载时加载数据
onMounted(async () => {
  // 获取图库数据
  await fetchHomeGalleries();
  
  // 批量获取评论数
  console.log('💬 IndexGallery: 开始获取评论数...');
  await fetchCommentsForGalleries(galleryList.value);
});
</script>

<style scoped>
/* 图库容器 */
.gallery-container {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  background: var(--background-topbar);
  height: 670px; /* 增加高度，从500px改为600px */
}

/* 背景图片容器 */
.gallery-background {
  position: relative;
  width: 100%;
  height: 100%;
  background-size: cover; /* 改为cover让图片填充满整个区域 */
  background-position: center;
  background-repeat: no-repeat;
  cursor: pointer; /* 添加指针样式表明可点击 */
}

/* 在背景图上添加轻微的遮罩，使文字更清晰 */
.gallery-background::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.2) 100%);
  z-index: 1;
}

/* 背景悬停效果 */
.gallery-background:hover::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.05);
  z-index: 1;
  pointer-events: none;
}

[data-theme="dark"] .gallery-background:hover::after {
  background: rgba(0, 0, 0, 0.1);
}

/* 固定在右上角的信息区 */
.gallery-info {
  position: absolute;
  top: 30px;
  right: 30px;
  background: transparent;
  padding: 20px;
  border-radius: 12px;
  max-width: 350px;
  z-index: 2;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.gallery-info:hover {
  transform: translateY(-3px);
}

.gallery-title {
  font-size: 24px;
  margin: 0 0 8px 0;
  font-weight: 600;
  color: #ffffff;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
}

.gallery-date {
  font-size: 14px;
  color: #ffffff;
  margin: 0 0 12px 0;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
}

.gallery-desc {
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
  color: #ffffff;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 左下角缩略图区域 */
.gallery-thumbnails {
  position: absolute;
  bottom: 30px;
  left: 30px;
  display: flex;
  gap: 12px;
  z-index: 3;
}

.thumbnail-item {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

.thumbnail-item:hover {
  transform: scale(1.05);
  border-color: #ffffff;
  box-shadow: 0 6px 20px rgba(0,0,0,0.4);
}

.thumbnail-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 控制按钮 */
.gallery-controls {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: 0 20px;
  z-index: 3;
  pointer-events: none;
}

.nav-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.9);
  color: #333;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transition: all 0.3s ease;
  pointer-events: all;
}

.nav-btn:hover {
  background-color: white;
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(0,0,0,0.2);
}

/* 深色模式下的控制按钮 */
[data-theme="dark"] .nav-btn {
  background-color: rgba(50, 50, 50, 0.9);
  color: #fff;
}

[data-theme="dark"] .nav-btn:hover {
  background-color: rgba(70, 70, 70, 0.95);
}

/* 空状态 */
.gallery-empty {
  height: 600px; /* 与容器高度保持一致 */
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gray-500);
  font-size: 16px;
  border-radius: 16px;
  background: var(--background-topbar);
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .gallery-container {
    height: 500px;
  }
  
  .gallery-empty {
    height: 500px;
  }
  
  .gallery-info {
    padding: 15px;
    max-width: 300px;
    top: 20px;
    right: 20px;
  }
  
  .gallery-title {
    font-size: 20px;
  }
  
  .gallery-thumbnails {
    bottom: 20px;
    left: 20px;
  }
}

@media (max-width: 768px) {
  .gallery-container {
    height: 550px;
  }
  
  .gallery-empty {
    height: 550px;
  }
  
  .gallery-info {
    max-width: 250px;
    padding: 12px;
    top: 15px;
    right: 15px;
  }
  
  .gallery-title {
    font-size: 18px;
  }
  
  .gallery-desc {
    font-size: 13px;
    -webkit-line-clamp: 1;
  }
  
  .thumbnail-item {
    width: 60px;
    height: 60px;
  }
  
  .gallery-thumbnails {
    bottom: 15px;
    left: 15px;
  }
  
  .nav-btn {
    width: 40px;
    height: 40px;
    font-size: 16px;
  }
}

/* 添加抽屉中图库内容样式 */
:deep(.gallery-image-container) {
  margin-bottom: 20px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

:deep(.gallery-image) {
  width: 100%;
  height: auto;
  display: block;
  transition: transform 0.3s ease;
}

:deep(.gallery-image:hover) {
  transform: scale(1.02);
}
</style>