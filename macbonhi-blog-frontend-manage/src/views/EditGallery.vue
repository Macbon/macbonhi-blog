<template>
    <div class="edit-gallery">
        <div class="gallery-topbar">
            <p class="gallery-font">{{ id ? '编辑图库' : '新建图库' }}</p>
            <div class="topbar-button">
                <a-button @click="handleCancel">取消</a-button>
                <a-button class="button-2" @click="handlePublish" :loading="publishLoading">
                    {{ id ? '更新' : '发布' }}
                </a-button>
            </div>
        </div>
    
        <div class="gallery-content">
            <editGallery 
                ref="editGalleryRef"
                style="flex:1" 
                @changeHome="changeHome" 
                @editGallery="editorData"
                :defaultImages="defaultGalleryImages"
            />
             
            <div class="gallery-content-right">
                <forms 
                    ref="formsRef" 
                    style="width: 420px;" 
                    :classify="1" 
                    :formData="formDataForForms"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import editGallery from '../components/gallery/edit-gallery.vue';
import forms from '../components/forms/forms.vue';
import { useArticle } from '../hooks/article';
import { useRoute } from 'vue-router';

const { editorData, changeHome, publishArticle, publishLoading, getArticleDetail, defaulGallery } = useArticle();
const router = useRouter();
const editGalleryRef = ref();
const formsRef = ref();

// 从路由获取编辑ID
const route = useRoute();
const id = ref<number>();
if (route.params.id) {
    id.value = Number(route.params.id);
}

// 数据加载状态
const dataLoaded = ref(false);

// 处理表单数据，确保标签ID正确转换
const formDataForForms = computed(() => {
    if (!defaulGallery.value || !dataLoaded.value) {
        return {
            title: '',
            subset_id: null,
            label: [],
            inroduce: '',
            cover: '',
            classify: 1
        };
    }

    // 处理标签数据 - 将字符串转为数字数组
    let labelArray: number[] = [];
    if (defaulGallery.value.label) {
        if (typeof defaulGallery.value.label === 'string') {
            // 如果是逗号分隔的字符串，转换为数字数组
            labelArray = (defaulGallery.value.label as string).split(',')
                .map((item: string) => parseInt(item.trim()))
                .filter((item: number) => !isNaN(item));
        } else if (Array.isArray(defaulGallery.value.label)) {
            // 如果已经是数组，确保每个元素都是数字
            labelArray = defaulGallery.value.label
                .map((item: string | number) => typeof item === 'string' ? parseInt(item) : item)
                .filter((item: number) => !isNaN(item));
        }
    }

    return {
        title: defaulGallery.value.title || '',
        subset_id: defaulGallery.value.subset_id || null,
        label: labelArray,
        inroduce: defaulGallery.value.introduce || '', // 兼容两种字段名
        cover: defaulGallery.value.cover || '',
        classify: 1
    };
});

// 处理图片数据，确保格式正确
const defaultGalleryImages = computed(() => {
    if (!defaulGallery.value?.content || !dataLoaded.value) {
        return [];
    }
    try {
        let content;
        
        // 解析content数据
        if (typeof defaulGallery.value.content === 'string') {
            content = JSON.parse(defaulGallery.value.content);
        } else {
            content = defaulGallery.value.content;
        }
        
        // 确保返回正确的数组格式
        if (Array.isArray(content)) {
            return content.map(item => ({
                id: item.id || Date.now() + Math.random(),
                url: item.url || item.src || '', // 兼容不同的URL字段名
                title: item.title || item.name || `图片_${item.id}`
            }));
        }
        
        return [];
    } catch (error) {
        return [];
    }
});

// 监听数据变化，确保子组件能够接收到更新
watch([formDataForForms, defaultGalleryImages], () => {
    if (dataLoaded.value) {
    }
}, { deep: true });

// 处理发布/更新操作
const handlePublish = async () => {
    try {
        // 获取图库编辑器内容
        if (!editGalleryRef.value) {
            message.error('图库编辑器未加载');
            return;
        }
        const galleryData = editGalleryRef.value.getGalleryContent();
        
        // 获取表单数据
        const formData = formsRef.value.getFormData();
        if (!formData) {
            return; // getFormData 内部已经显示了错误信息
        }
        
        // 验证图库内容
        if (!galleryData.images || galleryData.images.length === 0) {
            message.error('请至少上传一张图片');
            return;
        }
        
        // 发布或更新图库
        await publishArticle(
            JSON.stringify(galleryData.images), 
            {
                ...formData,
                classify: 1,  // 图库类型
                cover: galleryData.cover || galleryData.images[0]?.url || ''  // 设置封面
            },
            id.value // 传入ID以区分新建/更新
        );

        router.push({ name: 'Overview' });  // 返回首页
        
    } catch (error) {
        console.error('发布失败:', error);
        // publishArticle 内部已经处理了错误消息
    }
};

// 处理取消操作
const handleCancel = () => {
    router.push({ name: 'Overview' });
};

// 组件加载完成后获取数据
onMounted(async () => {
    if (id.value) {
        try {
            // 获取文章详情
            await getArticleDetail(Number(id.value));
            // 等待DOM更新
            await nextTick();
            // 标记数据已加载
            dataLoaded.value = true;
        } catch (error) {
            console.error('加载图库数据失败:', error);
            message.error('加载图库数据失败，请重试');
            dataLoaded.value = true; // 即使失败也要标记为已加载，避免无限loading
        }
    } else {
        // 新建图库，直接标记为已加载
        dataLoaded.value = true;
    }
});
</script>

<style scoped>
.edit-gallery{
    padding: 24px 32px; /* 恢复原始padding */
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    gap: 16px;
}

.gallery-topbar{
    display: flex;
    border-radius: 8px; /* 恢复圆角 */
    padding: 16px 24px;
    background-color: var(--background-topbar);
    justify-content: space-between;
    align-items: center;
    width: 100%;
    max-width: 2000px;
    transition: background 0.3s;
}

.gallery-content{
    width: 100%;
    max-width: 2000px;
    display: flex;
    gap: 16px;
    justify-content: space-between;
}

.gallery-content-right{
    border-radius: 8px;
    background: var(--background-topbar);
    flex: none;
    display: flex;
    padding: 24px;
    justify-content: center;
    transition: background 0.3s;
}

.gallery-font{
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    color: var(--text-color);
}

.topbar-button{
    display: flex; 
    gap: 16px;
}

.button-2{
    background-color: var(--blue-600);
    color: white;
    border-top: 1px solid var(--gray-100);
    transition: background 0.3s, border-color 0.3s;
}
[data-theme="dark"] .button-2 {
    background-color: var(--blue-400);
    color: white;
    border-top: 1px solid var(--gray-300);
}
</style>