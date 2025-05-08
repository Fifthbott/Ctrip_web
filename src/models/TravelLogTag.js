const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TravelLogTag = sequelize.define('TravelLogTag', {
  log_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    comment: '游记ID，外键关联 travel_logs'
  },
  tag_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    comment: '标签ID，外键关联 tags'
  }
}, {
  tableName: 'travel_log_tags',
  timestamps: false
});

module.exports = TravelLogTag; 