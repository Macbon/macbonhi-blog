const db = require('./db')

//查询数据库是否有注册用户
exports.isRegister = () => {
    let _sql = `select count(*) as count from users`

    return db.query2(_sql)
}

//管理员注册
exports.insertUser = (value) => {
    let _sql = "insert into users set ?;"

    return db.query2(_sql, value)
}

//用户登录信息，获取信息
exports.signin = (name) => {

    let _sql = `select * from users where name="${name}";`

    return db.query2(_sql)
}

//获取评论
exports.getcommentpage = (pagesize, nowpage) => {

    let _sql = `select * from comment order by id desc limit ${(nowpage - 1) * pagesize}, ${pagesize};`

    return db.query2(_sql)
}

//获取评论总数,这里id是文章id
exports.getcommentcount = (id) => {

    let _sql;
    
    if (id === -1) {
        _sql = `select count(*) as count from comment`
    } else {
        _sql = `select count(*) as count from comment where article_id="${id}"`
    }

    return db.query2(_sql)
}

//获取文章名称
exports.getArticleTitle = (id) => {

    let _sql = `select title from article where id="${id}";`

    return db.query2(_sql)
}

//评论变为已读
exports.commentisread = (id) => {

    let _sql = `update comment set isread=1 where id="${id}";`

    return db.query2(_sql)
}


//删除评论
exports.deleteComment = (id) => {

    let _sql = `delete from comment where id="${id}";`

    return db.query2(_sql)
}


//获取私信
exports.getMessagePage = (pagesize, nowpage) => {
    // 参数验证和默认值
    const validPageSize = pagesize && !isNaN(pagesize) ? parseInt(pagesize) : 10;
    const validNowPage = nowpage && !isNaN(nowpage) ? parseInt(nowpage) : 1;

    let _sql = `select * from message order by id desc limit ${(validNowPage - 1) * validPageSize}, ${validPageSize};`

    return db.query2(_sql)
}


//获取私信总数
exports.getMessageCount = () => {

    let _sql = `select count(*) as count from message;`

    return db.query2(_sql)
}

//私信变为已读
exports.messageisread = (id) => {

    let _sql = `update message set isread=1 where id="${id}";`

    return db.query2(_sql)
}

//获取未读消息的数量
exports.getUnreadMessageCount = () => {
    let _sql = `select count(*) as count from message where isread=0;`
    return db.query2(_sql)
}

//新建私信
exports.createMessage = (value) => {
    let _sql = "insert into message set ?;"
    return db.query2(_sql, value)
}

//删除私信
exports.deleteMessage = (id) => {
    let _sql = `delete from message where id="${id}";`
    return db.query2(_sql)
}

exports.getArticlePage = (pagesize, nowpage, state, subsetId, searchTerm, classify) => {
    const validPageSize = pagesize && !isNaN(pagesize) ? parseInt(pagesize) : 4;
    const validNowPage = nowpage && !isNaN(nowpage) ? parseInt(nowpage) : 1;
    const validClassify = classify !== undefined && !isNaN(classify) ? parseInt(classify) : 0;
    
    let _sql;
    
    if (searchTerm && searchTerm.trim() !== '') {
        // 搜索查询
        _sql = `select * from article where concat(title, introduce) like "%${searchTerm}%" and classify="${validClassify}" order by id desc limit ${(validNowPage - 1) * validPageSize}, ${validPageSize};`
        
    } else if (subsetId > -1 && typeof subsetId === 'number') {
        //特定分组查询 - 包括subsetId=0的情况
        if (subsetId === 0) {
            // 查询未分组文章 - subset_id为NULL、0或空字符串
            _sql = `select * from article where (subset_id IS NULL OR subset_id = 0 OR subset_id = '') and classify="${validClassify}" order by id desc limit ${(validNowPage - 1) * validPageSize}, ${validPageSize};`
        } else {
            // 查询具体分组的文章
            _sql = `select * from article where subset_id="${subsetId}" and classify="${validClassify}" order by id desc limit ${(validNowPage - 1) * validPageSize}, ${validPageSize};`
        }
        
    } else if (typeof subsetId === 'string') {
        if (subsetId.trim() === '' || subsetId === 'NULL_OR_EMPTY') {
            // 查询未分组文章
            _sql = `select * from article where (subset_id IS NULL OR subset_id = 0 OR subset_id = '') and classify="${validClassify}" order by id desc limit ${(validNowPage - 1) * validPageSize}, ${validPageSize};`
        } else {
            // 排除指定分组的文章
            const excludeIds = subsetId.split(',').filter(id => id.trim() !== '').map(id => `"${id.trim()}"`).join(',');
            if (excludeIds) {
                //排除指定分组，但包含未分组文章
                _sql = `select * from article where (subset_id not in (${excludeIds}) OR subset_id IS NULL OR subset_id = 0 OR subset_id = '') and classify="${validClassify}" order by id desc limit ${(validNowPage - 1) * validPageSize}, ${validPageSize};`
            } else {
                //如果没有有效的排除ID，查询所有文章
                _sql = `select * from article where classify="${validClassify}" order by id desc limit ${(validNowPage - 1) * validPageSize}, ${validPageSize};`
            }
        }    
    } else if (state > -1) {
        // 按状态查询
        _sql = `select * from article where state="${state}" and classify="${validClassify}" order by id desc limit ${(validNowPage - 1) * validPageSize}, ${validPageSize};`
        
    } else {
        // 默认查询所有文章
        _sql = `select * from article where classify="${validClassify}" order by id desc limit ${(validNowPage - 1) * validPageSize}, ${validPageSize};`
    }

    return db.query2(_sql);
}

//获取文章总数 
exports.getArticleCount = (state, subsetId, searchTerm, classify) => {
    let _sql;

    if (searchTerm && searchTerm.trim() !== '') {
        // 搜索统计
        _sql = `select count(*) as count from article where concat(title, introduce) like "%${searchTerm}%" and classify="${classify}"`;
        
    } else if (subsetId > -1 && typeof subsetId === 'number') {
        //特定分组统计 - 包括subsetId=0的情况
        if (subsetId === 0) {
            //统计未分组文章 - subset_id为NULL、0或空字符串
            _sql = `select count(*) as count from article where (subset_id IS NULL OR subset_id = 0 OR subset_id = '') and classify="${classify}"`;
        } else {
            // 统计具体分组的文章
            _sql = `select count(*) as count from article where subset_id="${subsetId}" and classify="${classify}"`;
        }
        
    } else if (typeof subsetId === 'string') {
        //字符串类型的subsetId处理
        if (subsetId.trim() === '' || subsetId === 'NULL_OR_EMPTY') {
            // 统计未分组文章
            _sql = `select count(*) as count from article where (subset_id IS NULL OR subset_id = 0 OR subset_id = '') and classify="${classify}"`;
        } else {
            // 排除指定分组的文章统计
            const excludeIds = subsetId.split(',').filter(id => id.trim() !== '').map(id => `"${id.trim()}"`).join(',');
            if (excludeIds) {
                //排除指定分组，但包含未分组文章
                _sql = `select count(*) as count from article where (subset_id not in (${excludeIds}) OR subset_id IS NULL OR subset_id = 0 OR subset_id = '') and classify="${classify}"`;
            } else {
                // 如果没有有效的排除ID，统计所有文章
                _sql = `select count(*) as count from article where classify="${classify}"`;
            }
        }  
    } else if (state > -1) {
        // 按状态统计
        _sql = `select count(*) as count from article where state="${state}" and classify="${classify}"`;
        
    } else {
        // 默认统计所有文章
        _sql = `select count(*) as count from article where classify="${classify}"`;
    }
    return db.query2(_sql);
}

//文章状态改变
exports.changeArticleState = (id, state) => {

    let _sql = `update article set state="${state}" where id="${id}";`

    return db.query2(_sql)
}

//文章删除
exports.deleteArticle = (id) => {

    let _sql = `delete from article where id="${id}";`

    return db.query2(_sql)
}

//新建文章点赞
exports.addPraise = (value) => {

    let _sql = "insert into praise set ?;"

    return db.query2(_sql, value)
}

//获取文章点赞数
exports.getPraiseCount = (id, userId) => {
    let _sql;

    if (userId === -1) {
        _sql = `select count(*) as count from praise where article_id="${id}";`
    } else {
        _sql = `select count(*) as count from praise where article_id="${id}" and where user_id="${userId}";`
    }

    return db.query2(_sql)
}

