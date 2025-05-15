const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  user_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '用户唯一标识'
  },
  username: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    comment: '用户名，唯一，不允许为空'
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '用户密码（加密存储）'
  },
  nickname: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    comment: '用户昵称，唯一，不允许为空'
  },
  avatar: {
    type: DataTypes.STRING(255),
    defaultValue: 'avatars/default_avatar.jpg',
    comment: '用户头像（URL），默认头像'
  },
  role: {
    type: DataTypes.ENUM('user', 'admin', 'reviewer'),
    allowNull: false,
    defaultValue: 'user',
    comment: '用户角色：普通用户、管理员、审核员'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'banned'),
    defaultValue: 'active',
    comment: '用户状态：活跃、非活跃、禁用'
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'username_index',
      fields: ['username']
    },
    {
      name: 'nickname_index',
      fields: ['nickname']
    }
  ],
  hooks: {
    beforeCreate: async (user) => {
      if (user.password_hash) {
        user.password_hash = await bcrypt.hash(user.password_hash, 10);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password_hash')) {
        user.password_hash = await bcrypt.hash(user.password_hash, 10);
      }
    }
  }
});

// 用于比较密码的实例方法
User.prototype.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password_hash);
};

module.exports = User; 