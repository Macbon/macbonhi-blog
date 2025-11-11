const express = require('express')
const app = express()
const config = require('./config') // 修改为使用环境配置选择器
const jwt = require('./lib/jwt')
const initDb = require('./init-db')  // 导入初始化模块
const db = require('./model/db')
app.use(express.static(__dirname + '/data'))
const path = require('path');
// 静态文件服务配
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//跨域问题 - 增强CORS配置
const cors = require('cors')

// 详细的CORS配置
app.use(cors({
  // 允许的域名列表
  origin: function (origin, callback) {
    // 生产环境直接允许
    if (process.env.NODE_ENV === 'production') {
      callback(null, true);  // 改为 true 而不是 origin
      return;
    }
    // 环境特定的允许域名列表
    const allowedOrigins = config.corsOptions?.allowedOrigins || [
      'http://localhost:5173', 
      'http://localhost:5174',
      'http://localhost:8080',
      'http://127.0.0.1:5173', 
      'http://127.0.0.1:5174',
      'http://127.0.0.1:8080',
      'https://117.72.117.152',      // 添加生产环境域名
      'http://117.72.117.152'        // 同时支持HTTP版本
    ];
    
    // 允许任何源请求（生产环境可选）
    if (process.env.NODE_ENV === 'production') {
      callback(null, true);  // 生产环境允许所有来源
    } 

    // 开发环境检查白名单
    else if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, origin);
    } else {
      console.log(`拒绝来自 ${origin} 的跨域请求`);
      callback(null, allowedOrigins[0]);
    }
  },
  credentials: true,
  maxAge: 86400,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: [
    'Content-Disposition', 
    'Content-Length', 
    'Content-Type', 
    'Accept-Ranges', 
    'Cache-Control'
  ]
}));

//解析前端数据 - 增加文件大小限制
app.use(express.json({ limit: '100mb' }))
app.use(express.urlencoded({ extended: true, limit: '100mb' })) 

//token处理
app.use(async(req, res, next) => {
  // 检查req.body是否存在且包含token
  if (req.body && req.body.token) {
    let token = req.body.token;
    
    // 允许guest访问公开内容
    if (token === 'guest') {
      req.isGuest = true; // 标记为游客访问
      next();
      return;
    }
    
    let isok = jwt.verifyToken(token);

    if (isok) {
      next();
    } else {
      //验证未通过
      res.send({
        code: 300,
        message: 'token验证失败'
      })
    }
  } else {
    next();
  }
})

// 引入路由
require('./routers/index')(app)

// 使用文件路由
const fileRoutes = require('./routers/file')
app.use('/api/file', fileRoutes)

// 添加健康检查端点 - 增强版本
app.get('/health', async (req, res) => {
  try {
    // 检查数据库连接健康状态
    const db = require('./model/db');
    const dbHealth = await db.checkPoolHealth();
    
    res.status(200).send({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database: dbHealth,
      service: 'macbonhi-api',
      version: '1.0.0'
    });
  } catch (error) {
    console.error('健康检查失败:', error);
    res.status(503).send({ 
      status: 'error', 
      timestamp: new Date().toISOString(),
      error: error.message,
      service: 'macbonhi-api'
    });
  }
});

// 启动服务器前初始化数据库
const startServer = async () => {
  // 尝试初始化数据库
  console.log('正在初始化数据库...');
  const dbInitialized = await initDb.initDatabase();
  
  if (!dbInitialized) {
    console.error('数据库初始化失败，应用无法启动');
    process.exit(1);
  }
  
  // 数据库初始化成功后再加载模型和启动服务器
  const dbModel = require('./model/db_model');
  
  app.listen(config.port, () => {
    console.log(`数据库初始化成功，服务已启动，监听端口 ${config.port}`)
  });
};

startServer().catch(err => {
  console.error('启动服务器失败:', err);
  process.exit(1);
});  