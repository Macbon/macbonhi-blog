<template>
  <div class="about-container">
    <!-- 前言部分 -->
    <section class="about-card">
      <h2 class="section-title">前言</h2>
      <div class="section-content">
        <p>
(●'◡'●) 这个页面的事儿啊，从建站起就在我脑瓜里转悠八百回了！每次打开编辑器就跟遇上鬼打墙似的 (˘̩̩̩ε˘̩ƪ) 直到最近突然 ——( ￣▽￣)σ 叮！懒人开窍啦！果然摸鱼才是第一生产力嘛～这个博客嘛 (￣y▽￣)~* 就是我碎碎念的游乐场，囤积那些像彩虹棉花糖一样甜滋滋的日常小确幸～︎ƪ(˘⌣˘)ʃ才不要当技术流卷王呢，当个自由自在的互联网园丁不更开心嘛～＼(＠＾０＾＠)/♪</p>
      </div>
    </section>

    <!-- 个人信息展示 -->
    <section class="about-card">
      <h2 class="section-title text-center">Macbon</h2>
      <div class="section-content text-center">
        <div class="avatar-container">
          <!-- 这里可以放置头像图片 -->
          <img src="../assets/istj.png" alt="头像" class="avatar" v-if="true" />
        </div>
        <p class="personality-type">ISTJ 物流师</p>
        <p class="description">务实可靠的检查员 | 注重细节与传统 | 追求秩序与责任感的完美主义者</p>
      </div>
    </section>

    <!-- 自我介绍 -->
    <section class="about-card">
      <h2 class="section-title">自我介绍</h2>
      <div class="section-content">
        <p>😊 基础设定·外在形态：日常冰山脸（内心弹幕刷屏中）·社交电量：50% 时间节能模式 / 50% 时间快乐小哥·特殊技能：朋友 emo 时自动触发【人间清醒语录 + 100 种解决方案】✨ 能量表说明 ▷ 满格状态：独奏朋友圈宣传马拉松外星人 / 追魂窝点刺客 ▷ 绝定输出：抗压时反而会变身超冷静的军师 ✓ 虽然经常脑子里想十万个吐槽，但嘴上就是不说 ✓ 被真心对待时会瞬间清空全部隐藏值 / 被真心对待时会默默记得时间日期温度和全部细节 🚩 高危警报 ▷ 到达我的真心选择线！（会立刻启动【记忆粉碎】模块开启全新攻略） ✨ 终极提示卷起来像自动回复动回复机器人？ 泡熬后仲会收获："·24 小时脑洞热线·冷笑话定制服务·永远站你这边的亲友团 要和我一起解锁对话模式吗？</p>
      </div>
    </section>

    <!-- 兴趣爱好 -->
    <section class="about-card">
      <h2 class="section-title">兴趣爱好</h2>
      <div class="section-content">
        <div class="interests">
          <div class="interest-item">
            <div class="interest-icon">
              <img src="../assets/骑车.svg" alt="骑车" class="icon" />
            </div>
            <div class="interest-text">
              <h3>骑行</h3>
              <p>热爱骑行活动，喜欢感受风驰电掣的速度与自由。经常参加周末骑行团，探索城市周边的美丽风景。对各种自行车型号与装备都有深入研究，享受骑行带来的健康与乐趣。</p>
            </div>
          </div>
          <div class="interest-item">
            <div class="interest-icon">
              <img src="../assets/游戏.svg" alt="游戏" class="icon" />
            </div>
            <div class="interest-text">
              <h3>游戏</h3>
              <p>享受沉浸式游戏体验，尤其偏爱策略类和角色扮演游戏，认为游戏是放松心情和锻炼思维的绝佳方式。喜欢研究游戏机制和设计哲学，对游戏开发也有浓厚兴趣。</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 未来规划 -->
    <section class="about-card">
      <h2 class="section-title">未来规划</h2>
      <div class="section-content">
        <div class="timeline">
          <div class="timeline-item">
            <div class="timeline-date">2025</div>
            <div class="timeline-content">
              <h3>找到理想工作</h3>
              <p>计划在2025年找到一份理想的工作，能够充分发挥自己的专业技能，同时有良好的发展空间和学习机会。重点关注以下几个方面：</p>
              <ul>
                <li>技术栈继续深入学习，扩展专业知识面</li>
                <li>积极参与开源项目，提升实战经验</li>
                <li>优化个人作品集，展示核心能力</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 关于本站 -->
    <section class="about-card">
      <h2 class="section-title">关于本站</h2>
      <div class="section-content">
        <div class="site-description">
          <p class="poetic-text">这个角落或许更像一本会呼吸的电子手账本？比起规规矩矩的信息仓库，我更期待它能长出毛茸茸的思考触角。当键盘敲下每个字的时候，仿佛能听见年轮生长的噼啪声 —— 那些忽明忽暗的顿悟、跌跌撞撞的成长，都会变成萤火虫栖息在文字森林里。 如果有天你路过我的秘密基地，欢迎摘走对你胃口的浆果知识！要是碰巧喜欢这片苔藓铺就的页面，要不要考虑留下小脚印和我交换糖果呀？</p>
        </div>
        
        <h3 class="content-subtitle">博客内容</h3>
        <div class="content-categories">
          <div class="category-item">
            <h4>个人美化分享</h4>
            <p>美化、短代码应用等</p>
          </div>
          <div class="category-item">
            <h4>个人思考</h4>
            <p>职场经历、心态变化、适应过程</p>
          </div>
          <div class="category-item">
            <h4>兴趣探索</h4>
            <p>旅游、书籍、设计等</p>
          </div>
          <div class="category-item">
            <h4>随笔记录</h4>
            <p>生活感悟、以及不定期的碎碎念</p>
          </div>
        </div>
        
        <h3 class="content-subtitle">技术细节</h3>
        <p>本站使用Vue+Node.js(Express)+Pinia+Ant Design的技术栈构建，前端采用Vue实现响应式交互体验，Pinia管理状态，UI组件基于Ant Design美化定制，后端通过Express提供API支持。喜欢动手实现一些有趣的功能和动效，就像这个页面一样！</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
