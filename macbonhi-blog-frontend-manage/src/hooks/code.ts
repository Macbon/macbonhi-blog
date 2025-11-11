import {useRouter} from 'vue-router';
import { message } from 'ant-design-vue';

export const useCode = () => {
    const router = useRouter();

    const tackleCode = (code: number) => {
        if (code === 300) {
            router.push({ name: 'Login' });
            message.warning('当前token未验证，请重新登录');
            return false;
        } else if (code === 400) {
            message.error('请求参数不正确');   
            return false;
        } else if (code === 200) {
            return true;
        } else if (code === 401) {
            router.push({ name: 'Register' });
            return false;
        } else {
            return false;
        }
    }
    return { tackleCode };
}

