<template>
  <div class="article-grid">
    <div class="article-item" v-for="article in articleList" :key="article.id" @click="showArticleDetail(article)">
      <div class="article-cover">
        <img :src="getArticleCover(article)" alt="文章封面" />
      </div>
      <div class="article-content">
        <h3 class="article-title">{{ article.title }}</h3>
        <p class="article-date">{{ momentm(article.moment) }}</p>
        <p class="article-desc">{{ article.introduce || '暂无描述' }}</p>
        <div class="article-meta">
          <span class="article-tag">{{ getSubsetName(article.subset_id) }}</span>
          <div class="article-stats">
            <div class="stat-item" @click.stop="handleLike($event, article)">
              <LikeOutlined :style="{ 
                color: isArticlePraised(article) ? 'var(--red-600)' : 'inherit',
                fontSize: '10px'  
              }"/>
              <span>{{ getArticlePraiseCount(article) }}</span>
            </div>
            <div class="stat-item">
              <MessageOutlined style="font-size: 10px;"/>
              <span>{{ getArticleCommentCount(article) }}</span>
            </div>
            <div class="stat-item">
              <EyeOutlined style="font-size: 10px;"/>
              <span>{{ article.views || 0 }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed, defineEmits } from 'vue';
import { useRouter } from 'vue-router';
import { useArticle } from '../../hooks/useArticle';
import { useUserStore } from '../../store/user';
import { useSubsetStore } from '../../store/subset';
import { usePraiseStore } from '../../store/praise';
import { useCommentStore } from '../../store/comment';
import { baseUrl } from '../../utils/env';
import { updateArticleViewsApi, addPraiseApi, cancelPraiseApi, getArticleCommentsApi } from '../../api';
import type { ArticalData } from '../../utils/typeof';
import { LikeOutlined, EyeOutlined, MessageOutlined } from '@ant-design/icons-vue';
import { getBrowserFingerprint, savePraisedItem, hasPraisedItem, removePraisedItem } from '../../utils/fingerprint';
import { momentm } from '../../utils/moment';

// 路由
const router = useRouter();

// 文章相关 - ✅ 使用新版本hook
console.log('🎯 IndexArticle: 初始化 useArticle hook...');
const { articles: articleList, loading, fetchArticles, preloadArticles } = useArticle();
console.log('✅ IndexArticle: useArticle hook 初始化完成', { articleList: articleList.value });
const userStore = useUserStore();
const subsetStore = useSubsetStore();
const praiseStore = usePraiseStore(); // 点赞状态管理
const commentStore = useCommentStore(); // 评论状态管理

// 浏览器指纹
const browserId = ref('');

// 组件事件
const emit = defineEmits(['articleClick']);

// Props定义
const props = defineProps({
  limit: {
    type: Number,
    default: 4, // 默认获取4篇文章
  }
});

// 获取分类名称
const getSubsetName = (subsetId: number | undefined | null): string => {
  if (!subsetId) return '未分类';
  return String(subsetStore.subsetName(subsetId, 0) || '未分类');
};

// 检查文章是否被点赞
const isArticlePraised = (article: ArticalData): boolean => {
  if (!article?.id) return false;
  return praiseStore.getPraiseState(article.id).isPraised;
};

// 获取文章点赞数
const getArticlePraiseCount = (article: ArticalData): number => {
  if (!article?.id) return 0;
  const globalState = praiseStore.getPraiseState(article.id);
  return globalState.count || article.praise_count || 0;
};

// 🔥 新增：获取文章评论数
const getArticleCommentCount = (article: ArticalData): number => {
  if (!article?.id) return 0;
  return commentStore.getCommentCount(article.id) || article.comments || 0;
};

// 处理点赞操作
const handleLike = async (e: Event, article: ArticalData) => {
  e.stopPropagation(); // 阻止冒泡到卡片点击事件
  
  if (!article?.id || !browserId.value) {
    console.error('缺少必要参数，无法执行点赞操作');
    return;
  }
  
  try {
    const currentState = praiseStore.getPraiseState(article.id);
    const previousCount = currentState.count;
    const previousPraisedState = currentState.isPraised;
    
    if (currentState.isPraised) {
      // 取消点赞
      // 乐观更新：先更新全局状态
      const optimisticCount = Math.max(0, previousCount - 1);
      praiseStore.togglePraiseStatus(article.id, false, optimisticCount);
      removePraisedItem(0, article.id);
      
      // 调用取消点赞API
      const response = await cancelPraiseApi({
        browser_id: browserId.value,
        target_id: article.id,
        target_type: 0
      });
      
      // 类型断言处理API响应
      const res = response as unknown as { code: number; data?: any; message?: string };
      
      if (res.code === 200 && res.data) {
        // 使用服务器返回的准确数据更新全局状态
        const finalCount = res.data.count !== undefined ? res.data.count : optimisticCount;
        praiseStore.togglePraiseStatus(article.id, false, finalCount);
      } else {
        // API失败，回滚状态
        praiseStore.togglePraiseStatus(article.id, previousPraisedState, previousCount);
        if (previousPraisedState) {
          savePraisedItem(0, article.id);
        }
      }
    } else {
      // 添加点赞
      // 乐观更新：先更新全局状态
      const optimisticCount = previousCount + 1;
      praiseStore.togglePraiseStatus(article.id, true, optimisticCount);
      savePraisedItem(0, article.id);
      
      // 调用添加点赞API
      const response = await addPraiseApi({
        browser_id: browserId.value,
        target_id: article.id,
        target_type: 0
      });
      
      // 类型断言处理API响应
      const res = response as unknown as { code: number; data?: any; message?: string };
      
      if (res.code === 200 && res.data) {
        // 使用服务器返回的准确数据
        const finalCount = res.data.count !== undefined ? res.data.count : optimisticCount;
        praiseStore.togglePraiseStatus(article.id, true, finalCount);
      } else {
        // API失败，回滚状态
        praiseStore.togglePraiseStatus(article.id, previousPraisedState, previousCount);
        if (!previousPraisedState) {
          removePraisedItem(0, article.id);
        }
      }
    }
  } catch (error) {
    console.error('点赞操作失败:', error);
  }
};

