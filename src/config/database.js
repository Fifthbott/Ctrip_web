const { Sequelize } = require('sequelize');
const config = require('./config')[process.env.NODE_ENV || 'development'];

// 创建Sequelize实例
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    logging: config.logging,
    pool: config.pool
    
  }
);

// 测试数据库连接的函数
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('数据库连接已成功建立。');
    return true;
  } catch (error) {
    console.error('无法连接到数据库:', error);
    return false;
  }
};

module.exports = {
  sequelize,
  testConnection
}; 