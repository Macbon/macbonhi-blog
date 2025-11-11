<template>

    <div class="gallery-item">
        <div class="gallery-item-wrapper">
            <div class="gallery-item-image">
                <div class="gallery-item-cover">
                    <img :src="cover" width="238px" height="160px" fit="cover">
                    <div class="gallery-item-operation">

                        <a-tooltip placement="top" title="编辑">
                            <HighlightOutlined class="icon" @click="updateGallery"/>
                        </a-tooltip>

                        <a-popconfirm placement="rightTop" ok-text="是" cancel-text="否" @confirm="deletegallery(props.data!.id)">
                            <template #title>
                                确认删除
                            </template>
                            <DeleteOutlined class="icon"/>
                        </a-popconfirm>
                    </div>
                </div>
                <div style="display: flex; align-items: flex-center; gap: 2px;">
                    <div class="gallery-item-image-left img-div">
                         <img :src="content[0].url" width="78px" height="78px" fit="cover" v-if="content[0]">
                    </div>

                    <div class="gallery-item-image-middle img-div">
                         <img :src="content[1].url" width="78px" height="78px" fit="cover" v-if="content[1]">
                    </div>

                    <div class="gallery-item-image-right img-div">
                         <img :src="content[2].url" width="78px" height="78px" fit="cover" v-if="content[2]">
                    </div>

                </div>

            </div>

            <div class="gallery-item-content">
                <p class="gallery-item-title">{{ props.data?.title }}</p>
                <div class="gallery-item-state">
                    <div>
                        <div style="display: flex; align-items: center; width: 238px; justify-content: space-between;">
                    
                            <a-space size="middle">
                                <a-typography-text style="color: #1e20257a;">
                                    <EyeOutlined />
                                    {{ props.data?.views }}
                                </a-typography-text>
                                <a-typography-text style="color: #1e20257a;">
                                    <LikeOutlined />
                                    {{ currentPraiseCount }}
                                </a-typography-text>
                                <a-typography-text style="color: #1e20257a;">
                                    <MessageOutlined />
                                    {{ currentCommentCount }}
                                </a-typography-text>
                            </a-space>

                            <a-typography-text style="color: #1e20257a;">
                                {{ momentm(props.data?.moment!) }}
                            </a-typography-text>

                        </div>
                    </div>

                </div>

            </div>

        </div>

    </div>
    
</template>

<script setup lang="ts">

import type { GalleryData } from '@/utils/typeof';
import { computed } from 'vue';
import { useSubsetStore } from '../../store/subset';
import { useCommentStore } from '../../store/comment';
import { momentm } from '../../utils/moment';
import { baseUrl } from '../../utils/env';
import { useRouter } from 'vue-router';

const router = useRouter();
const emits = defineEmits(["delete", "state"])


const deletegallery = (id:number) => {
    emits("delete", id);

};

const subsetStore = useSubsetStore();
const commentStore = useCommentStore(); //引入评论store

type ArticalDataProps = {
    data?:GalleryData
}

const props = withDefaults(defineProps<ArticalDataProps>(), {
})

const content = computed(() => {
    if (!props.data?.content) return [];
    return typeof props.data.content === 'string' 
        ? JSON.parse(props.data.content) 
        : props.data.content;
});


// 封面地址
const cover = computed(() => {
    if (!props.data?.cover) return '';
    
    const coverPath = props.data.cover;

    // 如果已经是完整URL，直接返回
    if (coverPath.startsWith('http')) {
        return coverPath;
    }

    // 确保路径正确拼接，避免多重斜杠
    if (coverPath.startsWith('/')) {
        // 如果cover已经以/开头，如："/uploads/xxx.jpg"
        return baseUrl + coverPath;
    } else {
        // 如果cover不以/开头，如："uploads/xxx.jpg"
        return baseUrl + '/' + coverPath;
    }
});

// 计算当前点赞数 - 支持多种字段名
const currentPraiseCount = computed(() => {
    if (!props.data) return 0;
    // 尝试多种可能的字段名，兼容不同的API响应格式
    return props.data.praise_count || 
           props.data.paraseInt || 
           props.data.praiseInt || 
           props.data.likes || 
           0;
});

