const { sequelize } = require('./database');
const models = require('../models');

/**
 * 初始化数据库
 * @param {boolean} syncModels - 是否同步模型（更新表结构）
 */
const initDatabase = async (syncModels = false) => {
  try {
    // 确保数据库连接正常
    await sequelize.authenticate();
    console.log('数据库连接成功');

    if (syncModels) {
      // 同步数据库表结构（非强制同步，只添加缺少的列，不删除或修改已有的列）
      console.log('正在同步表结构（非强制同步）...');
      await sequelize.sync({ alter: true });
      console.log('表结构同步完成');
    } else {
      // 跳过表结构同步步骤
      console.log('跳过表结构同步，使用已有的数据库表结构');
    }

    // 如果是开发环境，检查是否需要创建初始测试数据
    if (process.env.NODE_ENV === 'development') {
      await checkInitialData();
    }

    return true;
  } catch (error) {
    console.error('初始化数据库时出错:', error);
    return false;
  }
};

/**
 * 检查并创建初始测试数据（如果不存在）
 */
const checkInitialData = async () => {
  try {
    console.log('检查并创建初始测试数据');

    const { User } = models;

    // 检查是否已有管理员用户
    const adminExists = await User.findOne({
      where: { role: 'admin' }
    });

    // 如果没有管理员用户，创建默认管理员
    if (!adminExists) {
      await User.create({
        username: 'admin',
        password_hash: 'Admin123', // 会在模型的beforeCreate钩子中自动加密
        nickname: '系统管理员',
        role: 'admin',
        status: 'active'
      });
      console.log('默认管理员账户已创建');
    }

    // 检查是否已有审核员用户
    const reviewerExists = await User.findOne({
      where: { role: 'reviewer' }
    });

    // 如果没有审核员用户，创建默认审核员
    if (!reviewerExists) {
      await User.create({
        username: 'reviewer',
        password_hash: 'Reviewer123', // 会在模型的beforeCreate钩子中自动加密
        nickname: '内容审核员',
        role: 'reviewer',
        status: 'active'
      });
      console.log('默认审核员账户已创建');
    }

    // 检查是否已有普通用户
    const userExists = await User.findOne({
      where: { role: 'user' }
    });

    // 如果没有普通用户，创建默认用户
    if (!userExists) {
      await User.create({
        username: 'user',
        password_hash: 'User123456', // 会在模型的beforeCreate钩子中自动加密
        nickname: '测试用户',
        role: 'user',
        status: 'active'
      });
      console.log('默认测试用户已创建');
    }

    console.log('初始数据检查完成');
  } catch (error) {
    console.error('检查初始数据时出错:', error);
  }
};

module.exports = {
  initDatabase
}; 