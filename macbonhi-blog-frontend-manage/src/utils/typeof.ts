//TS规范数据使用

export type replyData = {
    id:number;
    article?:{
        id:number;
        title:string;
        
    };
    user_name: string;
    user_id: string | number;
    content:string;
    moment:string;
    complaint?: number;
    isread?: number;
    
}

//subset
export type SubsetData = {
    id: number | string;
    name: string | number;
    count: number;
    moment?: string;
}


//Label
export type LabelData = {
    id: number | string;
    label_name: string | number;
    moment?: string;
    incount: number;
}


//File

//文件数据格式
export interface FilesData {
    id: number;
    url: string; //路径地址
    file_name: string; //文件名称
    format: string; //文件格式
    subset_id: number; //所属类型
    selected: boolean; //是否选择
    moment: string; //文件上传时间
}


//规范文章数据类型
export interface ArticalData{
    id:number;
    title: number;
    cover?: string;
    subset_id?:number;//取出后端的id在前端处理其对应的是哪个分组
    moment:Date;//时间
    label?:string[];//标签是可以为空的
    introduce?:string;
    article_url?:string; //封面图片
    views: number;//文章查看次数
    comment: number;
    comments?: number; // 兼容用户端字段名
    comment_count?: number; // 兼容其他可能的字段名
    state:number;//是否查看
    paraseInt:number; //点赞次数 (保留原字段名以兼容现有数据)
    praise_count?: number; // 兼容用户端字段名
    praiseInt?: number; // 兼容其他可能的字段名
    likes?: number; // 兼容其他可能的字段名
}


//图库数据规范
export interface GalleryData{
    id:number;
    title: number;
    cover?: string;
    subsetId?:number;//取出后端的id在前端处理其对应的是哪个分组
    moment:Date;//时间
    introduce?:string;
    article_url?:string; //封面图片
    content?: string | string[];
    views: number;//文章查看次数
    comment: number;
    comments?: number; // 兼容用户端字段名
    comment_count?: number; // 兼容其他可能的字段名
    paraseInt:number; //点赞次数 (保留原字段名以兼容现有数据)
    praise_count?: number; // 兼容用户端字段名
    praiseInt?: number; // 兼容其他可能的字段名
    likes?: number; // 兼容其他可能的字段名
}

//日记数据规范
export interface DiaryData{
    id?: number;
    title?: string;
    moment: Date;//时间
    content: string;
    weather_id: number;
    picture?: string | string[];
}

export interface ArticleFormData {
    title: string;
    subset_id?: number | null; 
    label: number[];
    inroduce: string;
    cover?: string;
    classify: number;
}
