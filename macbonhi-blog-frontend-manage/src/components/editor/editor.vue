<template>
    <div class="editor-card">
        <a-affix :offset-top="60" @change="Toolbarstyle">
            <div class="editor-tool" :class="{'istop':top}">
                <Toolbar
                    :editor="editorRef"
                    :defaultConfig="toolbarConfig"
                    :mode="mode"
                />
            </div>
        </a-affix>

        <div class="editor-body">

            <forms ref="formsRef" style="width: 100%; max-width: 1600px; padding-top: 40px;" :classify="0" :formData="formDataForForms"/>
            
            <Editor
                style="width: 100%; min-height: 500px; overflow-y: hidden;"
                v-model="valueHtml"
                :defaultConfig="editorConfig"
                :mode="mode"
                @onCreated="handleCreated"
                @onChange="onChange"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import '@wangeditor/editor/dist/css/style.css' // 引入 css
import forms from '../forms/forms.vue'
import { onBeforeUnmount, ref, shallowRef, onMounted, defineExpose, defineEmits, watch } from 'vue'
// @ts-ignore - 忽略类型检查，因为库的类型定义有问题
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
// @ts-ignore - 忽略类型检查，因为库的类型定义有问题
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor'
import { useUserStore } from '../../store/user'
import type { ArticleFormData } from '../../utils/typeof'
// 导入配置好的 axios 实例
import request from '../../utils/axios'
import { message } from 'ant-design-vue'

const userStore = useUserStore()

const props = defineProps({
    content: String,
    formData: Object,
    articleData: Object // 新增接收完整文章数据的属性
})

// 处理formData，从articleData中提取需要的字段
const formDataForForms = ref<ArticleFormData>({
    title: '',
    subset_id: null,
    label: [],
    inroduce: '',
    cover: '',
    classify: 0
})

// 监听articleData变化，更新formData
watch(() => props.articleData, (newArticleData) => {
    if (newArticleData) {
        formDataForForms.value = {
            title: newArticleData.title || '',
            subset_id: newArticleData.subset_id || null,
            label: Array.isArray(newArticleData.label) ? newArticleData.label : 
                  (typeof newArticleData.label === 'string' && newArticleData.label ? 
                   newArticleData.label.split(',').map(id => Number(id)) : []),
            inroduce: newArticleData.introduce || '', // 注意这里是introduce映射到inroduce
            cover: newArticleData.cover || '',
            classify: newArticleData.classify || 0
        }
    }
}, { immediate: true, deep: true })

// 定义颜色配置
const colors = [
    '#000000', '#ffffff', '#eeece0', '#1c487f', '#4d80bf',
    '#c24f4a', '#8baa4a', '#7b5ba1', '#46acc8', '#f9963b',
    '#818181', '#f4f4f4', '#ccc2a6', '#2e5984', '#b5c8e2',
    '#d5a6a4', '#ccc2a6', '#a28dc1', '#9bd0e2', '#fac090'
]

// 定义事件发射器
const emits = defineEmits(['editors'])

const top = ref<boolean>(false)
const mode = ref('default') // 编辑器模式，默认为default

const Toolbarstyle = (e: boolean) => {
    top.value = e
}

// 编辑器实例，必须用 shallowRef
const editorRef = shallowRef<IDomEditor | null>(null)
const formsRef = ref()

// 内容 HTML - 使用空的 p 标签作为初始内容
const valueHtml = ref()

// 改进对articleData和content prop的监听
watch(
    [() => props.content, () => props.articleData],
    ([newContent, newArticleData]) => {
        if (newArticleData && newArticleData.content && typeof newArticleData.content === 'string') {
            // 优先使用文章数据中的content
            valueHtml.value = newArticleData.content;
            
            // 如果编辑器已创建，直接设置内容
            if (editorRef.value && !editorRef.value.isDestroyed) {
                try {
                    editorRef.value.setHtml(newArticleData.content);
                } catch (error) {
                    console.error('设置编辑器内容失败:', error);
                }
            }
        } else if (newContent && typeof newContent === 'string') {
            // 回退到使用content prop
            valueHtml.value = newContent;
            
            // 如果编辑器已创建，直接设置内容
            if (editorRef.value && !editorRef.value.isDestroyed) {
                try {
                    editorRef.value.setHtml(newContent);
                } catch (error) {
                    console.error('设置编辑器内容失败:', error);
                }
            }
        }
    },
    { immediate: true, deep: true }
)

