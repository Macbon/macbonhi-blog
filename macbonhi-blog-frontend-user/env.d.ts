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
  readonly VITE_API_BASE_URL: string
  // 用户端特定环境变量
  readonly VITE_FINGERPRINT_KEY: string
  readonly VITE_CDN_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// 全局 process 变量声明 (解决构建时的 process 未定义问题)
declare const process: {
  env: {
    NODE_ENV: string
    [key: string]: string | undefined
  }
}

// 扩展 Window 接口
declare global {
  interface Window {
    // 用户端可能用到的全局属性
    __MACBON_CONFIG__?: any
    gtag?: (...args: any[]) => void
    [key: string]: any
  }
}

// 扩展 Vue 实例类型 (用户端主要使用 Ant Design Vue)
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $message: any
    $notification: any
    $modal: any
    [key: string]: any
  }
}

// Axios 响应类型扩展 (解决 response.code 不存在的问题)
declare module 'axios' {
  export interface AxiosResponse<T = any> {
    code?: number
    message?: string
    data: T
    status: number
    statusText: string
  }
}

// 用户端特定的第三方库类型声明
declare module '@fingerprintjs/fingerprintjs' {
  export interface FingerprintJS {
    get(): Promise<{ visitorId: string }>
  }
  export function load(): Promise<FingerprintJS>
}

export {}