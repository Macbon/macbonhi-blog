<template>
    <div class="diary-editor">
        <!-- 顶部区域：标题和天气选择 -->
        <div class="editor-top">
            <a-input 
                :bordered="false" 
                type="text" 
                class="editor-title" 
                placeholder="请输入标题" 
                v-model:value="diaryForm.title"
            />
            
            <!-- 天气选择器 -->
            <a-popover title="选择天气" placement="bottom">
                <template #content>
                    <div class="weather-grid">
                        <div 
                            class="editor-weather" 
                            v-for="item in weather" 
                            :key="item.id"
                            @click="selectWeather(item.id)"
                        >
                            <span class="weather-svg" v-html="item.icon"></span>
                            <div class="indicator-dot" v-if="diaryForm.weather_id === item.id"></div>
                        </div>
                    </div>
                </template>
                <div class="weather-default">
                    <span class="weather-svg" v-html="weather[diaryForm.weather_id].icon"></span>
                </div>
            </a-popover>
        </div>

        <!-- 中间区域：内容输入 -->
        <div class="editor-middle">
            <a-textarea 
                class="custom-textarea" 
                v-model:value="diaryForm.content" 
                :maxlength="1600" 
                :bordered="false" 
                :auto-size="{ minRows: 30, maxRows: 30 }" 
                placeholder="请输入..." 
            />
        </div>
        
        <!-- 图片上传区域 -->
        <div class="editor-pic">
            <a-upload
                v-model:file-list="fileList"
                :action="uploadUrl"
                list-type="picture-card"
                :data="{ token: userStore.token }"
                :before-upload="beforeUpload"
                @preview="handlePreview"
                @change="handleFileChange"
                :multiple="true"
            >
                <div v-if="fileList.length < 8" class="upload-custom">
                    <plus-outlined class="upload-plus"/>
                    <div class="upload-text">上传图片</div>
                </div>
            </a-upload>
            
            <!-- 图片预览模态框 -->
            <a-modal 
                :open="previewVisible" 
                :title="previewTitle" 
                :footer="null" 
                @cancel="handleCancel"
                :width="800"
                centered
            >
                <img alt="preview" style="width: 100%" :src="previewImage" />
            </a-modal>
        </div>

        <!-- 底部按钮区域 -->
        <div class="editor-footer">
            <a-button @click="handleCancelEdit">取消</a-button>
            <a-button class="button-2" @click="handleSave">
                {{ editMode ? '更新笔记' : '新建笔记' }}
            </a-button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import type { UploadChangeParam, UploadFile } from 'ant-design-vue'
import type { RcFile } from 'ant-design-vue/es/vc-upload/interface'
import { PlusOutlined } from '@ant-design/icons-vue'
import { weather } from '../../utils/weather'
import { baseUrl } from '../../utils/env'
import { useUserStore } from '../../store/user'
import { useCode } from '../../hooks/code'
import type { DiaryData } from '../../utils/typeof'

// 添加图片类型定义
interface PictureItem {
    id: number | string
    url: string
    name: string
}

// 重新声明 DiaryData 类型
interface LocalDiaryData {
    title: string
    weather_id: number
    moment: Date
    content: string
    picture: PictureItem[]
}

// ==================== Props & Emits ====================
const emit = defineEmits(['save', 'cancel'])

const props = withDefaults(defineProps<{
    editData?: DiaryData
    editMode?: boolean
}>(), {
    editMode: false
})

// ==================== Stores & Hooks ====================
const userStore = useUserStore()
const { tackleCode } = useCode()

// ==================== Form Data ====================
const diaryForm = ref<LocalDiaryData>({
    title: '',
    weather_id: 0,
    moment: new Date(),
    content: '',
    picture: []
})

// ==================== Upload State ====================
const uploadUrl = `${baseUrl}/file/upload` // 修复：移除重复的/api
const fileList = ref<UploadFile[]>([])

// ==================== Preview State ====================
const previewVisible = ref(false)
const previewImage = ref('')
const previewTitle = ref('')

// ==================== Computed Properties ====================
const editMode = computed(() => props.editMode)

// ==================== Helper Functions ====================
// Base64 转换工具函数
const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = error => reject(error)
    })
}

