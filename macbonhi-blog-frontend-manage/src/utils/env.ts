let baseUrl = "";

let baseImgPath = "";

if (process.env.NODE_ENV === "development") {
    //开发环境
    baseUrl = "/api";
    baseImgPath = "/uploads";
} else {
    //服务器
    baseUrl = "/api";
    baseImgPath = "/uploads";
}


export { baseUrl, baseImgPath };