// 计算当前评论数 - 优先使用store中的数据
const currentCommentCount = computed(() => {
    if (!props.data?.id) return 0;
    const globalState = commentStore.getCommentState(props.data.id);
    const storeCount = globalState.count;
    const propsCount = props.data.comments || props.data.comment || props.data.comment_count || 0;
    
    console.log(`图库${props.data.id}评论数 - store: ${storeCount}, props: ${propsCount}`);
    
    // 优先使用全局状态，如果没有则使用props中的数据
    return storeCount || propsCount;
});

// 不再需要单独获取评论数据，因为已经在图库列表加载时设置到store中了

const updateGallery = () => {
    router.push({
        name: 'EditPhoto', // 使用命名路由
        params: {
            id: props.data!.id
        }
    });
};

// 不再需要在组件挂载时单独获取评论数，评论数已经在图库列表加载时设置到store中



</script>

<style scoped>
.gallery-item{
    border-radius: 8px;
    background-color: var(--background-topbar);
    padding: 24px;
    width: 100%;
    transition: background 0.3s, color 0.3s;
}

[data-theme="dark"] .gallery-item {
    background-color: var(--background-color);
}

.gallery-item-wrapper {
    display: flex;
    align-items: flex-start;
    gap: 8px; /* size="middle" 对应 16px */
    width: 100%;
    flex-direction: column;
}

.gallery-item-image{
    &:hover{
        .gallery-item-operation{
            opacity: 1;
        }
    }
}

.gallery-item-cover{
    position: relative;
    border-radius: 8px 8px 0 0;
    overflow: hidden;
    flex-shrink: 0; /* 防止图片缩小 */
    padding-bottom: 2px;
}

.gallery-item-image-left{
    border-radius: 0 0 0 8px;
    overflow: hidden;
    flex-shrink: 0; /* 防止图片缩小 */
}

.gallery-item-image-middle{
    border-radius: 0;
    overflow: hidden;
    flex-shrink: 0; /* 防止图片缩小 */
}

.gallery-item-image-right{
    border-radius: 0 0 8px 0;
    overflow: hidden;
    flex-shrink: 0; /* 防止图片缩小 */
}

.img-div{
    width: 78px;
    height:78px;
    background-color: var(--gray-100);
}

[data-theme="dark"] .img-div {
    background-color: var(--gray-400);
}

.gallery-item-content {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    color: var(--text-color);
}


.gallery-item-title{
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 4px 0; 
    padding-top: 12px;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    text-overflow: ellipsis;
    color: var(--text-color);
}

.gallery-item-state{
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    min-width: 0;
}

.gallery-item-operation{
    position: absolute;
    right: 8px;
    top: 8px;
    text-align: right;
    flex-shrink: 0;
    margin-left: auto;
    display: flex;
    gap: 4px;
    align-items: center;
    background-color: rgba(255, 255, 255, 0.56);
    transition: background 0.3s, opacity 0.3s;
    border-radius: 8px;
    padding: 4px;
    opacity: 0;
}

.gallery-item-image:hover .gallery-item-operation {
    opacity: 1;
}

[data-theme="dark"] .gallery-item-operation {
    background-color: rgba(30, 32, 37, 0.56);
}

.gallery-item-operation:hover{
    background-color: rgba(255, 255, 255, 0.64);
}

[data-theme="dark"] .gallery-item-operation:hover {
    background-color: rgba(30, 32, 37, 0.64);
}

.icon{
    width: 24px;
    height: 24px;
    padding: 5px;
    cursor: pointer;
    flex-shrink: 0; /* 防止icon缩小 */
    color: var(--text-color);
    transition: color 0.3s, transform 0.3s;
}

.icon:hover{
    color: var(--blue-600);
}

[data-theme="dark"] .icon:hover {
    color: var(--blue-400);
}

/* 统计信息、时间等灰色文字适配 */
:deep(.gallery-item-state .ant-typography),
:deep(.gallery-item-state .ant-typography-text) {
    color: var(--gray-500) !important;
}
[data-theme="dark"] :deep(.gallery-item-state .ant-typography),
[data-theme="dark"] :deep(.gallery-item-state .ant-typography-text) {
    color: var(--gray-300) !important;
}

</style>