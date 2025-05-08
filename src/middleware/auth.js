const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { verifyToken } = require('../utils/jwt');

/**
 * 用户身份验证中间件
 * 验证请求中的JWT令牌并将用户信息附加到req对象
 */
const authenticate = async (req, res, next) => {
  try {
    // 获取Token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.error('未提供授权令牌', 401, 'AUTH_TOKEN_MISSING');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.error('无效的授权令牌格式', 401, 'INVALID_TOKEN_FORMAT');
    }

    // 验证Token
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.error('授权令牌无效或已过期', 401, 'INVALID_TOKEN');
    }

    console.log('decoded', decoded);
    // 查找用户
    const user = await User.findByPk(decoded.user_id, {
      attributes: ['user_id', 'username', 'nickname', 'avatar', 'role', 'status']
    });

    if (!user) {
      return res.error('用户不存在', 401, 'USER_NOT_FOUND');
    }

    if (user.status !== 'active') {
      return res.error('用户账号已被禁用', 403, 'USER_ACCOUNT_DISABLED');
    }

    // 将用户信息附加到请求对象
    req.user = user;
    next();
  } catch (err) {
    console.error('认证错误:', err);
    return res.error('认证失败', 401, 'AUTH_FAILED');
  }
};

/**
 * 可选的身份验证中间件
 * 如果请求包含有效的JWT令牌，则会附加用户信息，
 * 但如果令牌无效或不存在，请求将继续而不是返回错误
 */
const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return next();
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return next();
    }

    const user = await User.findByPk(decoded.user_id, {
      attributes: ['user_id', 'username', 'nickname', 'avatar', 'role', 'status']
    });

    if (user && user.status === 'active') {
      req.user = user;
    }

    next();
  } catch (err) {
    console.error('可选认证错误:', err);
    next();
  }
};

/**
 * 角色授权中间件 - 检查用户是否有特定角色
 * @param {string[]} roles - 允许访问的角色数组
 */
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.error('需要先进行身份验证', 401, 'AUTHENTICATION_REQUIRED');
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.error('没有访问权限', 403, 'INSUFFICIENT_PERMISSIONS');
    }

    next();
  };
};

module.exports = {
  authenticate,
  optionalAuthenticate,
  authorize
}; 