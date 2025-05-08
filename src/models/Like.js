const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Like = sequelize.define('Like', {
  like_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '点赞记录唯一标识'
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '用户ID，外键关联 users'
  },
  log_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '游记ID，外键关联 travel_logs'
  }
}, {
  tableName: 'likes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      name: 'user_log_index',
      fields: ['user_id', 'log_id'],
      unique: true
    }
  ]
});

module.exports = Like; 