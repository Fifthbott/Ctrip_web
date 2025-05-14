const { Op } = require('sequelize');
const { TravelLog, User, Comment, Tag, Like, Favorite, TravelLogAudit } = require('../models');
const { AppError } = require('../middleware/error');
const { getFileUrl } = require('../utils/fileUpload');
const { success, paginate, created } = require('../utils/response');
const { processImage, processVideo, getVideoProcessProgress } = require('../utils/mediaProcessor');

/**
 * 创建新游记
 * @route POST /api/travel-logs
 */
exports.createTravelLog = async (req, res, next) => {
  try {
    const { title, content, image_urls, video_url, cover_url, tags } = req.body;
    const userId = req.user.user_id;

    // 创建游记
    const travelLog = await TravelLog.create({
      user_id: userId,
      title,
      content,
      image_urls: image_urls || [],
      video_url: video_url || null,
      cover_url: cover_url || null,
      status: 'pending' // 默认状态为待审核
    });

    // 如果有标签，则添加关联
    if (tags && tags.length > 0) {
      // 查找或创建标签
      const tagInstances = await Promise.all(
        tags.map(async (tagName) => {
          const [tag] = await Tag.findOrCreate({
            where: { tag_name: tagName.trim().toLowerCase() }
          });
          return tag;
        })
      );

      // 添加标签关联
      await travelLog.setTags(tagInstances);
    }

    // 返回创建的游记
    return res.created({
      travel_log: {
        log_id: travelLog.log_id,
        title: travelLog.title,
        status: travelLog.status,
        created_at: travelLog.created_at
      }
    }, '游记创建成功，等待审核');
  } catch (error) {
    next(error);
  }
};

/**
 * 获取游记列表（公开的，已审核通过的）
 * @route GET /api/travel-logs
 */
