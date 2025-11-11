<template>
  <div class="file-item" @click="$emit('click', props.data)">
    <!-- 文件图标 -->
    <div class="file-icon">
      <FileIcon :fileType="getFileType()" />
    </div>
    
    <!-- 文件内容区域 -->
    <div class="file-content">
      <h3 class="file-title">{{ props.data?.file_name }}</h3>
      <p class="file-description">{{ props.data?.file_desc || '暂无描述' }}</p>
      
      <!-- 文件信息区域 -->
      <div class="file-info">
        <div class="file-meta">
          <span class="category-prefix">{{ categoryName }}/</span>
          <span class="file-size">{{ formatFileSize(props.data?.file_size) }}</span>
        </div>
        
        <div class="file-stats">
          <div class="stat-item">
            <DownloadOutlined style="font-size: 10px;"/>
            <span>{{ props.data?.download_count || 0 }}</span>
          </div>
          <div class="download-button">
            <a-button 
              type="primary" 
              size="small" 
              @click.stop="handleDownload"
              :loading="loading"
            >
              下载
            </a-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, computed, ref, defineEmits } from 'vue';
import { useSubsetStore } from '../../store/subset';
import { DownloadOutlined } from '@ant-design/icons-vue';
import FileIcon from '../../components/Files/FileIcon.vue'; // 文件图标组件

const subsetStore = useSubsetStore(); // 引入分类store
const loading = ref(false); // 下载加载状态

// 定义事件
const emit = defineEmits(['click', 'download']);

type FileDataProps = {
  data?: {
    id: number | string;
    file_name: string;
    file_url: string;
    url?: string;
    file_desc?: string;
    file_size?: number;
    subset_id?: number;
    download_count?: number;
    format?: string;
    moment?: string;
  }
}

const props = withDefaults(defineProps<FileDataProps>(), {});

// 获取文件所属分类名称
const categoryName = computed(() => {
  if (!props.data?.subset_id) return '未分类';
  return subsetStore.subsetName(props.data.subset_id) || '未分类';
});

// 格式化文件大小
const formatFileSize = (size?: number) => {
  if (!size) return '未知大小';
  
  if (size < 1024) {
    return size + ' B';
  } else if (size < 1024 * 1024) {
    return (size / 1024).toFixed(2) + ' KB';
  } else if (size < 1024 * 1024 * 1024) {
    return (size / (1024 * 1024)).toFixed(2) + ' MB';
  } else {
    return (size / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  }
};

// 获取文件类型
const getFileType = () => {
  if (!props.data?.file_name) return 'unknown';
  
  const extension = props.data.file_name.split('.').pop()?.toLowerCase();
  
  // 根据文件扩展名返回文件类型
  switch (extension) {
    case 'pdf':
      return 'pdf';
    case 'doc':
    case 'docx':
      return 'word';
    case 'xls':
    case 'xlsx':
      return 'excel';
    case 'ppt':
    case 'pptx':
      return 'ppt';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
    case 'webp':
      return 'image';
    case 'mp4':
    case 'avi':
    case 'mov':
    case 'wmv':
      return 'video';
    case 'mp3':
    case 'wav':
    case 'ogg':
      return 'audio';
    case 'zip':
    case 'rar':
    case '7z':
      return 'archive';
    case 'txt':
      return 'text';
    default:
      return 'unknown';
  }
};

// 处理下载操作
const handleDownload = (e: Event) => {
  e.stopPropagation();
  if (props.data?.id) {
    loading.value = true;
    
    // 向父组件发射下载事件
    emit('download', props.data.id);
    
    // 模拟短暂的加载状态
    setTimeout(() => {
      loading.value = false;
    }, 1000);
  } else {
    console.error('无法下载文件：缺少文件ID');
  }
};
</script>

<style scoped>
.file-item {
  width: 360px;
  height: 180px;
  background: #FFFFFF;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px var(--gray-200);
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
}

/* 适配深色模式 */
[data-theme="dark"] .file-item {
  background: var(--background-topbar);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.file-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

/* 文件图标部分 */
.file-icon {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
  height: 60px;
}

/* 文件内容区域 */
.file-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.file-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.file-description {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: var(--gray-600);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* 文件信息区域 */
.file-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}

.file-meta {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: var(--gray-500);
}

.category-prefix {
  margin-right: 4px;
}

.file-size {
  color: var(--gray-600);
}

.file-stats {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--gray-500);
}

.download-button {
  margin-left: 8px;
}

/* 适配移动端 */
@media (max-width: 767px) {
  .file-item {
    height: 160px;
  }
  
  .file-icon {
    height: 40px;
    margin-bottom: 8px;
  }
}
</style>
