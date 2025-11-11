<template>
    <div class="article-gallery-content">
        <!-- 1. 文章头部：标题、分类、时间和统计数据 -->
        <div class="article-header">
            <h1 class="article-title">{{ displayData.title }}</h1>
            <div class="article-meta">
                <div class="article-info">
                    <span class="article-category">{{ getCategoryName(displayData.subset_id) }}</span>
                    /
                    <span v-if="displayLabels.length > 0" class="article-tags">
                        <span v-for="(labelName, index) in displayLabels" :key="index" class="tag-item">
                            {{ labelName }}
                            <span v-if="index < displayLabels.length - 1"> </span>
                        </span>
                    </span>
                    <span class="article-time">{{ formatDate(displayData.moment) }}</span>
                </div>
                <div class="article-stats">
                    <div class="stat-item">
                        <LikeOutlined :style="{ color: isPraised ? 'var(--red-600)' : 'inherit' }"/>
                        <span :class="{ 'count-change': isCountAnimating }">{{ praiseCount }}</span>
                    </div>
                    <div class="stat-item">
                        <EyeOutlined />
                        <span>{{ displayData.views || 0 }}</span>
                    </div>
                    <div class="stat-item">
                        <MessageOutlined />
                        <span>{{ commentCount }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- 2. 文章简介 -->
        <div class="article-intro">
            <p>{{ displayData.introduce }}</p>
        </div>

        <!-- 3. 文章正文内容 -->
        <div class="article-content" v-html="renderedContent"></div>

        <!-- 4. 签名部分 -->
        <div class="article-signature">
            <img src="../../assets/name.png" alt="作者签名" class="signature-image" />
            <div class="signature-title">{{ displayData.title }}</div>
        </div>

        <!-- 5. 评论区 -->
        <div class="article-comments">
            <Comment :target-id="displayData.id" :target-type="0" />
        </div>

        <!-- 6. 右侧固定功能按钮 -->
        <div class="article-actions">
            <div class="action-btn like-btn" 
                 :class="{'active': isPraised, 'animate': isLikeAnimating}" 
                 @click="handleLikeClick">
                <LikeOutlined :style="{ fontSize: '20px', color: isPraised ? 'var(--red-600)' : 'inherit' }" />
                <div class="action-btn-tooltip">{{ isPraised ? '取消点赞' : '点赞' }}</div>
            </div>
            <div class="action-btn comment-btn" @click="scrollToComments">
                <MessageOutlined :style="{ fontSize: '20px' }" />
                <div class="action-btn-tooltip">评论</div>
            </div>
            <div class="action-btn share-btn" @click="shareArticle">
                <ShareAltOutlined :style="{ fontSize: '20px' }" />
                <div class="action-btn-tooltip">分享</div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { LikeOutlined, EyeOutlined, MessageOutlined, ShareAltOutlined } from '@ant-design/icons-vue';
import Comment from '../comment/comment.vue';
import { useSubsetStore } from '../../store/subset';
import { useLabelStore } from '../../store/label';
import { usePraiseStore } from '../../store/praise';
import { useCommentStore } from '../../store/comment';
import { useUserStore } from '../../store/user';
import { addPraiseApi, cancelPraiseApi, getPraiseStatusApi, getSubsetApi, getLabelApi, updateArticleViewsApi } from '../../api/index';
import { getBrowserFingerprint, savePraisedItem, hasPraisedItem, removePraisedItem } from '../../utils/fingerprint';
import { renderMarkdown } from '../../utils/markdown';

// 初始化store
const subsetStore = useSubsetStore();
const labelStore = useLabelStore();
const praiseStore = usePraiseStore();
const commentStore = useCommentStore();
const userStore = useUserStore();

// 浏览器指纹相关
const browserId = ref<string>('');

// 使用全局状态管理的点赞状态
const isPraised = computed(() => {
  if (!displayData.value.id) return false;
  return praiseStore.getPraiseState(displayData.value.id).isPraised;
});

// 添加评论数量的计算属性
const commentCount = computed(() => {
  if (!displayData.value.id) return 0;
  const globalState = commentStore.getCommentState(displayData.value.id);
  // 优先使用全局状态，如果没有则使用文章数据
  return globalState.count || displayData.value.comments || displayData.value.comment || 0;
});

const praiseCount = computed(() => {
  if (!displayData.value.id) return 0;
  const globalState = praiseStore.getPraiseState(displayData.value.id);
  // 优先使用全局状态，如果没有则使用文章数据
  return globalState.count || displayData.value.praise_count || displayData.value.likes || displayData.value.paraseInt || 0;
});

// 文章数据结构
interface ArticleData {
    id: number;
    title: string;
    category: string;
    subset_id?: number;
    moment: string;
    likes: number;
    views: number;
    comments: number;
    comment?: number;
    paraseInt?: number;
    praise_count?: number; // 添加这个字段
    introduce: string;
    content: string;
    label?: string;
}

// 定义props
const props = defineProps<{
    articleData?: any; // 外部传入的文章数据
}>();

// 示例数据，当没有传入数据时使用
const defaultArticleData = ref<ArticleData>({
    id: 1,
    title: '文章标题',
    category: '旅游',
    moment: new Date().toISOString(),
    likes: 123,
    views: 456,
    comments: 78,
    introduce: '这是文章的简介部分，通常比正文内容简短，并且有不同的背景颜色以区分。',
    content: '<p>这是文章的正文内容。</p><p>可以包含多个段落。</p><img src="https://example.com/image.jpg" alt="示例图片" /><p>还可以继续添加更多内容...</p>'
});

// 使用传入的数据或默认数据
const displayData = computed(() => {
    return props.articleData || defaultArticleData.value;
});

// 检测内容是否为wangEditor的HTML格式
const isWangEditorHTML = (content: string): boolean => {
    return content.includes('<pre>') || content.includes('<code>') || 
           content.includes('<p>') || content.includes('<h1>') || 
           content.includes('<h2>') || content.includes('<h3>');
};

// 后处理wangEditor的HTML代码块，添加语法高亮
const processWangEditorCodeBlocks = async (html: string): Promise<string> => {
    try {
        // 动态导入highlight.js
        const hljs = await import('highlight.js');
        
        // 使用正则表达式匹配代码块
        const codeBlockRegex = /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g;
        
        let processedHtml = html;
        let match;
        
        console.log('🎨 开始处理wangEditor代码块...');
        
        while ((match = codeBlockRegex.exec(html)) !== null) {
            const [fullMatch, language, codeContent] = match;
            
            console.log(`🔧 处理${language}代码块:`, codeContent.substring(0, 100) + '...');
            
            try {
                // 解码HTML实体
                const decodedCode = codeContent
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&amp;/g, '&')
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;/g, "'");
                
                // 使用highlight.js进行语法高亮
                let highlightedCode;
                if (language && hljs.default.getLanguage(language)) {
                    highlightedCode = hljs.default.highlight(decodedCode, { language }).value;
                } else {
                    highlightedCode = hljs.default.highlightAuto(decodedCode).value;
                }
                
                // 创建新的代码块HTML，包含必要的CSS类
                const newCodeBlock = `<pre class="code-block hljs" data-language="${language}"><code class="hljs language-${language}">${highlightedCode}</code></pre>`;
                
                // 替换原始代码块
                processedHtml = processedHtml.replace(fullMatch, newCodeBlock);
                
                console.log(`✅ ${language}代码块处理完成`);
            } catch (error) {
                console.warn(`代码块高亮失败 (${language}):`, error);
                // 保持原样，但添加必要的CSS类
                const fallbackCodeBlock = `<pre class="code-block hljs" data-language="${language}"><code class="hljs language-${language}">${codeContent}</code></pre>`;
                processedHtml = processedHtml.replace(fullMatch, fallbackCodeBlock);
            }
        }
        
        console.log('✅ wangEditor代码块处理完成');
        return processedHtml;
        
    } catch (error) {
        console.error('处理wangEditor代码块失败:', error);
        return html; // 返回原始HTML
    }
};

