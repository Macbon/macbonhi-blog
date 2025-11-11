<!-- src/components/upload/upload.vue (优化版) -->

<template>  
    <div class="upload-container">  
        <div class="upload-header">
            <h3>上传文件</h3>
            <div class="upload-tips">
                <a-alert 
                    type="info" 
                    show-icon
                    message="支持大文件分片上传，可暂停继续，单个文件最大支持2GB"
                />
            </div>
        </div>
        
        <!-- 拖拽上传区域 -->
        <div 
            class="upload-area"
            @dragover.prevent
            @dragleave.prevent
            @drop.prevent="handleFileDrop"
            :class="{ 'is-dragover': isDragover }"
            @dragenter.prevent="isDragover = true"
        >
            <div class="upload-area-content">
                <div class="upload-icon">
                    <upload-outlined />
                </div>
                <p class="upload-text">拖拽文件到此处，或 <a-button type="link" @click="triggerFileSelect">点击上传</a-button></p>
                <p class="upload-hint">支持任意类型文件，单个文件最大2GB</p>
                
                <!-- 隐藏的文件输入框 -->
                <input 
                    type="file" 
                    ref="fileInput" 
                    style="display: none;" 
                    @change="handleFileSelect" 
                    multiple
                />
            </div>
        </div>
        
        <!-- 文件列表 -->
        <div class="upload-file-list" v-if="fileList.length > 0">
            <div class="file-list-header">
                <span>文件列表</span>
                <a-button type="link" @click="clearAllFiles" v-if="fileList.length > 0">清空</a-button>
            </div>
            
            <div class="file-list">
                <div class="file-item" v-for="(file, index) in fileList" :key="index">
                    <div class="file-info">
                        <div class="file-icon">
                            <file-outlined />
                        </div>
                        <div class="file-details">
                            <div class="file-name">{{ file.name }}</div>
                            <div class="file-size">{{ formatFileSize(file.size) }}</div>
                        </div>
                    </div>
                    
                    <!-- 添加文件分类选择 -->
                    <div class="file-category" v-if="file.status !== 'calculating'">
                        <a-select
                            v-model:value="file.subsetId"
                            placeholder="选择分组"
                            style="width: 120px"
                            size="small"
                            :bordered="true"
                        >
                            <a-select-option value="-1">全部</a-select-option>
                            <a-select-option 
                                v-for="item in subsetStore.data" 
                                :key="item.id" 
                                :value="item.id"
                            >
                                {{ item.name }}
                            </a-select-option>
                        </a-select>
                    </div>
                    
                    <!-- 添加文件描述输入框 -->
                    <div class="file-description" v-if="file.status !== 'calculating'">
                        <a-input
                            v-model:value="file.fileDesc"
                            placeholder="请输入文件描述"
                            size="small"
                            style="width: 200px"
                        />
                    </div>
                    
                    <div class="file-progress">
                        <template v-if="file.status === 'calculating'">
                            <div class="hash-progress">
                                <span>计算文件指纹: {{ file.hashProgress }}%</span>
                                <a-progress 
                                    :percent="file.hashProgress" 
                                    :showInfo="false"
                                    :stroke-color="getProgressColor('calculating')"
                                />
                            </div>
                        </template>
                        <template v-else>
                            <a-progress 
                                :percent="file.progress" 
                                :status="file.status === 'error' ? 'exception' : undefined"
                                :stroke-color="getProgressColor(file.status)"
                            />
                            <div v-if="file.mergeMessage" class="merge-message">
                                {{ file.mergeMessage }}
                            </div>
                            <div v-if="file.error" class="error-message">
                                {{ file.error }}
                            </div>
                        </template>
                    </div>
                    
                    <div class="file-actions">
                        <!-- 文件状态 -->
                        <template v-if="file.status === 'pending'">
                            <a-button type="primary" size="small" @click="uploadFile(file, index)">上传</a-button>
                            <a-button size="small" @click="removeFile(index)">移除</a-button>
                        </template>
                        
                        <template v-else-if="file.status === 'uploading'">
                            <a-button size="small" disabled>上传中</a-button>
                            <a-button size="small" @click="removeFile(index)">取消</a-button>
                        </template>
                        
                        <template v-else-if="file.status === 'success'">
                            <a-tag color="success">已完成</a-tag>
                            <a-button size="small" @click="removeFile(index)">移除</a-button>
                        </template>
                        
                        <template v-else-if="file.status === 'error'">
                            <a-tag color="error">上传失败</a-tag>
                            <a-button type="primary" size="small" @click="uploadFile(file, index)">重试</a-button>
                            <a-button size="small" @click="removeFile(index)">移除</a-button>
                        </template>
                        
                        <!-- 添加计算中状态 -->
                        <template v-if="file.status === 'calculating'">
                            <a-tag color="purple">计算中</a-tag>
                            <a-button size="small" @click="removeFile(index)">取消</a-button>
                        </template>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- 底部操作栏 -->
        <div class="upload-actions" v-if="fileList.length > 0">
            <a-button type="primary" @click="uploadAllFiles" :disabled="!hasReadyFiles">开始上传</a-button>
            <a-button @click="clearAllFiles">取消</a-button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, shallowRef } from 'vue';