// 工具栏配置
const toolbarConfig: Partial<IToolbarConfig> = {
    toolbarKeys: [
        "blockquote",
        "headerSelect",
        "|",
        "bold",
        "underline",
        "through",
        "italic",
        "color",
        "bgColor",
        "clearStyle",
        "|",
        "bulletedList",
        "numberedList",
        "todo",
        {
            key: "group-justify",
            title: "对齐",
            iconSvg:
                '<svg viewBox="0 0 1024 1024"><path d="M768 793.6v102.4H51.2v-102.4h716.8z m204.8-230.4v102.4H51.2v-102.4h921.6z m-204.8-230.4v102.4H51.2v-102.4h716.8zM972.8 102.4v102.4H51.2V102.4h921.6z"></path></svg>',
            menuKeys: [
                "justifyLeft",
                "justifyRight",
                "justifyCenter",
                "justifyJustify",
            ],
        },
        {
            key: "group-indent",
            title: "缩进",
            iconSvg:
                '<svg viewBox="0 0 1024 1024"><path d="M0 64h1024v128H0z m384 192h640v128H384z m0 192h640v128H384z m0 192h640v128H384zM0 832h1024v128H0z m0-128V320l256 192z"></path></svg>',
            menuKeys: ["indent", "delIndent"],
        },
        "|",
        "emotion",
        "insertLink",
        "uploadImage",
        "insertVideo",
        "insertTable",
        "|",
        "code",
        "codeBlock",
    ],
}

// 编辑器配置
const editorConfig: Partial<IEditorConfig> = {
    placeholder: '请输入内容...',
    autoFocus: false, // 禁用自动聚焦，避免初始化时的焦点问题
    scroll: true,
    MENU_CONF: {
        color: {
            colors,
        },
        bgColor: {
            colors,
        },
        uploadImage: {
            async customUpload(file: File, insertFn: Function) {
                try {
                    console.log('开始上传图片:', file.name, '大小:', file.size);
                    
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('token', userStore.token || '');
                    
                    // 添加重试逻辑
                    const tryUpload = async (attempt = 1) => {
                        try {
                            console.log(`尝试上传 (${attempt}/3)`);
                            
                            const result = await request.post('/file/upload', formData, {
                                headers: { 'Content-Type': 'multipart/form-data' },
                                timeout: 60000 // 60秒超时
                            });
                            
                            // 处理成功响应...
                            if (result && result.code === 200 && result.data?.url) {
                                let fileUrl = result.data.url;
                                
                                // 确保URL是完整的可访问路径
                                if (!fileUrl.startsWith('http')) {
                                    // 如果是相对路径，构建完整URL
                                    const baseUrl = import.meta.env.VITE_BASE_URL || '';
                                    
                                    // 处理路径拼接，避免重复斜杠
                                    if (fileUrl.startsWith('/')) {
                                        fileUrl = `${baseUrl}${fileUrl}`;
                                    } else {
                                        fileUrl = `${baseUrl}/${fileUrl}`;
                                    }
                                }
                                
                                // 插入图片到编辑器
                                insertFn(fileUrl, file.name, fileUrl);
                                
                                console.log('图片插入成功:', fileUrl);
                                message.success('图片上传成功');
                                
                                // 可选：异步验证图片是否可访问（仅用于调试）
                                const img = new Image();
                                img.onload = () => {
                                    console.log('图片加载成功:', fileUrl);
                                };
                                img.onerror = () => {
                                    console.warn('⚠️ 图片无法访问，请检查后端静态文件服务配置');
                                    console.warn('需要在后端添加: app.use("/uploads", express.static(path.join(__dirname, "uploads")));');
                                };
                                img.src = fileUrl;
                            } else if (result && result.code === 401) {
                                console.error('上传失败: 用户未登录或token无效', result);
                                message.error('请先登录');
                                // 使用本地预览作为备选
                                const url = URL.createObjectURL(file);
                                insertFn(url, file.name, url);
                            } else {
                                console.error('上传响应格式异常:', result);
                                message.error(result.message || '上传失败');
                                // 使用本地预览作为备选
                                const url = URL.createObjectURL(file);
                                insertFn(url, file.name, url);
                            }
                        } catch (error: any) {
                            console.error(`上传尝试 ${attempt} 失败:`, error);
                            
                            if (attempt < 3) {
                                // 添加递增延迟
                                const delay = attempt * 2000;
                                console.log(`${delay}ms后重试...`);
                                
                                setTimeout(() => {
                                    tryUpload(attempt + 1);
                                }, delay);
                            } else {
                                // 最终失败，使用本地预览
                                console.error('上传失败，使用本地预览');
                                const url = URL.createObjectURL(file);
                                insertFn(url, file.name, url);
                                message.error('图片上传到服务器失败，使用本地预览');
                            }
                        }
                    };
                    
                    // 开始上传过程
                    tryUpload();
                    
                } catch (error) {
                    console.error('文件上传前期处理错误:', error);
                    message.error('上传准备失败');
                    
                    // 使用本地预览作为备选
                    const url = URL.createObjectURL(file);
                    insertFn(url, file.name, url);
                }
            }
        }
    }
}

