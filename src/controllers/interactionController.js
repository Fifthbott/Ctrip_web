const { Like, Favorite, TravelLog, User } = require('../models');
const { AppError } = require('../middleware/error');

/**
 * 点赞游记
 * @route POST /api/travel-logs/:id/like
 */
exports.likeTravelLog = async (req, res, next) => {
  try {
    const logId = req.params.id;
    const userId = req.user.user_id;

    // 检查游记是否存在且已审核通过
    const travelLog = await TravelLog.findOne({
      where: {
        log_id: logId,
        status: 'approved'
      }
    });

    if (!travelLog) {
      return next(new AppError('游记不存在或未通过审核', 404));
    }

    // 检查是否已点赞
    const existingLike = await Like.findOne({
      where: {
        log_id: logId,
        user_id: userId
      }
    });

    if (existingLike) {
      return next(new AppError('已经点赞过此游记', 400));
    }

    // 创建点赞记录
    await Like.create({
      log_id: logId,
      user_id: userId
    });

    // 返回成功消息
    res.status(200).json({
      status: 'success',
      message: '点赞成功',
      data: {
        like_count: travelLog.like_count + 1
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 取消点赞游记
 * @route DELETE /api/travel-logs/:id/like
 */
exports.unlikeTravelLog = async (req, res, next) => {
  try {
    const logId = req.params.id;
    const userId = req.user.user_id;

    // 检查游记是否存在且已审核通过
    const travelLog = await TravelLog.findOne({
      where: {
        log_id: logId,
        status: 'approved'
      }
    });

    if (!travelLog) {
      return next(new AppError('游记不存在或未通过审核', 404));
    }

    // 检查是否已点赞
    const existingLike = await Like.findOne({
      where: {
        log_id: logId,
        user_id: userId
      }
    });

    if (!existingLike) {
      return next(new AppError('尚未点赞此游记', 400));
    }

    // 删除点赞记录
    await existingLike.destroy();

    // 返回成功消息
    res.status(200).json({
      status: 'success',
      message: '取消点赞成功',
      data: {
        like_count: Math.max(0, travelLog.like_count - 1)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 收藏游记
 * @route POST /api/travel-logs/:id/favorite
 */
exports.favoriteTravelLog = async (req, res, next) => {
  try {
    const logId = req.params.id;
    const userId = req.user.user_id;

    // 检查游记是否存在且已审核通过
    const travelLog = await TravelLog.findOne({
      where: {
        log_id: logId,
        status: 'approved'
      }
    });

    if (!travelLog) {
      return next(new AppError('游记不存在或未通过审核', 404));
    }

    // 检查是否已收藏
    const existingFavorite = await Favorite.findOne({
      where: {
        log_id: logId,
        user_id: userId
      }
    });

    if (existingFavorite) {
      return next(new AppError('已经收藏过此游记', 400));
    }

    // 创建收藏记录
    await Favorite.create({
      log_id: logId,
      user_id: userId
    });

    // 返回成功消息
    res.status(200).json({
      status: 'success',
      message: '收藏成功',
      data: {
        favorite_count: travelLog.favorite_count + 1
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 取消收藏游记
 * @route DELETE /api/travel-logs/:id/favorite
 */
exports.unfavoriteTravelLog = async (req, res, next) => {
  try {
    const logId = req.params.id;
    const userId = req.user.user_id;

    // 检查游记是否存在且已审核通过
    const travelLog = await TravelLog.findOne({
      where: {
        log_id: logId,
        status: 'approved'
      }
    });

    if (!travelLog) {
      return next(new AppError('游记不存在或未通过审核', 404));
    }

    // 检查是否已收藏
    const existingFavorite = await Favorite.findOne({
      where: {
        log_id: logId,
        user_id: userId
      }
    });

    if (!existingFavorite) {
      return next(new AppError('尚未收藏此游记', 400));
    }

    // 删除收藏记录
    await existingFavorite.destroy();

    // 返回成功消息
    res.status(200).json({
      status: 'success',
      message: '取消收藏成功',
      data: {
        favorite_count: Math.max(0, travelLog.favorite_count - 1)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取用户收藏的游记列表
 * @route GET /api/users/me/favorites
 */
exports.getUserFavorites = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    
    // 分页参数
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // 查询用户收藏的游记
    const { count, rows: favorites } = await Favorite.findAndCountAll({
      where: { user_id: userId },
      attributes: ['favorite_id', 'created_at'],
      include: [
        {
          model: TravelLog,
          as: 'travelLog',
          attributes: [
            'log_id', 'title', 'content', 'image_urls', 'video_url',
            'created_at', 'comment_count', 'like_count', 'favorite_count'
          ],
          include: [
            {
              model: User,
              as: 'author',
              attributes: ['user_id', 'nickname', 'avatar']
            }
          ]
        }
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    // 返回收藏列表
    res.status(200).json({
      status: 'success',
      data: {
        favorites,
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