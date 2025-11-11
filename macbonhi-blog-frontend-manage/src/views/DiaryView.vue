<template>
    
    <div style="display: flex; flex-direction: column; gap: 24px;">
        
        <TopTitle title="随笔随记" :isSearch="true" @search="search"/>
        <div style="width: 100%; display: flex; gap:24px; ">
            <Diary ref="diaryListRef" style="flex: 1;" :searchTerm="searchTerm"/>
            <diaryEdit class="diary-edit" @save="createDiary"/>
        </div>

    </div>

    
</template>

<script setup lang="ts">
import TopTitle from '../components/TopTitle.vue';
import Diary from '../components/diary/diary.vue';
import diaryEdit from '../components/diary/diary-edit.vue';
import { createDiaryApi } from '../api';
import { useCode } from '../hooks/code';
import { message } from 'ant-design-vue';
import { useUserStore } from '../store/user';   
import { ref } from 'vue';

const { tackleCode } = useCode();
const userStore = useUserStore();

const diaryListRef = ref();

const createDiary = async (data: any) => {
    try {
        const request = {
            token: userStore.token,
            title: data.title,
            content: data.content,
            weather_id: data.weather_id,
            moment: data.moment,
            picture: typeof data.picture === 'string' ? data.picture : JSON.stringify(data.picture)
        }
        
        const res = await createDiaryApi(request)
        if (tackleCode(res.code)) {
            message.success('创建成功')
            // 刷新日记列表
            diaryListRef.value?.refreshDiaryList();
        }
    } catch (error: any) {
        if (error.code === 'ERR_NETWORK') {
            message.error('无法连接到服务器，请检查：\n1. 后端服务是否启动\n2. API地址是否正确')
        } else {
            message.error(`创建失败：${error.message || '未知错误'}`)
        }
        console.error('创建日记错误:', error)
    }
}

//搜索词
const searchTerm = ref<string>('');
const query = ref<boolean>(true);

const search = (e: any) => {
    searchTerm.value = e;
    if (e) {
        query.value = false;
    } else {
        query.value = true;
    }
}

</script>

<style scoped>

.diary-edit{
    flex: none;
    width: 600px;
}

</style>