import fetch from "../utils/axios";
import axios from "../utils/axios";
import { baseUrl } from "../utils/env";

// 创建专用于文件合并的Axios实例，设置更长的超时时间
const mergeFileAxios = axios.create({
    baseURL: baseUrl,
    timeout: 600000, // 10分钟超时
});

// 添加响应拦截器
mergeFileAxios.interceptors.response.use(
    (response) => {
        if (response.status === 200) {
            return response.data;
        } else {
            return Promise.reject(response.data.message);
        }
    },
    (error) => {
        return Promise.reject(error);
    }
);

//是否注册
export const isRegisterApi = (data:any) => {
    return fetch.post("/isRegister", data);
};

//用户注册
export const registerApi = (data:any) => {
    return fetch.post("/insertUser", data);
};

//用户登录
export const loginApi = (data:any) => {
    return fetch.post("/signin", data);
};

//总览数据
export const overviewApi = (data: any) => {
    return fetch.post("/overview", data);
};

//获取评论
export const getCommentsApi = (data: any) => {
    return fetch.post("/comment", data);
};

// 获取文章评论数量API (如需要详细评论数据时使用，通常评论数已在列表数据中)
export const getArticleCommentsApi = (data: any) => {
    return fetch.post("/articleComments", data);
};

//删除评论
export const deleteCommentApi = (data: any) => {
    return fetch.post("/deleteComment", data);
};

//已读评论
export const readCommentApi = (data: any) => {
    return fetch.post("/commentisread", data);
};

//获取私信
export const getMessageApi = (data: any) => {
    return fetch.post("/message", data);
};

//私信已读
export const readMessageApi = (data: any) => {
    return fetch.post("/messageisread", data);
};

//获取未读消息数量
export const getUnreadMessageCountApi = (data: any) => {
    return fetch.post("/getUnreadMessageCount", data);
};

//删除私信
export const deleteMessageApi = (data: any) => {
    return fetch.post("/deleteMessage", data);
};

//新建分组
export const addSubsetApi = (data: any) => {
    return fetch.post("/addSubset", data);
};

//删除分组
export const deleteSubsetApi = (data: any) => {
    return fetch.post("/deleteSubset", data);
};

//获取分组
export const getSubsetApi = (data: any) => {
    return fetch.post("/getClassiftyCount", data);
};

//修改分组
export const updateSubsetApi = (data: any) => {
    return fetch.post("/updateSubset", data);
};

//新建标签
export const addLabelApi = (data: any) => {
    return fetch.post("/addLabel", data);
};

//删除标签
export const deleteLabelApi = (data: any) => {
    return fetch.post("/deleteLabel", data);
};

//获取标签
export const getLabelApi = (data: any) => {
    return fetch.post("/Label", data);
};

//新建文章/图库
export const addArticleApi = (data: any) => {
    // 使用较长的超时时间
    return fetch.post("/addArticle", data, {
        timeout: 120000 // 增加到120秒，适应富文本内容处理
    });
};

//发布文章
export const publishArticleApi = (data: any) => {
    return fetch.post("/addArticle", data);
};

//获取文章
export const getArticleApi = (data: any) => {
    return fetch.post("/article", data);
};

//获取文章详情用于修改
export const getArticleDetailApi = (data: any) => {
    return fetch.post("/gainArticle", data);
};

//更新文章
export const updateArticleApi = (data: any) => {
    return fetch.post("/updateArticle", data, {
        timeout: 120000 // 增加到120秒，适应富文本内容处理
    });
};

//获取文章状态
export const getArticleStateApi = (data: any) => {
    return fetch.post("/getArticleStateCount", data);
};

//文章状态改变
export const changeArticleStateApi = (data: any) => {
    return fetch.post("/changeArticleState", data);
};

//删除文章
export const deleteArticleApi = (data: any) => {
    return fetch.post("/deleteArticle", data);
};

//上传文件
export const uploadFileApi = (data: any) => {
    return fetch.post("/file/upload", data, {
        timeout: 60000,
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};

//获取文件
export const getFileApi = (data: any) => {
    return fetch.post("/getFile", data);
};

//删除文件
export const deleteFileApi = (data: any) => {
    return fetch.post("/deleteFile", data);
};

//移动文件
export const moveFileApi = (data: any) => {
    return fetch.post("/removeFile", data);
};

//新建日记
export const createDiaryApi = (data: any) => {
    return fetch.post("/createDiary", data);
};

//获取日记
export const getDiaryApi = (data: any) => {
    return fetch.post("/diary", data);
};

//删除日记
export const deleteDiaryApi = (data: any) => {
    return fetch.post("/deleteDiary", data);
};

// ====== 大文件分片上传相关API ======

//文件验证（支持秒传和断点续传）
export const verifyFileApi = (data: any) => {
    return fetch.post("/file/verify", data);
};

//上传文件分片
export const uploadChunkApi = (data: any, onUploadProgress?: (progressEvent: any) => void) => {
    return fetch.post("/file/chunk", data, {
        headers: {
            'Content-Type': 'multipart/form-data'
        },
        onUploadProgress
    });
};

//合并文件分片
export const mergeFileApi = (data: any) => {
    return mergeFileAxios.post("/file/merge", data);
};

// 获取网站访问量趋势
export const getVisitTrendsApi = (data: any) => {
    return fetch.post("/monitor/visit-trends", data);
};

// 获取设备统计分析
export const getDeviceAnalysisApi = (data: any) => {
    return fetch.post("/monitor/device-analysis", data);
};

// 获取内容类型访问统计
export const getContentDistributionApi = (data: any) => {
    return fetch.post("/monitor/content-distribution", data);
};


