<template>
  <div class="download-container">
    <div v-for="(file, index) in homeFiles" :key="file.id" class="download-item">
      <div class="file-icon">
        <FileIcon :fileType="getFileType(file)" />
      </div>
      <div class="download-content">
        <h3 class="download-title">{{ file.file_name }}</h3>
        <p class="download-desc">{{ file.file_desc || '暂无描述' }}</p>
        <div class="download-meta">
          <span class="download-author">分类：{{ categoryName(file.subset_id) }}</span>
          <div class="download-stats">
            <span>下载：{{ file.download_count || 0 }}次</span>
            <span>大小：{{ formatFileSize(file.file_size) }}</span>
          </div>
        </div>
        <div class="download-actions">
          <button class="action-btn primary" @click="handleFileDownload(file.id)">立即下载</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useFile } from '../../hooks/filedownload';
import type { FileData } from '../../hooks/filedownload';
import { useUserStore } from '../../store/user';
import { useSubsetStore } from '../../store/subset';
import FileIcon from '../../components/Files/FileIcon.vue';

// 路由
const router = useRouter();

// 用户数据
const userStore = useUserStore();
const subsetStore = useSubsetStore();

// Props定义
const props = defineProps({
  limit: {
    type: Number,
    default: 4, // 默认获取4个文件
  }
});

// 文件下载相关
const { fileList: homeFiles, getdata: getFiles, downloadFile } = useFile();

// 获取分类名称
const categoryName = (subsetId: number | undefined | null) => {
  if (!subsetId) return '未分类';
  return subsetStore.subsetName(subsetId, 2) || '未分类';
};

// 获取文件类型
const getFileType = (file: FileData) => {
  if (!file?.file_name) return 'unknown';
  
  const extension = file.file_name.split('.').pop()?.toLowerCase();
  
  // 根据文件扩展名返回文件类型
  switch (extension) {
    case 'pdf': return 'pdf';
    case 'doc': case 'docx': return 'word';
    case 'xls': case 'xlsx': return 'excel';
    case 'ppt': case 'pptx': return 'ppt';
    case 'jpg': case 'jpeg': case 'png': case 'gif': case 'bmp': case 'webp': return 'image';
    case 'mp4': case 'avi': case 'mov': case 'wmv': return 'video';
    case 'mp3': case 'wav': case 'ogg': return 'audio';
    case 'zip': case 'rar': case '7z': return 'archive';
    case 'txt': return 'text';
    default: return 'unknown';
  }
};

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

// 处理文件下载
const handleFileDownload = (fileId: number | string) => {
  downloadFile(fileId, userStore.token);
};

// 获取首页文件列表
const fetchHomeFiles = async () => {
  const params = {
    token: userStore.token,
    pageSize: props.limit,  // 首页只获取指定数量的文件
    nowPage: 1,
    state: 1,     // 只获取已发布的文件
    subsetId: -1, // 不限制分类
    count: true
  };
  
  await getFiles(params);
};

// 组件挂载时加载数据
onMounted(async () => {
  // 获取文件数据
  await fetchHomeFiles();
});
</script>

<style scoped>
/* 下载区样式 */
.download-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.download-item {
  display: flex;
  gap: 16px;
  background: var(--background-topbar);
  border-radius: 8px;
  padding: 24px;
}

.file-icon {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  font-size: 32px;
  height: 64px;
  width: 64px;
}

.download-content {
  flex: 1;
}

.download-title {
  font-size: 18px;
  margin: 0 0 4px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.download-desc {
  font-size: 14px;
  color: var(--gray-600);
  margin: 0 0 8px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 42px;
}

.download-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
  font-size: 12px;
  color: var(--gray-500);
}

.download-stats {
  display: flex;
  gap: 12px;
}

.download-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  border: 1px solid var(--gray-300);
  background: none;
  padding: 6px 14px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 13px;
}

.action-btn.primary {
  background-color: var(--blue-500);
  color: white;
  border-color: var(--blue-500);
  padding: 6px 18px;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
}

.action-btn.primary:hover {
  background-color: var(--blue-600);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

/* 响应式调整 */
@media (max-width: 1024px) {
  .download-container {
    grid-template-columns: repeat(1, 1fr);
  }
}
</style> 