import { message } from 'ant-design-vue';
import { UploadOutlined, FileOutlined } from '@ant-design/icons-vue';
import { useUserStore } from '../../store/user';
import { verifyFileApi, uploadChunkApi, mergeFileApi } from '../../api/index';
import { useSubset } from '../../hooks/subset';
import { useMemoryManagement } from '../../composables/useMemoryManagement';

// 获取用户Token
const userStore = useUserStore();
// 获取分类数据
const { rawSubset, subsetStore } = useSubset();

// 优化后的配置参数 - 根据设备性能动态调整
const getOptimalChunkSize = () => {
  // 根据可用内存和网络状况动态调整切片大小
  const memory = (navigator as any).deviceMemory || 4; // GB
  const connection = (navigator as any).connection;
  
  if (memory >= 8) {
    return 2 * 1024 * 1024; // 2MB for high-end devices
  } else if (memory >= 4) {
    return 1024 * 1024; // 1MB for mid-range devices
  } else {
    return 512 * 1024; // 512KB for low-end devices
  }
};

const getOptimalConcurrency = () => {
  // 根据CPU核心数和网络状况动态调整并发数
  const cores = navigator.hardwareConcurrency || 4;
  const connection = (navigator as any).connection;
  
  // 4G/WiFi网络下允许更多并发
  if (connection && (connection.effectiveType === '4g' || connection.type === 'wifi')) {
    return Math.min(cores * 2, 8);
  }
  
  return Math.min(cores, 4);
};

// 动态配置
const CHUNK_SIZE = getOptimalChunkSize();
const MAX_CONCURRENT_CHUNKS = getOptimalConcurrency();

// 文件状态类型
type FileStatus = 'pending' | 'calculating' | 'uploading' | 'paused' | 'success' | 'error';

interface FileChunk {
  index: number;
  hash: string;
  chunk: Blob;
  size: number;
  progress?: number;
  uploaded?: boolean;
}

interface UploadFile {
  file: File;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: FileStatus;
  hash?: string;
  chunks?: FileChunk[];
  uploadedChunks?: string[];
  chunkSize?: number;
  hashProgress?: number;
  worker?: Worker;
  pauseUpload?: () => void;
  abortControllers?: AbortController[];
  subsetId?: number;
  fileDesc?: string;
  error?: string;
  mergeMessage?: string;
}

// 使用shallowRef优化大文件列表的响应性能
const fileList = shallowRef<UploadFile[]>([]);
const fileInput = ref<HTMLInputElement | null>(null);
const isDragover = ref<boolean>(false);

// 声明全局类型扩展
declare global {
  interface Performance {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  }
  
  interface Window {
    gc?: () => void;
  }
}

// 内存使用监控
const memoryMonitor = {
  maxMemoryUsage: 200 * 1024 * 1024, // 200MB限制
  currentUsage: 0,
  
  checkMemory() {
    // 检查当前内存使用情况（仅在支持的浏览器中）
    if (performance.memory) {
      this.currentUsage = performance.memory.usedJSHeapSize;
      return this.currentUsage < this.maxMemoryUsage;
    }
    return true;
  },
  
  // 强制垃圾回收（开发环境）
  forceGC() {
    if (typeof window !== 'undefined' && window.gc && typeof window.gc === 'function') {
      window.gc();
    }
  }
};

