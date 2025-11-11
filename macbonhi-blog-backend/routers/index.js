const serve = require('../controller/server')
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 确保所有上传相关目录都存在
const uploadDir = path.join(__dirname, '../uploads');
const tmpDir = path.join(__dirname, '../uploads/tmp');
const chunksDir = path.join(__dirname, '../uploads/chunks');

// 创建必要的目录结构
[uploadDir, tmpDir, chunksDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// 配置 multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir) // 上传目录
    },
    filename: function (req, file, cb) {
        // 生成唯一文件名
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'file-' + uniqueSuffix + ext);
    }
});

// 确保返回HTTPS URL
function getSecureFileUrl(req, filename) {
    const protocol = req.secure ? 'https' : 'https'; // 强制使用HTTPS
    const host = req.get('host');
    return `${protocol}://${host}/uploads/${filename}`;
}

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 } // 增加到100MB
});


module.exports = function (app) {
    // 在这里添加中间件
    app.use('/api/file', (req, res, next) => {
        req.url = req.url.replace(/^\/api/, '');
        next();
    });

    app.use((req, res, next) => {
        console.log('收到请求：', req.method, req.url, req.path);
        console.log('完整路径：', req.originalUrl);
        if (req.originalUrl.includes('/file/upload')) {
            console.log('上传请求体信息：', 
                req.headers['content-type'],
                req.files ? '有文件' : '无文件');
        }
        next();
    });

    app.get('/', (req, res) => {
        res.send('Hello World1')
    })

    //验证是否注册
    app.post('/isRegister', (req, res) => {
        serve.isRegister(req, res)
    })
    //管理员注册
    app.post('/insertUser', (req, res) => {

        serve.insertUser(req, res)
    })
    //用户注册
    app.post('/signin', (req, res) => {

        serve.signin(req, res)
    })

    //获取评论
    app.post('/comment', (req, res) => {
        if (typeof (req.body.token) !== 'undefined') {
            serve.getcomment(req, res)
        } else {
            res.send({
                code:400
            })
        }

    })

    //评论变为已读
    app.post('/commentisread', (req, res) => {
        if (typeof (req.body.token) !== 'undefined') {
            serve.commentisread(req, res)
        } else {
            res.send({
                code:400
            })
        }

    })
    
    //删除评论
    app.post('/deleteComment', (req, res) => {
        if (typeof (req.body.token) !== 'undefined') {
            serve.deleteComment(req, res)
        } else {
            res.send({
                code:400
            })
        }
    })

    //获取私信
    app.post('/message', (req, res) => {
        if (typeof (req.body.token) !== 'undefined') {
            serve.getmessage(req, res)
        } else {
            res.send({
                code:400    
            })
        }
    })

    //私信已读
    app.post('/messageisread', (req, res) => {
        if (typeof (req.body.token) !== 'undefined') {
            serve.messageisread(req, res)
        } else {
            res.send({
                code:400
            })
        }
    })

    //获取未读消息数量
    app.post('/getUnreadMessageCount', (req, res) => {
        if (typeof (req.body.token) !== 'undefined') {
            serve.getUnreadMessageCount(req, res)
        } else {
            res.send({
                code:400    
            })
        }
    })

    //删除私信
    app.post('/deleteMessage', (req, res) => {
        if (typeof (req.body.token) !== 'undefined') {
            serve.deleteMessage(req, res)
        } else {
            res.send({
                code: 400   
            })
        }
    })

    //获取文章
    app.post('/article', (req, res) => {
        if (typeof (req.body.token) !== 'undefined') {
            serve.getarticle(req, res)
        } else {
            res.send({
                code:400
            })
        }

    })

    //修改文章状态
    app.post('/changeArticleState', (req, res) => {
        if (typeof (req.body.token) !== 'undefined') {
            serve.changeArticleState(req, res)
        } else {
            res.send({
                code:400
            })
        }

    })

    //删除文章
    app.post('/deleteArticle', (req, res) => {
        if (typeof (req.body.token) !== 'undefined') {
            serve.deleteArticle(req, res)
        } else {
            res.send({
                code:400
            })
        }

    })

    //取得文章状态的条数
    app.post('/getArticleStateCount', (req, res) => {
        if (typeof (req.body.token) !== 'undefined') {
            serve.getArticleStateCount(req, res)
        } else {
            res.send({
                code:400
            })
        }

    })
    
    //获取分组
    app.post('/getClassiftyCount', (req, res) => {
        if (typeof (req.body.token) !== 'undefined') {
            serve.getClassiftyCount(req, res)
        } else {
            res.send({
                code:400
            })
        }

    })

    //新建分组
    app.post('/addSubset', (req, res) => {
        if (typeof (req.body.token) !== 'undefined') {
            serve.addSubset(req, res)
        } else {
            res.send({
                code:400
            })
        }

    })

    //修改分组
    app.post('/updateSubset', (req, res) => {
        if (typeof (req.body.token) !== 'undefined') {
            serve.updateSubset(req, res)
        } else {
            res.send({
                code:400
            })
        }

    })

    //删除分组
    app.post('/deleteSubset', (req, res) => {
        if (typeof (req.body.token) !== 'undefined') {
            serve.deleteSubset(req, res)
        } else {
            res.send({
                code:400
            })
        }

    })

    //获取标签
    app.post('/Label', (req, res) => {
        if (typeof (req.body.token) !== 'undefined') {
            serve.getLabel(req, res)
        } else {
            res.send({
                code:400
            })
        }

    })

    //新建标签
    app.post('/addLabel', (req, res) => {
        if (typeof (req.body.token) !== 'undefined') {
            serve.addLabel(req, res)
        } else {
            res.send({
                code:400
            })
        }

    })

    //删除标签
    app.post('/deleteLabel', (req, res) => {
        if (typeof (req.body.token) !== 'undefined') {
            serve.deleteLabel(req, res)
        } else {
            res.send({
                code:400
            })
        }

    })

    //获取文件
    app.post('/getFile', (req, res) => {
        if (typeof (req.body.token) !== 'undefined') {
            serve.getFile(req, res)
        } else {
            res.send({
                code:400
            })
        }

    })

    //移动文件
    app.post('/removeFile', (req, res) => {
        if (typeof (req.body.token) !== 'undefined') {
            serve.removeFile(req, res)
        } else {
            res.send({
                code:400
            })
        }

    })

    //新建日记
    app.post('/createDiary', (req, res) => {
        if (typeof (req.body.token) !== 'undefined') {
            serve.createDiary(req, res)
        } else {
            res.send({
                code:400
            })
        }

    })

    //获取日记
    app.post('/diary', (req, res) => {
        if (typeof (req.body.token) !== 'undefined') {
            serve.getDiary(req, res)
        } else {
            res.send({
                code:400
            })
        }

    })

    //删除日记
    app.post('/deleteDiary', (req, res) => {
        if (typeof (req.body.token) !== 'undefined') {
            serve.deleteDiary(req, res)
        } else {
            res.send({
                code:400
            })
        }

    })

    //新建文章/图库
    app.post('/addArticle', (req, res) => {
        if (typeof (req.body.token) !== 'undefined') {
            serve.addArticle(req, res)
        } else {
            res.send({
                code:400
            })
        }

    })

    //获取文章详情用于修改
    app.post('/gainArticle', (req, res) => {
        if (typeof (req.body.token) !== 'undefined') {
            serve.gainArticle(req, res)
        } else {
            res.send({
                code:400
            })
        }

    })

    //修改文章图库
    app.post('/updateArticle', (req, res) => {
        if (typeof (req.body.token) !== 'undefined') {
            serve.updateArticle(req, res)
        } else {
            res.send({
                code:400
            })
        }

    })

    // 上传文件路由 - 支持 file 字段名
    app.post('/file/upload', upload.any(), (req, res) => {
        console.log('开始处理文件上传请求');
        if (!req.files || req.files.length === 0) {
            console.log('未接收到文件');
            return res.send({
                code: 400,
                message: '未接收到文件'
            });
        }
        
        // 将第一个文件信息保存到req.file以保持与现有代码兼容
        req.file = req.files[0];
        
        // 调用服务层
        serve.uploadFile(req, res);
    });

    //删除文件
    app.post('/deleteFile', (req, res) => {
        if (typeof (req.body.token) !== 'undefined') {
            serve.delteFile(req, res)
        } else {
            res.send({
                code:400
            })
        }

    })

    //获取总览
    app.post('/overview', (req, res) => {
        if (typeof (req.body.token) != 'undefined') {
            serve.overview(req, res)
        } else {
            res.send({
                code:400
            })
        }

    })

    // 文件验证接口 - 支持秒传和断点续传
    app.post('/file/verify', (req, res) => {
        if (typeof (req.body.token) !== 'undefined') {
            serve.verifyFile(req, res);
        } else {
            res.send({
                code: 400,
                message: '缺少 token'
            });
        }
    });

    // 切片上传接口 - 配置单独的上传中间件
    const chunkStorage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, tmpDir);
        },
        filename: function (req, file, cb) {
            // 使用更精确的唯一文件名：时间戳 + 随机数 + 进程ID
            const uniqueId = Date.now() + '-' + Math.random().toString(36).substr(2, 9) + '-' + process.pid;
            cb(null, `chunk-${uniqueId}-blob`);
        }
    });

    const uploadChunk = multer({ 
        storage: chunkStorage,
        limits: { fileSize: 100 * 1024 * 1024 } // 100MB 限制
    });

    app.post('/file/chunk', uploadChunk.single('chunk'), (req, res) => {
        if (typeof (req.body.token) !== 'undefined') {
            serve.uploadChunk(req, res);
        } else {
            res.send({
                code: 400,
                message: '缺少 token'
            });
        }
    });

    // 文件合并接口
    app.post('/file/merge', (req, res) => {
        if (typeof (req.body.token) !== 'undefined') {
            serve.mergeFile(req, res);
        } else {
            res.send({
                code: 400,
                message: '缺少 token'
            });
        }
    });

    app.post('/downloadFile', (req, res) => {
        console.log('=== 下载文件请求 ===');
        console.log('请求体:', req.body);
        console.log('请求头:', req.headers);
        
        if (typeof (req.body.token) !== 'undefined') {
            serve.downloadFile(req, res);
        } else {
            console.log('缺少 token');
            res.status(400).json({
                code: 400,
                message: '缺少 token'
            });
        }
    });

    // 获取可下载文件API（排除图片类型）
    app.post('/getDownloadableFiles', (req, res) => {
        if (typeof (req.body.token) !== 'undefined') {
            serve.getDownloadableFiles(req, res)
        } else {
            res.send({
                code: 400
            })
        }
    })

    // 获取可下载文件分类计数API（排除图片类型）
    app.post('/getDownloadableClassifyCount', (req, res) => {
        if (typeof (req.body.token) !== 'undefined') {
            serve.getDownloadableClassifyCount(req, res)
        } else {
            res.send({
                code: 400
            })
        }
    })

    // 添加评论
    app.post('/addComment', (req, res) => {
        serve.addComment(req, res)
    })

    // 获取文章评论
    app.post('/articleComments', (req, res) => {
        serve.getArticleComments(req, res)
    })

    // 点赞相关（无需token验证）
    app.post('/addPraise', (req, res) => {
        serve.addPraise(req, res)
    })

    app.post('/cancelPraise', (req, res) => {
        serve.cancelPraise(req, res)
    })

    app.post('/getPraiseStatus', (req, res) => {
        serve.getPraiseStatus(req, res)
    })

    // 随笔评论相关路由
    app.post('/addDiaryComment', (req, res) => {
        serve.addDiaryComment(req, res)
    })

    app.post('/diaryComments', (req, res) => {
        serve.getDiaryComments(req, res)
    })

    // 随笔评论管理相关路由(需要token验证)
    app.post('/diaryCommentIsRead', (req, res) => {
        if (typeof (req.body.token) !== 'undefined') {
            serve.diaryCommentIsRead(req, res)
        } else {
            res.send({
                code: 400
            })
        }
    })

    app.post('/deleteDiaryComment', (req, res) => {
        if (typeof (req.body.token) !== 'undefined') {
            serve.deleteDiaryComment(req, res)
        } else {
            res.send({
                code: 400
            })
        }
    })

    // 根据日期获取日记
    app.post('/getDiaryByDate', (req, res) => {
        if (typeof (req.body.token) !== 'undefined') {
            serve.getDiaryByDate(req, res)
        } else {
            res.send({
                code: 400
            })
        }
    })
    
    // 获取离指定日期最近的日记
    app.post('/getNearestDiary', (req, res) => {
        if (typeof (req.body.token) !== 'undefined') {
            serve.getNearestDiary(req, res)
        } else {
            res.send({
                code: 400
            })
        }
    })

    // 点赞功能扩展路由
    app.post('/getBatchPraiseCounts', (req, res) => {
        serve.getBatchPraiseCounts(req, res)
    })

    app.post('/getPraiseRanking', (req, res) => {
        serve.getPraiseRanking(req, res)
    })

    app.post('/getRecentPraises', (req, res) => {
        serve.getRecentPraises(req, res)
    })

    app.post('/getUserPraiseHistory', (req, res) => {
        serve.getUserPraiseHistory(req, res)
    })

    // 点赞系统兼容路由
    app.post('/syncPraiseData', (req, res) => {
        if (typeof (req.body.token) !== 'undefined') {
            serve.syncPraiseData(req, res)
        } else {
            res.send({
                code: 400,
                message: '需要管理员权限'
            })
        }
    })

    app.post('/getArticlePraiseCount', (req, res) => {
        serve.getArticlePraiseCount(req, res)
    })

    // 评论回复相关路由
    app.post('/addCommentReply', (req, res) => {
        serve.addCommentReply(req, res)
    })

    app.post('/commentReplies', (req, res) => {
        serve.getCommentReplies(req, res)
    })

    app.post('/batchCommentReplies', (req, res) => {
        serve.getBatchCommentReplies(req, res)
    })

    // 管理员路由 - 需要token验证
    app.post('/replyIsRead', (req, res) => {
        if (typeof (req.body.token) !== 'undefined') {
            serve.replyIsRead(req, res)
        } else {
            res.send({
                code: 400
            })
        }
    })

    app.post('/deleteCommentReply', (req, res) => {
        if (typeof (req.body.token) !== 'undefined') {
            serve.deleteCommentReply(req, res)
        } else {
            res.send({
                code: 400
            })
        }
    })

    // 更新文章浏览量
    app.post('/updateArticleViews', (req, res) => {
        serve.updateArticleViews(req, res)
    })
    
    // 全局搜索API - 无需token验证
    app.post('/search', (req, res) => {
        serve.search(req, res)
    })

    // 监控数据上报API
    app.post('/api/monitor/report', (req, res) => {
        serve.reportMonitorEvent(req, res);
    })

    // 获取监控数据统计（需要token认证）
    app.post('/api/monitor/stats', (req, res) => {
        if (typeof (req.body.token) !== 'undefined') {
            serve.getMonitorStats(req, res);
        } else {
            res.send({
                code: 400,
                message: '需要管理员权限'
            });
        }
    })

    // 性能指标分析（需要token认证）
    app.post('/monitor/performance', (req, res) => {
        if (typeof (req.body.token) !== 'undefined') {
            serve.getPerformanceStats(req, res);
        } else {
            res.send({
                code: 400,
                message: '需要管理员权限'
            });
        }
    })
    
    // 设备统计分析（需要token认证）
    app.post('/monitor/devices', (req, res) => {
        if (typeof (req.body.token) !== 'undefined') {
            serve.getDeviceStats(req, res);
        } else {
            res.send({
                code: 400,
                message: '需要管理员权限'
            });
        }
    })
    
    // 组件访问统计（需要token认证）
    app.post('/monitor/components', (req, res) => {
        if (typeof (req.body.token) !== 'undefined') {
            serve.getComponentStats(req, res);
        } else {
            res.send({
                code: 400,
                message: '需要管理员权限'
            });
        }
    })
    
    // 页面访问统计（需要token认证）
    app.post('/monitor/pageviews', (req, res) => {
        if (typeof (req.body.token) !== 'undefined') {
            serve.getPageViewStats(req, res);
        } else {
            res.send({
                code: 400,
                message: '需要管理员权限'
            });
        }
    })
    
    // 错误统计分析（需要token认证）
    app.post('/monitor/errors', (req, res) => {
        if (typeof (req.body.token) !== 'undefined') {
            serve.getErrorStats(req, res);
        } else {
            res.send({
                code: 400,
                message: '需要管理员权限'
            });
        }
    })

    // 获取网站访问量趋势
    app.post('/api/monitor/visit-trends', (req, res) => {
        if (typeof (req.body.token) !== 'undefined') {
            serve.getVisitTrends(req, res);
        } else {
            res.send({
                code: 400,
                message: '需要管理员权限'
            });
        }
    })
    
    // 获取设备统计分析
    app.post('/api/monitor/device-analysis', (req, res) => {
        if (typeof (req.body.token) !== 'undefined') {
            serve.getDeviceAnalysis(req, res);
        } else {
            res.send({
                code: 400,
                message: '需要管理员权限'
            });
        }
    })
    
    // 获取内容类型访问统计
    app.post('/api/monitor/content-distribution', (req, res) => {
        if (typeof (req.body.token) !== 'undefined') {
            serve.getContentDistribution(req, res);
        } else {
            res.send({
                code: 400,
                message: '需要管理员权限'
            });
        }
    })
    
    // 获取访问统计数据（总访问量和今日访问量）- 无需token验证
    app.get('/api/monitor/visit-stats', (req, res) => {
        serve.getVisitStats(req, res);
    })
    
    // 调试内容分布统计
    app.post('/monitor/debug/content-distribution', (req, res) => {
        if (typeof (req.body.token) !== 'undefined') {
            serve.debugContentDistribution(req, res);
        } else {
            res.send({
                code: 400,
                message: '需要管理员权限'
            });
        }
    })

    // 为API路径直接添加路由
    app.post('/api/file/upload', upload.any(), (req, res) => {
        console.log('开始处理API文件上传请求');
        if (!req.files || req.files.length === 0) {
            console.log('API路径未接收到文件');
            return res.send({
                code: 400,
                message: '未接收到文件'
            });
        }
        
        req.file = req.files[0];
        serve.uploadFile(req, res);
    });

}