<template>
    <div class="article-item">
        <div class="article-item-wrapper">
            <div class="article-item-pic">
                <img :src="cover" width="160px" height="120px" fit="cover">
                <p class="atticle-item-unpublish" v-if="props.data?.state === 0">未发布</p>
            </div>

            <div class="article-item-content">
                <p class="article-item-title">{{ props.data?.title }}</p>
                <p class="article-item-introduce">{{ props.data?.introduce }}</p>
                <div class="article-item-state">
                    <div>
                        <a-space :size="size">
                            <a-typography-text type="secondary">
                                <a-typography-text class="article-item-category">
                                    {{ subsetStore.subsetName(props.data?.subset_id) }}
                                </a-typography-text>
                                <!--显示标签名称 -->
                                <a-typography-text type="secondary" v-if="displayLabels.length > 0">
                                    /
                                    <span v-for="(labelName, index) in displayLabels" :key="index" class="label-item">
                                        {{ labelName }}
                                        <span v-if="index < displayLabels.length - 1">  </span>
                                    </span>
                                </a-typography-text>
                            </a-typography-text>
                            
                            <a-typography-text class="article-item-meta">
                                {{ momentm(props.data?.moment!) }}
                            </a-typography-text>
                            
                            <a-space size="middle">
                                <a-typography-text class="article-item-meta">
                                    <EyeOutlined />
                                    {{ props.data?.views }}
                                </a-typography-text>
                                <a-typography-text class="article-item-meta">
                                    <LikeOutlined />
                                    {{ currentPraiseCount }}
                                </a-typography-text>
                                <a-typography-text class="article-item-meta">
                                    <MessageOutlined />
                                    {{ currentCommentCount }}
                                </a-typography-text>
                            </a-space>
                        </a-space>
                    </div>

                    <div class="article-item-operation">
                        <a-tooltip placement="top" title="发布" v-if="props.data?.state === 0">
                            <SendOutlined class="icon" @click="changeArticleState(props.data.id, 1)"/>
                        </a-tooltip>

                        <a-tooltip placement="top" title="撤回" v-if="props.data?.state === 1">
                            <RollbackOutlined class="icon" @click="changeArticleState(props.data.id, 0)"/>
                        </a-tooltip>

                        <a-tooltip placement="top" title="编辑">
                            <HighlightOutlined class="icon" @click="updateArticle()"/>
                        </a-tooltip>

                         <a-popconfirm placement="rightTop" ok-text="是" cancel-text="否" @confirm="deleteArticle(props.data!.id)">
                            <template #title>
                                确认删除
                            </template>
                            <DeleteOutlined class="icon"/>
                        </a-popconfirm>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { ArticalData } from '@/utils/typeof';
import { computed, ref } from 'vue';
import { useSubsetStore } from '../../store/subset';
import { useLabelStore } from '../../store/label';
import { useCommentStore } from '../../store/comment';
import { momentm } from '../../utils/moment';
import { baseUrl } from '../../utils/env';
import { useRouter } from 'vue-router';

const router = useRouter();

const emits = defineEmits(["delete", "state"]);

const deleteArticle = (id: number) => {
    emits("delete", id);
};

const changeArticleState = (id: number, state: number) => {
    emits("state", { id: id, state: state });
};
//修改文章
const updateArticle = () => {
    router.push({
        name: 'EditArticle', // 使用命名路由
        params: {
            id: props.data!.id
        }
    });
};

const size = ref(24);

const subsetStore = useSubsetStore();
const labelStore = useLabelStore(); //引入标签store
const commentStore = useCommentStore(); //引入评论store

type ArticalDataProps = {
    data?: ArticalData
}

const props = withDefaults(defineProps<ArticalDataProps>(), {});

// 将标签ID转换为标签名称
const getLabelNameById = (labelId: string | number): string => {
    const label = labelStore.data.find(item => item.id == labelId);
    return label ? String(label.label_name) : `标签${labelId}`;
};

