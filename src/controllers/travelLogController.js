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
    
    // 基本搜索条件 - 只包含游记状态和标题搜索
    const whereConditions = {
      status: 'approved'
    };
    
    // 如果有搜索内容，添加标题搜索条件
    if (search) {
      whereConditions.title = { [Op.like]: `%${search}%` };
    }

    // 查询游记列表
    const { count, rows: travelLogs } = await TravelLog.findAndCountAll({
      where: whereConditions,
      attributes: [
        'log_id', 'title', 'content', 'image_urls', 'video_url', 'cover_url',
        'created_at', 'comment_count', 'like_count', 'favorite_count'
      ],
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['user_id', 'nickname', 'avatar'],
          // 如果有搜索内容，添加作者昵称搜索条件
          ...(search ? {
            where: {
              nickname: { [Op.like]: `%${search}%` }
            },
            required: false // 设置为 false 表示左连接(LEFT JOIN)
          } : {})
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
    });

    // 返回游记列表，使用分页响应
    return res.paginate(travelLogs, count, page, limit, '获取游记列表成功');
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
        'status', 'created_at', 'updated_at', 'comment_count', 'like_count', 'favorite_count'
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

    // 获取被拒绝游记的审核记录
    if (travelLogs.some(log => log.status === 'rejected')) {
      const rejectedLogIds = travelLogs
        .filter(log => log.status === 'rejected')
        .map(log => log.log_id);
      
      // 查询审核记录
      const auditRecords = await TravelLogAudit.findAll({
        where: {
          log_id: rejectedLogIds,
          audit_status: 'rejected'
        },
        attributes: ['log_id', 'reason'],
        order: [['audit_time', 'DESC']],
        group: ['log_id'] // 每个游记只取最新的一条
      });
      
      // 添加拒绝原因到游记对象
      travelLogs.forEach(log => {
        if (log.status === 'rejected') {
          const auditRecord = auditRecords.find(record => record.log_id === log.log_id);
          if (auditRecord) {
            log.setDataValue('reject_reason', auditRecord.reason);
          }
        }
      });
    }

    // 返回游记列表
    return res.paginate(travelLogs, count, page, limit, '获取个人游记列表成功');
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