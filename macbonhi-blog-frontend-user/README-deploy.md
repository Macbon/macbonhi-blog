# macbonhi-blog 用户端部署指南

## 项目概述

这是 macbonhi-blog 博客系统的用户端前端，基于 Vue 3 + TypeScript + Vite 开发。

## 部署方式

### 1. 配置说明

用户端配置为网站根路径 `/` 运行，是 macbonhi.cn 的主要入口：

- 用户端访问地址：https://macbonhi.cn/
- 管理端访问地址：https://macbonhi.cn/admin/ (在另一个项目中配置)

### 2. Docker 部署

#### 独立部署（仅用户端）

```bash
# 构建并启动容器
docker-compose up -d

# 查看容器状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

#### 与管理端和API一起部署（推荐）

创建一个主 docker-compose.yml 文件，整合所有服务，示例：

```yaml
version: '3'

services:
  # 用户端前端
  user-frontend:
    build: ./macbonhi-blog-frontend-user
    container_name: macbonhi-user-frontend
    restart: always
    
  # 管理端前端
  admin-frontend:
    build: ./macbonhi-blog-frontend-manage
    container_name: macbonhi-admin-frontend
    restart: always
    
  # 后端API服务
  api:
    build: ./macbonhi-blog-api
    container_name: macbonhi-api
    restart: always
    environment:
      - NODE_ENV=production
    
  # Nginx代理
  nginx:
    image: nginx:alpine
    container_name: macbonhi-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - ./macbonhi-blog-frontend-user/dist:/usr/share/nginx/html
      - ./macbonhi-blog-frontend-manage/dist:/usr/share/nginx/html/admin
    depends_on:
      - user-frontend
      - admin-frontend
      - api
      
networks:
  default:
    name: macbonhi-network
```

### 3. 手动部署

如果不使用 Docker，可以按照以下步骤部署：

1. 构建项目
```bash
npm install
npm run build
```

2. 将生成的 dist 目录内容复制到 Web 服务器的根目录

3. 配置 Nginx
```nginx
# 用户端配置 - 根路径
location / {
    root /path/to/user-frontend/dist;
    try_files $uri $uri/ /index.html;
    index index.html;
}

# API请求配置
location /api/ {
    proxy_pass http://localhost:3000;
    # 其他代理设置...
}
```

## Nginx 完整配置示例

```nginx
server {
    listen 80;
    server_name macbonhi.cn;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name macbonhi.cn;

    ssl_certificate /etc/nginx/ssl/macbonhi.cn.crt;
    ssl_certificate_key /etc/nginx/ssl/macbonhi.cn.key;

    # 用户端 - 根路径
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
        index index.html;
    }

    # 管理端 - admin路径
    location /admin/ {
        alias /usr/share/nginx/html/admin/;
        try_files $uri $uri/ /admin/index.html;
        index index.html;
    }

    # API请求
    location /api/ {
        proxy_pass http://api:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 注意事项

1. 确保 API 服务可正常访问，默认配置假设 API 服务可通过 http://api:3000 访问

2. 用户端与管理端部署在同一域名下时，确保路径配置正确：
   - 用户端：根路径 `/`
   - 管理端：`/admin/` 路径

3. 生产环境务必配置 HTTPS，提高安全性和SEO排名

4. 建议启用静态资源缓存，提高访问速度

## 性能优化建议

1. 启用 Gzip/Brotli 压缩
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

2. 添加适当的缓存控制
```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 7d;
    add_header Cache-Control "public, max-age=604800";
}
```

3. 考虑使用 CDN 分发静态资源

## 问题排查

如遇部署问题，检查：

1. 网络连接和防火墙设置
2. API 服务是否正常运行
3. Nginx 配置是否正确
4. 确保目录权限设置正确
5. 查看 Nginx 和 Docker 日志以获取详细错误信息 