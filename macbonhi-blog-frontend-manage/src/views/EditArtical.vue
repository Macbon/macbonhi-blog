<template>
    <div class="edit-gallery">
        <div class="gallery-topbar">
            <p class="gallery-font">{{ id ? '编辑博客' : '新建博客' }}</p>
            <div class="topbar-button">
                <a-button @click="saveDraft" :loading="saveLoading">保存草稿</a-button>
                <a-button class="button-2" @click="publish" :loading="publishLoading">发布</a-button>
            </div>
        </div>
        <!-- 使用异步组件，只有在真正需要时才加载编辑器 -->
        <Suspense>
            <template #default>
                <!-- 使用动态导入的编辑器组件 -->
                <EditorComponent 
                    ref="editorRef" 
                    style="width: 100%; max-width: 1600px;" 
                    :content="defaultArticle.content" 
                    :articleData="defaultArticle"
                />
            </template>
            <template #fallback>
                <div class="editor-loading">
                    <a-spin tip="编辑器加载中..." />
                </div>
            </template>
        </Suspense>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, defineAsyncComponent } from 'vue';
import { message } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import { useRoute } from 'vue-router';
import { useArticle } from '../hooks/article';

// 优化前: 直接静态导入编辑器组件
// import editor from '../components/editor/editor.vue';

// 优化后: 使用异步组件导入编辑器
// 编辑器组件通常较大，使用defineAsyncComponent实现懒加载，只在实际需要时才加载
const EditorComponent = defineAsyncComponent(() => 
    import('../components/editor/editor.vue')
);

const { getArticleDetail, defaultArticle, saveDraft: saveArticleDraft, publishArticle, saveLoading, publishLoading } = useArticle();

const router = useRouter();
const editorRef = ref();
const id = ref<number>();

const route = useRoute();
if (route.params.id) {
    id.value = Number(route.params.id);
}

// 验证表单数据的通用函数
const validateFormData = () => {
    if (!editorRef.value) {
        message.error('编辑器组件未加载');
        return null;
    }
    try {
        // 获取编辑器内容
        const editorContent = editorRef.value.getEditorContent();
        
        if (!editorContent || editorContent === '<p>编辑器内容获取失败</p>') {
            message.error('获取编辑器内容失败');
            return null;
        }
        
        // 获取表单数据
        const formData = editorRef.value.getFormData();
        
        if (!formData) {
            message.error('获取表单数据失败');
            return null;
        }
        
        return { editorContent, formData };
    } catch (error) {
        console.error('验证表单数据出错:', error);
        message.error('获取数据失败，请检查控制台');
        return null;
    }
};

// 保存草稿功能
const saveDraft = () => {
    const validationResult = validateFormData();
    if (!validationResult) return;
    
    const { editorContent, formData } = validationResult;
    
    saveArticleDraft(editorContent, formData, id.value)
        .then((res) => {
            // 如果是新建，保存后跳转到编辑模式（带上ID）
            if (!id.value && res.data && res.data.id) {
                router.replace({ path: '/edit-artical', query: { id: res.data.id } });
            }
        });
};

// 发布功能
const publish = () => {
    const validationResult = validateFormData();
    if (!validationResult) return;
    
    const { editorContent, formData } = validationResult;
    
    publishArticle(editorContent, formData, id.value)
        .then(() => {
            // 发布成功后跳转到首页
            router.push({ name: 'Overview' });
        });
};

onMounted(() => {
    if (id.value) {
        // 编辑已有文章
        getArticleDetail(Number(id.value));
    } else {
        // 新建文章，清空默认数据
        getArticleDetail(0);
    }
});
</script>

<style scoped>
.edit-gallery {
    padding: 24px 32px; /* 恢复原始padding */
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    gap: 16px;
    background-color: var(--background-color);
    color: var(--text-color);
}

.gallery-topbar {
    display: flex;
    border-radius: 8px; /* 恢复圆角 */
    padding: 16px 24px;
    background-color: var(--background-topbar);
    justify-content: space-between;
    align-items: center;
    width: 100%;
    transition: background-color 0.3s;
}

.gallery-content {
    width: 100%;
    display: flex;
    justify-content: center;
    background-color: var(--background-topbar);
    align-items: center;
}

[data-theme="dark"] .gallery-content {
    background-color: var(--background-color);
}

.gallery-content-right {
    border-radius: 8px;
    background: var(--background-topbar);
    flex: none;
    display: flex;
    padding: 24px;
    justify-content: center;
    align-items: center;
}

[data-theme="dark"] .gallery-content-right {
    background: var(--background-color);
}

.gallery-font {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    color: var(--text-color);
    background-color: --background-topbar;
}

.topbar-button {
    display: flex; 
    gap: 16px;
}

.button-2 {
    background-color: var(--blue-600)!important;
    color: var(--background-topbar)!important;
    border: none;
}

[data-theme="dark"] .button-2 {
    background-color: var(--blue-500);
}

/* 普通按钮适配 */

/* 确保主按钮在深色模式下hover样式正确 */
.button-2:hover,
:deep(.button-2:hover) {
    background-color: var(--blue-500) !important;
    color: white !important;
    border: none !important;
}

[data-theme="dark"] .button-2:hover,
[data-theme="dark"] :deep(.button-2:hover) {
    background-color: var(--blue-400) !important;
}

/* 编辑器区域适配 */
:deep(.w-e-text-container),
:deep(.w-e-toolbar) {
    background-color: var(--background-topbar) !important;
    color: var(--text-color) !important;
}

[data-theme="dark"] :deep(.w-e-text-container),
[data-theme="dark"] :deep(.w-e-toolbar) {
    background-color: var(--background-color) !important;
    border-color: var(--gray-700) !important;
}

/* 草稿保存按钮样式 */
:deep(.ant-btn-loading) {
    opacity: 0.7;
}

.editor-loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 300px;
}
</style>