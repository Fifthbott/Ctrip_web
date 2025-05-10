const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TravelLog = sequelize.define('TravelLog', {
  log_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '游记唯一标识'
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '用户ID，外键关联 users'
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '游记标题'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '游记内容'
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
    comment: '审核状态：待审核、已通过、未通过'
  },
  image_urls: {
    type: DataTypes.JSON,
    comment: '游记图片URL数组，支持多个图片'
  },
  video_url: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '游记视频URL（可选）'
  },
  cover_url: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '视频封面URL（可选）'
  },
  thumbnail_url: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '视频缩略图URL（当有视频时使用）'
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '游记删除时间，逻辑删除'
  },
  comment_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '评论数，初始化为0'
  },
  like_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '点赞数，初始化为0'
  },
  favorite_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '收藏数，初始化为0'
  }
}, {
  tableName: 'travel_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  paranoid: true,
  deletedAt: 'deleted_at',
  indexes: [
    {
      name: 'user_id_index',
      fields: ['user_id']
    },
    {
      name: 'status_index',
      fields: ['status']
    },
    {
      name: 'created_at_index',
      fields: ['created_at']
    },
    {
      name: 'user_status_index',
      fields: ['user_id', 'status']
    }
  ],
  scopes: {
    approved: {
      where: {
        status: 'approved',
        deleted_at: null
      }
    },
    pending: {
      where: {
        status: 'pending',
        deleted_at: null
      }
    },
    rejected: {
      where: {
        status: 'rejected',
        deleted_at: null
      }
    }
  }
});

module.exports = TravelLog;