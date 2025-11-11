# 构建阶段
FROM node:18-alpine AS build

WORKDIR /app

# 安装构建依赖
RUN apk add --no-cache python3 make g++

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install --legacy-peer-deps

# 复制 tsconfig 配置文件
COPY tsconfig*.json ./

# 复制环境类型声明文件
COPY env.d.ts ./

# 复制源代码
COPY . .

# 设置环境变量跳过类型检查
ENV SKIP_TYPE_CHECK=true
ENV NODE_ENV=production

# 使用无类型检查的构建命令
RUN npm run build:no-check

# 验证构建结果
RUN ls -la dist/ && echo "Build completed successfully"

# 运行阶段 - 将构建结果复制到 volume
FROM alpine:latest

WORKDIR /app

# 安装 rsync 用于同步文件
RUN apk add --no-cache rsync

# 从构建阶段复制构建结果
COPY --from=build /app/dist /app/build

# 创建启动脚本
RUN echo '#!/bin/sh' > /app/sync.sh && \
    echo 'echo "=== Frontend Management Build Process ==="' >> /app/sync.sh && \
    echo 'echo "Copying build files to volume..."' >> /app/sync.sh && \
    echo 'mkdir -p /dist' >> /app/sync.sh && \
    echo 'rsync -av --delete /app/build/ /dist/' >> /app/sync.sh && \
    echo 'echo "Build files copied successfully to /dist"' >> /app/sync.sh && \
    echo 'echo "Files in /dist:"' >> /app/sync.sh && \
    echo 'ls -la /dist/' >> /app/sync.sh && \
    echo 'echo "=== Process completed ==="' >> /app/sync.sh && \
    echo 'echo "Keeping container running..."' >> /app/sync.sh && \
    echo 'tail -f /dev/null' >> /app/sync.sh && \
    chmod +x /app/sync.sh

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD test -d /dist && test "$(ls -A /dist)" || exit 1

# 启动同步脚本
CMD ["/app/sync.sh"]