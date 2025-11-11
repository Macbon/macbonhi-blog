# Markdown渲染依赖安装说明

## 📦 需要安装的依赖

为了支持完整的Markdown渲染和代码高亮功能，请运行以下命令安装依赖：

```bash
npm install marked highlight.js @types/marked
```

## 📚 依赖说明

- **marked**: 强大的Markdown解析器，支持GFM（GitHub Flavored Markdown）
- **highlight.js**: 代码语法高亮库，支持180+编程语言
- **@types/marked**: marked库的TypeScript类型定义

## 🎯 功能特性

安装这些依赖后，您的文章渲染器将支持：

### ✅ 基础Markdown语法
- 标题 (`# ## ###`)
- 粗体和斜体 (`**bold** *italic*`)
- 链接 (`[text](url)`)
- 列表（有序和无序）
- 引用块 (`> quote`)
- 水平分割线 (`---`)

### ✅ 代码支持
- 行内代码 (`` `code` ``)
- 代码块 (````javascript ... ````)
- 语法高亮（支持JavaScript、Python、HTML、CSS等）

### ✅ 高级功能
- 表格
- 任务列表
- 自动链接识别
- 图片画廊自动检测

## 🔄 回退机制

如果您暂时不想安装这些依赖，系统会自动使用简化版的Markdown渲染器，它包含：
- 基础的标题、粗体、斜体支持
- 简单的代码块和行内代码
- 链接渲染
- 换行处理

## 🚀 安装后效果

安装依赖并重启开发服务器后，您将在控制台看到：
```
✅ Markdown渲染器初始化完成（完整版）
```

未安装依赖时会显示：
```
⚠️ Markdown渲染器初始化完成（简化版）
```

## 🎨 样式主题

已经预置了完整的代码高亮主题（类似GitHub Dark），支持：
- 深色背景的代码块
- 语法高亮
- 语言标识显示
- 响应式设计

现在就可以在文章内容中使用Markdown格式了！