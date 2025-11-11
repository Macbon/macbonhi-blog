# 🧪 访问统计测试指南

## 测试步骤

### 1. 清空浏览器缓存
- 按 `Ctrl+Shift+Delete` (Windows) 或 `Cmd+Shift+Delete` (Mac)
- 清除所有缓存和Cookie

### 2. 打开开发者工具
- 按 `F12` 打开开发者工具
- 切换到 `Network` 标签

### 3. 访问首页测试
1. 访问首页：`https://www.macbonhi.cn`
2. 在Network中查找以下请求：
   - ✅ `/api/monitor/report` - 上报访问事件
   - ✅ `/api/monitor/visit-stats` - 获取访问统计

### 4. 检查控制台日志
在 `Console` 标签中应该看到：
```
✅ 首页访问统计上报成功
```

### 5. 验证数据显示
- 查看首页左上角的统计卡片
- "总访问量" 应该增加 +1
- "今日访问" 应该增加 +1

### 6. 多次测试
- 刷新页面3-5次
- 每次刷新都应该增加访问量
- 可以用不同浏览器测试（Chrome、Firefox、Safari等）

## 预期结果

修复后的效果：
- 📈 每次访问首页，总访问量 +1
- 📈 每次访问首页，今日访问量 +1
- ✅ 数据实时更新，无延迟
- ✅ 支持多浏览器、多设备统计

## 故障排查

如果访问量仍然不增加：

1. **检查后端日志**：
   ```bash
   docker-compose logs -f api
   ```

2. **检查数据库数据**：
   ```sql
   SELECT * FROM monitor_events 
   WHERE event_type = 'behavior' 
   AND event_name = 'page_view' 
   ORDER BY timestamp DESC LIMIT 10;
   ```

3. **手动测试API**：
   ```bash
   curl -X GET https://www.macbonhi.cn/api/monitor/visit-stats
   ```

## 技术细节

### 修复前的问题：
- ❌ `event_type: 'page_view'`
- ❌ `event_name: 'page_view_event'`

### 修复后的格式：
- ✅ `event_type: 'behavior'`
- ✅ `event_name: 'page_view'`

这样就与数据库查询条件完全匹配了！