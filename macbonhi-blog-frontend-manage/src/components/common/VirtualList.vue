<!--
  虚拟滚动组件
  用于优化大数据列表渲染性能，减少内存占用
-->
<template>
  <div 
    ref="containerRef" 
    class="virtual-list-container"
    :style="{ height: `${containerHeight}px` }"
    @scroll="handleScroll"
  >
    <!-- 占位容器，用于维持正确的滚动条高度 -->
    <div 
      class="virtual-list-phantom" 
      :style="{ height: `${totalHeight}px` }"
    ></div>
    
    <!-- 可视区域容器 -->
    <div 
      class="virtual-list-content"
      :style="{ transform: `translateY(${offsetY}px)` }"
    >
      <div
        v-for="(item, index) in visibleItems"
        :key="getItemKey(item, startIndex + index)"
        class="virtual-list-item"
        :style="{ height: `${itemHeight}px` }"
      >
        <slot :item="item" :index="startIndex + index"></slot>
      </div>
    </div>
    
    <!-- 加载更多指示器 -->
    <div 
      v-if="loading" 
      class="virtual-list-loading"
      :style="{ transform: `translateY(${totalHeight}px)` }"
    >
      <slot name="loading">
        <div class="loading-spinner">加载中...</div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useMemoryManagement } from '../../composables/useMemoryManagement'

interface VirtualListProps {
  // 数据列表
  items: any[]
  // 每项高度（像素）
  itemHeight: number
  // 容器高度（像素）
  containerHeight: number
  // 缓冲区大小（上下额外渲染的项目数）
  bufferSize?: number
  // 获取项目唯一key的函数
  getItemKey?: (item: any, index: number) => string | number
  // 是否正在加载
  loading?: boolean
  // 是否启用无限滚动
  infiniteScroll?: boolean
  // 触发加载更多的距离阈值
  loadMoreThreshold?: number
}

const props = withDefaults(defineProps<VirtualListProps>(), {
  bufferSize: 5,
  getItemKey: (item: any, index: number) => index,
  loading: false,
  infiniteScroll: false,
  loadMoreThreshold: 100
})

const emit = defineEmits<{
  loadMore: []
  scroll: [scrollTop: number, direction: 'up' | 'down']
}>()

// 内存管理
const memoryManager = useMemoryManagement({
  componentName: 'VirtualList',
  trackEventListeners: true,
  autoCleanup: true
})

// 引用
const containerRef = ref<HTMLElement>()
const scrollTop = ref(0)
const lastScrollTop = ref(0)

// 计算属性
const totalHeight = computed(() => props.items.length * props.itemHeight)

const visibleCount = computed(() => Math.ceil(props.containerHeight / props.itemHeight))

const startIndex = computed(() => {
  const index = Math.floor(scrollTop.value / props.itemHeight) - props.bufferSize
  return Math.max(0, index)
})

const endIndex = computed(() => {
  const index = startIndex.value + visibleCount.value + props.bufferSize * 2
  return Math.min(props.items.length - 1, index)
})

const visibleItems = computed(() => {
  return props.items.slice(startIndex.value, endIndex.value + 1)
})

const offsetY = computed(() => startIndex.value * props.itemHeight)

// 防抖处理滚动事件
let scrollTimeout: number | null = null

// 处理滚动逻辑的核心函数
const updateScrollState = (container: HTMLElement) => {
  const newScrollTop = container.scrollTop
  
  // 防抖处理
  if (scrollTimeout) {
    memoryManager.clearTimeout(scrollTimeout)
  }
  
  scrollTimeout = memoryManager.setTimeout(() => {
    scrollTop.value = newScrollTop
    
    // 确定滚动方向
    const direction = newScrollTop > lastScrollTop.value ? 'down' : 'up'
    lastScrollTop.value = newScrollTop
    
    emit('scroll', newScrollTop, direction)
    
    // 无限滚动检查
    if (props.infiniteScroll && direction === 'down') {
      const remainingHeight = totalHeight.value - newScrollTop - props.containerHeight
      if (remainingHeight <= props.loadMoreThreshold && !props.loading) {
        emit('loadMore')
      }
    }
  }, 16) // 约60fps
}

const handleScroll = (event: Event) => {
  const container = event.target as HTMLElement
  updateScrollState(container)
}

// 滚动到指定索引
const scrollToIndex = (index: number, behavior: ScrollBehavior = 'smooth') => {
  if (!containerRef.value || index < 0 || index >= props.items.length) return
  
  const targetScrollTop = index * props.itemHeight
  containerRef.value.scrollTo({
    top: targetScrollTop,
    behavior
  })
}

// 滚动到顶部
const scrollToTop = (behavior: ScrollBehavior = 'smooth') => {
  scrollToIndex(0, behavior)
}

// 滚动到底部
const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
  scrollToIndex(props.items.length - 1, behavior)
}

// 获取当前可见范围
const getVisibleRange = () => {
  return {
    start: startIndex.value,
    end: endIndex.value,
    count: endIndex.value - startIndex.value + 1
  }
}

// 监听数据变化，重置滚动位置
watch(() => props.items.length, (newLength, oldLength) => {
  // 如果数据长度发生大幅变化，可能需要调整滚动位置
  if (oldLength > 0 && newLength === 0) {
    scrollToTop('auto')
  }
})

// 暴露方法给父组件
defineExpose({
  scrollToIndex,
  scrollToTop,
  scrollToBottom,
  getVisibleRange
})

onMounted(() => {
  // 添加resize监听器来处理容器大小变化
  const resizeObserver = new ResizeObserver(() => {
    nextTick(() => {
      // 容器大小变化时重新计算
      if (containerRef.value) {
        updateScrollState(containerRef.value)
      }
    })
  })
  
  if (containerRef.value) {
    memoryManager.createObserver(resizeObserver)
    resizeObserver.observe(containerRef.value)
  }
})

// 开发环境下的性能监控
if (import.meta.env.DEV) {
  watch([startIndex, endIndex], ([newStart, newEnd]) => {
    console.log(`🔄 虚拟列表渲染范围: ${newStart} - ${newEnd} (共 ${newEnd - newStart + 1} 项)`)
  })
}
</script>

<style scoped>
.virtual-list-container {
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
}

.virtual-list-phantom {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  z-index: 1;
}

.virtual-list-content {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  z-index: 2;
}

.virtual-list-item {
  box-sizing: border-box;
}

.virtual-list-loading {
  position: absolute;
  left: 0;
  right: 0;
  z-index: 3;
  padding: 20px;
  text-align: center;
}

.loading-spinner {
  color: #666;
  font-size: 14px;
}

/* 滚动条样式优化 */
.virtual-list-container::-webkit-scrollbar {
  width: 6px;
}

.virtual-list-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.virtual-list-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.virtual-list-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>