// 响应式的处理后内容
const processedContent = ref<string>('');

// 渲染后的内容（智能检测格式）
const renderedContent = computed(() => {
    const content = displayData.value.content;
    if (!content) return '';
    
    // 🔧 智能检测内容格式
    if (isWangEditorHTML(content)) {
        console.log('📝 检测到wangEditor HTML格式，跳过markdown渲染');
        console.log('📄 文章标题:', displayData.value.title);
        
        // 如果有处理后的内容，使用处理后的内容，否则使用原始内容
        return processedContent.value || content;
    } else {
        // 如果是markdown格式，使用markdown渲染器
        console.log('📝 检测到Markdown格式，使用markdown渲染器');
        try {
            return renderMarkdown(content);
        } catch (error) {
            console.error('Markdown渲染失败:', error);
            return content;
        }
    }
});

// 监听内容变化，异步处理代码块
watch(
    () => displayData.value.content,
    async (newContent) => {
        if (!newContent) return;
        
        // 检查是否为wangEditor HTML格式且包含代码块
        if (isWangEditorHTML(newContent) && 
            newContent.includes('<pre>') && 
            newContent.includes('class="language-')) {
            
            console.log('🎨 异步处理wangEditor代码块...');
            try {
                const processed = await processWangEditorCodeBlocks(newContent);
                processedContent.value = processed;
                console.log('✅ 代码块异步处理完成');
            } catch (error) {
                console.error('异步处理代码块失败:', error);
                processedContent.value = newContent; // 回退到原始内容
            }
        } else {
            // 清空处理后的内容
            processedContent.value = '';
        }
    },
    { immediate: true }
);

// 获取分类名称
const getCategoryName = (subsetId: string | number | undefined): string => {
    if (!subsetId || subsetId === 0) return '未分类';
    const numericId = typeof subsetId === 'string' ? parseInt(subsetId) : subsetId;
    
    // 🔥 修复：根据文章类型获取对应的分类数据
    // 先尝试从文章分类中查找
    let name = subsetStore.subsetName(numericId, 0);
    if (name !== '未分类') return String(name);
    
    // 再尝试从图库分类中查找
    name = subsetStore.subsetName(numericId, 1);
    if (name !== '未分类') return String(name);
    
    // 最后尝试从当前活动分类中查找（兼容旧数据）
    name = subsetStore.subsetName(numericId);
    return String(name);
};

// 获取标签名称
const getLabelNameById = (labelId: string | number): string => {
    const label = labelStore.data.find(item => item.id == Number(labelId));
    return label ? String(label.label_name) : `标签${labelId}`;
};

// 处理标签字符串并返回标签名称数组
const displayLabels = computed(() => {
    if (!displayData.value.label) return [];
    
    const labelString = String(displayData.value.label);
    const labelIds = labelString.split(',').map(id => id.trim()).filter(id => id);
    
    return labelIds.map(id => getLabelNameById(id));
});

// 格式化日期
const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

// 获取文章数据
const fetchArticleData = async (id: number) => {
    try {
        // articleData.value = await api.getArticleById(id);
    } catch (error) {
        console.error('获取文章数据失败', error);
    }
};

// 🔥 新增：加载分类和标签数据
const loadSubsetsAndLabels = async () => {
    try {
        console.log('📊 content: 开始加载分类和标签数据...');
        
        // 并行加载文章分类、图库分类和标签数据
        await Promise.all([
            loadSubsets(0), // 文章分类
            loadSubsets(1), // 图库分类
            loadLabels()    // 标签数据
        ]);
        
        console.log('✅ 分类和标签数据加载完成');
    } catch (error) {
        console.error('❌ 加载分类和标签数据失败:', error);
    }
};

// 加载指定类型的分类数据
const loadSubsets = async (classify: number) => {
    try {
        const request = {
            token: userStore.token || 'guest',
            classify
        };
        
        const res = await getSubsetApi(request);
        if (res && res.code === 200) {
            subsetStore.updateSubsetsByType(classify, res.data.list || [], res.data.count || 0);
            console.log(`📂 ${classify === 0 ? '文章' : '图库'}分类数据加载成功:`, res.data.list?.length || 0, '个分类');
        }
    } catch (error) {
        console.error(`加载${classify === 0 ? '文章' : '图库'}分类失败:`, error);
    }
};

// 加载标签数据
const loadLabels = async () => {
    try {
        const request = {
            token: userStore.token || 'guest'
        };
        
        const res = await getLabelApi(request);
        if (res && res.code === 200) {
            labelStore.data = res.data || [];
            console.log('🏷️ 标签数据加载成功:', labelStore.data.length, '个标签');
        }
    } catch (error) {
        console.error('加载标签数据失败:', error);
    }
};

// 🔥 新增：增加浏览量
const increaseViewCount = async () => {
    if (!displayData.value.id) return;
    
    try {
        const request = {
            token: userStore.token || 'guest',
            article_id: displayData.value.id
        };
        
        const res = await updateArticleViewsApi(request);
        if (res && res.code === 200) {
            console.log('👁️ 浏览量增加成功, 文章ID:', displayData.value.id);
            // 可以选择更新本地显示的浏览量
            if (res.data && res.data.new_view_count) {
                // 如果后端返回了新的浏览量，更新本地数据
                displayData.value.view = res.data.new_view_count;
            }
        }
    } catch (error) {
        console.error('增加浏览量失败:', error);
    }
};

// 点赞数变化动画控制
const isCountAnimating = ref(false);

