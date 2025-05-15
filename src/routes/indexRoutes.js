const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { healthCheck } = require('../utils/health');
// 引入缓存中间件
const { strongCache, conditionalRequest } = require('../middleware/cache');

/**
 * @route GET /
 * @description API根路径
 * @access Public
 */
router.get('/', (req, res) => {
  res.json({
    message: 'Ctrip Travel Diary API',
    version: '1.0.0',
    documentation: '/api/docs'
  });
});

/**
 * @route GET /api
 * @description API路径
 * @access Public
 */
router.get('/api', (req, res) => {
  res.json({
    message: 'Ctrip Travel Diary API',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      users: '/api/users',
      travelLogs: '/api/travel-logs',
      comments: '/api/comments',
      health: '/api/health'
    }
  });
});

/**
 * 服务器状态检查
 * @route GET /health
 */
router.get('/health', (req, res) => {
  healthCheck()
    .then(status => res.json(status))
    .catch(err => {
      console.error('健康检查失败:', err);
    res.status(500).json({
        status: 'error',
        message: '健康检查失败'
      });
    });
});

/**
 * 服务器状态检查 - API路径版本
 * @route GET /api/health
 */
router.get('/api/health', (req, res) => {
  healthCheck()
    .then(status => res.json(status))
    .catch(err => {
      console.error('健康检查失败:', err);
    res.status(500).json({
        status: 'error',
        message: '健康检查失败'
      });
    });
});

/**
 * 文件下载路由
 * @route GET /api/download/:type/:filename
 * @param {string} type - 文件类型（images, videos, avatars）
 * @param {string} filename - 文件名
 */
router.get('/api/download/:type/:filename', (req, res) => {
  const { type, filename } = req.params;
  
  // 验证文件类型
  const validTypes = ['images', 'videos', 'avatars'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({
      status: 'error',
      message: '无效的文件类型'
    });
  }
  
  // 验证文件名防止路径注入
  if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
    return res.status(400).json({
      status: 'error',
      message: '无效的文件名'
    });
  }
  
  // 构建文件路径
  const filePath = path.join(process.cwd(), 'src/uploads', type, filename);
  
  // 检查文件是否存在
  try {
    const stat = fs.statSync(filePath);
    
    // 生成ETag和Last-Modified用于条件请求
    const lastModified = stat.mtime.toUTCString();
    const etag = `W/"${stat.size.toString(16)}-${stat.mtime.getTime().toString(16)}"`;
    
    // 获取请求头
    const ifModifiedSince = req.headers['if-modified-since'];
    const ifNoneMatch = req.headers['if-none-match'];
    
    // 条件请求处理
    if ((ifNoneMatch && ifNoneMatch === etag) || 
        (ifModifiedSince && new Date(ifModifiedSince) >= new Date(lastModified))) {
      return res.status(304).end();
    }
    
    // 只设置ETag和Last-Modified，缓存控制由Nginx处理
    res.set({
      'Last-Modified': lastModified,
      'ETag': etag
    });
    
    // 设置内容类型
    const ext = path.extname(filename).substring(1).toLowerCase();
    const mimeTypes = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'svg': 'image/svg+xml'
    };
    
    if (mimeTypes[ext]) {
      res.set('Content-Type', mimeTypes[ext]);
    }
    
    // 发送文件
    res.sendFile(filePath);
  } catch (err) {
    console.error('文件访问错误:', err);
    res.status(404).json({
      status: 'error',
      message: '文件不存在'
    });
  }
});

module.exports = router; 