exports.getTravelLogs = async (req, res, next) => {
  try {
    // 分页参数
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // 搜索参数
    const search = req.query.search || '';
    
    // 定义基本查询条件
    const baseConditions = {
      status: 'approved',  // 只获取已审核通过的游记
      deleted_at: null     // 不包括已删除的游记
    };
    
    // 准备查询参数
    let queryOptions = {
      attributes: [
        'log_id', 'title', 'content', 'image_urls', 'video_url', 'cover_url',
        'created_at', 'updated_at', 'status', 'comment_count', 'like_count', 'favorite_count'
      ],
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['user_id', 'nickname', 'avatar'],
        },
        {
          model: Tag,
          as: 'tags',
          attributes: ['tag_id', 'tag_name'],
          through: { attributes: [] }
        }
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']],
      distinct: true, // 确保count计算正确
      subQuery: false // 避免Sequelize创建复杂的子查询
    };

    // 如果有搜索内容
    if (search) {
      // 查询匹配nickname的用户
      const matchingUsers = await User.findAll({
        where: { nickname: { [Op.like]: `%${search}%` } },
        attributes: ['user_id']
      });
      
      const userIds = matchingUsers.map(user => user.user_id);
      
      // 创建复合查询条件：标题或内容包含搜索词，或者作者ID在匹配列表中
      queryOptions.where = {
        ...baseConditions,
        [Op.or]: [
          { title: { [Op.like]: `%${search}%` } },
          { content: { [Op.like]: `%${search}%` } },
          { user_id: { [Op.in]: userIds } }
        ]
      };
    } else {
      // 没有搜索内容时使用基本条件
      queryOptions.where = baseConditions;
    }

    // 查询游记列表
    const { count, rows: travelLogs } = await TravelLog.findAndCountAll(queryOptions);
    
    // 处理返回数据
    const simplifiedTravelLogs = travelLogs.map(log => {
      const plainLog = log.get({ plain: true });
      
      // 返回游记信息，保留原始数据格式
      return {
        log_id: plainLog.log_id,
        title: plainLog.title,
        content: plainLog.content,
        image_urls: plainLog.image_urls,
        video_url: plainLog.video_url,
        cover_url: plainLog.cover_url,
        status: plainLog.status,
        created_at: plainLog.created_at,
        updated_at: plainLog.updated_at,
        comment_count: plainLog.comment_count,
        like_count: plainLog.like_count,
        favorite_count: plainLog.favorite_count,
        tags: plainLog.tags || [],
        author: plainLog.author ? {
          user_id: plainLog.author.user_id,
          nickname: plainLog.author.nickname,
          avatar: plainLog.author.avatar
        } : null
      };
    });

    // 返回游记列表，使用新的响应格式
    return res.status(200).json({
      status: 'success',
      message: '获取游记列表成功',
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
 * 获取单个游记详情
 * @route GET /api/travel-logs/:id
 */
exports.getTravelLog = async (req, res, next) => {
  try {
    const logId = req.params.id;

    // 查询游记
    const travelLog = await TravelLog.findOne({
      where: {
        log_id: logId,
        status: 'approved'
      },
      attributes: [
        'log_id', 'title', 'content', 'image_urls', 'video_url', 'cover_url',
        'created_at', 'updated_at', 'comment_count', 'like_count', 'favorite_count'
      ],
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['user_id', 'nickname', 'avatar']
        },
        {
          model: Tag,
          as: 'tags',
          attributes: ['tag_id', 'tag_name'],
          through: { attributes: [] }
        },
        {
          model: Comment,
          as: 'comments',
          attributes: ['comment_id', 'content', 'created_at'],
          include: [
            {
              model: User,
              as: 'author',
              attributes: ['user_id', 'nickname', 'avatar']
            }
          ],
          limit: 10,
          order: [['created_at', 'DESC']]
        }
      ]
    });

    if (!travelLog) {
      return next(new AppError('游记不存在或未通过审核', 404));
    }

    // 返回游记详情
    return res.success({ travel_log: travelLog }, '获取游记详情成功');
  } catch (error) {
    next(error);
  }
};

/**
 * 获取当前用户的游记列表
 * @route GET /api/travel-logs/me
 */
exports.getMyTravelLogs = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    
    // 分页参数
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // 状态过滤
    const status = req.query.status;
    const whereConditions = { user_id: userId };
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      whereConditions.status = status;
    }

    // 查询游记列表
    const { count, rows: travelLogs } = await TravelLog.findAndCountAll({
      where: whereConditions,
      attributes: [
        'log_id', 'title', 'content', 'image_urls', 'video_url', 'cover_url', 
        'status', 'created_at', 'updated_at', 'like_count', 'comment_count', 'favorite_count'
      ],
      include: [
        {
          model: Tag,
          as: 'tags',
          attributes: ['tag_id', 'tag_name'],
          through: { attributes: [] }
        }
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    // 获取所有有审核记录的游记ID
    const allLogIds = travelLogs.map(log => log.log_id);
    
    // 审核记录映射，键为游记ID，值为该游记的审核记录数组
    let auditRecordsByLogId = {};
    
    if (allLogIds.length > 0) {
      // 查询所有游记的审核记录
      const audits = await TravelLogAudit.findAll({
        where: {
          log_id: allLogIds
        },
        attributes: ['log_id', 'audit_id', 'audit_status', 'reason', 'audit_time'],
        include: [
          {
            model: User,
            as: 'reviewer',
            attributes: ['user_id', 'nickname']
          }
        ],
        order: [['audit_time', 'DESC']]
      });
      
      // 按游记ID组织审核记录
      auditRecordsByLogId = audits.reduce((acc, record) => {
        if (!acc[record.log_id]) {
          acc[record.log_id] = [];
        }
        acc[record.log_id].push({
          audit_id: record.audit_id,
          audit_status: record.audit_status,
          reason: record.reason,
          audit_time: record.audit_time,
          reviewer: record.reviewer ? {
            user_id: record.reviewer.user_id,
            nickname: record.reviewer.nickname
          } : null
        });
        return acc;
      }, {});
    }
    
    // 处理返回数据
    const simplifiedTravelLogs = travelLogs.map(log => {
      const plainLog = log.get({ plain: true });
      
      // 返回游记信息，保留原始数据格式
      const result = {
        log_id: plainLog.log_id,
        title: plainLog.title,
        content: plainLog.content,
        image_urls: plainLog.image_urls,
        video_url: plainLog.video_url,
        cover_url: plainLog.cover_url,
        status: plainLog.status,
        created_at: plainLog.created_at,
        updated_at: plainLog.updated_at,
        like_count: plainLog.like_count,
        comment_count: plainLog.comment_count,
        favorite_count: plainLog.favorite_count,
        tags: plainLog.tags || []
      };
      
      // 添加游记审核历史记录
      if (auditRecordsByLogId[plainLog.log_id] && auditRecordsByLogId[plainLog.log_id].length > 0) {
        result.audit_history = auditRecordsByLogId[plainLog.log_id];
        
        // 为便于前端处理，保留兼容旧版的审核信息结构（最新的拒绝记录）
        if (plainLog.status === 'rejected') {
          const latestRejectRecord = auditRecordsByLogId[plainLog.log_id].find(r => r.audit_status === 'rejected');
          if (latestRejectRecord) {
            result.audit_info = {
              reject_reason: latestRejectRecord.reason,
              audit_time: latestRejectRecord.audit_time,
              reviewer: latestRejectRecord.reviewer
            };
          }
        }
      }
      
      return result;
    });

    // 返回游记列表
    return res.paginate(simplifiedTravelLogs, count, page, limit, '获取个人游记列表成功');
  } catch (error) {
    next(error);
  }
};

/**
 * 更新游记
 * @route PUT /api/travel-logs/:id
 */
exports.updateTravelLog = async (req, res, next) => {
  try {
    const logId = req.params.id;
    const userId = req.user.user_id;
    const { title, content, image_urls, video_url, cover_url, tags } = req.body;

    // 查询游记
    const travelLog = await TravelLog.findByPk(logId);
    
    // 检查游记是否存在
    if (!travelLog) {
      return next(new AppError('游记不存在', 404));
    }
    
    // 确认是否为游记作者
    if (travelLog.user_id !== userId) {
      return next(new AppError('无权更新此游记', 403));
    }
    
    // 只有待审核或被拒绝的游记可以更新
    if (travelLog.status !== 'pending' && travelLog.status !== 'rejected') {
      return next(new AppError('只有待审核或被拒绝的游记可以更新', 400));
    }

    // 更新游记
    if (title) travelLog.title = title;
    if (content) travelLog.content = content;
    if (image_urls) travelLog.image_urls = image_urls;
    if (video_url !== undefined) travelLog.video_url = video_url;
    if (cover_url !== undefined) travelLog.cover_url = cover_url;
    
    // 重置状态为待审核
    travelLog.status = 'pending';
    
    await travelLog.save();

    // 如果有标签，则更新关联
    if (tags && tags.length > 0) {
      // 查找或创建标签
      const tagInstances = await Promise.all(
        tags.map(async (tagName) => {
          const [tag] = await Tag.findOrCreate({
            where: { tag_name: tagName.trim().toLowerCase() }
          });
          return tag;
        })
      );

      // 更新标签关联
      await travelLog.setTags(tagInstances);
    }

    // 返回更新后的游记
    return res.success({
      travel_log: {
        log_id: travelLog.log_id,
        title: travelLog.title,
        status: travelLog.status,
        updated_at: travelLog.updated_at
      }
    }, '游记更新成功，等待审核');
  } catch (error) {
    next(error);
  }
};

/**
 * 删除游记
 * @route DELETE /api/travel-logs/:id
 */
exports.deleteTravelLog = async (req, res, next) => {
  try {
    const logId = req.params.id;
    const userId = req.user.user_id;

    // 查询游记
    const travelLog = await TravelLog.findByPk(logId);
    
    // 检查游记是否存在
    if (!travelLog) {
      return next(new AppError('游记不存在', 404));
    }
    
    // 管理员可以删除任何游记，普通用户只能删除自己的游记
    if (req.user.role !== 'admin' && travelLog.user_id !== userId) {
      return next(new AppError('无权删除此游记', 403));
    }

    // 删除游记（使用软删除）
    await travelLog.destroy();

    // 返回成功消息
    return res.success(null, '游记删除成功');
  } catch (error) {
    next(error);
  }
};

/**
 * 处理图片上传
 * @route POST /api/travel-logs/upload-images
 */
exports.uploadImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next(new AppError('未提供图片文件', 400));
    }

    // 使用媒体处理器处理所有上传的图片
    const processPromises = req.files.map(file => processImage(file));
    const processedFilenames = await Promise.all(processPromises);
    
    // 构建响应结果 - 只有一种质量的图片
    const image_urls = processedFilenames.map(filename => `images/${filename}`);

    // 返回图片URL
    return res.success({ image_urls }, '图片上传并处理成功');
  } catch (error) {
    next(error);
  }
};