//获取文件分组的数量
exports.getClassifyCount = (classify) => {

    let _sql = `select * from subset where classify="${classify}";`

    return db.query2(_sql)
}

//新建分组
exports.addSubset = (value) => {

    let _sql = "insert into subset set ?;"

    return db.query2(_sql, value)
}


//获取文件总数
exports.getFilesCount = (subsetId, searchTerm) => {

    let _sql;
    
    if (searchTerm) {//搜索文件名
        _sql = `select count(*) as count from file where concat(file_name) like "%${searchTerm}%"`
    } else if (subsetId > -1 && typeof subsetId==='number') {
        _sql = `select count(*) as count from file where subset_id="${subsetId}"`
    } else if (typeof subsetId==='string') {
        _sql = `select count(*) as count from file where subset_id not in ("${subsetId}")`
    } else {
        _sql = `select count(*) as count from file`
    }

    return db.query2(_sql)
}

//修改分组名称
exports.updateSubset = (id, name) => {

    let _sql = `update subset set subset_name="${name}" where id="${id}";`

    return db.query2(_sql)
}

//删除分组
exports.deleteSubset = (id) => {

    let _sql = `delete from subset where id="${id}";`

    return db.query2(_sql)
}

//获取标签
exports.getLabel = () => {

    let _sql = `select * from label;`
    return db.query2(_sql)

}

//新建标签
exports.addLabel = (value) => {

    let _sql = "insert into label set ?;"

    return db.query2(_sql, value)
}

//删除标签
exports.deleteLabel = (id) => {

    let _sql = `delete from label where id="${id}";`

    return db.query2(_sql)
}

//获取文件
exports.getFilePage = (pagesize, nowpage, subsetId) => {
    let _sql;
    //如果搜索有内容
    if (subsetId > -1 && typeof subsetId==='number') {   //这里是我们各个分组的具体个数
        _sql = `select * from file where subset_id="${subsetId}" order by id desc limit ${(nowpage - 1) * pagesize}, ${pagesize};`
    } else if (typeof subsetId==='string') {    //这里意思为我们的未分组的情况
        _sql = `select * from file where subset_id not in ("${subsetId}") order by id desc limit ${(nowpage - 1) * pagesize}, ${pagesize};`
    } else {
        _sql = `select * from file order by id desc limit ${(nowpage - 1) * pagesize}, ${pagesize};`
    }


    return db.query2(_sql)
}

//获取文件总数
exports.getFileCount = (subsetId) => {
    let _sql

    if (subsetId > -1 && typeof subsetId==='number') {
        _sql = `select count(*) as count from file where subset_id="${subsetId}"`
    } else if (typeof subsetId==='string') {
        _sql = `select count(*) as count from file where subset_id not in ("${subsetId}")`
    } else {
        _sql = `select count(*) as count from file`
    }

    return db.query2(_sql)
}


//文件的移动，涉及到subsetid的修改
exports.removeFile = (id, subsetId) => {

    let _sql = `update file set subset_id="${subsetId}" where id="${id}";`

    return db.query2(_sql)
}

//获取日记
exports.getDiaryPage = (pagesize, nowpage, searchTerm) => {

    const validPageSize = pagesize && !isNaN(pagesize) ? parseInt(pagesize) : 4;
    const validNowPage = nowpage && !isNaN(nowpage) ? parseInt(nowpage) : 1;

    let _sql;
    //如果搜索有内容
    if (searchTerm) {
        _sql = `select * from diary where concat(title, content) like "%${searchTerm}%" order by id desc limit ${(validNowPage - 1) * validPageSize}, ${validPageSize};`
    } else {
        _sql = `select * from diary order by id desc limit ${(validNowPage - 1) * validPageSize}, ${validPageSize};`
    }

    return db.query2(_sql)
}

//获取日记总数
exports.getDiaryCount = (searchTerm) => {
    let _sql

    if (searchTerm) {
        _sql = `select count(*) as count from diary where concat(title, content) like "%${searchTerm}%"`
    } else {
        _sql = `select count(*) as count from diary`
    }

    return db.query2(_sql)
}

//删除日记
exports.deleteDiary = (id) => {
    let _sql = `delete from diary where id="${id}";`
    return db.query2(_sql)
}

//新建文章/图库
exports.createArticle= (value) => {

    let _sql = "insert into article set ?;"

    return db.query2(_sql, value)
}

//获取文章用于修改
exports.gainArticle = (id) => {

    let _sql = `select * from article where id="${id}";`

    return db.query2(_sql)
}

//文章图库的修改
exports.updateArticle = (id, value) => {

    let _sql = `update article set ? where id="${id}";`

    return db.query2(_sql, value)
}

//新建日记
exports.createDiary = (value) => {

    let _sql = "insert into diary set ?"

    return db.query2(_sql, value)
}

//新建文件
exports.uploadFile = (value) => {

    let _sql = "insert into file set ?;"

    return db.query2(_sql, value)
}

//删除文件
exports.deleteFile= (id) => {
    let _sql
    if (typeof id === 'number') {
        _sql = `delete from file where id="${id}";`
    } else {//删除多张
        _sql = `delete from file where id in (${id});`
    }

    return db.query2(_sql)
}

//新建评论
exports.createComment = (value) => {
    let _sql = "insert into comment set ?;"
    return db.query2(_sql, value)
}

//获取包含特定标签的文章数量
exports.getArticleCountByLabel = async (labelId) => {
    // 获取标签名称
    let getLabelNameSql = `SELECT label_name FROM label WHERE id="${labelId}";`;
    
    const labelResult = await db.query2(getLabelNameSql);
    
    if (labelResult.length === 0) {
        return [{ count: 0 }];
    }
    
    const labelName = labelResult[0].label_name;
    // 使用LIKE查询，查找label字段中包含该标签的文章
    // 需要考虑标签可能在开头、中间或结尾的情况
    let _sql = `SELECT COUNT(*) as count FROM article 
               WHERE label LIKE "${labelName}" 
               OR label LIKE "${labelName},%" 
               OR label LIKE "%,${labelName}" 
               OR label LIKE "%,${labelName},%";`;
    
    return db.query2(_sql);
}

//获取所有分组
exports.getSubsets = () => {
    let _sql = `SELECT * FROM subset;`;
    return db.query2(_sql);
}

//获取某个分组下的文章数量
exports.getArticleCountBySubset = (subsetId) => {
    let _sql = `SELECT COUNT(*) as count FROM article WHERE subset_id="${subsetId}";`;
    return db.query2(_sql);
}

// 通过文件哈希查询文件是否存在
exports.checkFileExistByHash = (fileHash) => {
    // 首先查询是否有已完成的文件
    const _sql = `SELECT * FROM large_files WHERE file_hash = ? AND status = 1;`;
    
    // 临时添加：查询所有相关记录用于调试
    const debugSql = `SELECT * FROM large_files WHERE file_hash = ?;`;
    db.query2(debugSql, [fileHash]).then(allRecords => {
    }).catch(err => {
        console.error('数据库调试查询失败:', err);
    });
    
    return db.query2(_sql, [fileHash]);
};

// 获取已上传的切片列表
exports.getUploadedChunks = (fileHash) => {
    // 查询指定文件哈希的所有已上传切片
    const _sql = `SELECT chunk_hash, chunk_index FROM file_chunks 
                 WHERE file_hash = ? AND status = 1 
                 ORDER BY chunk_index ASC;`;
    return db.query2(_sql, [fileHash]);
};

// 检查文件是否处于上传中状态
exports.checkFileInProgress = (fileHash) => {
    // 查询是否有进行中的文件上传任务
    const _sql = `SELECT * FROM large_files WHERE file_hash = ? AND status = 0;`;
    return db.query2(_sql, [fileHash]);
};

// 创建文件上传任务
exports.createFileUploadTask = (fileInfo) => {
    // 插入新的大文件记录
    const _sql = `INSERT INTO large_files 
                (file_name, file_hash, file_size, chunk_size, chunk_count, 
                 file_ext, status, subset_id, file_desc, create_time, update_time) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW());`;
    
    return db.query2(_sql, [
        fileInfo.fileName,
        fileInfo.fileHash,
        fileInfo.fileSize,
        fileInfo.chunkSize,
        fileInfo.chunkCount,
        fileInfo.fileExt,
        0, // 初始状态为"进行中"
        fileInfo.subsetId || null,
        fileInfo.fileDesc || null
    ]);
};

