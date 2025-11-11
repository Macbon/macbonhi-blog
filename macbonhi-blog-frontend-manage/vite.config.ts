import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite';
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers';
import { resolve } from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';
  
  return {
    base: '/admin/',
    
    // 优化解析配置
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@components': resolve(__dirname, 'src/components'),
        '@views': resolve(__dirname, 'src/views'),
        '@store': resolve(__dirname, 'src/store'),
        '@hooks': resolve(__dirname, 'src/hooks'),
        '@api': resolve(__dirname, 'src/api'),
        '@utils': resolve(__dirname, 'src/utils'),
        '@types': resolve(__dirname, 'src/types')
      }
    },
    
    plugins: [
      vue({
        // Vue组件优化
        template: {
          compilerOptions: {
            // 在生产环境中移除注释和空白
            comments: !isProd,
            whitespace: isProd ? 'condense' : 'preserve'
          }
        }
      }),

      Components({
        resolvers: [
          AntDesignVueResolver({
            importStyle: false, // css in js，减少CSS文件数量
            resolveIcons: true, // 自动解析图标
          }),
        ],
        // 自动导入配置优化
        dts: true, // 生成类型定义
        include: [/\.vue$/, /\.vue\?vue/, /\.tsx$/],
        exclude: [/node_modules/, /\.git/]
      }),
      
      // 添加打包分析工具
      ...(isProd ? [
        visualizer({ 
          open: true,
          filename: 'dist/stats.html',
          gzipSize: true,
          brotliSize: true
        })
      ] : [])
    ],

    // CSS优化配置（Vite内置了现代CSS处理）
    css: {
      // 生产环境自动压缩CSS
      minify: isProd,
      // 开发环境保留源映射
      devSourcemap: !isProd
    },

    // 构建优化配置
    build: {
      // 输出目录清理
      emptyOutDir: true,
      
      // 资源内联阈值
      assetsInlineLimit: 4096, // 4kb以下的资源内联为base64
      
      // Rollup选项
      rollupOptions: {
        output: {
          // 优化后的手动分包策略，更清晰的分包逻辑
          manualChunks: {
            'vendor-antd': ['ant-design-vue'],
            'vendor-editor': ['@wangeditor/editor', '@wangeditor/editor-for-vue'],
            'vendor-echarts': ['echarts'],
            'vendor-vue': ['vue', 'vue-router', 'pinia']
          },
          
          // 资源文件命名
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name?.split('.') || [];
            let extType = info[info.length - 1];
            
            // 根据文件类型分类存放
            if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/i.test(assetInfo.name || '')) {
              extType = 'media';
            } else if (/\.(png|jpe?g|gif|svg|webp|ico)(\?.*)?$/i.test(assetInfo.name || '')) {
              extType = 'images';
            } else if (/\.(woff2?|eot|ttf|otf)(\?.*)?$/i.test(assetInfo.name || '')) {
              extType = 'fonts';
            }
            
            return `assets/${extType}/[name]-[hash][extname]`;
          }
        }
      },
      
      // 压缩配置 - 使用esbuild（Vite默认，速度更快）
      minify: 'esbuild',
      
      // esbuild压缩选项
      ...(isProd ? {
        esbuild: {
          // 生产环境移除console和debugger
          drop: ['console', 'debugger'],
          // 保留类名和函数名（便于调试）
          keepNames: false,
          // 优化压缩
          minifyIdentifiers: true,
          minifySyntax: true,
          minifyWhitespace: true,
        }
      } : {}),
      
      // 启用CSS代码分割
      cssCodeSplit: true,
      
      // 构建后的chunk大小警告阈值
      chunkSizeWarningLimit: 1000,
    },

    // 开发服务器配置
    server: {
      host: true,
      port: 3000,
      open: false
    },
    
    // 预构建配置
    optimizeDeps: {
      // 强制预构建某些依赖
      include: [
        'vue',
        'vue-router',
        'pinia',
        'ant-design-vue',
        '@ant-design/icons-vue',
        'axios',
        'ant-design-vue/es/locale/zh_CN',
        'ant-design-vue/es/date-picker/locale/zh_CN'
      ],
      exclude: [
        // 排除大型库，按需加载
        '@wangeditor/editor',
        'echarts'
      ]
    }
  };
})
