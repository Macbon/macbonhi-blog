<template>
  <div class="article-item">
    <!-- 第一部分：左侧图片，右侧标题和时间 -->
    <div class="article-top">
      <div class="article-image">
        <img :src="cover"/>
      </div>
      <div class="article-header">
        <h3 class="article-title">{{ props.data?.title }}</h3>
        <div class="article-date">{{ momentm(props.data?.moment!) }}</div>
      </div>
    </div>
    
    <!-- 第二部分：内容展示（自动省略） -->
    <div class="article-content">
      <p>{{ props.data?.introduce || '暂无简介' }}</p>
    </div>
    
    <!-- 第三部分：左侧标签，右侧点赞和浏览量 -->
    <div class="article-bottom">
      <div class="article-tags">
        <span class="category-prefix">{{ categoryName }}/</span>
        <template v-for="(tag, index) in displayLabels" :key="index">
          <span class="tag">{{ tag }}</span>
          <span v-if="index < displayLabels.length - 1">&nbsp;</span>
        </template>
      </div>
      <div class="article-stats">
        <div class="stat-item" 
             @click.stop="handleLikeClick"
             :class="{ 'liked': isPraised, 'animating': isAnimating }"
        >
          <LikeOutlined :style="{ 
            color: isPraised ? 'var(--red-600)' : 'inherit',
            fontSize: '10px'  
          }"/>
          <span>{{ currentPraiseCount }}</span>
        </div>
        <div class="stat-item">
          <EyeOutlined style="font-size: 10px;"/>
          <span>{{ props.data?.views }}</span>
        </div>
        <div class="stat-item">
          <MessageOutlined style="font-size: 10px;"/>
          <span>{{ currentCommentCount }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, computed, ref, onMounted, watch } from 'vue';
import type { ArticalData } from '../../utils/typeof';
import { useLabelStore } from '../../store/label';
import { useSubsetStore } from '../../store/subset';
import { usePraiseStore } from '../../store/praise';
import { useCommentStore } from '../../store/comment';
import { momentm } from '../../utils/moment';
import { baseUrl } from '../../utils/env';
import { getBrowserFingerprint, savePraisedItem, hasPraisedItem, removePraisedItem } from '../../utils/fingerprint';
import { addPraiseApi, cancelPraiseApi, getPraiseStatusApi } from '../../api/index';
import { LikeOutlined, EyeOutlined, MessageOutlined } from '@ant-design/icons-vue';

const labelStore = useLabelStore();
const subsetStore = useSubsetStore();
const praiseStore = usePraiseStore();
const commentStore = useCommentStore();

type ArticalDataProps = {
    data?: ArticalData
}

const props = withDefaults(defineProps<ArticalDataProps>(), {});

// 添加评论数量的计算属性
const currentCommentCount = computed(() => {
  if (!props.data?.id) return 0;
  const globalState = commentStore.getCommentState(props.data.id);
  // 优先使用全局状态，如果没有则使用props中的数据
  return globalState.count || props.data.comments || props.data.comment || 0;
});

// 响应式数据
const browserId = ref('');
const isAnimating = ref(false);

// 使用全局状态管理的点赞状态
const isPraised = computed(() => {
  if (!props.data?.id) return false;
  return praiseStore.getPraiseState(props.data.id).isPraised;
});

const currentPraiseCount = computed(() => {
  if (!props.data?.id) return 0;
  const globalState = praiseStore.getPraiseState(props.data.id);
  // 优先使用全局状态，如果没有则使用props中的数据
  return globalState.count || props.data.praise_count || 0;
});

// 将标签ID转换为标签名称
const getLabelNameById = (labelId: string | number): string => {
  return labelStore.getLabelName(labelId);
};

