// 定义监控事件类型枚举
export enum MonitorType {
  ERROR = 'error',
  PERFORMANCE = 'performance',
  BEHAVIOR = 'behavior',
  CUSTOM = 'custom'
}

// 定义监控级别枚举
export enum MonitorLevel {
  FATAL = 'fatal',
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

// 定义SDK初始化配置接口
export interface MonitorConfig {
  appId: string;              // 应用ID
  appVersion?: string;        // 应用版本号
  reportUrl: string;          // 上报地址
  sessionId?: string;         // 会话ID
  userId?: string;            // 用户ID
  deviceInfo?: any;           // 设备信息
  autoTrackPageview?: boolean;  // 自动监控页面访问
  autoTrackJsError?: boolean;   // 自动监控JS错误
  autoTrackPromiseError?: boolean; // 自动监控Promise错误
  autoTrackResource?: boolean;  // 自动监控资源加载错误 
  autoTrackPerformance?: boolean; // 自动监控性能指标
  maxBreadcrumbs?: number;    // 用户行为轨迹最大记录数
  sampling?: number;          // 采样率，1.0表示100%
  ignoreUrls?: string[];      // 忽略特定URL的请求监控
}

// 定义错误信息接口
export interface ErrorInfo {
  error_type: string;         // 错误类型
  message: string;            // 错误消息
  stack?: string;             // 错误堆栈
  component?: string;         // 出错组件
  [key: string]: any;         // 其他自定义信息
}

// 定义性能信息接口
export interface PerformanceInfo {
  [metricName: string]: number; // 性能指标名称及其值
}

// 定义行为信息接口
export interface BehaviorInfo {
  actionType: string;         // 行为类型，如click, input, route_change
  element_path?: string;      // 元素路径
  value?: any;                // 行为值，如点击的内容
  [key: string]: any;         // 其他自定义信息
}

// 定义上报数据接口
export interface ReportData {
  type: MonitorType;           // 监控类型
  level?: MonitorLevel;        // 监控级别
  error_info?: ErrorInfo;      // 错误信息
  performance_info?: PerformanceInfo; // 性能信息
  behavior_info?: BehaviorInfo; // 行为信息
  [key: string]: any;          // 其他自定义信息
}

// 监控SDK类
class Monitor {
  config: MonitorConfig = {
    appId: '',
    reportUrl: '',
    sampling: 1.0
  };
  sessionId: string = '';
  breadcrumbs: any[] = [];
  isInitialized: boolean = false;
  protected reportQueue: any[] = []; // 添加队列存储未发送的数据

  // 初始化SDK
  init(config: MonitorConfig) {
    if (this.isInitialized) {
      console.warn('监控SDK已经初始化');
      return this;
    }

    this.config = { ...this.config, ...config };
    this.sessionId = config.sessionId || this.generateSessionId();
    this.isInitialized = true;

    // 注册自动采集功能
    this.registerAutoTracking();

    // 处理队列中的数据
    this.flushQueue();

    return this;
  }

  // 处理队列中的数据
  protected flushQueue() {
    if (this.reportQueue.length > 0) {
      const queue = [...this.reportQueue];
      this.reportQueue = [];
      queue.forEach(data => this.report(data));
    }
  }

