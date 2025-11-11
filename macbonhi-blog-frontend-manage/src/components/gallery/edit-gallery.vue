<template>
    <div class="edit-gallery">
        
        <div class="upload-gallery">
            <a-upload-dragger
                v-model:fileList="fileList"
                name="file"
                :multiple="true"
                :before-upload="beforeUpload"
                :custom-request="customRequest"
                :show-upload-list="false"
            >
                <p class="ant-upload-drag-icon">
                <inbox-outlined></inbox-outlined>
                </p>
                <p class="ant-upload-text">单击或拖动文件到此区域进行上传</p>
                <p class="ant-upload-hint">
                    支持单次或批量上传。仅支持图片文件（.jpg、.jpeg、.png、.gif）。
                </p>
            </a-upload-dragger>
        </div>

        <div class="waterfall">
            <div class="waterfall-image" v-for="item in photo" :key="item.id">
                <div class="image-homo" v-show="item.id === photoHome">
                    <StarFilled class="icon-star"/>
                </div>

                <img :src="cover(item)" class="image-water" @click="previewImage(item)">
                <div class="gallery-item-operation">

                    <div class="operation-1" @click="changeHome({id: item.id, url: item.url})" v-show="item.id !== photoHome">
                        <a-tooltip placement="top" title="设为封面">
                            <HomeOutlined class="icon"/>
                        </a-tooltip>
                    </div>
                    <div class="operation-2">
                        <a-popconfirm placement="bottom" ok-text="是" cancel-text="否" @confirm="deletegallery({id: item.id, url: item.url})">
                            <template #title>
                                确认删除
                            </template>
                            <DeleteOutlined class="icon"/>
                        </a-popconfirm>
                    </div>

                </div>

            </div>

        </div>

        <!-- 图片预览模态框 -->
        <a-modal 
            :open="previewVisible" 
            :title="previewTitle" 
            :footer="null" 
            @cancel="closePreview"
            :width="800"
            centered
        >
            <img alt="preview" style="width: 100%" :src="previewImageUrl" />
        </a-modal>

    </div>
</template>

<script setup lang="ts">

import { onMounted, ref, watch, nextTick } from 'vue';
import { InboxOutlined, HomeOutlined, DeleteOutlined, StarFilled } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import type { UploadChangeParam } from 'ant-design-vue';
import { useUserStore } from '../../store/user';
import {baseUrl} from '../../utils/env';
import { useFiles } from '../../hooks/files';
// 导入配置好的 axios 实例
import request from '../../utils/axios';

const { deleteFile } = useFiles();

const emits = defineEmits(['changeHome', 'editGallery']);

// 定义图库项的类型接口
interface GalleryItem {
    id: number;
    url: string;
    title?: string;
    description?: string;
}

const userStore = useUserStore();

// 存储图库内容
const photo = ref<GalleryItem[]>([]);
// 存储首页展示图片ID
const photoHome = ref<number>(0);

// 定义 props
const props = withDefaults(defineProps<{
    defaultImages?: any[]
}>(), {
    defaultImages: () => []
});

// 生成图片URL
const cover = (item: GalleryItem) => {
    // 如果已经是完整URL或base64，直接返回
    if (item.url && (item.url.startsWith('http://') || 
                     item.url.startsWith('https://') || 
                     item.url.startsWith('data:'))) {
        return item.url;
    }
    
    // 如果是相对路径，直接返回（浏览器会自动使用当前协议）
    return item.url || '';
}

// 上传处理部分
const fileList = ref([]);

// 上传前验证文件类型
const beforeUpload = (file: File) => {
  
    const isImage = file.type.startsWith('image/');
    if (!isImage) { 
        message.error(`${file.name} 不是图片文件`);
        return false;
    }
    
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
        message.error('图片大小必须小于5MB');
        return false;
    }
    
    return isImage && isLt5M;
};

// 获取Base64用于本地预览
function getBase64(file: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
}

