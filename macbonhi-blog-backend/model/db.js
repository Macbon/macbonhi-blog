const mysql = require('mysql')

const config = require('../config')  // 使用环境配置选择器
const { resolve } = require('path')
const { rejects } = require('assert')

//数据库连接
const connection = mysql.createConnection({
    host: config.database.HOST,
    user: config.database.USER,
    password: config.database.PASSWORD,
    authPlugins: {
        mysql_native_password: () => () => Buffer.from([0])
    }
})

//直接连接

let query = (sql, values) => {
    return new Promise((resolve, reject) => {
        connection.query(sql, values, (err, result) => {
            if (err) {
                reject(err)
            } else {
                resolve(result)
            }
        })
    })
}



//连接指定数据库 - 优化配置
const pool = mysql.createPool({
    connectionLimit: 10,
    host: config.database.HOST,
    user: config.database.USER,
    password: config.database.PASSWORD,
    database: config.database.DB,
    authPlugins: {
        mysql_native_password: () => () => Buffer.from([0])
    },
    // 新增连接配置，防止协议错误
    acquireTimeout: 60000,        // 获取连接超时时间
    timeout: 60000,               // 查询超时时间
    reconnect: true,              // 自动重连
    idleTimeout: 300000,          // 连接空闲超时
    idleTimeoutMillis: 300000,    // 连接空闲超时毫秒
    max: 10,                      // 最大连接数
    min: 2,                       // 最小连接数
    // 防止包顺序错误的关键配置
    supportBigNumbers: true,
    bigNumberStrings: true,
    dateStrings: true,
    debug: false,
    multipleStatements: true,     // 允许多语句查询
    ssl: false,                   // 关闭SSL，避免协议冲突
    charset: 'utf8mb4'            // 设置字符集
})

// 增强连接错误处理
pool.on('error', (err) => {
    console.error(`[${new Date().toISOString()}] 数据库连接池错误:`, err.code, err.message);
    
    // 处理各种连接错误
    switch(err.code) {
        case 'PROTOCOL_CONNECTION_LOST':
            console.error('数据库连接丢失，连接池将自动重连...');
            break;
        case 'PROTOCOL_PACKETS_OUT_OF_ORDER':
            console.error('数据包顺序错误，可能是网络问题或并发冲突');
            break;
        case 'ER_CON_COUNT_ERROR':
            console.error('数据库连接数超限');
            break;
        case 'ECONNREFUSED':
            console.error('数据库拒绝连接');
            break;
        default:
            console.error('未知数据库错误:', err);
    }
});

// 连接建立时的处理
pool.on('connection', (connection) => {
    console.log(`[${new Date().toISOString()}] 数据库连接建立成功 (ID: ${connection.threadId})`);
    
    // 设置连接级别的参数
    connection.query('SET sql_mode="STRICT_TRANS_TABLES"', (err) => {
        if (err) console.warn('设置SQL模式失败:', err.message);
    });
});

// 连接释放时的处理
pool.on('release', (connection) => {
    console.log(`[${new Date().toISOString()}] 数据库连接释放 (ID: ${connection.threadId})`);
});

