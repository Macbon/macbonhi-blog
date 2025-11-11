const fs = require('fs');
const path = require('path');
const fsp = require('fs').promises;

//删除文件
exports.delteFiles = function (url) {
    // 处理路径格式
    const processPath = (path) => {

        if (path.includes('http://') || path.includes('https://')) {
            try {
                // 提取URL中的文件名部分
                const fileName = path.substring(path.lastIndexOf('/') + 1);
                return fileName;
            } catch (e) {
                return path; // 返回原始路径作为备选
            }
        }
        // 如果是相对路径（如/uploads/file.jpg），提取文件名
        if (path.startsWith('/uploads/')) {
            const fileName = path.substring('/uploads/'.length);
            return fileName;
        }
        // 如果只是以/开头，去掉前导斜杠
        if (path.startsWith('/')) {
            return path.substring(1);
        }
        return path;
    };

    if (typeof url === 'string') {
        const filePath = processPath(url);

        fs.unlink(filePath, (err) => {
            if (err) {
                // 尝试在uploads目录查找
                const uploadsPath = path.join('uploads', filePath);
                fs.unlink(uploadsPath, (err2) => {
                });
            } 
        });
    } 
}

exports.getFilesSize = async function (directory){
    let size = 0;

    async function calculateSize(dir) {
        for await (const d of await fsp.readdir(dir, { withFileTypes: true })) {
            const currentPath = path.join(dir, d.name);
            if (d.isDirectory()) {
                await calculateSize(currentPath);
            } else {
                size += (await fsp.stat(currentPath)).size
            }
        }
    }

    await calculateSize(directory);
    return size;
}




