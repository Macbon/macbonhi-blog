<!-- src/components/sections/UserProfileSection.vue -->

<template>
  <div class="user-section">
    <!-- 使用keep-alive包裹下拉菜单内容，避免频繁重渲染 -->
    <a-dropdown>
      <div class="user-avatar">
        <a-avatar :src="userAvatar" :size="32" />
        <span class="username">{{ userStore.name || '用户' }}</span>
      </div>
      
      <template #overlay>
        <keep-alive>
          <a-menu>
            <a-menu-item key="profile" @click="goToProfile">
              <UserOutlined /> 个人资料
            </a-menu-item>
            <a-menu-item key="settings" @click="goToSettings">
              <SettingOutlined /> 设置
            </a-menu-item>
            <a-menu-divider />
            <a-menu-item key="logout" @click="handleLogout">
              <LogoutOutlined /> 退出
            </a-menu-item>
          </a-menu>
        </keep-alive>
      </template>
    </a-dropdown>
    
    <!-- 使用v-show而非v-if来避免频繁的DOM操作，适用于频繁切换显示的元素 -->
    <a-dropdown>
      <a-badge v-show="hasNotifications" :count="notificationCount" dot>
        <BellOutlined class="notification-icon" />
      </a-badge>
      
      <template #overlay>
        <a-menu style="width: 300px;">
          <a-menu-item-group title="通知消息">
            <a-menu-item key="1" v-if="notifications.length === 0">
              <div class="notification-empty">
                <span>暂无新消息</span>
              </div>
            </a-menu-item>
            <a-menu-item 
              v-for="notification in notifications" 
              :key="notification.id"
              @click="handleNotificationClick(notification)"
            >
              <div class="notification-item">
                <div class="notification-title">{{ notification.title }}</div>
                <div class="notification-time">{{ notification.time }}</div>
              </div>
            </a-menu-item>
          </a-menu-item-group>
          <a-menu-divider v-if="notifications.length > 0" />
          <a-menu-item key="all" @click="viewAllNotifications">
            <div class="notification-action">查看全部通知</div>
          </a-menu-item>
        </a-menu>
      </template>
    </a-dropdown>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from '../../store/user';
import { useRouter } from 'vue-router';
import { UserOutlined, SettingOutlined, LogoutOutlined, BellOutlined } from '@ant-design/icons-vue';

const userStore = useUserStore();
const router = useRouter();

// 默认头像，避免空值导致的错误
const userAvatar = ref('https://placeholder.com/user.jpg');

// 通知相关状态
const hasNotifications = computed(() => notifications.value.length > 0);
const notificationCount = computed(() => notifications.value.length);
const notifications = ref([
  {
    id: 1,
    title: '系统更新通知',
    time: '2小时前',
    type: 'system'
  },
  {
    id: 2,
    title: '新的评论回复',
    time: '1天前',
    type: 'comment'
  }
]);

// 使用防抖函数处理频繁操作
const debounce = (fn: Function, delay: number) => {
  let timer: number | null = null;
  return (...args: any[]) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
      timer = null;
    }, delay) as unknown as number;
  };
};

// 处理通知点击
const handleNotificationClick = (notification: any) => {
  console.log('点击通知:', notification);
  // 这里可以根据通知类型进行不同的处理
  if (notification.type === 'comment') {
    // 跳转到评论管理页面
    router.push({ name: 'ArticleView' });
  }
};

// 查看全部通知
const viewAllNotifications = () => {
  console.log('查看全部通知');
  // 可以跳转到专门的通知页面
};

// 用户相关操作
const goToProfile = () => {
  // 暂时跳转到设置页面（如果没有profile路由的话）
  router.push({ name: 'Settings' });
};

const goToSettings = () => {
  router.push({ name: 'Settings' });
};

const handleLogout = () => {
  userStore.logout();
  router.push({ name: 'Login' });
};

// 模拟获取通知数据
onMounted(() => {
  // 可以在这里从API获取实际的通知数据
  console.log('用户头像组件已加载，当前通知数量:', notificationCount.value);
});
</script>

<style scoped>
.user-section {
  display: flex;
  align-items: center;
  margin-left: auto;
}

.user-avatar {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.user-avatar:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.username {
  margin-left: 8px;
  font-size: 14px;
}

.notification-icon {
  font-size: 20px;
  margin-left: 16px;
  cursor: pointer;
  transition: color 0.2s;
}

.notification-icon:hover {
  color: var(--blue-600);
}

[data-theme="dark"] .notification-icon:hover {
  color: var(--blue-400);
}

.notification-item {
  padding: 4px 0;
}

.notification-title {
  font-size: 14px;
  color: var(--text-color);
  margin-bottom: 2px;
}

.notification-time {
  font-size: 12px;
  color: var(--gray-500);
}

.notification-empty {
  text-align: center;
  color: var(--gray-500);
  font-size: 14px;
  padding: 16px 0;
}

.notification-action {
  text-align: center;
  color: var(--blue-600);
  font-size: 14px;
  font-weight: 500;
}

[data-theme="dark"] .notification-action {
  color: var(--blue-400);
}
</style>