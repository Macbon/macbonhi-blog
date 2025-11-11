<template>
    <div class="froms">
        <div class="form-title">
            <!-- 标题输入 -->
            <a-input 
                type="text" 
                class="form-title-content" 
                placeholder="请输入标题" 
                :bordered="false" 
                v-model:value="formData.title"
            />

            <!-- 分类和标签选择 -->
            <div class="label-subset">
                <!-- 分组选择 -->
                <div style="padding-left:11px">
                    <a-select
                        v-model:value="value"
                        style="width: 120px"
                        :dropdown-match-select-width="false"
                        :placement="placement"
                        placeholder="选择分组(可选)"
                        allow-clear
                        @clear="clearSubset"
                    >
                        <a-select-option 
                            v-for="item in subsetStore.data" 
                            :key="item.id" 
                            :value="item.name" 
                            @click="subsetSelected(item.id)"
                        >
                            {{ item.name }}
                        </a-select-option>
                    </a-select>
                </div>

                <!-- 标签选择 -->
                <div class="tag-select">
                    <a-select
                        v-model:value="labelValue"
                        class="tag-selected"
                        mode="multiple"
                        style="width: 200px"
                        placeholder="请选择tag（最多3个）"
                        :options="options"
                        :field-names="{ label: 'name', value: 'id' }"
                        :max-tag-count="maxTagCount"
                        :bordered="false"
                        @change="handleTagChange"
                        :tokenSeparators="[',']"
                        @search="onSearch"
                        :open="dropdownVisible"
                        @dropdownVisibleChange="handleDropdownVisible"
                    >
                        <template #dropdownRender="{ menuNode: menu }">
                            <v-nodes :vnodes="menu" />
                            <a-divider style="margin: 4px 0" />
                            <div
                                style="padding: 8px; cursor: pointer; display: flex; justify-content: space-between; align-items: center;"
                                @mousedown="e => e.preventDefault()"
                            >
                                <div class="new-tag-item" v-if="searchValue">
                                    <a @click="addNewTag">
                                        <plus-outlined />
                                        创建 "{{ searchValue }}"
                                    </a>
                                </div>
                            </div>
                        </template>
                    </a-select>
                </div>
            </div>

            <!-- 简介输入 -->
            <div :class="{ 'form-introduce': props.classify === 0 }">
                <a-textarea 
                    v-model:value="formData.inroduce" 
                    :bordered="false" 
                    placeholder="请输入简介" 
                    :autosize="textareaRows" 
                />
            </div>

            <!-- 封面上传（仅文章类型显示） -->
            <div class="form-upload" v-if="props.classify === 0">
                <a-upload
                    v-model:file-list="fileList"
                    list-type="picture-card"
                    @preview="handlePreview"
                    :before-upload="beforeUpload"
                    :custom-request="customRequest"
                    name="file"
                >
                    <div v-if="fileList.length < 8">
                        <plus-outlined />
                        <div style="margin-top: 8px">上传封面</div>
                    </div>
                </a-upload>
                
                <!-- 图片预览模态框 -->
                <a-modal 
                    :open="previewVisible" 
                    :title="previewTitle" 
                    :footer="null" 
                    @cancel="handleCancel"
                >
                    <img alt="example" style="width: 100%" :src="previewImage" />
                </a-modal>
            </div>
        </div>
    </div>
</template>     

<script setup lang="ts">
import { computed, onMounted, ref, defineExpose, watch } from 'vue'
import type { SelectProps } from 'ant-design-vue'
import { message } from 'ant-design-vue'
import type { UploadChangeParam, UploadFile } from 'ant-design-vue'
import type { RcFile } from 'ant-design-vue/es/vc-upload/interface';
import { PlusOutlined } from '@ant-design/icons-vue'
import { useSubset } from '../../hooks/subset'
import { useLabel } from '../../hooks/laebl'
import { addLabelApi } from '../../api/index'
import { useUserStore } from '../../store/user'
import { useCode } from '../../hooks/code'
import { baseUrl } from '../../utils/env'
import type { ArticleFormData } from '../../utils/typeof'
// 导入配置好的 axios 实例
import request from '../../utils/axios'

// ==================== Props & Emits ====================
const emit = defineEmits(['nowSubset'])

type PropsFormData = {
    classify?: number
    formData?: ArticleFormData
}