// 获取文章封面
const getArticleCover = (article: ArticalData): string => {
  if (!article?.cover) return '../../assets/name.png';
  
  const coverPath = article.cover;
  if (coverPath.startsWith('http')) {
    return coverPath;
  }
  if (coverPath.startsWith('/')) {
    return baseUrl + coverPath;
  } else {
    return baseUrl + '/' + coverPath;
  }
};

// 显示文章详情
const showArticleDetail = async (article: ArticalData) => {
  try {
    // 更新浏览量
    await updateArticleViewsApi({ articleId: article.id });
    
    // 本地更新浏览量显示
    article.views = (article.views || 0) + 1;
  } catch (error) {
    console.error('更新浏览量失败:', error);
  }
  
  // 发出点击事件
  emit('articleClick', article);
};

// ✅ 获取首页文章列表
const fetchHomeArticles = async () => {
  console.log('🚀 IndexArticle: fetchHomeArticles 开始执行...');
  console.log('📋 IndexArticle: props.limit =', props.limit);
  
  try {
    const params = {
      page: 1,
      pageSize: props.limit || 6,
      reset: true,
      forceRefresh: false,
      classify: 0 // 🔥 关键修复：首页文章固定传递classify=0
    };
    
    console.log('📡 IndexArticle: 调用 fetchArticles...', params);
    await fetchArticles(params);
    
    console.log('✅ 首页文章数据获取成功 (使用缓存):', articleList.value.length, '篇文章');
    
    // ✅ 预加载策略：在后台预加载更多文章数据
    setTimeout(() => {
      if (props.limit < 10) { // 仅当首页显示数量较少时预加载
        preloadArticles({
          page: 1,
          pageSize: 10, // 预加载更多文章
          classify: 0   // 🔥 关键修复：预加载也要指定文章类型
        });
        console.log('⚡ 预加载更多文章数据...');
      }
    }, 3000); // 3秒后预加载，确保不影响首屏体验
    
  } catch (error) {
    console.error('❌ 首页文章数据获取失败:', error);
  }
};

// 批量获取文章评论数
const fetchCommentsForArticles = async (articles: any[]) => {
  console.log('📝 开始批量获取文章评论数...', articles.length);
  for (const article of articles) {
    try {
      const response = await getArticleCommentsApi({
        token: userStore.token || 'guest', // 🔥 修复：添加token
        article_id: article.id,
        count: true // 只获取数量，不获取详细评论
      });
      
      if (response.code === 200 && response.data) {
        const commentCount = response.data.count || 0;
        console.log(`文章${article.id}获取到评论数: ${commentCount}`);
        commentStore.setCommentCount(article.id, commentCount);
      } else {
        console.log(`文章${article.id}评论数获取失败，使用默认值0`);
        commentStore.setCommentCount(article.id, 0);
      }
    } catch (error) {
      console.error(`获取文章${article.id}评论数失败:`, error);
      commentStore.setCommentCount(article.id, 0);
    }
  }
  console.log('✅ 文章评论数获取完成');
};

// 初始化文章点赞状态
const initializeArticlePraiseStatus = async () => {
  if (articleList.value.length === 0 || !browserId.value) return;
  
  // 批量设置文章的初始点赞状态到全局store
  articleList.value.forEach(article => {
    if (!article.id) return;
    
    // 使用文章数据中的praise_count字段
    const initialCount = article.praise_count || 0;
    const isLocalPraised = hasPraisedItem(0, article.id);
    praiseStore.setPraiseState(article.id, initialCount, isLocalPraised);
  });
};

// 组件挂载时初始化数据
onMounted(async () => {
  console.log('🔄 IndexArticle: onMounted 开始执行...');
  
  try {
    // 获取浏览器指纹
    console.log('📝 IndexArticle: 获取浏览器指纹...');
    browserId.value = await getBrowserFingerprint();
    
    // 获取文章数据
    console.log('📥 IndexArticle: 开始获取首页文章数据...');
    await fetchHomeArticles();
    
    // 初始化点赞状态
    console.log('👍 IndexArticle: 初始化点赞状态...');
    initializeArticlePraiseStatus();
    
    // 批量获取评论数
    console.log('💬 IndexArticle: 开始获取评论数...');
    await fetchCommentsForArticles(articleList.value);
    
    console.log('✅ IndexArticle: onMounted 执行完成');
  } catch (error) {
    console.error('❌ IndexArticle: onMounted 执行出错:', error);
  }
});
</script>

<style scoped>
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

/* 响应式调整 */
@media (max-width: 1024px) {
  .article-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .article-grid {
    grid-template-columns: 1fr;
  }
}
</style> 