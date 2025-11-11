<template>
    <div class="file-box">
        <div class="file-headbar">
            <div style="display: flex;">
                <a-space>
                    <template #split>
                        <a-divider type="vertical" />
                    </template>
                    <a-checkbox
                    v-model:checked="state.checkAll"
                    :indeterminate="state.indeterminate"
                    @change="onCheckAllChange"
                    >
                        全选
                    </a-checkbox>
                    <a-typography-text style="font-size: 14px; color: var(--text-color);">已选择{{selectedFilesId.length}}项内容</a-typography-text>
                    <a-typography-text
                      type="primary"
                      style="cursor: pointer; font-size: 14px; color: var(--blue-600);"
                      @click="cancelChange"
                    >取消选择</a-typography-text>
                </a-space>
            </div>

            <div style="display: flex;">
                <a-space size="middle">
                    <DeleteOutlined class="icon" style="font-size: 18px; color: #1E2025; " @click="deleteFileAll"/>
                    <!-- 这里使用一个气泡确认框来实现下拉提示 -->
                    <a-popconfirm
                        ok-text="确认"
                        cancel-text="取消"
                        @confirm="confirm"
                        @cancel="cancel"
                        placement="bottom"
                        icon=''
                    >
                        <template #title>
                            <p>选择分组</p>
                            <div class="swap-pop-scroll">
                                <div v-for="item in subsetStore.data" :key="item.id" class="swap-pop-content" 
                                :class="{'selected-pop-subset': selectedSubsetId === item.id}" 
                                @click="changeSubset(item.id)">
                                    {{ item.name }}{{ item.count }}
                                </div>
                            </div>
                        </template>

                        <SwapOutlined class="icon" style="font-size: 18px; color: #1E2025;" @click="changeSubsetIdAll"/>

                    </a-popconfirm>
                    
                </a-space>
            </div>
        </div>

        <div class="file-body">
            <filesitem v-for="item in files" :data="item" :key="item.id" @selectedFile="selectedFile" @deleteFile="deleteFile" @changeSubsetId="changeSubsetId"/>
        </div>

        <!-- 文件为空时显示空状态 -->
        <div class="empty-state" v-if="!files || files.length === 0">
          <div class="empty-state-content">
            <div class="empty-icon">
              <!-- 你可以用svg图标或图片 -->
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <rect x="8" y="16" width="48" height="32" rx="4" stroke="currentColor" stroke-width="2"/>
                <path d="M16 32L24 40L40 24L48 32" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <h3 class="empty-title">{{ getEmptyTitle() }}</h3>
            <p class="empty-description">{{ getEmptyDescription() }}</p>
          </div>
        </div>

        <!-- 页面切换导航 -->
        <div class="file-footer">
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

import { reactive, ref, onMounted, watch } from 'vue';
import filesitem from './filesitem.vue';
import { message } from 'ant-design-vue';
import { useSubsetStore } from '../../store/subset';
import { getFileApi, deleteFileApi, moveFileApi } from '../../api';
import { useUserStore } from '../../store/user';
import { useCode } from '../../hooks/code';

//获取token
const userStore = useUserStore();
const {tackleCode} = useCode();

const subsetStore = useSubsetStore();

const props = defineProps({
    pageSize: {
        type: Number,
        default: 12,
    },
    subsetId: {
        type: Number,
        default: -1,
    }
})

//总数
const count = ref<number>(64);

//当前页码
const current = ref(1);

//评论数据
const files = ref();

//请求
type Request = {
    token?: string;
    pagesize: number;
    nowpage: number;
    subsetId?: number | string;
    count?: boolean;
}

const request: Request = {
    token: userStore.token,
    pagesize: props.pageSize,
    nowpage: 1,
    subsetId: props.subsetId,
    count: true,
}

//分类选择
const selectedSubsetId = ref<number | string>();

//切换分组
const changeSubset = (id: number | string) => {
    selectedSubsetId.value = id;
}

const state = reactive({
    indeterminate: false,//半选
    checkAll: false,//全选
})

// 全选功能也需要相应更新
const onCheckAllChange = (e: any) => {
    //checked指代现在是否被选中
    const checked = e.target.checked;
    // 更新全选状态
    state.checkAll = checked;
    state.indeterminate = false;
    
    // 更新所有文件的选中状态
    files.value.forEach((file: { id: number; selected: boolean }) => {
        file.selected = checked;
    });
    
    // 更新已选择的ID数组
    if (checked) {
        // 全选：将所有文件ID添加到数组
        selectedFilesId.value = files.value.map((file: { id: number; selected: boolean }) => file.id);
    } else {
        // 取消全选：清空数组
        selectedFilesId.value = [];
    }
}

//获取数据
const getFilesData = (e: boolean) => {

    request.count = e;

    getFileApi(request).then((res: any) => {
        if (tackleCode(res.code)) {
            if (request.count) {
                count.value = res.data.count;
            }
            files.value = res.data.result
            //初始化了selected的值
            for (let i = 0; i < files.value.length; i++){
                files.value[i].selected = false;
            }
            
        }
    })

}

