<!--
  懒加载图片组件
  支持懒加载、缓存管理、渐进式加载、错误处理
-->
<template>
  <div 
    ref="imageContainerRef"
    class="lazy-image-container"
    :class="{ 
      'is-loading': isLoading, 
      'is-error': hasError,
      'is-loaded': isLoaded 
    }"
    :style="containerStyle"
  >
    <!-- 占位符 -->
    <div 
      v-if="showPlaceholder" 
      class="lazy-image-placeholder"
    >
      <slot name="placeholder">
        <div class="default-placeholder">
          <div class="placeholder-icon">📷</div>
        </div>
      </slot>
    </div>
    
    <!-- 实际图片 -->
    <img
      v-show="isLoaded && !hasError"
      ref="imageRef"
      class="lazy-image"
      :src="currentSrc"
      :alt="alt"
      :loading="nativeLoading ? 'lazy' : 'eager'"
      @load="handleLoad"
      @error="handleError"
    />
    
    <!-- 错误状态 -->
    <div 
      v-if="hasError" 
      class="lazy-image-error"
    >
      <slot name="error">
        <div class="default-error">
          <div class="error-icon">❌</div>
          <div class="error-text">加载失败</div>
          <button 
            v-if="allowRetry" 
            class="retry-button"
            @click="retry"
          >
            重试
          </button>
        </div>
      </slot>
    </div>
    
    <!-- 加载指示器 -->
    <div 
      v-if="isLoading && !showPlaceholder" 
      class="lazy-image-loading"
    >
      <slot name="loading">
        <div class="default-loading">
          <div class="loading-spinner"></div>
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useMemoryManagement } from '../../composables/useMemoryManagement'

interface LazyImageProps {
  // 图片URL
  src: string
  // 低质量预览URL（可选）
  placeholder?: string
  // alt文本
  alt?: string
  // 容器宽度
  width?: number | string
  // 容器高度
  height?: number | string
  // 是否启用原生懒加载
  nativeLoading?: boolean
  // 是否启用自定义懒加载（交叉观察器）
  lazyLoading?: boolean
  // 懒加载的根边距（提前多少像素开始加载）
  rootMargin?: string
  // 是否允许重试
  allowRetry?: boolean
  // 最大重试次数
  maxRetries?: number
  // 重试延迟（毫秒）
  retryDelay?: number
  // 淡入动画持续时间（毫秒）
  fadeDuration?: number
  // 是否启用缓存
  enableCache?: boolean
}

const props = withDefaults(defineProps<LazyImageProps>(), {
  alt: '',
  nativeLoading: true,
  lazyLoading: true,
  rootMargin: '50px',
  allowRetry: true,
  maxRetries: 3,
  retryDelay: 1000,
  fadeDuration: 300,
  enableCache: true
})

const emit = defineEmits<{
  load: [event: Event]
  error: [event: Event]
  intersect: [isIntersecting: boolean]
}>()

// 内存管理
const memoryManager = useMemoryManagement({
  componentName: 'LazyImage',
  trackEventListeners: true,
  trackObservers: true,
  autoCleanup: true
})

// 引用
const imageContainerRef = ref<HTMLElement>()
const imageRef = ref<HTMLImageElement>()

// 状态
const isLoading = ref(false)
const isLoaded = ref(false)
const hasError = ref(false)
const isIntersecting = ref(false)
const retryCount = ref(0)
const currentSrc = ref('')

// 图片缓存管理
const imageCache = new Map<string, { blob: Blob; url: string; timestamp: number }>()
const CACHE_EXPIRE_TIME = 30 * 60 * 1000 // 30分钟

// 计算属性
const containerStyle = computed(() => {
  const style: Record<string, string> = {}
  
  if (props.width) {
    style.width = typeof props.width === 'number' ? `${props.width}px` : props.width
  }
  if (props.height) {
    style.height = typeof props.height === 'number' ? `${props.height}px` : props.height
  }
  
  return style
})

const showPlaceholder = computed(() => {
  return !isLoaded.value && !hasError.value && (props.placeholder || (!isLoading.value))
})

// 清理过期缓存
const cleanExpiredCache = () => {
  const now = Date.now()
  for (const [key, item] of imageCache.entries()) {
    if (now - item.timestamp > CACHE_EXPIRE_TIME) {
      URL.revokeObjectURL(item.url)
      imageCache.delete(key)
    }
  }
}

// 从缓存获取图片
const getFromCache = (src: string): string | null => {
  const cached = imageCache.get(src)
  if (cached && Date.now() - cached.timestamp < CACHE_EXPIRE_TIME) {
    return cached.url
  }
  return null
}

// 缓存图片
const cacheImage = async (src: string): Promise<string> => {
  try {
    const response = await fetch(src)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    
    imageCache.set(src, {
      blob,
      url,
      timestamp: Date.now()
    })
    
    // 定期清理过期缓存
    if (imageCache.size % 10 === 0) {
      cleanExpiredCache()
    }
    
    return url
  } catch (error) {
    throw error
  }
}

