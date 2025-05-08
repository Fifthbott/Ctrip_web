const { Comment, TravelLog, User } = require('../models');
const { AppError } = require('../middleware/error');

/**
 * 创建评论
 * @route POST /api/comments
 */
exports.createComment = async (req, res, next) => {
  try {
    const { log_id, content } = req.body;
    const userId = req.user.user_id;

    // 检查游记是否存在且已审核通过
    const travelLog = await TravelLog.findOne({
      where: {
        log_id,
        status: 'approved'
      }
    });

    if (!travelLog) {
      return next(new AppError('游记不存在!', 404));
    }

    // 创建评论
    const comment = await Comment.create({
      log_id,
      user_id: userId,
      content
    });

    // 获取评论详情，包括用户信息
    const commentWithUser = await Comment.findByPk(comment.comment_id, {
      attributes: ['comment_id', 'content', 'created_at'],
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['user_id', 'nickname', 'avatar']
        }
      ]
    });

    // 返回创建的评论
    return res.created({ comment: commentWithUser }, '评论发布成功');
  } catch (error) {
    next(error);
  }
};

/**
 * 获取游记的评论列表
 * @route GET /api/travel-logs/:id/comments
 */
exports.getComments = async (req, res, next) => {
  try {
    const logId = req.params.id;
    
    // 分页参数
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

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

    // 查询评论列表
    const { count, rows: comments } = await Comment.findAndCountAll({
      where: { log_id: logId },
      attributes: ['comment_id', 'content', 'created_at'],
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['user_id', 'nickname', 'avatar']
        }
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    // 返回评论列表
    return res.paginate(comments, count, page, limit, '获取评论列表成功');
  } catch (error) {
    next(error);
  }
};

/**
 * 删除评论
 * @route DELETE /api/comments/:id
 */
exports.deleteComment = async (req, res, next) => {
  try {
    const commentId = req.params.id;
    const userId = req.user.user_id;

    // 查询评论
    const comment = await Comment.findByPk(commentId);
    
    if (!comment) {
      return next(new AppError('评论不存在', 404));
    }
    
    // 检查是否为评论作者或管理员
    if (comment.user_id !== userId && req.user.role !== 'admin') {
      return next(new AppError('无权删除此评论', 403));
    }

    // 删除评论
    await comment.destroy();

    // 返回成功消息
    return res.success(null, '评论删除成功');
  } catch (error) {
    next(error);
  }
}; 