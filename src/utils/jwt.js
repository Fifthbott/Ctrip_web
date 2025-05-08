const jwt = require('jsonwebtoken');

// 从环境变量获取密钥
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * 生成JWT令牌
 * @param {Object} payload - 要编码进令牌的数据
 * @returns {string} JWT令牌
 */
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * 验证JWT令牌
 * @param {string} token - 要验证的JWT令牌
 * @returns {Object|null} 解码后的数据或null（如果验证失败）
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('JWT验证失败:', error.message);
    return null;
  }
};

/**
 * 从请求头中提取令牌
 * @param {Object} req - Express请求对象
 * @returns {string|null} 提取的令牌或null
 */
const extractTokenFromHeader = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
};

module.exports = {
  generateToken,
  verifyToken,
  extractTokenFromHeader
}; 