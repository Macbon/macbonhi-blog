#!/bin/bash

# 502错误诊断和修复脚本
# 用于快速诊断和修复nginx 502错误

echo "=== Macbonhi Blog 502错误诊断和修复工具 ==="
echo "时间: $(date)"
echo

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 输出带颜色的消息
print_status() {
    case $2 in
        "error") echo -e "${RED}❌ $1${NC}" ;;
        "success") echo -e "${GREEN}✅ $1${NC}" ;;
        "warning") echo -e "${YELLOW}⚠️  $1${NC}" ;;
        "info") echo -e "${BLUE}ℹ️  $1${NC}" ;;
        *) echo "📍 $1" ;;
    esac
}

# 检查Docker容器状态
check_containers() {
    print_status "检查Docker容器状态..." "info"
    
    # 检查macbonhi相关容器
    containers=$(docker ps -a --filter "name=macbonhi" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}")
    
    if [ -z "$containers" ]; then
        print_status "未找到macbonhi相关容器" "error"
        return 1
    fi
    
    echo "$containers"
    echo
    
    # 检查API容器是否运行
    api_status=$(docker ps --filter "name=macbonhi-api" --format "{{.Status}}")
    if [[ $api_status == *"Up"* ]]; then
        print_status "API容器正在运行" "success"
    else
        print_status "API容器未运行: $api_status" "error"
        return 1
    fi
    
    return 0
}

# 检查API服务健康状态
check_api_health() {
    print_status "检查API服务健康状态..." "info"
    
    local response
    local status_code
    
    response=$(curl -s -w "%{http_code}" http://localhost:3000/health 2>/dev/null)
    status_code="${response: -3}"
    
    if [ "$status_code" = "200" ]; then
        print_status "API健康检查通过" "success"
        echo "响应: $(echo "$response" | head -c -4 | jq '.' 2>/dev/null || echo "$response" | head -c -4)"
        return 0
    else
        print_status "API健康检查失败，状态码: $status_code" "error"
        return 1
    fi
}

# 检查数据库连接
check_database() {
    print_status "检查数据库连接..." "info"
    
    # 尝试连接数据库容器
    db_status=$(docker exec macbonhi-db mysqladmin ping -h localhost -u root -proot 2>/dev/null)
    
    if [[ $db_status == *"alive"* ]]; then
        print_status "数据库连接正常" "success"
        return 0
    else
        print_status "数据库连接失败" "error"
        return 1
    fi
}

# 查看最新的错误日志
check_logs() {
    print_status "检查最新的错误日志..." "info"
    
    echo "--- Nginx错误日志 (最新10条) ---"
    sudo tail -10 /var/log/nginx/error.log 2>/dev/null || echo "无法访问nginx错误日志"
    
    echo
    echo "--- API容器日志 (最新20条) ---"
    docker logs macbonhi-api --tail=20 2>/dev/null || echo "无法获取API容器日志"
    
    echo
    echo "--- 数据库容器日志 (最新10条) ---"
    docker logs macbonhi-db --tail=10 2>/dev/null || echo "无法获取数据库容器日志"
}

# 修复502错误
fix_502_error() {
    print_status "开始修复502错误..." "warning"
    
    # 1. 重启API服务
    print_status "重启API服务..." "info"
    cd /path/to/macbonhi-blog-backend || {
        print_status "无法找到后端项目目录" "error"
        return 1
    }
    
    docker-compose restart api
    
    # 2. 等待服务启动
    print_status "等待服务启动..." "info"
    sleep 30
    
    # 3. 验证修复结果
    if check_api_health; then
        print_status "API服务修复成功" "success"
    else
        print_status "API服务仍然异常，尝试完全重建..." "warning"
        
        # 完全重建服务
        docker-compose down
        docker-compose up -d
        sleep 60
        
        if check_api_health; then
            print_status "服务重建成功" "success"
        else
            print_status "服务重建后仍然异常，需要人工检查" "error"
            return 1
        fi
    fi
    
    # 4. 重载nginx配置
    print_status "重载nginx配置..." "info"
    sudo nginx -t && sudo nginx -s reload
    
    return 0
}

# 完整的诊断流程
full_diagnosis() {
    print_status "执行完整的502错误诊断..." "info"
    echo
    
    # 1. 检查容器状态
    if ! check_containers; then
        print_status "容器状态异常，尝试修复..." "warning"
        fix_502_error
        return $?
    fi
    
    # 2. 检查API健康状态
    if ! check_api_health; then
        print_status "API健康检查失败，尝试修复..." "warning"
        fix_502_error
        return $?
    fi
    
    # 3. 检查数据库连接
    if ! check_database; then
        print_status "数据库连接异常，重启数据库服务..." "warning"
        docker-compose restart db
        sleep 20
        docker-compose restart api
        sleep 30
        
        if ! check_api_health; then
            print_status "数据库重启后API仍然异常" "error"
            return 1
        fi
    fi
    
    print_status "所有检查通过，系统状态正常" "success"
    return 0
}

# 主程序
case "$1" in
    check)
        full_diagnosis
        ;;
    fix)
        fix_502_error
        ;;
    logs)
        check_logs
        ;;
    containers)
        check_containers
        ;;
    api)
        check_api_health
        ;;
    db)
        check_database
        ;;
    *)
        echo "用法: $0 {check|fix|logs|containers|api|db}"
        echo "  check      - 执行完整诊断"
        echo "  fix        - 修复502错误"
        echo "  logs       - 查看错误日志"
        echo "  containers - 检查容器状态"
        echo "  api        - 检查API健康状态"
        echo "  db         - 检查数据库连接"
        echo
        echo "快速修复502错误："
        echo "  $0 fix"
        exit 1
        ;;
esac