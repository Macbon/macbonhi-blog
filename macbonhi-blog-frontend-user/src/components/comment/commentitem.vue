<template>
  <div class="comment-item">
    <!-- 用户头像 -->
    <div class="comment-avatar">
      <img src="../../assets/user.png" alt="头像" />
    </div>
    
    <div class="comment-content">
      <!-- 评论头部：用户名、时间和操作按钮 -->
      <div class="comment-header">
        <div class="user-info">
          <span class="comment-username">{{ userDisplayName }}</span>
          <span class="comment-time">{{ formattedTime }}</span>
        </div>
        
        <!-- 将操作按钮移至右上角 -->
        <div class="comment-actions">
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
      
      <!-- 评论文本 -->
      <div class="comment-text">
        {{ comment.content }}
      </div>
      
      <!-- 回复表单（条件显示） -->
      <div class="reply-form" v-if="showReplyForm">
        <a-textarea 
          v-model:value="replyContent" 
          placeholder="写下你的回复..." 
          :rows="3"
          class="reply-textarea"
        />
        <div class="reply-form-footer">
          <button @click="toggleReplyForm">取消</button>
          <button @click="submitReply" class="submit-btn">提交</button>
        </div>
      </div>
            
      <div class="replies-container" v-if="replies.length > 0 && replies.length < 4">
        <commentitem2 
          v-for="reply in replies" 
          :key="reply.id"
          :reply="reply"
          :browser-id="browserId"
        />
      </div>

      <!-- 4个或以上回复的处理 -->
      <template v-if="replies.length >= 4">
        <!-- 查看回复按钮 -->
        <div 
          class="view-replies"
          @click="toggleReplies"
        >
          {{ showReplies ? `收起回复(${replies.length})` : `查看全部${replies.length}条回复` }}
        </div>

        <!-- 回复列表（需要点击展开） -->
        <div class="replies-container" v-if="showReplies">
          <commentitem2 
            v-for="reply in replies" 
            :key="reply.id"
            :reply="reply"
            :browser-id="browserId"
            :parent-comment-id="comment.id"
            @reply-submitted="handleReplySubmitted"
          />
          
          <!-- 加载更多回复按钮 -->
          <div 
            v-if="replyPage < replyTotalPages && !isLoadingMoreReplies"
            class="load-more-replies"
            @click="loadMoreReplies"
          >
            加载更多回复...
          </div>
          
          <div v-if="isLoadingMoreReplies" class="loading-replies">
            正在加载...
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { HeartOutlined, MessageOutlined } from '@ant-design/icons-vue';
import { addPraiseApi, cancelPraiseApi, addCommentReplyApi, getCommentRepliesApi, getPraiseStatusApi } from '../../api/index';
import commentitem2 from './commentitem2.vue';

const props = defineProps({
  comment: {
    type: Object,
    required: true
  },
  browserId: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['refresh']);

// 数据
const isPraised = ref(false);
const praiseCount = ref(0);
const showReplyForm = ref(false);
const replyContent = ref('');
const replies = ref<any[]>([]);
const showReplies = ref(false);
const replyPage = ref(1);
const replyTotalPages = ref(1);
const isLoadingMoreReplies = ref(false);

// 计算属性
const userDisplayName = computed(() => {
  return props.comment.user_name || (props.comment.user_type === 1 ? '游客' : '未知用户');
});

const formattedTime = computed(() => {
  return formatTime(props.comment.moment);
});

// 方法
const formatTime = (timeString:any) => {
  // 实现时间格式化逻辑
  const commentDate = new Date(timeString);
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - commentDate.getTime()) / (1000 * 60));
  
  if (diffMinutes < 60) {
    return `${diffMinutes}分钟前`;
  } else if (diffMinutes < 60 * 24) {
    return `${Math.floor(diffMinutes / 60)}小时前`;
  } else {
    return timeString; // 原始时间字符串
  }
};

const togglePraise = async () => {
  // 验证必要参数
  if (!props.browserId || props.browserId.trim() === '') {
    console.error('browserId 未准备好，无法执行点赞操作');
    alert('请稍后再试');
    return;
  }
  
  try {
 
    if (isPraised.value) {
      // 取消点赞
      const res = await cancelPraiseApi({
        browser_id: props.browserId,
        target_id: props.comment.id,
        target_type: 1
      });
      
      
      if (res.code === 200) {
        isPraised.value = false;
        praiseCount.value = res.data.count;
      }
    } else {
      // 添加点赞
      const res = await addPraiseApi({
        browser_id: props.browserId,
        target_id: props.comment.id,
        target_type: 1
      });
      
      
      if (res.code === 200) {
        isPraised.value = true;
        praiseCount.value = res.data.count;
      }
    }
  } catch (error) {
    console.error('点赞操作失败:', error);
    alert('点赞操作失败，请稍后重试');
  }
};

