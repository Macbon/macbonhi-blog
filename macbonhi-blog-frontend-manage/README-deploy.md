# macbonhi-blog 管理端部署指南

## 项目概述

这是 macbonhi-blog 博客系统的管理端前端，基于 Vue 3 + TypeScript + Vite 开发。

## 部署方式

### 1. 配置说明

管理端已经配置为在 `/admin/` 路径下运行，以便与用户端在同一域名（macbonhi.cn）下共存：

- 用户端访问地址：https://macbonhi.cn/
- 管理端访问地址：https://macbonhi.cn/admin/

### 2. Docker 部署

#### 独立部署（仅管理端）

```bash
# 构建并启动容器
docker-compose up -d

# 查看容器状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

#### 与用户端和API一起部署

需要将本项目的 docker-compose.yml 与主项目合并，或使用以下命令：

```bash
# 假设主 docker-compose.yml 在上级目录
docker-compose -f ../docker-compose.yml -f docker-compose.yml up -d
```

### 3. 手动部署

如果不使用 Docker，可以按照以下步骤部署：

1. 构建项目
```bash
npm install
npm run build
```

2. 将生成的 dist 目录内容复制到 Web 服务器的 /admin 目录下

3. 配置 Nginx
```nginx
location /admin/ {
    alias /path/to/your/dist/;
    try_files $uri $uri/ /admin/index.html;
    index index.html;
}
```

## 注意事项

1. 确保 API 服务可正常访问，默认配置假设 API 服务可通过 http://api:3000 访问

2. 确保 vite.config.ts 中的 base 设置为 '/admin/'

3. 如果使用独立域名而非路径区分，需要修改：
   - vite.config.ts 中的 base 设置为 '/'
   - nginx.conf 中的路径配置

4. 生产环境需配置 HTTPS，以上示例仅配置了 HTTP

## 环境变量

可通过 .env 文件配置以下环境变量：

- VITE_API_BASE_URL: API 请求基础路径，默认为 '/api'

## 访问控制

管理端应当配置适当的访问控制措施，建议：

1. 启用管理员登录鉴权
2. 配置 IP 白名单限制
3. 考虑添加双因素认证

## 故障排除

如遇部署问题，请检查：

1. 网络连接是否正常
2. API 服务是否可访问
3. 路径配置是否正确
4. 是否存在跨域问题 