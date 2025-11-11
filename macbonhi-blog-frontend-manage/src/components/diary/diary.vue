<template>
    <div class="diary-card">
        <div style="display: flex;align-items: flex-start; gap:8px; flex-direction: column;">

            <diaryItem v-for="item in diaryList" :data="item" :key = "item.id" @delete="deleteDiary"/>

        </div>
        
   
        <div class="article-pagination" v-if="diaryList.length > 0 && count > props.pageSize">
            <a-pagination 
                size="small" 
                v-model:current="current" 
                :total="count" 
                :page-size="props.pageSize"
                @change="pageChange"
                show-size-changer
            />
        </div>
    </div>

</template>

<script setup lang="ts">

import { ref, onMounted, reactive, watch, defineExpose } from 'vue';
import diaryItem from './diaryitem.vue';
import type { DiaryData } from '@/utils/typeof';
import { useCode } from '../../hooks/code';
import { getDiaryApi, deleteDiaryApi } from '../../api';
import { useUserStore } from '../../store/user';
import { message } from 'ant-design-vue';

const { tackleCode } = useCode();
const userStore = useUserStore();

const current = ref(1);
//获取日记数据
const diaryList = ref<DiaryData[]>([]);

const count = ref<number>(0);//文章总数

const props = defineProps({
    pageSize: {
        type: Number,
        default: 4,
    },
    searchTerm: {
        type:String,
        default: '',
    },

})

// 使用 reactive 管理请求参数
const requestParams = reactive({
    pageSize: props.pageSize,
    nowPage: 1,
    searchTerm: props.searchTerm,
    count: true
});


const getdata = async () => {

    // 创建普通对象，避免循环引用
    const requestData = {
        token: userStore.token,
        value: { ...requestParams }  // 关键：使用展开操作符
    };
    
    const res = await getDiaryApi(requestData);
    if (tackleCode(res.code)) {
        diaryList.value = res.data.result;
        count.value = res.data.count;
    }

}

// 刷新日记列表的方法，供父组件调用
const refreshDiaryList = () => {
    current.value = 1;
    requestParams.nowPage = 1;
    getdata();
}

//删除日记
const deleteDiary = async (id: number) => {

    const request = {
        token: userStore.token,
        diaryId: id
    }
    const res = await deleteDiaryApi(request)
    if (tackleCode(res.code)) {
        message.success('删除成功');
        // 重新获取当前页数据
        await getdata();
    }
}


const pageChange = (page: number, newPageSize?: number) => {
    requestParams.nowPage = page;
    current.value = page;
    
    if (newPageSize && newPageSize !== requestParams.pageSize) {
        requestParams.pageSize = newPageSize;
        requestParams.nowPage = 1;
        current.value = 1;
    }
    getdata();
};


watch(
    () => [props.searchTerm],
    () => {     
        requestParams.searchTerm = props.searchTerm;
        requestParams.nowPage = 1;
        current.value = 1;

        Promise.resolve(getdata()).finally(() => {

        });
    },
    { deep: true }
);


onMounted(() => {
    getdata();
})

// 暴露方法给父组件
defineExpose({
    refreshDiaryList
});

</script>

<style scoped>

.diary-card{
    display: flex; 
    gap: 24px; 
    width: 100%;
    flex-direction: column;
}


.diary-content-files{
    display: grid;
    grid-template-columns: repeat(auto-fill, 238px);
    row-gap: 32px;
    column-gap: 24px;
    justify-content: center;
}


.article-label{
    width: 300px;
    height: 400px;
    flex: none;
}

.article-pagination {
    padding: 16px 0 24px;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    border-top: 1px solid var(--gray-200);
    background: transparent;
}
[data-theme="dark"] .article-pagination {
    border-top: 1px solid var(--gray-400);
}


</style>
