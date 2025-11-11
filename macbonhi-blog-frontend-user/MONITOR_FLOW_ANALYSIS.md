# 监控系统完整流程分析

## 📊 监控数据流转全流程

### 1. 用户访问页面完整流程

```
用户打开网站 (https://example.com)
    ↓
1. 浏览器加载页面
    ├─ DNS解析
    ├─ TCP连接
    ├─ 请求资源
    └─ 渲染页面
    ↓
2. Vue应用初始化 (main.ts)
    ├─ 创建Pinia实例
    ├─ 注册MonitorPlugin
    │   └─ initMonitor()
    │       ├─ 调用getBrowserFingerprint() → 生成浏览器指纹
    │       │   └─ 使用FingerprintJS.load().get()
    │       │       └─ 返回visitorId: "7f8a9b2c3d4e5f6g"
    │       ├─ 调用getDeviceInfo() → 获取设备信息
    │       │   └─ 返回 {
    │       │         deviceType: "desktop",
    │       │         os: "Windows",
    │       │         browser: "Chrome",
    │       │         screenWidth: 1920,
    │       │         screenHeight: 1080,
    │       │         language: "zh-CN",
    │       │         userAgent: "Mozilla/5.0..."
    │       │       }
    │       ├─ 调用MonitorSDK.init(config)
    │       │   ├─ 保存配置
    │       │   ├─ 设置sessionId = browserId
    │       │   ├─ 注册自动监控
    │       │   │   ├─ window.addEventListener('error', ...)
    │       │   │   ├─ window.addEventListener('unhandledrejection', ...)
    │       │   │   ├─ 劫持history.pushState/replaceState
    │       │   │   └─ window.addEventListener('load', ...)
    │       │   └─ 处理未初始化前的队列数据
    │       └─ 注入window.__monitorApi
    └─ 设置app.config.errorHandler (捕获Vue错误)
    ↓
3. window.load事件触发
    ├─ 延迟100ms后触发page_view事件
    │   └─ MonitorSDK.report({
    │         type: 'behavior',
    │         behavior_info: {
    │           actionType: 'page_view',
    │           value: 'https://example.com',
    │           title: '首页'
    │         }
    │       })
    │       ↓
    │   shouldReport(data) → 判断是否上报
    │       └─ page_view → return true ✅
    │       ↓
    │   reportQueue.push(data) → 加入队列
    │       └─ reportQueue = [
    │             { type: 'behavior', behavior_info: {...} }
    │           ]
    │
    └─ 延迟1000ms后收集性能指标
        └─ collectPerformance()
            ├─ 获取PerformanceNavigationTiming
            ├─ 计算DNSTime、TCPTime、TTFB等
            ├─ 获取Web Vitals (FCP、LCP、FID、CLS)
            └─ MonitorSDK.report({
                  type: 'performance',
                  performance_info: {
                    DNSTime: 5,
                    TCPTime: 10,
                    TTFB: 50,
                    loadTime: 1200,
                    FCP: 800,
                    LCP: 1500
                  }
                })
                ↓
            shouldReport(data) → 判断是否上报
                └─ Math.random() < 0.2 → 20%概率 ✅
                ↓
            reportQueue.push(data)
                └─ reportQueue = [
                      { type: 'behavior', ... },
                      { type: 'performance', ... }
                    ]
    ↓
4. 10秒后或队列满10条时 → 触发批量上报
    └─ flushReports()
        ├─ reportsToSend = [...reportQueue]
        ├─ reportQueue = [] (清空队列)
        ├─ Promise.all(reportsToSend.map(report => originalReport(report)))
        │   └─ 对每条数据调用sendData(data)
        │       ├─ 构建完整上报数据
        │       │   └─ finalData = {
        │       │         app_id: 'macbonhi-blog-user',
        │       │         app_version: '1.0.0',
        │       │         session_id: '7f8a9b2c3d4e5f6g',
        │       │         device_info: {...},
        │       │         page_url: 'https://example.com',
        │       │         timestamp: 1234567890,
        │       │         type: 'behavior',
        │       │         event_type: 'behavior',
        │       │         event_name: 'page_view',
        │       │         behavior_info: {...}
        │       │       }
        │       │
        │       ├─ 数据大小检查（>64KB则压缩）
        │       │
        │       ├─ 尝试方式1：调用window.__monitorApi(finalData)
        │       │   └─ 调用项目的reportMonitorApi(data)
        │       │       └─ axios.post('/api/monitor/report', data)
        │       │           ↓
        │       │       [成功] → 返回 ✅
        │       │           ↓
        │       │       后端接收 → 存入数据库
        │       │
        │       ├─ 尝试方式2：navigator.sendBeacon()
        │       │   └─ const blob = new Blob([dataStr], {type: 'application/json'})
        │       │       └─ navigator.sendBeacon(reportUrl, blob)
        │       │           └─ [成功返回true] ✅
        │       │
        │       └─ 尝试方式3：fetch() with keepalive
        │           └─ fetch(reportUrl, {
        │                 method: 'POST',
        │                 body: dataStr,
        │                 keepalive: true
        │               })
        │               └─ [成功] ✅
        │
        │       ❌ 所有方式失败 → 降级到Image请求
        │           └─ img.src = `${reportUrl}?data=${encodeURIComponent(JSON.stringify(simpleData))}`
        │
        └─ console.log('📊 监控数据批量上报成功: 2 条记录')
```

