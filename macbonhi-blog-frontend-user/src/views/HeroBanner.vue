<template>
  <div class="hero-banner">
    <!-- 左侧内容 -->
    <div class="hero-left">
      <div class="hero-title">
        <span class="main">咪扣</span>
        <span class="sub">时光</span>
      </div>
      <div class="hero-desc">
        慢下脚步<br />
        让心灵照亮前行的路
      </div>
      <div class="scroll-indicator" @click="scrollToQuickNav">
        <div class="arrow bounce"></div>
      </div>
    </div>
    <!-- 右侧3D人物和快捷入口 -->
    <div class="hero-right">
      <img class="hero-img" src="https://cdn.acwing.com/media/user/profile/photo/86575_lg_94d33900ea.jpg" alt="3D人物" />
      <div class="quick-nav">
        <!-- 可继续添加 -->
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
// 添加滚动功能
const scrollToQuickNav = () => {
  // 获取快捷入口元素
  const quickNavElement = document.querySelector('.quick-nav');
  if (quickNavElement) {
    // 获取元素位置
    const elementPosition = quickNavElement.getBoundingClientRect().top + window.pageYOffset;
    
    // 向下额外滚动100px，使元素显示在更下方位置
    const scrollPosition = elementPosition + 300;
    
    // 平滑滚动
    window.scrollTo({
      top: scrollPosition,
      behavior: 'smooth'
    });
  }
};
</script>

<style scoped>

.hero-banner {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 500px; /* 或你想要的高度 */
  height: auto;
  background: var(--background-color)!important;
  border-radius: 0 0 48px 48px;
  overflow: hidden;
  margin: 80px 0 0 0;
  transition: background-color 0.3s ease;
}
.hero-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 420px;
}
.hero-title {
  font-size: 96px;
  font-weight: bold;
  color: var(--text-color);
  display: flex;
  align-items: baseline;
  gap: 16px;
}
.hero-title .sub {
  font-size: 96px;
  font-weight: 700;
  color: transparent;
  -webkit-text-stroke: 2px var(--text-color);
}
.hero-desc {
  font-size: 36px;
  color: var(--text-color);
  margin-top: 32px;
  font-weight: 600;
  line-height: 1.2;
}
.scroll-indicator {
  margin-top: 64px;
  cursor: pointer;
  width: 36px;
  height: 36px;
  transition: transform 0.3s ease;
}

.scroll-indicator:hover {
  transform: translateY(5px);
}

.arrow {
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background: linear-gradient(180deg, var(--blue-400) 0%, var(--blue-600) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.3s ease;
}
.arrow::after {
  content: '';
  display: block;
  width: 16px;
  height: 16px;
  border-bottom: 3px solid var(--gray-100);
  border-right: 3px solid var(--gray-100);
  transform: rotate(45deg);
  margin: 8px auto;
}

/* 添加箭头动画 */
.bounce {
  animation: bounce 3s infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-20px);
  }
  60% {
    transform: translateY(-10px);
  }
}

.hero-right {
  flex: 1;
  position: relative;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  min-width: 500px;
  height: 100%;
}
.hero-img {
  width: 480px;
  height: auto;
  object-fit: contain;
  border-radius: 32px;
  box-shadow: 0 8px 32px var(--gray-200);
  transition: box-shadow 0.3s ease;
}
.quick-nav {
  position: absolute;
  right: 32px;
  top: 120px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.quick-btn {
  width: 72px;
  height: 72px;
  background: var(--background-topbar);
  border-radius: 24px;
  box-shadow: 0 2px 8px var(--gray-200);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
  cursor: pointer;
  transition: all 0.3s ease;
}
.quick-btn:hover {
  box-shadow: 0 4px 16px var(--blue-200);
  background: var(--blue-100);
}
.hero-tools {
  position: absolute;
  right: 64px;
  top: 32px;
  display: flex;
  align-items: center;
  gap: 16px;
}
.theme-switch {
  margin-left: 8px;
}
@media (max-width: 1200px) {
  .hero-banner {
    flex-direction: column;
    min-height: 600px;
    padding: 32px 0;
  }
  .hero-left, .hero-right {
    min-width: unset;
    padding-left: 0;
    justify-content: center;
    align-items: center;
  }
  .hero-img {
    width: 320px;
  }
  .hero-tools {
    right: 16px;
    top: 16px;
  }
}
</style>