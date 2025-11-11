<template>
    <div class="subset-box">
        <div class="subset">
            <div class="subset-menu" :class="{'subset-menu-select':selected == '-1all'}" @click="chageState(-1, 'all')">
                全部 {{ subsetStore.count }}
            </div>
            <!-- 这里拆成了三个模块，全部/已发布和未发布/分类 -->
            <div class="subset-menu" v-for="item in state" :key="item.id" :class="{'subset-menu-select':selected == item.id + 'state'}" @click="chageState(item.id, 'state')" v-if="props.classify == 0">
                {{ item.name }} {{ item.value }}
            </div>

            <div class="subset-menu" :class="{'subset-menu-select':selected == subsetStore.exclude.id + 'exclude'}" @click="chageState(subsetStore.exclude.id, 'exclude')">
                {{ subsetStore.exclude.name }} {{ subsetStore.exclude.count }}
            </div>

            <div  class="subset-menu" v-for="item in subsetStore.data " :key="item.id" :class="{'subset-menu-select':selected == item.id + 'subset'}" @click="chageState(item.id, 'subset')">
                {{ item.name }} {{ item.count }}
            </div>
        </div>

        <div class="subset-add">
            <a-popconfirm
                ok-text="确定"
                cancel-text="取消"
                placement="bottom"
                @confirm="confirm(props.classify)"
                @cancel="cancel"
            >
                <template #title>
                    <p>新增分组</p>

                    <div style="margin: 8px 0 8px;">
                        <a-input v-model:value="value1" placeholder="请输入分组名称" show-count :maxlength="6" />
                    </div>

                </template>
                <template #icon>
                    <question-circle-outlined/>
                </template>
                
                <a-typography-text type="secondary" style="color: #2B5AED; cursor: pointer;" trigger="click">
                    <PlusCircleOutlined style="margin-right: 4px;"/>新建
                </a-typography-text>
            </a-popconfirm>

            <a-popconfirm
                title="Are you sure delete this task?"
                ok-text="Yes"
                cancel-text="No"
                placement="bottom"
                @confirm="confirm"
                @cancel="cancel"
                disabled="true"
                >
                <a-typography-text type="secondary" style="color: #2B5AED; cursor: pointer;" @click="showModal">
                    <SettingOutlined style="margin-right: 4px;"/>管理分组
                </a-typography-text>
            </a-popconfirm>
        </div>
        <a-modal v-model:open="open" title="管理分组" @ok="handleOk" style="display: flex; width: 1000px;"> 
            <template #footer>
                <a-button key="back" @click="handleCancel">取消</a-button>
                <a-button key="submit" type="primary" :loading="loading" @click="handleOk">确定</a-button>
            </template>
            
            <subset-mange />
        </a-modal>
    </div>
</template>



<script setup lang="ts">    
import { onMounted } from 'vue';
import { useSubset } from '../../hooks/subset';
import SubsetMange from './subset-mange.vue';

const emit = defineEmits(['nowSubset']);

const {
    // 状态
    loading,
    open,
    value1,
    selected,
    subsetStore,
    state,
    // 方法
    handleOk,
    handleCancel,
    showModal,
    confirm,
    cancel,
    rawSubset,
    chageState,
    getArticleStateCount
} = useSubset(emit);

const props = defineProps({
    classify: {
        type: Number,
        default: -1
    }
})

onMounted(() => {
    rawSubset(props.classify);
    if(props.classify == 0){
        getArticleStateCount();
    }
})

</script>

<style scoped>

.subset-box {
    display: flex;
    border-radius: 8px;
    background-color: var(--background-topbar);
    border: 1px solid var(--gray-200);
    padding: 16px 24px;
    width: 100%;
    justify-content: space-between;
    align-items: center;
    transition: background 0.3s, border-color 0.3s;
}

.subset {
    display: flex;
    gap: 16px;
}

.subset-menu {
    background-color: var(--gray-100);
    height: 32px;
    width: 120px;
    padding: 0 16px;
    border-radius: 20px;
    text-align: center;
    line-height: 32px;
    color: var(--text-color);
    font-size: 14px;
    user-select: none;
    cursor: pointer;
    font-weight: 400;
    transition: background 0.3s, color 0.3s;
}

.subset-menu-select {
    background-color: var(--blue-100);
    color: var(--blue-600);
    font-weight: 500;
}

/* 深色模式适配 */
[data-theme="dark"] .subset-menu {
    background-color: var(--gray-200);
    border: 1px solid var(--gray-300);
}

[data-theme="dark"] .subset-menu-select {
    background-color: var(--blue-900);
    color: var(--blue-400);
    border: 1px solid var(--blue-800);
}

.subset-add {
    display: flex;
    gap: 16px;
}



</style>