// 初始化文件分片记录
exports.initializeChunks = (fileHash, chunkCount) => {
    // 批量创建文件分片记录
    // 这里使用简化的方式，实际上应该使用批量插入或事务
    const promises = [];
    
    for (let i = 0; i < chunkCount; i++) {
        const chunkHash = `${fileHash}-${i}`;
        const _sql = `INSERT IGNORE INTO file_chunks
                    (file_hash, chunk_index, chunk_hash, chunk_size, status, create_time)
                    VALUES (?, ?, ?, 0, 0, NOW());`;
        
        promises.push(db.query2(_sql, [fileHash, i, chunkHash]));
    }
    
    // 返回Promise.all来等待所有插入完成
    return Promise.all(promises);
};

// 保存切片信息到数据库
exports.saveChunkInfo = (chunkInfo) => {
    // 更新切片状态和路径
    const _sql = `UPDATE file_chunks 
                 SET chunk_size = ?, 
                     chunk_path = ?, 
                     status = 1,
                     create_time = NOW()
                 WHERE file_hash = ? AND chunk_index = ?;`;
    
    return db.query2(_sql, [
        chunkInfo.chunkSize,
        chunkInfo.chunkPath,
        chunkInfo.fileHash,
        chunkInfo.chunkIndex
    ]);
};

// 通过文件哈希获取所有切片
exports.getChunksByFileHash = (fileHash) => {
    const _sql = `SELECT * FROM file_chunks 
                 WHERE file_hash = ? 
                 ORDER BY chunk_index ASC;`;
    
    return db.query2(_sql, [fileHash]);
};

// 获取文件已上传的切片数量
exports.getUploadedChunkCount = (fileHash) => {
    const _sql = `SELECT COUNT(*) as count FROM file_chunks 
                 WHERE file_hash = ? AND status = 1;`;
    
    return db.query2(_sql, [fileHash]);
};

// 检查切片是否已上传
exports.checkChunkExists = (fileHash, chunkIndex) => {
    const _sql = `SELECT * FROM file_chunks 
                 WHERE file_hash = ? AND chunk_index = ? AND status = 1;`;
    
    return db.query2(_sql, [fileHash, chunkIndex]);
};

// 批量更新切片状态
exports.updateChunksStatus = (fileHash, chunkIndexes, status) => {
    // 将索引数组转为逗号分隔的字符串
    const indexes = chunkIndexes.join(',');
    
    // 只有当索引数组不为空时才执行更新
    if (indexes.length > 0) {
        const _sql = `UPDATE file_chunks 
                     SET status = ? 
                     WHERE file_hash = ? AND chunk_index IN (${indexes});`;
        
        return db.query2(_sql, [status, fileHash]);
    }
    
    // 索引数组为空时返回空Promise
    return Promise.resolve();
};

// 删除文件的所有切片记录
exports.deleteFileChunks = (fileHash) => {
    const _sql = `DELETE FROM file_chunks WHERE file_hash = ?;`;
    
    return db.query2(_sql, [fileHash]);
};

// 更新文件状态为已合并
exports.updateFileStatus = (fileHash, status, filePath = null) => {
    let _sql = '';
    let params = [];
    
    if (filePath) {
        // 更新状态和文件路径
        _sql = `UPDATE large_files 
               SET status = ?, 
                   file_path = ?, 
                   update_time = NOW() 
               WHERE file_hash = ?;`;
        params = [status, filePath, fileHash];
    } else {
        // 仅更新状态
        _sql = `UPDATE large_files 
               SET status = ?, 
                   update_time = NOW() 
               WHERE file_hash = ?;`;
        params = [status, fileHash];
    }
    
    return db.query2(_sql, params);
};

// 保存合并后的文件信息
exports.saveCompletedFile = (fileInfo) => {
    const _sql = `INSERT INTO file 
                 (file_name, url, format, subset_id, moment, file_size, file_desc) 
                 VALUES (?, ?, ?, ?, ?, ?, ?);`;
    
    return db.query2(_sql, [
        fileInfo.fileName,
        fileInfo.filePath, // file_path 映射到 url
        fileInfo.fileExt,  // file_type 映射到 format
        fileInfo.subsetId || null,
        new Date().toLocaleString(), // 使用当前时间字符串
        fileInfo.fileSize || null,    // 添加文件大小
        fileInfo.fileDesc || null     // 添加文件描述
    ]);
};

// 清理文件切片记录
exports.deleteChunks = (fileHash) => {
    const _sql = `DELETE FROM file_chunks WHERE file_hash = ?;`;
    return db.query2(_sql, [fileHash]);
};

// 根据文件ID获取文件信息
exports.getFileById = (fileId) => {
    let _sql = `select * from file where id="${fileId}";`
    return db.query2(_sql)
}

// 更新文件下载次数
exports.updateFileDownloadCount = (fileId) => {
    // 若download_count字段不存在可能需要先添加该字段
    let _sql = `update file set download_count = IFNULL(download_count, 0) + 1 where id="${fileId}";`
    return db.query2(_sql)
}

// 获取可下载文件（排除图片类型）
exports.getDownloadableFilePage = (pagesize, nowpage, subsetId) => {
    const excludedFormats = "'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'";
    let _sql;
    
    if (subsetId > -1 && typeof subsetId === 'number') {
        _sql = `select * from file where subset_id="${subsetId}" AND format NOT IN (${excludedFormats}) order by id desc limit ${(nowpage - 1) * pagesize}, ${pagesize};`
    } else if (subsetId === -1 && typeof subsetId === 'number') {
        // 明确处理"全部"分类的情况
        _sql = `select * from file where format NOT IN (${excludedFormats}) order by id desc limit ${(nowpage - 1) * pagesize}, ${pagesize};`
    } else if (typeof subsetId === 'string') {
        _sql = `select * from file where subset_id not in ("${subsetId}") AND format NOT IN (${excludedFormats}) order by id desc limit ${(nowpage - 1) * pagesize}, ${pagesize};`
    } else {
        _sql = `select * from file where format NOT IN (${excludedFormats}) order by id desc limit ${(nowpage - 1) * pagesize}, ${pagesize};`
    }


    return db.query2(_sql)
}

// 获取可下载文件总数（排除图片类型）
exports.getDownloadableFileCount = (subsetId) => {
    const excludedFormats = "'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'";
    let _sql

    if (subsetId > -1 && typeof subsetId === 'number') {
        _sql = `select count(*) as count from file where subset_id="${subsetId}" AND format NOT IN (${excludedFormats})`
    } else if (typeof subsetId === 'string') {
        _sql = `select count(*) as count from file where subset_id not in ("${subsetId}") AND format NOT IN (${excludedFormats})`
    } else {
        _sql = `select count(*) as count from file where format NOT IN (${excludedFormats})`
    }

    return db.query2(_sql)
}

// 获取分类下可下载文件数量（用于分类统计）
exports.getDownloadableFileCountBySubset = (subsetId) => {
    const excludedFormats = "'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'";
    let _sql = `select count(*) as count from file where subset_id="${subsetId}" AND format NOT IN (${excludedFormats})`;
    return db.query2(_sql);
}

// 获取特定文章的评论（分页）
exports.getArticleComments = (articleId, pageSize, nowPage) => {
    const validPageSize = pageSize && !isNaN(pageSize) ? parseInt(pageSize) : 10;
    const validNowPage = nowPage && !isNaN(nowPage) ? parseInt(nowPage) : 1;

    let _sql = `SELECT * FROM comment 
                WHERE article_id = "${articleId}" 
                ORDER BY id DESC 
                LIMIT ${(validNowPage - 1) * validPageSize}, ${validPageSize};`;
    
    return db.query2(_sql);
}

// 检查用户是否已点赞
exports.checkPraiseStatus = (browserId, targetId, targetType) => {
    let _sql = `SELECT * FROM praise_record 
                WHERE browser_id = ? 
                AND target_id = ? 
                AND target_type = ?;`;
    
    return db.query2(_sql, [browserId, targetId, targetType]);
}

// 添加点赞记录
exports.addPraiseRecord = (value) => {
    let _sql = "INSERT INTO praise_record SET ?;";
    return db.query2(_sql, value);
}

// 删除点赞记录（取消点赞）
exports.removePraiseRecord = (browserId, targetId, targetType) => {
    let _sql = `DELETE FROM praise_record 
                WHERE browser_id = ? 
                AND target_id = ? 
                AND target_type = ?;`;
    
    return db.query2(_sql, [browserId, targetId, targetType]);
}

