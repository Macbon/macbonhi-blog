FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install --production

# 复制源码
COPY . .

# 创建 uploads 目录并设置权限
RUN mkdir -p /app/uploads && \
    chown -R node:node /app && \
    chmod -R 755 /app && \
    chmod -R 777 /app/uploads

# 设置环境变量
ENV NODE_ENV=production

# 切换到 node 用户
USER node

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "blog.js"]