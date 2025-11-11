<template>
    <div class="top-title">
        <a-typography-title :level="3" class="title-text">{{ props.title }}</a-typography-title>

        <slot name="search-upload"></slot>

        <a-space size="small" v-if="isSearch">
            <a-button class="cancel-button" v-show="SeachData" @click="onCancelSearch">取消搜索</a-button>

            <a-input-search
                v-model:value="SeachData"
                placeholder="请输入..."
                enter-button
                @search="onSearch"
                class="search-input"
            />
        </a-space>
    </div>
</template>


<script setup lang="ts">


    import { ref } from 'vue';

    const SeachData = ref('');
    


    type TopTitleProps = {
        title: string;
        isSearch: boolean;
    }

    const props = withDefaults(defineProps<TopTitleProps>(), {
        title: '总览',
        isSearch: true,
    });

    const emit = defineEmits(['search']);

    const onSearch = () => {
        emit('search', SeachData.value);
    }
    //取消搜索
    const onCancelSearch = () => {
        SeachData.value = '';
        emit('search', '');
    }

</script>

<style scoped>

    .top-title{
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 32px;
        width: 100%;
        padding: 10px 0;
    }

    .title-text {
        margin: 0;
        line-height: 36px;
        color: var(--text-color);
    }

    .cancel-button {
        height: 32px;
        color: var(--text-color);
        background-color: var(--background-topbar);
        border-color: var(--gray-300);
    }

    .cancel-button:hover {
        color: var(--blue-600);
        border-color: var(--blue-600);
    }

    .search-input {
        width: 320px;
        height: 32px;
    }

    /* 深色模式适配 */
    [data-theme="dark"] .cancel-button {
        background-color: var(--gray-800);
        border-color: var(--gray-700);
        color: var(--text-color);
    }

    [data-theme="dark"] .cancel-button:hover {
        color: var(--blue-400);
        border-color: var(--blue-400);
    }

    /* 搜索框样式适配 */
    :deep(.ant-input) {
        background-color: var(--background-topbar);
        border-color: var(--gray-300);
        color: var(--text-color);
    }

    :deep(.ant-input:hover),
    :deep(.ant-input:focus) {
        border-color: var(--blue-600);
    }

    :deep(.ant-input::placeholder) {
        color: var(--gray-500);
    }

    :deep(.ant-input-search-button) {
        background-color: var(--blue-600);
        border-color: var(--blue-600);
        color: #fff;
    }

    :deep(.ant-input-search-button:hover) {
        background-color: var(--blue-700);
        border-color: var(--blue-700);
    }

    /* 深色模式下的搜索框样式 */
    [data-theme="dark"] :deep(.ant-input) {
        background-color: var(--gray-800);
        border-color: var(--gray-700);
    }

    [data-theme="dark"] :deep(.ant-input:hover),
    [data-theme="dark"] :deep(.ant-input:focus) {
        border-color: var(--blue-400);
    }

    [data-theme="dark"] :deep(.ant-input-search-button) {
        background-color: var(--blue-600);
        border-color: var(--blue-600);
    }

    [data-theme="dark"] :deep(.ant-input-search-button:hover) {
        background-color: var(--blue-700);
        border-color: var(--blue-700);
    }
</style>
