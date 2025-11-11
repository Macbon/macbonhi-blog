// 性能和Web API类型声明文件

// 扩展Performance接口，支持Chrome的memory属性
declare global {
  interface Performance {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  }
  
  interface Window {
    // Chrome DevTools的垃圾回收函数
    gc?: () => void;
  }
  
  // 网络连接API类型声明
  interface Navigator {
    deviceMemory?: number;
    connection?: {
      downlink?: number;
      effectiveType?: '2g' | '3g' | '4g' | 'slow-2g';
      rtt?: number;
      saveData?: boolean;
      type?: 'bluetooth' | 'cellular' | 'ethernet' | 'none' | 'wifi' | 'wimax' | 'other' | 'unknown';
    };
  }
}

export {};