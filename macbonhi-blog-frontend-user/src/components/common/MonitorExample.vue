<template>
  <div class="monitor-example">
    <h3>监控功能测试</h3>
    <div class="button-group">
      <a-button type="primary" @click="triggerCustomEvent">记录自定义事件</a-button>
      <a-button danger @click="triggerError">触发错误</a-button>
      <a-button @click="triggerPromiseError">触发Promise错误</a-button>
      <a-button type="dashed" @click="triggerNetworkError">触发网络错误</a-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { MonitorType, MonitorLevel } from '../../utils/monitor/sdk';
import axios from '../../utils/axios';

export default defineComponent({
  name: 'MonitorExample',
  mounted() {
    // 组件访问统计
    this.$monitor.report({
      type: MonitorType.BEHAVIOR,
      event_type: 'behavior',
      level: MonitorLevel.INFO,
      page_url: window.location.href,
      event_name: 'component_view',
      behavior_info: {
        actionType: 'component_view',
        value: 'MonitorExample'
      }
    });
  },
  methods: {
    // 记录自定义事件
    triggerCustomEvent() {
      this.$monitor.report({
        type: MonitorType.CUSTOM,
        event_type: 'custom',
        level: MonitorLevel.INFO,
        page_url: window.location.href,
        event_name: 'custom_button_click',
        behavior_info: {
          actionType: 'button_click',
          value: '记录自定义事件',
          element_path: 'MonitorExample > a-button:nth-child(1)'
        }
      });
      this.$message.success('自定义事件已记录');
    },
    
    // 触发JS错误
    triggerError() {
      try {
        // 故意触发错误
        const obj = null;
        obj.nonExistentMethod(); // 这里会抛出错误
      } catch (error) {
        if (error instanceof Error) {
          this.$monitor.report({
            type: MonitorType.ERROR,
            event_type: 'error',
            level: MonitorLevel.ERROR,
            page_url: window.location.href,
            event_name: 'js_error',
            error_info: {
              error_type: 'js_error',
              message: error.message,
              stack: error.stack,
              component: 'MonitorExample'
            }
          });
        }
        this.$message.error('JS错误已触发并上报');
      }
    },
    
    // 触发Promise错误
    triggerPromiseError() {
      // 这个Promise错误会被全局unhandledrejection事件捕获
      new Promise((resolve, reject) => {
        reject(new Error('这是一个未处理的Promise错误'));
      });
      this.$message.warning('Promise错误已触发');
    },
    
    // 触发网络请求错误
    triggerNetworkError() {
      // 请求一个不存在的URL
      axios.get('/non-existent-url')
        .catch(error => {
          // 错误会被axios拦截器捕获,但我们在这里也可以上报更多详情
          this.$monitor.report({
            type: MonitorType.ERROR,
            event_type: 'error',
            level: MonitorLevel.WARN,
            page_url: window.location.href,
            event_name: 'network_error',
            error_info: {
              error_type: 'network_error',
              message: '网络请求失败: ' + error.message,
              url: '/non-existent-url',
              component: 'MonitorExample'
            }
          });
        });
      this.$message.warning('网络错误已触发');
    }
  }
});
</script>

<style scoped>
.monitor-example {
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
  margin-bottom: 20px;
}

.button-group {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}
</style> 