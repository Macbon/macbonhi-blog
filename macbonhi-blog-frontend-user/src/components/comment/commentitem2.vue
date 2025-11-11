<template>
  <div class="reply-item">
    <!-- 用户头像 -->
    <div class="reply-avatar">
      <img src="../../assets/user.png" alt="头像" />
    </div>
    
    <div class="reply-content">
      <!-- 回复头部：用户名、时间和点赞 -->
      <div class="reply-header">
        <div class="user-info">
          <span class="reply-username">{{ reply.user_name || '游客' }}</span>
          <span class="reply-time">{{ formattedTime }}</span>
        </div>
        
        <!-- 点赞操作移至右上角 -->
        <div class="reply-actions">
          <span 
            class="action-item" 
            :class="{ 'active': isPraised }"
            @click="togglePraise"
          >
            <HeartOutlined />
            <span>{{ praiseCount > 0 ? praiseCount : '' }}</span>
          </span>
          <span class="action-item" @click="toggleReplyForm">
            <MessageOutlined />
          </span>
        </div>
      </div>
      
      <!-- 回复文本 -->
      <div class="reply-text">
        <template v-if="reply.content && reply.content.includes('@')">
          <!-- 解析@用户名并高亮显示 -->
          <span v-html="formatReplyContent(reply.content)"></span>
        </template>
        <template v-else>
          {{ reply.content }}
        </template>
      </div>
      <!-- 回复输入框 -->
      <div class="reply-form" v-if="showReplyForm">
        <a-textarea v-model:value="replyContent" placeholder="写下你的回复..." :rows="2" />
        <div class="reply-form-footer">
          <button @click="toggleReplyForm">取消</button>
          <button @click="submitReply" class="submit-btn">提交</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { HeartOutlined, MessageOutlined } from '@ant-design/icons-vue';
import { addPraiseApi, cancelPraiseApi, addCommentReplyApi } from '../../api/index';

const emit = defineEmits(['reply-submitted']);
const props = defineProps({
  reply: {
    type: Object,
    required: true
  },
  browserId: {
    type: String,
    required: true
  },
  // 添加原评论ID，确保能正确关联
  parentCommentId: {
    type: Number,
    required: false
  }
});


// 数据
const isPraised = ref(false);
const praiseCount = ref(0);
const showReplyForm = ref(false);
const replyContent = ref('');

// 计算属性
const userDisplayName = computed(() => {
  return props.reply.user_name || (props.reply.user_type === 1 ? '游客' : '未知用户');
});

const formattedTime = computed(() => {
  return formatTime(props.reply.moment);
});

// 方法
const formatTime = (timeString: any) => {
  const replyDate = new Date(timeString);
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - replyDate.getTime()) / (1000 * 60));
  
  if (diffMinutes < 60) {
    return `${diffMinutes}分钟前`;
  } else if (diffMinutes < 60 * 24) {
    return `${Math.floor(diffMinutes / 60)}小时前`;
  } else {
    return timeString;
  }
};

const togglePraise = async () => {
  try {
    if (isPraised.value) {
      // 取消点赞
      const res = await cancelPraiseApi({
        browser_id: props.browserId,
        target_id: props.reply.id,
        target_type: 2 // 2表示回复/二级评论
      });
      
      if (res.code === 200) {
        isPraised.value = false;
        praiseCount.value = res.data.count;
      }
    } else {
      // 添加点赞
      const res = await addPraiseApi({
        browser_id: props.browserId,
        target_id: props.reply.id,
        target_type: 2 // 2表示回复/二级评论
      });
      
      if (res.code === 200) {
        isPraised.value = true;
        praiseCount.value = res.data.count;
      }
    }
  } catch (error) {
    console.error('点赞操作失败:', error);
  }
};

const toggleReplyForm = () => {
  showReplyForm.value = !showReplyForm.value;
};

const submitReply = async () => {
  if (!replyContent.value.trim()) {
    alert('回复内容不能为空');
    return;
  }
  
  // 验证必要参数
  if (!props.browserId || props.browserId.trim() === '') {
    alert('请稍后再试');
    return;
  }
  
  try {
    // 构建回复内容，添加@用户名前缀
    let content = replyContent.value.trim();
    if (props.reply && props.reply.user_name) {
      content = `@${props.reply.user_name}：${content}`;
    }
    
    
    // 获取原评论ID（所有回复都关联到同一个评论）
    const commentId = props.reply.comment_id || getCommentIdFromParent();
    
    // 确定回复类型：0=文章评论的回复，1=随笔评论的回复
    const replyType = props.reply.reply_type || 0;
    
    const res = await addCommentReplyApi({
      comment_id: commentId,
      content: content,
      browser_id: props.browserId,
      user_name: userDisplayName.value,
      user_type: 1,
      target_type: replyType
    });
    
    
    if (res.code === 200) {
      // 1. 清空输入并关闭表单
      replyContent.value = '';
      toggleReplyForm();
      
      // 2. 通知父组件刷新回复列表
      emit('reply-submitted', {
        commentId: commentId,
        newReplyContent: content
      });
      
    } else {
      console.error('回复提交失败:', res);
      alert('回复提交失败，请稍后重试');
    }
  } catch (error) {
    console.error('提交回复出错:', error);
    alert('回复提交出错，请稍后重试');
  }
};

