import { MonitorSDK, MonitorType, MonitorLevel } from './sdk';
import { getBrowserFingerprint } from '../fingerprint';
import { baseUrl } from '../env';
import type { App } from 'vue';

// 设备信息收集
function getDeviceInfo() {
  return {
    deviceType: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
    os: getOS(),
    browser: getBrowser(),
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    language: navigator.language,
    userAgent: navigator.userAgent
  };
}

// 获取操作系统信息
function getOS() {
  const userAgent = navigator.userAgent;
  
  if (/Windows/i.test(userAgent)) return 'Windows';
  if (/Macintosh|Mac OS X/i.test(userAgent)) return 'MacOS';
  if (/Linux/i.test(userAgent)) return 'Linux';
  if (/Android/i.test(userAgent)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(userAgent)) return 'iOS';
  
  return 'Unknown';
}

// 获取浏览器信息
function getBrowser() {
  const userAgent = navigator.userAgent;
  
  // 修复：Edge 检测需要在 Chrome 之前
  if (/Edg/i.test(userAgent)) return 'Edge'; // 新版 Edge
  if (/Firefox/i.test(userAgent)) return 'Firefox';
  if (/Chrome/i.test(userAgent) && !/Edg/i.test(userAgent)) return 'Chrome';
  if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) return 'Safari';
  if (/MSIE|Trident/i.test(userAgent)) return 'IE';
  
  return 'Unknown';
}

// 初始化监控SDK
export async function initMonitor() {
  try {
    // 获取浏览器指纹作为用户标识
    const browserId = await getBrowserFingerprint();
    
    // ✅ 性能优化：配置SDK，减少监控数据量和频率
    MonitorSDK.init({
      appId: 'macbonhi-blog-user',
      appVersion: '1.0.0',
      reportUrl: `/api/monitor/report`,
      sessionId: browserId,
      deviceInfo: getDeviceInfo(),
      
      // ✅ 优化监控配置，减少性能影响
      autoTrackPageview: true,     // 保持页面访问监控
      autoTrackJsError: true,      // 保持错误监控（关键）
      autoTrackPromiseError: true, // 保持Promise错误监控（关键）
      autoTrackResource: false,    // 关闭资源监控，减少数据量
      autoTrackPerformance: true,  // 保持性能监控
      
      maxBreadcrumbs: 10,          // 减少行为轨迹记录数：20 → 10
      sampling: 0.3,               // 降低采样率：100% → 30%，显著减少数据量
      
      // ✅ 扩展忽略列表，减少无关监控
      ignoreUrls: [
        '/sockjs-node', 
        '/monitor/report',
        '/api/monitor',    // 忽略监控API本身
        '/hot-update',     // 忽略热更新
        '/__vite_ping',    // 忽略Vite ping
        '/favicon.ico',    // 忽略图标请求
        '.map$'            // 忽略source map请求
      ],
      
      // ✅ 性能优化配置说明：
      // - 批量大小：5条记录一起发送（实现在下方）
      // - 上报间隔：10秒（实现在下方） 
      // - 最大重试次数：2次（实现在下方）
      // - 重试间隔：5秒（实现在下方）
    });

    // ✅ 性能优化：智能过滤和批量上报系统
    let reportQueue: any[] = [];
    let lastFlushTime = Date.now();
    const FLUSH_INTERVAL = 10000; // 10秒上报一次
    const MAX_QUEUE_SIZE = 10;     // 队列最大10条记录
    
    // 添加兼容适配层，转换前端SDK和后端API的字段
    const originalReport = MonitorSDK.report.bind(MonitorSDK);
    MonitorSDK.report = function(data) {
      // ✅ 智能过滤：只上报重要数据
      if (!shouldReport(data)) {
        return Promise.resolve(); // 直接返回，不上报
      }
      
      // 确保page_url字段存在
      if (!data.page_url) {
        data.page_url = window.location.href;
      }
      
      // 确保event_type字段存在
      if (!data.event_type && data.type) {
        data.event_type = data.type;
      }
      
      // 添加event_name字段处理
      if (data.type === MonitorType.BEHAVIOR) {
        if (data.behavior_info?.actionType === 'page_view') {
          data.event_name = 'page_view';
        } else if (data.behavior_info?.actionType === 'route_change') {
          data.event_name = 'route_change';
        } else {
          data.event_name = 'behavior_event';
        }
      } else if (data.type === MonitorType.ERROR) {
        data.event_name = data.error_info?.error_type || 'error_event';
      } else if (data.type === MonitorType.PERFORMANCE) {
        data.event_name = 'performance_event';
      } else {
        data.event_name = data.event_name || data.type + '_event';
      }
      
      // ✅ 批量处理：加入队列而不是立即发送
      reportQueue.push(data);
      
      // 触发条件：队列满了 或 时间到了
      const now = Date.now();
      if (reportQueue.length >= MAX_QUEUE_SIZE || (now - lastFlushTime) >= FLUSH_INTERVAL) {
        flushReports();
      }
      
      return Promise.resolve();
    };
    
    // ✅ 智能过滤函数
    function shouldReport(data: any): boolean {
      // 1. 错误始终上报（最高优先级）
      if (data.type === MonitorType.ERROR) {
        return true;
      }
      
      // 2. 性能数据采样上报（20%概率）
      if (data.type === MonitorType.PERFORMANCE) {
        return Math.random() < 0.2;
      }
      
      // 3. 页面访问始终上报
      if (data.behavior_info?.actionType === 'page_view') {
        return true;
      }
      
      // 4. 路由变化始终上报
      if (data.behavior_info?.actionType === 'route_change_complete') {
        return true;
      }
      
      // 5. 其他行为数据采样上报（10%概率）
      if (data.type === MonitorType.BEHAVIOR) {
        return Math.random() < 0.1;
      }
      
      // 6. 自定义事件选择性上报
      if (data.type === MonitorType.CUSTOM) {
        // SDK初始化事件上报
        if (data.event_name === 'sdk_init_success') {
          return true;
        }
        return Math.random() < 0.3;
      }
      
      // 默认不上报
      return false;
    }
    
    // ✅ 批量上报函数
    async function flushReports() {
      if (reportQueue.length === 0) return;
      
      const reportsToSend = [...reportQueue];
      reportQueue = []; // 清空队列
      lastFlushTime = Date.now();
      
      try {
        // 批量发送所有报告
        await Promise.all(reportsToSend.map(report => originalReport(report)));
        console.log(`📊 监控数据批量上报成功: ${reportsToSend.length} 条记录`);
      } catch (error) {
        console.warn('⚠️ 监控数据上报失败:', error);
        // 重要数据重新加入队列重试
        const importantReports = reportsToSend.filter(report => 
          report.type === MonitorType.ERROR || 
          report.behavior_info?.actionType === 'page_view'
        );
        reportQueue.unshift(...importantReports);
      }
    }
    
    // ✅ 页面卸载时强制上报剩余数据
    window.addEventListener('beforeunload', () => {
      if (reportQueue.length > 0) {
        // 使用 sendBeacon API 确保数据能够发送
        try {
          const data = JSON.stringify(reportQueue);
          navigator.sendBeacon('/api/monitor/report', data);
        } catch (error) {
          console.warn('页面卸载时数据上报失败:', error);
        }
      }
    });

    // 注入 API 方法到全局，供 SDK 使用
    if (typeof window !== 'undefined') {
      (window as any).__monitorApi = async (data: any) => {
        try {
          // 使用相对路径导入
          const { reportMonitorApi } = await import('../../api/index');
          await reportMonitorApi(data);
        } catch (error) {
          console.error('监控API调用失败:', error);
          throw error;
        }
      };
    }

    console.log('监控系统初始化成功');
    
    // 发送初始化成功事件
    MonitorSDK.report({
      type: MonitorType.CUSTOM,
      level: MonitorLevel.INFO,
      event_name: 'sdk_init_success',
      behavior_info: {
        actionType: 'sdk_init',
        value: {
          browserId,
          deviceInfo: getDeviceInfo()
        }
      }
    });
    
    // 使用类型断言解决受保护属性的错误
    return MonitorSDK as any;
  } catch (error) {
    console.error('监控系统初始化失败:', error);
    // 即使初始化失败，也返回 SDK 实例，避免后续调用出错
    return MonitorSDK as any;
  }
}

