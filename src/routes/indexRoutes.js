const express = require('express');
const router = express.Router();
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
 * @route GET /api/health
 * @description 健康检查端点
 * @access Public
 */
router.get('/api/health', async (req, res) => {
  try {
    const healthStatus = await healthCheck();
    res.json(healthStatus);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: '健康检查失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router; 