// 获取点赞数量
exports.getPraiseRecordCount = (targetId, targetType) => {
    let _sql = `SELECT COUNT(*) as count 
                FROM praise_record 
                WHERE target_id = ? 
                AND target_type = ?;`;
    
    return db.query2(_sql, [targetId, targetType]);
}

// 创建随笔评论
exports.createDiaryComment = (value) => {
    let _sql = "INSERT INTO diary_comment SET ?;";
    return db.query2(_sql, value);
}

// 获取随笔评论（分页）
exports.getDiaryComments = (diaryId, pageSize, nowPage) => {
    const validPageSize = pageSize && !isNaN(pageSize) ? parseInt(pageSize) : 10;
    const validNowPage = nowPage && !isNaN(nowPage) ? parseInt(nowPage) : 1;

    let _sql = `SELECT * FROM diary_comment 
                WHERE diary_id = "${diaryId}" 
                ORDER BY id DESC 
                LIMIT ${(validNowPage - 1) * validPageSize}, ${validPageSize};`;
    
    return db.query2(_sql);
}

// 获取随笔评论总数
exports.getDiaryCommentCount = (diaryId) => {
    let _sql;
    
    if (diaryId === -1) {
        _sql = `SELECT COUNT(*) as count FROM diary_comment`;
    } else {
        _sql = `SELECT COUNT(*) as count FROM diary_comment WHERE diary_id="${diaryId}"`;
    }

    return db.query2(_sql);
}

// 随笔评论标记为已读
exports.diaryCommentIsRead = (id) => {
    let _sql = `UPDATE diary_comment SET isread=1 WHERE id="${id}";`;
    return db.query2(_sql);
}

// 删除随笔评论
exports.deleteDiaryComment = (id) => {
    let _sql = `DELETE FROM diary_comment WHERE id="${id}";`;
    return db.query2(_sql);
}

// 批量获取点赞数
exports.getBatchPraiseCounts = (targetIds, targetType) => {
    if (!targetIds || targetIds.length === 0) {
        return Promise.resolve([]);
    }
    
    // 将ID数组转换为逗号分隔的字符串
    const idsStr = targetIds.join(',');
    
    let _sql = `SELECT target_id, COUNT(*) as count 
                FROM praise_record 
                WHERE target_id IN (${idsStr}) 
                AND target_type = ? 
                GROUP BY target_id;`;
    
    return db.query2(_sql, [targetType]);
}

// 获取最近点赞的内容
exports.getRecentPraises = (targetType, limit) => {
    const validLimit = limit && !isNaN(limit) ? parseInt(limit) : 10;
    
    let _sql = `SELECT target_id, COUNT(*) as praise_count 
                FROM praise_record 
                WHERE target_type = ? 
                GROUP BY target_id 
                ORDER BY MAX(moment) DESC 
                LIMIT ?;`;
    
    return db.query2(_sql, [targetType, validLimit]);
}

// 获取点赞排行榜
exports.getPraiseRanking = (targetType, limit) => {
    const validLimit = limit && !isNaN(limit) ? parseInt(limit) : 10;
    
    let _sql = `SELECT target_id, COUNT(*) as praise_count 
                FROM praise_record 
                WHERE target_type = ? 
                GROUP BY target_id 
                ORDER BY praise_count DESC 
                LIMIT ?;`;
    
    return db.query2(_sql, [targetType, validLimit]);
}

// 获取指定时间段内的点赞数
exports.getPraiseCountByTimeRange = (targetId, targetType, startTime, endTime) => {
    let _sql = `SELECT COUNT(*) as count 
                FROM praise_record 
                WHERE target_id = ? 
                AND target_type = ? 
                AND moment BETWEEN ? AND ?;`;
    
    return db.query2(_sql, [targetId, targetType, startTime, endTime]);
}

// 获取用户点赞历史
exports.getUserPraiseHistory = (browserId, limit) => {
    const validLimit = limit && !isNaN(limit) ? parseInt(limit) : 20;
    
    let _sql = `SELECT * FROM praise_record 
                WHERE browser_id = ? 
                ORDER BY moment DESC 
                LIMIT ?;`;
    
    return db.query2(_sql, [browserId, validLimit]);
}

// 清理过期的点赞记录(可选，用于定期维护)
exports.cleanupOldPraises = (daysToKeep) => {
    const days = daysToKeep || 365; // 默认保留一年的记录
    
    let _sql = `DELETE FROM praise_record 
                WHERE moment < DATE_SUB(NOW(), INTERVAL ? DAY);`;
    
    return db.query2(_sql, [days]);
}

// 将旧点赞数据同步到新系统(兼容层)
exports.syncOldPraises = async () => {
    // 获取旧系统中的所有点赞记录
    let _sql = `SELECT * FROM praise WHERE NOT EXISTS (
                  SELECT 1 FROM praise_record 
                  WHERE praise_record.target_id = praise.article_id 
                  AND praise_record.target_type = 0
                  AND praise_record.browser_id = praise.user_id
                );`;
    
    const oldPraises = await db.query2(_sql);
    
    // 批量插入到新系统
    if (oldPraises && oldPraises.length > 0) {
        const insertPromises = oldPraises.map(oldPraise => {
            const newPraise = {
                browser_id: oldPraise.user_id,
                target_id: oldPraise.article_id,
                target_type: 0, // 文章类型
                moment: oldPraise.moment
            };
            
            return this.addPraiseRecord(newPraise);
        });
        
        return Promise.all(insertPromises);
    }
    
    return Promise.resolve([]);
}

// 获取文章点赞数(兼容两个系统)
exports.getArticlePraiseCount = async (articleId) => {
    // 获取新系统中的点赞数
    const newPraises = await this.getPraiseRecordCount(articleId, 0);
    
    // 获取旧系统中的点赞数
    let _sql = `SELECT COUNT(*) as count FROM praise WHERE article_id="${articleId}";`;
    const oldPraises = await db.query2(_sql);
    
    // 返回两个系统的总和
    return {
        count: newPraises[0].count + oldPraises[0].count,
        new_system: newPraises[0].count,
        old_system: oldPraises[0].count
    };
}

// 创建评论回复表的模型
exports.createReplyTable = () => {
    const reply = `
        CREATE TABLE IF NOT EXISTS comment_reply (
            id INT AUTO_INCREMENT PRIMARY KEY,
            comment_id INT NOT NULL,
            target_id INT NOT NULL,
            target_type INT NOT NULL,
            content TEXT NOT NULL,
            user_id VARCHAR(255),
            user_name VARCHAR(50),
            user_type INT DEFAULT 1,
            user_avatar VARCHAR(255),
            browser_id VARCHAR(255),
            moment VARCHAR(50),
            isread INT DEFAULT 0,
            praise_count INT DEFAULT 0,
            INDEX (comment_id)
        )
    `;
    return db.query2(reply);
}

// 添加评论回复
exports.addCommentReply = (value) => {
    let _sql = "INSERT INTO comment_reply SET ?;";
    return db.query2(_sql, value);
}

// 获取评论的回复列表
exports.getCommentReplies = (commentId, pageSize, nowPage) => {
    const validPageSize = pageSize && !isNaN(pageSize) ? parseInt(pageSize) : 10;
    const validNowPage = nowPage && !isNaN(nowPage) ? parseInt(nowPage) : 1;

    let _sql = `SELECT * FROM comment_reply 
                WHERE comment_id = ? 
                ORDER BY id ASC 
                LIMIT ${(validNowPage - 1) * validPageSize}, ${validPageSize};`;
    
    return db.query2(_sql, [commentId]);
}

// 获取评论回复总数
exports.getCommentReplyCount = (commentId) => {
    let _sql = `SELECT COUNT(*) as count FROM comment_reply WHERE comment_id = ?;`;
    return db.query2(_sql, [commentId]);
}

// 批量获取多个评论的回复
exports.getRepliesByCommentIds = (commentIds) => {
    if (!commentIds || commentIds.length === 0) {
        return Promise.resolve([]);
    }
    
    const idsStr = commentIds.join(',');
    let _sql = `SELECT * FROM comment_reply WHERE comment_id IN (${idsStr}) ORDER BY id ASC;`;
    return db.query2(_sql);
}

// 标记回复为已读
exports.updateReplyIsRead = (id) => {
    let _sql = `UPDATE comment_reply SET isread = 1 WHERE id = ?;`;
    return db.query2(_sql, [id]);
}

// 删除回复
exports.deleteCommentReply = (id) => {
    let _sql = `DELETE FROM comment_reply WHERE id = ?;`;
    return db.query2(_sql, [id]);
}

