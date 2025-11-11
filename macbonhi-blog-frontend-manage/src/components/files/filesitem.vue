<template>

    <div class="item">
        <div class="item-box" :class="{'file-item-selected':props.data?.selected}">
            <img v-if="!imageLoadError" :src="conurl" @error="handleImageError">
            <img v-else class="file-icon" src="../../assets/文件.svg" alt="文件图标">
            <a-space class="item-background" size="small">
                <DeleteOutlined class="icon" @click="deleteFile"/>

                <!-- 这里使用一个气泡确认框来实现下拉提示 -->
                <a-popconfirm
                    ok-text="确认"
                    cancel-text="取消"
                    @confirm="confirm"
                    @cancel="cancel"
                    placement="bottom"
                    icon=''
                >
                    <template #title>
                        <p>选择分组</p>
                        <div class="swap-pop-scroll">
                            <div v-for="item in subsetStore.data" 
                                :key="item.id" 
                                class="swap-pop-content" 
                                :class="{'selected-pop-subset': selectedSubsetId === item.id}" 
                                @click="changeSubset(item.id)"
                            >
                                {{ item.name }}{{ item.count }}
                            </div>
                        </div>
                    </template>
                    <SwapOutlined class="icon" />
                </a-popconfirm>

            </a-space>

            <div class="item-icon" @click="selectedFile">
                <CheckOutlined style="font-size: 14px;"/>
            </div>
        </div>
        <div class="item-name">
            <p class="item-name-first">{{ props.data?.file_name }}</p>
        </div>

    </div>

</template>


<script setup lang="ts">

import { computed, ref } from 'vue';
import type { filesbodyprops } from './files';
import { message } from 'ant-design-vue';
import { useSubsetStore } from '../../store/subset';
import { baseUrl } from '../../utils/env';

//pinia管理其状态
const subsetStore = useSubsetStore();

const props = withDefaults(defineProps<filesbodyprops>(), {

})

//图片加载失败状态
const imageLoadError = ref(false);

//处理图片加载失败
const handleImageError = () => {
    imageLoadError.value = true;
}

//由于我们只有图片名称这里我们需要对其路径也进行拼接
const conurl = computed(() => {
    
    return baseUrl + props.data?.url;
})
    
const emits = defineEmits(['changeSubsetId', 'deleteFile', 'selectedFile']);

const confirm = () => {
    if (selectedSubsetId.value != props.data?.subset_id) {
        let data = {
            fileId: props.data?.id,
            subsetId: selectedSubsetId.value,
        }

        emits("changeSubsetId", data);
    }

};

const cancel = () => {
    message.error('点击取消');
};

const deleteFile = () => {
    emits("deleteFile", props.data?.id, props.data?.url)
}
const selectedFile = () => {
    emits("selectedFile", props.data?.id)
}

//分类选择
const selectedSubsetId = ref<number | string>(props.data?.subset_id!);

//切换分组
const changeSubset = (id: number | string) => {
    selectedSubsetId.value = id;
}

</script>

<style scoped>