  // 生成会话ID
  generateSessionId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  // 注册自动数据采集
  registerAutoTracking() {
    const { autoTrackJsError, autoTrackPromiseError, autoTrackResource, autoTrackPageview, autoTrackPerformance } = this.config;

    // 自动采集JS错误
    if (autoTrackJsError) {
      window.addEventListener('error', (event) => {
        if (event.error) {
          this.report({
            type: MonitorType.ERROR,
            level: MonitorLevel.ERROR,
            error_info: {
              error_type: 'js_error',
              message: event.error.message || '',
              stack: event.error.stack || '',
              filename: event.filename,
              lineno: event.lineno,
              colno: event.colno
            }
          });
        } else if (event.target && (event.target as HTMLElement).nodeName) {
          // 资源加载错误
          const target = event.target as HTMLElement;
          this.report({
            type: MonitorType.ERROR,
            level: MonitorLevel.ERROR,
            error_info: {
              error_type: 'resource_error',
              message: `资源加载失败: ${(target as any).src || (target as any).href || '未知资源'}`,
              tagName: target.nodeName.toLowerCase()
            }
          });
        }
        return true; // 不阻止默认处理
      }, true);
    }

    // 自动采集Promise错误
    if (autoTrackPromiseError) {
      window.addEventListener('unhandledrejection', (event) => {
        let message = '';
        let stack = '';
        
        if (typeof event.reason === 'object' && event.reason !== null) {
          message = event.reason.message || String(event.reason);
          stack = event.reason.stack || '';
        } else {
          message = String(event.reason);
        }

        this.report({
          type: MonitorType.ERROR,
          level: MonitorLevel.ERROR,
          error_info: {
            error_type: 'promise_error',
            message,
            stack
          }
        });
        
        return true; // 不阻止默认处理
      });
    }

    // 自动采集页面访问
    if (autoTrackPageview) {
      // 页面加载完成后记录
      window.addEventListener('load', () => {
        // 延迟执行，确保页面完全加载
        setTimeout(() => {
          this.report({
            type: MonitorType.BEHAVIOR,
            level: MonitorLevel.INFO,
            behavior_info: {
              actionType: 'page_view',
              value: location.href,
              title: document.title
            }
          });
        }, 100);
      });

      // 监听路由变化（针对SPA应用）
      const originalPushState = history.pushState;
      const originalReplaceState = history.replaceState;

      history.pushState = (...args) => {
        originalPushState.apply(history, args);
        setTimeout(() => this.trackRouteChange(), 0);
      };

      history.replaceState = (...args) => {
        originalReplaceState.apply(history, args);
        setTimeout(() => this.trackRouteChange(), 0);
      };

      window.addEventListener('popstate', () => {
        setTimeout(() => this.trackRouteChange(), 0);
      });
    }

    // 自动采集性能指标
    if (autoTrackPerformance) {
      window.addEventListener('load', () => {
        // 延迟收集，确保所有性能数据都已准备好
        setTimeout(() => this.collectPerformance(), 1000);
      });
    }
  }

  // 监控路由变化
  trackRouteChange() {
    this.report({
      type: MonitorType.BEHAVIOR,
      level: MonitorLevel.INFO,
      behavior_info: {
        actionType: 'route_change',
        value: location.href,
        title: document.title
      }
    });
  }

  // 收集性能指标
  collectPerformance() {
    if (window.performance) {
      const performanceInfo: PerformanceInfo = {};
      
      try {
        // 基本页面加载时间指标
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigation) {
          // 使用 PerformanceNavigationTiming API（更现代的方式）
          performanceInfo.DNSTime = navigation.domainLookupEnd - navigation.domainLookupStart;
          performanceInfo.TCPTime = navigation.connectEnd - navigation.connectStart;
          performanceInfo.requestTime = navigation.responseStart - navigation.requestStart;
          performanceInfo.responseTime = navigation.responseEnd - navigation.responseStart;
          performanceInfo.domReadyTime = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
          performanceInfo.loadTime = navigation.loadEventEnd - navigation.startTime;
          performanceInfo.TTFB = navigation.responseStart - navigation.requestStart;
          performanceInfo.domInteractive = navigation.domInteractive - navigation.startTime;
          performanceInfo.domComplete = navigation.domComplete - navigation.startTime;
        }

        // Web Vitals指标
        try {
          // First Contentful Paint (FCP)
          const fcpEntries = performance.getEntriesByName('first-contentful-paint', 'paint');
          if (fcpEntries.length > 0) {
            performanceInfo.FCP = Math.round(fcpEntries[0].startTime);
          }

          // Largest Contentful Paint (LCP) - 使用 PerformanceObserver 更准确
          const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
          if (lcpEntries.length > 0) {
            const lastEntry = lcpEntries[lcpEntries.length - 1] as any;
            performanceInfo.LCP = Math.round(lastEntry.startTime);
          }

          // First Input Delay (FID)
          const fidEntries = performance.getEntriesByType('first-input');
          if (fidEntries.length > 0) {
            const entry = fidEntries[0] as any;
            performanceInfo.FID = Math.round(entry.processingStart - entry.startTime);
          }

          // Cumulative Layout Shift (CLS)
          let clsValue = 0;
          const clsEntries = performance.getEntriesByType('layout-shift');
          clsEntries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          performanceInfo.CLS = Math.round(clsValue * 1000) / 1000; // 保留3位小数
        } catch (e) {
          console.warn('Web Vitals 指标收集失败:', e);
        }

        // 上报性能数据
        this.report({
          type: MonitorType.PERFORMANCE,
          level: MonitorLevel.INFO,
          performance_info: performanceInfo
        });
      } catch (e) {
        console.error('性能数据收集失败:', e);
      }
    }
  }

