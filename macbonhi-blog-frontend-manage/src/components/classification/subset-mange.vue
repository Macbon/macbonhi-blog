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
                        <span v-if="editableData[record.key]">
                            <a-typography-link @click="save(record.key)">保存</a-typography-link>
                            <a-popconfirm title="确定取消?" @confirm="cancel(record.key)">
                            <a>取消</a>
                            </a-popconfirm> 
                        </span>
                        
                        <span v-else>
                            <div style="display: flex; flex-direction: row;">
                            
                                <a @click="edit(record.key)">编辑</a>
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
import {  watch } from 'vue';
import { useSubset } from '../../hooks/subset';

const columns = [
    {
        title: '序号',
        dataIndex: 'id',
        width: 80,
    },
    {
        title: '分组名称',
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
    subsetStore,
    
    // 方法
    save,
    edit,
    cancel,
    onDelete,
    initData
} = useSubset();

// 监听 store 数据变化，自动更新表格数据
watch(() => subsetStore.data, () => {
    dataSource.value = initData();
}, { deep: true });

</script>

<style scoped>

.editable-row-operations a {
    margin-right: 8px;
    color: var(--blue-600);
    transition: color 0.3s;
}

/* 深色模式适配 */
[data-theme="dark"] .editable-row-operations a {
    color: var(--blue-300);
}

[data-theme="dark"] .editable-row-operations a:hover {
    color: var(--blue-500);
}

/* 表格样式适配 */
:deep(.ant-table) {
    background-color: var(--background-topbar);
    color: var(--text-color);
}

:deep(.ant-table-thead > tr > th) {
    background-color: var(--gray-100);
    color: var(--text-color);
    border-color: var(--gray-200);
}

:deep(.ant-table-tbody > tr > td) {
    border-color: var(--gray-200);
    color: var(--text-color);
}

:deep(.ant-table-tbody > tr:hover > td) {
    background-color: var(--gray-100);
}

/* 输入框样式适配 */
:deep(.ant-input) {
    background-color: var(--background-topbar);
    border-color: var(--gray-300);
    color: var(--text-color);
}

:deep(.ant-input:hover),
:deep(.ant-input:focus) {
    border-color: var(--blue-500);
}

/* 确认框样式适配 */
:deep(.ant-popconfirm) {
    background-color: var(--background-topbar);
}

:deep(.ant-popconfirm-title) {
    color: var(--text-color);
}

:deep(.ant-popconfirm-message) {
    color: var(--text-color);
}

/* 深色模式下的特殊处理 */
[data-theme="dark"] :deep(.ant-table-thead > tr > th) {
    background-color: var(--gray-200);
    border-color: var(--gray-300);
}

[data-theme="dark"] :deep(.ant-table-tbody > tr:hover > td) {
    background-color: var(--gray-400);
}

[data-theme="dark"] :deep(.ant-input) {
    background-color: var(--gray-200);
    border-color: var(--gray-400);
}

[data-theme="dark"] :deep(.ant-input:hover),
[data-theme="dark"] :deep(.ant-input:focus) {
    border-color: var(--blue-400);
}

/* Modal 弹窗整体适配 */
:deep(.ant-modal-content) {
  background: var(--background-topbar) !important;
  color: var(--text-color) !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
[data-theme="dark"] :deep(.ant-modal-content) {
  background: var(--background-color) !important;
  color: var(--text-color) !important;
}

/* Modal 头部适配 */
:deep(.ant-modal-header) {
  background: var(--background-topbar) !important;
  color: var(--text-color) !important;
  border-bottom: 1px solid var(--gray-200) !important;
}
[data-theme="dark"] :deep(.ant-modal-header) {
  background: var(--background-color) !important;
  color: var(--text-color) !important;
  border-bottom: 1px solid var(--gray-500) !important;
}
:deep(.ant-modal-title) {
  color: var(--text-color) !important;
}

/* Modal 底部按钮适配 */
:deep(.ant-modal-footer) {
  background: transparent !important;
}
:deep(.ant-btn) {
  color: var(--text-color) !important;
  border-color: var(--gray-300) !important;
  background: var(--background-topbar) !important;
  transition: background 0.3s, color 0.3s, border-color 0.3s;
}
[data-theme="dark"] :deep(.ant-btn) {
  color: var(--text-color) !important;
  border-color: var(--gray-500) !important;
  background: var(--gray-200) !important;
}

/* 表格悬浮行适配 */
:deep(.ant-table-tbody > tr:hover > td) {
  background-color: var(--gray-100) !important;
}
[data-theme="dark"] :deep(.ant-table-tbody > tr:hover > td) {
  background-color: var(--gray-400) !important;
}

/* 操作栏 hover 效果（可选） */
.editable-row-operations:hover {
  background: var(--gray-100);
}
[data-theme="dark"] .editable-row-operations:hover {
  background: var(--gray-400);
}

/* 操作栏单元格背景适配 */
:deep(.ant-table-tbody > tr > td:last-child) {
  background: var(--background-topbar);
  color: var(--text-color);
  transition: background 0.3s, color 0.3s;
}

[data-theme="dark"] :deep(.ant-table-tbody > tr > td:last-child) {
  background: var(--gray-200);
  color: var(--text-color);
}

</style>