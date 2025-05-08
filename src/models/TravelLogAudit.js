const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TravelLogAudit = sequelize.define('TravelLogAudit', {
  audit_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '审核记录唯一标识'
  },
  log_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '游记ID，外键关联 travel_logs'
  },
  reviewer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '审核员ID，外键关联 users'
  },
  audit_status: {
    type: DataTypes.ENUM('approved', 'rejected'),
    allowNull: false,
    comment: '审核状态：通过、拒绝'
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '审核拒绝的原因'
  }
}, {
  tableName: 'travel_logs_audit',
  timestamps: true,
  createdAt: 'audit_time',
  updatedAt: false,
  indexes: [
    {
      name: 'log_id_index',
      fields: ['log_id']
    },
    {
      name: 'reviewer_id_index',
      fields: ['reviewer_id']
    }
  ]
});

module.exports = TravelLogAudit; 