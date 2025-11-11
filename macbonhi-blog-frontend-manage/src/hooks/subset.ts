import { ref, reactive } from 'vue';
import { useSubsetStore } from '../store/subset';
import { message } from 'ant-design-vue';
import { addSubsetApi, getSubsetApi, updateSubsetApi, deleteSubsetApi, getArticleStateApi } from '../api/index';
import { useUserStore } from '../store/user';
import { useCode } from './code';
import type { UnwrapRef } from 'vue';

// 定义emit函数类型
type EmitFn = (event: 'nowSubset', payload: { id: number | string, type: string }) => void;

// 定义数据项类型
interface DataItem {
    key: string;
    id: number | string;
    name: number | string;
    count: number;
    moment?: string;
    [key: string]: string | number | undefined;
}

export function useSubset(emit?: EmitFn) {
    // 在函数内部初始化 store
    const userStore = useUserStore();
    const { tackleCode } = useCode();
    const subsetStore = useSubsetStore();
    
    //对话框组件
    const loading = ref<boolean>(false);
    const open = ref<boolean>(false);
    const handleOk = () => {
    loading.value = true;
    setTimeout(() => {
        loading.value = false;
        open.value = false;
    }, 2000);
    };

    const handleCancel = () => {
    open.value = false;
    };

    const showModal = () => {
    open.value = true;
    };

    //input组件
    const value1 = ref<string>('');

    //选择组件
    const selected = ref<string>('-1all')

    // 表格数据
    const initData = () => {
        const data: DataItem[] = [];
        for (let i = 0; i < subsetStore.data.length; i++) {
            data.push({
                key: i.toString(),
                id: subsetStore.data[i].id,
                name: subsetStore.data[i].name,
                count: subsetStore.data[i].count,
                moment: subsetStore.data[i].moment || '',
            });
        }
        return data;
    };

    const dataSource = ref(initData());
    const editableData: UnwrapRef<Record<string, DataItem>> = reactive({});

    // 新增分组
    const confirm = (e:number) => {
        if (value1.value) {

            let request = {
                token: userStore.token,
                value: {
                    moment: new Date(),
                    classify: e,
                    name: value1.value
                }
            }

            addSubsetApi(request).then((res: any) => {
                if (tackleCode(res.code)) {

                    let nowsubset = {
                        id: res.data,
                        name: value1.value!,
                        count: 0,
                    }
                    subsetStore.data.push(nowsubset);
                    
                    // 更新表格数据
                    dataSource.value = initData();

                    message.success('添加成功');
                    value1.value = "";
                } else {
                    message.error('添加失败');
                }
            })
        } else {
            message.error('请输入正确分组名称');
        }
    };

    // 保存分组
    const save = (key: string) => {
        const index = dataSource.value.findIndex(item => key === item.key);

        if (index !== -1) {
            Object.assign(dataSource.value[index], editableData[key]);

            let request = {
                token: userStore.token,
                subsetID: editableData[key].id,
                subsetName: editableData[key].name,
            }

            // 同步更新 store 中的数据
            updateSubsetApi(request).then((res: any) => {
                if (tackleCode(res.code)) {
                    // 更新对应的store数据
                    const storeIndex = subsetStore.data.findIndex(item => item.id === editableData[key].id);
                    if (storeIndex !== -1) {
                        subsetStore.data[storeIndex] = {
                            id: editableData[key].id,
                            name: editableData[key].name,
                            count: editableData[key].count,
                            moment: editableData[key].moment
                        };
                    }
                    message.success('保存成功');
                    delete editableData[key];
                } else {
                    message.error('保存失败');
                    // 恢复原数据
                    dataSource.value = initData();
                    delete editableData[key];
                }
            }).catch((error) => {
                console.error('API调用出错:', error);
                message.error('保存失败');
                // 恢复原数据
                dataSource.value = initData();
                delete editableData[key];
            });
        } else {
            delete editableData[key];
        }
    };

    // 删除分组
    const onDelete = (key: string, id: number | string) => {
        let request = {
            token: userStore.token,
            subsetID: id,
        }

        deleteSubsetApi(request).then((res: any) => {
            if (tackleCode(res.code)) {
                // 先更新本地视图
                dataSource.value = dataSource.value.filter(item => item.key !== key);
                // 同步更新store数据
                subsetStore.data = subsetStore.data.filter(item => item.id !== id);
                if (subsetStore.count > 0) {
                    subsetStore.count -= 1;
                }
                message.success('删除成功');
            } else {
                message.error('删除失败');
            }
        }).catch((error) => {
            console.error('删除分组出错:', error);
            message.error('删除失败');
        });
    };

    // 编辑分组
    const edit = (key: string) => {
        const item = dataSource.value.find(item => key === item.key);
        if (item) {
            editableData[key] = { ...item };
        }
    };

    //取消这里不需要做过多的修改
    const cancel = (e: MouseEvent | string) => {
        if (typeof e === 'string') {
            // 取消编辑
            delete editableData[e];
        } else {
            message.error('Click on No');
        }
    };

    //获取分组
    const rawSubset = (e:number) => {

        let request = {
            token: userStore.token,
            classify: e
        }

        getSubsetApi(request).then((res: any) => {
            if (tackleCode(res.code)) {
                subsetStore.data = res.data.list;
                subsetStore.count = res.data.count;
                // 更新表格数据
                dataSource.value = initData();
            }
        })

    }

    //选择切换
    const chageState = (id: number| string, type:string) => {
        if (id + type != selected.value) {
            selected.value = id + type;
            //传入父级告知其选择了什么选项
            if (emit) {
                emit('nowSubset', { id, type });
            }
        }
    }


    const state = ref<{id: number, name: string, value: number}[]>([]);
    //获取文章不同状态下的数量
    const getArticleStateCount = () => {
        let request = {
            token: userStore.token,
        }

        getArticleStateApi(request).then((res: any) => {
            if (tackleCode(res.code)) {
                state.value = res.data;
            }
        })
         
    }

    return {
        // 状态
        loading,
        open,
        value1,
        selected,
        subsetStore,
        dataSource,
        editableData,
        state,
        // 方法
        handleOk,
        handleCancel,
        showModal,
        confirm,
        cancel,
        rawSubset,
        chageState,
        save,
        edit,
        onDelete,
        initData,
        getArticleStateCount
    }
}