require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USERNAME || 'user1',
    password: process.env.DB_PASSWORD || 'qwe123',
    database: process.env.DB_NAME || 'Ctrip',
    host: process.env.DB_HOST || '101.43.95.173',
    dialect: 'mysql',

  },
  production: {
    username: process.env.DB_USERNAME || 'user1',
    password: process.env.DB_PASSWORD || 'qwe123',
    database: process.env.DB_NAME || 'Ctrip',
    host: process.env.DB_HOST || '101.43.95.173',
    dialect: 'mysql',
    logging: true,
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
}; 