// 更新点赞函数
const togglePraise = async () => {
    if (!displayData.value.id || !browserId.value) {
        console.error('缺少必要参数，无法执行点赞操作');
        return;
    }
    
    try {
        const currentState = praiseStore.getPraiseState(displayData.value.id);
        const previousCount = currentState.count;
        const previousPraisedState = currentState.isPraised;
        
        
        if (currentState.isPraised) {
         
            // 乐观更新：先更新全局状态
            const optimisticCount = Math.max(0, previousCount - 1);
            praiseStore.togglePraiseStatus(displayData.value.id, false, optimisticCount);
            removePraisedItem(0, displayData.value.id);
            
            // 取消点赞
            const response = await cancelPraiseApi({
                browser_id: browserId.value,
                target_id: displayData.value.id,
                target_type: 0
            });
            
            // 类型断言处理API响应
            const res = response as unknown as { code: number; data?: any; message?: string };
            
            if (res.code === 200 && res.data) {
                // 使用服务器返回的准确数据更新全局状态
                const finalCount = res.data.count !== undefined ? res.data.count : optimisticCount;
                praiseStore.togglePraiseStatus(displayData.value.id, false, finalCount);
                
                // 添加数字变化动画
                if (previousCount !== finalCount) {
                    isCountAnimating.value = true;
                    setTimeout(() => {
                        isCountAnimating.value = false;
                    }, 600);
                }
                
            } else {
                // 如果API失败，恢复状态
                console.error('取消点赞失败，回滚状态');
                praiseStore.togglePraiseStatus(displayData.value.id, previousPraisedState, previousCount);
                if (previousPraisedState) {
                    savePraisedItem(0, displayData.value.id);
                }
            }
        } else {

            // 先更新全局状态
            const optimisticCount = previousCount + 1;
            praiseStore.togglePraiseStatus(displayData.value.id, true, optimisticCount);
            savePraisedItem(0, displayData.value.id);
            
            // 添加点赞
            const response = await addPraiseApi({
                browser_id: browserId.value,
                target_id: displayData.value.id,
                target_type: 0
            });
            
            // 类型断言处理API响应
            const res = response as unknown as { code: number; data?: any; message?: string };
            
            
            if (res.code === 200 && res.data) {
                // 使用服务器返回的准确数据更新全局状态
                const finalCount = res.data.count !== undefined ? res.data.count : optimisticCount;
                praiseStore.togglePraiseStatus(displayData.value.id, true, finalCount);
                
                // 添加数字变化动画
                if (previousCount !== finalCount) {
                    isCountAnimating.value = true;
                    setTimeout(() => {
                        isCountAnimating.value = false;
                    }, 300);
                }

            } else {
                // 如果API失败，恢复状态
                console.error('添加点赞失败，回滚状态');
                praiseStore.togglePraiseStatus(displayData.value.id, previousPraisedState, previousCount);
                if (!previousPraisedState) {
                    removePraisedItem(0, displayData.value.id);
                }
            }
        }
    } catch (error) {
        console.error('文章点赞操作失败:', error);
    }
};

// 评论区滚动
const commentsRef = ref(null);
const scrollToComments = () => {
    const commentsEl = document.querySelector('.article-comments');
    if (commentsEl) {
        commentsEl.scrollIntoView({ behavior: 'smooth' });
    }
};

// 分享文章
const shareArticle = () => {
    // 检查浏览器是否支持分享API
    if (navigator.share) {
        navigator.share({
            title: displayData.value.title,
            text: displayData.value.introduce,
            url: window.location.href
        }).catch(error => {
            console.error('分享失败:', error);
        });
    } else {
        // 复制链接到剪贴板
        const dummyInput = document.createElement('input');
        document.body.appendChild(dummyInput);
        dummyInput.value = window.location.href;
        dummyInput.select();
        document.execCommand('copy');
        document.body.removeChild(dummyInput);
        
        // 可以添加一个简单的提示
        alert('链接已复制到剪贴板');
    }
};

// 点赞动画控制
const isLikeAnimating = ref(false);

// 防抖函数
function debounce(fn: Function, delay: number) {
  let timer: number | null = null;
  return function(this: any, ...args: any[]) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
      timer = null;
    }, delay) as unknown as number;
  };
}

// 防抖处理的点赞切换
const debouncedTogglePraise = debounce(async () => {
    await togglePraise();
}, 100);

// 点赞按钮点击处理
const handleLikeClick = () => {
    isLikeAnimating.value = true;
    debouncedTogglePraise();
    setTimeout(() => {
        isLikeAnimating.value = false;
    }, 1000); // 动画持续时间
};

// 监听全局点赞状态变化
watch(
  () => displayData.value.id ? praiseStore.getPraiseState(displayData.value.id) : null,
  (newState) => {
    if (newState) {
    }
  },
  { deep: true }
);

// 复制代码功能
const copyCodeToClipboard = async (code: string) => {
    try {
        await navigator.clipboard.writeText(code);
        // 可以添加一个成功提示
        console.log('代码已复制到剪贴板');
        // 如果需要，可以添加一个toast提示
    } catch (err) {
        // 降级方案
        const textArea = document.createElement('textarea');
        textArea.value = code;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        console.log('代码已复制到剪贴板（降级方案）');
    }
};

// 为代码块添加复制事件监听器
const setupCodeCopyListeners = () => {
    // 选择所有可能的代码块：.code-block, pre.hljs, 或者包含 code 的 pre
    const allPres = document.querySelectorAll('.article-content pre');
    const codeBlocks = Array.from(allPres).filter(pre => 
        pre.classList.contains('code-block') || 
        pre.classList.contains('hljs') || 
        pre.querySelector('code')
    );
    codeBlocks.forEach((block, index) => {
        // 移除之前的监听器
        const oldHandler = (block as any)._copyHandler;
        if (oldHandler) {
            block.removeEventListener('click', oldHandler);
        }
        
        // 创建新的点击处理器
        const copyHandler = (e: Event) => {
            // 检查点击的是否是复制按钮区域
            const rect = block.getBoundingClientRect();
            const clickX = (e as MouseEvent).clientX;
            const clickY = (e as MouseEvent).clientY;
            
            // 复制按钮在右上角 32x28 区域
            const buttonX = rect.right - 44;
            const buttonY = rect.top + 12;
            
            if (clickX >= buttonX && clickX <= buttonX + 32 && 
                clickY >= buttonY && clickY <= buttonY + 28) {
                e.stopPropagation();
                const codeElement = block.querySelector('code');
                if (codeElement) {
                    const code = codeElement.textContent || '';
                    copyCodeToClipboard(code);
                    
                    // 临时改变按钮文字为"已复制"
                    const originalAfter = window.getComputedStyle(block, '::after').content;
                    (block as HTMLElement).style.setProperty('--copy-text', '"✅"');
                    setTimeout(() => {
                        (block as HTMLElement).style.removeProperty('--copy-text');
                    }, 1000);
                }
            }
        };
        
        // 存储处理器引用以便后续清理
        (block as any)._copyHandler = copyHandler;
        block.addEventListener('click', copyHandler);
    });
};

