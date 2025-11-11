<template>
  <div class="diary-container">
    <!-- 日记列表 -->
    <div class="diary-list" v-if="diaryList.length > 0">
      <div v-for="item in diaryList" :key="item.id" class="diary-item-wrapper">
        <DiaryItem 
          :data="item" 
          @click="selectDiary(item)" 
          :class="{'active': currentDiary?.id === item.id}"
        />
      </div>
      
      <!-- 加载更多按钮 -->
      <div class="load-more">
        <a-button 
          :loading="loading" 
          @click="loadMore" 
          v-if="hasMore"
          type="primary"
          ghost
        >
          加载更多
        </a-button>
        <span v-else class="no-more">已加载全部内容</span>
      </div>
    </div>
    
    <!-- 空状态显示 -->
    <div class="empty-state" v-else>
      <div class="empty-state-content">
        <div class="empty-icon">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 8C13.7909 8 12 9.79086 12 12V52C12 54.2091 13.7909 56 16 56H48C50.2091 56 52 54.2091 52 52V20L40 8H16Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M40 8V20H52" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M28 32H36" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M28 40H44" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M28 48H44" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h3 class="empty-title">{{ getEmptyTitle() }}</h3>
        <p class="empty-description">{{ getEmptyDescription() }}</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed, reactive, watch } from 'vue';
import DiaryItem from './diaryitem.vue';
import { useDiary } from '../../hooks/diary';
import { useUserStore } from '../../store/user';
import type { DiaryData } from '../../utils/typeof';

const emit = defineEmits(['select-diary']);

// 当前选中的日记
const currentDiary = ref<DiaryData | null>(null);

// 显示日记详情
const selectDiary = (diary: DiaryData) => {
  currentDiary.value = diary;
  emit('select-diary', diary);
};

// 接收参数
const props = defineProps({
  searchTerm: {
    type: String,
    default: '',
  },
  pageSize: {
    type: Number,
    default: 4, // 默认每页4条
  },
});

// 使用store获取token
const userStore = useUserStore();

// 使用日记API hook
const { diaryList, count, loading, getdata } = useDiary();

// 分页相关
const currentPage = ref(1);
const hasMore = computed(() => diaryList.value.length < count.value);

// 请求参数
const requestParams = reactive({
  token: userStore.token,
  value: {
    pageSize: props.pageSize,
    nowPage: 1,
    count: true, // 获取总数
    searchTerm: props.searchTerm,
  }
});

// 重置日记列表
const resetDiaries = () => {
  currentPage.value = 1;
  requestParams.value.nowPage = 1;
  diaryList.value = [];
};

// 加载更多
const loadMore = () => {
  currentPage.value++;
  requestParams.value.nowPage = currentPage.value;
  fetchDiaries(true); 
};

// 获取日记数据
const fetchDiaries = (append = true) => {
  getdata(requestParams, append);
};

// 获取空状态标题和描述函数保持不变
const getEmptyTitle = () => {
  if (loading.value) return '加载中...';
  if (props.searchTerm) return '未找到相关日记';
  return '暂无日记';
};

const getEmptyDescription = () => {
  if (loading.value) return '正在加载日记数据...';
  if (props.searchTerm) return `没有找到包含"${props.searchTerm}"的日记，请尝试其他关键词`;
  return '当前暂无日记';
};

// 监听props变化
watch(
  () => [props.searchTerm],
  () => {     
    requestParams.value.searchTerm = props.searchTerm;
    requestParams.value.nowPage = 1;
    currentPage.value = 1;

    resetDiaries();
    loading.value = true;
    Promise.resolve(getdata(requestParams)).finally(() => {
      loading.value = false;
    });
  },
  { deep: true }
);

// 在组件挂载时加载数据
onMounted(async () => {
  loading.value = true;
  await getdata(requestParams);
  loading.value = false;

  // 如果有日记，默认选择第一篇
  if (diaryList.value.length > 0) {
    selectDiary(diaryList.value[0]);
  }
});


</script>

<style scoped>
.diary-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.diary-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.diary-item-wrapper {
  width: 100%;
}

.diary-item-wrapper:first-child {
  margin-top: 0;
}

.diary-item-wrapper .active {
  border: 2px solid var(--blue-500);
}

/* 空状态样式 */
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  background: var(--background-color);
  border-radius: 8px;
}

.empty-state-content {
  text-align: center;
  max-width: 400px;
  padding: 40px 20px;
}

.empty-icon {
  margin-bottom: 24px;
  color: var(--gray-400);
  display: flex;
  justify-content: center;
}

[data-theme="dark"] .empty-icon {
  color: var(--gray-500);
}

.empty-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 12px 0;
}

.empty-description {
  font-size: 14px;
  color: var(--gray-500);
  line-height: 1.5;
  margin: 0 0 32px 0;
}

[data-theme="dark"] .empty-description {
  color: var(--gray-400);
}

.load-more {
  margin-top: 24px;
  margin-bottom: 24px;
  display: flex;
  justify-content: center;
}

.no-more {
  color: var(--gray-500);
  font-size: 14px;
}

/* 自定义加载更多按钮样式 */
:deep(.ant-btn),
:deep(.ant-btn-ghost) {
  width: 118px;
  height: 48px;
  background: #F4F2EC;
  border: 1px solid #0B1926;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0B1926;
  font-size: 14px;
  font-weight: 500;
}

:deep(.ant-btn:hover) {
  background: #E9E6DC;
  border-color: #0B1926;
  color: #0B1926;
}

/* 深色模式适配 */
[data-theme="dark"] :deep(.ant-btn),
[data-theme="dark"] :deep(.ant-btn-ghost) {
  background: #2A2D33;
  border: 1px solid #E5E5E5;
  color: #E5E5E5;
}

[data-theme="dark"] :deep(.ant-btn:hover) {
  background: #3A3D45;
  border-color: #E5E5E5;
  color: #E5E5E5;
}

/* 响应式布局调整 */
@media (max-width: 768px) {
  .diary-list {
    grid-width: 1fr;
  }
}

/* 抽屉样式覆盖 */
:deep(.ant-drawer-content) {
  border-radius: 16px 16px 0 0;
  overflow: hidden;
}

:deep(.ant-drawer-body) {
  padding: 24px;
  max-height: 90vh;
  overflow-y: auto;
}
</style>