  // 记录用户行为轨迹
  addBreadcrumb(breadcrumb: any) {
    this.breadcrumbs.push({
      ...breadcrumb,
      timestamp: Date.now()
    });

    // 保持面包屑数量在限定范围内
    if (this.config.maxBreadcrumbs && this.breadcrumbs.length > this.config.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(
        this.breadcrumbs.length - this.config.maxBreadcrumbs
      );
    }
  }

  // 上报数据
  report(data: ReportData) {
    if (!this.isInitialized) {
      console.warn('监控SDK未初始化，数据将被加入队列');
      this.reportQueue.push(data);
      return;
    }

    // 采样率控制
    if (this.config.sampling && this.config.sampling < 1 && Math.random() > this.config.sampling) {
      return;
    }

    // 构建上报数据
    const reportData = {
      app_id: this.config.appId,
      app_version: this.config.appVersion || '1.0.0',
      session_id: this.sessionId,
      user_id: this.config.userId,
      device_info: this.config.deviceInfo || {},
      page_url: window.location.href,
      timestamp: Date.now(),
      breadcrumbs: this.breadcrumbs.slice(-5),  // 上报最近5条行为轨迹
      ...data
    };

    // 发送数据
    this.sendData(reportData);
  }

  // 发送数据（修复版本）
  async sendData(data: any) {
    const { reportUrl } = this.config;
    
    // 确保数据格式正确
    const finalData = {
      ...data,
      page_url: data.page_url || window.location.href,
      event_type: data.event_type || data.type || 'custom',
      event_name: data.event_name || data.type + '_event'
    };
    
    // 数据大小检查与处理
    const dataStr = JSON.stringify(finalData);
    if (dataStr.length > 64 * 1024) {
      // 如果数据过大，移除breadcrumbs和设备信息
      delete finalData.breadcrumbs;
      if (finalData.error_info && finalData.error_info.stack && finalData.error_info.stack.length > 5000) {
        finalData.error_info.stack = finalData.error_info.stack.substring(0, 5000) + '...';
      }
    }

    // 调试日志
    console.debug('上报监控数据:', finalData.event_type || finalData.type);

    try {
      // 优先使用项目的 API 方法（如果可用）
      if (typeof window !== 'undefined' && (window as any).__monitorApi) {
        await (window as any).__monitorApi(finalData);
        return;
      }

      // 使用 Beacon API（推荐）
      if (navigator.sendBeacon && dataStr.length < 65536) { // Beacon API 限制 64KB
        const blob = new Blob([dataStr], { type: 'application/json' });
        const result = navigator.sendBeacon(reportUrl, blob);
        if (result) {
          return;
        }
      }

      // 降级到 Fetch API
      await fetch(reportUrl, {
        method: 'POST',
        body: dataStr,
        headers: {
          'Content-Type': 'application/json'
        },
        mode: 'cors',
        credentials: 'omit',
        keepalive: true
      });
    } catch (error) {
      // 错误处理
      console.error('监控数据上报失败:', error);
      
      // 最后的降级方案：创建图片请求
      try {
        const img = new Image();
        const simpleData = {
          event_type: finalData.event_type,
          page_url: finalData.page_url,
          app_id: finalData.app_id,
          timestamp: finalData.timestamp
        };
        img.src = `${reportUrl}?data=${encodeURIComponent(JSON.stringify(simpleData))}&t=${Date.now()}`;
      } catch (imgError) {
        console.error('监控数据上报完全失败');
      }
    }
  }

  // 手动上报错误
  captureError(error: Error | string, context?: any) {
    const errorInfo: ErrorInfo = {
      error_type: 'manual_error',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      ...context
    };

    this.report({
      type: MonitorType.ERROR,
      level: MonitorLevel.ERROR,
      error_info: errorInfo
    });
  }

  // 手动上报自定义事件
  trackEvent(eventName: string, eventData?: any) {
    this.report({
      type: MonitorType.CUSTOM,
      level: MonitorLevel.INFO,
      event_name: eventName,
      behavior_info: {
        actionType: 'custom_event',
        value: eventData
      }
    });
  }
}

// 导出单例
export const MonitorSDK = new Monitor();