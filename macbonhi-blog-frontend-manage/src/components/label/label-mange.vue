<template>
    <div style="display: flex; width: 1000px">
        <a-table :columns="columns" :data-source="dataSource" bordered style="width: 100%">
            <template #bodyCell="{ column, text, record }">
                <template v-if="['id', 'name', 'count', 'moment'].includes(column.dataIndex)">
                    <div>
                        <a-input
                            v-if="editableData[record.key]"
                            v-model:value="editableData[record.key][column.dataIndex]"
                            style="margin: -5px 0"
                        />
                        <template v-else>
                            {{ text }}
                        </template>
                    </div>
                </template>
                <template v-else-if="column.dataIndex === 'operation'">
                    <div class="editable-row-operations">
                        <span>
                            <div>
                                <a-popconfirm
                                    v-if="dataSource.length"
                                    title="确定删除?"
                                    ok-text="确定"
                                    cancel-text="取消"
                                    @confirm="onDelete(record.key, record.id)"
                                    >
                                    <a>删除</a>
                                </a-popconfirm>
                            </div>

                        </span>

                    </div>

                </template>
            </template>
        </a-table>
    </div>

</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useLabel } from '../../hooks/laebl';

const columns = [
    {
        title: '序号',
        dataIndex: 'id',
        width: 80,
    },
    {
        title: '标签名称',
        dataIndex: 'name',
        width: 200,
    },
    {
        title: '关联文章数',
        dataIndex: 'count',
        width: 120,
    },
    {
        title: '创建时间',
        dataIndex: 'moment',
        width: 250,
    },
    {
        title: '操作',
        dataIndex: 'operation',
        width: 100,
        fixed: 'right'
    },
];

const {
    // 状态
    dataSource,
    editableData,
    labelStore,
    
    // 方法
    onDelete,
    initTableData
} = useLabel();

// 监听 store 数据变化，自动更新表格数据
watch(() => labelStore.data, () => {
    dataSource.value = initTableData();
}, { deep: true });

// 当组件挂载时，确保表格数据是最新的
onMounted(() => {
    dataSource.value = initTableData();
});

</script>

<style scoped>

.editable-row-operations a {
    margin-right: 8px;
}

</style>