.item {
    /* 添加容器约束 */
    width: 100%;
    max-width: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.item-box{
    display: flex;
    position: relative;
    word-wrap: break-word;
    border-radius: 8px;
    justify-content: center;
    transition: all 0.3s ease;
    border: 2px solid var(--background-topbar);
    background: var(--background-topbar);
    /* 确保图片容器不会溢出 */
    width: 100%;
    aspect-ratio: 1; /* 保持正方形比例 */
    overflow: hidden;
    align-items: center;
}

.item-box:hover{
    background-color: var(--blue-100);
    border-color: var(--blue-200);
}

[data-theme="dark"] .item-box {
    border: 2px solid var(--background-color);
    background: var(--background-color);
}
[data-theme="dark"] .item-box:hover {
    background-color: var(--gray-200);
    border-color: var(--gray-300);
}

img{
    width: 100%;
    height: 100%;
    object-fit: cover; /* 填满容器，可能裁剪 */
    /* 如果希望保持完整图片显示，可以使用 object-fit: contain */
    border-radius: 6px; /* 稍微小于容器的圆角 */
}

.item-background{
    position: absolute;
    right: 8px;
    bottom: 8px;
    padding: 8px;
    opacity: 0;
    transition: all 0.3s ease;
}

.icon{
    font-size: 16px;
    color: var(--text-color);
    padding: 8px;
    background-color: rgba(255, 255, 255, 0.56);
    border-radius: 8px;
    transition: all 0.3s ease;
    cursor: pointer;
}

[data-theme="dark"] .icon {
    color: var(--text-color);
    background-color: rgba(0,0,0,0.36);
}

.icon:hover{
    color: var(--blue-600) !important;
    background-color: var(--blue-100) !important;
}

[data-theme="dark"] .icon:hover {
    color: var(--blue-400) !important;
    background-color: var(--blue-900) !important;
}

.item-icon{
    display: flex;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    background-color: rgba(255, 255, 255, 0.56);
    position: absolute;
    left: 8px;
    top: 8px;
    cursor: pointer;
    border: 1px solid rgba(255, 255, 255, 0.56);
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: all 0.3s ease;
    color: rgba(255, 255, 255, 0.56);
}

.file-item-selected{
    background-color: var(--blue-100) !important;
    border: 2px solid var(--blue-200) !important;
}

[data-theme="dark"] .file-item-selected {
    background-color: var(--gray-200) !important;
    border: 2px solid var(--gray-300) !important;
}

.item-box:hover .item-icon{
    opacity: 1;
}

.item-box:hover .item-background{
    opacity: 1;
}

.file-item-selected .item-icon{
    display: flex;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    background-color: var(--blue-600);
    position: absolute;
    left: 8px;
    top: 8px;
    cursor: pointer;
    border: 1px solid var(--blue-600);
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    opacity: 1;
    color: #fff;
}

[data-theme="dark"] .file-item-selected .item-icon {
    background-color: var(--blue-400);
    color: #fff;
    border: 1px solid var(--blue-400);
}

.file-item-selected .item-background{
    opacity: 0;
}

.file-item-selected .item-box:hover .item-background{
    opacity: 1;
}

.file-item-selected .item-box:hover .item-icon{
    opacity: 1;
}

.file-item-selected .item-box:hover{
    background-color: var(--blue-100) !important;
}

[data-theme="dark"] .file-item-selected .item-box:hover {
    background-color: var(--blue-900) !important;
}

.item-name{
    font-size: 14px;
    color: var(--text-color);
    display: flex;
    justify-content: center;
    width: 100%;
    /* 确保文件名不会溢出 */
    overflow: hidden;
    padding: 0 4px; /* 添加一点内边距 */
}

[data-theme="dark"] .item-name {
    color: var(--text-color);
}

.item-name-first{
    text-align: center;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2; /* 允许显示2行 */
    line-clamp: 2;
    -webkit-box-orient: vertical;
    text-overflow: ellipsis;
    line-height: 1.3;
    word-break: break-all; /* 强制换行，避免长文件名溢出 */
    width: 100%;
    max-width: 100%;
    /* 限制最大高度 */
    max-height: calc(1.3em * 2);
    margin: 0; /* 移除默认margin */
}

/* 选择类别按钮气泡弹窗中内容相关的滚动窗口这里隐藏其滚动条 */

.swap-pop-scroll{
    overflow-y: auto;
    width: 180px;
    max-height: 200px;
}


.swap-pop-scroll::-webkit-scrollbar{
    display: none;
}

.swap-pop-content{
    background-color: var(--gray-100);
    line-height: 32px;
    padding: 0 16px;
    margin: 8px 0;
    border-radius: 800px;
    cursor: pointer;
    transition: all;
    user-select: none;
    color: var(--text-color);
}

.swap-pop-content:hover{
    background-color: var(--blue-100);
    color: var(--blue-600);
}


/* 选中气泡框中的一项切换此样式 */
.selected-pop-subset{
    background-color: var(--blue-100);
    color: var(--blue-600);
    font-weight: 500;

}

.selected-pop-subset:hover{
    background-color: var(--blue-100);
}

[data-theme="dark"] .swap-pop-content {
    background-color: var(--gray-200);
    color: var(--text-color);
}
[data-theme="dark"] .swap-pop-content:hover {
    background-color: var(--blue-900);
    color: var(--blue-400);
}
[data-theme="dark"] .selected-pop-subset,
[data-theme="dark"] .selected-pop-subset:hover {
    background-color: var(--blue-900);
    color: var(--blue-400);
}

.file-icon {
    width: 80px;
    height: 80px;
    object-fit: contain;
}

</style>