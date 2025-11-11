const multer = require('multer');
const serve = require('../controller/server');
const path = require("path");
const jwt = require('../lib/jwt');
const express = require('express');
const router = express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        let name = '';
        const files = file.originalname.split('.')
        let type = '.' + files[files.length - 1];
        
        // 生成随机数函数
        function Random(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }
        
        name = Date.now() + Random(1, 1000) + type;
        cb(null, name);
    }
});

const upload = multer({ storage: storage });

router.post('/upload', upload.single('file'), (req, res) => {
    try {  
        // 检查token - 优先从headers中获取，兼容FormData上传
        const token = req.headers['authorization'] || req.body.token;
        if (!token) {
            return res.send({
                code: 400,
                message: 'token不存在'
            });
        }
        
        // 验证token
        let isok = jwt.verifyToken(token);
        if (!isok) {
            return res.send({
                code: 300,
                message: 'token验证失败'
            });
        }
        
        // 文件已经保存到了'upload/'目录下，并且'req.file'包含了文件的信息
        if (!req.file) {
            return res.send({
                code: 400,
                message: '没有接收到文件'
            });
        }
        
        let fileNameParts = req.file.originalname.split('.');
        
        let data = {
            url: req.file.filename,
            file_name: fileNameParts[0],
            format: fileNameParts[fileNameParts.length - 1],
            moment: new Date(),
        };
        
        serve.uploadFile(data, res);

    } catch (err) {
        res.send({
            code: 400,
            message: '文件上传失败'
        });
    }
});

module.exports = router;