// 格式化回复内容，高亮@用户名
const formatReplyContent = (content: any) => {
  if (!content) return '';
  
  // 匹配@用户名：的模式
  const atUserRegex = /(@[^：]+：)/g;
  
  return content.replace(atUserRegex, (match: any) => {
    return `<span class="at-user">${match}</span>`;
  });
};

// 辅助函数：获取原评论ID
const getCommentIdFromParent = () => {
  // 如果reply对象中没有comment_id，可能需要从父组件传递
  // 或者通过其他方式获取
  return props.reply.comment_id;
};

// 生命周期
onMounted(async () => {
  // 获取点赞状态和数量
  try {
    praiseCount.value = props.reply.praise_count || 0;
    isPraised.value = props.reply.is_praised || false;
    
    // 如果后端没有返回点赞状态，主动获取
    if (props.reply.praise_count === undefined || props.reply.is_praised === undefined) {
      // 可以调用批量获取点赞状态的API
      // 或者在父组件中统一处理
    }
  } catch (error) {
    console.error('获取点赞状态失败:', error);
  }
});

</script>

<style scoped>
.reply-item {
  display: flex;
  margin-bottom: 15px;
  padding: 8px 0;
  width: 100%;
}

.reply-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 8px;
  flex-shrink: 0;
}

.reply-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.reply-content {
  flex: 1;
}

/* 修改为flex布局，两端对齐 */
.reply-header {
  margin-bottom: 5px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.reply-username {
  font-weight: bold;
  color: var(--text-color);
}

.reply-time {
  color: var(--gray-400);
  font-size: 12px;
}

.reply-text {
  margin-bottom: 8px;
  line-height: 1.5;
  color: var(--text-color);
}

.reply-actions {
  display: flex;
  gap: 15px;
}

.action-item {
  cursor: pointer;
  color: var(--gray-500);
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 0.9em;
  /* 添加相同的防抖动样式 */
  transition: color 0.2s ease, transform 0.1s ease;
  min-width: fit-content;
  white-space: nowrap;
}

.action-item.active {
  color: var(--red-600);
}

.action-item:active {
  transform: scale(0.95);
}

.action-item:hover {
  transform: scale(1.05);
}

.action-item .ant-icon {
  width: 14px;
  height: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.reply-form {
  margin-top: 10px;
  border: 1px solid var(--gray-200);
  border-radius: 4px;
  padding: 10px;
  background-color: var(--background-topbar);
}

.reply-form-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
  gap: 10px;
}

.reply-form-footer button {
  padding: 5px 15px;
  border-radius: 4px;
  cursor: pointer;
  background-color: var(--background-topbar);
  color: var(--text-color);
  border: 1px solid var(--gray-300);
}

.submit-btn {
  background-color: var(--blue-600) !important;
  color: white !important;
  border: none !important;
}

.at-user {
  font-weight: bold;
  color: var(--blue-600);
}

/* @用户名高亮样式 */
.at-user {
  font-weight: bold;
  color: var(--blue-600);
  background-color: var(--blue-50);
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 0.9em;
}

:global([data-theme="dark"]) .at-user {
  color: var(--blue-400);
  background-color: var(--blue-900);
}

/* 回复文本样式优化 */
.reply-text {
  margin-bottom: 8px;
  line-height: 1.5;
  color: var(--text-color);
  word-wrap: break-word;
  word-break: break-all;
}

/* 回复表单样式微调 */
.reply-form {
  margin-top: 10px;
  border: 1px solid var(--gray-200);
  border-radius: 4px;
  padding: 10px;
  background-color: var(--background-topbar);
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 添加暗色模式下特殊处理 */
:global([data-theme="dark"]) .reply-form {
  background-color: var(--gray-200);
}

/* 文本域底色适配 */
:deep(.ant-input) {
  background-color: var(--background-topbar);
  color: var(--text-color);
  border-color: var(--gray-300);
}

/* 深色模式下文本域适配 */
:global([data-theme="dark"]) :deep(.ant-input) {
  background-color: var(--gray-200);
  color: var(--text-color);
  border-color: var(--gray-500);
}

/* 文本域placeholder颜色适配 */
:deep(.ant-input::placeholder) {
  color: var(--gray-400);
}

:global([data-theme="dark"]) :deep(.ant-input::placeholder) {
  color: var(--gray-600);
}
</style>
