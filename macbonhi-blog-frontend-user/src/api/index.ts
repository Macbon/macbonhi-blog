import fetch from "../utils/axios";
import { baseUrl } from "../utils/env";

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
    return fetch.post("/addArticle", data);
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
    return fetch.post("/updateArticle", data);
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
    return fetch.post("/uploadFile", data);
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

// 根据日期获取日记
export const getDiaryByDateApi = (data: any) => {
    return fetch.post("/getDiaryByDate", data);
};

// 获取离指定日期最近的日记
export const getNearestDiaryApi = (data: any) => {
    return fetch.post("/getNearestDiary", data);
};

//获取可下载文件列表（排除图片）
export const getDownloadableFilesApi = (data: any) => {
    return fetch.post("/getDownloadableFiles", data);
};

//获取可下载文件分类计数（排除图片）
export const getDownloadableClassifyCountApi = (data: any) => {
    return fetch.post("/getDownloadableClassifyCount", data);
};

//下载文件
export const downloadFileApi = (data: { fileId: string | number, token: string }) => {
    return fetch.post("/downloadFile", {  // 改为 POST，路径不需要参数，和其他 API 保持一致
        fileId: data.fileId,
        token: data.token
    }, {
        responseType: 'blob',
        timeout: 300000
    });
};

// 添加评论API
export const addCommentApi = (data: any) => {
    return fetch.post("/addComment", data);
};

// 获取文章评论API
export const getArticleCommentsApi = (data: any) => {
    return fetch.post("/articleComments", data);
};

// 添加点赞API
export const addPraiseApi = (data: any) => {
    return fetch.post("/addPraise", data);
};

// 取消点赞API
export const cancelPraiseApi = (data: any) => {
    return fetch.post("/cancelPraise", data);
};

// 获取点赞状态API
export const getPraiseStatusApi = (data: any) => {
    return fetch.post("/getPraiseStatus", data);
};

// 随笔评论相关API
export const addDiaryCommentApi = (data: any) => {
    return fetch.post("/addDiaryComment", data);
};

export const getDiaryCommentsApi = (data: any) => {
    return fetch.post("/diaryComments", data);
};

// 批量获取点赞数
export const getBatchPraiseCountsApi = (data: any) => {
    return fetch.post("/getBatchPraiseCounts", data);
};

// 评论回复相关API
export const addCommentReplyApi = (data: any) => {
    return fetch.post("/addCommentReply", data);
};

export const getCommentRepliesApi = (data: any) => {
    return fetch.post("/commentReplies", data);
};

export const getBatchCommentRepliesApi = (data: any) => {
    return fetch.post("/batchCommentReplies", data);
};

// 管理员用API（需要token）
export const replyIsReadApi = (data: any) => {
    return fetch.post("/replyIsRead", data);
};

export const deleteCommentReplyApi = (data: any) => {
    return fetch.post("/deleteCommentReply", data);
};

export const getBatchArticlePraiseStatusApi = (data: any) => {
    return fetch.post("/getBatchArticlePraiseStatus", data);
};

export const updateArticleViewsApi = (data: any) => {
    return fetch.post("/updateArticleViews", data);
};

// 搜索API
export const searchApi = (params: {
    keyword: string;
    type?: string;
    limit?: number;
}) => {
    return fetch.post("/search", params);
};

// 监控数据上报API
export const reportMonitorApi = (data: any) => {
    return fetch.post("/monitor/report", data);
};

// 获取监控统计数据API（需要token）
export const getMonitorStatsApi = (data: any) => {
    return fetch.post("/monitor/stats", data);
};

// 获取性能监控数据API（需要token）
export const getPerformanceStatsApi = (data: any) => {
    return fetch.post("/monitor/performance", data);
};

// 获取设备统计数据API（需要token）
export const getDeviceStatsApi = (data: any) => {
    return fetch.post("/monitor/devices", data);
};

// 获取组件访问统计API（需要token）
export const getComponentStatsApi = (data: any) => {
    return fetch.post("monitor/components", data);
};

// 获取页面访问统计API（需要token）
export const getPageViewStatsApi = (data: any) => {
    return fetch.post("/monitor/pageviews", data);
};

// 获取错误统计API（需要token）
export const getErrorStatsApi = (data: any) => {
    return fetch.post("/monitor/errors", data);
};