// 自定义上传函数
// 自定义上传函数
const customRequest = async (options: any) => {
    const { file, onSuccess, onError, onProgress } = options;
    
    const formData = new FormData();
    formData.append('file', file);
    // 添加 token 到 FormData
    formData.append('token', userStore.token || '');
    
    console.log('开始上传图片:', file.name);
    console.log('Token:', userStore.token ? '已添加' : '未找到');
    
    try {
        // 使用配置好的 request 实例
        const response = await request.post('/file/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: (progressEvent) => {
                if (progressEvent.total) {
                    const percent = (progressEvent.loaded / progressEvent.total) * 100;
                    onProgress({ percent });
                }
            }
        });
        
        console.log('上传响应:', response);
        
        // 处理响应
        if (response.code === 200 && response.data?.url) {
            let fileUrl = response.data.url;
            
            // 如果已经是完整URL（http/https开头），直接使用
            if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
                // 已经是完整URL，直接使用
                console.log('使用完整URL:', fileUrl);
            } else {
                // 相对路径，确保以 / 开头
                if (!fileUrl.startsWith('/')) {
                    fileUrl = '/' + fileUrl;
                }
                console.log('使用相对路径:', fileUrl);
            }
            
            console.log('最终图片URL:', fileUrl);
            
            // 使用服务器返回的ID，如果没有则生成一个临时ID
            const fileId = response.data.id || response.data.fileId || Date.now() + Math.random();
            
            // 添加到图库
            const newItem: GalleryItem = {
                id: fileId,
                url: fileUrl,  // 使用相对路径
                title: file.name || `图片_${fileId}`
            };
            
            photo.value.push(newItem);
            
            // 如果是第一张图片，自动设为封面
            if (photo.value.length === 1) {
                photoHome.value = fileId;
                emits('changeHome', fileUrl);  // 传递相对路径
            }
            
            // 调用成功回调
            onSuccess(response);
            
            message.success(`${file.name} 上传成功`);
            // 通知父组件
            emits('editGallery', photo.value);
        } else if (response.code === 401) {
            console.error('上传失败: 用户未登录或token无效', response);
            message.error('请先登录');
            onError(new Error('未授权'));
            // 使用本地预览
            await handleUploadFallback(file);
        } else {
            console.error('上传响应异常:', response);
            const errorMsg = response.message || '上传失败';
            message.error(errorMsg);
            onError(new Error(errorMsg));
            // 使用本地预览
            await handleUploadFallback(file);
        }
    } catch (error: any) {
        console.error('上传请求失败:', error);
        
        // 根据错误类型给出不同提示
        if (error.response?.status === 413) {
            message.error('文件太大，请选择小于5MB的图片');
        } else if (error.response?.status === 401) {
            message.error('请先登录');
        } else if (error.response?.status === 500) {
            message.error('服务器错误，请稍后重试');
        } else {
            message.error('上传失败: ' + (error.message || '未知错误'));
        }
        
        onError(error);
        // 使用本地预览
        await handleUploadFallback(file);
    }
};

// 处理上传失败的降级方案
const handleUploadFallback = async (file: File) => {
    try {
        const base64Url = await getBase64(file);
        // 使用时间戳作为临时ID
        const tempId = Date.now() + Math.random();
        const newItem: GalleryItem = {
            id: tempId,
            url: base64Url,
            title: file.name || `图片_${tempId} (本地)`
        };
        
        photo.value.push(newItem);
        
        if (photo.value.length === 1) {
            photoHome.value = tempId;
            emits('changeHome', base64Url);
        }
        
        message.warning(`${file.name} 上传失败，使用本地预览`);
        emits('editGallery', photo.value);
    } catch (err) {
        console.error('生成本地预览失败:', err);
        message.error(`${file.name} 上传失败且无法生成预览`);
    }
};

