const dbModel = require('../model/db_model')
const jwt = require('../lib/jwt')
const mkdir = require('../lib/mkdir')
const path = require('path');
const fs = require('fs');
const os = require('os');

//是否注册
exports.isRegister = async (req, res) => {
    //查询数据库是否有注册用户
    await dbModel.isRegister().then((result) => {
        let code = 401 //401是未注册
        if (result[0].count > 0) {
            //已注册
            code = 200
        }
        res.send({
            code: code,
        })
    })
}

//管理员注册
exports.insertUser = async (req, res) => {
    let data = req.body;

    await dbModel.insertUser(data).then(() => {

        res.send({
            code: 200,
        })
    })
}

//管理员登录
exports.signin = async (req, res) => {
    let data = req.body;

    await dbModel.signin(data.name).then((result) => {

        if (result.length > 0 && data.password == result[0].password) {

            let token = jwt.generateToken(data.name)

            let message = {
                name: data.name,
                token: token,
                id: result[0].id,
            }

            res.send({
                code: 200,
                data: message,
            })
        } else {
            res.send({
                code: 400,
                message: '用户名或密码错误',
            })
        }

    })
}

//获取评论
exports.getcomment = async (req, res) => {
    let data = req.body;
    let count = -1;

    await dbModel.getcommentpage(data.pageSize, data.nowPage).then(async (result) => {

        if (data.count) {
            let c = await dbModel.getcommentcount(-1);
            count = c[0].count;
        }

        if (result.length > 0) {

            for (let i = 0; i < result.length; i++){
                let getArticleTitle = await dbModel.getArticleTitle(result[i].article_id)

                if (getArticleTitle.length > 0) {
                    result[i].article = {
                        id: result[i].article_id,
                        title: getArticleTitle[0].title
                    }
                } else {
                    result[i].article = {
                        id: -1,
                        title: '未知',
                    }
                }
            }
        }

        res.send({
            code:200,
            data: {
                count,
                result,
            }
        })

    })
}

//评论变为已读
exports.commentisread = async (req, res) => {
    let data = req.body;

    await dbModel.commentisread(data.id).then(() => {
        res.send({
            code:200,
        })
    })
}

//删除评论
exports.deleteComment = async (req, res) => {
    let data = req.body;

    await dbModel.deleteComment(data.id).then(() => {
        res.send({
            code:200,
        })
    })
}

//获取私信
exports.getmessage = async (req, res) => {
    let data = req.body;
    let count = -1;

    await dbModel.getMessagePage(data.pagesize, data.nowpage).then( async (result) => {

        if (data.count) {
            let c = await dbModel.getMessageCount();
            count = c[0].count;
        }

        res.send({
            code:200,
            data: {
                count,
                result,
            }
        })

    })
}

//私信已读
exports.messageisread = async (req, res) => {
    let data = req.body;

    await dbModel.messageisread(data.id).then(() => {
        res.send({
            code:200,
        })
    })
}

//获取未读消息的数量    
exports.getUnreadMessageCount = async (req, res) => {
    let data = req.body;

    await dbModel.getUnreadMessageCount().then((result) => {
        res.send({
            code: 200,  
            data: result[0].count,
        })
    })
}

//删除私信
exports.deleteMessage = async (req, res) => {
    let data = req.body;

    await dbModel.deleteMessage(data.id).then(() => {
        res.send({
            code:200,
        })
    })
}

//获取文章
exports.getarticle = async (req, res) => {
    let data = req.body;
    let count = -1;

    await dbModel.getArticlePage(data.pageSize, data.nowPage, data.state, data.subsetId, data.searchTerm, data.classify).then( async (result) => {

        if (data.count) {
            let c = await dbModel.getArticleCount(data.state, data.subsetId, data.searchTerm, data.classify);
            count = c[0].count;
        }


        res.send({
            code:200,
            data: {
                count,
                result,
            }
        })

    })
}


//获取文章发布时的状态
exports.changeArticleState = async (req, res) => {
    let data = req.body;

    await dbModel.changeArticleState(data.articleId, data.state).then( () => {

        res.send({
            code:200,

        })

    })
}

//删除文章
exports.deleteArticle = async (req, res) => {
    let data = req.body;

    await dbModel.deleteArticle(data.articleId).then( () => {

        res.send({
            code:200,

        })

    })
}

//文章状态条数获取
exports.getArticleStateCount = async (req, res) => {


    let noState = await dbModel.getArticleCount(0, -1, "", 0);

    let isState = await dbModel.getArticleCount(1, -1, "", 0);

    let message = [
        {
            id: 0,
            name: "未发布",
            value: noState[0].count,
        },
        {
            id: 1,
            name: "已发布",
            value: isState[0].count,
        },

    ]

    res.send({
        code: 200,
        data: message,
        
    })
}

//获取分组
exports.getClassiftyCount = async (req, res) => {

    let data = req.body;

    await dbModel.getClassifyCount(data.classify).then( async (result) => {

        if (data.classify === 0 || data.classify === 1) {
            let count = await dbModel.getArticleCount(-1, -1, "", data.classify);
            let list = [];
            if (result.length > 0) {
                for (let i = 0; i < result.length; i++){
                    let value = await dbModel.getArticleCount(-1, result[i].id, "", data.classify);
                    list[i] = {
                        id: result[i].id,
                        count: value[0].count,
                        name: result[i].subset_name,
                    }
                }
            }
            res.send({
                code:200,
                data: {
                    count: count[0].count,
                    list,
                }
            })


        } else if (data.classify === 2) {
            let count = await dbModel.getFileCount(-1);
            let list = [];
            if (result.length > 0) {
                for (let i = 0; i < result.length; i++){
                    // 获取每个分组下的文章数量
                    let value = await dbModel.getFileCount(result[i].id);
                    list[i] = {
                        id: result[i].id,
                        count: value[0].count,
                        name: result[i].subset_name,
                    }
                }
            }
            res.send({
                code:200,
                data: {
                    count: count[0].count,
                    list,
                }
            })
        }

    })
}

//新建分组
exports.addSubset = async (req, res) => {
    let data = req.body;

    await dbModel.addSubset({
        moment: data.value.moment,
        classify: data.value.classify,
        subset_name: data.value.name
    }).then( (result) => {
        res.send({
            code:200,
            data:result.insertId,
        })

    })
}

//修改分组名称
exports.updateSubset = async (req, res) => {
    let data = req.body;
    // 参数验证
    if (!data.subsetID || !data.subsetName) {
        return res.send({
            code: 400,
            message: "分组ID和名称不能为空"
        });
    }
    
    await dbModel.updateSubset(data.subsetID, data.subsetName).then( () => {
        res.send({
            code:200,
        })
    }).catch(err => {
        console.error("更新分组错误:", err);
        res.send({
            code: 500,
            message: "更新分组失败"
        });
    })
}

//删除分组
exports.deleteSubset = async (req, res) => {
    let data = req.body;

    await dbModel.deleteSubset(data.subsetID).then( () => {

        res.send({
            code:200,

        })

    })
}

//获取标签
exports.getLabel = async (req, res) => {

    await dbModel.getLabel().then((result) => {

        res.send({
            code:200,
            data:result,
        })

    })
}

//新建标签
exports.addLabel = async (req, res) => {
    let data = req.body;

    await dbModel.addLabel(data.value).then( () => {

        res.send({
            code:200,

        })

    })
}

//删除标签
exports.deleteLabel = async (req, res) => {
    let data = req.body;

    await dbModel.deleteLabel(data.LabelId).then( () => {
        res.send({
            code:200,
        })
    }).catch(err => {
        console.error("删除标签错误:", err);
        res.send({
            code: 500,
            message: "删除标签失败"
        });
    })
}

//获取文件
exports.getFile = async (req, res) => {
    let data = req.body;
    let count = -1;

    await dbModel.getFilePage(data.pagesize, data.nowpage, data.subsetId).then( async (result) => {

        if (data.count) {
            let c = await dbModel.getFileCount(data.subsetId);
            count = c[0].count;
        }

        res.send({
            code:200,
            data: {
                count,
                result,
            }
        })

    })
}

//移动文件
exports.removeFile = async (req, res) => {
    let data = req.body;

    await dbModel.removeFile(data.fileId, data.subsetId).then( () => {

        res.send({
            code:200,

        })

    })
}

//获取日记
exports.getDiary = async (req, res) => {
    let data = req.body;
    let count = -1;

    await dbModel.getDiaryPage(data.value.pageSize, data.value.nowPage, data.value.searchTerm).then( async (result) => {

        if (data.value.count) {
            let c = await dbModel.getDiaryCount(data.value.searchTerm);
            count = c[0].count;
        }

        if (result.length > 0) {
            for (let i = 0; i < result.length; i++){
                if (result[i].picture) {
                    result[i].picture = result[i].picture.split(',');
                }
            }
        }

        res.send({
            code:200,
            data: {
                count,
                result,
            }
        })

    })
}

//删除标签
exports.deleteDiary = async (req, res) => {
    let data = req.body;

    await dbModel.deleteDiary(data.diaryId).then( () => {

        res.send({
            code:200,

        })

    })
}

//新建文章/图库
exports.addArticle = async (req, res) => {
    let data = req.body;

    try {
        console.log('收到发布文章请求:', JSON.stringify(data, null, 2));
        
        // 兼容两种数据格式：data.value 和直接扁平化数据
        let articleData = data.value || data;
        
        // 确保必要字段存在
        if (!articleData.title || !articleData.content) {
            return res.send({
                code: 400,
                message: '缺少必要字段：标题或内容'
            });
        }
        
        // 确保数据格式正确
        const processedData = {
            title: articleData.title,
            content: articleData.content,
            introduce: articleData.introduce || articleData.inroduce || '', // 兼容字段名差异
            cover: articleData.cover || '',
            subset_id: articleData.subset_id || 0,
            label: Array.isArray(articleData.label) ? 
                   articleData.label.join(',') : 
                   (articleData.label || ''),
            classify: articleData.classify || 0,
            state: articleData.state || 0,
            moment: articleData.moment || new Date()
        };
        
        console.log('处理后的文章数据:', JSON.stringify(processedData, null, 2));
        
        const result = await dbModel.createArticle(processedData);
        
        res.send({
            code: 200,
            data: { id: result.insertId },
            message: '发布成功'
        });
        
    } catch (error) {
        console.error('发布文章失败:', error);
        res.send({
            code: 500,
            message: '服务器内部错误: ' + error.message
        });
    }
}