const toggleReplyForm = () => {
  showReplyForm.value = !showReplyForm.value;
  if (!showReplyForm.value) {
    replyContent.value = '';
  }
};

const submitReply = async () => {
  if (!replyContent.value.trim()) {
    alert('回复内容不能为空');
    return;
  }

  // 保存提交的内容（在清空前）
  const submittedContent = replyContent.value;
  
  try {
    
    // 确定回复类型：0=文章评论，1=随笔评论
    const replyType = props.comment.article_id ? 0 : 1;
    
    const res = await addCommentReplyApi({
      comment_id: props.comment.id,
      content: replyContent.value,
      browser_id: props.browserId,
      user_name: userDisplayName.value,
      user_type: 1,
      target_type: replyType
    });


    if (res.code === 200) {
      // 1. 清空输入
      replyContent.value = '';
      // 2. 关闭回复表单
      toggleReplyForm();
      
      // 3. 立即添加一条临时回复到本地显示
      const tempReply = {
        id: Date.now(),
        user_name: userDisplayName.value,
        user_type: 1,
        content: submittedContent,
        moment: new Date().toLocaleString(),
        praise_count: 0,
        is_praised: false
      };
      
      // 添加到本地显示
      replies.value = [tempReply, ...replies.value];
      
      // 4. 根据回复数量决定是否需要展开显示
      if (replies.value.length >= 4) {
        // 如果回复数>=4，需要展开才能看到新回复
        showReplies.value = true;
      }
         
      // 延迟从服务器获取最新回复
      setTimeout(() => {
        loadReplies();
      }, 1000);
      
      // 通知父组件更新
      emit('refresh');
    }
  } catch (error) {
    console.error('提交回复失败:', error);
    alert("回复提交出错，请稍后重试");
  }
};

const loadReplies = async () => {
  try {
    const res = await getCommentRepliesApi({
      comment_id: props.comment.id,
      pageSize: 10,
      nowPage: replyPage.value
    });
    
    if (res.code === 200 && res.data) {
      if (res.data.replies && res.data.replies.length > 0) {
        // 确保每个回复都有comment_id字段
        const repliesWithCommentId = res.data.replies.map(reply => ({
          ...reply,
          comment_id: props.comment.id // 确保有这个字段
        }));
        
        // 如果是第一页，直接赋值；否则追加
        if (replyPage.value === 1) {
          replies.value = repliesWithCommentId;
        } else {
          replies.value = [...replies.value, ...repliesWithCommentId];
        }
             
      } else {
        if (replyPage.value === 1) {
          replies.value = [];
        }
      }
      
      replyTotalPages.value = res.data.total_pages || 1;
    }
  } catch (error) {
    console.error('加载回复失败:', error);
    if (replyPage.value === 1) {
      replies.value = [];
    }
  }
};

const toggleReplies = () => {
  // 只有回复数量>=4时才需要切换显示状态
  if (replies.value.length >= 4) {
    showReplies.value = !showReplies.value;
  }
};

const loadMoreReplies = async () => {
  if (replyPage.value >= replyTotalPages.value || isLoadingMoreReplies.value) {
    return;
  }
  
  isLoadingMoreReplies.value = true;
  try {
    replyPage.value++;
    
    const res = await getCommentRepliesApi({
      comment_id: props.comment.id,
      pageSize: 10,
      nowPage: replyPage.value,
      browser_id: props.browserId
    });
    
    if (res.data.code === 200) {
      // 追加新加载的回复
      replies.value = [...replies.value, ...(res.data.replies || [])];
      replyTotalPages.value = res.data.total_pages || 1;
    }
  } catch (error) {
    console.error('加载更多回复失败:', error);
  } finally {
    isLoadingMoreReplies.value = false;
  }
};

// 处理对回复的回复提交
const handleReplySubmitted = (eventData: any) => {

  loadReplies();
  
  // 确保回复区域是展开状态，以便用户看到新回复
  if (replies.value.length >= 4) {
    showReplies.value = true;
  }
  
  // 通知顶层组件可能需要更新
  emit('refresh');
};

onMounted(async () => {
  // 获取点赞状态和数量
  try {
    praiseCount.value = props.comment.praise_count || 0;
    isPraised.value = props.comment.is_praised || false;
     
    // 加载回复数据
    loadReplies();
  } catch (error) {
    console.error('获取点赞状态失败:', error);
  }
});

// 新增方法：验证点赞状态
const verifyPraiseStatus = async () => {
  try {
    const res = await getPraiseStatusApi({
      browser_id: props.browserId,
      target_id: props.comment.id,
      target_type: 1
    });
    
    if (res.code === 200) {
      isPraised.value = res.data.is_praised;
      praiseCount.value = res.data.count;
    }
  } catch (error) {
    console.error('验证点赞状态失败:', error);
  }
};

</script>

<style scoped>
.comment-item {
  display: flex;
  margin-bottom: 20px;
  padding: 10px 0;
  border-bottom: 1px solid var(--gray-200);
}

