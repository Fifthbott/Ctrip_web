const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');

/**
 * 自定义错误类
 */
class AppError extends Error {
  constructor(message, statusCode, errorCode = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 验证失败后清理已上传的文件
 */
const cleanupUploadedFiles = (req) => {
  // 检查并清理上传的文件
  if (req.file) {
    console.log('验证失败，清理上传的文件:', req.file.path);
    
    try {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
        console.log('成功删除文件:', req.file.path);
      }
    } catch (err) {
      console.error('删除文件失败:', err);
    }
  }
  
  // 处理多文件上传
  if (req.files && Array.isArray(req.files)) {
    req.files.forEach(file => {
      try {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
          console.log('成功删除文件:', file.path);
        }
      } catch (err) {
        console.error('删除文件失败:', err);
      }
    });
  }
  
  // 处理多字段文件上传
  if (req.files && typeof req.files === 'object') {
    Object.keys(req.files).forEach(key => {
      const files = req.files[key];
      if (Array.isArray(files)) {
        files.forEach(file => {
          try {
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
              console.log('成功删除文件:', file.path);
            }
          } catch (err) {
            console.error('删除文件失败:', err);
          }
        });
      }
    });
  }
};

/**
 * 请求验证错误处理
 * 处理express-validator中间件验证失败的情况
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // 打印详细信息帮助调试
    console.log('验证错误:', JSON.stringify(errors.array()));
    console.log('请求体:', JSON.stringify(req.body));
    
    // 如果验证失败，清理已上传的文件
    cleanupUploadedFiles(req);
    
    // 简化错误消息，只返回消息不返回字段
    const errorDetails = errors.array().map(err => ({
      message: err.msg
    }));
    
    return res.error('请求数据验证失败', 400, 'VALIDATION_ERROR', errorDetails);
  }
  next();
};

/**
 * 404错误处理程序
 */
const notFoundHandler = (req, res) => {
  return res.error(`找不到URL: ${req.originalUrl}`, 404, 'NOT_FOUND');
};

/**
 * 全局错误处理程序
 */
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  
  // 如果是验证错误，清理已上传的文件
  if (err.statusCode === 400) {
    cleanupUploadedFiles(req);
  }
  
  // 记录所有错误
  console.error('错误:', {
    url: req.url,
    method: req.method,
    body: req.body,
    message: err.message,
    stack: err.stack
  });
  
  // 开发环境返回详细错误信息
  if (process.env.NODE_ENV === 'development') {
    const errorDetails = {
      error: err,
      stack: err.stack
    };
    
    return res.error(err.message, err.statusCode, err.errorCode, errorDetails);
  }
  
  // 生产环境
  // 如果是程序预期的错误，向客户端返回错误消息
  if (err.isOperational) {
    return res.error(err.message, err.statusCode, err.errorCode);
  }
  
  // 对于未预期的错误，返回通用错误消息
  return res.error('服务器内部错误', 500, 'INTERNAL_SERVER_ERROR');
};

module.exports = {
  AppError,
  handleValidationErrors,
  notFoundHandler,
  errorHandler
}; 