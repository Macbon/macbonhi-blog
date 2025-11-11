const jwt = require('jsonwebtoken');

const secret = 'kjhfauidsadkjh'

exports.generateToken = function (e) {
    let paylond = { id: e, time: new Date() };
    let token = jwt.sign(paylond, secret, { expiresIn: 60 * 60 * 24 * 30 })
    
    return token;
}

exports.verifyToken = function (token) {
    try {
        // 同步验证令牌
        const decoded = jwt.verify(token, secret);
        return true; // 验证成功
    } catch (err) {
        console.error('Token验证失败:', err.message);
        return false; // 验证失败
    }
}