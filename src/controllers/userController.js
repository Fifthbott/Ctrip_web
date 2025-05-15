const { User } = require('../models');
const { AppError } = require('../middleware/error');
const { generateToken } = require('../utils/jwt');
const { processAvatar } = require('../utils/mediaProcessor');
const path = require('path');
const fs = require('fs');

/**
 * 用户注册
 * @route POST /api/users/register
 */
exports.register = async (req, res, next) => {
  try {
    const { username, password, nickname,avatar } = req.body;
    
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
    let default_avatar = 'avatars/default_avatar.jpg'; // 默认头像
    let target_avatar = '';
    if(!avatar||avatar===''){
        target_avatar = default_avatar;
    }else{
        target_avatar = avatar;
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
    const processedFilename = await processAvatar(req.file);
    const avatarUrl = `avatars/${processedFilename}`;
    console.log('更新后的头像路径:', avatarUrl);

    // 判断是否为认证用户
    if (req.user && req.user.user_id) {
      const userId = req.user.user_id;

      // 查找用户
      const user = await User.findByPk(userId);
      if (!user) {
        return next(new AppError('用户不存在', 404));
      }

      // 删除旧头像文件（如果不是默认头像）
      if (user.avatar !== 'avatars/default_avatar.jpg') {
        try {
          // 构建完整的头像文件路径
          const UPLOAD_PATH = process.env.UPLOAD_PATH || 'src/uploads';
          const oldAvatarPath = path.join(process.cwd(), UPLOAD_PATH, user.avatar);
          
          console.log('尝试删除旧头像:', oldAvatarPath);
          if (fs.existsSync(oldAvatarPath)) {
            fs.unlinkSync(oldAvatarPath);
            console.log('成功删除旧头像');
          }
        } catch (error) {
          console.warn('删除旧头像失败:', error.message);
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