onMounted(async () => {
    // 🔥 新增：加载分类和标签数据
    await loadSubsetsAndLabels();
    
    // 获取浏览器指纹
    try {
        browserId.value = await getBrowserFingerprint();
    } catch (error) {
        console.error('获取浏览器指纹失败:', error);
    }
    
    // 假设我们从URL或props中获取文章ID
    const articleId = props.articleData?.id || 1; 
    fetchArticleData(articleId);
    
    // 🔥 新增：增加浏览量（延迟执行，确保页面加载完成）
    setTimeout(() => {
        increaseViewCount();
    }, 1000);
    
    // 设置初始点赞数到全局状态
    const initialCount = displayData.value.praise_count || displayData.value.likes || displayData.value.paraseInt || 0;
    
    // 首先检查本地存储是否有点赞记录
    if (displayData.value.id) {
        const isLocalPraised = hasPraisedItem(0, displayData.value.id);
        // 设置到全局状态
        praiseStore.setPraiseState(displayData.value.id, initialCount, isLocalPraised);
    }
    
    // 然后从服务器获取点赞状态
    if (displayData.value.id && browserId.value) {
        try {
            const response = await getPraiseStatusApi({
                browser_id: browserId.value,
                target_id: displayData.value.id,
                target_type: 0 // 0表示文章
            });
            
            // 类型断言处理API响应
            const res = response as unknown as { code: number; data?: any; message?: string };
            
            
            if (res.code === 200) {
                // 更新全局状态
                praiseStore.setPraiseState(displayData.value.id, res.data.count, res.data.is_praised);
                
                // 根据服务器返回的状态更新本地存储
                if (res.data.is_praised) {
                    savePraisedItem(0, displayData.value.id);
                } else {
                    removePraisedItem(0, displayData.value.id);
                }
                
            }
        } catch (error) {
            console.error('获取文章点赞状态失败:', error);
            // 如果服务器获取失败，保留本地存储的状态
        }
    }
    
    // 🔥 新增：设置代码复制功能
    // 延迟执行确保DOM已渲染
    setTimeout(() => {
        setupCodeCopyListeners();
    }, 500);
});

// 监听渲染内容变化，设置复制监听器
watch(renderedContent, () => {
    // 等待DOM更新后重新设置监听器
    setTimeout(() => {
        setupCodeCopyListeners();
    }, 100);
});
</script>

<style scoped>
.article-gallery-content {
    position: relative;
    width: 68%; /* 100% - 左右各16% = 68% */
    margin: 2.2% auto 0;
    padding: 0;
    background-color: var(--background-topbar);
    border-radius: 16px;
}

/* 1. 文章头部样式 */
.article-header {
    margin-bottom: 24px;
}

.article-title {
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 16px;
    color: var(--text-color);
}

.article-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.article-info {
    display: flex;
    gap:8px;
    color: var(--gray-500);
    font-size: 14px;
    align-items: center;
    justify-content: center;
}

.article-stats {
    display: flex;
    gap: 16px;
}

.stat-item {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--gray-500);
    font-size: 14px;
}

/* 2. 文章简介样式 */
.article-intro {
    padding: 16px;
    background-color: var(--gray-100)!important;
    border-radius: 8px;
    margin-bottom: 24px;
    color: var(--gray-700);
    font-size: 16px;
    line-height: 1.6;
    text-align: center;
}

[data-theme="dark"] .article-intro {
    background-color: var(--gray-800);
    color: var(--gray-300);
}

/* 3. 文章内容样式 */

.article-content {
    margin: 40px auto 152px;
    width: 75%;
    font-size: 16px;
    line-height: 28px;
    color: var(--text-color);
}

