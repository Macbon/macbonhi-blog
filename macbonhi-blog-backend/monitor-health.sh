#!/bin/bash

# 数据库连接健康监控脚本
# 用于监控API服务的数据库连接状态，如果出现问题自动重启

LOG_FILE="/var/log/macbonhi-health-monitor.log"
API_URL="http://localhost:3000/health"
MAX_FAILURES=3
FAILURE_COUNT=0
CHECK_INTERVAL=30  # 30秒检查一次

# 创建日志文件
touch $LOG_FILE

# 日志函数
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

# 检查API健康状态
check_api_health() {
    local response
    local status_code
    
    # 发送健康检查请求
    response=$(curl -s -w "%{http_code}" $API_URL 2>/dev/null)
    status_code="${response: -3}"
    
    if [ "$status_code" = "200" ]; then
        # 解析JSON响应检查数据库状态
        local db_status=$(echo "$response" | head -c -4 | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        
        if [ "$db_status" = "ok" ]; then
            log_message "✅ API和数据库连接健康"
            FAILURE_COUNT=0
            return 0
        else
            log_message "❌ 数据库连接异常: $db_status"
            return 1
        fi
    else
        log_message "❌ API响应异常，状态码: $status_code"
        return 1
    fi
}

# 重启API服务
restart_api_service() {
    log_message "🔄 开始重启API服务..."
    
    cd /path/to/macbonhi-blog-backend || {
        log_message "❌ 无法切换到后端目录"
        return 1
    }
    
    # 停止服务
    docker-compose stop api
    sleep 5
    
    # 检查并清理僵尸连接
    docker-compose logs api --tail=50 >> $LOG_FILE
    
    # 重启服务
    docker-compose start api
    
    # 等待服务启动
    sleep 30
    
    # 验证重启后的状态
    if check_api_health; then
        log_message "✅ API服务重启成功"
        return 0
    else
        log_message "❌ API服务重启后仍然异常"
        return 1
    fi
}

# 发送告警通知（可选）
send_alert() {
    local message="$1"
    log_message "🚨 告警: $message"
    
    # 这里可以添加邮件、微信、钉钉等通知方式
    # echo "$message" | mail -s "Macbonhi API Alert" admin@macbonhi.cn
}

# 主监控循环
main_monitor() {
    log_message "🚀 开始健康监控，检查间隔: ${CHECK_INTERVAL}秒"
    
    while true; do
        if ! check_api_health; then
            FAILURE_COUNT=$((FAILURE_COUNT + 1))
            log_message "⚠️  健康检查失败 ($FAILURE_COUNT/$MAX_FAILURES)"
            
            if [ $FAILURE_COUNT -ge $MAX_FAILURES ]; then
                log_message "💥 连续失败次数达到阈值，尝试重启服务"
                
                if restart_api_service; then
                    FAILURE_COUNT=0
                    send_alert "API服务已自动重启并恢复正常"
                else
                    send_alert "API服务重启失败，需要人工介入"
                    # 可以选择退出或继续监控
                    sleep 300  # 失败后等待5分钟再继续
                fi
            fi
        fi
        
        sleep $CHECK_INTERVAL
    done
}

# 脚本参数处理
case "$1" in
    start)
        log_message "启动健康监控服务"
        main_monitor
        ;;
    check)
        check_api_health
        exit $?
        ;;
    restart)
        restart_api_service
        exit $?
        ;;
    *)
        echo "用法: $0 {start|check|restart}"
        echo "  start   - 启动持续监控"
        echo "  check   - 执行一次健康检查"
        echo "  restart - 重启API服务"
        exit 1
        ;;
esac