import axios from "axios";
import { message } from "ant-design-vue";
import { baseUrl } from "./env";
import { MonitorSDK, MonitorType, MonitorLevel } from "./monitor/sdk";

// 扩展 InternalAxiosRequestConfig 类型
declare module 'axios' {
    interface InternalAxiosRequestConfig {
        metadata?: {
            startTime: number;
        };
    }
}

const service = axios.create({
    baseURL: baseUrl,
    timeout: 5000,
});

//添加请求拦截器
service.interceptors.request.use(
    //在发送请求做什么
    (config) => {
        // 记录请求开始时间
        config.metadata = { startTime: Date.now() };
        return config;
    },
    (error) => {
        // 请求错误监控
        MonitorSDK.report({
            type: MonitorType.ERROR,
            level: MonitorLevel.ERROR,
            error_info: {
                error_type: 'request_error',
                message: error.message,
                url: error.config?.url || '未知URL'
            }
        });
        
        message.error(error.message);
        return Promise.reject(error);
    }
);

//添加响应拦截器
service.interceptors.response.use(
    (response) => {
        // 计算请求时间
        const endTime = Date.now();
        const duration = endTime - (response.config.metadata?.startTime || endTime);
        
        // 记录慢请求 (超过1秒)
        if (duration > 1000) {
            MonitorSDK.report({
                type: MonitorType.PERFORMANCE,
                level: MonitorLevel.WARN,
                performance_info: {
                    slow_request: duration
                },
                behavior_info: {
                    actionType: 'slow_request',
                    url: response.config.url || '未知URL',
                    method: response.config.method || 'unknown',
                    duration
                }
            });
        }
        
        // 🔥 修复文件下载响应处理
        if (response.config.responseType === 'blob') {
            console.log('文件下载响应拦截器:', {
                status: response.status,
                headers: response.headers,
                dataType: typeof response.data,
                dataSize: response.data?.size || 'unknown',
                url: response.config.url
            });
            
            // 对于 blob 响应，返回完整的 response 对象
            return response;
        }
        
        // 检查 URL 是否包含下载相关的关键词
        if (response.config.url?.includes('downloadFile') || 
            response.config.url?.includes('download')) {
            console.log('下载URL响应拦截器:', {
                status: response.status,
                headers: response.headers,
                dataType: typeof response.data,
                url: response.config.url
            });
            
            // 返回完整的 response 对象
            return response;
        }
        
        // 对于普通请求，检查状态码
        if (response.status === 200) {
            return response.data;
        } else {
            // 响应状态码非200监控
            MonitorSDK.report({
                type: MonitorType.ERROR,
                level: MonitorLevel.WARN,
                error_info: {
                    error_type: 'response_error',
                    message: `请求失败: 状态码${response.status}`,
                    url: response.config.url || '未知URL',
                    status: response.status,
                    statusText: response.statusText
                }
            });
            
            message.error("请求失败");
            return Promise.reject(response.data.message);
        }
    },
    (error) => {
        // 错误处理保持不变...
        MonitorSDK.report({
            type: MonitorType.ERROR,
            level: MonitorLevel.ERROR,
            error_info: {
                error_type: 'response_error',
                message: error.message,
                url: error.config?.url || '未知URL',
                code: error.code,
                status: error.response?.status,
                statusText: error.response?.statusText
            }
        });
        
        if (!error.config?.url?.includes('downloadFile')) {
            message.error(error.message);
        }
        
        return Promise.reject(error);
    }
);

export default service;