// 计算属性：是否有待上传的文件
const hasReadyFiles = computed(() => {
  return fileList.value.some(file => 
    file.status === 'pending' || file.status === 'paused' || file.status === 'error'
  );
});

// 触发文件选择
const triggerFileSelect = () => {
  fileInput.value?.click();
};

// 处理文件选择
const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    addFiles(Array.from(input.files));
    input.value = '';
  }
};

// 处理文件拖放
const handleFileDrop = (event: DragEvent) => {
  isDragover.value = false;
  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    addFiles(Array.from(files));
  }
};

// 优化后的文件添加逻辑
const addFiles = (files: File[]) => {
  // 检查内存使用情况
  if (!memoryMonitor.checkMemory()) {
    message.warning('内存使用过高，请等待当前文件处理完成');
    return;
  }
  
  const newFiles = files.map(file => ({
    file,
    name: file.name,
    size: file.size,
    type: file.type,
    progress: 0,
    hashProgress: 0,
    status: 'pending' as FileStatus,
    chunkSize: CHUNK_SIZE,
    abortControllers: [],
    subsetId: undefined,
    fileDesc: '',
    error: undefined,
    mergeMessage: undefined
  }));
  
  // 使用浅拷贝优化性能
  fileList.value = [...fileList.value, ...newFiles];
};

// 使用Web Crypto API计算文件哈希
const calculateHashWithWebCrypto = async (file: UploadFile): Promise<string> => {
  const CHUNK_SIZE_FOR_HASH = 2 * 1024 * 1024; // 2MB per chunk for hashing
  const fileSize = file.file.size;
  let offset = 0;
  let progress = 0;
  
  // 使用SHA-256算法
  const hashBuffer = await crypto.subtle.digest('SHA-256', new ArrayBuffer(0));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  
  // 创建一个简单的流式哈希计算
  const chunks: ArrayBuffer[] = [];
  
  while (offset < fileSize) {
    const chunk = file.file.slice(offset, offset + CHUNK_SIZE_FOR_HASH);
    const arrayBuffer = await chunk.arrayBuffer();
    chunks.push(arrayBuffer);
    
    offset += CHUNK_SIZE_FOR_HASH;
    progress = Math.min(Math.floor((offset / fileSize) * 100), 100);
    
    // 更新进度
    file.hashProgress = progress;
    fileList.value = [...fileList.value];
    
    // 给UI一些更新时间
    await new Promise(resolve => setTimeout(resolve, 1));
  }
  
  // 将所有chunks合并
  const totalSize = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const mergedBuffer = new ArrayBuffer(totalSize);
  const mergedView = new Uint8Array(mergedBuffer);
  
  let position = 0;
  for (const chunk of chunks) {
    mergedView.set(new Uint8Array(chunk), position);
    position += chunk.byteLength;
  }
  
  // 计算最终哈希
  const finalHashBuffer = await crypto.subtle.digest('SHA-256', mergedBuffer);
  const finalHashArray = Array.from(new Uint8Array(finalHashBuffer));
  const hashHex = finalHashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
};

// 优化后的哈希计算 - 使用浏览器原生Web Crypto API
const calculateFileHash = async (file: UploadFile, index: number): Promise<string> => {
  file.status = 'calculating';
  file.progress = 0;
  file.hashProgress = 0;
  
  try {
    // 使用Web Crypto API计算哈希，无需外部依赖
    const fileHash = await calculateHashWithWebCrypto(file);
    
    // 生成文件切片信息
    const chunks: FileChunk[] = [];
    const chunkSize = file.chunkSize || CHUNK_SIZE;
    let offset = 0;
    let chunkIndex = 0;
    
    while (offset < file.file.size) {
      const chunk = file.file.slice(offset, offset + chunkSize);
      chunks.push({
        index: chunkIndex,
        hash: `${fileHash}-${chunkIndex}`,
        chunk,
        size: chunk.size,
        progress: 0,
        uploaded: false
      });
      
      offset += chunkSize;
      chunkIndex++;
    }
    
    // 更新文件状态
    file.hash = fileHash;
    file.chunks = chunks;
    file.status = 'pending';
    file.hashProgress = 100;
    fileList.value = [...fileList.value];
    
    return fileHash;
    
  } catch (error: any) {
    file.status = 'error';
    file.error = `哈希计算失败: ${error.message}`;
    fileList.value = [...fileList.value];
    throw error;
  }
};