// 内容变化回调，添加错误处理
const onChange = (editor: IDomEditor) => {
    try {
        if (editor && !editor.isDestroyed) {
            const html = editor.getHtml();
            // 确保内容不为空，至少包含一个空段落
            const validHtml = html && html.trim() !== '' ? html : '<p><br></p>';
            valueHtml.value = validHtml;
            emits('editors', validHtml);
        }
    } catch (error) {
        console.warn('编辑器内容变化处理失败:', error);
    }
}

// 组件销毁时，也及时销毁编辑器
onBeforeUnmount(() => {
    const editor = editorRef.value
    if (editor == null || editor.isDestroyed) return
    editor.destroy()
})

const handleCreated = (editor: IDomEditor) => {
    editorRef.value = editor // 记录 editor 实例
  
    // 延迟设置内容，避免初始化时的 DOM 状态问题
    setTimeout(() => {
        if (editor && !editor.isDestroyed) {
            try {
                // 确保编辑器有有效的初始内容
                if (!valueHtml.value || valueHtml.value.trim() === '') {
                    editor.setHtml('<p><br></p>');
                }
            } catch (error) {
                console.warn('设置初始内容失败:', error);
            }
        }
    }, 2000);
}

// 获取编辑器内容
const getEditorContent = () => {
    const editor = editorRef.value
    if (editor == null || editor.isDestroyed) {
        console.warn('编辑器实例不存在或已销毁');
        return '<p><br></p>';
    }
    try {
        const html = editor.getHtml();
        return html || '<p><br></p>';
    } catch (error) {
        console.error('获取编辑器内容失败:', error);
        return '<p><br></p>';
    }
}

// 获取表单数据
const getFormData = () => {
    if (!formsRef.value) {
        console.warn('表单引用不存在');
        return null;
    }
    
    try {
        const data = formsRef.value.getFormData();
        return data;
    } catch (error) {
        console.error('获取表单数据出错', error);
        return null;
    }
}

// 向父组件暴露方法
defineExpose({
    getEditorContent,
    getFormData
})

// 模拟 ajax 异步获取内容
onMounted(() => { 

})
</script>

<style scoped>
.editor-tool {
    border-radius: 8px;
    background-color: var(--background-topbar);
    transition: box-shadow 0.3s, background-color 0.3s;
}

[data-theme="dark"] .editor-tool {
    background-color: var(--background-topbar);
}

.editor-body {
    border-radius: 8px;
    margin-top: 16px;
    background-color: var(--background-topbar);
    display: flex;
    align-items: center;
    flex-direction: column;
    min-height: 600px;
    transition: background-color 0.3s;
}

[data-theme="dark"] .editor-body {
    background-color: var(--background-topbar);
}

.istop {
    box-shadow: 0px 4px 16px 0 rgba(0, 0, 0, 0.1);
}

[data-theme="dark"] .istop {
    box-shadow: 0px 4px 16px 0 rgba(0, 0, 0, 0.4);
}

/* WangEditor 工具栏适配 */
:deep(.w-e-toolbar) {
    border-radius: 8px !important;
    background-color: var(--background-topbar) !important;
    transition: background-color 0.3s;
    border: none !important;
}