### 2. 用户点击文章卡片流程

```
用户点击文章卡片
    ↓
1. articleitem组件触发click事件
    └─ emit('click', articleData)
    ↓
2. 父组件IndexArticle接收事件
    └─ handleArticleClick(article)
        └─ emit('articleClick', article)
    ↓
3. indexView组件接收事件
    └─ showArticleDetail(article)
        ├─ currentArticle.value = article
        ├─ drawerVisible.value = true
        └─ 可选：手动上报点击事件
            └─ MonitorSDK.report({
                  type: 'behavior',
                  event_name: 'article_click',
                  behavior_info: {
                    actionType: 'click',
                    articleId: article.id,
                    articleTitle: article.title
                  }
                })
                ↓
            shouldReport(data) → 判断是否上报
                └─ Math.random() < 0.1 → 10%概率
    ↓
4. ArticleContent组件加载
    └─ mounted() {
          // 更新文章浏览量
          updateArticleViewsApi({
            articleId: props.articleData.id,
            browserId: await getBrowserFingerprint()
          })
          
          // 可选：上报组件访问
          this.$monitor.report({
            type: 'behavior',
            event_name: 'component_view',
            behavior_info: {
              actionType: 'component_view',
              component: 'ArticleContent',
              articleId: props.articleData.id
            }
          })
        }
```

### 3. 路由跳转流程 (首页 → 文章列表页)