// 可以在这里导入需要的组件或数据
import '../assets/骑车.svg';
import '../assets/游戏.svg';
</script>

<style scoped>
.about-container {
  max-width: 1200px;
  margin: 80px auto 0;
  padding: 20px;
}

.about-card {
  background-color: var(--background-topbar);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 30px;
}

.section-title {
  font-size: 1.5rem;
  color: var(--text-color);
  margin-bottom: 15px;
  position: relative;
  padding-bottom: 10px;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 50px;
  height: 3px;
  background-color: var(--green-600);
}

.text-center {
  text-align: center;
}

.text-center::after {
  left: 50%;
  transform: translateX(-50%);
}

.section-content {
  color: var(--gray-600);
  line-height: 1.6;
}

.avatar-container {
  margin: 20px auto;
}

.avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
}

.personality-type {
  font-size: 1.2rem;
  font-weight: bold;
  margin: 10px 0;
  color: var(--text-color);
}

.description {
  color: var(--gray-500);
  font-size: 0.9rem;
}

.interests {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.interest-item {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding: 15px;
  border-radius: 8px;
  transition: background-color 0.3s;
}

.interest-item:hover {
  background-color: rgba(0, 0, 0, 0.03);
}

.interest-icon {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background-color: var(--gray-100);
  padding: 12px;
}

.interest-icon .icon {
  width: 100%;
  height: 100%;
}

.interest-text h3 {
  font-size: 1.1rem;
  margin-bottom: 8px;
  color: var(--text-color);
}

.interest-text p {
  margin: 0;
  font-size: 0.95rem;
  color: var(--gray-600);
}

/* 关于本站样式 */
.poetic-text {
  font-style: italic;
  line-height: 1.8;
  color: var(--gray-600);
  border-left: 3px solid var(--green-600);
  padding-left: 15px;
  margin-bottom: 25px;
}

.content-subtitle {
  font-size: 1.2rem;
  color: var(--text-color);
  margin-top: 25px;
  margin-bottom: 15px;
  position: relative;
}

.content-subtitle::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 30px;
  height: 2px;
  background-color: var(--green-600);
}

.content-categories {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 25px;
}

.category-item {
  background-color: var(--gray-100);
  border-radius: 6px;
  padding: 15px;
  transition: transform 0.3s, box-shadow 0.3s;
}

.category-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.category-item h4 {
  font-size: 1rem;
  color: var(--text-color);
  margin-top: 0;
  margin-bottom: 8px;
}

.category-item p {
  font-size: 0.9rem;
  margin: 0;
  color: var(--gray-600);
}

/* 深色模式适配 */
[data-theme="dark"] .interest-item:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

[data-theme="dark"] .interest-icon .icon {
  filter: invert(0.8);
}

[data-theme="dark"] .category-item:hover {
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}
</style>