//获取文章用于修改
exports.gainArticle = async (req, res) => {
    let data = req.body;

    await dbModel.gainArticle(data.articleId).then((result) => {
        // 修复：确保返回的是对象而不是数组
        const articleData = result && result.length > 0 ? result[0] : {};
        
        res.send({
            code: 200,
            data: articleData,
        });
    }).catch(error => {
        console.error('获取文章详情失败:', error);
        res.send({
            code: 500,
            message: '获取文章详情失败'
        });
    });
}

//文章图库修改
exports.updateArticle = async (req, res) => {
    let data = req.body;

    try {
        console.log('收到更新文章请求:', JSON.stringify(data, null, 2));
        
        if (!data.id) {
            return res.send({
                code: 400,
                message: '缺少文章ID'
            });
        }
        
        // 兼容两种数据格式：data.value 和直接扁平化数据
        let articleData = data.value || data;
        
        // 确保必要字段存在
        if (!articleData.title || !articleData.content) {
            return res.send({
                code: 400,
                message: '缺少必要字段：标题或内容'
            });
        }
        
        // 确保数据格式正确
        const processedData = {
            title: articleData.title,
            content: articleData.content,
            introduce: articleData.introduce || articleData.inroduce || '', // 兼容字段名差异
            cover: articleData.cover || '',
            subset_id: articleData.subset_id || 0,
            label: Array.isArray(articleData.label) ? 
                   articleData.label.join(',') : 
                   (articleData.label || ''),
            classify: articleData.classify || 0,
            state: articleData.state || 0,
            moment: articleData.moment || new Date()
        };
        
        console.log('处理后的文章数据:', JSON.stringify(processedData, null, 2));
        
        await dbModel.updateArticle(data.id, processedData);
        
        res.send({
            code: 200,
            message: '更新成功'
        });
        
    } catch (error) {
        console.error('更新文章失败:', error);
        res.send({
            code: 500,
            message: '服务器内部错误: ' + error.message
        });
    }
}

//新建日记
exports.createDiary = async (req, res) => {
    let data = req.body;
    
    try {
        // 处理图片数据，确保是规范的JSON字符串
        let pictureData = data.picture;
        if (pictureData) {
            // 如果已经是字符串形式的JSON数组，保持不变
            if (typeof pictureData === 'string') {
                try {
                    // 尝试解析，确认是有效JSON
                    JSON.parse(pictureData);
                } catch (e) {
                    // 解析失败，说明不是有效JSON，进行转换
                    if (pictureData.includes(',')) {
                        // 如果包含逗号，可能是逗号分隔的路径
                        const paths = pictureData.split(',').filter(Boolean).map(p => ({url: p.trim()}));
                        pictureData = JSON.stringify(paths);
                    } else {
                        // 单个路径
                        pictureData = JSON.stringify([{url: pictureData.trim()}]);
                    }
                }
            } else if (Array.isArray(pictureData)) {
                // 如果是数组，直接转为JSON字符串
                pictureData = JSON.stringify(pictureData);
            } else {
                // 其他情况，设为空数组
                pictureData = JSON.stringify([]);
            }
        } else {
            // 没有图片数据，设为空数组
            pictureData = JSON.stringify([]);
        }
        
        // 过滤掉token字段，只保留数据库需要的字段
        const diaryData = {
            title: data.title,
            content: data.content,
            picture: pictureData, // 保存规范的JSON字符串
            weather_id: data.weather_id,
            moment: data.moment
            // mood字段有默认值，可以不传
        };

        await dbModel.createDiary(diaryData);
        res.send({
            code: 200,
            message: '创建成功'
        });
    } catch (error) {
        console.error('创建日记失败:', error);
        res.send({
            code: 500,
            message: '创建失败'
        });
    }
}