/* 使用深度选择器为 v-html 内容设置样式 */
.article-content :deep(img) {
    width: 90%;
    height: 30%;
    max-height: 30%; /* 限制最大高度 */
    border-radius: 8px;
    margin: 20px auto;
    display: block;
    object-fit: contain;
    /* 添加阴影效果让图片更突出 */
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    /* 添加过渡效果 */
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

/* 图片悬停效果 */
.article-content :deep(img:hover) {
    transform: scale(1.02);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

/* 深色模式下的图片样式 */
[data-theme="dark"] .article-content :deep(img) {
    box-shadow: 0 4px 12px rgba(255, 255, 255, 0.1);
}

[data-theme="dark"] .article-content :deep(img:hover) {
    box-shadow: 0 6px 20px rgba(255, 255, 255, 0.15);
}

.article-content :deep(p) {
    margin-bottom: 16px;
}

/* 响应式图片处理 */
@media (max-width: 768px) {
    .article-content :deep(img) {
        margin: 16px auto;
        max-height: 300px;
        min-height: 150px;
    }
}

@media (max-width: 480px) {
    .article-content :deep(img) {
        margin: 12px auto;
        max-height: 250px;
        min-height: 120px;
    }
}

/* 4. 签名部分样式 */
.article-signature {
    text-align: center;
    margin: 48px 0;
    padding: 24px 0;
    border-bottom: 1px solid var(--gray-200);
}

.signature-image {
    max-width: 200px;
    height: auto;
    margin-bottom: 16px;
    opacity: 0.8;
}

[data-theme="dark"] .signature-image {
    filter: invert(0.8);
    opacity: 0.7;
}

.signature-title {
    font-weight: 600;
    font-size: 24px;
    line-height: 33px;
    color: var(--text-color);
}

/* 5. 评论区样式 */
.article-comments {
    margin-top: 48px;
}

/* 6. 右侧固定功能按钮样式 */
.article-actions {
    position: fixed;
    right: 24px;
    bottom: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    z-index: 10;
}

.action-btn {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background-color: var(--background-topbar);
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: all 0.3s ease;
    color: var(--gray-600);
    position: relative;
}

.action-btn:hover {
    background-color: var(--blue-100);
    color: var(--blue-600);
    transform: scale(1.05);
}

[data-theme="dark"] .action-btn {
    background-color: var(--gray-800);
    color: var(--gray-300);
}

[data-theme="dark"] .action-btn:hover {
    background-color: var(--blue-900);
    color: var(--blue-400);
}

/* 响应式布局 */
@media (max-width: 768px) {
    .article-actions {
        position: fixed;
        bottom: 24px;
        right: 24px;
        top: auto;
        transform: none;
        flex-direction: row;
    }
}

/* 文章标签样式 */
.article-tags {
    display: inline-flex;
    align-items: center;
    flex-wrap: wrap;
}

.tag-item {
    color: var(--blue-600);
    font-weight: 500;
    margin-right: 4px;
}

[data-theme="dark"] .tag-item {
    color: var(--blue-400);
}

/* 添加点赞按钮激活状态样式和动画 */
.action-btn.like-btn.active {
    background-color: var(--pink-100);
    color: var(--red-600);
    box-shadow: 0 2px 10px rgba(255, 0, 0, 0.1);
}

[data-theme="dark"] .action-btn.like-btn.active {
    background-color: rgba(255, 0, 0, 0.2);
    color: var(--red-400);
    box-shadow: 0 2px 10px rgba(255, 0, 0, 0.2);
}

/* 点赞动画效果 */
@keyframes likeAnimation {
    0% {
        transform: scale(1);
    }
    25% {
        transform: scale(1.3);
    }
    50% {
        transform: scale(0.9);
    }
    75% {
        transform: scale(1.2);
    }
    100% {
        transform: scale(1);
    }
}

.action-btn.like-btn.animate {
    animation: likeAnimation 0.8s ease forwards;
}

/* 点赞数变化动画 */
@keyframes countChange {
    0% {
        transform: translateY(0);
        opacity: 1;
    }
    20% {
        transform: translateY(-10px);
        opacity: 0;
    }
    40% {
        transform: translateY(10px);
        opacity: 0;
    }
    60% {
        transform: translateY(0);
        opacity: 1;
    }
}

/* 按钮工具提示 */
.action-btn-tooltip {
    position: absolute;
    right: 60px;
    top: 50%;
    transform: translateY(-50%);
    background-color: var(--background-topbar);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
    color: var(--text-color);
}

.action-btn:hover .action-btn-tooltip {
    opacity: 1;
    visibility: visible;
    right: 65px;
}

[data-theme="dark"] .action-btn-tooltip {
    background-color: var(--gray-800);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

/* 点赞数动画 */
.count-change {
    animation: countChange 0.6s ease-in-out;
}

@keyframes countChange {
    0% {
        transform: translateY(0);
        opacity: 1;
    }
    20% {
        transform: translateY(-10px);
        opacity: 0;
    }
    40% {
        transform: translateY(10px);
        opacity: 0;
    }
    60% {
        transform: translateY(0);
        opacity: 1;
    }
}

/* ===== Markdown渲染样式 ===== */

/* 标题样式 */
.article-content :deep(.md-h1),
.article-content :deep(h1) {
    font-size: 2em;
    font-weight: 700;
    margin: 1.5em 0 0.5em 0;
    padding-bottom: 0.3em;
    border-bottom: 2px solid var(--gray-200);
    color: var(--text-color);
}

.article-content :deep(.md-h2),
.article-content :deep(h2) {
    font-size: 1.75em;
    font-weight: 600;
    margin: 1.3em 0 0.5em 0;
    padding-bottom: 0.2em;
    border-bottom: 1px solid var(--gray-200);
    color: var(--text-color);
}

.article-content :deep(.md-h3),
.article-content :deep(h3) {
    font-size: 1.5em;
    font-weight: 600;
    margin: 1.2em 0 0.5em 0;
    color: var(--text-color);
}

.article-content :deep(h4) {
    font-size: 1.25em;
    font-weight: 600;
    margin: 1em 0 0.5em 0;
    color: var(--text-color);
}

/* 代码块样式 - 亮色模式使用深色样式，深色模式使用浅色样式 */
.article-content :deep(.code-block),
.article-content :deep(pre),
.article-content :deep(pre.hljs),
.article-content :deep(.hljs),
.article-content :deep(pre[class*="language-"]),
.article-content :deep(code[class*="language-"]),
.article-content :deep(pre code.language-javascript),
.article-content :deep(pre code.language-typescript),
.article-content :deep(pre code.language-python),
.article-content :deep(pre code.language-css),
.article-content :deep(pre code.language-html),
.article-content :deep(pre code.language-json) {
    /* 亮色模式：使用深色样式 */
    background: #1e1e1e !important;
    color: #d4d4d4 !important;
    padding: 3rem 2rem 2rem 2rem !important; /* 🔧 调整内边距：顶部3rem为语言标签留出空间，左右2rem，底部2rem */
    border-radius: 8px !important;
    margin: 1.5rem 0 !important;
    overflow-x: auto !important;
    position: relative !important;
    border: 1px solid #333333 !important;
    /* 🔧 移除阴影 */
    box-shadow: none !important;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace !important;
    font-size: 14px !important;
    line-height: 1.5 !important;
    white-space: pre !important;
    tab-size: 4 !important;
    
    /* 确保覆盖所有可能的外部样式 */
    text-shadow: none !important;
    font-weight: 400 !important;
    letter-spacing: normal !important;
}

/* 深色模式：使用浅色样式 */
[data-theme="dark"] .article-content :deep(.code-block),
[data-theme="dark"] .article-content :deep(pre),
[data-theme="dark"] .article-content :deep(pre.hljs),
[data-theme="dark"] .article-content :deep(.hljs),
[data-theme="dark"] .article-content :deep(pre[class*="language-"]),
[data-theme="dark"] .article-content :deep(code[class*="language-"]),
[data-theme="dark"] .article-content :deep(pre code.language-javascript),
[data-theme="dark"] .article-content :deep(pre code.language-typescript),
[data-theme="dark"] .article-content :deep(pre code.language-python),
[data-theme="dark"] .article-content :deep(pre code.language-css),
[data-theme="dark"] .article-content :deep(pre code.language-html),
[data-theme="dark"] .article-content :deep(pre code.language-json) {
    /* 深色模式：使用浅色样式 */
    background: #f8f8f8 !important;
    color: #333333 !important;
    border: 1px solid #e0e0e0 !important;
    box-shadow: none !important;
    padding: 3rem 2rem 2rem 2rem !important; /* 🔧 深色模式也使用相同的内边距 */
}

/* wangEditor原始代码块的直接子选择器样式 - 亮色模式 */
.article-content :deep(pre > code.language-javascript),
.article-content :deep(pre > code.language-typescript),
.article-content :deep(pre > code.language-python),
.article-content :deep(pre > code.language-css),
.article-content :deep(pre > code.language-html),
.article-content :deep(pre > code.language-json) {
    display: block !important;
    width: 100% !important;
    background: transparent !important;
    color: #d4d4d4 !important; /* 亮色模式：深色文字 */
    padding: 0 !important;
    margin: 0 !important;
    border: none !important;
    border-radius: 0 !important;
    font-family: inherit !important;
    font-size: inherit !important;
    line-height: inherit !important;
}

/* wangEditor原始代码块的直接子选择器样式 - 深色模式 */
[data-theme="dark"] .article-content :deep(pre > code.language-javascript),
[data-theme="dark"] .article-content :deep(pre > code.language-typescript),
[data-theme="dark"] .article-content :deep(pre > code.language-python),
[data-theme="dark"] .article-content :deep(pre > code.language-css),
[data-theme="dark"] .article-content :deep(pre > code.language-html),
[data-theme="dark"] .article-content :deep(pre > code.language-json) {
    color: #333333 !important; /* 深色模式：浅色文字 */
}

/* 确保wangEditor的pre标签样式与主题匹配 */
.article-content :deep(pre) {
    background: #1e1e1e !important; /* 亮色模式：深色背景 */
    color: #d4d4d4 !important;
    padding: 3rem 2rem 2rem 2rem !important; /* 🔧 确保pre标签也有正确的内边距 */
}

[data-theme="dark"] .article-content :deep(pre) {
    background: #f8f8f8 !important; /* 深色模式：浅色背景 */
    color: #333333 !important;
    padding: 3rem 2rem 2rem 2rem !important; /* 🔧 深色模式pre标签内边距 */
}

/* 复制按钮 - 亮色模式（深色按钮） */
.article-content :deep(.code-block::after),
.article-content :deep(pre.hljs::after),
.article-content :deep(pre::after) {
    content: var(--copy-text, '📋 Copy');
    position: absolute;
    top: 8px; /* 🔧 调整顶部位置，与语言标签保持一致 */
    right: 16px; /* 🔧 调整右侧位置适应新的内边距 */
    padding: 6px 12px;
    background: rgba(30, 30, 30, 0.9) !important;
    border: 1px solid #555555 !important;
    border-radius: 4px !important;
    color: #ffffff !important;
    font-size: 12px !important;
    font-family: 'Consolas', monospace !important;
    cursor: pointer !important;
    opacity: 0.8 !important;
    transition: all 0.2s ease !important;
    backdrop-filter: blur(8px) !important;
    z-index: 10 !important;
    user-select: none !important;
    white-space: nowrap !important;
    text-align: center !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
}

/* 复制按钮 - 深色模式（浅色按钮） */
[data-theme="dark"] .article-content :deep(.code-block::after),
[data-theme="dark"] .article-content :deep(pre.hljs::after),
[data-theme="dark"] .article-content :deep(pre::after) {
    background: rgba(248, 248, 248, 0.9) !important;
    border: 1px solid #d0d0d0 !important;
    color: #333333 !important;
}

/* 复制按钮hover效果 - 亮色模式 */
.article-content :deep(.code-block:hover::after),
.article-content :deep(pre.hljs:hover::after),
.article-content :deep(pre:hover::after) {
    opacity: 1 !important;
    background: rgba(0, 122, 255, 0.8) !important;
    border-color: #007acc !important;
    transform: translateY(-1px) !important;
    box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3) !important;
}

/* 复制按钮hover效果 - 深色模式 */
[data-theme="dark"] .article-content :deep(.code-block:hover::after),
[data-theme="dark"] .article-content :deep(pre.hljs:hover::after),
[data-theme="dark"] .article-content :deep(pre:hover::after) {
    background: rgba(0, 122, 255, 0.8) !important;
    border-color: #007acc !important;
    color: #ffffff !important; /* 保持白色文字以确保对比度 */
}

/* 复制按钮动画效果 */
.article-content :deep([style*="--copy-text"]::after) {
    animation: copySuccess 0.3s ease;
}

@keyframes copySuccess {
    0% { transform: scale(1); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
}



/* 语言标签 - 亮色模式（深色标签） */
.article-content :deep(.code-block::before),
.article-content :deep(pre::before) {
    content: attr(data-language);
    position: absolute;
    top: 8px; /* 🔧 调整顶部位置，与复制按钮保持一致 */
    left: 16px; /* 🔧 调整左侧位置，与容器内边距一致 */
    font-size: 11px;
    color: #ffffff !important;
    text-transform: uppercase;
    font-weight: 600;
    background: rgba(92, 99, 112, 0.8) !important;
    padding: 4px 10px; /* 🔧 增加内边距 */
    border-radius: 4px;
    font-family: 'Consolas', monospace;
    opacity: 0.9;
    margin-bottom: 8px; /* 🔧 增加与代码内容的间距 */
}

/* 语言标签 - 深色模式（浅色标签） */
[data-theme="dark"] .article-content :deep(.code-block::before),
[data-theme="dark"] .article-content :deep(pre::before) {
    color: #333333 !important;
    background: rgba(200, 200, 200, 0.8) !important;
}

.article-content :deep(.code-block code),
.article-content :deep(pre code),
.article-content :deep(.hljs),
.article-content :deep(code.hljs) {
    background: none !important;
    padding: 0.5rem 0 0 0 !important; /* 🔧 给顶部留出空间，避免与语言标签重叠 */
    border-radius: 0 !important;
    font-family: inherit !important;
    font-size: inherit !important;
    line-height: inherit !important;
    color: inherit !important;
    border: none !important;
    box-shadow: none !important;
    margin: 0 !important;
    
    /* 🔧 确保内嵌code继承父级样式 */
    display: block !important;
    width: 100% !important;
}

/* 行内代码样式 */
.article-content :deep(.inline-code),
.article-content :deep(code:not(.code-block code)) {
    background-color: var(--gray-100);
    color: var(--red-600);
    padding: 0.2em 0.4em;
    border-radius: 4px;
    font-family: 'Fira Code', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.9em;
    font-weight: 500;
}

[data-theme="dark"] .article-content :deep(.inline-code),
[data-theme="dark"] .article-content :deep(code:not(.code-block code)) {
    background-color: var(--gray-800);
    color: var(--red-400);
}

/* 引用块样式 */
.article-content :deep(blockquote) {
    border-left: 4px solid var(--blue-500);
    margin: 1.5em 0;
    padding: 1em 1.5em;
    background-color: var(--blue-50);
    border-radius: 0 8px 8px 0;
    color: var(--gray-700);
    font-style: italic;
}

[data-theme="dark"] .article-content :deep(blockquote) {
    background-color: rgba(59, 130, 246, 0.1);
    color: var(--gray-300);
    border-left-color: var(--blue-400);
}

/* 列表样式 */
.article-content :deep(ul),
.article-content :deep(ol) {
    margin: 1em 0;
    padding-left: 2em;
}

.article-content :deep(li) {
    margin: 0.5em 0;
    line-height: 1.6;
}

.article-content :deep(ul li) {
    list-style-type: disc;
}

.article-content :deep(ol li) {
    list-style-type: decimal;
}

/* 链接样式 */
.article-content :deep(a) {
    color: var(--blue-600);
    text-decoration: none;
    border-bottom: 1px solid transparent;
    transition: all 0.3s ease;
}

.article-content :deep(a:hover) {
    color: var(--blue-700);
    border-bottom-color: var(--blue-600);
}

[data-theme="dark"] .article-content :deep(a) {
    color: var(--blue-400);
}

[data-theme="dark"] .article-content :deep(a:hover) {
    color: var(--blue-300);
    border-bottom-color: var(--blue-400);
}

/* 表格样式 */
.article-content :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 1.5em 0;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.article-content :deep(th),
.article-content :deep(td) {
    padding: 0.75em 1em;
    text-align: left;
    border-bottom: 1px solid var(--gray-200);
}

.article-content :deep(th) {
    background-color: var(--gray-100);
    font-weight: 600;
    color: var(--text-color);
}

[data-theme="dark"] .article-content :deep(th) {
    background-color: var(--gray-800);
}

[data-theme="dark"] .article-content :deep(th),
[data-theme="dark"] .article-content :deep(td) {
    border-bottom-color: var(--gray-700);
}

/* 水平分割线 */
.article-content :deep(hr) {
    border: none;
    height: 2px;
    background: linear-gradient(to right, transparent, var(--gray-300), transparent);
    margin: 2em 0;
}

[data-theme="dark"] .article-content :deep(hr) {
    background: linear-gradient(to right, transparent, var(--gray-600), transparent);
}

/* 强调文本 */
.article-content :deep(strong) {
    font-weight: 700;
    color: var(--text-color);
}

.article-content :deep(em) {
    font-style: italic;
    color: var(--text-color);
}

/* 代码高亮主题 - One Dark Pro 风格（全面覆盖highlight.js） */

/* 默认使用深色主题语法高亮 - 提高优先级 */
.article-content :deep(.hljs),
.article-content :deep(pre.hljs),
.article-content :deep(.code-block .hljs),
.article-content :deep(pre code),
.article-content :deep(.code-block code) {
    background: transparent !important;
    color: #abb2bf !important;
    font-weight: 400 !important;
    padding: 0 !important;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace !important;
    font-size: inherit !important;
    line-height: inherit !important;
}

/* 注释 - 亮色模式：深色注释，深色模式：浅色注释 */
.article-content :deep(.hljs-comment),
.article-content :deep(.hljs-quote),
.article-content :deep(pre.hljs .hljs-comment),
.article-content :deep(pre.hljs .hljs-quote),
.article-content :deep(.code-block .hljs-comment),
.article-content :deep(.code-block .hljs-quote) {
    color: #5c6370 !important; /* 亮色模式：One Dark Pro 灰色 */
    font-style: italic !important;
}

[data-theme="dark"] .article-content :deep(.hljs-comment),
[data-theme="dark"] .article-content :deep(.hljs-quote),
[data-theme="dark"] .article-content :deep(pre.hljs .hljs-comment),
[data-theme="dark"] .article-content :deep(pre.hljs .hljs-quote),
[data-theme="dark"] .article-content :deep(.code-block .hljs-comment),
[data-theme="dark"] .article-content :deep(.code-block .hljs-quote) {
    color: #999999 !important; /* 深色模式：浅灰色注释 */
    font-style: italic !important;
}

/* 关键字 - 亮色模式：One Dark Pro 紫色，深色模式：深紫色 */
.article-content :deep(.hljs-keyword),
.article-content :deep(.hljs-selector-tag),
.article-content :deep(.hljs-literal),
.article-content :deep(.hljs-built_in),
.article-content :deep(pre.hljs .hljs-keyword),
.article-content :deep(pre.hljs .hljs-selector-tag),
.article-content :deep(pre.hljs .hljs-literal),
.article-content :deep(pre.hljs .hljs-built_in),
.article-content :deep(.code-block .hljs-keyword),
.article-content :deep(.code-block .hljs-selector-tag),
.article-content :deep(.code-block .hljs-literal),
.article-content :deep(.code-block .hljs-built_in) {
    color: #c678dd !important; /* 亮色模式：One Dark Pro 紫色 */
    font-weight: 500 !important;
}

/* 深色模式语法高亮 - 快速覆盖主要元素 */
[data-theme="dark"] .article-content :deep(.hljs-keyword),
[data-theme="dark"] .article-content :deep(.hljs-selector-tag),
[data-theme="dark"] .article-content :deep(.hljs-literal),
[data-theme="dark"] .article-content :deep(.hljs-built_in) {
    color: #8B5CF6 !important; /* 深色模式：深紫色 */
}

[data-theme="dark"] .article-content :deep(.hljs-string),
[data-theme="dark"] .article-content :deep(.hljs-template-string) {
    color: #059669 !important; /* 深色模式：深绿色字符串 */
}

[data-theme="dark"] .article-content :deep(.hljs-number) {
    color: #DC2626 !important; /* 深色模式：深橙色数字 */
}

[data-theme="dark"] .article-content :deep(.hljs-title),
[data-theme="dark"] .article-content :deep(.hljs-title.function_),
[data-theme="dark"] .article-content :deep(.hljs-function) {
    color: #2563EB !important; /* 深色模式：深蓝色函数名 */
}

[data-theme="dark"] .article-content :deep(.hljs-variable),
[data-theme="dark"] .article-content :deep(.hljs-attr),
[data-theme="dark"] .article-content :deep(.hljs-property) {
    color: #DC2626 !important; /* 深色模式：深红色变量名 */
}

/* 数字 - One Dark Pro 橙色 */
.article-content :deep(.hljs-number),
.article-content :deep(pre.hljs .hljs-number),
.article-content :deep(.code-block .hljs-number) {
    color: #d19a66 !important;
}

/* 字符串 - One Dark Pro 绿色 */
.article-content :deep(.hljs-string),
.article-content :deep(.hljs-doctag),
.article-content :deep(.hljs-template-string),
.article-content :deep(pre.hljs .hljs-string),
.article-content :deep(pre.hljs .hljs-doctag),
.article-content :deep(pre.hljs .hljs-template-string),
.article-content :deep(.code-block .hljs-string),
.article-content :deep(.code-block .hljs-doctag),
.article-content :deep(.code-block .hljs-template-string) {
    color: #98c379 !important;
}

/* 函数名、方法名 - One Dark Pro 蓝色 */
.article-content :deep(.hljs-title),
.article-content :deep(.hljs-section),
.article-content :deep(.hljs-selector-id),
.article-content :deep(.hljs-title.class_),
.article-content :deep(.hljs-title.function_),
.article-content :deep(.hljs-function),
.article-content :deep(pre.hljs .hljs-title),
.article-content :deep(pre.hljs .hljs-section),
.article-content :deep(pre.hljs .hljs-selector-id),
.article-content :deep(pre.hljs .hljs-title.class_),
.article-content :deep(pre.hljs .hljs-title.function_),
.article-content :deep(pre.hljs .hljs-function),
.article-content :deep(.code-block .hljs-title),
.article-content :deep(.code-block .hljs-section),
.article-content :deep(.code-block .hljs-selector-id),
.article-content :deep(.code-block .hljs-title.class_),
.article-content :deep(.code-block .hljs-title.function_),
.article-content :deep(.code-block .hljs-function) {
    color: #61afef !important;
    font-weight: 500 !important;
}

/* 变量名、属性 - One Dark Pro 红色 */
.article-content :deep(.hljs-variable),
.article-content :deep(.hljs-subst),
.article-content :deep(.hljs-type),
.article-content :deep(.hljs-class),
.article-content :deep(.hljs-attr),
.article-content :deep(.hljs-property),
.article-content :deep(.hljs-params),
.article-content :deep(pre.hljs .hljs-variable),
.article-content :deep(pre.hljs .hljs-subst),
.article-content :deep(pre.hljs .hljs-type),
.article-content :deep(pre.hljs .hljs-class),
.article-content :deep(pre.hljs .hljs-attr),
.article-content :deep(pre.hljs .hljs-property),
.article-content :deep(pre.hljs .hljs-params),
.article-content :deep(.code-block .hljs-variable),
.article-content :deep(.code-block .hljs-subst),
.article-content :deep(.code-block .hljs-type),
.article-content :deep(.code-block .hljs-class),
.article-content :deep(.code-block .hljs-attr),
.article-content :deep(.code-block .hljs-property),
.article-content :deep(.code-block .hljs-params) {
    color: #e06c75 !important;
}

/* 符号、操作符 - One Dark Pro 白色/黄色 */
.article-content :deep(.hljs-symbol),
.article-content :deep(.hljs-bullet),
.article-content :deep(.hljs-builtin-name),
.article-content :deep(.hljs-operator),
.article-content :deep(.hljs-punctuation),
.article-content :deep(pre.hljs .hljs-symbol),
.article-content :deep(pre.hljs .hljs-bullet),
.article-content :deep(pre.hljs .hljs-builtin-name),
.article-content :deep(pre.hljs .hljs-operator),
.article-content :deep(pre.hljs .hljs-punctuation),
.article-content :deep(.code-block .hljs-symbol),
.article-content :deep(.code-block .hljs-bullet),
.article-content :deep(.code-block .hljs-builtin-name),
.article-content :deep(.code-block .hljs-operator),
.article-content :deep(.code-block .hljs-punctuation) {
    color: #abb2bf !important;
}

/* 元数据、删除 - One Dark Pro 紫色 */
.article-content :deep(.hljs-meta),
.article-content :deep(.hljs-deletion),
.article-content :deep(.hljs-tag),
.article-content :deep(.hljs-name),
.article-content :deep(pre.hljs .hljs-meta),
.article-content :deep(pre.hljs .hljs-deletion),
.article-content :deep(pre.hljs .hljs-tag),
.article-content :deep(pre.hljs .hljs-name),
.article-content :deep(.code-block .hljs-meta),
.article-content :deep(.code-block .hljs-deletion),
.article-content :deep(.code-block .hljs-tag),
.article-content :deep(.code-block .hljs-name) {
    color: #c678dd !important;
}

/* 添加 - One Dark Pro 绿色 */
.article-content :deep(.hljs-addition),
.article-content :deep(pre.hljs .hljs-addition),
.article-content :deep(.code-block .hljs-addition) {
    color: #98c379 !important;
}

/* 强调 */
.article-content :deep(.hljs-emphasis),
.article-content :deep(pre.hljs .hljs-emphasis) {
    font-style: italic !important;
}

.article-content :deep(.hljs-strong),
.article-content :deep(pre.hljs .hljs-strong) {
    font-weight: bold !important;
}

/* 特殊处理 JavaScript - 与上面的函数名颜色保持一致 */
.article-content :deep(.hljs-title.function_),
.article-content :deep(pre.hljs .hljs-title.function_),
.article-content :deep(.code-block .hljs-title.function_) {
    color: #61afef !important; /* 函数名 - 蓝色 */
}

/* 已在上面的变量部分定义，这里不需要重复 */

/* 其他语法元素已在上面统一定义 */

/* CSS 选择器特殊处理 */
.article-content :deep(.hljs-selector-attr),
.article-content :deep(.hljs-selector-pseudo),
.article-content :deep(.hljs-selector-class),
.article-content :deep(pre.hljs .hljs-selector-attr),
.article-content :deep(pre.hljs .hljs-selector-pseudo),
.article-content :deep(pre.hljs .hljs-selector-class),
.article-content :deep(.code-block .hljs-selector-attr),
.article-content :deep(.code-block .hljs-selector-pseudo),
.article-content :deep(.code-block .hljs-selector-class) {
    color: #d19a66 !important;
}

/* 变量特殊处理 - 类型定义 */
.article-content :deep(.hljs-class),
.article-content :deep(.hljs-interface),
.article-content :deep(pre.hljs .hljs-class),
.article-content :deep(pre.hljs .hljs-interface),
.article-content :deep(.code-block .hljs-class),
.article-content :deep(.code-block .hljs-interface) {
    color: #e5c07b !important;
}

/* 明亮主题下也使用相同的One Dark Pro语法高亮，保持一致性 */
[data-theme="light"] .article-content :deep(.hljs),
[data-theme="light"] .article-content :deep(pre.hljs),
[data-theme="light"] .article-content :deep(.code-block .hljs) {
    background: transparent !important;
    color: #abb2bf !important;
}

/* 在明亮主题下也使用深色主题的语法高亮颜色 */
[data-theme="light"] .article-content :deep(.hljs-comment),
[data-theme="light"] .article-content :deep(.hljs-quote) {
    color: #5c6370 !important;
    font-style: italic !important;
}

[data-theme="light"] .article-content :deep(.hljs-keyword),
[data-theme="light"] .article-content :deep(.hljs-literal),
[data-theme="light"] .article-content :deep(.hljs-built_in) {
    color: #c678dd !important;
}

[data-theme="light"] .article-content :deep(.hljs-number) {
    color: #d19a66 !important;
}

[data-theme="light"] .article-content :deep(.hljs-string),
[data-theme="light"] .article-content :deep(.hljs-template-string) {
    color: #98c379 !important;
}

[data-theme="light"] .article-content :deep(.hljs-title),
[data-theme="light"] .article-content :deep(.hljs-title.function_),
[data-theme="light"] .article-content :deep(.hljs-function) {
    color: #61afef !important;
}

[data-theme="light"] .article-content :deep(.hljs-variable),
[data-theme="light"] .article-content :deep(.hljs-attr),
[data-theme="light"] .article-content :deep(.hljs-property) {
    color: #e06c75 !important;
}

/* 响应式调整 - 保持代码块在手机上的可读性 */
@media (max-width: 768px) {
    .article-content :deep(.code-block),
    .article-content :deep(pre),
    .article-content :deep(pre.hljs) {
        padding: 1rem !important;
        margin: 1rem 0 !important;
        font-size: 13px !important;
        border-radius: 6px !important;
    }
    
    .article-content :deep(.code-block::after),
    .article-content :deep(pre::after) {
        top: 6px !important;
        right: 6px !important;
        font-size: 11px !important;
        padding: 4px 8px !important;
    }
    
    .article-content :deep(.code-block::before),
    .article-content :deep(pre::before) {
        top: 6px !important;
        left: 8px !important;
        font-size: 10px !important;
        padding: 1px 6px !important;
    }
    
    .article-content :deep(.md-h1),
    .article-content :deep(h1) {
        font-size: 1.75em;
    }
    
    .article-content :deep(.md-h2),
    .article-content :deep(h2) {
        font-size: 1.5em;
    }
    
    .article-content :deep(.md-h3),
    .article-content :deep(h3) {
        font-size: 1.25em;
    }
}
</style>