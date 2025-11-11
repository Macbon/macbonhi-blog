/**
 * Markdown渲染工具
 * 
 * 📦 需要安装的依赖:
 * npm install marked highlight.js @types/marked
 */

// 简化版markdown渲染器（如果没有安装marked的话）
class SimpleMarkdownRenderer {
  static render(markdown: string): string {
    if (!markdown) return '';
    
    let html = markdown;
    
    // 处理代码块 - 确保与完整版渲染器相同的HTML结构
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      const language = lang || 'text';
      const escapedCode = this.escapeHtml(code.trim());
      return `<pre class="code-block hljs" data-language="${language}"><code class="hljs language-${language}">${escapedCode}</code></pre>`;
    });
    
    // 处理行内代码
    html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    
    // 处理标题
    html = html.replace(/^### (.*$)/gm, '<h3 class="md-h3">$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h2 class="md-h2">$1</h2>');
    html = html.replace(/^# (.*$)/gm, '<h1 class="md-h1">$1</h1>');
    
    // 处理粗体
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // 处理斜体
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // 处理链接
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // 处理换行
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    
    // 包装在段落中
    if (html && !html.startsWith('<')) {
      html = '<p>' + html + '</p>';
    }
    
    return html;
  }
  
  static escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// 完整版markdown渲染器（需要安装marked）
class FullMarkdownRenderer {
  private static marked: any = null;
  private static hljs: any = null;
  
  static async init() {
    try {
      // 动态导入marked和highlight.js
      const { marked } = await import('marked');
      const hljs = await import('highlight.js');
      
      this.marked = marked;
      this.hljs = hljs.default;
      
      // 配置marked
      this.marked.setOptions({
        highlight: (code: string, lang: string) => {
          if (lang && this.hljs.getLanguage(lang)) {
            try {
              return this.hljs.highlight(code, { language: lang }).value;
            } catch (err) {
              console.warn('代码高亮失败:', err);
            }
          }
          return this.hljs.highlightAuto(code).value;
        },
        langPrefix: 'hljs language-',
        breaks: true,
        gfm: true,
        // 增强配置
        headerIds: true,        // 为标题生成ID
        mangle: false,         // 不混淆标题ID
        sanitize: false,       // 允许HTML标签
        smartypants: true      // 智能标点符号
      });

      // 自定义渲染器以添加正确的CSS类
      const renderer = new this.marked.Renderer();
      
      // 重写代码块渲染 - 确保正确的CSS类和结构
      renderer.code = function(code: string, language: string | undefined) {
        const lang = language || 'text';
        
        // 使用highlight.js进行语法高亮
        let highlighted = code;
        if (this.options.highlight) {
          try {
            highlighted = this.options.highlight(code, lang);
          } catch (error) {
            console.warn(`代码高亮失败 (${lang}):`, error);
            highlighted = FullMarkdownRenderer.hljs.highlightAuto(code).value;
          }
        }
        
        // 返回带有完整CSS类的HTML结构
        return `<pre class="code-block hljs" data-language="${lang}"><code class="hljs language-${lang}">${highlighted}</code></pre>`;
      };

      this.marked.setOptions({ renderer });
      
      return true;
    } catch (error) {
      console.warn('无法加载marked或highlight.js，将使用简化版渲染器:', error);
      return false;
    }
  }
  
  static render(markdown: string): string {
    if (!markdown) return '';
    
    if (this.marked) {
      try {
        return this.marked.parse(markdown);
      } catch (error) {
        console.error('Markdown渲染失败:', error);
        return SimpleMarkdownRenderer.render(markdown);
      }
    }
    
    return SimpleMarkdownRenderer.render(markdown);
  }
}

// 主渲染函数
export class MarkdownRenderer {
  private static initialized = false;
  private static useFullRenderer = false;
  
  static async init() {
    if (this.initialized) return;
    
    this.useFullRenderer = await FullMarkdownRenderer.init();
    this.initialized = true;
    
    console.log(this.useFullRenderer ? 
      '✅ Markdown渲染器已初始化（完整版）' : 
      '⚠️ Markdown渲染器已初始化（简化版）'
    );
  }
  
  static render(content: string): string {
    if (!content) return '';
    
    // 检测内容类型
    if (this.isJsonImageArray(content)) {
      // 如果是图片数组，渲染为图片画廊
      return this.renderImageGallery(content);
    } else if (this.isMarkdown(content)) {
      // 如果是markdown，进行markdown渲染
      return this.useFullRenderer ? 
        FullMarkdownRenderer.render(content) : 
        SimpleMarkdownRenderer.render(content);
    } else {
      // 普通HTML内容，直接返回
      return content;
    }
  }
  
  // 检测是否为JSON图片数组
  private static isJsonImageArray(content: string): boolean {
    try {
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) && parsed.every(item => 
        typeof item === 'object' && item.url
      );
    } catch {
      return false;
    }
  }
  
  // 检测是否为markdown格式
  private static isMarkdown(content: string): boolean {
    const markdownPatterns = [
      /^#{1,6}\s/m,        // 标题
      /```[\s\S]*?```/,    // 代码块
      /`[^`]+`/,           // 行内代码
      /\*\*.*?\*\*/,       // 粗体
      /\[.*?\]\(.*?\)/,    // 链接
      /^\s*[-*+]\s/m,      // 列表
      /^\s*\d+\.\s/m       // 有序列表
    ];
    
    return markdownPatterns.some(pattern => pattern.test(content));
  }
  
  // 渲染图片画廊
  private static renderImageGallery(content: string): string {
    try {
      const images = JSON.parse(content);
      return images.map((img: any) => 
        `<div class="gallery-image-container">
          <img src="${img.url}" alt="${img.title || '图片'}" class="gallery-image" />
          ${img.title ? `<p class="image-caption">${img.title}</p>` : ''}
        </div>`
      ).join('');
    } catch (error) {
      console.error('图片画廊渲染失败:', error);
      return content;
    }
  }
}

// 导出便捷函数
export const renderMarkdown = (content: string): string => {
  return MarkdownRenderer.render(content);
};

export const initMarkdownRenderer = () => {
  return MarkdownRenderer.init();
};