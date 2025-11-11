#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 显示标题
echo -e "${GREEN}====================================================${NC}"
echo -e "${GREEN}      Macbonhi Blog 部署脚本 - 使用预构建文件      ${NC}"
echo -e "${GREEN}====================================================${NC}"

# 1. 环境检查
echo -e "${YELLOW}检查部署环境...${NC}"

# 检查预构建的前端文件
echo -e "${YELLOW}检查前端构建文件...${NC}"
if [ ! -d "macbonhi-blog-frontend-user/dist/user" ] || [ ! -d "macbonhi-blog-frontend-manage/dist/manage" ]; then
  echo -e "${RED}错误：前端构建文件不存在！${NC}"
  echo -e "请确保以下目录中包含构建好的前端文件:"
  echo -e "- macbonhi-blog-frontend-user/dist/user"
  echo -e "- macbonhi-blog-frontend-manage/dist/manage"
  exit 1
fi

# 检查.env文件
if [ ! -f ".env" ]; then
  echo -e "${RED}错误：.env 文件不存在！${NC}"
  echo -e "请创建 .env 文件并设置必要的环境变量。"
  exit 1
fi

# 检查必要目录
for dir in "nginx/ssl" "backups"; do
  if [ ! -d "$dir" ]; then
    echo -e "${YELLOW}创建目录: $dir${NC}"
    mkdir -p "$dir"
  fi
done

# 检查SSL证书
if [ ! -f "nginx/ssl/macbonhi.cn.crt" ] || [ ! -f "nginx/ssl/macbonhi.cn.key" ]; then
  echo -e "${YELLOW}警告：SSL证书文件不存在！${NC}"
  echo -e "是否继续部署？将无法启用HTTPS！(y/n)"
  read -r response
  if [[ "$response" =~ ^([nN][oO]|[nN])$ ]]; then
    echo -e "${RED}部署已取消${NC}"
    exit 0
  fi
fi

# 2. 数据备份
echo -e "${YELLOW}创建数据库备份...${NC}"
timestamp=$(date +%Y%m%d%H%M%S)
BACKUP_FILE="backups/db-backup-$timestamp.sql"
# 从环境变量文件中读取密码
source .env
if docker-compose exec -T db mysqldump -u root -p"${MYSQL_ROOT_PASSWORD}" "${MYSQL_DATABASE}" > "${BACKUP_FILE}" 2>/dev/null; then
  echo -e "${GREEN}✓ 数据库已备份至 ${BACKUP_FILE}${NC}"
else
  echo -e "${YELLOW}注意：无法备份数据库，可能是首次部署或数据库尚未运行${NC}"
fi

# 3. 修改docker-compose.yml，使用预构建的前端文件
echo -e "${YELLOW}修改docker-compose配置...${NC}"
cat > docker-compose.yml << 'EOF'
version: '3'

services:
  # 数据库
  db:
    image: mysql:8.0
    container_name: macbonhi-db
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    volumes:
      - db-data:/var/lib/mysql
      - ./macbonhi-blog-backend/update_file_table.sql:/docker-entrypoint-initdb.d/01-update.sql
    command: --default-authentication-plugin=mysql_native_password
    networks:
      - macbonhi-network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      timeout: 20s
      retries: 10

  # 后端API服务
  api:
    build:
      context: ./macbonhi-blog-backend
      dockerfile: Dockerfile
    container_name: macbonhi-api
    restart: always
    environment:
      - NODE_ENV=${NODE_ENV}
      - PORT=${PORT}
      - DB_HOST=${DB_HOST}
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_NAME=${DB_NAME}
      - JWT_SECRET=${JWT_SECRET}
      - JWT_EXPIRES_IN=${JWT_EXPIRES_IN}
      - ALLOWED_ORIGINS=${ALLOWED_ORIGINS}
    volumes:
      - ./macbonhi-blog-backend/uploads:/app/uploads
    depends_on:
      db:
        condition: service_healthy
    networks:
      - macbonhi-network

  # Nginx代理服务器
  nginx:
    image: nginx:alpine
    container_name: macbonhi-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - ./macbonhi-blog-frontend-user/dist/user:/usr/share/nginx/html
      - ./macbonhi-blog-frontend-manage/dist/manage:/usr/share/nginx/html/admin
    depends_on:
      - api
    networks:
      - macbonhi-network

networks:
  macbonhi-network:
    driver: bridge

volumes:
  db-data:
EOF

echo -e "${GREEN}✓ docker-compose.yml 已更新${NC}"

# 4. 停止旧容器
echo -e "${YELLOW}停止旧容器...${NC}"
docker-compose down

# 5. 清理构建缓存
echo -e "${YELLOW}清理构建缓存...${NC}"
docker system prune -f

# 6. 部署带回滚功能
deploy_with_rollback() {
  echo -e "${GREEN}启动所有服务...${NC}"
  if ! docker-compose up -d; then
    echo -e "${RED}部署失败！正在回滚...${NC}"
    docker-compose down
    echo -e "${YELLOW}正在尝试从备份恢复...${NC}"
    # 这里可以添加更详细的恢复逻辑
    return 1
  fi
  return 0
}

deploy_with_rollback

# 7. 等待服务启动
echo -e "${YELLOW}等待服务启动...${NC}"
sleep 30

# 8. 检查服务日志
echo -e "${YELLOW}检查API服务日志...${NC}"
docker-compose logs --tail 20 api

# 9. 重启 nginx 确保看到新文件
echo -e "${GREEN}重启 Nginx...${NC}"
docker-compose restart nginx

# 10. 清理日志文件
echo -e "${YELLOW}清理过期日志...${NC}"
docker-compose exec nginx sh -c "find /var/log/nginx -type f -name '*.log.*' -mtime +7 -delete" || true

# 11. 最终状态检查
echo -e "${GREEN}检查最终状态...${NC}"
docker-compose ps

echo -e "${GREEN}====================================================${NC}"
echo -e "${GREEN}                部署完成！                          ${NC}"
echo -e "${GREEN}====================================================${NC}"
echo -e "备份文件保存在: ${YELLOW}${BACKUP_FILE}${NC}"
echo -e ""
echo -e "${GREEN}如果前端页面有问题，请检查日志：${NC}"
echo -e "${YELLOW}docker-compose logs nginx${NC}"
echo -e "${YELLOW}docker-compose logs api${NC}"
echo -e ""
echo -e "${GREEN}访问地址：${NC}"
echo -e "用户端: ${YELLOW}https://macbonhi.cn${NC}"
echo -e "管理端: ${YELLOW}https://macbonhi.cn/admin${NC}"