//上传文件
exports.uploadFile = async (req, res) => {
    try {
        console.log('服务层处理上传开始');
        
        // 检查请求内容
        if (!req.file) {
            console.error('服务层错误: 未接收到文件');
            return res.status(400).send({
                code: 400,
                message: '未接收到文件'
            });
        }
        
        console.log('接收到文件:', req.file.originalname, '大小:', req.file.size);
        
        // 验证存储目录是否存在且可写
        const uploadDir = path.join(__dirname, '../uploads');
        
        if (!fs.existsSync(uploadDir)) {
            console.error('创建上传目录:', uploadDir);
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        // 检查写入权限
        try {
            fs.accessSync(uploadDir, fs.constants.W_OK);
            console.log('上传目录写入权限正常');
        } catch (err) {
            console.error('上传目录没有写入权限:', err);
            return res.status(500).send({
                code: 500,
                message: '服务器配置错误: 上传目录没有写入权限'
            });
        }
        
        // 执行原有逻辑
        const fileFormat = req.file.originalname.split('.').pop().toLowerCase();
        
        // 构建完整的访问URL
        const host = req.get('host') || 'localhost:3000';
        const protocol = 'https'; // 强制HTTPS
        const fullUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
        
        const fileData = {
            url: `/uploads/${req.file.filename}`,
            file_name: req.file.originalname,
            format: fileFormat,
            subset_id: req.body.subset_id || null,
            moment: new Date().toLocaleString(),
            file_size: req.file.size || null,
            file_desc: req.body.file_desc || null
        };
        
        console.log('保存文件信息到数据库:', fileData.file_name);
        
        try {
            const result = await dbModel.uploadFile(fileData);
            console.log('数据库保存成功, ID:', result.insertId);
            
            res.send({
                code: 200,
                data: {
                    id: result.insertId,
                    url: fullUrl,
                    file_name: fileData.file_name,
                    format: fileData.format,
                    subset_id: fileData.subset_id,
                    moment: fileData.moment,
                    size: req.file.size,
                    mimetype: req.file.mimetype
                }
            });
        } catch (dbError) {
            console.error('数据库保存失败:', dbError);
            res.status(500).send({
                code: 500,
                message: '数据库保存失败: ' + dbError.message
            });
        }
    } catch (error) {
        console.error('文件上传处理错误:', error);
        res.status(500).send({
            code: 500,
            message: '文件上传失败: ' + error.message
        });
    }
};

//删除文件
exports.delteFile = async (req, res) => {

    let data = req.body;
    await dbModel.deleteFile(data.filesId).then( async () => {

        //处理真实文件删除
        mkdir.delteFiles(data.filesUrl)

        res.send({
            code:200,
        })

    })
}

//获取数据总览
exports.overview = async (req, res) => {
    try {
        let article = await dbModel.getArticleCount(-1, -1, "", 0);
        let gallery = await dbModel.getArticleCount(-1, -1, "", 1);
        let diary = await dbModel.getDiaryCount("");
        let file = await mkdir.getFilesSize('./uploads');

        //处理后的file文件，这里返回的是字节我们需要处理一下
        let mkfile = 0;
        if (file < 1024 * 1024) {
            mkfile = (file / 1024).toFixed(2) + ' KB'
        } else if(file < 1024 * 1024 * 1024) {
            mkfile = (file / 1024 / 1024).toFixed(2) + ' MB'
        } else {
            mkfile = (file / 1024 / 1024 / 1024).toFixed(2) + ' GB'
        }

        let data = {
            article: article[0].count,
            gallery: gallery[0].count,
            diary: diary[0].count,
            file: mkfile,
        }
        res.send({
            code: 200,
            data: data,
        })
    } catch (error) {
        console.error('获取数据总览出错:', error);
        res.status(500).json({
            code: 500,
            message: '获取数据总览失败'
        });
    }
}

// 验证文件是否存在 - 支持秒传和断点续传
// 修复后的 verifyFile 函数
exports.verifyFile = async (req, res) => {
    try {
        const { fileHash, fileName, size, chunkSize, subsetId, fileDesc, token } = req.body;
        
        // 添加参数验证
        if (!fileHash || !fileName) {
            return res.send({
                code: 400,
                message: '文件哈希和文件名不能为空'
            });
        }
        
        const fileSize = parseInt(size);
        const chunkSizeNum = parseInt(chunkSize);
        
        if (isNaN(fileSize) || fileSize <= 0) {
            return res.send({
                code: 400,
                message: '文件大小无效'
            });
        }
        
       
        // 检查文件是否已存在（支持秒传）
        const existFile = await dbModel.checkFileExistByHash(fileHash);
        
        if (existFile && existFile.length > 0) {
            
            // 构建完整的文件信息
            const fileInfo = {
                id: existFile[0].id,
                file_name: existFile[0].file_name,
                file_path: existFile[0].file_path,
                file_size: existFile[0].file_size,
                status: existFile[0].status,
                create_time: existFile[0].create_time,
                update_time: existFile[0].update_time
            };
            
            return res.send({
                code: 200,
                data: {
                    shouldUpload: false,
                    file: fileInfo
                },
                message: '文件已存在，可以秒传'
            });
        }
        
        // 检查是否有进行中的上传任务
        const inProgressFile = await dbModel.checkFileInProgress(fileHash);
        
        if (inProgressFile && inProgressFile.length > 0) {
            // 获取已上传的切片列表
            const uploadedChunks = await dbModel.getUploadedChunks(fileHash);
            const uploadedList = uploadedChunks.map(item => item.chunk_index);
            
            
            return res.send({
                code: 200,
                data: {
                    shouldUpload: true,
                    uploadedList
                },
                message: '找到未完成的上传任务，支持断点续传'
            });
        }
        
        // 创建新的上传任务
        const chunkCount = Math.ceil(fileSize / chunkSizeNum);
             
        await dbModel.createFileUploadTask({
            fileName,
            fileHash,
            fileSize,
            chunkSize: chunkSizeNum,
            chunkCount,
            fileExt: fileName.lastIndexOf('.') > -1 ? fileName.slice(fileName.lastIndexOf('.')) : '',
            subsetId,
            fileDesc
        });
        
        await dbModel.initializeChunks(fileHash, chunkCount);
        
        return res.send({
            code: 200,
            data: {
                shouldUpload: true,
                uploadedList: []
            },
            message: '文件不存在，需要上传'
        });
    } catch (error) {
        console.error('验证文件错误:', error);
        console.error('错误堆栈:', error.stack);
        res.send({
            code: 500,
            message: '验证文件失败: ' + error.message
        });
    }
};

exports.uploadChunk = async (req, res) => {
    try {
        const { fileHash, chunkIndex, token } = req.body;
        const file = req.file;


        if (!file) {

            return res.send({
                code: 400,
                message: '未接收到文件切片'
            });
        }
        
        if (!fileHash || chunkIndex === undefined) {
            return res.send({
                code: 400,
                message: '缺少必要参数'
            });
        }

        
        // 确保切片索引是有效数字
        const chunkIndexNum = parseInt(chunkIndex);
        if (isNaN(chunkIndexNum) || chunkIndexNum < 0) {
            return res.send({
                code: 400,
                message: '切片索引无效'
            });
        }
        
        
        // 检查文件是否已经完成
        try {
            const existingFile = await dbModel.checkFileExistByHash(fileHash);
            
            if (existingFile && existingFile.length > 0) {
                
                // 清理临时文件
                if (file.path && fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
                
                return res.send({
                    code: 400,
                    message: '文件已存在，无需重复上传'
                });
            }
            
            
        } catch (dbError) {
            console.error('数据库查询异常 - checkFileExistByHash:', dbError);
            console.error('数据库查询异常堆栈:', dbError.stack);
            return res.send({
                code: 500,
                message: '数据库查询失败: ' + dbError.message
            });
        }

        
        // 检查切片是否已经上传
        try {

            const existingChunk = await dbModel.checkChunkExists(fileHash, chunkIndexNum);

            
            if (existingChunk && existingChunk.length > 0) {
                
                // 清理临时文件
                if (file.path && fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
                
                return res.send({
                    code: 200,
                    data: {
                        fileHash,
                        chunkIndex: chunkIndexNum,
                        chunkSize: file.size
                    },
                    message: '切片已存在，跳过上传'
                });
            }
            
            
        } catch (dbError) {
            console.error('数据库查询异常 - checkChunkExists:', dbError);
            console.error('数据库查询异常堆栈:', dbError.stack);
            return res.send({
                code: 500,
                message: '切片查询失败: ' + dbError.message
            });
        }
        

        // 确保上传根目录存在
        const uploadsDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        // 确保临时目录存在
        const tmpDir = path.join(__dirname, '../uploads/tmp');
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }
        
        // 确保chunks基础目录存在
        const chunksBaseDir = path.join(__dirname, '../uploads/chunks');
        if (!fs.existsSync(chunksBaseDir)) {
            fs.mkdirSync(chunksBaseDir, { recursive: true });
        }
        
        // 确保切片存储目录存在
        const chunksDir = path.join(__dirname, `../uploads/chunks/${fileHash}`);
        if (!fs.existsSync(chunksDir)) {
            fs.mkdirSync(chunksDir, { recursive: true });
        }
        
        
        // 检查源文件是否存在
        if (!file.path || !fs.existsSync(file.path)) {
            
            // 重要修复：检查是否是multer的默认路径问题
            // 尝试使用multer的默认临时存储位置
            const possiblePaths = [
                file.path,
                path.join(tmpDir, path.basename(file.path || '')),
                path.join(os.tmpdir(), path.basename(file.path || '')),
                path.join(__dirname, '..', file.path || '')
            ];
            
            
            let foundPath = null;
            for (const testPath of possiblePaths) {
                if (testPath && fs.existsSync(testPath)) {
                    foundPath = testPath;
                    break;
                }
            }
            
            if (!foundPath) {
                console.error('无法找到源文件');
                return res.send({
                    code: 400,
                    message: '上传的临时文件不存在或无法访问'
                });
            }
            
            // 使用找到的文件路径
            file.path = foundPath;
        } else {
            
        }
        
        // 切片存储路径
        const chunkPath = path.join(chunksDir, `${chunkIndexNum}`);

        try {
            // 使用fs.copyFile代替renameSync以避免跨设备问题
            fs.copyFileSync(file.path, chunkPath);
            
            // 复制成功后删除源文件
            try {
                fs.unlinkSync(file.path);
            } catch (deleteError) {
                console.error('删除临时文件出错，但不影响上传:', deleteError);
                // 删除失败不影响上传，继续处理
            }
            
        } catch (copyError) {
            console.error('复制文件失败:', copyError);
            console.error('复制详情:', { source: file.path, target: chunkPath, error: copyError.message });
            return res.send({
                code: 500,
                message: '保存切片失败: ' + copyError.message
            });
        }
        

        // 更新切片信息
        try {
            await dbModel.saveChunkInfo({
                fileHash,
                chunkIndex: chunkIndexNum,
                chunkSize: file.size,
                chunkPath: `uploads/chunks/${fileHash}/${chunkIndexNum}`
            });
        } catch (dbError) {
            console.error('数据库保存异常 - saveChunkInfo:', dbError);
            console.error('数据库保存异常堆栈:', dbError.stack);
            return res.send({
                code: 500,
                message: '保存切片信息失败: ' + dbError.message
            });
        }

        res.send({
            code: 200,
            data: {
                fileHash,
                chunkIndex: chunkIndexNum,
                chunkSize: file.size
            },
            message: '切片上传成功'
        });
    } catch (error) {
        console.error('上传切片错误:', error);
        console.error('错误堆栈:', error.stack);
        
        // 清理临时文件
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (err) {
                console.error('清理临时文件失败:', err);
            }
        }
        
        res.send({
            code: 500,
            message: '上传切片失败: ' + error.message
        });
    }
};

// 合并文件切片
// 优化后的 mergeFile 函数，添加延迟和自动重试机制
exports.mergeFile = async (req, res) => {
    // 重试机制的相关设置
    const maxRetries = 2; // 最大重试次数
    const delayBeforeMerge = 800; // 合并前的延迟时间(毫秒)，给文件系统足够时间完成写入
    let retryCount = 0;
    let lastError = null;
    
    // 创建包含重试逻辑的内部合并函数
    const attemptMerge = async () => {
        try {
            const { fileHash, fileName, size, subsetId, fileDesc, token } = req.body;
            
            
            // 参数验证
            if (!fileHash || !fileName) {
                return res.send({
                    code: 400,
                    message: '缺少必要参数'
                });
            }
            
            const fileSize = parseInt(size);
            if (isNaN(fileSize) || fileSize <= 0) {
                return res.send({
                    code: 400,
                    message: '文件大小无效'
                });
            }
            
            // 修复：首先检查文件是否已经完成
            const existingFile = await dbModel.checkFileExistByHash(fileHash);
            if (existingFile && existingFile.length > 0) {
                
                // 清理临时文件
                if (file.path && fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
                
                // 返回成功，告知前端文件已存在（秒传成功）
                return res.send({
                    code: 200,
                    data: {
                        shouldUpload: false,
                        file: existingFile[0]  // 返回已存在的文件信息
                    },
                    message: '文件已存在，秒传成功'
                });
            }
            
            // 获取进行中的文件信息
            const fileInfo = await dbModel.checkFileInProgress(fileHash);
            if (!fileInfo || fileInfo.length === 0) {
                console.error('未找到上传任务:', fileHash);
                return res.send({
                    code: 404,
                    message: '未找到上传任务，请重新上传文件'
                });
            }
            
            // 获取所有切片
            const chunks = await dbModel.getChunksByFileHash(fileHash);
            
            // 检查是否所有切片都已上传
            const isAllUploaded = chunks.every(chunk => chunk.status === 1);
            if (!isAllUploaded) {
                const uploadedCount = chunks.filter(chunk => chunk.status === 1).length;
                console.error(`还有切片未上传完成: ${uploadedCount}/${chunks.length}`);
                return res.send({
                    code: 400,
                    message: `还有切片未上传完成: ${uploadedCount}/${chunks.length}`
                });
            }
            
            // 确保上传根目录存在
            const uploadsDir = path.join(__dirname, '../uploads');
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }
            
            // 确保chunks目录存在
            const chunksBaseDir = path.join(__dirname, '../uploads/chunks');
            if (!fs.existsSync(chunksBaseDir)) {
                fs.mkdirSync(chunksBaseDir, { recursive: true });
            }
            
            // 确保切片存储目录存在
            const chunksDir = path.join(__dirname, `../uploads/chunks/${fileHash}`);
            if (!fs.existsSync(chunksDir)) {
                console.error(`切片目录不存在: ${chunksDir}`);
                return res.send({
                    code: 404,
                    message: '切片目录不存在，请重新上传文件'
                });
            }
            
            await new Promise(resolve => setTimeout(resolve, delayBeforeMerge));
            
            // 生成唯一文件名
            const ext = path.extname(fileName);
            const uniqueFileName = `file-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
            const filePath = path.join(uploadsDir, uniqueFileName);
            
            // 创建写入流
            const writeStream = fs.createWriteStream(filePath);
            
            try {
                // 按顺序读取所有切片并写入目标文件
                for (let i = 0; i < chunks.length; i++) {
                    const chunkPath = path.join(__dirname, '..', chunks[i].chunk_path);

                    
                    if (fs.existsSync(chunkPath)) {
                        await new Promise((resolve, reject) => {
                            const readStream = fs.createReadStream(chunkPath);
                            readStream.pipe(writeStream, { end: false });
                            readStream.on('end', () => {
                                resolve();
                            });
                            readStream.on('error', (err) => {
                                console.error(`切片 ${i} 读取失败:`, err);
                                reject(err);
                            });
                        });
                    } else {
                        console.error(`切片文件不存在: ${chunkPath}`);
                        writeStream.destroy();
                        throw new Error(`切片文件不存在: ${chunkPath}`);
                    }
                }
                
                writeStream.end();
                
                // 等待写入流完全关闭
                await new Promise(resolve => writeStream.on('close', resolve));
                
                // 更新文件状态为已完成
                await dbModel.updateFileStatus(fileHash, 1, `/uploads/${uniqueFileName}`);
                
                // 保存文件信息到文件表
                const fileData = {
                    fileName,
                    filePath: `/uploads/${uniqueFileName}`,
                    fileSize,
                    fileExt: ext.substring(1),
                    subsetId,
                    fileDesc
                };
                
                await dbModel.saveCompletedFile(fileData);
                
                // 清理切片文件
                try {
                    const chunksDir = path.join(__dirname, `../uploads/chunks/${fileHash}`);
                    if (fs.existsSync(chunksDir)) {
                        fs.rm(chunksDir, { recursive: true, force: true }, (err) => {
                            if (err) {
                                console.error('清理切片目录失败:', err);
                            } else {
                                // 清理数据库中的切片记录
                                dbModel.deleteFileChunks(fileHash).catch(err => {
                                    console.error('清理切片记录失败:', err);
                                });
                            }
                        });
                    }
                } catch (cleanupError) {
                    // 仅记录错误，不中断流程
                    console.error('清理切片文件失败:', cleanupError);
                }
                
                // 构建完整的访问URL
                const protocol = req.protocol || 'http';
                const host = req.get('host') || 'localhost:3000';
                const fullUrl = `${protocol}://${host}/uploads/${uniqueFileName}`;
                
                
                res.send({
                    code: 200,
                    data: {
                        url: fullUrl,
                        fileName
                    },
                    message: '文件合并成功'
                });
                
            } catch (mergeError) {
                console.error('[合并] 文件合并过程中出错:', mergeError);
                writeStream.destroy();
                
                // 删除不完整的文件
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
                
                throw mergeError;
            }
        } catch (error) {
            lastError = error;
            console.error(`[合并] 合并文件错误 (尝试 ${retryCount+1}/${maxRetries+1}):`, error);
            
            // 如果还有重试机会，则进行重试
            if (retryCount < maxRetries) {
                retryCount++;
                await new Promise(resolve => setTimeout(resolve, 3000)); // 等待3秒后重试
                return attemptMerge();
            } else {
                // 重试次数用尽，返回错误
                console.error('[合并] 已达最大重试次数，合并失败');
                return res.send({
                    code: 500,
                    message: '合并文件失败，已达最大重试次数: ' + lastError.message
                });
            }
        }
    };
    
    // 启动首次合并尝试
    await attemptMerge();
};

