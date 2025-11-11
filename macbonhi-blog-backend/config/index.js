// 根据环境变量加载不同的配置

// 获取当前环境
const env = process.env.NODE_ENV || 'development';

// 根据环境加载对应的配置文件
let config;

if (env === 'production') {
  // 生产环境
  config = require('./production');
  console.log('加载生产环境配置');
} else {
  // 开发环境
  config = require('./default');
  console.log('加载开发环境配置');
}

module.exports = config; 