.comment-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 15px;
  flex-shrink: 0;
}

.comment-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.comment-content {
  flex: 1;
}

.comment-header {
  margin-bottom: 5px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.comment-username {
  font-weight: bold;
  color: var(--text-color);
}

.comment-time {
  color: var(--gray-400);
  font-size: 12px;
}

.comment-text {
  margin-bottom: 10px;
  line-height: 1.5;
  color: var(--text-color);
}

.comment-actions {
  display: flex;
  gap: 15px;
}

.action-item {
  cursor: pointer;
  color: var(--gray-500);
  display: flex;
  align-items: center;
  gap: 3px;
  /* 添加平滑过渡，防止抖动 */
  transition: color 0.2s ease, transform 0.1s ease;
  /* 确保尺寸稳定 */
  min-width: fit-content;
  /* 防止文本换行导致布局变化 */
  white-space: nowrap;
}

.action-item.active {
  color: var(--red-600);
}

/* 防止点击时的抖动 */
.action-item:active {
  transform: scale(0.95);
}

/* 悬停效果，让交互更流畅 */
.action-item:hover {
  transform: scale(1.05);
}

/* 确保图标尺寸稳定 */
.action-item .ant-icon {
  width: 16px;
  height: 16px;
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

.reply-textarea {
  width: 100%;
  min-height: 80px;
  border: 1px solid var(--gray-300);
  border-radius: 4px;
  padding: 8px;
  resize: none;
  background-color: var(--background-topbar);
  color: var(--text-color);
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

.replies-container {
  margin-top: 15px;
  margin-left: 20px;
  border-left: 2px solid var(--gray-200);
  padding-left: 15px;
  background-color: var(--background-color);
  border-radius: 0 4px 4px 0;
}

.reply-item {
  display: flex;
  margin-bottom: 10px;
}

.reply-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 10px;
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

.view-replies {
  margin-top: 10px;
  color: var(--blue-600);
  cursor: pointer;
  font-size: 13px;
}

/* 图标样式 */
.icon-like, .icon-reply {
  display: inline-block;
  width: 16px;
  height: 16px;
  background-size: contain;
  background-repeat: no-repeat;
}

.icon-like {
  background-image: url('/icons/like.svg');
}

.icon-reply {
  background-image: url('/icons/reply.svg');
}

.load-more-replies {
  text-align: center;
  color: var(--blue-600);
  cursor: pointer;
  margin-top: 10px;
  font-size: 13px;
  padding: 5px 0;
}

.load-more-replies:hover {
  background-color: var(--gray-100);
}

/* 添加暗色模式下特殊处理 */
:global([data-theme="dark"]) .reply-form,
:global([data-theme="dark"]) .reply-textarea,
:global([data-theme="dark"]) .reply-form-footer button:not(.submit-btn) {
  background-color: var(--gray-200);
}

:global([data-theme="dark"]) .replies-container {
  background-color: var(--gray-100);
}


/* 查看回复按钮样式优化 */
.view-replies {
  margin-top: 10px;
  color: var(--blue-600);
  cursor: pointer;
  font-size: 13px;
  padding: 5px 0;
  border-radius: 4px;
  transition: all 0.2s ease;
  user-select: none;
}

.view-replies:hover {
  color: var(--blue-700);
  background-color: var(--blue-50);
  padding-left: 8px;
}

:global([data-theme="dark"]) .view-replies:hover {
  color: var(--blue-400);
  background-color: var(--blue-900);
}

/* 加载更多回复按钮 */
.load-more-replies {
  text-align: center;
  color: var(--blue-600);
  cursor: pointer;
  margin-top: 10px;
  font-size: 13px;
  padding: 8px 0;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.load-more-replies:hover {
  background-color: var(--blue-50);
  color: var(--blue-700);
}

:global([data-theme="dark"]) .load-more-replies:hover {
  background-color: var(--blue-900);
  color: var(--blue-400);
}

/* 加载状态样式 */
.loading-replies {
  text-align: center;
  color: var(--gray-500);
  font-size: 13px;
  padding: 8px 0;
  font-style: italic;
}

/* 确保回复容器的圆角和边框效果 */
.replies-container {
  margin-top: 15px;
  margin-left: 20px;
  border-left: 2px solid var(--gray-200);
  padding: 15px;
  background-color: var(--gray-50);
  border-radius: 0 8px 8px 0;
  transition: background-color 0.2s ease;
  position: relative;
}

/* 添加微妙的内阴影增强层次感 */
.replies-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--gray-200), transparent);
  opacity: 0.5;
}

:global([data-theme="dark"]) .replies-container {
  background-color: var(--gray-700);
  border-left-color: var(--gray-600);
}

:global([data-theme="dark"]) .replies-container::before {
  background: linear-gradient(90deg, transparent, var(--gray-600), transparent);
}
</style>