// 文件下载
exports.downloadFile = async (req, res) => {
    try {
        const { fileId, token } = req.body;
        
        console.log('下载文件参数:', { fileId, token });
        
        // 参数验证
        if (!fileId) {
            return res.status(400).json({
                code: 400,
                message: '文件ID不能为空'
            });
        }
        
        // 获取文件信息
        const fileResult = await dbModel.getFileById(fileId);
        
        if (!fileResult || fileResult.length === 0) {
            return res.status(404).json({
                code: 404,
                message: '文件不存在'
            });
        }
        
        const fileInfo = fileResult[0];
        console.log('文件信息:', fileInfo);
        
        // 构建文件路径
        const filePath = path.join(__dirname, '..', fileInfo.url);
        console.log('文件路径:', filePath);
        
        // 检查文件是否存在
        if (!fs.existsSync(filePath)) {
            console.error('文件不存在:', filePath);
            return res.status(404).json({
                code: 404,
                message: '文件不存在或已被删除'
            });
        }
        
        // 获取文件大小
        const stat = fs.statSync(filePath);
        const fileSize = stat.size;
        
        console.log('文件大小:', fileSize);
        
        // 处理文件名 - 确保正确编码
        const originalFileName = fileInfo.file_name;
        const encodedFilename = encodeURIComponent(originalFileName);
        
        console.log('原始文件名:', originalFileName);
        console.log('编码后文件名:', encodedFilename);
        
        // 设置文件下载相关的响应头（不需要设置 CORS，blog.js 已经处理了）
        res.setHeader('Content-Length', fileSize);
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'no-cache');
        
        console.log('设置响应头完成');
        
        // 设置超时
        req.setTimeout(600000);
        res.setTimeout(600000);
        
        // 创建文件读取流
        const fileStream = fs.createReadStream(filePath);
        
        // 监听流事件
        fileStream.on('open', () => {
            console.log('文件流打开成功');
        });
        
        fileStream.on('error', (err) => {
            console.error('文件流错误:', err);
            if (!res.headersSent) {
                res.status(500).json({
                    code: 500,
                    message: '文件读取失败'
                });
            }
        });
        
        fileStream.on('end', () => {
            console.log('文件流结束');
        });
        
        // 将文件流管道到响应
        fileStream.pipe(res);
        
    } catch (error) {
        console.error('下载文件错误:', error);
        if (!res.headersSent) {
            res.status(500).json({
                code: 500,
                message: '下载文件失败: ' + error.message
            });
        }
    }
};

// 获取可下载文件（排除图片）
exports.getDownloadableFiles = async (req, res) => {
    let data = req.body;
    let count = -1;

    try {
        // 参数验证和默认值设置
        const pagesize = data.pagesize && !isNaN(data.pagesize) ? parseInt(data.pagesize) : 8;
        const nowpage = data.nowpage && !isNaN(data.nowpage) ? parseInt(data.nowpage) : 1;
        const subsetId = data.subsetId !== undefined ? data.subsetId : -1;

        // 获取文件列表
        const result = await dbModel.getDownloadableFilePage(pagesize, nowpage, subsetId);

        // 获取总数
        if (data.count) {
            const c = await dbModel.getDownloadableFileCount(subsetId);
            count = c[0].count;
        }

        // 处理URL，确保有完整路径
        if (result.length > 0) {
            const protocol = req.protocol || 'http';
            const host = req.get('host') || 'localhost:3000';
            
            for (let i = 0; i < result.length; i++) {
                // 如果url不是完整URL，添加域名前缀
                if (!result[i].url.startsWith('http')) {
                    result[i].file_url = `${protocol}://${host}${result[i].url.startsWith('/') ? '' : '/'}${result[i].url}`;
                } else {
                    result[i].file_url = result[i].url;
                }
            }
        }

        

        res.send({
            code: 200,
            data: {
                total: count,
                data: result
            }
        });
    } catch (error) {
        console.error('获取可下载文件失败:', error);
        res.send({
            code: 500,
            message: '获取可下载文件失败'
        });
    }
}

// 获取可下载文件分类计数（排除图片）
exports.getDownloadableClassifyCount = async (req, res) => {
    let data = req.body;

    try {
        // 获取所有分类
        const result = await dbModel.getClassifyCount(data.classify);
        
        // 获取可下载文件总数（排除图片）
        const count = await dbModel.getDownloadableFileCount(-1);
        
        // 处理分类列表
        let list = [];
        if (result.length > 0) {
            for (let i = 0; i < result.length; i++) {
                // 获取每个分类下的可下载文件数量（排除图片）
                const value = await dbModel.getDownloadableFileCountBySubset(result[i].id);
                list[i] = {
                    id: result[i].id,
                    count: value[0].count,
                    name: result[i].subset_name,
                };
            }
        }
        
        res.send({
            code: 200,
            data: {
                count: count[0].count,
                list,
            }
        });
    } catch (error) {
        console.error('获取可下载文件分类计数失败:', error);
        res.send({
            code: 500,
            message: '获取可下载文件分类计数失败'
        });
    }
}

// 添加评论
exports.addComment = async (req, res) => {
    try {
        const data = req.body;
        
        // 必要参数验证
        if (!data.content || !data.article_id) {
            return res.send({
                code: 400,
                message: '缺少必要参数'
            });
        }
        
        // 准备评论数据
        const commentData = {
            user_id: data.user_id || '匿名用户',
            user_type: data.user_type || 1, // 默认为匿名(1)
            user_name: data.user_name || null,
            article_id: data.article_id,
            content: data.content,
            moment: new Date().toLocaleString(),
            isread: 0
        };
        
        // 保存评论
        const result = await dbModel.createComment(commentData);
        
        res.send({
            code: 200,
            data: {
                id: result.insertId,
                ...commentData
            },
            message: '评论成功'
        });
    } catch (error) {
        console.error('添加评论失败:', error);
        res.send({
            code: 500,
            message: '添加评论失败: ' + error.message
        });
    }
}

// 获取文章评论
exports.getArticleComments = async (req, res) => {
    try {
        const data = req.body;
        
        // 必要参数验证
        if (!data.article_id) {
            return res.send({
                code: 400,
                message: '缺少文章ID'
            });
        }
        
        // 获取评论列表
        const comments = await dbModel.getArticleComments(
            data.article_id,
            data.pageSize,
            data.nowPage
        );
        
        // 获取评论总数
        let count = -1;
        if (data.count) {
            const countResult = await dbModel.getcommentcount(data.article_id);
            count = countResult[0].count;
        }
        
        // 获取每条评论的点赞数
        if (comments.length > 0) {
            for (let i = 0; i < comments.length; i++) {
                const praiseCount = await dbModel.getPraiseRecordCount(comments[i].id, 1); // 1表示评论
                comments[i].praise_count = praiseCount[0].count;
                
                // 如果有浏览器ID，检查用户是否已点赞该评论
                if (data.browser_id) {
                    const isPraised = await dbModel.checkPraiseStatus(data.browser_id, comments[i].id, 1);
                    comments[i].is_praised = isPraised.length > 0;
                } else {
                    comments[i].is_praised = false;
                }
            }
        }
        
        res.send({
            code: 200,
            data: {
                count,
                comments
            }
        });
    } catch (error) {
        console.error('获取文章评论失败:', error);
        res.send({
            code: 500,
            message: '获取文章评论失败: ' + error.message
        });
    }
}

