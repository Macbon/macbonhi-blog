import { MonitorSDK } from "../utils/monitor/sdk";

// 扩展 Vue 的类型定义
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    // 添加 $monitor 属性类型
    $monitor: typeof MonitorSDK;
  }
} 