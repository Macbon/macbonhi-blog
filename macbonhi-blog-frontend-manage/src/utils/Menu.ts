

import {
  HomeOutlined,
  FolderOutlined,
  FileOutlined,
  CameraOutlined,
  HighlightOutlined,
  SettingOutlined
} from '@ant-design/icons-vue';

export const menuList = [
    {
        name: '总览',
        path: 'overview',
        icon: HomeOutlined,
    },
    {
        name: '本地文件',
        path: 'local-file',
        icon: FolderOutlined,
    },
    {
        name: '博客文章',
        path: 'articles',
        icon: FileOutlined,
    },
    {
        name: '摄影图库',
        path: 'gallery',
        icon: CameraOutlined,
    },
    {
        name: '随笔随记',
        path: 'diary',
        icon: HighlightOutlined,
    },
    {
        name: '设置',
        path: 'settings',
        icon: SettingOutlined,
    },
]


//总览数据我们以数组的形式进行存储
export const overviewData = [
    {
        path: 'local-file',
        name: '本地文件',
        total: '10M',
        bgColor: '180deg, #2b5aedcc 0%, #2B5AED 100%',
    },
    {
        path: 'articles',
        name: '博客文章',
        total: 10,
        bgColor: '180deg, #ff600829 0%, #ff60083d 100%',
    },
    {
        path: 'gallery',
        name: '摄影图库',
        total: 0,
        bgColor: '180deg, #25df0629 0%, #25df063d 100%',
    },
    {
        path: 'diary',
        name: '随笔随记',
        total: 0,
        bgColor: '180deg, #00c9f529 0%, #00c9f53d 100%',
    },

]