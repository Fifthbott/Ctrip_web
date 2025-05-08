const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Comment = sequelize.define('Comment', {
  comment_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '评论唯一标识'
  },
  log_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '游记ID，外键关联 travel_logs'
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '用户ID，外键关联 users'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '评论内容'
  }
}, {
  tableName: 'comments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      name: 'log_id_index',
      fields: ['log_id']
    },
    {
      name: 'user_id_index',
      fields: ['user_id']
    }
  ]
});

module.exports = Comment; 