// 添加点赞
exports.addPraise = async (req, res) => {
    try {
        const data = req.body;
        
        // 必要参数验证
        if (!data.browser_id || !data.target_id || data.target_type === undefined) {
            return res.send({
                code: 400,
                message: '缺少必要参数'
            });
        }
        
        // 检查是否已点赞
        const existingPraise = await dbModel.checkPraiseStatus(
            data.browser_id,
            data.target_id,
            data.target_type
        );
        
        if (existingPraise.length > 0) {
            return res.send({
                code: 400,
                message: '已经点过赞了'
            });
        }
        
        // 准备点赞数据
        const praiseData = {
            browser_id: data.browser_id,
            target_id: data.target_id,
            target_type: data.target_type,
            moment: new Date().toLocaleString()
        };
        
        let praiseCount = 0;
        
        // 如果是文章点赞，使用事务同时更新两张表
        if (data.target_type === 0) {
            const result = await dbModel.addArticlePraise(praiseData);
            praiseCount = result.count;
        } else {
            // 其他类型点赞，只操作praise_record表
            await dbModel.addPraiseRecord(praiseData);
            const countResult = await dbModel.getPraiseRecordCount(data.target_id, data.target_type);
            praiseCount = countResult[0].count;
        }
        
        res.send({
            code: 200,
            data: {
                count: praiseCount,
                is_praised: true
            },
            message: '点赞成功'
        });
    } catch (error) {
        console.error('点赞失败:', error);
        res.send({
            code: 500,
            message: '点赞失败: ' + error.message
        });
    }
}

// 取消点赞
exports.cancelPraise = async (req, res) => {
    try {
        const data = req.body;
        
        // 必要参数验证
        if (!data.browser_id || !data.target_id || data.target_type === undefined) {
            return res.send({
                code: 400,
                message: '缺少必要参数'
            });
        }
        
        let praiseCount = 0;
        
        // 如果是文章点赞，使用事务同时更新两张表
        if (data.target_type === 0) {
            const result = await dbModel.removeArticlePraise(
                data.browser_id,
                data.target_id,
                data.target_type
            );
            praiseCount = result.count;
        } else {
            // 其他类型点赞，只操作praise_record表
            await dbModel.removePraiseRecord(
                data.browser_id,
                data.target_id,
                data.target_type
            );
            const countResult = await dbModel.getPraiseRecordCount(data.target_id, data.target_type);
            praiseCount = countResult[0].count;
        }
        
        res.send({
            code: 200,
            data: {
                count: praiseCount,
                is_praised: false
            },
            message: '取消点赞成功'
        });
    } catch (error) {
        console.error('取消点赞失败:', error);
        res.send({
            code: 500,
            message: '取消点赞失败: ' + error.message
        });
    }
}

// 获取点赞状态
exports.getPraiseStatus = async (req, res) => {
    try {
        const data = req.body;
        
        // 必要参数验证
        if (!data.browser_id || !data.target_id || data.target_type === undefined) {
            return res.send({
                code: 400,
                message: '缺少必要参数'
            });
        }
        
        // 检查点赞状态
        const existingPraise = await dbModel.checkPraiseStatus(
            data.browser_id,
            data.target_id,
            data.target_type
        );
        
        let praiseCount = 0;
        
        // 如果是文章，直接从article表获取点赞数
        if (data.target_type === 0) {
            const articleResult = await dbModel.gainArticle(data.target_id);
            if (articleResult && articleResult.length > 0) {
                praiseCount = articleResult[0].praise_count || 0;
            }
        } else {
            // 其他类型从praise_record表计算
            const countResult = await dbModel.getPraiseRecordCount(data.target_id, data.target_type);
            praiseCount = countResult[0].count;
        }
        
        res.send({
            code: 200,
            data: {
                count: praiseCount,
                is_praised: existingPraise.length > 0
            }
        });
    } catch (error) {
        console.error('获取点赞状态失败:', error);
        res.send({
            code: 500,
            message: '获取点赞状态失败: ' + error.message
        });
    }
}

// 添加随笔评论
exports.addDiaryComment = async (req, res) => {
    try {
        const data = req.body;
        
        // 必要参数验证
        if (!data.content || !data.diary_id) {
            return res.send({
                code: 400,
                message: '缺少必要参数'
            });
        }
        
        // 准备评论数据
        const commentData = {
            user_id: data.user_id || '匿名用户',
            user_type: data.user_type || 1, // 默认为匿名(1)
            user_name: data.user_name || null,
            diary_id: data.diary_id,
            content: data.content,
            moment: new Date().toLocaleString(),
            isread: 0
        };
        
        // 保存评论
        const result = await dbModel.createDiaryComment(commentData);
        
        res.send({
            code: 200,
            data: {
                id: result.insertId,
                ...commentData
            },
            message: '评论成功'
        });
    } catch (error) {
        console.error('添加随笔评论失败:', error);
        res.send({
            code: 500,
            message: '添加随笔评论失败: ' + error.message
        });
    }
}

// 获取随笔评论
exports.getDiaryComments = async (req, res) => {
    try {
        const data = req.body;
        
        // 必要参数验证
        if (!data.diary_id) {
            return res.send({
                code: 400,
                message: '缺少随笔ID'
            });
        }
        
        // 获取评论列表
        const comments = await dbModel.getDiaryComments(
            data.diary_id,
            data.pageSize,
            data.nowPage
        );
        
        // 获取评论总数
        let count = -1;
        if (data.count) {
            const countResult = await dbModel.getDiaryCommentCount(data.diary_id);
            count = countResult[0].count;
        }
        
        // 获取每条评论的点赞数
        if (comments.length > 0) {
            for (let i = 0; i < comments.length; i++) {
                const praiseCount = await dbModel.getPraiseRecordCount(comments[i].id, 4); // 4表示随笔评论
                comments[i].praise_count = praiseCount[0].count;
                
                // 如果有浏览器ID，检查用户是否已点赞该评论
                if (data.browser_id) {
                    const isPraised = await dbModel.checkPraiseStatus(data.browser_id, comments[i].id, 4);
                    comments[i].is_praised = isPraised.length > 0;
                } else {
                    comments[i].is_praised = false;
                }
            }
        }
        
        res.send({
            code: 200,
            data: {
                count,
                comments
            }
        });
    } catch (error) {
        console.error('获取随笔评论失败:', error);
        res.send({
            code: 500,
            message: '获取随笔评论失败: ' + error.message
        });
    }
}

// 随笔评论标记为已读
exports.diaryCommentIsRead = async (req, res) => {
    try {
        const data = req.body;
        
        if (!data.id) {
            return res.send({
                code: 400,
                message: '缺少评论ID'
            });
        }
        
        await dbModel.diaryCommentIsRead(data.id);
        
        res.send({
            code: 200,
            message: '标记已读成功'
        });
    } catch (error) {
        console.error('标记已读失败:', error);
        res.send({
            code: 500,
            message: '标记已读失败: ' + error.message
        });
    }
}

// 删除随笔评论
exports.deleteDiaryComment = async (req, res) => {
    try {
        const data = req.body;
        
        if (!data.id) {
            return res.send({
                code: 400,
                message: '缺少评论ID'
            });
        }
        
        await dbModel.deleteDiaryComment(data.id);
        
        res.send({
            code: 200,
            message: '删除评论成功'
        });
    } catch (error) {
        console.error('删除评论失败:', error);
        res.send({
            code: 500,
            message: '删除评论失败: ' + error.message
        });
    }
}

// 批量获取点赞数
exports.getBatchPraiseCounts = async (req, res) => {
    try {
        const data = req.body;
        
        // 必要参数验证
        if (!data.target_ids || !Array.isArray(data.target_ids) || data.target_type === undefined) {
            return res.send({
                code: 400,
                message: '缺少必要参数或参数格式错误'
            });
        }
        
        // 获取批量点赞数
        const praiseCounts = await dbModel.getBatchPraiseCounts(data.target_ids, data.target_type);
        
        // 转换为更易于前端使用的格式 {id1: count1, id2: count2, ...}
        const resultMap = {};
        data.target_ids.forEach(id => {
            resultMap[id] = 0; // 默认为0
        });
        
        praiseCounts.forEach(item => {
            resultMap[item.target_id] = item.count;
        });
        
        // 如果有浏览器ID，检查用户已点赞的内容
        let userPraisedIds = [];
        if (data.browser_id) {
            const promises = data.target_ids.map(id => 
                dbModel.checkPraiseStatus(data.browser_id, id, data.target_type)
            );
            
            const results = await Promise.all(promises);
            userPraisedIds = data.target_ids.filter((id, index) => results[index].length > 0);
        }
        
        res.send({
            code: 200,
            data: {
                counts: resultMap,
                praised_ids: userPraisedIds
            }
        });
    } catch (error) {
        console.error('获取批量点赞数失败:', error);
        res.send({
            code: 500,
            message: '获取批量点赞数失败: ' + error.message
        });
    }
}

// 获取点赞排行榜
exports.getPraiseRanking = async (req, res) => {
    try {
        const data = req.body;
        
        // 必要参数验证
        if (data.target_type === undefined) {
            return res.send({
                code: 400,
                message: '缺少目标类型参数'
            });
        }
        
        // 获取点赞排行榜
        const ranking = await dbModel.getPraiseRanking(data.target_type, data.limit);
        
        // 根据目标类型获取详细信息
        let detailedRanking = [];
        
        if (data.target_type === 0) { // 文章
            for (const item of ranking) {
                const articleInfo = await dbModel.gainArticle(item.target_id);
                if (articleInfo && articleInfo.length > 0) {
                    detailedRanking.push({
                        id: item.target_id,
                        title: articleInfo[0].title,
                        praise_count: item.praise_count,
                        cover: articleInfo[0].cover,
                        type: '文章'
                    });
                }
            }
        } else if (data.target_type === 1) { // 评论
            // 处理评论排行榜...可以根据需要获取更多信息
            detailedRanking = ranking.map(item => ({
                id: item.target_id,
                praise_count: item.praise_count,
                type: '评论'
            }));
        } else if (data.target_type === 3) { // 随笔
            for (const item of ranking) {
                const diaryInfo = await dbModel.getDiaryPage(1, 1, null, item.target_id);
                if (diaryInfo && diaryInfo.length > 0) {
                    detailedRanking.push({
                        id: item.target_id,
                        title: diaryInfo[0].title,
                        praise_count: item.praise_count,
                        type: '随笔'
                    });
                }
            }
        }
        
        res.send({
            code: 200,
            data: detailedRanking
        });
    } catch (error) {
        console.error('获取点赞排行榜失败:', error);
        res.send({
            code: 500,
            message: '获取点赞排行榜失败: ' + error.message
        });
    }
}

