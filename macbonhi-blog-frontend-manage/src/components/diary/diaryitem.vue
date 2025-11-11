<template>

    <div class="diary-item">
        <div class="diary-top">
            <div class="diary-item-left">


                <p class="diary-item-title">
                    {{ props.data?.title }}
                    <span
                        class="weather-icon"
                        v-html="weather[props.data?.weather_id!].icon"
                    ></span>
                </p>

                <a-typography-text class="diary-time">
                    {{ momentl(props.data?.moment!) }}
                </a-typography-text>

            </div>
            <div class="diary-item-right">
                <a-popconfirm placement="rightTop" ok-text="是" cancel-text="否" @confirm="deletediary(props.data!.id!)">
                    <template #title>
                        确认删除
                    </template>
                    <DeleteOutlined class="icon"/>
                </a-popconfirm>
            </div>
        </div>

        <p class="diary-item-content">{{ props.data?.content }}</p>

        <div class="diary-images" v-if="pictures.length > 0">
            <img 
                v-for="(pic, index) in pictures" 
                :key="index" 
                :src="pic" 
                class="diary-image"
                @click="handleImageClick(pic)"
                loading="lazy"
            >
        </div>

    </div>
    
    <!-- 图片预览模态框 -->
    <a-modal
        :open="previewVisible"
        :footer="null"
        @cancel="previewVisible = false"
        :width="800"
        centered
    >
        <img :src="previewImage" style="width: 100%" />
    </a-modal>
</template>


<script setup lang="ts">

import type { DiaryData } from '@/utils/typeof';
import { computed, ref } from 'vue';
import { useSubsetStore } from '../../store/subset';
import { momentl } from '../../utils/moment';
import { weather } from '../../utils/weather';


const emits = defineEmits(["delete", "state"])

const deletediary = (id: number) => {
    emits("delete", id);

};


const subsetStore = useSubsetStore();

type DiaryDataProps = {
    data?: DiaryData
}

const props = withDefaults(defineProps<DiaryDataProps>(), {
})


//日记图片
const pictures = computed(() => {
    if (props.data?.picture) {
        try {
            // 处理被分割的 JSON 字符串
            let pictureStr = '';
            if (Array.isArray(props.data.picture)) {
                // 将数组元素合并成一个字符串
                pictureStr = props.data.picture.join('');
                
                // 修复 JSON 格式
                pictureStr = pictureStr
                    // 在 id 后添加逗号
                    .replace(/"id":\d+/, '$&,')
                    // 在 url 后添加逗号
                    .replace(/"url":"[^"]+?"/, '$&,');

            } else {
                pictureStr = props.data.picture;
            }

            // 解析 JSON 字符串
            const pictureData = JSON.parse(pictureStr);
            
            // 提取 URL
            const urls = Array.isArray(pictureData)
                ? pictureData.map(item => item.url)
                : pictureData.url ? [pictureData.url] : [];

            return urls;
        } catch (error) {
            console.error('解析图片数据失败:', error);
            // 尝试直接从字符串中提取 URL
            const urlMatch = props.data.picture.toString().match(/"url":"([^"]+)"/);
            if (urlMatch && urlMatch[1]) {
                return [urlMatch[1]];
            }
            return [];
        }
    }
    return [];
});

// 预览状态
const previewVisible = ref(false);
const previewImage = ref('');

// 处理图片点击
const handleImageClick = (url: string) => {
    previewImage.value = url;
    previewVisible.value = true;
};

</script>

<style scoped>
.diary-item{
    display: flex;
    border-radius: 8px;
    background-color: var(--background-topbar)!important;
    padding: 24px;
    width: 100%;
    gap: 8px;
    flex-direction: column;
    &:hover{
        .icon{
            opacity: 1;
        }
    }
}

.diary-top{
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
}

.diary-item-left{

    display: flex;
    flex-direction: column;
    gap: 8px;
}

.diary-item-title{
    display: flex;
    align-items: center;
    font-size: 20px;
    font-weight: 600;
    margin: 0;
    gap:8px;
}


.diary-item-content{
    font-size: 16px;
    line-height: 22px;
    color: var(--text-color)!important;
    height: 48px;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    margin-bottom: 8px
}

.diary-images {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.diary-image {
    border-radius: 8px;
    width: 80px;
    height: 80px;
    object-fit: cover;
    cursor: pointer;
    transition: transform 0.3s;
}

.diary-image:hover {
    transform: scale(1.05);
}

.icon {
    width: 24px;
    height: 24px;
    padding: 2%;
    cursor: pointer;
    flex-shrink: 0;
    transition: color 0.3s, transform 0.3s, opacity 0.3s;
    opacity: 0;
    color: var(--text-color);
}
.icon:hover {
    color: var(--blue-600);
    transform: scale(1.1);
}
[data-theme="dark"] .icon:hover {
    color: var(--blue-400);
}

.diary-time {
    color: var(--gray-500) !important;
    margin: 0;
    transition: color 0.3s;
}
[data-theme="dark"] .diary-time {
    color: var(--gray-300) !important;
}

.weather-icon svg {
    width: 24px;
    height: 24px;
    vertical-align: middle;
    color: var(--weather-icon-color, #FFD600);
    transition: color 0.3s;
}
[data-theme="dark"] .weather-icon svg {
    color: var(--weather-icon-dark, #90caf9);
}

</style>