// 获取用户对指定文章列表的点赞状态
exports.getUserPraisedArticles = (browserId, articleIds) => {
    if (!articleIds || articleIds.length === 0) {
        return Promise.resolve([]);
    }
    
    const idsStr = articleIds.join(',');
    let _sql = `SELECT target_id FROM praise_record 
                WHERE browser_id = ? 
                AND target_id IN (${idsStr}) 
                AND target_type = 0;`;
    
    return db.query2(_sql, [browserId]);
}


// 添加文章点赞（事务操作）
exports.addArticlePraise = async (praiseData) => {
    const connection = await new Promise((resolve, reject) => {
        db.query2('SELECT CONNECTION_ID()', [])
            .then(() => {
                // 这里我们需要使用事务，但由于原有架构限制，我们先用两个独立操作
                // 实际项目中建议使用数据库连接池的事务功能
                resolve(null);
            })
            .catch(reject);
    });
    
    try {
        // 1. 添加点赞记录
        await this.addPraiseRecord(praiseData);
        
        // 2. 更新文章点赞数
        const updateSql = `UPDATE article SET praise_count = praise_count + 1 WHERE id = ?;`;
        await db.query2(updateSql, [praiseData.target_id]);
        
        // 3. 获取更新后的点赞数
        const countSql = `SELECT praise_count FROM article WHERE id = ?;`;
        const result = await db.query2(countSql, [praiseData.target_id]);
        
        return {
            count: result[0] ? result[0].praise_count : 0
        };
    } catch (error) {
        // 如果更新article表失败，回滚点赞记录
        await this.removePraiseRecord(praiseData.browser_id, praiseData.target_id, praiseData.target_type);
        throw error;
    }
}

// 移除文章点赞（事务操作）
exports.removeArticlePraise = async (browserId, targetId, targetType) => {
    try {
        // 1. 删除点赞记录
        await this.removePraiseRecord(browserId, targetId, targetType);
        
        // 2. 更新文章点赞数（确保不会变成负数）
        const updateSql = `UPDATE article SET praise_count = GREATEST(praise_count - 1, 0) WHERE id = ?;`;
        await db.query2(updateSql, [targetId]);
        
        // 3. 获取更新后的点赞数
        const countSql = `SELECT praise_count FROM article WHERE id = ?;`;
        const result = await db.query2(countSql, [targetId]);
        
        return {
            count: result[0] ? result[0].praise_count : 0
        };
    } catch (error) {
        console.error('移除文章点赞失败:', error);
        throw error;
    }
}

// 批量获取文章点赞数（优化版本）
exports.getBatchArticlePraiseCounts = (articleIds) => {
    if (!articleIds || articleIds.length === 0) {
        return Promise.resolve([]);
    }
    
    const idsStr = articleIds.join(',');
    let _sql = `SELECT id as target_id, praise_count as count 
                FROM article 
                WHERE id IN (${idsStr});`;
    
    return db.query2(_sql);
}

// 修复数据一致性（可选的维护功能）
exports.syncArticlePraiseCounts = async () => {
    try {
        // 重新计算所有文章的点赞数并更新
        const syncSql = `
            UPDATE article 
            SET praise_count = (
                SELECT COUNT(*) 
                FROM praise_record 
                WHERE target_id = article.id 
                AND target_type = 0
            );
        `;
        
        await db.query2(syncSql);
        
        return { success: true, message: '文章点赞数同步完成' };
    } catch (error) {
        console.error('同步文章点赞数失败:', error);
        throw error;
    }
}

// 获取文章详情时包含点赞数
exports.gainArticle = (id) => {
    let _sql = `SELECT *, IFNULL(praise_count, 0) as praise_count FROM article WHERE id="${id}";`;
    return db.query2(_sql);
}

// 更新文章浏览量
exports.updateArticleViews = (id) => {
  let _sql = `UPDATE article SET views = views + 1 WHERE id = ?;`;
  return db.query2(_sql, [id]);
};

// 获取指定日期的日记
exports.getDiaryByDate = (date) => {
    // 将日期转换为YYYY-MM-DD格式
    const formattedDate = new Date(date).toISOString().split('T')[0];
    
    // 查询在指定日期当天的日记，按moment字段排序
    const _sql = `SELECT * FROM diary 
                 WHERE DATE(moment) = ? 
                 ORDER BY moment ASC 
                 LIMIT 1;`;
                 
    return db.query2(_sql, [formattedDate]);
}

// 获取距离指定日期最近的日记
exports.getNearestDiary = (date) => {
    // 将日期转换为YYYY-MM-DD格式
    const formattedDate = new Date(date).toISOString().split('T')[0];
    
    // 复杂查询：按日期差的绝对值排序，获取最近的日记
    const _sql = `SELECT *, ABS(DATEDIFF(DATE(moment), ?)) AS date_diff 
                 FROM diary 
                 ORDER BY date_diff ASC, moment ASC
                 LIMIT 1;`;
                 
    return db.query2(_sql, [formattedDate]);
}

// 搜索普通文章（classify=0）
exports.searchArticles = (keyword, limit) => {
    const validLimit = limit && !isNaN(limit) ? parseInt(limit) : 9;
    
    let _sql = `SELECT id, title, introduce, cover, subset_id, classify, moment, views, praise_count, label 
                FROM article 
                WHERE state = 1 AND classify = 0 AND (title LIKE ? OR introduce LIKE ? OR content LIKE ?)
                ORDER BY id DESC
                LIMIT ?;`;
    
    const searchPattern = `%${keyword}%`;
    return db.query2(_sql, [searchPattern, searchPattern, searchPattern, validLimit]);
}

// 搜索图库（实际上是从文章中筛选classify=1的记录）
exports.searchGalleries = (keyword, limit) => {
    const validLimit = limit && !isNaN(limit) ? parseInt(limit) : 10;
    
    let _sql = `SELECT id, title, introduce, cover, subset_id, classify, moment, views, praise_count, label 
                FROM article 
                WHERE state = 1 AND classify = 1 AND (title LIKE ? OR introduce LIKE ? OR content LIKE ?)
                ORDER BY id DESC
                LIMIT ?;`;
    
    const searchPattern = `%${keyword}%`;
    return db.query2(_sql, [searchPattern, searchPattern, searchPattern, validLimit]);
}

// 搜索日记
exports.searchDiaries = (keyword, limit) => {
    const validLimit = limit && !isNaN(limit) ? parseInt(limit) : 3;
    
    let _sql = `SELECT id, title, content, picture, weather_id, mood, moment 
                FROM diary 
                WHERE title LIKE ? OR content LIKE ?
                ORDER BY id DESC
                LIMIT ?;`;
    
    const searchPattern = `%${keyword}%`;
    return db.query2(_sql, [searchPattern, searchPattern, validLimit]);
}

// 搜索资源文件
exports.searchResources = (keyword, limit) => {
    const validLimit = limit && !isNaN(limit) ? parseInt(limit) : 8;
    
    // 定义要排除的图片格式
    const excludedFormats = "'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'";
    
    let _sql = `SELECT id, url, file_name, format, subset_id, moment, file_size, file_desc 
                FROM file 
                WHERE (file_name LIKE ? OR file_desc LIKE ?) 
                AND format NOT IN (${excludedFormats})
                ORDER BY id DESC
                LIMIT ?;`;
    
    const searchPattern = `%${keyword}%`;
    return db.query2(_sql, [searchPattern, searchPattern, validLimit]);
}

// 获取搜索结果计数
exports.getSearchCounts = async (keyword) => {
    const searchPattern = `%${keyword}%`;
    
    // 文章计数（普通文章，classify=0）
    const articleSql = `SELECT COUNT(*) as count 
                        FROM article 
                        WHERE state = 1 AND classify = 0 AND (title LIKE ? OR introduce LIKE ? OR content LIKE ?);`;
    const articleCount = await db.query2(articleSql, [searchPattern, searchPattern, searchPattern]);
    
    // 图库计数（图库文章，classify=1）
    const gallerySql = `SELECT COUNT(*) as count 
                        FROM article 
                        WHERE state = 1 AND classify = 1 AND (title LIKE ? OR introduce LIKE ? OR content LIKE ?);`;
    const galleryCount = await db.query2(gallerySql, [searchPattern, searchPattern, searchPattern]);
    
    // 日记计数
    const diarySql = `SELECT COUNT(*) as count 
                      FROM diary 
                      WHERE title LIKE ? OR content LIKE ?;`;
    const diaryCount = await db.query2(diarySql, [searchPattern, searchPattern]);
    
    // 资源计数（排除图片类型）
    const excludedFormats = "'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'";
    const resourceSql = `SELECT COUNT(*) as count 
                         FROM file 
                         WHERE (file_name LIKE ? OR file_desc LIKE ?)
                         AND format NOT IN (${excludedFormats});`;
    const resourceCount = await db.query2(resourceSql, [searchPattern, searchPattern]);
    
    return {
        articleCount: articleCount[0].count,
        galleryCount: galleryCount[0].count,
        diaryCount: diaryCount[0].count,
        resourceCount: resourceCount[0].count
    };
}