// 增强数据库查询方法，添加更健壮的重试机制
let query2 = (sql, values, maxRetries = 3) => {
    let retries = 0;
    
    const tryQuery = () => {
        return new Promise((resolve, reject) => {
            pool.getConnection((err, connection) => {
                if (err) {
                    console.error(`[${new Date().toISOString()}] 获取数据库连接失败:`, err.code, err.message);
                    
                    // 对于致命错误，直接重试
                    if (retries < maxRetries && isRetryableError(err)) {
                        retries++;
                        const delay = Math.min(2000 * Math.pow(2, retries - 1), 10000); // 指数退避，最大10秒
                        console.log(`尝试第 ${retries}/${maxRetries} 次重试，${delay}ms后重试...`);
                        setTimeout(() => {
                            resolve(tryQuery());
                        }, delay);
                    } else {
                        reject(new Error(`获取数据库连接失败: ${err.message} (重试${retries}次后放弃)`));
                    }
                } else {
                    // 设置连接超时时间
                    connection.timeout = 60000;
                    
                    connection.query(sql, values, (err, rows) => {
                        // 确保连接被正确释放
                        if (connection && typeof connection.release === 'function') {
                            connection.release();
                        }
                        
                        if (err) {
                            console.error(`[${new Date().toISOString()}] 数据库查询失败:`, err.code, err.message);
                            console.error('SQL语句:', sql);
                            
                            // 对于可重试的错误进行重试
                            if (retries < maxRetries && isRetryableError(err)) {
                                retries++;
                                const delay = Math.min(1000 * Math.pow(2, retries - 1), 5000); // 指数退避
                                console.log(`查询失败，尝试第 ${retries}/${maxRetries} 次重试，${delay}ms后重试...`);
                                setTimeout(() => {
                                    resolve(tryQuery());
                                }, delay);
                            } else {
                                reject(new Error(`数据库查询失败: ${err.message} (重试${retries}次后放弃)`));
                            }
                        } else {
                            resolve(rows);
                        }
                    });
                }
            });
        });
    };
    
    return tryQuery();
}

// 判断错误是否可重试
function isRetryableError(err) {
    const retryableCodes = [
        'PROTOCOL_CONNECTION_LOST',
        'PROTOCOL_PACKETS_OUT_OF_ORDER', 
        'ECONNREFUSED',
        'ECONNRESET',
        'ETIMEDOUT',
        'ER_LOCK_WAIT_TIMEOUT',
        'ER_LOCK_DEADLOCK'
    ];
    
    return retryableCodes.includes(err.code);
}

// 添加连接池健康检查函数
function checkPoolHealth() {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection) => {
            if (err) {
                reject(err);
                return;
            }
            
            connection.query('SELECT 1 as health_check', (err, result) => {
                connection.release();
                
                if (err) {
                    reject(err);
                } else {
                    resolve({ 
                        status: 'healthy', 
                        timestamp: new Date().toISOString(),
                        connectionCount: pool._allConnections ? pool._allConnections.length : 'unknown'
                    });
                }
            });
        });
    });
}

//创建sql语句
let macbonhiblog = 'create database if not exists macbonhiblog default charset utf8 collate utf8_general_ci;'


//创建数据库
let createDatabase = (db) => {
    return query(db, [])
}

//创建数据表
//用户
let users =
    `create table if not exists users(
     id INT NOT NULL AUTO_INCREMENT,
     name VARCHAR(100) NOT NULL COMMENT '用户名',
     phone VARCHAR(100) NOT NULL COMMENT '手机',
     password VARCHAR(100) NOT NULL COMMENT '密码',
     moment VARCHAR(100) NOT NULL COMMENT '时间',
     PRIMARY KEY ( id )
);`

//分类
//只有在0的时候我们才有已发布和未发布的区分
let subset =
    `create table if not exists subset(
     id INT NOT NULL AUTO_INCREMENT,
     subset_name VARCHAR(100) NOT NULL COMMENT '分类名称',
     classify INT NOT NULL COMMENT '类型0文章，1图片，2资源',
     moment VARCHAR(100) NOT NULL COMMENT '时间',
     PRIMARY KEY ( id )
);`

//本地文件
let file =
    `create table if not exists file(
     id INT NOT NULL AUTO_INCREMENT,
     url VARCHAR(100) NOT NULL COMMENT '地址',
     file_name VARCHAR(100) NOT NULL COMMENT '名称',
     format VARCHAR(32) NOT NULL COMMENT '格式',
     subset_id INT COMMENT '所属分类',
     moment VARCHAR(100) NOT NULL COMMENT '时间',
     download_count INT DEFAULT 0 COMMENT '下载次数',
     file_size BIGINT COMMENT '文件大小(字节)',
     file_desc VARCHAR(500) COMMENT '文件描述',
     PRIMARY KEY ( id )
);`

