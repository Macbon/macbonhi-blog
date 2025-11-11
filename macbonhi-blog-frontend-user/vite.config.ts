import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  base: '/',  // 用户端作为根路径
  plugins: [vue()],
  build: {
    outDir: 'dist/user',  // 确保输出到正确的目录
    assetsDir: 'assets',  // 资源目录名称
    emptyOutDir: true,    // 构建前清空目录
    
    // ✅ 性能优化：代码分割策略
    rollupOptions: {
      output: {
        // ✅ 临时修复：简化分包策略，避免循环依赖问题
        manualChunks: (id) => {
          // 只分离第三方库，避免业务代码分割导致的循环依赖
          if (id.includes('node_modules')) {
            if (id.includes('vue') || id.includes('pinia')) {
              return 'vendor-vue';
            }
            if (id.includes('ant-design-vue')) {
              return 'vendor-ui';
            }
            if (id.includes('axios') || id.includes('fingerprintjs')) {
              return 'vendor-utils';
            }
            // 其他第三方库
            return 'vendor-libs';
          }
          // 业务代码不进行分割，避免循环依赖问题
        }
      }
    },
    
    // ✅ 修复：使用默认的 esbuild 压缩器（更快，无需额外依赖）
    minify: 'esbuild',
    
    // 设置 chunk 大小警告阈值
    chunkSizeWarningLimit: 800, // 800KB 警告阈值
    
    // 启用 CSS 代码分割
    cssCodeSplit: true
  },
  
  // ✅ esbuild 配置（全局）
  esbuild: {
    // 开发环境保留调试信息，生产环境才移除
    // drop: ['console', 'debugger'], // 暂时注释掉，用于调试
    // 兼容性设置
    target: 'es2015'
  },
  
  // ✅ 开发环境优化
  server: {
    // 预构建优化
    hmr: {
      overlay: false // 关闭错误覆盖层，提升开发体验
    },
    // API代理配置
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // 后端服务地址，请根据实际情况修改
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '') // 移除/api前缀
      },
      '/uploads': {
        target: 'http://localhost:3000', // 文件上传服务地址
        changeOrigin: true,
        secure: false
      }
    }
  },
  
  // ✅ 预构建优化
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia',
      'ant-design-vue',
      'axios'
    ],
    exclude: [
      // 排除大型库的预构建，按需加载
      '@fingerprintjs/fingerprintjs'
    ]
  }
})