// 简化 handleChange 函数，主要逻辑已移到 customRequest
const handleChange = (info: UploadChangeParam) => {
    // 主要处理已在 customRequest 中完成
    // 这里可以处理其他需要的状态变化
};

const deletegallery = (data:{id:number,url:string}) => {

  // 从前端数组中移除
  photo.value = photo.value.filter((obj: GalleryItem) => {
      return obj.id !== data.id
  })

  //这里我们删除图片时，我们调用父组件的editGallery方法，将图片数据传递过去
  emits('editGallery', photo.value);
  
  // 处理封面图片
  if (photoHome.value === data.id && photo.value.length > 0) {
    photoHome.value = photo.value[0].id;
    emits('changeHome', photo.value[0].url);
  } else if(photoHome.value === data.id && photo.value.length <= 0) {
    photoHome.value = -1;
    emits('changeHome', '');
  }
  
  // 处理URL，提取相对路径
  let fileUrl = data.url;
  
  // 如果是base64图片，不需要删除服务器文件
  if (fileUrl.startsWith('data:')) {
    return;
  }
  
  // 确保路径格式正确
  if (!fileUrl.startsWith('/')) {
    fileUrl = '/' + fileUrl;
  }
   
  // 调用删除API，不使用Promise链式调用
  try {
    deleteFile({id: data.id, filesUrl: fileUrl});
  } catch (err) {
    console.error('文件删除请求失败:', err);
    message.error('文件删除请求失败');
  }
};

//切换封面
const changeHome = (data:{id:number,url:string}) => {
    photoHome.value = data.id;
    emits('changeHome', data.url);
}

// 预览相关状态
const previewVisible = ref<boolean>(false);
const previewImageUrl = ref<string>('');
const previewTitle = ref<string>('图片预览');

// 预览图片
const previewImage = (item: GalleryItem) => {
    previewImageUrl.value = cover(item);
    previewTitle.value = item.title || '图片预览';
    previewVisible.value = true;
};

// 关闭预览
const closePreview = () => {
    previewVisible.value = false;
    previewImageUrl.value = '';
};

// 添加获取图库内容的方法
const getGalleryContent = () => {
    // 找到被设置为封面的图片URL
    const coverImage = photo.value.find(item => item.id === photoHome.value);
    return {
        images: photo.value,
        cover: coverImage ? coverImage.url : ''
    };
};

// 初始化默认图片数据的函数
const initializeDefaultImages = () => {
    if (props.defaultImages && props.defaultImages.length > 0) {
        
        // 处理默认图片数据，确保格式正确
        const processedImages = props.defaultImages.map(item => ({
            id: item.id || Date.now() + Math.random(),
            url: item.url || item.src || '',
            title: item.title || item.name || `图片_${item.id}`
        }));
        
        // 设置图片数据
        photo.value = processedImages;
        
        // 设置封面 - 查找第一张图片或已设置的封面
        if (processedImages.length > 0) {
            // 如果有封面URL，找到对应的图片ID
            const coverImage = processedImages.find(img => img.url === props.defaultImages[0]?.cover);
            if (coverImage) {
                photoHome.value = coverImage.id;
            } else {
                // 否则使用第一张图片作为封面
                photoHome.value = processedImages[0].id;
            }
        }
    } else {
    }
};

// 监听 props.defaultImages 的变化
watch(() => props.defaultImages, (newImages) => {
    if (newImages && newImages.length > 0) {
        nextTick(() => {
            initializeDefaultImages();
        });
    }
}, { 
    deep: true, 
    immediate: true  // 立即执行一次
});

// 暴露方法给父组件
defineExpose({
    getGalleryContent
});

// 组件挂载时初始化
onMounted(() => {
    // 如果已经有默认图片，立即初始化
    if (props.defaultImages && props.defaultImages.length > 0) {
        initializeDefaultImages();
    }
});

</script >

<style scoped>
    
/* 整体容器深浅适配 */
.edit-gallery {
  background: var(--background-topbar);
  border-radius: 8px;
  padding: 24px;
  color: var(--text-color);
}