```
用户点击导航栏"文章"
    ↓
1. router.push('/article')
    ↓
2. router.beforeEach((to, from, next) => {
    const startTime = Date.now(); // 1234567890
    to.meta.startTime = startTime;
    
    MonitorSDK.report({
      type: 'behavior',
      event_name: 'route_change_start',
      behavior_info: {
        actionType: 'route_change_start',
        from: '/index',
        to: '/article',
        timestamp: 1234567890
      }
    })
    ↓
    shouldReport(data)
        └─ 其他行为 → Math.random() < 0.1 → 可能不上报 ❌
    
    next(); // 继续导航
})
    ↓
3. Vue Router开始导航
    ├─ 卸载indexView组件
    ├─ 加载ArticleView组件（懒加载）
    │   └─ const ArticleView = () => import('../views/ArticleView.vue')
    │       ↓ Webpack/Vite开始加载chunk
    │       ↓ 网络请求ArticleView.[hash].js
    │       ↓ 解析并编译组件
    │       ↓ 执行setup()
    └─ 渲染ArticleView
    ↓
4. router.afterEach((to, from) => {
    const endTime = Date.now(); // 1234568100
    const duration = endTime - to.meta.startTime; // 1210ms
    
    MonitorSDK.report({
      type: 'behavior',
      event_name: 'route_change_complete',
      behavior_info: {
        actionType: 'route_change_complete',
        from: '/index',
        to: '/article',
        routeName: 'Article',
        duration: 1210
      }
    })
    ↓
    shouldReport(data)
        └─ route_change_complete → return true ✅
        ↓
    reportQueue.push(data)
    
    // 因为duration > 1000ms，同时上报性能数据
    if (duration > 1000) {
      MonitorSDK.report({
        type: 'performance',
        event_type: 'performance',
        performance_info: {
          slow_navigation: 1210
        }
      })
      ↓
      shouldReport(data)
          └─ Math.random() < 0.2 → 20%概率
    }
})
```

### 4. API请求监控流程 (获取文章列表)

```
ArticleView组件mounted
    ↓
1. fetchArticles()
    └─ getArticleApi(params)
        └─ axios.post('/article', params)
            ↓
        [Axios请求拦截器]
        service.interceptors.request.use((config) => {
          config.metadata = { 
            startTime: Date.now() // 1234567000
          };
          return config;
        })
            ↓
        发送HTTP POST请求 → 后端
            ↓
        后端处理 (耗时800ms)
            ↓
        返回响应
            ↓
        [Axios响应拦截器]
        service.interceptors.response.use((response) => {
          const endTime = Date.now(); // 1234567800
          const duration = endTime - response.config.metadata.startTime; // 800ms
          
          // 800ms < 1000ms，不上报慢请求
          
          return response.data;
        })
            ↓
    组件接收数据 → 渲染列表
```

**慢请求场景**：
```
如果API耗时1500ms
    ↓
[Axios响应拦截器]
    const duration = 1500;
    
    if (duration > 1000) {
      MonitorSDK.report({
        type: 'performance',
        level: 'warn',
        performance_info: {
          slow_request: 1500
        },
        behavior_info: {
          actionType: 'slow_request',
          url: '/article',
          method: 'POST',
          duration: 1500
        }
      })
      ↓
      shouldReport(data)
          └─ Math.random() < 0.2 → 20%概率 ✅
          ↓
      reportQueue.push(data)
    }
```

### 5. 错误监控流程

#### JS错误
```
组件中发生错误
    ↓
try {
  const obj = null;
  obj.method(); // TypeError: Cannot read property 'method' of null
} catch (error) {
  // 不会被全局错误处理捕获
}
    ↓
如果不在try-catch中
    ↓
window.addEventListener('error', (event) => {
  MonitorSDK.report({
    type: 'error',
    level: 'error',
    error_info: {
      error_type: 'js_error',
      message: "Cannot read property 'method' of null",
      stack: "TypeError: Cannot read property 'method' of null\n    at ...",
      filename: "https://example.com/assets/ArticleView.js",
      lineno: 123,
      colno: 45
    }
  })
  ↓
  shouldReport(data)
      └─ type === ERROR → return true ✅ (100%上报)
      ↓
  reportQueue.push(data)
}, true);
```

#### Promise错误
```
async function fetchData() {
  const response = await fetch('/api/data');
  if (!response.ok) {
    throw new Error('Network error');
  }
  return response.json();
}

fetchData(); // 未catch，Promise rejection
    ↓
window.addEventListener('unhandledrejection', (event) => {
  MonitorSDK.report({
    type: 'error',
    level: 'error',
    error_info: {
      error_type: 'promise_error',
      message: 'Network error',
      stack: 'Error: Network error\n    at fetchData ...'
    }
  })
  ↓
  shouldReport(data)
      └─ type === ERROR → return true ✅
      ↓
  reportQueue.push(data)
});
```

