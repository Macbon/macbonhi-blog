<template>
    
    <div style="display: flex; flex-direction: column; gap: 24px;">
        <TopTitle title="本地文件" :isSearch="false">
            <template #search-upload>
                <div style="display: flex; gap: 24px; align-items: center;">
                    <a-typography-text type="secondary">
                        图片、视频、音频大小不超过20M
                    </a-typography-text>
                    <a-button @click="showUploadDrawer">
                        上传
                    </a-button>
                </div>
            </template>
        </TopTitle>
        <Subset :classify="2" @nowSubset="nowSelect"/>
        <files :subsetId="Number(nowSubset)" /> 
        
        <!-- 上传文件抽屉 -->
        <a-drawer
          :visible="drawerVisible"
          placement="right"
          :width="680"
          @close="closeUploadDrawer"
          title="上传文件"
          :destroyOnClose="true"
        >
          <Upload @uploadSuccess="handleUploadSuccess" />
        </a-drawer>
    </div>
</template>

<script setup lang="ts">
import TopTitle from '../components/TopTitle.vue';
import Subset from '../components/classification/subset.vue';
import files from '../components/files/filesComponents.vue';
import Upload from '../components/upload/upload.vue';
import { ref } from 'vue';

const nowSubset = ref<number | string>(-1);
const drawerVisible = ref<boolean>(false);

const emit = defineEmits(['nowSubset']);

const nowSelect = (e: any) => {
    if (e.type == "all") {
        nowSubset.value = -1;
    } else if (e.type == "subset" || e.type == "exclude") {
        nowSubset.value = Number(e.id);
    } 
}

// 打开上传抽屉
const showUploadDrawer = () => {
    drawerVisible.value = true;
}

// 关闭上传抽屉
const closeUploadDrawer = () => {
    drawerVisible.value = false;
}

// 上传成功后的处理
const handleUploadSuccess = () => {
    // 上传成功后关闭抽屉并刷新文件列表
    closeUploadDrawer();
    // 这里可以添加刷新文件列表的逻辑
}
</script>

<style scoped>
/* 浅色模式 */
/* 覆盖 Antd Typography secondary 颜色 */
:deep(.ant-typography-secondary) {
  color: var(--gray-500) !important;
}

[data-theme="dark"] :deep(.ant-typography-secondary) {
  color: var(--gray-500) !important;
}
</style>