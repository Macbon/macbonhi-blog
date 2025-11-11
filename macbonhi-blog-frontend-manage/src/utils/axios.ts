import axios from "axios";
import { message } from "ant-design-vue";
import { baseUrl } from "./env";


const service = axios.create({
    baseURL: baseUrl,
    timeout: 120000, // 增加到120秒，适应富文本内容处理
});

//添加请求拦截器
service.interceptors.request.use(
    //在发送请求做什么
    (config) => {
        return config;
    },
    (error) => {
        message.error(error.message);
        return Promise.reject(error);
    }
);

//添加响应拦截器
service.interceptors.response.use(
    (response) => {
        if (response.status === 200) {
            return response.data;
        } else {
            message.error("请求失败");
            return Promise.reject(response.data.message);
        }
    },
    (error) => {
        message.error(error.message);
        return Promise.reject(error);
    }
);

export default service;