#### Vue组件错误
```
Vue组件渲染错误
    ↓
<template>
  <div>{{ user.name }}</div> <!-- user是undefined -->
</template>
    ↓
app.config.errorHandler = (err, vm, info) => {
  MonitorSDK.report({
    type: 'error',
    level: 'error',
    error_info: {
      error_type: 'vue_error',
      message: "Cannot read property 'name' of undefined",
      stack: err.stack,
      component: 'ArticleView',
      info: 'render function'
    }
  })
  ↓
  shouldReport(data)
      └─ type === ERROR → return true ✅
      ↓
  reportQueue.push(data)
}
```

#### 网络请求错误
```
axios.get('/api/nonexistent')
    ↓
后端返回404
    ↓
[Axios响应拦截器 - error处理]
service.interceptors.response.use(
  (response) => {...},
  (error) => {
    MonitorSDK.report({
      type: 'error',
      level: 'error',
      error_info: {
        error_type: 'response_error',
        message: 'Request failed with status code 404',
        url: '/api/nonexistent',
        code: 'ERR_BAD_REQUEST',
        status: 404,
        statusText: 'Not Found'
      }
    })
    ↓
    shouldReport(data)
        └─ type === ERROR → return true ✅
        ↓
    reportQueue.push(data)
    
    return Promise.reject(error);
  }
);
```

### 6. 页面卸载流程（断网场景）

```
用户关闭浏览器标签页
    ↓
window.addEventListener('beforeunload', () => {
  // 此时reportQueue中还有未上报的数据
  reportQueue = [
    { type: 'behavior', ... },
    { type: 'performance', ... },
    { type: 'error', ... }
  ]
  
  // 使用sendBeacon确保数据能发送
  const data = JSON.stringify(reportQueue);
  navigator.sendBeacon('/api/monitor/report', data);
  
  // sendBeacon的特点：
  // 1. 异步发送，不阻塞页面卸载
  // 2. 即使页面关闭，浏览器也会完成发送
  // 3. 不受网络状态影响（会排队等待网络恢复）
})
    ↓
浏览器标签页关闭
    ↓
浏览器后台发送Beacon请求
    ↓
[场景1：网络正常]
    ↓
后端接收数据 → 存入数据库 ✅
    ↓
[场景2：网络断开]
    ↓
浏览器会：
  1. 保留Beacon请求在队列中
  2. 等待网络恢复
  3. 网络恢复后自动发送
  4. 如果浏览器完全关闭，数据丢失 ❌

[场景3：sendBeacon失败]
    ↓
数据丢失 ❌（但这是最后的降级方案）
```

### 7. 断网恢复后的数据补发

```
[用户操作过程中网络断开]

用户浏览网站
    ↓
产生监控数据 → 加入reportQueue
    ↓
10秒后触发flushReports()
    ↓
try {
  await Promise.all(reportsToSend.map(report => originalReport(report)))
} catch (error) {
  // 网络错误，发送失败
  console.warn('⚠️ 监控数据上报失败:', error);
  
  // 重要数据重新加入队列
  const importantReports = reportsToSend.filter(report => 
    report.type === MonitorType.ERROR || 
    report.behavior_info?.actionType === 'page_view'
  );
  reportQueue.unshift(...importantReports);
  
  // reportQueue现在包含：
  // - 重试的重要数据（错误和页面访问）
  // - 新产生的监控数据
}
    ↓
[网络恢复]
    ↓
10秒后或队列满10条再次触发flushReports()
    ↓
发送成功 ✅ → 清空队列
```

---

## 📈 监控数据统计示例

### 数据库表结构（推测）