// 保存监控事件
exports.saveMonitorEvent = (eventData) => {
    let _sql = "INSERT INTO monitor_events SET ?;";
    return db.query2(_sql, eventData);
}

// 保存错误详情
exports.saveMonitorError = (errorData) => {
    let _sql = "INSERT INTO monitor_errors SET ?;";
    return db.query2(_sql, errorData);
}

// 保存性能指标
exports.saveMonitorPerformance = (performanceData) => {
    let _sql = "INSERT INTO monitor_performance SET ?;";
    return db.query2(_sql, performanceData);
}

// 保存用户行为
exports.saveMonitorBehavior = (behaviorData) => {
    let _sql = "INSERT INTO monitor_behaviors SET ?;";
    return db.query2(_sql, behaviorData);
}

// 获取监控事件统计
exports.getMonitorStats = (startTime, endTime, eventType) => {
    let params = [startTime, endTime];
    let whereCause = "WHERE timestamp BETWEEN ? AND ?";
    
    if (eventType) {
        whereCause += " AND event_type = ?";
        params.push(eventType);
    }
    
    let _sql = `SELECT 
                  event_type, 
                  COUNT(*) as count,
                  DATE(FROM_UNIXTIME(timestamp/1000)) as day
                FROM monitor_events
                ${whereCause}
                GROUP BY event_type, day
                ORDER BY day, event_type;`;
    
    return db.query2(_sql, params);
}

// 获取性能指标分析
exports.getPerformanceStats = (startTime, endTime, metrics) => {
    let params = [startTime, endTime];
    let filterSql = '';
    
    if (metrics && Array.isArray(metrics) && metrics.length > 0) {
        const placeholders = metrics.map(() => '?').join(',');
        filterSql = ` AND mp.metric_name IN (${placeholders})`;
        params = [...params, ...metrics];
    }
    
    let _sql = `
        SELECT 
            mp.metric_name, 
            AVG(mp.metric_value) as avg_value,
            MIN(mp.metric_value) as min_value,
            MAX(mp.metric_value) as max_value,
            COUNT(*) as sample_count,
            DATE(FROM_UNIXTIME(me.timestamp/1000)) as day
        FROM 
            monitor_performance mp
        JOIN 
            monitor_events me ON mp.event_id = me.id
        WHERE 
            me.timestamp BETWEEN ? AND ?
            ${filterSql}
        GROUP BY 
            mp.metric_name, day 
        ORDER BY 
            day, mp.metric_name
    `;
    
    return db.query2(_sql, params);
};

// 获取设备统计信息
exports.getDeviceStats = async (startTime, endTime) => {
    // 查询设备类型分布
    const deviceTypeSql = `
        SELECT 
            JSON_UNQUOTE(JSON_EXTRACT(device_info, '$.deviceType')) as device_type,
            COUNT(*) as count
        FROM 
            monitor_events
        WHERE 
            timestamp BETWEEN ? AND ?
            AND JSON_EXTRACT(device_info, '$.deviceType') IS NOT NULL
        GROUP BY 
            device_type
    `;
    
    // 查询浏览器分布
    const browserSql = `
        SELECT 
            JSON_UNQUOTE(JSON_EXTRACT(device_info, '$.browser')) as browser,
            COUNT(*) as count
        FROM 
            monitor_events
        WHERE 
            timestamp BETWEEN ? AND ?
            AND JSON_EXTRACT(device_info, '$.browser') IS NOT NULL
        GROUP BY 
            browser
    `;
    
    // 查询操作系统分布
    const osSql = `
        SELECT 
            JSON_UNQUOTE(JSON_EXTRACT(device_info, '$.os')) as os,
            COUNT(*) as count
        FROM 
            monitor_events
        WHERE 
            timestamp BETWEEN ? AND ?
            AND JSON_EXTRACT(device_info, '$.os') IS NOT NULL
        GROUP BY 
            os
    `;
    
    const [deviceTypes, browsers, osList] = await Promise.all([
        db.query2(deviceTypeSql, [startTime, endTime]),
        db.query2(browserSql, [startTime, endTime]),
        db.query2(osSql, [startTime, endTime])
    ]);
    
    return {
        device_types: deviceTypes,
        browsers: browsers,
        os: osList
    };
};

// 获取组件访问统计
exports.getComponentStats = (startTime, endTime, limit) => {
    let _sql = `
        SELECT 
            mb.action_value as component_name,
            COUNT(*) as visit_count
        FROM 
            monitor_behaviors mb
        JOIN 
            monitor_events me ON mb.event_id = me.id
        WHERE 
            me.timestamp BETWEEN ? AND ?
            AND me.event_type = 'behavior'
            AND mb.action_type = 'component_view'
        GROUP BY 
            mb.action_value
        ORDER BY 
            visit_count DESC
        LIMIT ?
    `;
    
    return db.query2(_sql, [startTime, endTime, limit]);
};

// 获取页面访问统计
exports.getPageViewStats = (startTime, endTime, limit) => {
    let _sql = `
        SELECT 
            page_url,
            COUNT(*) as visit_count
        FROM 
            monitor_events
        WHERE 
            timestamp BETWEEN ? AND ?
            AND event_type = 'behavior'
            AND event_name = 'page_view'
        GROUP BY 
            page_url
        ORDER BY 
            visit_count DESC
        LIMIT ?
    `;
    
    return db.query2(_sql, [startTime, endTime, limit || 20]);
};

// 获取错误统计
exports.getErrorStats = (startTime, endTime) => {
    let _sql = `
        SELECT 
            me.error_type,
            COUNT(*) as error_count,
            DATE(FROM_UNIXTIME(e.timestamp/1000)) as day
        FROM 
            monitor_errors me
        JOIN 
            monitor_events e ON me.event_id = e.id
        WHERE 
            e.timestamp BETWEEN ? AND ?
        GROUP BY 
            me.error_type, day
        ORDER BY 
            day, error_count DESC
    `;
    
    return db.query2(_sql, [startTime, endTime]);
};

// 获取最近的错误详情
exports.getRecentErrors = (limit) => {
    let _sql = `
        SELECT 
            me.id,
            me.event_name,
            me.level,
            me.page_url,
            me.timestamp,
            me.moment,
            er.error_type,
            er.error_message,
            er.error_stack,
            er.component
        FROM 
            monitor_events me
        JOIN 
            monitor_errors er ON me.id = er.event_id
        WHERE 
            me.event_type = 'error'
        ORDER BY 
            me.timestamp DESC
        LIMIT ?
    `;
    
    return db.query2(_sql, [limit || 20]);
};

exports.getVisitTrends = (startTime, endTime) => {
    // 获取当前日期范围（以便在SQL中也使用日期而非时间戳）
    const startDate = new Date(parseInt(startTime)).toISOString().split('T')[0];
    const endDate = new Date(parseInt(endTime)).toISOString().split('T')[0];
    
    console.log('查询日期范围:', { startDate, endDate, startTime, endTime });
    
    // 使用CASE语句处理不同的日期格式
    let _sql = `
        SELECT 
            COALESCE(
                DATE_FORMAT(STR_TO_DATE(moment, '%Y/%m/%d %H:%i:%s'), '%Y-%m-%d'),
                DATE_FORMAT(STR_TO_DATE(moment, '%c/%e/%Y, %l:%i:%s %p'), '%Y-%m-%d'),
                DATE_FORMAT(STR_TO_DATE(moment, '%Y-%m-%d %H:%i:%s'), '%Y-%m-%d'),
                DATE(FROM_UNIXTIME(timestamp/1000))
            ) as date,
            COUNT(*) as visit_count
        FROM 
            monitor_events
        WHERE 
            (
                DATE(STR_TO_DATE(moment, '%Y/%m/%d %H:%i:%s')) BETWEEN ? AND ?
                OR DATE(STR_TO_DATE(moment, '%c/%e/%Y, %l:%i:%s %p')) BETWEEN ? AND ?
                OR DATE(STR_TO_DATE(moment, '%Y-%m-%d %H:%i:%s')) BETWEEN ? AND ?
                OR DATE(FROM_UNIXTIME(timestamp/1000)) BETWEEN ? AND ?
            )
            AND event_type = 'behavior'
            AND event_name = 'page_view'
        GROUP BY 
            date
        ORDER BY 
            date ASC
    `;
    
    // 同样的日期参数重复4次，对应4种可能的格式
    return db.query2(_sql, [
        startDate, endDate,
        startDate, endDate,
        startDate, endDate,
        startDate, endDate
    ]);
};

