# 前端监控SDK集成文档

## 概述

本SDK用于监控网站的错误、性能和用户行为数据，包括：

- **错误监控**：JS错误、Promise错误、资源加载错误、网络请求错误、Vue组件错误
- **性能监控**：页面加载性能、网络请求性能、路由切换性能
- **用户行为监控**：页面访问、路由变化、组件访问、用户交互

## 集成方式

SDK已作为Vue插件集成到项目中，在`main.ts`中通过`app.use(MonitorPlugin)`注册。无需额外配置。

## 使用方法

### 1. 在Vue组件中使用

```typescript
// 在组件方法中使用
this.$monitor.report({
  type: MonitorType.CUSTOM,
  level: MonitorLevel.INFO,
  behavior_info: {
    actionType: 'button_click',
    value: '按钮点击',
    element_path: '组件路径'
  }
});
```

### 2. 在组合式API中使用

```typescript
import { getCurrentInstance } from 'vue';
import { MonitorType, MonitorLevel } from '@/utils/monitor/sdk';

// 在setup函数中
const { proxy } = getCurrentInstance();
proxy.$monitor.report({
  type: MonitorType.CUSTOM,
  level: MonitorLevel.INFO,
  behavior_info: {
    actionType: 'button_click',
    value: '按钮点击'
  }
});
```

### 3. 在非组件JavaScript文件中使用

```typescript
import { MonitorSDK, MonitorType, MonitorLevel } from '@/utils/monitor/sdk';

MonitorSDK.report({
  type: MonitorType.ERROR,
  level: MonitorLevel.ERROR,
  error_info: {
    error_type: 'custom_error',
    message: '错误信息'
  }
});
```

## 数据类型

### 监控类型 (MonitorType)

- `ERROR`: 错误信息
- `PERFORMANCE`: 性能数据
- `BEHAVIOR`: 用户行为
- `CUSTOM`: 自定义事件

### 监控级别 (MonitorLevel)

- `FATAL`: 致命错误
- `ERROR`: 错误
- `WARN`: 警告
- `INFO`: 信息
- `DEBUG`: 调试信息

## 示例

请参考 `src/components/common/MonitorExample.vue` 组件，包含各类监控使用示例。

## 自动监控

SDK自动监控以下内容，无需手动处理：

- JS错误
- Promise错误
- 资源加载错误
- 页面性能指标
- 页面访问和路由变化
- 网络请求错误和性能

## 数据上报

监控数据会自动上报到后端API：`/api/monitor/report`。数据格式符合后端数据库结构设计，包括：
- 错误信息
- 性能指标
- 用户行为数据
- 设备和会话信息 