```sql
CREATE TABLE monitor_events (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  app_id VARCHAR(100),           -- 应用ID: 'macbonhi-blog-user'
  app_version VARCHAR(20),        -- 版本: '1.0.0'
  session_id VARCHAR(100),        -- 会话ID（浏览器指纹）
  user_id VARCHAR(100),           -- 用户ID（如果登录）
  
  -- 事件信息
  event_type VARCHAR(50),         -- error/performance/behavior/custom
  event_name VARCHAR(100),        -- 具体事件名称
  level VARCHAR(20),              -- fatal/error/warn/info/debug
  
  -- 页面信息
  page_url VARCHAR(500),          -- 页面URL
  
  -- 设备信息
  device_info JSON,               -- {deviceType, os, browser, ...}
  
  -- 错误信息
  error_info JSON,                -- {error_type, message, stack, ...}
  
  -- 性能信息
  performance_info JSON,          -- {DNSTime, TTFB, FCP, LCP, ...}
  
  -- 行为信息
  behavior_info JSON,             -- {actionType, value, ...}
  
  -- 用户行为轨迹
  breadcrumbs JSON,               -- 最近5条行为
  
  -- 时间戳
  timestamp BIGINT,               -- 事件发生时间
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_app_id (app_id),
  INDEX idx_session_id (session_id),
  INDEX idx_event_type (event_type),
  INDEX idx_timestamp (timestamp)
);
```

### 数据样例

#### 页面访问事件
```json
{
  "id": 1001,
  "app_id": "macbonhi-blog-user",
  "app_version": "1.0.0",
  "session_id": "7f8a9b2c3d4e5f6g",
  "user_id": null,
  "event_type": "behavior",
  "event_name": "page_view",
  "level": "info",
  "page_url": "https://example.com/",
  "device_info": {
    "deviceType": "desktop",
    "os": "Windows",
    "browser": "Chrome",
    "screenWidth": 1920,
    "screenHeight": 1080,
    "language": "zh-CN"
  },
  "error_info": null,
  "performance_info": null,
  "behavior_info": {
    "actionType": "page_view",
    "value": "https://example.com/",
    "title": "首页"
  },
  "breadcrumbs": [],
  "timestamp": 1234567890,
  "created_at": "2024-01-01 12:00:00"
}
```

#### 性能监控事件
```json
{
  "id": 1002,
  "app_id": "macbonhi-blog-user",
  "event_type": "performance",
  "event_name": "performance_event",
  "level": "info",
  "page_url": "https://example.com/",
  "performance_info": {
    "DNSTime": 5,
    "TCPTime": 10,
    "requestTime": 20,
    "responseTime": 30,
    "domReadyTime": 100,
    "loadTime": 1200,
    "TTFB": 50,
    "FCP": 800,
    "LCP": 1500,
    "FID": 5,
    "CLS": 0.001
  },
  "timestamp": 1234568890
}
```

#### 错误事件
```json
{
  "id": 1003,
  "event_type": "error",
  "event_name": "js_error",
  "level": "error",
  "page_url": "https://example.com/article",
  "error_info": {
    "error_type": "js_error",
    "message": "Cannot read property 'name' of undefined",
    "stack": "TypeError: Cannot read property 'name' of undefined\n    at ArticleView.vue:123:45",
    "filename": "https://example.com/assets/ArticleView.js",
    "lineno": 123,
    "colno": 45
  },
  "breadcrumbs": [
    {"type": "route_change", "from": "/", "to": "/article", "timestamp": 1234567000},
    {"type": "api_call", "url": "/api/article", "timestamp": 1234567500}
  ],
  "timestamp": 1234568000
}
```

#### 慢请求事件
```json
{
  "id": 1004,
  "event_type": "performance",
  "event_name": "slow_request",
  "level": "warn",
  "performance_info": {
    "slow_request": 1500
  },
  "behavior_info": {
    "actionType": "slow_request",
    "url": "/api/article",
    "method": "POST",
    "duration": 1500
  },
  "timestamp": 1234569000
}
```

---

## 🔍 监控数据查询示例