// 处理标签字符串并返回标签名称数组
const displayLabels = computed(() => {
    // 如果没有标签数据，返回空数组
    if (!props.data?.label) return [];
    
    const labelString = String(props.data.label);
    
    
    // 处理不同格式的标签ID
    let labelIds: string[] = [];
    
    // 检查是否是JSON字符串
    const isJsonString = (str: string): boolean => {
      try {
        if (typeof str !== 'string') return false;
        return (str.startsWith('[') || str.startsWith('{')) && JSON.parse(str) !== null;
      } catch (e) {
        return false;
      }
    };
    
    // 尝试解析标签
    if (isJsonString(labelString)) {
      // JSON格式处理
      try {
        const parsed = JSON.parse(labelString);
        if (Array.isArray(parsed)) {
          // 数组格式 [1, 2, 3]
          labelIds = parsed.map(id => String(id));
        } else if (typeof parsed === 'object' && parsed !== null) {
          // 对象格式 {"0": 1, "1": 2}
          labelIds = Object.values(parsed).map(id => String(id));
        } else {
          // 单值JSON {"id": 1} 或 其他
          labelIds = [String(parsed)];
        }
      } catch (e) {
        console.error('解析JSON标签失败:', e);
        labelIds = [labelString];
      }
    } else if (typeof labelString === 'string' && labelString.includes(',')) {
      // 逗号分隔格式 "1,2,3"
      labelIds = labelString.split(',').map(id => id.trim()).filter(id => id);
    } else {
      // 单值字符串 "1"
      labelIds = [labelString];
    }
    
    
    // 如果标签库为空，但我们有硬编码的常用标签，可以直接使用
    const hardcodedLabels: Record<string, string> = {
      '4': '旅游',
      '5': '文化'
    };
    
    // 转换ID为名称
    return labelIds.map(id => {
      // 首先从标签库获取
      if (labelStore.data.length > 0) {
        return getLabelNameById(id);
      } else {
        // 如果标签库为空，尝试从硬编码标签获取
        return hardcodedLabels[id] || `标签${id}`;
      }
    });
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
    if (coverPath.startsWith('http')) {
        return coverPath;
    }
    if (coverPath.startsWith('/')) {
        return baseUrl + coverPath;
    } else {
        return baseUrl + '/' + coverPath;
    }
});

// 防抖函数
function debounce(fn: Function, delay: number) {
  let timer: number | null = null;
  return function(this: any, ...args: any[]) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
      timer = null;
    }, delay) as unknown as number;
  };
}

// 点赞功能实现
const togglePraise = async () => {
  if (!props.data?.id || !browserId.value) {
    console.error('缺少必要参数，无法执行点赞操作');
    return;
  }
  
  try {
    const currentState = praiseStore.getPraiseState(props.data.id);
    const previousCount = currentState.count;
    const previousPraisedState = currentState.isPraised;

    
    if (currentState.isPraised) {

      
      // 乐观更新：先更新全局状态
      const optimisticCount = Math.max(0, previousCount - 1);
      praiseStore.togglePraiseStatus(props.data.id, false, optimisticCount);
      removePraisedItem(0, props.data.id);

      
      // 调用取消点赞API
      const response = await cancelPraiseApi({
        browser_id: browserId.value,
        target_id: props.data.id,
        target_type: 0
      });
      
      // 类型断言处理API响应
      const res = response as unknown as { code: number; data?: any; message?: string };

      
      if (res.code === 200 && res.data) {
        // 使用服务器返回的准确数据更新全局状态
        const finalCount = res.data.count !== undefined ? res.data.count : optimisticCount;
        praiseStore.togglePraiseStatus(props.data.id, false, finalCount);

      } else {
        // API失败，回滚状态
        console.error('取消点赞失败，回滚状态');
        praiseStore.togglePraiseStatus(props.data.id, previousPraisedState, previousCount);
        if (previousPraisedState) {
          savePraisedItem(0, props.data.id);
        }
      }
    } else {
      
      // 乐观更新：先更新全局状态
      const optimisticCount = previousCount + 1;
      praiseStore.togglePraiseStatus(props.data.id, true, optimisticCount);
      savePraisedItem(0, props.data.id);
      
      
      // 调用添加点赞API
      const response = await addPraiseApi({
        browser_id: browserId.value,
        target_id: props.data.id,
        target_type: 0
      });
      
      // 类型断言处理API响应
      const res = response as unknown as { code: number; data?: any; message?: string };
      
      
      if (res.code === 200 && res.data) {
        // 使用服务器返回的准确数据
        const finalCount = res.data.count !== undefined ? res.data.count : optimisticCount;
        praiseStore.togglePraiseStatus(props.data.id, true, finalCount);
        
      } else {
        // API失败，回滚状态
        console.error('添加点赞失败，回滚状态');
        praiseStore.togglePraiseStatus(props.data.id, previousPraisedState, previousCount);
        if (!previousPraisedState) {
          removePraisedItem(0, props.data.id);
        }
      }
    }
  } catch (error) {
    console.error('点赞操作失败:', error);
  }
};

// 防抖处理的点赞切换
const debouncedTogglePraise = debounce(async () => {
    await togglePraise();
}, 300);

// 点赞按钮点击处理
const handleLikeClick = (e: Event) => {
  e.preventDefault();
  e.stopPropagation();
  
  // 添加动画效果
  isAnimating.value = true;
  setTimeout(() => {
    isAnimating.value = false;
  }, 600);
  
  // 执行点赞逻辑
  debouncedTogglePraise();
};