// 获取最近点赞内容
exports.getRecentPraises = async (req, res) => {
    try {
        const data = req.body;
        
        // 必要参数验证
        if (data.target_type === undefined) {
            return res.send({
                code: 400,
                message: '缺少目标类型参数'
            });
        }
        
        // 获取最近点赞内容
        const recentPraises = await dbModel.getRecentPraises(data.target_type, data.limit);
        
        // 同样可以根据目标类型获取详细信息，类似getPraiseRanking函数
        // 此处简化处理，直接返回ID和点赞数
        
        res.send({
            code: 200,
            data: recentPraises
        });
    } catch (error) {
        console.error('获取最近点赞内容失败:', error);
        res.send({
            code: 500,
            message: '获取最近点赞内容失败: ' + error.message
        });
    }
}

// 获取用户点赞历史
exports.getUserPraiseHistory = async (req, res) => {
    try {
        const data = req.body;
        
        // 必要参数验证
        if (!data.browser_id) {
            return res.send({
                code: 400,
                message: '缺少浏览器ID参数'
            });
        }
        
        // 获取用户点赞历史
        const history = await dbModel.getUserPraiseHistory(data.browser_id, data.limit);
        
        // 可以根据target_type获取更详细的信息
        // 此处简化处理，直接返回原始数据
        
        res.send({
            code: 200,
            data: history
        });
    } catch (error) {
        console.error('获取用户点赞历史失败:', error);
        res.send({
            code: 500,
            message: '获取用户点赞历史失败: ' + error.message
        });
    }
}

// 同步旧点赞系统数据到新系统(仅管理员可用)
exports.syncPraiseData = async (req, res) => {
    try {
        if (typeof (req.body.token) === 'undefined') {
            return res.send({
                code: 400,
                message: '需要管理员权限'
            });
        }
        
        // 执行同步操作
        const result = await dbModel.syncOldPraises();
        
        res.send({
            code: 200,
            data: {
                synced_count: result.length
            },
            message: `成功同步 ${result.length} 条点赞数据`
        });
    } catch (error) {
        console.error('同步点赞数据失败:', error);
        res.send({
            code: 500,
            message: '同步点赞数据失败: ' + error.message
        });
    }
}

// 获取文章点赞数(兼容两个系统)
exports.getArticlePraiseCount = async (req, res) => {
    try {
        const data = req.body;
        
        // 必要参数验证
        if (!data.article_id) {
            return res.send({
                code: 400,
                message: '缺少文章ID参数'
            });
        }
        
        // 获取文章点赞数
        const praiseCount = await dbModel.getArticlePraiseCount(data.article_id);
        
        // 检查用户是否已点赞
        let isPraised = false;
        if (data.browser_id) {
            // 检查新系统
            const newSystemPraise = await dbModel.checkPraiseStatus(
                data.browser_id, 
                data.article_id, 
                0
            );
            
            // 检查旧系统
            let _sql = `SELECT * FROM praise 
                        WHERE user_id = ? 
                        AND article_id = ?;`;
            const oldSystemPraise = await dbModel.query2(_sql, [data.browser_id, data.article_id]);
            
            isPraised = newSystemPraise.length > 0 || oldSystemPraise.length > 0;
        }
        
        res.send({
            code: 200,
            data: {
                count: praiseCount.count,
                is_praised: isPraised
            }
        });
    } catch (error) {
        console.error('获取文章点赞数失败:', error);
        res.send({
            code: 500,
            message: '获取文章点赞数失败: ' + error.message
        });
    }
}

// 添加评论回复
exports.addCommentReply = async (req, res) => {
    const { comment_id, content, browser_id, user_name, user_type, target_type } = req.body;
    
    // 修改参数验证，移除target_id
    if (!comment_id || target_type === undefined || !content || !browser_id) {
        return res.json({ code: 400, message: '参数不完整' });
    }
    
    try {
        // 调整字段与数据库表结构匹配
        const reply = {
            comment_id,                  // 所属评论ID
            content,                     // 回复内容
            user_id: browser_id,         // 将browser_id映射到user_id
            user_name: user_name || '游客',
            user_type: user_type || 1,   
            reply_type: target_type,     // 将target_type映射到reply_type
            moment: new Date().toLocaleString(),
            isread: 0                    // 默认未读状态
            // 注意：移除了target_id和user_avatar字段
        };
        
        await dbModel.addCommentReply(reply);
        return res.json({ code: 200, message: '回复成功' });
    } catch (error) {
        console.error('添加回复出错:', error);
        return res.json({ code: 500, message: '服务器错误' });
    }
}

// 获取评论回复
exports.getCommentReplies = async (req, res) => {
    const { comment_id, pageSize, nowPage } = req.body;
    
    if (!comment_id) {
        return res.json({ code: 400, message: '参数不完整' });
    }
    
    try {
        const replies = await dbModel.getCommentReplies(comment_id, pageSize, nowPage);
        const countResult = await dbModel.getCommentReplyCount(comment_id);
        const count = countResult[0].count;
        
        return res.json({
            code: 200,
            data: { 
                replies, 
                count,
                total_pages: Math.ceil(count / (pageSize || 10))
            }
        });
    } catch (error) {
        console.error('获取评论回复出错:', error);
        return res.json({ code: 500, message: '服务器错误' });
    }
}

// 批量获取评论回复
exports.getBatchCommentReplies = async (req, res) => {
    const { comment_ids } = req.body;
    
    if (!comment_ids || !Array.isArray(comment_ids) || comment_ids.length === 0) {
        return res.json({ code: 400, message: '参数不完整' });
    }
    
    try {
        const replies = await dbModel.getRepliesByCommentIds(comment_ids);
        
        // 按评论ID分组回复
        const groupedReplies = {};
        replies.forEach(reply => {
            if (!groupedReplies[reply.comment_id]) {
                groupedReplies[reply.comment_id] = [];
            }
            groupedReplies[reply.comment_id].push(reply);
        });
        
        return res.json({ code: 200, data: groupedReplies });
    } catch (error) {
        console.error('批量获取评论回复出错:', error);
        return res.json({ code: 500, message: '服务器错误' });
    }
}

// 标记回复已读
exports.replyIsRead = async (req, res) => {
    const { id } = req.body;
    
    if (!id) {
        return res.json({ code: 400, message: '参数不完整' });
    }
    
    try {
        await dbModel.updateReplyIsRead(id);
        return res.json({ code: 200, message: '标记已读成功' });
    } catch (error) {
        console.error('标记回复已读出错:', error);
        return res.json({ code: 500, message: '服务器错误' });
    }
}

// 删除回复
exports.deleteCommentReply = async (req, res) => {
    const { id } = req.body;
    
    if (!id) {
        return res.json({ code: 400, message: '参数不完整' });
    }
    
    try {
        await dbModel.deleteCommentReply(id);
        return res.json({ code: 200, message: '删除回复成功' });
    } catch (error) {
        console.error('删除回复出错:', error);
        return res.json({ code: 500, message: '服务器错误' });
    }
}

// 批量获取点赞状态
exports.getBatchArticlePraiseStatus = async (req, res) => {
    const { browser_id, article_ids } = req.body;
    
    if (!browser_id || !article_ids || !Array.isArray(article_ids)) {
        return res.send({
            code: 400,
            message: '参数不完整'
        });
    }
    
    try {
        // 获取用户点赞过的所有文章ID
        const praisedArticles = await dbModel.getUserPraisedArticles(browser_id, article_ids);
        const praisedIds = praisedArticles.map(item => item.target_id);
        
        res.send({
            code: 200,
            data: {
                praised_ids: praisedIds
            }
        });
    } catch (error) {
        console.error('获取批量点赞状态失败:', error);
        res.send({
            code: 500,
            message: '获取批量点赞状态失败'
        });
    }
};

// 更新文章浏览量
exports.updateArticleViews = async (req, res) => {
    const data = req.body;
    
    if (!data.articleId) {
        return res.send({
            code: 400,
            message: '缺少文章ID参数'
        });
    }
    
    try {
        await dbModel.updateArticleViews(data.articleId);
        res.send({
            code: 200,
            message: '浏览量更新成功'
        });
    } catch (error) {
        console.error('更新浏览量失败:', error);
        res.send({
            code: 500,
            message: '更新浏览量失败'
        });
    }
};

// 根据日期获取日记
exports.getDiaryByDate = async (req, res) => {
    try {
        const { date, token } = req.body;
        
        // 参数验证
        if (!date) {
            return res.send({
                code: 400,
                message: '缺少日期参数'
            });
        }
        
        // 调用数据库函数获取指定日期的日记
        const diaryResult = await dbModel.getDiaryByDate(date);
        
        // 处理结果
        if (diaryResult.length === 0) {
            return res.send({
                code: 404,
                message: '该日期没有日记',
                data: null
            });
        }
        
        // 处理图片字段
        let diary = diaryResult[0];
        if (diary.picture) {
            try {
                // 优化图片数据处理逻辑
                // 检查是否已经是JSON字符串
                if (diary.picture.trim().startsWith('[') && diary.picture.trim().endsWith(']')) {
                    // 已经是JSON数组格式，直接解析
                    try {
                        diary.picture = JSON.parse(diary.picture);
                    } catch (jsonError) {
                        console.error('解析JSON图片数据失败:', jsonError);
                        diary.picture = formatPictureData(diary.picture);
                    }
                } else if (diary.picture.includes(',')) {
                    // 逗号分隔的字符串，转为数组
                    diary.picture = formatPictureData(diary.picture);
                } else {
                    // 单个图片路径，转为数组
                    diary.picture = [{ url: diary.picture.trim() }];
                }
            } catch (error) {
                console.error('处理图片数据失败:', error);
                // 失败时设置为空数组，确保前端显示正常
                diary.picture = [];
            }
        } else {
            diary.picture = [];
        }
        
        return res.send({
            code: 200,
            data: diary
        });
    } catch (error) {
        console.error('获取指定日期日记失败:', error);
        return res.send({
            code: 500,
            message: '获取日记失败: ' + error.message
        });
    }
}

