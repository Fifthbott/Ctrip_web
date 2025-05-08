/**
 * 健康检查工具 - 用于监控API状态
 */
const { sequelize } = require('../config/database');

/**
 * 检查数据库连接
 * @returns {Promise<boolean>} 连接状态
 */
const checkDatabaseConnection = async () => {
  try {
    await sequelize.authenticate();
    return true;
  } catch (error) {
    console.error('数据库连接测试失败:', error);
    return false;
  }
};

/**
 * 系统健康检查
 * @returns {Promise<Object>} 健康状态报告
 */
const healthCheck = async () => {
  const startTime = process.hrtime();
  
  // 检查数据库连接
  const dbStatus = await checkDatabaseConnection();
  
  // 计算响应时间
  const hrtime = process.hrtime(startTime);
  const responseTime = (hrtime[0] * 1000) + (hrtime[1] / 1000000);
  
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    memory: process.memoryUsage(),
    database: {
      connected: dbStatus
    },
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV,
    responseTime: `${responseTime.toFixed(2)}ms`
  };
};

module.exports = {
  healthCheck
}; 