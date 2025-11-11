<template>
  <div class="comment-container">
    <!-- 顶部：评论输入框 - 使用a-textarea替换原textarea -->
    <div class="comment-input-area">
      <a-textarea 
        v-model:value="commentContent" 
        placeholder="说点什么～" 
        :rows="4"
        class="comment-textarea"
      />
    </div>

    <!-- 中部：简化的用户身份区域 - 只显示游客 -->
    <div class="comment-user-area">
      <div class="user-left">
        <!-- 固定为游客身份 -->
        <div class="user-identity">
          <div class="anonymous-name">游客</div>
        </div>
        
        <!-- 用户头像 - 使用固定头像 -->
        <div class="user-avatar">
          <img src='../../assets/user.png' alt="头像" />
        </div>
      </div>
      
      <!-- 评论按钮 -->
      <button class="comment-submit-btn" @click="submitComment">评论</button>
    </div>
    
    <!-- 底部：评论列表区域 - 使用commentSection组件 -->
    <commentSection 
      :target-id="targetId" 
      :target-type="targetType"
      :browser-id="browserId"
      ref="commentSectionRef"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import commentSection from './commentSection.vue';
import { addCommentApi, addDiaryCommentApi } from '../../api/index';
import { getBrowserFingerprint } from '../../utils/fingerprint';
import { useCommentStore } from '../../store/comment'; // 导入评论store

// 自定义接口来描述API响应格式
interface ApiResponse {
  code: number;
  data?: any;
  message?: string;
}

// 获取评论Store
const commentStore = useCommentStore();

// 组件属性
const props = defineProps({
  targetId: {
    type: Number,
    required: true
  },
  targetType: {
    type: Number,
    default: 0 // 0: 文章, 3: 随笔
  }
});

// 数据定义
const commentContent = ref('');
const browserId = ref('');
const commentSectionRef = ref<InstanceType<typeof commentSection> | null>(null);

const submitComment = async () => {
  if (!commentContent.value.trim()) {
    alert('评论内容不能为空');
    return;
  }
  
  try {
    const apiMethod = props.targetType === 0 
      ? addCommentApi 
      : addDiaryCommentApi;
    
    const commentData = {
      content: commentContent.value,
      user_type: 1, // 固定为游客类型
      user_name: null, // 游客不需要用户名
      user_id: browserId.value,
      article_id: props.targetType === 0 ? props.targetId : undefined,
      diary_id: props.targetType === 3 ? props.targetId : undefined
    };
    
    const response = await apiMethod(commentData);
    // 类型断言为自定义接口
    const res = response as unknown as ApiResponse;
    
    if (res.code === 200) {
      commentContent.value = '';
      // 增加评论数量计数
      commentStore.incrementCommentCount(props.targetId);
      // 刷新评论列表
      commentSectionRef.value!.refreshComments();
    }
  } catch (error) {
    console.error('提交评论失败:', error);
  }
};

// 生命周期
onMounted(async () => {
  // 生成浏览器指纹
  browserId.value = await getBrowserFingerprint();
  
  // 确保commentSection在browserId获取完成后才开始加载数据
  await nextTick();
  if (commentSectionRef.value) {
    commentSectionRef.value.refreshComments();
  }
});
</script>

<style scoped>
.comment-container {
  width: 100%;
  margin: 20px 0;
  border: 1px solid var(--gray-200);
  border-radius: 16px;
  padding: 20px;
  background-color: var(--background-topbar);
}

.comment-textarea {
  width: 100%;
  min-height: 100px;
  padding: 10px;
  border: 1px solid var(--gray-300);
  border-radius: 4px;
  resize: none;
  font-size: 14px;
  background-color: var(--background-topbar);
  color: var(--text-color);
}

.comment-user-area {
  display: flex;
  align-items: center;
  margin: 15px 0;
  justify-content: space-between;
}

.user-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-identity {
  display: flex;
  align-items: center;
}

.anonymous-name {
  padding: 5px 10px;
  border-radius: 4px;
  border: 1px solid var(--gray-300);
  background-color: var(--background-topbar);
  color: var(--text-color);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.comment-submit-btn {
  padding: 8px 20px;
  border: none;
  border-radius: 4px;
  background-color: var(--blue-600);
  color: white;
  cursor: pointer;
}

/* 添加暗色模式下特殊处理 */
:global([data-theme="dark"]) .comment-container {
  border-color: var(--gray-600);
}

:global([data-theme="dark"]) .comment-textarea,
:global([data-theme="dark"]) .anonymous-name {
  background-color: var(--gray-200);
  border-color: var(--gray-500);
}

:global([data-theme="dark"]) .comment-submit-btn:hover {
  background-color: var(--blue-500);
}
</style>