let article =
    `create table if not exists article(
     id INT NOT NULL AUTO_INCREMENT,
     title VARCHAR(200) NOT NULL COMMENT '标题',
     subset_id INT COMMENT '所属分类',
     classify INT NOT NULL COMMENT '类型0文章，1图片',
     label VARCHAR(200) COMMENT '标签',
     introduce VARCHAR(1000) COMMENT '简介',
     content VARCHAR(5000) COMMENT '内容',
     cover VARCHAR(100) COMMENT '封面地址',
     views INT DEFAULT 0 COMMENT '查看次数',
     praise_count INT DEFAULT 0 COMMENT '点赞数量',
     state INT DEFAULT 0 COMMENT '文章状态',
     moment VARCHAR(100) NOT NULL COMMENT '时间',
     PRIMARY KEY ( id )
);`

//文章点赞
let praise =
`create table if not exists praise(
    id INT NOT NULL AUTO_INCREMENT,
    user_id VARCHAR(100) NOT NULL COMMENT '用户',
    user_type INT NOT NULL COMMENT '查看次数',
    article_id INT  NOT NULL COMMENT '所属文章',
    moment VARCHAR(100) NOT NULL COMMENT '时间',
    PRIMARY KEY ( id )
);`

let comment =
    `create table if not exists comment(
     id INT NOT NULL AUTO_INCREMENT,
     user_id VARCHAR(100) NOT NULL COMMENT '用户',
     user_type INT NOT NULL COMMENT '用户类型',
     user_name VARCHAR(100) COMMENT '用户名称',
     article_id INT  NOT NULL COMMENT '所属文章',
     moment VARCHAR(100) NOT NULL COMMENT '时间',
     content VARCHAR(1000) NOT NULL COMMENT '内容',
     complaint INT DEFAULT 0 COMMENT '举报次数',
     isread INT DEFAULT 0 COMMENT '是否已读',
     PRIMARY KEY ( id )
);`

let label =
    `create table if not exists label(
     id INT NOT NULL AUTO_INCREMENT,
     label_name VARCHAR(100) NOT NULL COMMENT '名称',
     moment VARCHAR(100) NOT NULL COMMENT '时间',
     PRIMARY KEY ( id )
);`

let diary =
    `create table if not exists diary(
     id INT NOT NULL AUTO_INCREMENT,
     title VARCHAR(200) NOT NULL COMMENT '标题',
     content VARCHAR(5000) NOT NULL COMMENT '内容',
     picture VARCHAR(500) COMMENT '图片地址',
     weather_id INT COMMENT '天气',
     mood INT DEFAULT 0 COMMENT '心情',
     moment VARCHAR(100) NOT NULL COMMENT '时间',
     PRIMARY KEY ( id )
);`

let weather =
    `create table if not exists weather(
     id INT NOT NULL AUTO_INCREMENT,
     weather_name VARCHAR(32) NOT NULL COMMENT '名称',
     icon VARCHAR(100) COMMENT '图标',
     PRIMARY KEY ( id )
);`

let message =
    `create table if not exists message(
     id INT NOT NULL AUTO_INCREMENT,
     user_id VARCHAR(100) NOT NULL COMMENT '用户',
     user_type INT NOT NULL COMMENT '用户类型',
     user_name VARCHAR(100) COMMENT '用户名称',
     moment VARCHAR(100) NOT NULL COMMENT '时间',
     content VARCHAR(1000) NOT NULL COMMENT '内容',
     isread INT DEFAULT 0 COMMENT '是否已读',
     PRIMARY KEY ( id )
);`

let record =
    `create table if not exists record(
     id INT NOT NULL AUTO_INCREMENT,
     user_id VARCHAR(100) NOT NULL COMMENT '用户',
     user_type INT NOT NULL COMMENT '用户类型',
     position VARCHAR(100) COMMENT '位置',
     isread INT DEFAULT 0 COMMENT '设备',
     moment VARCHAR(100) NOT NULL COMMENT '时间',
     PRIMARY KEY ( id )
);`

