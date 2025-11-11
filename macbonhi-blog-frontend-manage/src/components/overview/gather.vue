<template>
    <div class="gather">
        <div v-for="(item, index) in gathers" :key="index" class="gather-item" 
             :style="{ background: 'linear-gradient(' + getBackgroundColor(item, index) + ')' }">
            <a-space direction="vertical" size="small">   
                <a-typography-text :type="index === 0 ? '' : 'secondary'" class="gather-text">{{ item.name }}</a-typography-text>
                <a-typography-title :level="2" class="gather-title">{{ item.total }}</a-typography-title>
            </a-space>

            <a-button class="button-add" v-if="index > 0" size="large" shape="square" @click="editPage(item.path)">
                <PlusOutlined />
            </a-button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { overviewData } from '../../utils/Menu';
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useThemeStore } from '../../store/theme'; // 引入主题存储
import { overviewApi } from '../../api/index';
import { useUserStore } from '../../store/user';
import { useCode } from '../../hooks/code';
const userStore = useUserStore();
const { tackleCode } = useCode();


const gathers = ref(overviewData);
const router = useRouter();
const themeStore = useThemeStore(); // 使用主题存储

// 当前主题
const currentTheme = computed(() => themeStore.currentTheme);

// 根据主题和索引返回背景色
const getBackgroundColor = (item: any, index: number) => {
    if (currentTheme.value === 'dark') {
        // 深色模式下的背景颜色
        if (index === 0) {
            // 第一个卡片在深色模式下的颜色
            return '180deg, #1a3e99cc 0%, #1A3E99 100%';
        } else if (index === 1) {
            // 博客文章在深色模式下的颜色
            return '180deg, #9e3a0529 0%, #9e3a053d 100%';
        } else if (index === 2) {
            // 摄影图库在深色模式下的颜色
            return '180deg, #16840429 0%, #1684043d 100%';
        } else if (index === 3) {
            // 随笔随记在深色模式下的颜色
            return '180deg, #007a9529 0%, #007a953d 100%';
        }
    }
    // 浅色模式返回原始颜色
    return item.bgColor;
}

//模拟获取数据
const getOverviewData = () => {

    let request = {
        token: userStore.token
    }

    overviewApi(request).then((res:any) => {
        if (tackleCode(res.code)) {
            const data = res.data;
            gathers.value[0].total = data.file;
            gathers.value[1].total = data.article;
            gathers.value[2].total = data.gallery;
            gathers.value[3].total = data.diary;
        }
    });
}

const editPage = (url:string) => {
    // 根据不同的路径跳转到对应的编辑页面
    if (url === 'articles') {
        router.push({ name: 'EditArticle' }); // 新建文章
    } else if (url === 'gallery') {
        router.push({ name: 'EditPhoto' }); // 新建图库
    } else {
        router.push(url); // 其他情况保持原有逻辑
    }
}

onMounted(() => {
    getOverviewData();
})
</script>

<style scoped>
.gather{
    width: 100%;
    border-radius: 8px;
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
}

.gather-item{
    width: calc(25% - 12px);
    border-radius: 8px;
    padding: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.gather-text {
    color: var(--text-color);
}

.gather-item:first-child .gather-text,
.gather-item:first-child .gather-title {
    color: #ffffff;
}

.gather-title {
    margin: 0;
    color: var(--text-color);
}

.button-add{
    background: var(--gray-100);
    border-radius: 8px;
    border: 1px solid var(--gray-200);
    color: var(--text-color);
}

/* 深色模式适配 */
[data-theme="dark"] .button-add {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.1);
}

/* 深色模式下二级文本颜色调整 */
[data-theme="dark"] .ant-typography-secondary {
    color: var(--gray-500) !important;
}

/* 响应式布局 */
@media (max-width: 1200px) {
    .gather-item {
        width: calc(50% - 8px);
    }
}

@media (max-width: 768px) {
    .gather-item {
        width: 100%;
    }
}
</style>