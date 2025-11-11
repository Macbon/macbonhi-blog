// 生产环境配置
const config = {
    port: process.env.PORT || 3000,
    database: {
        HOST: process.env.DB_HOST || "db",  // 在Docker环境中连接到db服务
        USER: process.env.DB_USER || "root",
        PASSWORD: process.env.DB_PASSWORD || "root",
        DB: process.env.DB_NAME || "macbonhiblog"
    },
    corsOptions: {
        // 生产环境下允许的域名
        allowedOrigins: [
            'https://macbonhi.cn',
            'http://macbonhi.cn',
            'https://www.macbonhi.cn',
            'http://www.macbonhi.cn'
        ]
    }
}

module.exports = config; 