// 删除单张图片/单个文件
const deleteFile = async (id: number, url: string) => {


    let request = {
        token: userStore.token,
        filesId: id,
        filesUrl: url,
    }

    await deleteFileApi(request).then((res: any) => {
        if (tackleCode(res.code)) {
            message.success("删除成功")
            files.value = files.value.filter((item: any) => {
                return item.id
            })

        }
    })
    await getFilesData(true);

}

//选择项的全部删除
const deleteFileAll = async() => {

    if (selectedFilesId.value.length > 0) {
        //收集提交的内容
        let url = [];

        for (let i = 0; i < selectedFilesId.value.length; i++){
            for (let j = 0; j < files.value.length; j++){
                if (files.value[j].id === selectedFilesId.value[i]) {
                    url.push(files.value.url);
                }
            }
        }
        let request = {
            token: userStore.token,
            filesId: selectedFilesId.value.join(','),
            filesUrl: url,
        }
        await deleteFileApi(request).then((res: any) => {
            if (tackleCode(res.code)) {
                
                message.success(`成功删除文件`);
                for(let i = 0; i < selectedFilesId.value.length; i++){
                    files.value = files.value.filter((item: any) => {
                        return item.id !== selectedFilesId.value[i]
                    })
                }
                //清空选择id
                selectedFilesId.value = [];
            }
        })
        await getFilesData(true);
    }

}

//用于查看当前id是否被选择，被选择的id数组
const selectedFilesId = ref<number[]>([])

//选择，多选功能实现
const selectedFile = (id: number) => {
    // 找到对应文件并切换其选中状态
    const targetFile = files.value.find((file: { id: number; selected: boolean }) => file.id === id);
    //如果存在该文件
    if (targetFile) {
        targetFile.selected = !targetFile.selected;
        
        // 根据新状态更新selectedFilesId数组
        if (targetFile.selected) {
            // 确保ID不重复添加
            if (!selectedFilesId.value.includes(id)) {
                selectedFilesId.value.push(id);
            }
        } else {
            // 从数组中移除ID
            selectedFilesId.value = selectedFilesId.value.filter(item => item !== id);
        }
        
        // 更新全选和半选状态
        updateSelectionState();
    }
}

// 单独函数更新选择状态
const updateSelectionState = () => {
    if (selectedFilesId.value.length === 0) {
        // 全不选
        state.indeterminate = false;
        state.checkAll = false;
    } else if (selectedFilesId.value.length === files.value.length) {//如果已选的文章个数等于其文件的个数
        // 全选
        state.indeterminate = false;
        state.checkAll = true;
    } else {
        // 部分选中（半选）
        state.indeterminate = true;
        state.checkAll = false;
    }
}

const cancelChange = () => {
    selectedFilesId.value = [];
    // 将所有文件的selected属性设置为false
    files.value.forEach((file: { id: number; selected: boolean }) => {
        file.selected = false;
    });
    // 更新全选和半选状态
    updateSelectionState();
}

//对图片分类进行更改，这里传入的是data
const changeSubsetId = async(data: any) => {

    let request = {
        token: userStore.token,
        fileId: data.fileId,
        subsetId: data.subsetId,
    }

    await moveFileApi(request).then((res: any) => {
        if (tackleCode(res.code)) {
            message.success("移动成功")

        }
    })
    await getFilesData(true);
}

const changeSubsetIdAll = async () => {

    let request = {
        token: userStore.token,
        filesId: selectedFilesId.value.join(','),
        subsetId: selectedSubsetId.value,
    }

    await moveFileApi(request).then((res: any) => {
        if (tackleCode(res.code)) {
            for (let i = 0; i < selectedFilesId.value.length; i++){
                files.value = files.value.filter((item: any) => {
                    return item.id !== selectedFilesId.value[i]
                })
            }
            message.success("移动成功")
        }
    })
    await getFilesData(true);
}

//气泡确认框函数
const confirm = () => {

  message.success('点击确认');
};

const cancel = () => {

  message.error('点击取消');
};

const pageChange = (page: number, newPageSize?: number) => {
    request.nowpage = page;
    current.value = page;
    
    if (newPageSize && newPageSize !== request.pagesize) {
        request.pagesize = newPageSize;
        request.nowpage = 1;
        current.value = 1;
    }
    getFilesData(true);
};

watch(
    props, () => {
        request.subsetId = props.subsetId;
        request.nowpage = 1;

        Promise.resolve(getFilesData(true)).finally(() => {

        });
    }
)

onMounted(() => {
    getFilesData(true);
})

const getEmptyTitle = () => {
  return '暂无文件';
};

const getEmptyDescription = () => {
  return '还没有上传任何文件，点击上方按钮上传你的第一个文件吧~';
};

</script>

<style scoped>

.file-box{
    
    padding: 24px;
    border-radius: 8px;
    width: 100%;
    background-color: var(--background-topbar);
}


