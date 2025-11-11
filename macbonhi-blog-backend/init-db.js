const mysql = require('mysql');
const config = require('./config');
const db = require('./model/db');

// 连接函数
const connectWithRetry = async (maxRetries = 30, retryInterval = 5000) => {
  let retries = 0;
  
  // 尝试连接到MySQL (不指定数据库)
  const connection = mysql.createConnection({
    host: config.database.HOST,
    user: config.database.USER,
    password: config.database.PASSWORD,
    authPlugins: {
      mysql_native_password: () => () => Buffer.from([0])
    }
  });
  
  return new Promise((resolve, reject) => {
    function tryConnect() {
      connection.connect(err => {
        if (err) {
          console.error(`数据库连接失败 (${retries + 1}/${maxRetries}):`, err.message);
          retries++;
          
          if (retries >= maxRetries) {
            reject(new Error('数据库连接重试达到最大次数'));
            return;
          }
          
          setTimeout(tryConnect, retryInterval);
        } else {
          console.log('数据库连接成功，开始初始化...');
          resolve(connection);
        }
      });
    }
    
    tryConnect();
  });
};

const initDatabase = async () => {
  try {
    // 等待连接建立
    const connection = await connectWithRetry();
    
    console.log('开始创建数据库和表结构...');
    
    // 使用db.js中的create函数初始化数据库
    await db.initDatabase();
    
    console.log('数据库初始化成功！');
    return true;
  } catch (error) {
    console.error('数据库初始化失败:', error);
    return false;
  }
};

// 导出初始化函数
module.exports = { initDatabase };
