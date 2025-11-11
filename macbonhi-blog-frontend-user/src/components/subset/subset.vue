<template>
    <div class="category-filter">
        <div class="filter-item" :class="{'filter-item-active': selected == '-1all'}" @click="chageState(-1, 'all')">
            全部 {{ subsetStore.count }}
        </div>
        <div class="filter-item" v-for="item in subsetStore.data" :key="item.id" 
             :class="{'filter-item-active': selected == item.id + 'subset'}" 
             @click="chageState(item.id, 'subset')">
            {{ item.name }} {{ item.count }}
        </div>
    </div>
</template>

<script setup lang="ts">    
import { onMounted } from 'vue';
import { useSubset } from '../../hooks/subset';

const emit = defineEmits(['nowSubset']);

const props = defineProps({
    classify: {
        type: Number,
        default: -1
    },
    isDownloadPage: {
        type: Boolean,
        default: false
    }
})

const {
    selected,
    subsetStore,
    chageState,
    rawSubset
} = useSubset(emit, props.isDownloadPage);

onMounted(() => {
    rawSubset(props.classify);
})
</script>

<style scoped>
.category-filter {
    min-width: 348px;
    max-width: 80%;
    width: auto;
    height: 40px;
    background: var(--background-topbar);
    border-radius: 20px;
    margin: 0 auto 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 16px;
    box-shadow: 0 2px 8px var(--gray-200);
    transition: background 0.3s, box-shadow 0.3s;
    overflow-x: auto;
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE and Edge */
    position: relative;
}

.category-filter::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
}

.filter-item {
    height: 100%;
    display: flex;
    align-items: center;
    padding: 0 12px;
    white-space: nowrap;
    font-size: 14px;
    color: var(--text-color);
    cursor: pointer;
    position: relative;
    transition: color 0.3s, font-weight 0.3s;
    margin: 0 4px;
    z-index: 2;
}

.filter-item-active {
    color: var(--text-color);
    font-weight: 500;
}

/* 移除旧的底部线条 */
.filter-item-active::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 95px;
    height: 32px;
    background: #E8E5DC;
    border-radius: 16px;
    z-index: -1;
    transition: all 0.3s ease;
}

/* 深色模式适配 */
[data-theme="dark"] .category-filter {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

[data-theme="dark"] .filter-item-active::before {
    background: #333842;
}

/* 响应式调整 */
@media (max-width: 768px) {
    .category-filter {
        min-width: 280px;
        max-width: 90%;
    }
}
</style>