// 优化后的切片上传 - 内存管理优化
const uploadChunks = async (file: UploadFile, chunks: FileChunk[]): Promise<void> => {
  let uploadedCount = 0;
  const totalChunks = chunks.length;
  
  // 创建信号量控制并发
  const semaphore = Array(MAX_CONCURRENT_CHUNKS).fill(null).map(() => Promise.resolve());
  let semaphoreIndex = 0;
  
  const uploadPromises = chunks.map(async (chunk, index) => {
    // 等待信号量
    await semaphore[semaphoreIndex % MAX_CONCURRENT_CHUNKS];
    
    // 创建新的Promise用于信号量管理
    let resolveSemaphore: () => void;
    semaphore[semaphoreIndex % MAX_CONCURRENT_CHUNKS] = new Promise(resolve => {
      resolveSemaphore = resolve;
    });
    semaphoreIndex++;
    
    try {
      // 检查内存使用情况
      if (!memoryMonitor.checkMemory()) {
        // 内存不足时，强制进行垃圾回收
        memoryMonitor.forceGC();
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const formData = new FormData();
      formData.append('chunk', chunk.chunk);
      formData.append('hash', chunk.hash);
      formData.append('filename', file.name);
      formData.append('fileHash', file.hash!);
      formData.append('token', userStore.token);
      
      const abortController = new AbortController();
      file.abortControllers?.push(abortController);
      
      await uploadChunkApi(formData, (progressEvent) => {
        if (progressEvent.total) {
          chunk.progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          
          // 计算整体进度
          const totalProgress = chunks.reduce((acc, c) => acc + (c.progress || 0), 0);
          file.progress = Math.round(totalProgress / totalChunks);
          
          // 使用节流的方式更新UI，避免频繁重渲染
          if (index % 5 === 0 || chunk.progress === 100) {
            fileList.value = [...fileList.value];
          }
        }
      });
      
      chunk.uploaded = true;
      uploadedCount++;
      
      // 及时清理已上传的chunk数据，释放内存
      chunk.chunk = new Blob(); // 清空blob数据
      
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error(`切片 ${chunk.index} 上传失败:`, error);
        throw error;
      }
    } finally {
      // 释放信号量
      resolveSemaphore!();
    }
  });
  
  await Promise.all(uploadPromises);
  
  // 上传完成后强制进行一次垃圾回收
  memoryMonitor.forceGC();
};

// 使用内存管理
const memoryManager = useMemoryManagement({
  componentName: 'UploadComponent',
  trackEventListeners: true,
  trackTimers: true,
  autoCleanup: true
});

// 组件挂载时获取分类数据
onMounted(() => {
  rawSubset(2);
  
  // 添加内存监控
  const memoryCheckInterval = memoryManager.setInterval(() => {
    const stats = memoryManager.getResourceStats();
    if (stats.timers > 10 || stats.eventListeners > 20) {
      console.warn('📊 上传组件资源使用较高，建议清理已完成的上传任务', stats);
    }
  }, 30000); // 每30秒检查一次
});

// 清理资源
onBeforeUnmount(() => {
  console.log('📤 开始清理上传组件资源...');
  
  // 终止所有worker和请求
  fileList.value.forEach(file => {
    if (file.worker) {
      file.worker.terminate();
      file.worker = null;
    }
    if (file.abortControllers) {
      file.abortControllers.forEach(controller => {
        try {
          controller.abort();
        } catch (error) {
          console.warn('清理abort controller失败:', error);
        }
      });
      file.abortControllers = [];
    }
  });
  
  // 清空文件列表，释放内存
  fileList.value = [];
  
  console.log('📤 上传组件资源清理完成');
});

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 获取进度条颜色
const getProgressColor = (status: FileStatus) => {
  switch (status) {
    case 'success': return '#52c41a';
    case 'error': return '#f5222d';
    case 'uploading': return '#1890ff';
    case 'paused': return '#faad14';
    case 'calculating': return '#722ed1';
    default: return '#1890ff';
  }
};

