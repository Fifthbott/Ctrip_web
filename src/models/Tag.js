const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Tag = sequelize.define('Tag', {
  tag_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '标签唯一标识'
  },
  tag_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: '标签名称'
  }
}, {
  tableName: 'tags',
  timestamps: false,
  indexes: [
    {
      name: 'tag_name_index',
      fields: ['tag_name']
    }
  ]
});

module.exports = Tag; 