[data-theme="dark"] :deep(.w-e-toolbar) {
    border-radius: 8px !important;
    background-color: var(--background-topbar) !important;
}

/* 工具栏按钮适配 */
:deep(.w-e-bar-item button) {
    color: var(--text-color) !important;
}

[data-theme="dark"] :deep(.w-e-bar-item button) {
    color: var(--gray-300) !important;
}

/* 工具栏按钮悬停效果 */
:deep(.w-e-bar-item button:hover) {
    background-color: var(--gray-100) !important;
}

[data-theme="dark"] :deep(.w-e-bar-item button:hover) {
    background-color: var(--gray-700) !important;
}

/* 工具栏按钮选中（激活）态适配 */
:deep(.w-e-bar-item button.w-e-active) {
    background-color: var(--blue-100) !important;
    color: var(--blue-600) !important;
    border-radius: 6px !important;
}

[data-theme="dark"] :deep(.w-e-bar-item button.w-e-active) {
    background-color: var(--gray-700) !important;
    color: var(--blue-400) !important;
}

/* 下拉菜单适配 */
:deep(.w-e-drop-panel),
:deep(.w-e-drop-list) {
    background-color: var(--background-topbar) !important;
    color: var(--text-color) !important;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1) !important;
    border: none !important;
    border-radius: 8px !important;
}

[data-theme="dark"] :deep(.w-e-drop-panel),
[data-theme="dark"] :deep(.w-e-drop-list) {
    background-color: var(--background-topbar) !important;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3) !important;
}

/* 下拉菜单项适配 */
:deep(.w-e-drop-list__item) {
    color: var(--text-color) !important;
}

[data-theme="dark"] :deep(.w-e-drop-list__item) {
    color: var(--gray-300) !important;
}

:deep(.w-e-drop-list__item:hover) {
    background-color: var(--gray-100) !important;
}

[data-theme="dark"] :deep(.w-e-drop-list__item:hover) {
    background-color: var(--gray-700) !important;
}

/* 下拉菜单选中项适配 */
:deep(.w-e-drop-list__item.w-e-selected),
:deep(.w-e-drop-list__item.w-e-active) {
    background-color: var(--blue-100) !important;
    color: var(--blue-600) !important;
    border-radius: 6px !important;
}

[data-theme="dark"] :deep(.w-e-drop-list__item.w-e-selected),
[data-theme="dark"] :deep(.w-e-drop-list__item.w-e-active) {
    background-color: var(--gray-700) !important;
    color: var(--blue-400) !important;
}

/* 编辑区域适配 */
:deep(.w-e-text-container) {
    background-color: var(--background-topbar) !important;
    border: none !important;
}

[data-theme="dark"] :deep(.w-e-text-container) {
    background-color: var(--background-topbar) !important;
}

/* 编辑区域文字适配 */
:deep(.w-e-text-container [contenteditable="true"]) {
    color: var(--text-color) !important;
}

/* 提示文字(placeholder)适配 */
:deep(.w-e-text-placeholder) {
    color: var(--gray-400) !important;
}

[data-theme="dark"] :deep(.w-e-text-placeholder) {
    color: var(--gray-600) !important;
}

/* 颜色选择器适配 */
:deep(.w-e-color-picker) {
    background-color: var(--background-topbar) !important;
    border: none !important;
}

[data-theme="dark"] :deep(.w-e-color-picker) {
    background-color: var(--background-topbar) !important;
}

/* 颜色选择器选中色块适配 */
:deep(.w-e-color-picker .w-e-selected) {
    outline: 2px solid var(--blue-600) !important;
}

[data-theme="dark"] :deep(.w-e-color-picker .w-e-selected) {
    outline: 2px solid var(--blue-400) !important;
}

/* 浮动工具栏（如快捷菜单、颜色面板）背景色适配 */
:deep(.w-e-panel-container),
:deep(.w-e-panel-content) {
    background-color: var(--background-topbar) !important;
    color: var(--text-color) !important;
    border-radius: 8px !important;
    border: none !important;
}

[data-theme="dark"] :deep(.w-e-panel-container),
[data-theme="dark"] :deep(.w-e-panel-content) {
    background-color: var(--background-color) !important;
    color: var(--text-color) !important;
}

/* 确保加粗文字显示效果 */
:deep(strong) {
    font-weight: bold !important;
}
</style>