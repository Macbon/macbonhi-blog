#!/bin/bash

echo "🔄 重启博客服务以修复502错误..."

# 停止现有服务
echo "🛑 停止现有服务..."
docker-compose down

# 清理未使用的资源（可选）
echo "🧹 清理Docker资源..."
docker system prune -f

# 重新构建并启动服务
echo "🚀 重新启动服务..."
docker-compose up -d --build

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 30

# 检查服务状态
echo "🔍 检查服务状态..."
docker-compose ps

# 检查API健康状态
echo "🏥 检查API健康状态..."
curl -f http://localhost/api/health || echo "❌ API健康检查失败"

# 查看API日志（最后50行）
echo "📋 API服务日志："
docker-compose logs --tail=50 api

echo "✅ 重启完成！请尝试重新发布文章。"