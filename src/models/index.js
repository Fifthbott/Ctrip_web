const User = require('./User');
const TravelLog = require('./TravelLog');
const TravelLogAudit = require('./TravelLogAudit');
const Comment = require('./Comment');
const Tag = require('./Tag');
const TravelLogTag = require('./TravelLogTag');
const Like = require('./Like');
const Favorite = require('./Favorite');
const { sequelize } = require('../config/database');

//建立表之间的关联关系
User.hasMany(TravelLog, {
  foreignKey: {
    name: 'user_id',
    allowNull: false
  },
  sourceKey: 'user_id',
  as: 'travelLogs',
  onDelete: 'CASCADE'
});
TravelLog.belongsTo(User, {
  foreignKey: {
    name: 'user_id',
    allowNull: false
  },
  targetKey: 'user_id',
  as: 'author'
});

// 用户拥有多条评论
User.hasMany(Comment, {
  foreignKey: {
    name: 'user_id',
    allowNull: false
  },
  sourceKey: 'user_id',
  as: 'comments',
  onDelete: 'CASCADE'
});
Comment.belongsTo(User, {
  foreignKey: {
    name: 'user_id',
    allowNull: false
  },
  targetKey: 'user_id',
  as: 'author'
});

// 游记拥有多条评论
TravelLog.hasMany(Comment, {
  foreignKey: {
    name: 'log_id',
    allowNull: false
  },
  sourceKey: 'log_id',
  as: 'comments',
  onDelete: 'CASCADE'
});
Comment.belongsTo(TravelLog, {
  foreignKey: {
    name: 'log_id',
    allowNull: false
  },
  targetKey: 'log_id',
  as: 'travelLog'
});

// 游记拥有多条审核记录
TravelLog.hasMany(TravelLogAudit, {
  foreignKey: {
    name: 'log_id',
    allowNull: false
  },
  sourceKey: 'log_id',
  as: 'auditRecords',
  onDelete: 'CASCADE'
});
TravelLogAudit.belongsTo(TravelLog, {
  foreignKey: {
    name: 'log_id',
    allowNull: false
  },
  targetKey: 'log_id',
  as: 'travelLog'
});

// 用户（审核员）拥有多条审核记录
User.hasMany(TravelLogAudit, {
  foreignKey: {
    name: 'reviewer_id',
    allowNull: false
  },
  sourceKey: 'user_id',
  as: 'auditRecords'
});
TravelLogAudit.belongsTo(User, {
  foreignKey: {
    name: 'reviewer_id',
    allowNull: false
  },
  targetKey: 'user_id',
  as: 'reviewer'
});

// 游记和标签通过TravelLogTag表建立多对多关系
TravelLog.belongsToMany(Tag, {
  through: TravelLogTag,
  foreignKey: {
    name: 'log_id',
    allowNull: false
  },
  otherKey: {
    name: 'tag_id',
    allowNull: false
  },
  as: 'tags',
  onDelete: 'CASCADE'
});
Tag.belongsToMany(TravelLog, {
  through: TravelLogTag,
  foreignKey: {
    name: 'tag_id',
    allowNull: false
  },
  otherKey: {
    name: 'log_id',
    allowNull: false
  },
  as: 'travelLogs',
  onDelete: 'CASCADE'
});

// 用户拥有多个点赞记录
User.hasMany(Like, {
  foreignKey: {
    name: 'user_id',
    allowNull: false
  },
  sourceKey: 'user_id',
  as: 'likes',
  onDelete: 'CASCADE'
});
Like.belongsTo(User, {
  foreignKey: {
    name: 'user_id',
    allowNull: false
  },
  targetKey: 'user_id',
  as: 'user'
});

// 游记拥有多个点赞记录
TravelLog.hasMany(Like, {
  foreignKey: {
    name: 'log_id',
    allowNull: false
  },
  sourceKey: 'log_id',
  as: 'likes',
  onDelete: 'CASCADE'
});
Like.belongsTo(TravelLog, {
  foreignKey: {
    name: 'log_id',
    allowNull: false
  },
  targetKey: 'log_id',
  as: 'travelLog'
});

// 用户拥有多个收藏记录
User.hasMany(Favorite, {
  foreignKey: {
    name: 'user_id',
    allowNull: false
  },
  sourceKey: 'user_id',
  as: 'favorites',
  onDelete: 'CASCADE'
});
Favorite.belongsTo(User, {
  foreignKey: {
    name: 'user_id',
    allowNull: false
  },
  targetKey: 'user_id',
  as: 'user'
});

// 游记拥有多个收藏记录
TravelLog.hasMany(Favorite, {
  foreignKey: {
    name: 'log_id',
    allowNull: false
  },
  sourceKey: 'log_id',
  as: 'favorites',
  onDelete: 'CASCADE'
});
Favorite.belongsTo(TravelLog, {
  foreignKey: {
    name: 'log_id',
    allowNull: false
  },
  targetKey: 'log_id',
  as: 'travelLog'
});

// 定义钩子函数实现触发器功能
// 新增评论时更新评论数
Comment.addHook('afterCreate', async (comment) => {
  await TravelLog.increment('comment_count', {
    where: { log_id: comment.log_id }
  });
});

// 新增点赞时更新点赞数
Like.addHook('afterCreate', async (like) => {
  await TravelLog.increment('like_count', {
    where: { log_id: like.log_id }
  });
});

// 新增收藏时更新收藏数
Favorite.addHook('afterCreate', async (favorite) => {
  await TravelLog.increment('favorite_count', {
    where: { log_id: favorite.log_id }
  });
});

// 删除记录时减少相应计数
Comment.addHook('afterDestroy', async (comment) => {
  await TravelLog.decrement('comment_count', {
    where: { log_id: comment.log_id }
  });
});

Like.addHook('afterDestroy', async (like) => {
  await TravelLog.decrement('like_count', {
    where: { log_id: like.log_id }
  });
});

Favorite.addHook('afterDestroy', async (favorite) => {
  await TravelLog.decrement('favorite_count', {
    where: { log_id: favorite.log_id }
  });
});

// 导出模型
module.exports = {
  sequelize,
  User,
  TravelLog,
  TravelLogAudit,
  Comment,
  Tag,
  TravelLogTag,
  Like,
  Favorite
}; 