// 随笔评论表
let diary_comment =
    `create table if not exists diary_comment(
     id INT NOT NULL AUTO_INCREMENT,
     user_id VARCHAR(100) NOT NULL COMMENT '用户',
     user_type INT NOT NULL COMMENT '用户类型',
     user_name VARCHAR(100) COMMENT '用户名称',
     diary_id INT NOT NULL COMMENT '所属随笔',
     moment VARCHAR(100) NOT NULL COMMENT '时间',
     content VARCHAR(1000) NOT NULL COMMENT '内容',
     complaint INT DEFAULT 0 COMMENT '举报次数',
     isread INT DEFAULT 0 COMMENT '是否已读',
     PRIMARY KEY ( id )
);`

// 评论回复表
let comment_reply =
    `create table if not exists comment_reply(
     id INT NOT NULL AUTO_INCREMENT,
     user_id VARCHAR(100) NOT NULL COMMENT '用户',
     user_type INT NOT NULL COMMENT '用户类型',
     user_name VARCHAR(100) COMMENT '用户名称',
     comment_id INT NOT NULL COMMENT '所属评论',
     reply_type INT NOT NULL COMMENT '评论类型(0文章评论,1随笔评论)',
     moment VARCHAR(100) NOT NULL COMMENT '时间',
     content VARCHAR(1000) NOT NULL COMMENT '内容',
     complaint INT DEFAULT 0 COMMENT '举报次数',
     isread INT DEFAULT 0 COMMENT '是否已读',
     PRIMARY KEY ( id )
);`

// 点赞记录表(扩展)
let praise_record =
    `create table if not exists praise_record(
     id INT NOT NULL AUTO_INCREMENT,
     browser_id VARCHAR(100) NOT NULL COMMENT '浏览器指纹',
     target_id INT NOT NULL COMMENT '目标ID',
     target_type INT NOT NULL COMMENT '目标类型(0文章,1评论,2回复,3随笔,4随笔评论)',
     moment VARCHAR(100) NOT NULL COMMENT '时间',
     PRIMARY KEY ( id ),
     UNIQUE KEY (browser_id, target_id, target_type)
);`

let large_files = 
`create table if not exists large_files(
   id INT NOT NULL AUTO_INCREMENT,
   file_name VARCHAR(255) NOT NULL COMMENT '文件名称',
   file_hash VARCHAR(64) NOT NULL COMMENT '文件哈希值',
   file_size BIGINT NOT NULL COMMENT '文件大小(字节)',
   chunk_size INT NOT NULL COMMENT '分片大小(字节)',
   chunk_count INT NOT NULL COMMENT '分片总数',
   file_ext VARCHAR(32) COMMENT '文件扩展名',
   file_path VARCHAR(255) COMMENT '合并后的文件路径',
   status TINYINT DEFAULT 0 COMMENT '状态:0进行中,1已完成,2已失败',
   subset_id INT COMMENT '所属分类',
   file_desc VARCHAR(500) COMMENT '文件描述',
   create_time DATETIME NOT NULL COMMENT '创建时间',
   update_time DATETIME NOT NULL COMMENT '更新时间',
   PRIMARY KEY (id),
   UNIQUE KEY (file_hash)
);`

let file_chunks = 
`create table if not exists file_chunks(
   id INT NOT NULL AUTO_INCREMENT,
   file_hash VARCHAR(64) NOT NULL COMMENT '所属文件哈希',
   chunk_index INT NOT NULL COMMENT '分片索引',
   chunk_hash VARCHAR(100) NOT NULL COMMENT '分片哈希',
   chunk_size INT NOT NULL COMMENT '分片大小',
   chunk_path VARCHAR(255) COMMENT '分片存储路径',
   status TINYINT DEFAULT 0 COMMENT '状态:0待上传,1已上传',
   create_time DATETIME NOT NULL COMMENT '创建时间',
   PRIMARY KEY (id),
   UNIQUE KEY (file_hash, chunk_index),
   UNIQUE KEY (chunk_hash)
);`

