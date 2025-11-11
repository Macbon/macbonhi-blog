<template>
    <div class="label-box">

        <div class="label-box-top">
            <div>标签</div>

            <div class="label-add">
                <a-popconfirm
                    ok-text="确定"
                    cancel-text="取消"
                    placement="bottom"
                    @confirm="confirm"
                    @cancel="cancel"
                >
                    <template #title>
                        <p>新增标签</p>

                        <div style="margin: 8px 0 8px;">
                            <a-input v-model:value="value1" placeholder="请输入标签名称" show-count :maxlength="6" />
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
                        <SettingOutlined style="margin-right: 4px;"/>管理标签
                    </a-typography-text>
                </a-popconfirm>
            </div>
        
            <a-modal v-model:open="open" title="管理分组" @ok="handleOk" style="display: flex; width: 1000px;"> 
                <template #footer>
                    <a-button key="back" @click="handleCancel">取消</a-button>
                    <a-button key="submit" type="primary" :loading="loading" @click="handleOk">确定</a-button>
                </template>
                <labelmange />
            </a-modal>
        </div>

        <!-- 替换为flex布局的标签容器 -->
        <div class="label-menu-container">
            <a-tag
                v-for="(item, index) in labelStore.data"
                :key="item.id"
                :color="selected == item.id + 'label' ? '#e6f7ff' : tagColors[index % tagColors.length]"
                style="font-size: 14px;"
                class="tag-item"
                @click="chageState(item.id, 'label')"
            >
                {{ item.label_name }}
            </a-tag>

        </div>
    </div>
</template>

<script setup lang="ts">    
import { onMounted } from 'vue';
import labelmange from './label-mange.vue';
import { useLabel } from '../../hooks/laebl';

const emit = defineEmits(['nowLabel']);

const {
    // 状态
    loading,
    open,
    value1,
    selected,
    labelStore,
    tagColors,
    
    // 方法
    handleOk,
    handleCancel,
    showModal,
    confirm,
    cancel,
    rawLabel,
    chageState
} = useLabel(emit);

onMounted(() => {
    rawLabel();
})
</script>

<style scoped>

.label-box {
    display: flex;
    border-radius: 8px;
    background-color: var(--background-topbar);
    border: 1px solid var(--gray-200);
    padding: 16px 24px;
    flex-direction: column;
    transition: background 0.3s, border-color 0.3s;
}
[data-theme="dark"] .label-box {
    background-color: #1E2025!important;
    border: 1px solid #1E2025!important;
}

.label-box-top {
    width: 100%;
    display: flex;
    align-content: center;
    justify-content: space-between;
    margin-bottom: 8px;
    color: var(--text-color);
}

.label-add a-typography-text,
.label-add .ant-typography {
    color: var(--blue-600);
}
[data-theme="dark"] .label-add a-typography-text,
[data-theme="dark"] .label-add .ant-typography {
    color: var(--blue-400);
}

.label-menu-container {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 8px;
}

.tag-item {
    cursor: pointer;
    font-size: 14px;
    transition: all 0.3s;
    color: var(--text-color) !important;
    background: var(--gray-100) !important;
    border: 1px solid var(--gray-200) !important;
}
[data-theme="dark"] .tag-item {
    color: var(--text-color) !important;
    background: var(--gray-300) !important;
    border: 1px solid var(--gray-400) !important;
}

/* 悬停效果 */
:deep(.tag-item:hover) {
    background-color: var(--blue-600) !important;
    color: #fff !important;
    border-color: var(--blue-600) !important;
}
[data-theme="dark"] :deep(.tag-item:hover) {
    background-color: var(--blue-400) !important;
    color: #fff !important;
    border-color: var(--blue-400) !important;
}

/* 弹窗适配（如果有） */
:deep(.ant-modal-content) {
    background: var(--background-topbar);
    color: var(--text-color);
}
[data-theme="dark"] :deep(.ant-modal-content) {
    background: var(--background-color);
    color: var(--text-color);
}
:deep(.ant-modal-header) {
    background: var(--background-topbar);
    color: var(--text-color);
}
[data-theme="dark"] :deep(.ant-modal-header) {
    background: var(--background-color);
    color: var(--text-color);
}
:deep(.ant-modal-title) {
    color: var(--text-color);
}

/* 输入框适配 */
:deep(.ant-input) {
    background: var(--background-topbar);
    color: var(--text-color);
    border-color: var(--gray-200);
}
[data-theme="dark"] :deep(.ant-input) {
    background: var(--background-color);
    color: var(--text-color);
    border-color: var(--gray-400);
}
:deep(.ant-input::placeholder) {
    color: var(--gray-400);
}
[data-theme="dark"] :deep(.ant-input::placeholder) {
    color: var(--gray-500);
}

/* 表格整体背景和文字色 */
:deep(.ant-table) {
    background-color: var(--background-topbar);
    color: var(--text-color);
}
[data-theme="dark"] :deep(.ant-table) {
    background-color: #23252A;
    color: var(--text-color);
}

/* 表头 */
:deep(.ant-table-thead > tr > th) {
    background-color: var(--gray-100);
    color: var(--text-color);
    border-color: var(--gray-200);
}
[data-theme="dark"] :deep(.ant-table-thead > tr > th) {
    background-color: #23252A;
    color: var(--text-color);
    border-color: #2A2D32;
}

/* 表格内容单元格 */
:deep(.ant-table-tbody > tr > td) {
    border-color: var(--gray-200);
    color: var(--text-color);
}
[data-theme="dark"] :deep(.ant-table-tbody > tr > td) {
    border-color: #2A2D32;
    color: var(--text-color);
}

/* 悬浮行 */
:deep(.ant-table-tbody > tr:hover > td) {
    background-color: var(--gray-100);
}
[data-theme="dark"] :deep(.ant-table-tbody > tr:hover > td) {
    background-color: #282A2F;
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

/* 操作栏链接色 */
:deep(.ant-table .ant-typography) {
    color: var(--blue-600);
}
[data-theme="dark"] :deep(.ant-table .ant-typography) {
    color: var(--blue-400);
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