const props = withDefaults(defineProps<PropsFormData>(), {
    classify: 0,
})

// ==================== Stores & Hooks ====================
const userStore = useUserStore()
const { tackleCode } = useCode()
const { rawSubset, subsetStore } = useSubset(emit)
const { rawLabel, labelStore } = useLabel()

// ==================== Form Data ====================
const formData = ref<ArticleFormData>({
    title: "",
    subset_id: null, 
    label: [], 
    inroduce: '',
    cover: '',
    classify: props.classify,
})

// ==================== UI State ====================
const value = ref('')
const labelValue = ref<number[]>([])
const placement = ref('bottomLeft' as const)
const options = ref<SelectProps['options']>([])
const maxTagCount = ref(3)
const dropdownVisible = ref<boolean>(false)
const searchValue = ref<string>('')

// ==================== Image Upload State ====================
const fileList = ref<UploadFile[]>([])
const loading = ref<boolean>(false)
const imageUrl = ref<string>('')
const previewVisible = ref(false)
const previewImage = ref('')
const previewTitle = ref('')

// ==================== Computed Properties ====================
const textareaRows = computed(() => {
    return props.classify === 1 
        ? { minRows: 24, maxRows: 30 }
        : { minRows: 4, maxRows: 10 }
})

// ==================== Helper Functions ====================
const VNodes = {
    functional: true,
    props: { vnodes: { type: Object, required: true } },
    render: (props: { vnodes: any }) => props.vnodes,
}

// Base64 转换工具函数
const getBase64 = (file: File | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = error => reject(error)
    })
}

// ==================== Image Upload Functions ====================
const beforeUpload = (file: RcFile) => {
    if (!userStore.token) {
        message.error('请先登录')
        return false
    }
    
    const isImage = file.type === 'image/jpeg' || file.type === 'image/png'
    if (!isImage) {
        message.error('只能上传 JPG/PNG 格式的图片!')
        return false
    }
    
    const isLt2M = file.size / 1024 / 1024 < 2
    if (!isLt2M) {
        message.error('图片大小必须小于2MB')
        return false
    }
    
    return true
}

// 自定义上传函数
const customRequest = async (options: any) => {
    const { file, onSuccess, onError, onProgress } = options;
    
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('token', userStore.token || '');
    

    try {
        // 使用配置好的 request 实例
        const response = await request.post('/file/upload', uploadFormData, {
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
            

            // 更新表单数据 - 保存相对路径
            imageUrl.value = fileUrl;
            formData.value.cover = fileUrl;
            
            // 调用成功回调，传递完整的响应数据
            onSuccess(response);
            
            // 更新文件列表 - 预览时也使用相对路径
            fileList.value = [{
                uid: '-1',
                name: '封面图片',
                status: 'done',
                url: fileUrl,  // 使用相对路径，让浏览器自动处理协议
                response: response
            } as UploadFile];
            
            message.success('封面上传成功');
        } else if (response.code === 401) {
            console.error('上传失败: 用户未登录或token无效', response);
            message.error('请先登录');
            onError(new Error('未授权'));
            // 使用本地预览
            await handleUploadFallback(file, file.name);
        } else {
            console.error('上传响应异常:', response);
            const errorMsg = response.message || '上传失败';
            message.error(errorMsg);
            onError(new Error(errorMsg));
            // 使用本地预览
            await handleUploadFallback(file, file.name);
        }
    } catch (error: any) {
        console.error('上传请求失败:', error);
        
        // 根据错误类型给出不同提示
        if (error.response?.status === 413) {
            message.error('文件太大，请选择小于2MB的图片');
        } else if (error.response?.status === 401) {
            message.error('请先登录');
        } else if (error.response?.status === 500) {
            message.error('服务器错误，请稍后重试');
        } else {
            message.error('上传失败: ' + (error.message || '未知错误'));
        }
        
        onError(error);
        // 使用本地预览
        await handleUploadFallback(file, file.name);
    }
};

// 移除原来的 handleFileChange，改为简单处理
const handleFileChange = (info: UploadChangeParam) => {
    // 主要逻辑已在 customRequest 中处理
    if (info.file.status === 'removed') {
        formData.value.cover = '';
        imageUrl.value = '';
        fileList.value = [];
    }
};

const handleUploadFallback = async (file?: File, fileName?: string, errorMsg?: string) => {
    if (!file) {
        message.error(errorMsg || '上传失败')
        return
    }
    
    const base64Url = await getBase64(file)
    imageUrl.value = base64Url
    formData.value.cover = base64Url
    fileList.value = [{
        uid: '-1',
        name: fileName || '封面图片',
        status: 'done',
        url: base64Url
    } as UploadFile]
    message.warning('上传失败，使用本地预览')
}

const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview && file.originFileObj) {
        file.preview = await getBase64(file.originFileObj)
    }
    previewImage.value = file.url || (file.preview as string)
    previewVisible.value = true
    previewTitle.value = file.name || '预览图片'
}

