/// <reference types="vite/client" />

// Vue 单文件组件类型声明
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// 环境变量类型声明
interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_APP_TITLE: string
  readonly VITE_BASE_URL: string
  // 添加其他环境变量类型
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// 全局 process 变量声明
declare const process: {
  env: {
    NODE_ENV: string
    [key: string]: string | undefined
  }
}

// 扩展 Window 接口
declare global {
  interface Window {
    // 添加全局窗口属性
    [key: string]: any
  }
}

// 扩展 Vue 实例类型
declare module '@vue/runtime-core' {
  interface ComponentCustomInstance {
    $message: any
    $notification: any
    $modal: any
    [key: string]: any
  }
  
  interface ComponentCustomProperties {
    $message: any
    $notification: any
    $modal: any
    [key: string]: any
  }
}

// Axios 响应类型扩展
declare module 'axios' {
  export interface AxiosResponse<T = any> {
    code?: number
    message?: string
    data: T
  }
}

// 解决第三方库类型问题
declare module 'mockjs'
declare module '@wangeditor/editor'
declare module '@wangeditor/editor-for-vue'

export {}