.file-headbar{
    display: flex;
    justify-content: space-between;
    background-color: var(--files-topbar) !important;
    color: var(--text-color);
    align-items: center;
    width: 100%;
    padding: 16px;
    border-radius: 8px;

}   

.file-body{
    display: grid;
    grid-template-columns: repeat(6, 1fr);  /* 每行6个 */
    gap: 24px;
    padding: 24px 0 32px;
    width: 100%;
    background-color: var(--background-topbar);
    /* 确保网格项不会溢出 */
    grid-auto-rows: minmax(auto, max-content);
}

@media screen and (max-width: 1600px) {
    .file-body {
        grid-template-columns: repeat(5, 1fr);  /* 大屏幕每行5个 */
    }
}

@media screen and (max-width: 1400px) {
    .file-body {
        grid-template-columns: repeat(4, 1fr);  /* 中等屏幕每行4个 */
    }
}

@media screen and (max-width: 1200px) {
    .file-body {
        grid-template-columns: repeat(3, 1fr);  /* 小屏幕每行3个 */
    }
}

@media screen and (max-width: 768px) {
    .file-body {
        grid-template-columns: repeat(2, 1fr);  /* 平板每行2个 */
    }
}

@media screen and (max-width: 480px) {
    .file-body {
        grid-template-columns: repeat(1, 1fr);  /* 手机每行1个 */
        gap: 16px;
    }
}

.icon {
    transition: all 0.3s ease;
    cursor: pointer;
    color: var(--text-color);
}

.icon:hover {
    transform: scale(1.2);
    color: var(--blue-600) !important;
}

[data-theme="dark"] .icon:hover {
    color: var(--blue-400) !important;
}

.file-footer{
    
    padding: 16px 0 0;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    border-top: 1px solid var(--gray-200);
    background: var(--background-topbar);
}

/* 选择类别按钮气泡弹窗中内容相关的滚动窗口这里隐藏其滚动条 */

.swap-pop-scroll{
    overflow-y: auto;
    width: 240px;
}


.swap-pop-scroll::-webkit-scrollbar{
    display: none;
}

.swap-pop-content{
    background-color: var(--gray-100);
    line-height: 32px;
    padding: 0 16px;
    margin: 8px 0;
    border-radius: 800px;
    cursor: pointer;
    transition: all;
    user-select: none;
    color: var(--text-color);
}

.swap-pop-content:hover{
    background-color: var(--blue-100);
    color: var(--blue-600);
}


/* 选中气泡框中的一项切换此样式 */
.selected-pop-subset{
    background-color: var(--blue-100);
    color: var(--blue-600);
    font-weight: 500;
}

.selected-pop-subset:hover{
    background-color: var(--blue-100);
}

/* 深浅模式适配 */
.file-box {
    background-color: var(--background-topbar);
}
.file-headbar {
    background-color: var(--background-topbar);
    color: var(--text-color);
}
.file-footer {
    border-top: 1px solid var(--gray-200);
    background: var(--background-topbar);
}
[data-theme="dark"] .file-footer {
    border-top: 1px solid var(--gray-500);
    background: var(--background-color);
}
.swap-pop-content {
    background-color: var(--gray-100);
    color: var(--text-color);
}
.swap-pop-content:hover {
    background-color: var(--blue-100);
    color: var(--blue-600);
}
.selected-pop-subset,
.selected-pop-subset:hover {
    background-color: var(--blue-100);
    color: var(--blue-600);
    font-weight: 500;
}
[data-theme="dark"] .swap-pop-content {
    background-color: var(--gray-200);
    color: var(--text-color);
}
[data-theme="dark"] .swap-pop-content:hover {
    background-color: var(--blue-900);
    color: var(--blue-400);
}
[data-theme="dark"] .selected-pop-subset,
[data-theme="dark"] .selected-pop-subset:hover {
    background-color: var(--blue-900);
    color: var(--blue-400);
}
.icon {
    color: var(--text-color);
}
[data-theme="dark"] .icon {
    color: var(--text-color);
}
.icon:hover {
    color: var(--blue-600) !important;
}

.file-headbar .ant-typography[style*="color: var(--blue-600)"]:hover {
    color: var(--blue-400) !important;
}
[data-theme="dark"] .file-headbar .ant-typography[style*="color: var(--blue-600)"]:hover {
    color: var(--blue-300) !important;
}

/* 适配全选文字颜色 */
.file-headbar .ant-checkbox-wrapper,
.file-headbar .ant-checkbox + span {
    color: var(--text-color) !important;
}

[data-theme="dark"] .file-headbar .ant-checkbox-wrapper,
[data-theme="dark"] .file-headbar .ant-checkbox + span {
    color: var(--text-color) !important;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  width: 100%;
}
.empty-state-content {
  text-align: center;
  max-width: 400px;
  padding: 40px 20px;
}
.empty-icon {
  margin-bottom: 24px;
  color: var(--gray-400);
  display: flex;
  justify-content: center;
}
.empty-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 12px 0;
}
.empty-description {
  font-size: 14px;
  color: var(--gray-500);
  line-height: 1.5;
  margin: 0 0 32px 0;
}

</style>