const handleCancel = () => {
    previewVisible.value = false
    previewTitle.value = ''
}

// ==================== Tag Management Functions ====================
const getLabelData = () => {
    options.value = labelStore.data.map(item => ({
        id: item.id,
        name: item.label_name,
    }))
}

const handleTagChange = (value: number[]) => {
    if (value.length > maxTagCount.value) {
        labelValue.value = value.slice(0, maxTagCount.value)
        message.warning(`最多只能选择${maxTagCount.value}个标签`)
    } else {
        labelValue.value = value
    }
    formData.value.label = labelValue.value
}

const handleDropdownVisible = (visible: boolean) => {
    dropdownVisible.value = visible
}

const onSearch = (value: string) => {
    searchValue.value = value
}

const addNewTag = async () => {
    if (!searchValue.value.trim()) return
    
    const exists = labelStore.data.some(item => 
        typeof item.label_name === 'string' && 
        item.label_name.toLowerCase() === searchValue.value.toLowerCase()
    )
    
    if (exists) {
        message.warning('此标签已存在')
        return
    }
    
    const request = {
        token: userStore.token,
        value: {
            moment: new Date(),
            label_name: searchValue.value.trim()
        }
    }
    
    const res = await addLabelApi(request)
    
    if (tackleCode(res.data.code)) {
        const newLabel = {
            id: res.data,
            label_name: searchValue.value.trim(),
            incount: 0,
            moment: new Date().toLocaleString()
        }
        
        labelStore.data.push(newLabel)
        options.value!.push({
            id: newLabel.id,
            name: newLabel.label_name,
        })
        
        if (labelValue.value.length < maxTagCount.value) {
            const newId = typeof newLabel.id === 'string' ? parseInt(newLabel.id) : newLabel.id
            labelValue.value = [...labelValue.value, newId]
            formData.value.label = labelValue.value
            message.success('标签创建成功')
        } else {
            message.success('标签创建成功，但已达到最大标签数')
        }
        
        searchValue.value = ''
        dropdownVisible.value = false
    }

}

// ==================== Subset Management Functions ====================
const subsetSelected = (id: any) => {
    formData.value.subset_id = id
}

const clearSubset = () => {
    formData.value.subset_id = null
    value.value = ''
}

// ==================== Form Validation & Export ====================
const getFormData = () => {
    if (!formData.value.title) {
        message.warning('请输入标题')
        return null
    }
    
    if (formData.value.label.length === 0) {
        message.warning('建议至少选择一个标签')
    }
    
    if (!formData.value.inroduce) {
        message.warning('请输入简介')
        return null
    }
    
    return {
        ...formData.value,
        subset_id: formData.value.subset_id || 0 
    }
}

// ==================== Watchers ====================
watch(() => labelStore.data, getLabelData, { deep: true })

watch(() => props.formData, (newFormData) => {
    if (!newFormData) return
    
    // 更新表单数据
    formData.value = { ...newFormData }
    
    // 同步标签选择
    if (Array.isArray(newFormData.label)) {
        labelValue.value = [...newFormData.label]
    }
    
    // 同步分组选择
    if (newFormData.subset_id !== null && newFormData.subset_id !== undefined) {
        setTimeout(() => {
            const subset = subsetStore.data.find(item => item.id === newFormData.subset_id)
            if (subset) {
                value.value = String(subset.name)
            }
        }, 100)
    } else {
        value.value = ''
    }
    
    // 同步封面图片预览
    if (newFormData.cover) {
        fileList.value = [{
            uid: '-1',
            name: '封面图片',
            status: 'done',
            url: newFormData.cover
        } as UploadFile]
    } else {
        fileList.value = []
    }
}, { deep: true, immediate: true })

