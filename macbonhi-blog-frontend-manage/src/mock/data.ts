import mockjs from 'mockjs';


const Random = mockjs.Random;


//mock数据，这里主要是对首页中的上方页面进行
export const mockOverviewData = mockjs.mock({
    code: 200,
        "data":{
            "file":Random.float(60,100,2,2) + 'M',
            "article|0-50": 0,
            "gallery|0-50": 0, 
            "diary|0-50": 0, 
        } 
    
})

//访问量数据模拟
export const mockVisitData = mockjs.mock({
    code: 200,
    "data|30": [
        { 
            "date": "@datetime('MM-dd')",
            "count|10-100": 12,
        }
    ]
})

//饼状图数据
export const mockPieData = mockjs.mock({
    code: 200,
    "data|30": [
        {
            "device": [
                {
                    "key": "mobile",
                    "name": "移动端",
                    "value|10-100": 12,
                },
                {
                    "key": "pc",
                    "name": "PC端",
                    "value|10-100": 12,
                },
                    
            ],
            "website": [
                {
                    "key": "file",
                    "name": "文件",
                    "value|10-100": 12,
                },
                {
                    "key": "article",
                    "name": "文章",
                    "value|10-100": 12,
                },
                {
                    "key": "gallery",
                    "name": "画廊",
                    "value|10-100": 12,
                },
                {
                    "key": "diary",
                    "name": "日记",
                    "value|10-100": 12,
                },
            ]
        }
    ]
})


//评论数据

export const mockCommentsData = mockjs.mock({
    code: 200,
    "data": {
        "count": 123,
        "list|123": [{
            "id|+1": 0,
            "article": {
                "id|+1": 2,
                "title": "@ctitle(3,12)",
            },
            "user": {
                "id|+1": 3,
                "name": "@ctitle(3,12)",
                "imurl": "https://www.antdv.com/assets/logo.1ef800a8.svg",
            },
            "comment": "@cparagraph(1,4)",
            "moment": "@datetime('yyyy-MM-dd HH:mm:ss')",
            "complaint|1-20": 12,
        }]
    }
})

//分组数据
export const mockSubsetData = mockjs.mock({
    code: 200,
    "data": {
        "count": 300,
        "list|5": [{
            "id|+1": 0,
            "name": "@ctitle(2,3)",
            "count|0-50": 12,
            "moment": "@datetime('yyyy-MM-dd HH:mm:ss')",
        }]
    }
})


//文章状态

export const mockArticleStatusData = mockjs.mock({
    code: 200,
    "data": [
        {
            "id": 0,
            "name": "已发布",
            "count|0-50": 12,
        },
        {
            "id": 1,
            "name": "未发布",
            "count|0-50": 12,
        }
    ]
})

//图片合集
const photos = [
    "a.jpg",
    "b.jpg",
    "c.jpg",
    "d.jpg",
    "e.jpg",
    "f.jpg",
    "g.jpg",
    "h.jpg",
    "i.jpg",
    "j.jpg",
    "k.jpg",
    "l.jpg",
    "m.jpg",
    "n.jpg",
    "o.jpg",
    "p.jpg",
    "q.jpg",
]

const photoarr = [
    ["a.jpg"],
    ["b.jpg", "c.jpg", "e.jpg", "f.jpg", "g.jpg"],
    ["b.jpg", "c.jpg"],
    ["b.jpg", "c.jpg", "h.jpg", "i.jpg"],
    ["b.jpg", "c.jpg", "a.jpg", "f.jpg"],
    ["j.jpg", "k.jpg", "l.jpg", "m.jpg"],
    ["n.jpg", "o.jpg", "p.jpg", "q.jpg"],
    ["a.jpg", "b.jpg", "c.jpg", "m.jpg"],
    ["d.jpg", "h.jpg", "m.jpg", "p.jpg"],
    ["a.jpg", "f.jpg", "j.jpg"],
    ["b.jpg", "c.jpg", "e.jpg", "i.jpg", "q.jpg"],

]

//文件数据/照片数据
export const mockFilesData = mockjs.mock({
    code: 200,
    count: 64,
    "data|64": [
    {
        "id|+1": 0,//
        "url|1": photos,//图片地址
        "fileName": "@ctitle(5, 8)",//名称
        "format": "jpeg",//格式
        "subsetId|0-4": 3,//所属类型/所属分组
        "moment": "@datetime('yyyy-MM-dd HH:mm:ss')",//图片存取时间
    }
    ]
})

//标签信息

export const mockLabelData = mockjs.mock({
    code: 200,
    count: 16,
    "list|16": [
        {
            "id|+1": 0,
            "name": "@ctitle(2,5)",
            "incount|0-50": 12, //标签下属的文章数量
            "moment": "@datetime('yyyy-MM-dd HH:mm:ss')",
        }
    ]
    
    
})

//文章数据
export const mockArticleData = mockjs.mock({
    code: 200,
    "data": {
        "count": 200,
        "list|50": [
            {
                "id|+1": 0,
                "title": "@ctitle(8,15)",
                "cover|1":photos,
                "subsetId|0-5": 3,//取出后端的id在前端处理其对应的是哪个分组
                "moment": "@datetime('yyyy-MM-dd HH:mm:ss')",//时间
                "label|0-5": ["@ctitle(2,3)"],  //标签是可以为空的
                "introduce": "@cparagraph(1,4)", //文章内容
                "article_url|1": photos, //封面图片
                "views|10-200": 50,//文章查看次数
                "comment|10-200":14,//文章评论次数
                "state|0-1": 0,//是否发布
                "paraseInt|10-100": 30, //点赞次数
                
            }
        ]
    }
})

//图库数据
export const mockGalleryData = mockjs.mock({
    code: 200,
    "data": {
        "count": 200,
        "list|50": [
            {
                "id|+1": 0,
                "title": "@ctitle(8,15)",
                "cover|1":photos,
                "subsetId|0-5": 3,//取出后端的id在前端处理其对应的是哪个分组
                "moment": "@datetime('yyyy-MM-dd HH:mm:ss')",//时间
                "introduce": "@cparagraph(1,4)", //图片简介
                "article_url|1": photos, //封面图片
                "content|1": photoarr,
                "views|10-200": 50,//文章查看次数
                "comment|10-200":14,//文章评论次数
                "paraseInt|10-100": 30, //点赞次数
                
            }
        ]
    }
})

export const mockDiaryData = mockjs.mock({
    code: 200,
    "data": {
        "count": 200,
        "list|50": [
            {
                "id|+1": 0,
                "title": "@ctitle(8,15)",
                "moment": "@datetime('yyyy-MM-dd HH:mm:ss')",//时间
                "weatherId|0-7": 0,
                "content": "@cparagraph(2,10)",
                "picture|1": photoarr,

            }
        ]
    }
})

export const mockphotos = mockjs.mock({
    "data|6": [
        {
            "id|+1": 0,
            "url|1": photos,
        }
    ]
})
