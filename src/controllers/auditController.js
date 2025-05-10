const { TravelLog, TravelLogAudit, User } = require('../models');
const { AppError } = require('../middleware/error');

/**
 * 获取待审核游记列表
 * @route GET /api/audit/travel-logs
 */
exports.getAuditTravelLogs = async (req, res, next) => {
  try {
    // 分页参数
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // 状态过滤
    const status = req.query.status || 'pending';
    const whereConditions = {};
    
    if (status && ['pending', 'approved', 'rejected', 'all'].includes(status)) {
      if (status !== 'all') {
        whereConditions.status = status;
      }
    } else {
      whereConditions.status = 'pending';
    }

    // 查询游记列表 - 使用原始SQL而不是复杂的关联查询
    const { count, rows: travelLogs } = await TravelLog.findAndCountAll({
      where: whereConditions,
      attributes: [
        'log_id', 'title', 'content', 'image_urls', 'cover_url', 'status', 'like_count'
      ],
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['user_id', 'nickname', 'avatar']
        }
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']],
      distinct: true // 确保count计算正确
    });
    
    // 单独查询审核记录，避免复杂的嵌套关联
    if (travelLogs.length > 0) {
      const logIds = travelLogs.map(log => log.log_id);
      
      // 查询相关的审核记录
      const auditRecords = await TravelLogAudit.findAll({
        where: { log_id: logIds },
        attributes: ['audit_id', 'log_id', 'audit_status', 'reason', 'audit_time', 'reviewer_id'],
        order: [['audit_time', 'DESC']]
      });
      
      // 查询相关的审核员
      const reviewerIds = auditRecords.map(record => record.reviewer_id);
      const reviewers = reviewerIds.length > 0 ? 
        await User.findAll({
          where: { user_id: reviewerIds },
          attributes: ['user_id', 'nickname']
        }) : [];
      
      // 将审核记录和审核员添加到游记中
      for (const log of travelLogs) {
        // 找到当前游记的所有审核记录
        const records = auditRecords.filter(record => record.log_id === log.log_id);
        
        // 添加审核员信息到每个审核记录
        const recordsWithReviewer = records.map(record => {
          const reviewer = reviewers.find(r => r.user_id === record.reviewer_id);
          return {
            ...record.toJSON(),
            reviewer: reviewer || null
          };
        });
        
        // 添加审核记录到游记
        log.setDataValue('auditRecords', recordsWithReviewer);
      }
    }

    // 处理返回数据，只保留第一张图片
    const simplifiedTravelLogs = travelLogs.map(log => {
      const plainLog = log.get({ plain: true });
      
      // 提取第一张图片URL（如果存在）
      let firstImageUrl = null;
      if (plainLog.image_urls && plainLog.image_urls.length > 0) {
        firstImageUrl = plainLog.image_urls[0];
      }
      
      // 返回简化的游记信息
      return {
        log_id: plainLog.log_id,
        title: plainLog.title,
        first_image_url: firstImageUrl,
        cover_url: plainLog.cover_url,
        status: plainLog.status,
        like_count: plainLog.like_count,
        author: plainLog.author,
        auditRecords: plainLog.auditRecords
      };
    });

    // 返回游记列表
    res.status(200).json({
      status: 'success',
      data: {
        travel_logs: simplifiedTravelLogs,
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

/**
 * 获取单个游记详情（用于审核）
 * @route GET /api/audit/travel-logs/:id
 */
exports.getAuditTravelLog = async (req, res, next) => {
  try {
    const logId = req.params.id;

    // 查询游记 - 不使用嵌套关联
    const travelLog = await TravelLog.findByPk(logId, {
      attributes: [
        'log_id', 'title', 'content', 'image_urls', 'video_url', 'cover_url',
        'status', 'created_at', 'updated_at', 'comment_count', 'like_count', 'favorite_count'
      ],
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['user_id', 'nickname', 'avatar']
        }
      ]
    });

    if (!travelLog) {
      return next(new AppError('游记不存在', 404));
    }
    
    // 单独查询审核记录
    const auditRecords = await TravelLogAudit.findAll({
      where: { log_id: logId },
      attributes: ['audit_id', 'audit_status', 'reason', 'audit_time', 'reviewer_id'],
      order: [['audit_time', 'DESC']]
    });
    
    // 查询审核员信息
    if (auditRecords.length > 0) {
      const reviewerIds = auditRecords.map(record => record.reviewer_id);
      const reviewers = await User.findAll({
        where: { user_id: reviewerIds },
        attributes: ['user_id', 'nickname']
      });
      
      // 添加审核员信息到审核记录
      const recordsWithReviewer = auditRecords.map(record => {
        const reviewer = reviewers.find(r => r.user_id === record.reviewer_id);
        return {
          ...record.toJSON(),
          reviewer: reviewer || null
        };
      });
      
      // 添加审核记录到游记
      travelLog.setDataValue('auditRecords', recordsWithReviewer);
    } else {
      travelLog.setDataValue('auditRecords', []);
    }

    // 返回游记详情
    res.status(200).json({
      status: 'success',
      data: {
        travel_log: travelLog
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 审核游记
 * @route POST /api/audit/travel-logs/:id
 */
exports.auditTravelLog = async (req, res, next) => {
  try {
    const logId = req.params.id;
    const reviewerId = req.user.user_id;
    const { audit_status, reason } = req.body;

    // 查询游记
    const travelLog = await TravelLog.findByPk(logId);
    
    if (!travelLog) {
      return next(new AppError('游记不存在', 404));
    }
    
    // 只有待审核的游记可以进行审核
    if (travelLog.status !== 'pending') {
      return next(new AppError('只有待审核的游记可以进行审核', 400));
    }
    
    // 检查用户是否有审核权限
    if (!['admin', 'reviewer'].includes(req.user.role)) {
      return next(new AppError('没有执行审核操作的权限', 403));
    }

    // 更新游记状态
    travelLog.status = audit_status;
    await travelLog.save();

    // 创建审核记录
    await TravelLogAudit.create({
      log_id: logId,
      reviewer_id: reviewerId,
      audit_status,
      reason: audit_status === 'rejected' ? reason : null
    });

    // 返回成功消息
    res.status(200).json({
      status: 'success',
      message: audit_status === 'approved' ? '游记审核通过' : '游记审核拒绝',
      data: {
        travel_log: {
          log_id: travelLog.log_id,
          status: travelLog.status
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 删除游记（仅管理员）
 * @route DELETE /api/audit/travel-logs/:id
 */
exports.deleteTravelLog = async (req, res, next) => {
  try {
    const logId = req.params.id;

    // 查询游记
    const travelLog = await TravelLog.findByPk(logId);
    
    if (!travelLog) {
      return next(new AppError('游记不存在', 404));
    }
    
    // 检查用户是否有删除权限
    if (req.user.role !== 'admin') {
      return next(new AppError('只有管理员可以删除游记', 403));
    }

    // 删除游记（软删除）
    await travelLog.destroy();

    // 返回成功消息
    res.status(200).json({
      status: 'success',
      message: '游记删除成功'
    });
  } catch (error) {
    next(error);
  }
}; 