// 获取离指定日期最近的日记
exports.getNearestDiary = async (req, res) => {
    try {
        const { date, token } = req.body;
        
        // 参数验证
        if (!date) {
            return res.send({
                code: 400,
                message: '缺少日期参数'
            });
        }
        
        // 调用数据库函数获取最近的日记
        const diaryResult = await dbModel.getNearestDiary(date);
        
        // 处理结果
        if (diaryResult.length === 0) {
            return res.send({
                code: 404,
                message: '没有找到任何日记',
                data: null
            });
        }
        
        // 处理图片字段
        let diary = diaryResult[0];
        if (diary.picture) {
            try {
                // 优化图片数据处理逻辑
                // 检查是否已经是JSON字符串
                if (diary.picture.trim().startsWith('[') && diary.picture.trim().endsWith(']')) {
                    // 已经是JSON数组格式，直接解析
                    try {
                        diary.picture = JSON.parse(diary.picture);
                    } catch (jsonError) {
                        console.error('解析JSON图片数据失败:', jsonError);
                        diary.picture = formatPictureData(diary.picture);
                    }
                } else if (diary.picture.includes(',')) {
                    // 逗号分隔的字符串，转为数组
                    diary.picture = formatPictureData(diary.picture);
                } else {
                    // 单个图片路径，转为数组
                    diary.picture = [{ url: diary.picture.trim() }];
                }
            } catch (error) {
                console.error('处理图片数据失败:', error);
                // 失败时设置为空数组，确保前端显示正常
                diary.picture = [];
            }
        } else {
            diary.picture = [];
        }
        
        return res.send({
            code: 200,
            data: diary
        });
    } catch (error) {
        console.error('获取最近日记失败:', error);
        return res.send({
            code: 500,
            message: '获取日记失败: ' + error.message
        });
    }
}

// 辅助函数：处理图片数据格式
function formatPictureData(pictureStr) {
    // 将逗号分隔的字符串转换为标准的图片对象数组
    if (!pictureStr) return [];
    
    // 处理逗号分隔的字符串
    const parts = pictureStr.split(',').filter(Boolean);
    return parts.map(part => {
        const trimmedPart = part.trim();
        // 尝试解析每个部分，看是否已经是JSON格式
        try {
            const parsed = JSON.parse(trimmedPart);
            return parsed;
        } catch (e) {
            // 解析失败，说明这是普通字符串，将其转为对象
            return { url: trimmedPart };
        }
    });
}

// 全局搜索API - 搜索文章、图库、日记和资源
exports.search = async (req, res) => {
    try {
        const { keyword, type, limit } = req.body;
        
        // 参数验证
        if (!keyword || keyword.trim() === '') {
            return res.send({
                code: 400,
                message: '搜索关键词不能为空'
            });
        }
        
        // 处理搜索结果
        let articles = [];
        let galleries = [];
        let diaries = [];
        let resources = [];
        let articleCount = 0;
        let galleryCount = 0;
        let diaryCount = 0;
        let resourceCount = 0;
        
        // 获取计数信息
        const counts = await dbModel.getSearchCounts(keyword);
        articleCount = counts.articleCount;
        galleryCount = counts.galleryCount;
        diaryCount = counts.diaryCount;
        resourceCount = counts.resourceCount;
        
        // 根据类型参数决定搜索范围
        if (!type || type === 'all') {
            // 搜索所有类型
            articles = await dbModel.searchArticles(keyword, limit);
            galleries = await dbModel.searchGalleries(keyword, limit);
            diaries = await dbModel.searchDiaries(keyword, limit);
            resources = await dbModel.searchResources(keyword, limit);
            
        } else if (type === 'articles') {
            // 仅搜索文章
            articles = await dbModel.searchArticles(keyword, limit);
            
        } else if (type === 'gallery') {
            // 仅搜索图库
            galleries = await dbModel.searchGalleries(keyword, limit);
            
        } else if (type === 'diary') {
            // 仅搜索日记
            diaries = await dbModel.searchDiaries(keyword, limit);
            
        } else if (type === 'resources') {
            // 仅搜索资源
            resources = await dbModel.searchResources(keyword, limit);
        }
        
        // 处理日记图片字段
        if (diaries.length > 0) {
            for (let i = 0; i < diaries.length; i++) {
                if (diaries[i].picture) {
                    try {
                        // 使用前面定义的通用格式化函数
                        if (diaries[i].picture.trim().startsWith('[') && diaries[i].picture.trim().endsWith(']')) {
                            try {
                                diaries[i].picture = JSON.parse(diaries[i].picture);
                            } catch (jsonError) {
                                console.error('解析搜索结果中的JSON图片数据失败:', jsonError);
                                diaries[i].picture = formatPictureData(diaries[i].picture);
                            }
                        } else {
                            diaries[i].picture = formatPictureData(diaries[i].picture);
                        }
                    } catch (error) {
                        console.error('处理搜索结果中的图片数据失败:', error);
                        diaries[i].picture = [];
                    }
                } else {
                    diaries[i].picture = [];
                }
            }
        }
        
        // 处理资源URL，确保有完整路径
        if (resources.length > 0) {
            const protocol = req.protocol || 'http';
            const host = req.get('host') || 'localhost:3000';
            
            for (let i = 0; i < resources.length; i++) {
                // 如果url不是完整URL，添加域名前缀
                if (!resources[i].url.startsWith('http')) {
                    resources[i].file_url = `${protocol}://${host}${resources[i].url.startsWith('/') ? '' : '/'}${resources[i].url}`;
                } else {
                    resources[i].file_url = resources[i].url;
                }
            }
        }
        
        res.send({
            code: 200,
            data: {
                articles,
                galleries,
                diaries,
                resources,
                articleCount,
                galleryCount,
                diaryCount,
                resourceCount
            }
        });
        
    } catch (error) {
        console.error('搜索失败:', error);
        res.send({
            code: 500,
            message: '搜索失败: ' + error.message
        });
    }
}

// 处理监控数据上报
exports.reportMonitorEvent = async (req, res) => {
    try {
        const data = req.body;
        
 
        // 适配前端SDK发送的数据格式
        // 前端数据格式 {type: 'error'/'performance'/'behavior'} 和后端 {event_type}的映射
        let event_type = data?.event_type;
        
        // 如果没有event_type但有type字段(前端SDK格式)，则进行转换
        if (!event_type && data?.type) {
            event_type = data.type;
            
            // 添加缺失字段的默认值
            if (!data.event_name && data.type) {
                data.event_name = data.type + '_event';
            }
        }
        
        // 参数验证
        if (!event_type || !(data && data.page_url)) {
            return res.send({
                code: 400,
                message: '缺少必要监控参数',
                missing: {
                    event_type: !event_type,
                    page_url: !(data && data.page_url),
                    data_received: !!data
                }
            });
        }
        
        // 准备监控事件数据
        const eventData = {
            app_id: data.app_id || 'default',
            session_id: data.session_id || 'unknown',
            user_id: data.user_id || null,
            event_type: event_type,
            event_name: data.event_name || 'unnamed_event',
            level: data.level || 'info',
            device_info: JSON.stringify(data.device_info || {}),
            page_url: data.page_url,
            timestamp: data.timestamp || Date.now(),
            moment: new Date().toLocaleString()
        };
        
        // 保存监控事件
        const result = await dbModel.saveMonitorEvent(eventData);
        const eventId = result.insertId;
        
        // 根据事件类型保存额外数据
        if ((event_type === 'error' || data.type === 'error') && data.error_info) {
            const errorInfo = data.error_info || {};
            await dbModel.saveMonitorError({
                event_id: eventId,
                error_type: errorInfo.error_type || 'unknown',
                error_message: errorInfo.message || '',
                error_stack: errorInfo.stack || '',
                component: errorInfo.component || null
            });
        }
        
        if ((event_type === 'performance' || data.type === 'performance') && data.performance_info) {
            for (const metric in data.performance_info) {
                await dbModel.saveMonitorPerformance({
                    event_id: eventId,
                    metric_name: metric,
                    metric_value: data.performance_info[metric]
                });
            }
        }
        
        if ((event_type === 'behavior' || data.type === 'behavior') && data.behavior_info) {
            await dbModel.saveMonitorBehavior({
                event_id: eventId,
                action_type: data.behavior_info.actionType || data.behavior_info.action_type || 'unknown',
                element_path: data.behavior_info.element_path || null,
                action_value: data.behavior_info.value || null
            });
        }
        
        res.send({
            code: 200,
            message: '监控数据上报成功'
        });
    } catch (error) {
        console.error('监控数据上报错误:', error);
        res.send({
            code: 500,
            message: '监控数据上报失败: ' + error.message
        });
    }
};

// 获取监控数据统计
exports.getMonitorStats = async (req, res) => {
    try {
        const { start_time, end_time, event_type } = req.body;
        
        // 时间范围验证，默认为最近7天
        const now = Date.now();
        const endTime = end_time ? parseInt(end_time) : now;
        const startTime = start_time ? parseInt(start_time) : (now - 7 * 24 * 60 * 60 * 1000);
        
        const stats = await dbModel.getMonitorStats(startTime, endTime, event_type);
        
        res.send({
            code: 200,
            data: {
                time_range: {
                    start: new Date(startTime).toISOString().split('T')[0],
                    end: new Date(endTime).toISOString().split('T')[0]
                },
                event_counts: stats
            }
        });
    } catch (error) {
        console.error('获取监控统计错误:', error);
        res.send({
            code: 500,
            message: '获取监控统计失败: ' + error.message
        });
    }
};

// 获取性能指标分析
exports.getPerformanceStats = async (req, res) => {
    try {
        const { start_time, end_time, metrics } = req.body;
        
        // 时间范围验证，默认为最近7天
        const now = Date.now();
        const endTime = end_time ? parseInt(end_time) : now;
        const startTime = start_time ? parseInt(start_time) : (now - 7 * 24 * 60 * 60 * 1000);
        
        const perfStats = await dbModel.getPerformanceStats(startTime, endTime, metrics);
        
        // 处理结果为前端易用的格式
        const resultsByMetric = {};
        perfStats.forEach(stat => {
            if (!resultsByMetric[stat.metric_name]) {
                resultsByMetric[stat.metric_name] = [];
            }
            resultsByMetric[stat.metric_name].push({
                date: stat.day,
                avg: parseFloat(stat.avg_value).toFixed(2),
                min: parseFloat(stat.min_value).toFixed(2),
                max: parseFloat(stat.max_value).toFixed(2),
                count: stat.sample_count
            });
        });
        
        res.send({
            code: 200,
            data: {
                time_range: {
                    start: new Date(startTime).toISOString().split('T')[0],
                    end: new Date(endTime).toISOString().split('T')[0]
                },
                metrics: resultsByMetric
            }
        });
    } catch (error) {
        console.error('获取性能指标分析错误:', error);
        res.send({
            code: 500,
            message: '获取性能指标分析失败: ' + error.message
        });
    }
};

