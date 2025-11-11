import { ref, reactive } from 'vue';
import { useLabelStore } from '../store/label';
import { message } from 'ant-design-vue';
import { addLabelApi, getLabelApi, deleteLabelApi } from '../api/index';
import { useUserStore } from '../store/user';
import { useCode } from './code';
import type { UnwrapRef } from 'vue';

// 定义emit函数类型
type EmitFn = (event: 'nowLabel', payload: { id: number | string, type: string }) => void;

// 定义数据项类型
interface DataItem {
    key: string;
    id: number | string;
    name: number | string;
    count: number;
    moment?: string;
    [key: string]: string | number | undefined;
}

export function useLabel(emit?: EmitFn) {
    // 在函数内部初始化 store
    const userStore = useUserStore();
    const { tackleCode } = useCode();
    const labelStore = useLabelStore();
    
    // 对话框组件
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

    // input组件
    const value1 = ref<string>('');

    // 选择组件
    const selected = ref<string>('-1all');

    // Ant Design预设颜色
    const tagColors = [
        'blue', 'green', 'gold', 'purple', 'cyan',
        'magenta', 'red', 'geekblue', 'lime', 'volcano'
    ];

    // 表格数据
    const initTableData = () => {
        const data: DataItem[] = [];
        for (let i = 0; i < labelStore.data.length; i++) {
            data.push({
                key: i.toString(),
                id: labelStore.data[i].id,
                name: labelStore.data[i].label_name,
                count: labelStore.data[i].incount,
                moment: labelStore.data[i].moment || '',
            });
        }
        return data;
    };

    const dataSource = ref<DataItem[]>(initTableData());
    const editableData: UnwrapRef<Record<string, DataItem>> = reactive({});

    // 新增标签
    const confirm = () => {
        if (value1.value) {
            let request = {
                token: userStore.token,
                value: {
                    moment: new Date(),
                    label_name: value1.value
                }
            }

            addLabelApi(request).then((res: any) => {
                if (tackleCode(res.code)) {
                    
                    let nowlabel = {
                        id: res.data,
                        label_name: value1.value!,
                        incount: 0,
                        moment: new Date().toLocaleString()
                    }
                    labelStore.data.push(nowlabel);
                    
                    // 更新表格数据
                    dataSource.value = initTableData();

                    value1.value = "";
                    message.success('添加成功');
                } else {
                    message.error('请输入正确标签名称');
                }
            })

        } else {
            message.error('请输入正确分组名称');
        }
    };

    // 取消这里不需要做过多的修改
    const cancel = (e: MouseEvent) => {
        message.error('Click on No');
    };

    // 获取标签列表
    const rawLabel = () => {
        let request = {
            token: userStore.token,
        }

        getLabelApi(request).then((res: any) => {
            if (tackleCode(res.code)) {
                labelStore.data = res.data;
                // 更新表格数据
                dataSource.value = initTableData();
            }
        })
    }

    // 删除标签
    const onDelete = (key: string, id: number | string) => {
        let request = {
            token: userStore.token,
            LabelId: id
        }
        
        deleteLabelApi(request).then((res: any) => {
            if (tackleCode(res.code)) {
                // 1. 更新本地dataSource
                dataSource.value = dataSource.value.filter(item => item.key !== key);
                // 2. 更新store中的数据
                labelStore.data = labelStore.data.filter(item => item.id !== id);
                
                // 3. 更新store中的计数
                if (labelStore.count > 0) {
                    labelStore.count -= 1;
                }    
                message.success('删除标签成功');
            } else {
                message.error('删除标签失败');
            }
        }).catch((error) => {
            console.error('删除标签出错:', error);
            message.error('删除标签失败');
        });
    };

    // 选择切换
    const chageState = (id: number | string, type: string) => {
        if (id + type != selected.value) {
            selected.value = id + type;
            // 传入父级告知其选择了什么选项
            if (emit) {
                emit('nowLabel', { id, type });
            }
        }
    }

    return {
        // 状态
        loading,
        open,
        value1,
        selected,
        labelStore,
        dataSource,
        editableData,
        tagColors,
        
        // 方法
        handleOk,
        handleCancel,
        showModal,
        confirm,
        cancel,
        rawLabel,
        chageState,
        onDelete,
        initTableData
    }
}
