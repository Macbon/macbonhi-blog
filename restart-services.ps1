# Windows PowerShell版本的重启脚本

Write-Host "🔄 重启博客服务以修复502错误..." -ForegroundColor Yellow

# 停止现有服务
Write-Host "🛑 停止现有服务..." -ForegroundColor Red
docker-compose down

# 清理未使用的资源（可选）
Write-Host "🧹 清理Docker资源..." -ForegroundColor Blue
docker system prune -f

# 重新构建并启动服务
Write-Host "🚀 重新启动服务..." -ForegroundColor Green
docker-compose up -d --build

# 等待服务启动
Write-Host "⏳ 等待服务启动..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# 检查服务状态
Write-Host "🔍 检查服务状态..." -ForegroundColor Cyan
docker-compose ps

# 检查API健康状态
Write-Host "🏥 检查API健康状态..." -ForegroundColor Magenta
try {
    $response = Invoke-WebRequest -Uri "http://localhost/api/health" -UseBasicParsing
    Write-Host "✅ API健康检查成功" -ForegroundColor Green
} catch {
    Write-Host "❌ API健康检查失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 查看API日志（最后50行）
Write-Host "📋 API服务日志：" -ForegroundColor White
docker-compose logs --tail=50 api

Write-Host "✅ 重启完成！请尝试重新发布文章。" -ForegroundColor Green