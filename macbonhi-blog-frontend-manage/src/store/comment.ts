import { defineStore } from 'pinia';

interface CommentState {
  [targetId: number]: {
    count: number;
  };
}

export const useCommentStore = defineStore('comment', {
  state: () => ({
    commentStates: {} as CommentState,
  }),

  actions: {
    // 设置评论数量
    setCommentCount(targetId: number, count: number) {
      if (!this.commentStates[targetId]) {
        this.commentStates[targetId] = { count: 0 };
      }
      this.commentStates[targetId].count = count;
    },
    
    // 增加评论数量
    incrementCommentCount(targetId: number) {
      if (!this.commentStates[targetId]) {
        this.commentStates[targetId] = { count: 0 };
      }
      this.commentStates[targetId].count++;
    },
    
    // 减少评论数量
    decrementCommentCount(targetId: number) {
      if (!this.commentStates[targetId] || this.commentStates[targetId].count <= 0) {
        return;
      }
      this.commentStates[targetId].count--;
    },
    
    // 获取评论状态
    getCommentState(targetId: number) {
      if (!this.commentStates[targetId]) {
        return { count: 0 };
      }
      return this.commentStates[targetId];
    }
  }
});