// ==================== Lifecycle ====================
onMounted(() => {
    rawSubset(props.classify)
    rawLabel()
})

// ==================== Expose ====================
defineExpose({
    getFormData
})
</script>   

<style scoped>
.form-title {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.label-subset {
    display: flex;
    align-items: center;
    gap: 8px;
}

.form-title-content {
    font-size: 24px;
    font-weight: 600;
    color: var(--text-color) !important;
    background: transparent;
}

.form-title-content::placeholder {
    color: var(--gray-400);
    opacity: 1;
}

[data-theme="dark"] .form-title-content::placeholder {
    color: var(--gray-600);
}

.form-introduce {
    border-bottom: 1px solid var(--gray-200);
}

[data-theme="dark"] .form-introduce {
    border-bottom: 1px solid var(--gray-400);
}

.form-upload {
    position: absolute;
    right: 0;
    top: 0;
}

/* 输入框样式 */
:deep(.ant-input),
:deep(.ant-input:focus),
:deep(.ant-input-focused) {
    color: var(--text-color) !important;
    background: transparent !important;
    border: none !important;
}

:deep(.ant-input::placeholder) {
    color: var(--gray-400) !important;
}

[data-theme="dark"] :deep(.ant-input::placeholder) {
    color: var(--gray-600) !important;
}

/* 选择框样式 */
:deep(.ant-select-selector) {
    border: none !important;
    box-shadow: none !important;
    background: var(--background-topbar) !important;
    color: var(--text-color) !important;
    border-radius: 8px !important;
    transition: background 0.3s, color 0.3s;
}

[data-theme="dark"] :deep(.ant-select-selector) {
    background: var(--background-color) !important;
    color: var(--text-color) !important;
}

:deep(.ant-select-dropdown) {
    background: var(--background-topbar) !important;
    color: var(--text-color) !important;
    border-radius: 10px !important;
    box-shadow: 0 4px 16px 0 rgba(30,32,37,0.08);
    border: none !important;
    padding: 6px 0;
}

[data-theme="dark"] :deep(.ant-select-dropdown) {
    background: var(--background-color) !important;
    color: var(--text-color) !important;
    box-shadow: 0 4px 16px 0 rgba(30,32,37,0.32);
}

:deep(.ant-select-item-option) {
    color: var(--text-color) !important;
    background: transparent !important;
    border-radius: 6px;
    margin: 0 6px;
    transition: background 0.2s, color 0.2s;
}

:deep(.ant-select-item-option-selected),
:deep(.ant-select-item-option-active) {
    background: var(--blue-100) !important;
    color: var(--blue-600) !important;
}

[data-theme="dark"] :deep(.ant-select-item-option-selected),
[data-theme="dark"] :deep(.ant-select-item-option-active) {
    background: var(--gray-700) !important;
    color: var(--blue-400) !important;
}

/* 标签选择框样式 */
.tag-selected:deep(.ant-select-selection-item) {
    background-color: var(--blue-100) !important;
    border-radius: 8px;
    border: 1px solid var(--blue-200) !important;
    color: var(--blue-600) !important;
}

[data-theme="dark"] .tag-selected:deep(.ant-select-selection-item) {
    background-color: var(--blue-900) !important;
    border: 1px solid var(--blue-800) !important;
    color: var(--blue-400) !important;
}

:deep(.ant-select-selection-placeholder) {
    color: var(--gray-400) !important;
}

[data-theme="dark"] :deep(.ant-select-selection-placeholder) {
    color: var(--gray-600) !important;
}

:deep(.ant-select-clear) {
    color: var(--gray-400) !important;
    background: var(--background-topbar) !important;
}

[data-theme="dark"] :deep(.ant-select-clear) {
    color: var(--gray-600) !important;
    background: var(--background-color) !important;
}

:deep(.ant-select-clear:hover) {
    color: var(--gray-600) !important;
}   

[data-theme="dark"] :deep(.ant-select-clear:hover) {
    color: var(--gray-400) !important;
}

/* 上传组件样式 */
.ant-upload-select-picture-card {
    font-size: 32px;
    color: #999;
}

.ant-upload-select-picture-card .ant-upload-text {
    margin-top: 8px;
    color: #666;
}
</style>