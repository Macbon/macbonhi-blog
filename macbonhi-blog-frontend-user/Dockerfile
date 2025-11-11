# 构建阶段
FROM node:18-alpine AS build

WORKDIR /app

# 安装构建依赖 (用户端依赖较少，可能不需要 python3)
RUN apk add --no-cache python3 make g++

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖 (添加 @types/node)
RUN npm install --legacy-peer-deps

# 复制配置文件
COPY tsconfig*.json ./
COPY env.d.ts ./

# 复制源代码
COPY . .

# 设置环境变量
ENV NODE_ENV=production
ENV SKIP_TYPE_CHECK=true

# 验证配置文件
RUN echo "=== Checking configuration files ===" && \
    ls -la tsconfig*.json env.d.ts && \
    echo "=== Configuration check completed ==="

# 构建项目 - 优先使用无类型检查构建
RUN echo "=== Starting build process ===" && \
    npm run build:no-check && \
    echo "=== Build completed successfully ===" && \
    ls -la dist/

# 运行阶段 - 将构建结果复制到 volume
FROM alpine:latest

WORKDIR /app

# 安装 rsync 用于同步文件
RUN apk add --no-cache rsync

# 从构建阶段复制构建结果
COPY --from=build /app/dist /app/build

# 验证构建产物
RUN echo "=== Verifying build output ===" && \
    ls -la /app/build/ && \
    echo "Build files found: $(ls -1 /app/build/ | wc -l) files"

# 创建启动脚本
RUN echo '#!/bin/sh' > /app/sync.sh && \
    echo 'echo "=== User Frontend Build Process ==="' >> /app/sync.sh && \
    echo 'echo "Source directory contents:"' >> /app/sync.sh && \
    echo 'ls -la /app/build/' >> /app/sync.sh && \
    echo 'echo "Creating destination directory..."' >> /app/sync.sh && \
    echo 'mkdir -p /dist' >> /app/sync.sh && \
    echo 'echo "Copying build files to volume..."' >> /app/sync.sh && \
    echo 'rsync -av --delete /app/build/ /dist/' >> /app/sync.sh && \
    echo 'echo "Verifying copied files..."' >> /app/sync.sh && \
    echo 'ls -la /dist/' >> /app/sync.sh && \
    echo 'echo "Files copied: $(ls -1 /dist/ | wc -l)"' >> /app/sync.sh && \
    echo 'echo "=== User frontend deployment completed ==="' >> /app/sync.sh && \
    echo 'echo "Keeping container running..."' >> /app/sync.sh && \
    echo 'tail -f /dev/null' >> /app/sync.sh && \
    chmod +x /app/sync.sh

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD test -d /dist && test "$(ls -A /dist)" || exit 1

# 启动同步脚本
CMD ["/app/sync.sh"]