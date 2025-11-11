

export const menuList = [
    {
        name: '总览',
        path: 'Overview',
        icon: 'HomeOutlined',
    },
    {
        name: '本地文件',
        path: 'localFile',
        icon: 'FolderOutlined',
    },
    {
        name: '博客文章',
        path: 'ArticleView',
        icon: 'FileOutlined',
    },
    {
        name: '摄影图库',
        path: 'PhotoView',
        icon: 'CameraOutlined',
    },
    {
        name: '随笔随记',
        path: 'DiaryView',
        icon: 'HighlightOutlined',
    },
    {
        name: '设置',
        path: 'setting',
        icon: 'SettingOutlined',
    },
]


//总览数据我们以数组的形式进行存储
export const overviewData = [
    {
        path: '',
        name: '本地文件',
        total: '10M',
        bgColor: '180deg, #2b5aedcc 0%, #2B5AED 100%',
    },
    {
        path: 'editArticle',
        name: '博客文章',
        total: 10,
        bgColor: '180deg, #ff600829 0%, #ff60083d 100%',
    },
    {
        path: 'editPhoto',
        name: '摄影图库',
        total: 0,
        bgColor: '180deg, #25df0629 0%, #25df063d 100%',
    },
    {
        path: 'DiaryView',
        name: '随笔随记',
        total: 0,
        bgColor: '180deg, #00c9f529 0%, #00c9f53d 100%',
    },

]