// 获取设备分布统计
exports.getDeviceAnalysis = async (startTime, endTime) => {
    // 查询设备类型分布
    const deviceTypeSql = `
        SELECT 
            JSON_UNQUOTE(JSON_EXTRACT(device_info, '$.deviceType')) as name,
            COUNT(*) as value
        FROM 
            monitor_events
        WHERE 
            timestamp BETWEEN ? AND ?
            AND event_type = 'behavior'
            AND event_name = 'page_view'
            AND JSON_EXTRACT(device_info, '$.deviceType') IS NOT NULL
        GROUP BY 
            name
        ORDER BY 
            value DESC
    `;
    
    // 查询浏览器分布
    const browserSql = `
        SELECT 
            JSON_UNQUOTE(JSON_EXTRACT(device_info, '$.browser')) as name,
            COUNT(*) as value
        FROM 
            monitor_events
        WHERE 
            timestamp BETWEEN ? AND ?
            AND event_type = 'behavior'
            AND event_name = 'page_view'
            AND JSON_EXTRACT(device_info, '$.browser') IS NOT NULL
        GROUP BY 
            name
        ORDER BY 
            value DESC
    `;
    const osSql = `
        SELECT 
            JSON_UNQUOTE(JSON_EXTRACT(device_info, '$.os')) as name,
            COUNT(*) as value
        FROM 
            monitor_events
        WHERE 
            timestamp BETWEEN ? AND ?
            AND event_type = 'behavior'
            AND event_name = 'page_view'
            AND JSON_EXTRACT(device_info, '$.os') IS NOT NULL
        GROUP BY 
            name
        ORDER BY 
            value DESC
    `;
    
    return Promise.all([
        db.query2(deviceTypeSql, [startTime, endTime]),
        db.query2(browserSql, [startTime, endTime]),
        db.query2(osSql, [startTime, endTime])
    ]).then(([deviceTypes, browsers, os]) => {
        return {
            device_types: deviceTypes,
            browsers: browsers,
            os: os
        };
    });
};

// 获取内容分布统计
exports.getContentDistribution = async (startTime, endTime) => {
    // 生成开始和结束日期
    const startDate = new Date(parseInt(startTime)).toISOString().split('T')[0];
    const endDate = new Date(parseInt(endTime)).toISOString().split('T')[0];
    
    // 查询不同内容类型的总访问量
    const totalDistributionSql = `
        SELECT 
            CASE 
                WHEN page_url LIKE '%/article%' OR page_url LIKE '%/post%' OR page_url LIKE '%/blog%' THEN '文章'
                WHEN page_url LIKE '%/gallery%' OR page_url LIKE '%/photo%' OR page_url LIKE '%/image%' THEN '图库'
                WHEN page_url LIKE '%/diary%' OR page_url LIKE '%/journal%' THEN '日记'
                WHEN page_url LIKE '%/resource%' OR page_url LIKE '%/download%' OR page_url LIKE '%/files%' THEN '资源'
                WHEN page_url LIKE '%/index%' OR page_url = '/' OR page_url LIKE '%/home%' THEN '首页'
                ELSE '其他'
            END as name,
            COUNT(*) as value
        FROM 
            monitor_events
        WHERE 
            (
                DATE(STR_TO_DATE(moment, '%c/%e/%Y, %l:%i:%s %p')) BETWEEN ? AND ? 
                OR DATE(STR_TO_DATE(moment, '%Y/%m/%d %H:%i:%s')) BETWEEN ? AND ?
                OR DATE(FROM_UNIXTIME(timestamp/1000)) BETWEEN ? AND ?
            )
            AND event_type = 'behavior'
            AND event_name = 'route_change'
        GROUP BY 
            name
        ORDER BY 
            value DESC
    `;
    
    // 类似修改每日趋势查询
    const dailyTrendsSql = `
        SELECT 
            DATE_FORMAT(STR_TO_DATE(moment, '%Y/%m/%d %H:%i:%s'), '%Y-%m-%d') as date,
            CASE 
                WHEN page_url LIKE '%/article%' OR page_url LIKE '%/post%' OR page_url LIKE '%/blog%' THEN '文章'
                WHEN page_url LIKE '%/gallery%' OR page_url LIKE '%/photo%' OR page_url LIKE '%/image%' THEN '图库'
                WHEN page_url LIKE '%/diary%' OR page_url LIKE '%/journal%' THEN '日记'
                WHEN page_url LIKE '%/resource%' OR page_url LIKE '%/download%' OR page_url LIKE '%/files%' THEN '资源'
                WHEN page_url LIKE '%/index%' OR page_url = '/' OR page_url LIKE '%/home%' THEN '首页'
                ELSE '其他'
            END as content_type,
            COUNT(*) as visit_count
        FROM 
            monitor_events
        WHERE 
            (
                DATE(STR_TO_DATE(moment, '%c/%e/%Y, %l:%i:%s %p')) BETWEEN ? AND ? 
                OR DATE(STR_TO_DATE(moment, '%Y/%m/%d %H:%i:%s')) BETWEEN ? AND ?
                OR DATE(FROM_UNIXTIME(timestamp/1000)) BETWEEN ? AND ?
            )
            AND event_type = 'behavior'
            AND event_name = 'route_change'
        GROUP BY 
            date, content_type
        ORDER BY 
            date ASC, content_type
    `;
    
    const [totalDistribution, dailyTrendsRaw] = await Promise.all([
        db.query2(totalDistributionSql, [startDate, endDate, startDate, endDate, startDate, endDate]),
        db.query2(dailyTrendsSql, [startDate, endDate, startDate, endDate, startDate, endDate])
    ]);
    
    // 处理数据...
    
    return {
        total_distribution: totalDistribution,
        daily_trends: {
            dates: [...new Set(dailyTrendsRaw.map(item => item.date))].sort(),
            articles: dailyTrendsRaw.filter(item => item.content_type === '文章').map(item => item.visit_count),
            galleries: dailyTrendsRaw.filter(item => item.content_type === '图库').map(item => item.visit_count),
            diaries: dailyTrendsRaw.filter(item => item.content_type === '日记').map(item => item.visit_count),
            resources: dailyTrendsRaw.filter(item => item.content_type === '资源').map(item => item.visit_count),
            homepage: dailyTrendsRaw.filter(item => item.content_type === '首页').map(item => item.visit_count),
            others: dailyTrendsRaw.filter(item => item.content_type === '其他').map(item => item.visit_count)
        }
    };
};

exports.getVisitTrendsDebug = async (startTime, endTime) => {
    
    // 查询原始数据用于调试
    const debugSql = `
        SELECT 
            timestamp,
            FROM_UNIXTIME(timestamp/1000) as local_time,
            CONVERT_TZ(FROM_UNIXTIME(timestamp/1000), @@session.time_zone, '+00:00') as utc_time,
            DATE(CONVERT_TZ(FROM_UNIXTIME(timestamp/1000), @@session.time_zone, '+00:00')) as date,
            event_type,
            event_name,
            page_url
        FROM 
            monitor_events
        WHERE 
            timestamp BETWEEN ? AND ?
            AND event_type = 'behavior'
            AND event_name = 'page_view'
        ORDER BY 
            timestamp ASC
        LIMIT 50
    `;
    
    const debugData = await db.query2(debugSql, [startTime, endTime]);
    
    // 执行正常查询
    let _sql = `
        SELECT 
            DATE(CONVERT_TZ(FROM_UNIXTIME(timestamp/1000), @@session.time_zone, '+00:00')) as date,
            COUNT(*) as visit_count
        FROM 
            monitor_events
        WHERE 
            timestamp BETWEEN ? AND ?
            AND event_type = 'behavior'
            AND event_name = 'page_view'
        GROUP BY 
            date
        ORDER BY 
            date ASC
    `;
    
    const result = await db.query2(_sql, [startTime, endTime]);
    
    return result;
};

