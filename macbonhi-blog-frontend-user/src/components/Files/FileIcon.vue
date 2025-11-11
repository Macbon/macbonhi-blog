<template>
  <div class="file-icon-wrapper">
    <div class="file-icon" :class="fileTypeClass">
      <!-- 根据不同的文件类型显示不同的图标 -->
      <svg v-if="props.fileType === 'pdf'" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20,2H8C6.9,2,6,2.9,6,4v12c0,1.1,0.9,2,2,2h12c1.1,0,2-0.9,2-2V4C22,2.9,21.1,2,20,2z M11.5,9.5c0,0.83-0.67,1.5-1.5,1.5H9v2H7.5v-7H10c0.83,0,1.5,0.67,1.5,1.5V9.5z M16.5,11.5c0,0.83-0.67,1.5-1.5,1.5h-2.5V7H15c0.83,0,1.5,0.67,1.5,1.5V11.5z M20.5,8.5H19v1h1.5V11H19v2h-1.5V7h3V8.5z M9,7.5v2h1c0.28,0,0.5-0.22,0.5-0.5v-1c0-0.28-0.22-0.5-0.5-0.5H9z M14,11.5h1c0.28,0,0.5-0.22,0.5-0.5v-2c0-0.28-0.22-0.5-0.5-0.5h-1V11.5z M4,6H2v14c0,1.1,0.9,2,2,2h14v-2H4V6z"/>
      </svg>

      <svg v-else-if="props.fileType === 'word'" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19,3H5C3.9,3,3,3.9,3,5v14c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2V5C21,3.9,20.1,3,19,3z M14,17H7v-2h7V17z M17,13H7v-2h10V13z M17,9H7V7h10V9z"/>
      </svg>

      <svg v-else-if="props.fileType === 'excel'" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19,3H5C3.9,3,3,3.9,3,5v14c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2V5C21,3.9,20.1,3,19,3z M9,17H7v-2h2V17z M9,13H7v-2h2V13z M9,9H7V7h2V9z M13,17h-2v-2h2V17z M13,13h-2v-2h2V13z M13,9h-2V7h2V9z M17,17h-2v-2h2V17z M17,13h-2v-2h2V13z M17,9h-2V7h2V9z"/>
      </svg>

      <svg v-else-if="props.fileType === 'ppt'" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19,3H5C3.9,3,3,3.9,3,5v14c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2V5C21,3.9,20.1,3,19,3z M6,13.5v-0.38l1.2-1.49C7.93,10.78,8,10.13,8,10.13H8.1c0,0,0,0.7,0,1.5V13.5H6z M10,13.5v-0.38l1.2-1.49c0.73-0.85,0.8-1.5,0.8-1.5h0.1c0,0,0,0.7,0,1.5V13.5H10z M15,13.5h-2v-3h2V13.5z"/>
      </svg>

      <svg v-else-if="props.fileType === 'image'" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21,19V5c0-1.1-0.9-2-2-2H5C3.9,3,3,3.9,3,5v14c0,1.1,0.9,2,2,2h14C20.1,21,21,20.1,21,19z M8.5,13.5l2.5,3l3.5-4.5l4.5,6H5L8.5,13.5z"/>
      </svg>

      <svg v-else-if="props.fileType === 'video'" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18,4l2,4h-3l-2-4h-2l2,4h-3l-2-4H8l2,4H7L5,4H4C2.9,4,2,4.9,2,6v12c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2V4H18z"/>
      </svg>

      <svg v-else-if="props.fileType === 'audio'" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12,3V13.55C11.41,13.21,10.73,13,10,13C7.79,13,6,14.79,6,17S7.79,21,10,21S14,19.21,14,17V7H18V3H12z"/>
      </svg>

      <svg v-else-if="props.fileType === 'archive'" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20,6h-8l-2-2H4C2.9,4,2,4.9,2,6v12c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2V8C22,6.9,21.1,6,20,6z M18,12h-2v2h-2v-2h-2v-2h2V8h2v2h2V12z"/>
      </svg>

      <svg v-else-if="props.fileType === 'text'" viewBox="0 0 24 24" fill="currentColor">
        <path d="M14,2H6C4.9,2,4,2.9,4,4v16c0,1.1,0.9,2,2,2h12c1.1,0,2-0.9,2-2V8L14,2z M16,18H8v-2h8V18z M16,14H8v-2h8V14z M13,9V3.5L18.5,9H13z"/>
      </svg>

      <svg v-else viewBox="0 0 24 24" fill="currentColor">
        <path d="M14,2H6C4.9,2,4,2.9,4,4v16c0,1.1,0.9,2,2,2h12c1.1,0,2-0.9,2-2V8L14,2z M16,18H8v-2h8V18z M16,14H8v-2h8V14z M16,10H8V8h8V10z M13,9V3.5L18.5,9H13z"/>
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, computed } from 'vue';

interface FileIconProps {
  fileType: string;
}

const props = defineProps<FileIconProps>();

// 根据文件类型设置CSS类名
const fileTypeClass = computed(() => {
  return `file-type-${props.fileType}`;
});
</script>

<style scoped>
.file-icon-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}

.file-icon {
  width: 48px;
  height: 48px;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 为不同类型的文件设置不同的图标颜色 */
.file-type-pdf {
  color: #f40f02;
}

.file-type-word {
  color: #295396;
}

.file-type-excel {
  color: #1d6f42;
}

.file-type-ppt {
  color: #d24625;
}

.file-type-image {
  color: #26a69a;
}

.file-type-video {
  color: #e53935;
}

.file-type-audio {
  color: #7e57c2;
}

.file-type-archive {
  color: #8d6e63;
}

.file-type-text {
  color: #546e7a;
}

.file-type-unknown {
  color: #90a4ae;
}

/* 深色模式适配 */
[data-theme="dark"] .file-icon {
  color: #bdbdbd;
}

[data-theme="dark"] .file-type-pdf {
  color: #ff6e6e;
}

[data-theme="dark"] .file-type-word {
  color: #5c85d6;
}

[data-theme="dark"] .file-type-excel {
  color: #5bb282;
}

[data-theme="dark"] .file-type-ppt {
  color: #ff8a65;
}

[data-theme="dark"] .file-type-image {
  color: #4db6ac;
}

[data-theme="dark"] .file-type-video {
  color: #ff8a80;
}

[data-theme="dark"] .file-type-audio {
  color: #b39ddb;
}

[data-theme="dark"] .file-type-archive {
  color: #bcaaa4;
}

[data-theme="dark"] .file-type-text {
  color: #90a4ae;
}
</style> 