// 移除文件
const removeFile = (index: number) => {
  const file = fileList.value[index];
  
  // 如果有worker，终止它
  if (file.worker) {
    file.worker.terminate();
  }
  
  // 取消所有正在进行的请求
  if (file.abortControllers) {
    file.abortControllers.forEach(controller => {
      controller.abort();
    });
  }
  
  fileList.value.splice(index, 1);
};

// 清空所有文件
const clearAllFiles = () => {
  // 终止所有worker和请求
  fileList.value.forEach(file => {
    if (file.worker) {
      file.worker.terminate();
    }
    if (file.abortControllers) {
      file.abortControllers.forEach(controller => {
        controller.abort();
      });
    }
  });
  
  fileList.value = [];
};

// 上传单个文件
const uploadFile = async (file: UploadFile, index: number) => {
  try {
    file.status = 'uploading';
    fileList.value = [...fileList.value];
    
    // 如果没有哈希，先计算哈希
    if (!file.hash) {
      await calculateFileHash(file, index);
    }
    
    // 开始上传切片
    if (file.chunks) {
      await uploadChunks(file, file.chunks);
      
      // 合并文件
      file.mergeMessage = '正在合并文件...';
      fileList.value = [...fileList.value];
      
      await mergeFileApi({
        token: userStore.token,
        filename: file.name,
        fileHash: file.hash!,
        subsetId: file.subsetId || -1,
        fileDesc: file.fileDesc || ''
      });
      
      file.status = 'success';
      file.progress = 100;
      file.mergeMessage = '文件上传完成';
      fileList.value = [...fileList.value];
    }
    
  } catch (error: any) {
    file.status = 'error';
    file.error = error.message || '上传失败';
    fileList.value = [...fileList.value];
  }
};

// 上传所有文件
const uploadAllFiles = () => {
  fileList.value.forEach((file, index) => {
    if (file.status === 'pending' || file.status === 'error') {
      uploadFile(file, index);
    }
  });
};
</script>

<style scoped>
.upload-container {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.upload-header {
  margin-bottom: 20px;
}

.upload-header h3 {
  margin: 0 0 10px 0;
  font-size: 18px;
  font-weight: 600;
}

.upload-area {
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  background: #fafafa;
  transition: all 0.3s ease;
  cursor: pointer;
}

.upload-area:hover,
.upload-area.is-dragover {
  border-color: #1890ff;
  background: #f0f8ff;
}

.upload-icon {
  font-size: 48px;
  color: #d9d9d9;
  margin-bottom: 16px;
}

.upload-text {
  font-size: 16px;
  color: #666;
  margin: 0 0 8px 0;
}

.upload-hint {
  font-size: 14px;
  color: #999;
  margin: 0;
}

.upload-file-list {
  margin-top: 20px;
}

.file-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-weight: 600;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  margin-bottom: 8px;
  background: #fafafa;
}

.file-info {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.file-icon {
  font-size: 24px;
  color: #1890ff;
  margin-right: 12px;
}

.file-details {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-weight: 500;
  color: #262626;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 2px;
}

.file-category,
.file-description {
  margin: 0 12px;
}

.file-progress {
  flex: 1;
  margin: 0 12px;
}

.hash-progress span {
  font-size: 12px;
  color: #722ed1;
  margin-bottom: 4px;
  display: block;
}

.merge-message {
  font-size: 12px;
  color: #1890ff;
  margin-top: 4px;
}

.error-message {
  font-size: 12px;
  color: #f5222d;
  margin-top: 4px;
}

.file-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.upload-actions {
  margin-top: 20px;
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.upload-actions .ant-btn {
  margin: 0 8px;
}
</style>