// 监控事件主表
let monitor_events = `
create table if not exists monitor_events(
  id INT NOT NULL AUTO_INCREMENT,
  app_id VARCHAR(50) NOT NULL COMMENT '应用ID',
  session_id VARCHAR(64) NOT NULL COMMENT '会话ID',
  user_id VARCHAR(100) COMMENT '用户ID',
  event_type ENUM('error', 'performance', 'behavior', 'custom') NOT NULL COMMENT '事件类型',
  event_name VARCHAR(100) NOT NULL COMMENT '事件名称',
  level ENUM('fatal', 'error', 'warn', 'info', 'debug') NOT NULL COMMENT '级别',
  device_info JSON COMMENT '设备信息',
  page_url VARCHAR(255) NOT NULL COMMENT '页面URL',
  timestamp BIGINT NOT NULL COMMENT '客户端时间戳',
  moment VARCHAR(100) NOT NULL COMMENT '服务器时间',
  PRIMARY KEY (id),
  INDEX idx_session (session_id),
  INDEX idx_timestamp (timestamp),
  INDEX idx_event_type (event_type)
);`;

// 错误详情表
let monitor_errors = `
create table if not exists monitor_errors(
  id INT NOT NULL AUTO_INCREMENT,
  event_id INT NOT NULL COMMENT '关联事件ID',
  error_type VARCHAR(50) NOT NULL COMMENT '错误类型',
  error_message TEXT COMMENT '错误消息',
  error_stack TEXT COMMENT '错误堆栈',
  component VARCHAR(100) COMMENT 'Vue组件名',
  PRIMARY KEY (id),
  FOREIGN KEY (event_id) REFERENCES monitor_events(id)
);`;

// 性能指标表
let monitor_performance = `
create table if not exists monitor_performance(
  id INT NOT NULL AUTO_INCREMENT,
  event_id INT NOT NULL COMMENT '关联事件ID',
  metric_name VARCHAR(50) NOT NULL COMMENT '指标名称',
  metric_value FLOAT NOT NULL COMMENT '指标值',
  PRIMARY KEY (id),
  FOREIGN KEY (event_id) REFERENCES monitor_events(id)
);`;

// 用户行为表
let monitor_behaviors = `
create table if not exists monitor_behaviors(
  id INT NOT NULL AUTO_INCREMENT,
  event_id INT NOT NULL COMMENT '关联事件ID',
  action_type VARCHAR(50) NOT NULL COMMENT '行为类型',
  element_path VARCHAR(255) COMMENT '元素路径',
  action_value TEXT COMMENT '行为值',
  PRIMARY KEY (id),
  FOREIGN KEY (event_id) REFERENCES monitor_events(id)
);`;

//创建数据表

const createTable = (sql) => {
    return query2(sql, [])
}

//先创建数据库再创建表

async function create(){
  try {
    console.log('创建数据库...');
    await createDatabase(macbonhiblog);
    console.log('数据库创建完成，开始创建表...');
    
    // 使用Promise.all并发创建表
    await Promise.all([
      createTable(users),
      createTable(subset),
      createTable(file),
      createTable(article),
      createTable(praise),
      createTable(comment),
      createTable(label),
      createTable(diary),
      createTable(weather),
      createTable(message),
      createTable(record),
      createTable(diary_comment),
      createTable(comment_reply),
      createTable(praise_record),
      createTable(large_files),
      createTable(file_chunks),
      createTable(monitor_events),
      createTable(monitor_errors),
      createTable(monitor_performance),
      createTable(monitor_behaviors)
    ]);
    
    console.log('所有表创建完成');
    return true;
  } catch (err) {
    console.error('创建数据库/表失败:', err);
    throw err;
  }
}

// 不自动执行创建函数，而是导出
// connection.connect();  // 注释掉
// create();  // 注释掉

exports.query2 = query2;
exports.initDatabase = create;  // 导出初始化函数
exports.checkPoolHealth = checkPoolHealth;  // 导出健康检查函数
exports.pool = pool;  // 导出连接池（用于监控）
// const dbModel = require('./db_model');  // 注释掉或移到初始化成功后