/**
 * 处理视频上传
 * @route POST /api/travel-logs/upload-video
 */
exports.uploadVideo = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('未提供视频文件', 400));
    }

    console.log('==== 开始处理视频上传 ====');
    console.log('文件信息:', req.file.filename);
    
    // 使用媒体处理器处理上传的视频，启用快速响应模式
    const result = await processVideo(req.file, true);

    console.log('==== 视频处理结果 ====');
    console.log(JSON.stringify(result, null, 2));
    
    // 构建封面URL (如果处理结果中没有，就构造一个)
    const videoFilename = result.video_url.split('.')[0]; // 移除文件扩展名
    const coverUrl = result.cover_url || `images/${videoFilename}_cover.webp`;
    
    console.log('==== 最终返回数据 ====');
    console.log({
      video_url: `videos/${result.video_url}`,
      cover_url: coverUrl,
      status: result.status,
      process_id: result.process_id
    });
    
    // 返回视频URL、封面URL和处理状态
    return res.success({
      video_url: `videos/${result.video_url}`,
      cover_url: coverUrl,
      status: result.status,
      process_id: result.process_id,
      message: '视频已上传，正在后台处理中，您可以继续操作。'
    }, '视频上传成功');
  } catch (error) {
    console.error('==== 视频上传处理失败 ====');
    console.error(error);
    next(error);
  }
};