### 统计错误频率
```sql
-- 最近24小时错误统计
SELECT 
  error_info->>'$.error_type' as error_type,
  COUNT(*) as count,
  COUNT(DISTINCT session_id) as affected_users
FROM monitor_events
WHERE event_type = 'error'
  AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY error_type
ORDER BY count DESC;
```

### 页面访问量统计
```sql
-- 每小时页面访问量
SELECT 
  DATE_FORMAT(created_at, '%Y-%m-%d %H:00:00') as hour,
  COUNT(*) as pageviews,
  COUNT(DISTINCT session_id) as unique_visitors
FROM monitor_events
WHERE event_type = 'behavior'
  AND event_name = 'page_view'
  AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY hour
ORDER BY hour;
```

### 性能监控统计
```sql
-- 平均页面加载时间
SELECT 
  AVG(performance_info->>'$.loadTime') as avg_load_time,
  AVG(performance_info->>'$.FCP') as avg_fcp,
  AVG(performance_info->>'$.LCP') as avg_lcp
FROM monitor_events
WHERE event_type = 'performance'
  AND performance_info IS NOT NULL
  AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR);
```

### 用户行为路径分析
```sql
-- 某个会话的用户行为轨迹
SELECT 
  event_name,
  behavior_info->>'$.actionType' as action_type,
  behavior_info->>'$.value' as action_value,
  page_url,
  FROM_UNIXTIME(timestamp/1000) as event_time
FROM monitor_events
WHERE session_id = '7f8a9b2c3d4e5f6g'
  AND event_type = 'behavior'
ORDER BY timestamp;
```

---

## 💡 最佳实践建议

### 1. 监控数据采样策略
- ✅ **错误数据**: 100%上报（最高优先级）
- ✅ **页面访问**: 100%上报（业务核心指标）
- ✅ **路由变化**: 100%上报（用户路径分析）
- ⚡ **性能数据**: 20%采样（减少数据量）
- ⚡ **其他行为**: 10%采样（避免数据膨胀）

### 2. 批量上报配置
- **队列大小**: 10条（平衡实时性和网络开销）
- **上报间隔**: 10秒（避免频繁请求）
- **页面卸载**: 立即上报（使用Beacon API）

### 3. 断网处理
- ✅ 使用队列缓存未发送数据
- ✅ 重要数据（错误、页面访问）优先重试
- ✅ 页面卸载时使用Beacon API确保发送
- ❌ 局限：浏览器完全关闭会导致部分数据丢失

### 4. 性能优化
- ✅ 采样率控制
- ✅ 批量上报
- ✅ 数据压缩（>64KB）
- ✅ 异步上报（不阻塞主线程）
- ✅ Beacon API优先（不阻塞页面卸载）

### 5. 数据安全
- ✅ 敏感信息脱敏（不上报用户输入内容）
- ✅ 错误堆栈限制长度（最多5000字符）
- ✅ 设备信息最小化（只收集必要信息）

---

## 📝 总结

### 监控系统核心特点
1. **全面覆盖**: 错误、性能、行为、自定义事件
2. **自动采集**: 无需手动埋点的错误和性能监控
3. **智能上报**: 采样率控制 + 批量上报 + 断网缓存
4. **可靠性高**: 三层降级（Beacon → Fetch → Image）
5. **性能友好**: 不阻塞主线程，最小化网络开销

### 监控数据流转总结
```
数据产生 → 过滤 → 加入队列 → 批量上报 → 后端接收 → 数据库存储 → 数据分析
```

### 关键技术点
- ✅ 浏览器指纹（FingerprintJS）
- ✅ Beacon API（可靠上报）
- ✅ 智能采样（减少数据量）
- ✅ 批量上报（减少网络开销）
- ✅ 断网缓存（提高可靠性）
- ✅ Web Vitals（性能指标）
- ✅ 行为轨迹（breadcrumbs）