// 调试用函数，直接获取设备数据示例
exports.debugDeviceData = async () => {
    try {
        // 获取设备数据样本
        const sampleSql = `
            SELECT 
                device_info,
                moment,
                event_type,
                event_name,
                JSON_UNQUOTE(JSON_EXTRACT(device_info, '$.deviceType')) as deviceType,
                JSON_UNQUOTE(JSON_EXTRACT(device_info, '$.browser')) as browser,
                JSON_UNQUOTE(JSON_EXTRACT(device_info, '$.os')) as os
            FROM 
                monitor_events
            WHERE 
                device_info IS NOT NULL
            LIMIT 10;
        `;
        
        const deviceSamples = await db.query2(sampleSql);
        
        // 统计设备类型总数 - 无过滤
        const allDeviceSql = `
            SELECT 
                COUNT(DISTINCT JSON_UNQUOTE(JSON_EXTRACT(device_info, '$.deviceType'))) as total_device_types,
                COUNT(*) as total_events
            FROM 
                monitor_events
            WHERE 
                device_info IS NOT NULL;
        `;
        
        // 统计设备类型总数 - 仅页面访问
        const pageViewDeviceSql = `
            SELECT 
                COUNT(DISTINCT JSON_UNQUOTE(JSON_EXTRACT(device_info, '$.deviceType'))) as page_view_device_types,
                COUNT(*) as page_view_events
            FROM 
                monitor_events
            WHERE 
                device_info IS NOT NULL
                AND event_type = 'behavior'
                AND event_name = 'page_view';
        `;
        
        // 页面访问事件总数
        const pageViewSql = `
            SELECT 
                COUNT(*) as total_page_views
            FROM 
                monitor_events
            WHERE 
                event_type = 'behavior'
                AND event_name = 'page_view';
        `;
        
        const [allDeviceStats, pageViewDeviceStats, pageViewStats] = await Promise.all([
            db.query2(allDeviceSql),
            db.query2(pageViewDeviceSql),
            db.query2(pageViewSql)
        ]);
        
        return {
            samples: deviceSamples,
            statistics: {
                all_events: allDeviceStats[0] || { total_device_types: 0, total_events: 0 },
                page_view_events: pageViewDeviceStats[0] || { page_view_device_types: 0, page_view_events: 0 },
                page_views: pageViewStats[0] || { total_page_views: 0 }
            }
        };
    } catch (err) {
        console.error('设备数据调试错误:', err);
        return [];
    }
};

// 调试用函数，直接获取内容分布数据示例
exports.debugContentData = async () => {
    try {
        // 获取访问量前20的URL
        const topUrlsSql = `
            SELECT 
                page_url,
                COUNT(*) as visit_count
            FROM 
                monitor_events
            WHERE 
                event_type = 'behavior'
                AND event_name = 'page_view'
            GROUP BY 
                page_url
            ORDER BY 
                visit_count DESC
            LIMIT 20;
        `;
        
        // 获取URL中可能的路径模式
        const urlPatternsSql = `
            SELECT 
                SUBSTRING_INDEX(SUBSTRING_INDEX(page_url, '/', 2), '/', -1) as first_segment,
                COUNT(*) as count
            FROM 
                monitor_events
            WHERE 
                event_type = 'behavior'
                AND event_name = 'page_view'
            GROUP BY 
                first_segment
            ORDER BY 
                count DESC
            LIMIT 10;
        `;
        
        // 使用当前分类规则测试
        const categorySql = `
            SELECT 
                CASE 
                    WHEN page_url LIKE '%/article%' OR page_url LIKE '%/post%' OR page_url LIKE '%/blog%' THEN '文章'
                    WHEN page_url LIKE '%/gallery%' OR page_url LIKE '%/photo%' OR page_url LIKE '%/image%' THEN '图库'
                    WHEN page_url LIKE '%/diary%' OR page_url LIKE '%/journal%' THEN '日记'
                    WHEN page_url LIKE '%/resource%' OR page_url LIKE '%/download%' OR page_url LIKE '%/file%' THEN '资源'
                    WHEN page_url LIKE '%/index%' OR page_url = '/' OR page_url LIKE '%/home%' THEN '首页'
                    ELSE '其他'
                END as category,
                COUNT(*) as count,
                GROUP_CONCAT(DISTINCT page_url SEPARATOR ', ') as sample_urls
            FROM 
                monitor_events
            WHERE 
                event_type = 'behavior'
                AND event_name = 'page_view'
            GROUP BY 
                category
            ORDER BY 
                count DESC;
        `;
        
        const [topUrls, urlPatterns, categories] = await Promise.all([
            db.query2(topUrlsSql),
            db.query2(urlPatternsSql),
            db.query2(categorySql)
        ]);
        
        // 统计各内容类型的访问量
        const contentTypeCounts = {
            total_views: topUrls.reduce((sum, url) => sum + url.visit_count, 0),
            categorized: categories.reduce((obj, cat) => {
                obj[cat.category] = cat.count;
                return obj;
            }, {})
        };
        
        return {
            top_urls: topUrls,
            url_patterns: urlPatterns,
            categories: categories,
            statistics: contentTypeCounts
        };
    } catch (err) {
        console.error('内容数据调试错误:', err);
        return [];
    }
};

// 调试内容分布统计
exports.debugContentDistribution = async () => {
    // 获取最近一周的数据
    const endTime = Date.now();
    const startTime = endTime - 7 * 24 * 60 * 60 * 1000; // 7天前
    
    // 查询route_change事件样本
    const routeChangeSampleSql = `
        SELECT 
            id,
            event_type,
            event_name,
            level,
            page_url,
            moment,
            timestamp
        FROM 
            monitor_events
        WHERE 
            event_type = 'behavior' 
            AND event_name = 'route_change'
        ORDER BY 
            timestamp DESC
        LIMIT 10
    `;
    
    // 测试内容分类逻辑
    const contentCategorySql = `
        SELECT 
            page_url as url,
            CASE 
                WHEN page_url LIKE '%/article%' OR page_url LIKE '%/post%' OR page_url LIKE '%/blog%' THEN '文章'
                WHEN page_url LIKE '%/gallery%' OR page_url LIKE '%/photo%' OR page_url LIKE '%/image%' THEN '图库'
                WHEN page_url LIKE '%/diary%' OR page_url LIKE '%/journal%' THEN '日记'
                WHEN page_url LIKE '%/resource%' OR page_url LIKE '%/download%' OR page_url LIKE '%/files%' THEN '资源'
                WHEN page_url LIKE '%/index%' OR page_url = '/' OR page_url LIKE '%/home%' OR LENGTH(page_url) - LENGTH(REPLACE(page_url, '/', '')) <= 1 THEN '首页'
                ELSE '其他'
            END as category
        FROM 
            monitor_events
        WHERE 
            event_type = 'behavior' 
            AND event_name = 'route_change'
        LIMIT 20
    `;
    
    const [routeChangeSamples, categoryTests] = await Promise.all([
        db.query2(routeChangeSampleSql),
        db.query2(contentCategorySql)
    ]);
    
    // 获取实际的内容分布统计
    const contentDistribution = await exports.getContentDistribution(startTime, endTime);
    
    return {
        route_change_samples: routeChangeSamples,
        category_tests: categoryTests,
        content_distribution: contentDistribution
    };
};

// 获取访问统计数据（总访问量和今日访问量）
exports.getVisitStats = async () => {
    try {
        // 获取总访问量
        const totalVisitsSql = `
            SELECT COUNT(*) as total_visits
            FROM monitor_events
            WHERE event_type = 'behavior'
            AND event_name = 'page_view'
        `;
        
        // 使用正确的日期格式解析 moment 字段
        // 格式：'6/25/2025, 1:55:59 PM'
        const todayVisitsSql = `
            SELECT COUNT(*) as today_visits
            FROM monitor_events
            WHERE event_type = 'behavior'
            AND event_name = 'page_view'
            AND DATE(STR_TO_DATE(moment, '%c/%e/%Y, %l:%i:%s %p')) = CURDATE()
        `;
        
        const [totalResult, todayResult] = await Promise.all([
            db.query2(totalVisitsSql),
            db.query2(todayVisitsSql)
        ]);
        
        return {
            total_visits: totalResult[0]?.total_visits || 0,
            today_visits: todayResult[0]?.today_visits || 0
        };
    } catch (error) {
        console.error('获取访问统计数据失败:', error);
        throw error;
    }
};