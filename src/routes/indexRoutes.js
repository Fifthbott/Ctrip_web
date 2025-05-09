const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { healthCheck } = require('../utils/health');

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
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      status: 'error',
      message: '文件不存在'
    });
  }
  
  // 发送文件
  res.download(filePath, filename, (err) => {
    if (err) {
      console.error('文件下载错误:', err);
      // 如果头信息已发送，则无法发送错误响应
      if (!res.headersSent) {
        res.status(500).json({
          status: 'error',
          message: '文件下载失败'
        });
      }
    }
  });
});

module.exports = router; 