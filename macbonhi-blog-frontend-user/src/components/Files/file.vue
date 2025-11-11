<template>
  <div class="file-container">
    <!-- 文件列表 -->
    <div class="file-list" v-if="fileList.length > 0">
      <div v-for="item in fileList" :key="item.id" class="file-item-wrapper">
        <FileItem :data="item" @download="handleDownload" />
      </div>
    </div>
    
    <!-- 空状态显示 -->
    <div class="empty-state" v-else>
      <div class="empty-state-content">
        <div class="empty-icon">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 8C13.7909 8 12 9.79086 12 12V52C12 54.2091 13.7909 56 16 56H48C50.2091 56 52 54.2091 52 52V20L40 8H16Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M40 8V20H52" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M32 32L32 44" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M26 38L38 38" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h3 class="empty-title">{{ getEmptyTitle() }}</h3>
        <p class="empty-description">{{ getEmptyDescription() }}</p>
      </div>
    </div>
    
    <!-- 加载更多按钮 -->
    <div class="load-more" v-if="fileList.length > 0">
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
</template>

<script lang="ts" setup>
import { ref, onMounted, computed, reactive, watch } from 'vue';
import FileItem from './fileitem.vue';
import { useUserStore } from '../../store/user';
import { useLabelStore } from '../../store/label';
import { getLabelApi } from '../../api/index';
import { useFile } from '../../hooks/filedownload';

// 接收参数
const props = defineProps({
  state: {
    type: Number,
    default: 1, // 默认显示已发布的文件
  },
  subsetId: {
    type: Number,
    default: -1, // 默认不筛选分类
  },
  searchTerm: {
    type: String,
    default: '',
  },
  pageSize: {
    type: Number,
    default: 9, // 文件显示每页9个
  }
});

// 使用store获取token
const userStore = useUserStore();

// 使用文件API hook
const { fileList, count, loading, downloading, getdata, downloadFile } = useFile();

// 使用标签数据的store
const labelStore = useLabelStore();

// 获取标签数据的函数
const fetchLabels = async () => {
  try {
    const request = {
      token: userStore.token
    };
    
    // 调用标签API
    const res = await getLabelApi(request);
    if (res && res.data && 'code' in res.data) {
      // 如果返回数据中包含code字段并且是成功状态码
      if (res.data.code === 200) {
        labelStore.data = res.data.data || [];
      }
    } else {
      // 直接尝试使用返回的数据
      labelStore.data = res.data || [];
    }
  } catch (error) {
    console.error('加载标签失败', error);
  }
};

// 分页相关
const currentPage = ref(1);
const hasMore = computed(() => fileList.value.length < count.value);

// 请求参数接口
interface RequestParams {
  token: string;
  pageSize: number;
  nowPage: number;
  state: number;
  subsetId: number | null;
  count: boolean;
  classify: number;
  searchTerm: string;
}

// 请求参数
const requestParams = reactive<RequestParams>({
  token: userStore.token,
  pageSize: props.pageSize,
  nowPage: 1,
  state: props.state,
  subsetId: props.subsetId,
  count: true, // 获取总数
  classify: 2, // 2表示文件类型
  searchTerm: props.searchTerm
});

// 重置文件列表
const resetFiles = () => {
  currentPage.value = 1;
  
  // 重置为初始参数
  requestParams.pageSize = props.pageSize;
  requestParams.nowPage = 1;
  
  // 清空当前列表
  fileList.value = [];
};

// 加载更多
const loadMore = () => {
  // 增加页码
  currentPage.value++;
  requestParams.nowPage = currentPage.value;
  
  fetchFiles(true); 
};

// 获取文件数据
const fetchFiles = (append = false) => {
  // 将分类参数添加到请求中
  requestParams.classify = 2; // 文件类型为2
  getdata(requestParams, append);
};

// 处理文件下载
const handleDownload = (fileId: number | string) => {
  downloadFile(fileId, userStore.token);
};

// 获取空状态标题
const getEmptyTitle = () => {
  if (loading.value) {
    return '加载中...';
  }
  
  if (props.searchTerm) {
    return '未找到相关文件';
  }
  
  if (props.subsetId === 0) {
    return '暂无未分组文件';
  } else if (props.subsetId > 0) {
    return '该分组暂无文件';
  } else {
    return '暂无文件';
  }
};

// 获取空状态描述
const getEmptyDescription = () => {
  if (loading.value) {
    return '正在加载文件数据...';
  }
  
  if (props.searchTerm) {
    return `没有找到包含"${props.searchTerm}"的文件，请尝试其他关键词`;
  }
  
  if (props.subsetId === 0) {
    return '该分类下暂无文件';
  } else if (props.subsetId > 0) {
    return '该分类下暂无文件';
  } else {
    return '当前暂无文件';
  }
};

// 监听props变化，重新获取数据
watch(
  () => [props.subsetId, props.state, props.searchTerm],
  (newVal, oldVal) => {     

     
    requestParams.subsetId = props.subsetId;
    requestParams.state = props.state;
    requestParams.searchTerm = props.searchTerm;
    requestParams.nowPage = 1;
    currentPage.value = 1;

    resetFiles();
    // 重新获取数据
    loading.value = true;
    Promise.resolve(getdata(requestParams)).finally(() => {
      loading.value = false;
    });
  },
  { deep: true }
);

// 组件挂载时获取数据
onMounted(() => {
  fetchLabels(); // 获取标签数据
  fetchFiles(); // 获取文件数据
});
</script>

<style scoped>
.file-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
}

.file-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

/* 移动端适配 */
@media (max-width: 1199px) {
  .file-list {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 767px) {
  .file-list {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}

@media (max-width: 479px) {
  .file-list {
    grid-template-columns: repeat(1, 1fr);
  }
}

.empty-state {
  width: 100%;
  padding: 64px 0;
  text-align: center;
}

.empty-state-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 400px;
  margin: 0 auto;
}

.empty-icon {
  color: var(--gray-400);
  margin-bottom: 16px;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 8px;
}

.empty-description {
  font-size: 14px;
  color: var(--gray-500);
  margin-bottom: 24px;
}

.load-more {
  display: flex;
  justify-content: center;
  margin: 32px 0;
}

.no-more {
  font-size: 14px;
  color: var(--gray-400);
}
</style>