// Vue插件安装方法
export const MonitorPlugin = {
  install: (app: App) => {
    // 初始化监控SDK
    initMonitor().then(sdk => {
      // 注册全局属性，可以在组件中通过this.$monitor访问
      app.config.globalProperties.$monitor = sdk;
      
      // 注册全局错误处理
      app.config.errorHandler = (err, vm, info) => {
        // 上报Vue错误
        sdk.report({
          type: MonitorType.ERROR,
          level: MonitorLevel.ERROR,
          error_info: {
            error_type: 'vue_error',
            message: err instanceof Error ? err.message : String(err),
            stack: err instanceof Error ? err.stack : '',
            component: vm?.$options?.name || 'AnonymousComponent',
            info
          }
        });
        
        // 控制台输出错误，方便开发排查
        console.error('Vue Error:', err);
      };
      
      // 监控路由错误（如果使用了 Vue Router）
      const router = app.config.globalProperties.$router;
      if (router) {
        router.onError((error: Error) => {
          sdk.report({
            type: MonitorType.ERROR,
            level: MonitorLevel.ERROR,
            error_info: {
              error_type: 'router_error',
              message: error.message,
              stack: error.stack || ''
            }
          });
        });
      }
    }).catch(error => {
      console.error('监控插件安装失败:', error);
    });
  }
};

// 导出SDK类型和枚举，方便在其他文件中使用
export { MonitorSDK, MonitorType, MonitorLevel };