import { deleteFileApi } from '../api';
import { useCode } from '../hooks/code';
import { useUserStore } from '../store/user';
import { message } from 'ant-design-vue';


const { tackleCode } = useCode();

export function useFiles() {

    //这里删除文件分为删除单个或者多个这里我们有单选和全选的概念
    const deleteFile = (e:{id:number | string, filesUrl:string | string[]}) => {
        const userStore = useUserStore();
        let request = {
            filesId: e.id,
            filesUrl: e.filesUrl,//这里fileurl可能是数组对应单张或者多张
            token: userStore.token
        }
        deleteFileApi(request).then((res: any) => {

            if (tackleCode(res.code)) {
                message.success('删除成功');
            }
        });
    };


    return {
        deleteFile,
    }
}