// 初始化点赞状态
const initializePraiseStatus = async () => {
  if (!props.data?.id) return;
  
  try {
    // 设置初始点赞数（从props获取）
    const initialCount = props.data.praise_count || 0;
    
    // 首先检查本地存储
    const localPraised = hasPraisedItem(0, props.data.id);
    
    // 设置到全局状态
    praiseStore.setPraiseState(props.data.id, initialCount, localPraised);
    
    // 如果有浏览器指纹，从服务器获取准确状态
    if (browserId.value) {
      const response = await getPraiseStatusApi({
        browser_id: browserId.value,
        target_id: props.data.id,
        target_type: 0
      });
      
      // 类型断言处理API响应
      const res = response as unknown as { code: number; data?: any; message?: string };
      
      if (res.code === 200) {
        // 更新全局状态
        praiseStore.setPraiseState(props.data.id, res.data.count, res.data.is_praised);
        
        // 同步本地存储
        if (res.data.is_praised) {
          savePraisedItem(0, props.data.id);
        } else {
          removePraisedItem(0, props.data.id);
        }
        
      }
    }
  } catch (error) {
    console.error('获取点赞状态失败:', error);
  }
};

// 强制刷新计算属性的辅助函数
const forceUpdate = () => {
  // 触发组件更新
  const state = praiseStore.getPraiseState(props.data?.id || 0);
};

// 监听全局点赞状态变化
watch(
  () => props.data?.id ? praiseStore.getPraiseState(props.data.id) : null,
  (newState) => {
    if (newState) {
    }
  },
  { deep: true }
);

// 组件挂载时初始化
onMounted(async () => {
  try {
    // 获取浏览器指纹
    browserId.value = await getBrowserFingerprint();
    
    // 初始化点赞状态
    await initializePraiseStatus();
    
    // 如果标签库为空，初始化备用标签数据
    if (labelStore.data.length === 0) {
      labelStore.initializeBackupLabels();
    }
  } catch (error) {
    console.error('组件初始化失败:', error);
  }
});
</script>

<style scoped>
/* 原有样式保持不变 */
.article-item {
  width: 100%;
  height: 212px;
  background: #FFFFFF;
  border-radius: 16px;
  padding: 16px;
  padding-top: 0;
  box-shadow: 0 2px 8px var(--gray-200);
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  position: relative;
  overflow: visible;
  margin-top: 16px;
  cursor: pointer;
}

/* 适配深色模式 */
[data-theme="dark"] .article-item {
  background: var(--background-topbar);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* 点赞按钮样式优化 */
.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--gray-500);
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 4px 8px;
  border-radius: 4px;
}

.stat-item:hover {
  background-color: var(--gray-100);
  transform: scale(1.05);
}

.stat-item.liked {
  color: var(--red-600);
}

.stat-item.animating {
  animation: likeAnimation 0.6s ease;
}

/* 点赞动画 */
@keyframes likeAnimation {
  0% { transform: scale(1); }
  25% { transform: scale(1.2); }
  50% { transform: scale(0.95); }
  75% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

/* 深色模式适配 */
[data-theme="dark"] .stat-item:hover {
  background-color: var(--gray-700);
}

[data-theme="dark"] .stat-item.liked {
  color: var(--red-400);
}

/* 其他原有样式保持不变 */
.article-top {
  display: flex;
  margin-bottom: 32px;
  height: 80px;
  padding-top: 16px;
}

.article-image {
  width: 160px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  margin-right: 16px;
  margin-top: -40px;
  flex-shrink: 0;
  position: relative;
  z-index: 2;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.article-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.article-header {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 80px;
}

.article-title {
  margin: 0 0 4px 0;
  font-size: 20px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--text-color);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  transition: color 0.3s ease;
  word-break: keep-all;
  white-space: normal;
}

.article-date {
  font-size: 12px;
  color: var(--gray-500);
}

.article-content {
  flex: 1;
  margin-bottom: 14px;
  overflow: hidden;
}

.article-content p {
  margin: 0;
  font-size: 14px;
  color: var(--gray-600);
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.article-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.article-tags {
  display: flex;
}

.tag {
  font-size: 12px;
  color: var(--gray-600);
  background-color: transparent;
}

.category-prefix {
  font-size: 12px;
  color: var(--gray-600);
}

[data-theme="dark"] .category-prefix {
  color: var(--gray-300);
}

[data-theme="dark"] .tag {
  color: var(--blue-400);
  background-color: transparent;
}

.article-stats {
  display: flex;
  gap: 8px;
}

/* hover效果：图片向上突出动画 */
.article-item:hover .article-image {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

/* 标题hover效果 */
.article-item:hover .article-title {
  color: var(--blue-600);
}

[data-theme="dark"] .article-item:hover .article-title {
  color: var(--blue-400);
}
</style>