// 加载图片
const loadImage = async () => {
  if (isLoading.value || isLoaded.value) return
  
  isLoading.value = true
  hasError.value = false
  
  try {
    let imageUrl = props.src
    
    // 尝试从缓存获取
    if (props.enableCache) {
      const cachedUrl = getFromCache(props.src)
      if (cachedUrl) {
        imageUrl = cachedUrl
      } else {
        // 缓存图片
        imageUrl = await cacheImage(props.src)
      }
    }
    
    currentSrc.value = imageUrl
    
    // 如果图片已经在DOM中并且已加载，直接触发加载完成
    await nextTick()
    if (imageRef.value?.complete && imageRef.value?.naturalWidth > 0) {
      processLoadSuccess(imageRef.value)
      // 创建一个模拟事件用于emit
      const mockEvent = new Event('load')
      Object.defineProperty(mockEvent, 'target', {
        value: imageRef.value,
        enumerable: true
      })
      emit('load', mockEvent)
    }
    
  } catch (error) {
    console.warn('图片加载失败:', error)
    if (imageRef.value) {
      processLoadError(imageRef.value)
    }
  }
}

// 处理图片加载完成的核心逻辑
const processLoadSuccess = (target: HTMLImageElement) => {
  isLoading.value = false
  isLoaded.value = true
  hasError.value = false
  retryCount.value = 0
  
  // 添加淡入动画
  if (target && props.fadeDuration > 0) {
    target.style.transition = `opacity ${props.fadeDuration}ms ease-in-out`
    target.style.opacity = '1'
  }
}

// 处理图片加载错误的核心逻辑
const processLoadError = (target: HTMLImageElement) => {
  isLoading.value = false
  hasError.value = true
  
  // 从缓存中移除失败的图片
  if (props.enableCache && imageCache.has(props.src)) {
    const cached = imageCache.get(props.src)!
    URL.revokeObjectURL(cached.url)
    imageCache.delete(props.src)
  }
}

// 处理图片加载完成（Event版本）
const handleLoad = (event: Event) => {
  const target = event.target as HTMLImageElement
  processLoadSuccess(target)
  emit('load', event)
}

// 处理图片加载错误（Event版本）
const handleError = (event: Event) => {
  const target = event.target as HTMLImageElement
  processLoadError(target)
  emit('error', event)
}

// 重试加载
const retry = () => {
  if (retryCount.value < props.maxRetries) {
    retryCount.value++
    
    memoryManager.setTimeout(() => {
      isLoaded.value = false
      hasError.value = false
      loadImage()
    }, props.retryDelay)
  }
}

// 交叉观察器回调
const intersectionCallback = (entries: IntersectionObserverEntry[]) => {
  const entry = entries[0]
  isIntersecting.value = entry.isIntersecting
  
  emit('intersect', entry.isIntersecting)
  
  if (entry.isIntersecting && !isLoaded.value && !isLoading.value && !hasError.value) {
    loadImage()
  }
}

// 设置交叉观察器
const setupIntersectionObserver = () => {
  if (!props.lazyLoading || !imageContainerRef.value) return
  
  const observer = new IntersectionObserver(intersectionCallback, {
    rootMargin: props.rootMargin,
    threshold: 0.1
  })
  
  memoryManager.createObserver(observer, imageContainerRef.value)
  observer.observe(imageContainerRef.value)
}

// 监听src变化
watch(() => props.src, (newSrc, oldSrc) => {
  if (newSrc !== oldSrc) {
    isLoaded.value = false
    hasError.value = false
    isLoading.value = false
    retryCount.value = 0
    currentSrc.value = ''
    
    if (isIntersecting.value || !props.lazyLoading) {
      loadImage()
    }
  }
})

onMounted(() => {
  if (props.lazyLoading) {
    setupIntersectionObserver()
  } else {
    // 立即加载
    loadImage()
  }
  
  // 设置初始样式
  if (imageRef.value && props.fadeDuration > 0) {
    imageRef.value.style.opacity = '0'
  }
})

// 组件卸载时清理缓存中的URL对象
onBeforeUnmount(() => {
  if (currentSrc.value.startsWith('blob:')) {
    URL.revokeObjectURL(currentSrc.value)
  }
})

// 开发环境下的性能监控
if (import.meta.env.DEV) {
  watch([isLoading, isLoaded, hasError], () => {
    console.log(`🖼️ 懒加载图片状态: loading=${isLoading.value}, loaded=${isLoaded.value}, error=${hasError.value}`)
  })
}
</script>

<style scoped>
.lazy-image-container {
  position: relative;
  display: inline-block;
  overflow: hidden;
  background-color: #f5f5f5;
}

.lazy-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.lazy-image-placeholder,
.lazy-image-error,
.lazy-image-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
}

.default-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #ccc;
}

.placeholder-icon {
  font-size: 2em;
  margin-bottom: 8px;
}

.default-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #ff4d4f;
}

.error-icon {
  font-size: 1.5em;
  margin-bottom: 8px;
}

.error-text {
  font-size: 12px;
  margin-bottom: 8px;
}

.retry-button {
  padding: 4px 8px;
  font-size: 12px;
  border: 1px solid #ff4d4f;
  background: white;
  color: #ff4d4f;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-button:hover {
  background: #ff4d4f;
  color: white;
}

.default-loading {
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #1890ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 状态类 */
.is-loading .lazy-image {
  opacity: 0;
}

.is-loaded .lazy-image {
  opacity: 1;
}

.is-error .lazy-image {
  display: none;
}
</style>