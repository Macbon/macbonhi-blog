let baseUrl = "";
let baseImgPath = "";

// 使用 Vite 的环境变量，而不是 process.env
if (import.meta.env.MODE === "development") {
    // 开发环境
    baseUrl = "/api";
    baseImgPath = "/uploads";
} else {
    // 生产环境
    baseUrl = "/api";
    baseImgPath = "/uploads";
}

// 添加调试日志
console.log('env.ts 配置:', {
    MODE: import.meta.env.MODE,
    baseUrl,
    baseImgPath
});

export { baseUrl, baseImgPath };