// 处理标签字符串并返回标签名称数组
const displayLabels = computed(() => {
    if (!props.data?.label) return [];
    
    const labelString = String(props.data.label);
    const labelIds = labelString.split(',').map(id => id.trim()).filter(id => id);
    
    return labelIds.map(id => getLabelNameById(id));
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
    
    console.log(`文章${props.data.id}评论数 - store: ${storeCount}, props: ${propsCount}`);
    
    // 优先使用全局状态，如果没有则使用props中的数据
    return storeCount || propsCount;
});

// 不再需要单独获取评论数据，因为已经在文章列表加载时设置到store中了

// 封面地址
const cover = computed(() => {
    if (!props.data?.cover) return '';
    
    const coverPath = props.data.cover;
    // 如果已经是完整URL，直接返回
    if (coverPath.startsWith('http')) {
        return coverPath;
    }
    // 如果是相对路径，进行拼接
    // 确保路径正确拼接，避免多重斜杠
    if (coverPath.startsWith('/')) {
        // 如果cover已经以/开头，如："/uploads/xxx.jpg
        return baseUrl + coverPath;
    } else {
        // 如果cover不以/开头，如："uploads/xxx.jpg"
        return baseUrl + '/' + coverPath;
    }
});

// 不再需要在组件挂载时单独获取评论数，评论数已经在文章列表加载时设置到store中
</script>

<style scoped>
.article-item {
    border-radius: 8px;
    background-color: var(--background-topbar);
    padding: 24px;
    width: 100%;
    color: var(--text-color);
}

[data-theme="dark"] .article-item {
    background-color: var(--background-topbar);
    color: var(--text-color);
}

.article-item-wrapper {
    display: flex;
    align-items: flex-start;
    gap: 16px; /* size="middle" 对应 16px */
    width: 100%;
}

.article-item-pic {
    position: relative;
    border-radius: 8px;
    overflow: hidden;
    flex-shrink: 0; /* 防止图片缩小 */
}

.article-item-content {
    flex: 1;
    min-width: 0;
}

.atticle-item-unpublish {
    position: absolute;
    bottom: 0;
    margin: 0;
    left: 0;
    padding: 4px 0;
    width: 100%;
    background-color: var(--blue-600);
    text-align: center;
    color: white;
    line-height: 20px;
    font-weight: 600;
}

[data-theme="dark"] .atticle-item-unpublish {
    background-color: var(--blue-400);
    color: #fff;
}

.article-item-title {
    font-size: 20px;
    font-weight: 600;
    padding-bottom: 8px;
}

.article-item-introduce {
    font-size: 16px;
    line-height: 22px;
    color: var(--text-color);
    height: 48px;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    margin-bottom: 8px;
}

.label-item {
    padding-right: 4px;
    color: var(--blue-600);
}

[data-theme="dark"] .label-item {
    color: var(--blue-400);
}

.article-item-state {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    min-width: 0;
}

.article-item-operation {
    text-align: right;
    flex-shrink: 0;
    margin-left: auto; /* 强制推到右边 */
    display: flex; /* 添加display: flex */
    gap: 16px;     /* 设置间距为8px */
    align-items: center; /* 垂直居中 */
}

.icon {
    width: 20px;
    height: 20px;
    color: var(--gray-500);
    cursor: pointer;
    flex-shrink: 0;
    transition: color 0.3s, transform 0.3s;
}

.icon:hover {
    color: var(--blue-600);
    transform: scale(1.1);
}

[data-theme="dark"] .icon {
    color: var(--gray-300);
}

[data-theme="dark"] .icon:hover {
    color: var(--blue-400);
}

.article-item:last-child {
    margin-bottom: 0;
}

.article-item-meta {
    color: var(--gray-400);
    transition: color 0.3s;
}

[data-theme="dark"] .article-item-meta {
    color: var(--gray-500);
}

.article-item-category {
    color: var(--gray-500);
    font-weight: 500;
}

[data-theme="dark"] .article-item-category {
    color: var(--gray-300);
}
</style>