/**
 * 获取视频处理进度
 * @route GET /api/travel-logs/video-progress/:id
 */
exports.getVideoProgress = async (req, res, next) => {
  try {
    const processId = req.params.id;
    
    if (!processId) {
      return next(new AppError('缺少处理ID', 400));
    }
    
    // 获取处理进度
    const progress = getVideoProcessProgress(processId);
    
    if (!progress) {
      return next(new AppError('处理任务不存在或已完成', 404));
    }
    
    // 返回进度信息
    return res.success({
      process_id: processId,
      ...progress
    }, '获取视频处理进度成功');
  } catch (error) {
    next(error);
  }
};

/**
 * 获取当前用户的游记详情
 * @route GET /api/travel-logs/me/:id
 */
exports.getMyTravelLogDetail = async (req, res, next) => {
  try {
    const logId = req.params.id;
    const userId = req.user.user_id;

    // 查询游记，确保是当前用户自己的游记
    const travelLog = await TravelLog.findOne({
      where: {
        log_id: logId,
        user_id: userId
      },
      attributes: [
        'log_id', 'title', 'content', 'image_urls', 'video_url', 'cover_url',
        'status', 'created_at', 'updated_at', 'comment_count', 'like_count', 'favorite_count'
      ],
      include: [
        {
          model: Tag,
          as: 'tags',
          attributes: ['tag_id', 'tag_name'],
          through: { attributes: [] }
        },
        {
          model: Comment,
          as: 'comments',
          attributes: ['comment_id', 'content', 'created_at'],
          include: [
            {
              model: User,
              as: 'author',
              attributes: ['user_id', 'nickname', 'avatar']
            }
          ],
          limit: 10,
          order: [['created_at', 'DESC']]
        }
      ]
    });

    if (!travelLog) {
      return next(new AppError('游记不存在或不属于您', 404));
    }

    // 查询游记的审核记录
    const auditRecords = await TravelLogAudit.findAll({
      where: {
        log_id: logId
      },
      attributes: ['audit_id', 'audit_status', 'reason', 'audit_time'],
      include: [
        {
          model: User,
          as: 'reviewer',
          attributes: ['user_id', 'nickname']
        }
      ],
      order: [['audit_time', 'DESC']]
    });

    // 转换为普通对象
    const plainLog = travelLog.get({ plain: true });
    
    // 构建响应数据
    const result = {
      ...plainLog,
      auditRecords: auditRecords.map(record => ({
        audit_id: record.audit_id,
        audit_status: record.audit_status,
        reason: record.reason,
        audit_time: record.audit_time,
        reviewer: record.reviewer ? {
          user_id: record.reviewer.user_id,
          nickname: record.reviewer.nickname
        } : null
      }))
    };
    
    // 为便于前端处理，添加拒绝信息（如果状态为拒绝）
    if (plainLog.status === 'rejected' && auditRecords.length > 0) {
      const latestRejectRecord = auditRecords.find(r => r.audit_status === 'rejected');
      if (latestRejectRecord) {
        result.audit_info = {
          reject_reason: latestRejectRecord.reason,
          audit_time: latestRejectRecord.audit_time,
          reviewer: latestRejectRecord.reviewer ? {
            user_id: latestRejectRecord.reviewer.user_id,
            nickname: latestRejectRecord.reviewer.nickname
          } : null
        };
      }
    }

    // 返回游记详情
    return res.success({ travel_log: result }, '获取游记详情成功');
  } catch (error) {
    next(error);
  }
}; 