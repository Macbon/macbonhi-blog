# macbonhi-blog 后端部署指南

## 项目概述

这是 macbonhi-blog 博客系统的后端 API 服务，基于 Node.js + Express + MySQL 开发。

## 部署方式

### 1. 配置说明

后端 API 配置为监听 3000 端口，通过 Nginx 反向代理至 `/api` 路径：

- API 访问地址：https://macbonhi.cn/api/

### 2. Docker 部署

#### 独立部署（仅后端和数据库）

```bash
# 构建并启动容器
docker-compose up -d

# 查看容器状态
docker-compose ps

# 查看日志
docker-compose logs -f api
```

#### 与前端一起部署（推荐）

使用项目根目录中的主 docker-compose.yml 文件，整合所有服务：

```bash
# 在主项目目录下运行
docker-compose -f main-docker-compose.yml up -d
```

### 3. 手动部署

如果不使用 Docker，可以按照以下步骤部署：

1. 安装 Node.js（推荐 v18 或更高版本）和 MySQL 8.0

2. 创建数据库
```sql
CREATE DATABASE IF NOT EXISTS macbonhiblog DEFAULT CHARSET utf8mb4 COLLATE utf8mb4_general_ci;
```

3. 克隆项目并安装依赖
```bash
git clone <repository-url>
cd macbonhi-blog-backend
npm install
```

4. 配置环境变量
```
NODE_ENV=production
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your-password
DB_NAME=macbonhiblog
```

5. 启动服务
```bash
node blog.js
```

6. 使用 PM2 管理进程（推荐）
```bash
npm install -g pm2
pm2 start blog.js --name macbonhi-api
pm2 save
```

## 环境变量

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| NODE_ENV | 环境模式（development/production） | development |
| PORT | API 服务端口 | 3000 |
| DB_HOST | 数据库主机地址 | db (Docker) 或 localhost |
| DB_USER | 数据库用户名 | root |
| DB_PASSWORD | 数据库密码 | root |
| DB_NAME | 数据库名称 | macbonhiblog |

## API 路由

API 服务的主要路由包括：

- `/api/file` - 文件上传和管理
- `/api/article` - 文章管理
- `/api/comment` - 评论管理
- ... 其他路由

## 数据持久化

Docker 部署方式下，以下数据会被持久化：

- MySQL 数据：存储在 `db-data` 卷中
- 上传的文件：挂载本地 `./uploads` 目录

## 目录结构

```
macbonhi-blog-backend/
├── config/         - 配置文件
├── controller/     - 控制器
├── lib/            - 工具类库
├── model/          - 数据模型
├── routers/        - 路由定义
├── uploads/        - 上传文件存储
├── blog.js         - 应用入口
└── Dockerfile      - Docker配置
```

## 注意事项

1. 数据库连接
   - 确保 MySQL 服务可用，且配置正确
   - 默认连接超时后会自动重试

2. 文件上传
   - 上传目录权限设置为可写
   - 监控磁盘空间使用情况

3. 安全性
   - 在生产环境中设置安全的数据库密码
   - 考虑使用环境变量或 Docker Secrets 管理敏感信息

## 故障排查

1. 数据库连接问题
   - 检查 MySQL 服务是否正常运行
   - 验证连接配置是否正确
   - 查看日志中的具体错误信息

2. API 调用失败
   - 检查网络连接和防火墙设置
   - 验证 CORS 配置是否正确
   - 使用 `/health` 端点检查服务健康状态

3. 文件上传失败
   - 检查上传目录权限
   - 确认磁盘空间是否充足 