// 获取设备统计
exports.getDeviceStats = async (req, res) => {
    try {
        const { start_time, end_time } = req.body;
        
        // 时间范围验证，默认为最近7天
        const now = Date.now();
        const endTime = end_time ? parseInt(end_time) : now;
        const startTime = start_time ? parseInt(start_time) : (now - 7 * 24 * 60 * 60 * 1000);
        
        // 获取设备统计
        const deviceStats = await dbModel.getDeviceStats(startTime, endTime);
        
        res.send({
            code: 200,
            data: {
                time_range: {
                    start: new Date(startTime).toISOString().split('T')[0],
                    end: new Date(endTime).toISOString().split('T')[0]
                },
                device_types: deviceStats.device_types,
                browsers: deviceStats.browsers,
                os: deviceStats.os
            }
        });
    } catch (error) {
        console.error('获取设备统计错误:', error);
        res.send({
            code: 500,
            message: '获取设备统计失败: ' + error.message
        });
    }
};

// 获取组件访问统计
exports.getComponentStats = async (req, res) => {
    try {
        const { start_time, end_time, limit } = req.body;
        
        // 时间范围验证，默认为最近7天
        const now = Date.now();
        const endTime = end_time ? parseInt(end_time) : now;
        const startTime = start_time ? parseInt(start_time) : (now - 7 * 24 * 60 * 60 * 1000);
        const resultLimit = limit && !isNaN(limit) ? parseInt(limit) : 10;
        
        // 获取组件访问统计
        const components = await dbModel.getComponentStats(startTime, endTime, resultLimit);
        
        res.send({
            code: 200,
            data: {
                time_range: {
                    start: new Date(startTime).toISOString().split('T')[0],
                    end: new Date(endTime).toISOString().split('T')[0]
                },
                components
            }
        });
    } catch (error) {
        console.error('获取组件统计错误:', error);
        res.send({
            code: 500,
            message: '获取组件统计失败: ' + error.message
        });
    }
};

// 获取页面访问统计
exports.getPageViewStats = async (req, res) => {
    try {
        const { start_time, end_time, limit } = req.body;
        
        // 时间范围验证，默认为最近7天
        const now = Date.now();
        const endTime = end_time ? parseInt(end_time) : now;
        const startTime = start_time ? parseInt(start_time) : (now - 7 * 24 * 60 * 60 * 1000);
        const resultLimit = limit && !isNaN(limit) ? parseInt(limit) : 20;
        
        // 获取页面访问统计
        const pageViews = await dbModel.getPageViewStats(startTime, endTime, resultLimit);
        
        res.send({
            code: 200,
            data: {
                time_range: {
                    start: new Date(startTime).toISOString().split('T')[0],
                    end: new Date(endTime).toISOString().split('T')[0]
                },
                page_views: pageViews
            }
        });
    } catch (error) {
        console.error('获取页面访问统计错误:', error);
        res.send({
            code: 500,
            message: '获取页面访问统计失败: ' + error.message
        });
    }
};

// 获取错误统计
exports.getErrorStats = async (req, res) => {
    try {
        const { start_time, end_time } = req.body;
        
        // 时间范围验证，默认为最近7天
        const now = Date.now();
        const endTime = end_time ? parseInt(end_time) : now;
        const startTime = start_time ? parseInt(start_time) : (now - 7 * 24 * 60 * 60 * 1000);
        
        // 获取错误统计
        const errorStats = await dbModel.getErrorStats(startTime, endTime);
        
        // 获取最近的一些具体错误
        const recentErrors = await dbModel.getRecentErrors(10);
        
        res.send({
            code: 200,
            data: {
                time_range: {
                    start: new Date(startTime).toISOString().split('T')[0],
                    end: new Date(endTime).toISOString().split('T')[0]
                },
                error_stats: errorStats,
                recent_errors: recentErrors
            }
        });
    } catch (error) {
        console.error('获取错误统计错误:', error);
        res.send({
            code: 500,
            message: '获取错误统计失败: ' + error.message
        });
    }
};

// 获取网站访问量趋势
exports.getVisitTrends = async (req, res) => {
  console.log(`=== 监控API调用: getVisitTrends ===`);
  console.log(`请求体: ${JSON.stringify(req.body)}`);
  console.log(`请求路径: ${req.originalUrl}`);
  
  try {
    const { period } = req.body;
    const now = Date.now();
    let startTime, days;
    
    if (period === 'week') {
        days = 7;
        startTime = now - 7 * 24 * 60 * 60 * 1000;
    } else if (period === 'month') {
        days = 30;
        startTime = now - 30 * 24 * 60 * 60 * 1000;
    } else {
        days = 7;
        startTime = now - 7 * 24 * 60 * 60 * 1000;
    }

    // 获取访问量趋势数据
    const trends = await dbModel.getVisitTrends(startTime, now);

    // 生成期望的日期范围
    const dateRange = generateDateRange(startTime, now);

    // 创建日期到访问量的映射
    const trendsMap = new Map();
    trends.forEach(item => {
        // item.date应该已经是YYYY-MM-DD格式
        const dateKey = String(item.date);
        trendsMap.set(dateKey, item.visit_count);
    });

    // 填补缺失的日期
    const completeData = dateRange.map(date => {
        const value = trendsMap.get(date) || 0;
        return {
            date,
            visit_count: value
        };
    });

    // 格式化返回数据
    const dates = completeData.map(item => item.date);
    const visits = completeData.map(item => item.visit_count);
    
    // 计算统计信息
    const totalVisits = visits.reduce((sum, count) => sum + count, 0);
    const avgVisits = Math.round(totalVisits / days);
    
    res.send({
        code: 200,
        data: {
            dates,
            visits,
            statistics: {
                total: totalVisits,
                average: avgVisits,
                days: days,
                period: period || 'week'
            }
        }
    });
  } catch (error) {
    console.error(`监控API错误: ${error.message}`);
    console.error(error.stack);
    res.status(500).send({
      code: 500,
      message: '获取访问量趋势数据失败: ' + error.message
    });
  }
};

// 生成日期范围的辅助函数
function generateDateRange(startTime, endTime) {
    const dates = [];
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    // 重置时间部分，使用本地时间
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        // 以YYYY-MM-DD格式生成日期
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        dates.push(dateStr);
    }
    
    return dates;
}

// 获取设备统计分析
exports.getDeviceAnalysis = async (req, res) => {
    try {
        const { period } = req.body;
        
        // 计算时间范围
        const now = Date.now();
        let startTime;
        
        if (period === 'week') {
            // 近一周
            startTime = now - 7 * 24 * 60 * 60 * 1000;
        } else if (period === 'month') {
            // 近一个月
            startTime = now - 30 * 24 * 60 * 60 * 1000;
        } else {
            // 默认为近一周
            startTime = now - 7 * 24 * 60 * 60 * 1000;
        }
        
        const deviceStats = await dbModel.getDeviceAnalysis(startTime, now);
        
        res.send({
            code: 200,
            data: deviceStats
        });
    } catch (error) {
        console.error('获取设备统计分析失败:', error);
        res.send({
            code: 500,
            message: '获取设备统计分析失败: ' + error.message
        });
    }
};

// 获取内容类型访问统计
exports.getContentDistribution = async (req, res) => {
    try {
        const { period } = req.body;
        
        // 计算时间范围
        const now = Date.now();
        let startTime;
        
        if (period === 'week') {
            // 近一周
            startTime = now - 7 * 24 * 60 * 60 * 1000;
        } else if (period === 'month') {
            // 近一个月
            startTime = now - 30 * 24 * 60 * 60 * 1000;
        } else {
            // 默认为近一周
            startTime = now - 7 * 24 * 60 * 60 * 1000;
        }
        
        const contentStats = await dbModel.getContentDistribution(startTime, now);
        
        res.send({
            code: 200,
            data: contentStats
        });
    } catch (error) {
        console.error('获取内容类型访问统计失败:', error);
        res.send({
            code: 500,
            message: '获取内容类型访问统计失败: ' + error.message
        });
    }
};

// 调试用API：获取设备数据样本
exports.debugDeviceData = async (req, res) => {
    try {
        const deviceSamples = await dbModel.debugDeviceData();
        res.send({
            code: 200,
            data: deviceSamples,
            message: '获取设备样本数据成功'
        });
    } catch (error) {
        console.error('调试设备数据错误:', error);
        res.send({
            code: 500,
            message: '调试设备数据失败: ' + error.message
        });
    }
};

// 调试用API：获取内容数据样本
exports.debugContentData = async (req, res) => {
    try {
        const contentSamples = await dbModel.debugContentData();
        res.send({
            code: 200,
            data: contentSamples,
            message: '获取内容样本数据成功'
        });
    } catch (error) {
        console.error('调试内容数据错误:', error);
        res.send({
            code: 500,
            message: '调试内容数据失败: ' + error.message
        });
    }
};

// 调试用API：测试内容分布统计
exports.debugContentDistribution = async (req, res) => {
    try {
        const debugData = await dbModel.debugContentDistribution();
        res.send({
            code: 200,
            data: debugData,
            message: '内容分布统计调试数据获取成功'
        });
    } catch (error) {
        console.error('调试内容分布统计错误:', error);
        res.send({
            code: 500,
            message: '调试内容分布统计失败: ' + error.message
        });
    }
};

// 获取访问统计数据（总访问量和今日访问量）
exports.getVisitStats = async (req, res) => {
    try {
        const stats = await dbModel.getVisitStats();
        
        res.send({
            code: 200,
            data: stats
        });
    } catch (error) {
        console.error('获取访问统计数据错误:', error);
        res.send({
            code: 500,
            message: '获取访问统计数据失败: ' + error.message
        });
    }
};