[data-theme="dark"] .edit-gallery {
  background: var(--background-topbar);
}

/* 上传区域深浅适配 */
:deep(.ant-upload-drag) {
  background: var(--background-topbar) !important;
  border: 1px dashed var(--gray-300) !important;
}

[data-theme="dark"] :deep(.ant-upload-drag) {
  background: var(--background-color) !important;
  border: 1px dashed var(--gray-600) !important;
}

:deep(.ant-upload-text),
:deep(.ant-upload-hint) {
  color: var(--text-color) !important;
}

[data-theme="dark"] :deep(.ant-upload-text),
[data-theme="dark"] :deep(.ant-upload-hint) {
  color: var(--gray-400) !important;
}

/* 操作按钮深浅适配 */
.operation-1,
.operation-2 {
  background-color: rgba(255, 255, 255, 0.56);
  border-radius: 8px;
  padding: 4px;
}

[data-theme="dark"] .operation-1,
[data-theme="dark"] .operation-2 {
  background-color: rgba(30, 32, 37, 0.7);
}

.operation-1:hover,
.operation-2:hover {
  background-color: rgba(255, 255, 255, 0.64);
}

[data-theme="dark"] .operation-1:hover,
[data-theme="dark"] .operation-2:hover {
  background-color: rgba(30, 32, 37, 0.85);
}

/* 图标颜色深浅适配 */
.icon {
  color: var(--text-color);
}

.icon:hover {
  color: var(--blue-600);
}

[data-theme="dark"] .icon:hover {
  color: var(--blue-400);
}

/* 首页星标图标保持黄色 */
.icon-star {
  color: #FFA115;
}

/* 瀑布流图片边框适配 */
.waterfall-image {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
}

[data-theme="dark"] .waterfall-image {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}

.waterfall-image:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

[data-theme="dark"] .waterfall-image:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
}

.edit-gallery{
    background: #fff;
    border-radius: 8px;
    padding: 24px;
}

.upload-gallery{
    width:100%;
    margin: 0;
}

.waterfall{
    width: 100%;
    column-count: 3;
    column-width: 24px;
    padding-top: 32px;
}
.waterfall-image{
    position: relative;
    border-radius: 8px;
    margin-bottom: 24px;    
    overflow: hidden;
    line-height: 0;
}

.image-water{
    width: 100%;
    cursor: pointer; /* 添加指针样式表明可点击 */
    transition: transform 0.2s; /* 添加过渡效果 */
}

.image-water:hover {
    transform: scale(1.02); /* 悬停时轻微放大 */
}

/* 操作icon样式 */
.gallery-item-operation{
    position:absolute;
    right: 16px;
    top:16px;
    text-align: right;
    flex-shrink: 0;
    margin-left: auto; /* 强制推到右边 */
    display: flex; /* 添加display: flex */
    gap: 8px;     /* 设置间距为8px */
    align-items: center; /* 垂直居中 */

    opacity: 0;
}

.image-homo{
    position:absolute;
    left: 16px;
    top: 16px;
    text-align: left;
    flex-shrink: 0;
    margin-right: auto; /* 强制推到右边 */
    display: flex; /* 添加display: flex */
    align-items: center; /* 垂直居中 */

}

.waterfall-image{
    &:hover{
        .gallery-item-operation{
            opacity: 1;
        }
        .image-homo{
            opacity: 1;
        }
    }
}

.icon{
    width: 24px;
    height: 24px;
    padding: 5px;
    cursor: pointer;
    flex-shrink: 0; /* 防止icon缩小 */
    &:hover{
        color: #2B5AED;
        transform: scale(1.1);
    }
}

.icon-star{
    width: 32px;
    height: 32px;
    padding: 5px;
    cursor: pointer;
    flex-shrink: 0; /* 防止icon缩小 */
    color: #FFA115;
}

</style>