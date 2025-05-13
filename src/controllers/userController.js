const { User } = require('../models');
const { AppError } = require('../middleware/error');
const { generateToken } = require('../utils/jwt');
const { getFileUrl } = require('../utils/fileUpload');
const { processAvatar } = require('../utils/mediaProcessor');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

/**
 * 用户注册
 * @route POST /api/users/register
 */
exports.register = async (req, res, next) => {
  try {
    const { username, password, nickname } = req.body;
    
    // 检查用户名是否已存在
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return next(new AppError('用户名已被使用', 400));
    }

    // 检查昵称是否已存在
    const existingNickname = await User.findOne({ where: { nickname } });
    if (existingNickname) {
      return next(new AppError('昵称已被使用', 400));
    }

    // 处理头像
    let avatar = 'default_avatar.jpg'; // 默认头像
    if (req.file) {
      try {
        // 使用媒体处理器压缩头像并转换为webp格式
        avatar = await processAvatar(req.file);
      } catch (error) {
        console.error('头像处理失败:', error);
        // 使用默认头像，继续注册流程
      }
    }

    // 创建新用户
    const user = await User.create({
      username,
      password_hash: password, // 密码将在模型钩子中加密
      nickname,
      avatar,
      role: 'user',
      status: 'active'
    });

    // 生成JWT令牌
    const token = generateToken({
      user_id: user.user_id,
      username: user.username,
      role: user.role
    });

    // 返回用户信息和令牌
    res.status(201).json({
      status: 'success',
      message: '注册成功',
      data: {
        user: {
          user_id: user.user_id,
          username: user.username,
          nickname: user.nickname,
          avatar: user.avatar,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    next(error);
  }
};

/**
 * 用户登录
 * @route POST /api/users/login
 */
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // 查找用户
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return next(new AppError('用户名或密码不正确', 401));
    }

    // 验证密码
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return next(new AppError('用户名或密码不正确', 401));
    }

    // 检查用户状态
    if (user.status !== 'active') {
      return next(new AppError('账户已被禁用或停用', 403));
    }

    // 生成JWT令牌
    const token = generateToken({
      user_id: user.user_id,
      username: user.username,
      role: user.role
    });

    // 返回用户信息和令牌
    res.status(200).json({
      status: 'success',
      message: '登录成功',
      data: {
        user: {
          user_id: user.user_id,
          username: user.username,
          nickname: user.nickname,
          avatar: user.avatar,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取当前用户信息
 * @route GET /api/users/me
 */
exports.getMe = async (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user
    }
  });
};

/**
 * 更新用户信息
 * @route PUT /api/users/me
 */
exports.updateMe = async (req, res, next) => {
  try {
    const { nickname, password } = req.body;
    const userId = req.user.user_id;

    // 查找用户
    const user = await User.findByPk(userId);
    if (!user) {
      return next(new AppError('用户不存在', 404));
    }

    // 如果要更新昵称，检查昵称是否已被其他用户使用
    if (nickname && nickname !== user.nickname) {
      const existingNickname = await User.findOne({ 
        where: { 
          nickname,
          user_id: { [require('sequelize').Op.ne]: userId } // 排除当前用户
        } 
      });
      
      if (existingNickname) {
        return next(new AppError('昵称已被使用', 400));
      }
    }

    // 更新用户信息
    if (nickname) user.nickname = nickname;
    if (password) user.password_hash = password;

    await user.save();

    // 返回更新后的用户信息
    res.status(200).json({
      status: 'success',
      message: '用户信息更新成功',
      data: {
        user: {
          user_id: user.user_id,
          username: user.username,
          nickname: user.nickname,
          avatar: user.avatar,
          role: user.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 更新用户头像
 * @route POST /api/users/me/avatar
 */
exports.updateAvatar = async (req, res, next) => {
  try {
    // 检查是否有文件上传
    if (!req.file) {
      return next(new AppError('未提供头像文件', 400));
    }

    // 使用媒体处理器压缩头像并转换为webp格式
    const avatarUrl = await processAvatar(req.file);

    // 判断是否为认证用户
    if (req.user && req.user.user_id) {
      const userId = req.user.user_id;

      // 查找用户
      const user = await User.findByPk(userId);
      if (!user) {
        return next(new AppError('用户不存在', 404));
      }

      // 删除旧头像文件（如果不是默认头像）
      if (user.avatar !== 'default_avatar.jpg' && user.avatar.startsWith('/uploads/')) {
        try {
          const oldAvatarPath = path.join(process.cwd(), user.avatar.substring(1));
          if (fs.existsSync(oldAvatarPath)) {
            fs.unlinkSync(oldAvatarPath);
          }
        } catch (error) {
          // 继续更新，不阻断流程
        }
      }

      // 更新用户头像
      user.avatar = avatarUrl;
      await user.save();
    }

    // 返回上传成功信息 - 无论是否登录
    res.status(200).json({
      status: 'success',
      message: '头像上传成功',
      data: {
        avatar: avatarUrl
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取用户列表（仅管理员）
 * @route GET /api/users
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    // 分页参数
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // 查询用户列表
    const { count, rows: users } = await User.findAndCountAll({
      attributes: ['user_id', 'username', 'nickname', 'avatar', 'role', 'status', 'created_at'],
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    // 返回用户列表
    res.status(200).json({
      status: 'success',
      data: {
        users,
        pagination: {
          total: count,
          page,
          limit,
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
}; 