// 处理图片URL格式
const formatImageUrl = (url: string): string => {
    if (url.startsWith('http') || url.startsWith('data:')) {
        return url
    }
    return url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`
}

// ==================== Weather Functions ====================
// 选择天气
const selectWeather = (id: number) => {
    diaryForm.value.weather_id = id
}

// ==================== Upload Functions ====================
// 上传前验证
const beforeUpload = (file: RcFile): boolean => {
    if (!userStore.token) {
        message.error('请先登录')
        return false
    }
    
    const isImage = file.type.startsWith('image/')
    if (!isImage) {
        message.error('只能上传图片文件')
        return false
    }
    
    const isLt5M = file.size / 1024 / 1024 < 5
    if (!isLt5M) {
        message.error('图片大小必须小于5MB')
        return false
    }
    
    return true
}

// 处理文件上传状态变化
const handleFileChange = async (info: UploadChangeParam) => {
    const { status, response, error, originFileObj, name } = info.file

    if (status === 'done') {
        if (response?.code === 200 && response.data?.url) {
            // 上传成功
            const imageUrl = formatImageUrl(response.data.url)
            
            // 添加到图片数组
            if (Array.isArray(diaryForm.value.picture)) {
                diaryForm.value.picture.push({
                    id: response.data.id || Date.now(),
                    url: imageUrl,
                    name: name || '图片'
                })
            } else {
                diaryForm.value.picture = [{
                    id: response.data.id || Date.now(),
                    url: imageUrl,
                    name: name || '图片'
                }]
            }
            
            message.success('图片上传成功')
        } else {
            // 服务器响应异常，使用本地预览
            await handleUploadFallback(originFileObj, name)
        }
    } else if (status === 'error') {
        // 上传失败，尝试本地预览
        await handleUploadFallback(originFileObj, name, error?.message)
    } else if (status === 'removed') {
        // 移除图片
        const removedFile = info.file
        if (Array.isArray(diaryForm.value.picture)) {
            diaryForm.value.picture = diaryForm.value.picture.filter(
                item => item.url !== (removedFile.url || removedFile.response?.data?.url)
            )
        }
    }
}

// 上传失败时的降级处理
const handleUploadFallback = async (file?: File, fileName?: string, errorMsg?: string) => {
    if (!file) {
        message.error(errorMsg || '上传失败')
        return
    }
    try {
        const base64Url = await getBase64(file)
        
        // 添加到图片数组
        const imageData = {
            id: Date.now(),
            url: base64Url,
            name: fileName || '图片 (本地)'
        }
        
        if (Array.isArray(diaryForm.value.picture)) {
            diaryForm.value.picture.push(imageData)
        } else {
            diaryForm.value.picture = [imageData]
        }
        
        message.warning('上传失败，使用本地预览')
    } catch (err) {
        message.error('上传失败且无法生成预览')
    }
}

// ==================== Preview Functions ====================
// 处理图片预览
const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview && file.originFileObj) {
        file.preview = await getBase64(file.originFileObj)
    }
    
    previewImage.value = file.url || (file.preview as string)
    previewVisible.value = true
    previewTitle.value = file.name || '图片预览'
}

// 关闭预览
const handleCancel = () => {
    previewVisible.value = false
    previewTitle.value = ''
}

// ==================== Form Functions ====================
// 表单验证
const validateForm = (): boolean => {
    if (!diaryForm.value.title?.trim()) {
        message.warning('请输入标题')
        return false
    }
    
    if (!diaryForm.value.content?.trim()) {
        message.warning('请输入内容')
        return false
    }
    
    return true
}

// 保存日记
const handleSave = async () => {
    if (!validateForm()) return
    
    const diaryData = {
        ...diaryForm.value,
        moment: new Date().toISOString().slice(0, 19).replace('T', ' '),
        picture: JSON.stringify(Array.isArray(diaryForm.value.picture) 
            ? diaryForm.value.picture 
            : [])
    }
    
    emit('save', diaryData)
}

// 取消操作
const handleCancelEdit = () => {
    emit('cancel')
}

// ==================== Data Initialization ====================
// 初始化编辑数据
const initializeEditData = () => {
    if (props.editData) {
        diaryForm.value = {
            title: props.editData.title || '',
            weather_id: props.editData.weather_id,
            moment: props.editData.moment,
            content: props.editData.content,
            picture: Array.isArray(props.editData.picture) 
                ? props.editData.picture.map(item => ({
                    id: Date.now(),
                    url: typeof item === 'string' ? formatImageUrl(item) : (item as PictureItem).url,
                    name: typeof item === 'string' ? '图片' : ((item as PictureItem).name || '图片')
                }))
                : []
        }
        
        // 初始化图片列表显示
        if (Array.isArray(props.editData.picture)) {
            fileList.value = props.editData.picture.map((img, index) => ({
                uid: `${index}`,
                name: typeof img === 'string' ? '图片' : (img as PictureItem).name || '图片',
                status: 'done' as const,
                url: typeof img === 'string' ? formatImageUrl(img) : (img as PictureItem).url
            }))
        }
    }
}

// ==================== Lifecycle ====================
onMounted(() => {
    initializeEditData()
})
</script>

<style scoped>
/* ==================== 整体布局 ==================== */
.diary-editor {
    display: flex;
    flex-direction: column;
    background-color: var(--background-topbar);
    border-radius: 8px;
    height: 100%;
    transition: background 0.3s, color 0.3s;
}

/* ==================== 顶部区域 ==================== */
.editor-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px;
}

.editor-title {
    font-size: 24px;
    font-weight: bold;
    color: var(--text-color) !important;
    background: transparent;
}

.editor-title::placeholder {
    color: var(--gray-400);
    opacity: 1;
}

[data-theme="dark"] .editor-title::placeholder {
    color: var(--gray-600);
}

/* ==================== 天气选择器 ==================== */
.weather-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-gap: 24px;
    padding: 16px;
}

.editor-weather {
    cursor: pointer;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 8px;
    border-radius: 8px;
    transition: all 0.3s;
}

.editor-weather:hover {
    transform: scale(1.1);
    background: var(--gray-100);
}

[data-theme="dark"] .editor-weather:hover {
    background: var(--gray-300);
}

.weather-default {
    margin-left: 8px;
    cursor: pointer;
    border-radius: 8px;
    padding: 4px;
    transition: all 0.3s;
}

.weather-default:hover {
    transform: scale(1.1);
    background: var(--blue-100);
}

[data-theme="dark"] .weather-default:hover {
    background: var(--blue-900);
}

.indicator-dot {
    width: 8px;
    height: 8px;
    border-radius: 4px;
    background-color: var(--blue-600);
    margin-top: 8px;
}

[data-theme="dark"] .indicator-dot {
    background-color: var(--blue-400);
}

.weather-svg svg {
    width: 32px;
    height: 32px;
    color: var(--weather-icon-color, #FFD600);
    transition: color 0.3s;
}

[data-theme="dark"] .weather-svg svg {
    color: var(--weather-icon-dark, #90caf9);
}

/* ==================== 中间内容区域 ==================== */
.editor-middle {
    display: flex;
    flex: 1;
    justify-content: center;
    align-items: flex-start;
    padding: 0 24px 24px 24px;
}

.custom-textarea {
    flex: 1;
    color: var(--text-color) !important;
    background: transparent;
    border: none;
    font-size: 16px;
    line-height: 1.5;
    padding: 0;
}

.custom-textarea::placeholder {
    color: var(--gray-400);
    opacity: 1;
}

[data-theme="dark"] .custom-textarea::placeholder {
    color: var(--gray-600);
}

/* ==================== 图片上传区域 ==================== */
.editor-pic {
    padding: 0 24px 24px 24px;
}

.upload-custom {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--gray-500);
    transition: color 0.3s;
}

[data-theme="dark"] .upload-custom {
    color: var(--gray-300);
}

.upload-plus {
    font-size: 24px;
    margin-bottom: 8px;
}

.upload-text {
    font-size: 14px;
    color: inherit;
}

/* ==================== 底部按钮区域 ==================== */
.editor-footer {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    padding: 16px 24px;
    border-top: 1px solid var(--gray-200);
}

[data-theme="dark"] .editor-footer {
    border-top: 1px solid var(--gray-400);
}

.button-2 {
    background-color: var(--blue-600);
    color: white;
    border: 1px solid var(--blue-600);
}

[data-theme="dark"] .button-2 {
    background-color: var(--blue-400);
    border: 1px solid var(--blue-400);
}

.button-2:hover {
    background-color: var(--blue-700);
    border-color: var(--blue-700);
}

[data-theme="dark"] .button-2:hover {
    background-color: var(--blue-500);
    border-color: var(--blue-500);
}

/* ==================== 上传组件样式 ==================== */
:deep(.ant-upload-list-picture-card .ant-upload-list-item),
:deep(.ant-upload.ant-upload-select-picture-card) {
    width: 64px;
    height: 64px;
    margin: 0 8px 8px 0;
    border-radius: 8px;
    background: var(--gray-100);
    border: 1px solid var(--gray-200);
}

[data-theme="dark"] :deep(.ant-upload-list-picture-card .ant-upload-list-item),
[data-theme="dark"] :deep(.ant-upload.ant-upload-select-picture-card) {
    background: var(--gray-300);
    border: 1px solid var(--gray-400);
}

:deep(.ant-upload-list-picture-card-container) {
    display: inline-block;
    width: 64px;
    height: 64px;
    margin: 0 8px 8px 0;
    vertical-align: top;
}

/* 上传按钮悬停效果 */
:deep(.ant-upload.ant-upload-select-picture-card:hover) {
    border-color: var(--blue-400);
}

[data-theme="dark"] :deep(.ant-upload.ant-upload-select-picture-card:hover) {
    border-color: var(--blue-300);
}
</style>