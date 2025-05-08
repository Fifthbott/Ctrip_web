const { check, param, query, body } = require('express-validator');
const { handleValidationErrors } = require('./error');

/**
 * 用户验证规则
 */
const userValidators = {
  // 注册验证 - 简化版
  register: [
    check('username')
      .notEmpty().withMessage('用户名不能为空')
      .isLength({ min: 3, max: 20 }).withMessage('用户名长度应在3-20个字符之间'),
    
    check('password')
      .notEmpty().withMessage('密码不能为空')
      .isLength({ min: 6 }).withMessage('密码长度不能少于6个字符'),
    
    check('nickname')
      .notEmpty().withMessage('昵称不能为空'),
    
    handleValidationErrors
  ],
  
  // 登录验证
  login: [
    check('username')
      .notEmpty().withMessage('用户名不能为空'),
    
    check('password')
      .notEmpty().withMessage('密码不能为空'),
    
    handleValidationErrors
  ],
  
  // 更新用户验证
  updateUser: [
    check('nickname')
      .optional()
      .isLength({ min: 2, max: 20 }).withMessage('昵称长度应在2-20个字符之间'),
    
    check('password')
      .optional()
      .isLength({ min: 6 }).withMessage('密码长度不能少于6个字符'),
    
    handleValidationErrors
  ]
};

/**
 * 游记验证规则
 */
const travelLogValidators = {
  // 创建游记验证
  createTravelLog: [
    check('title')
      .notEmpty().withMessage('游记标题不能为空')
      .isLength({ min: 2, max: 100 }).withMessage('标题长度应在2-100个字符之间'),
    
    check('content')
      .notEmpty().withMessage('游记内容不能为空')
      .isLength({ min: 10 }).withMessage('内容长度不能少于10个字符'),
    
    check('image_urls')
      .isArray().withMessage('图片URLs必须是数组格式')
      .notEmpty().withMessage('至少需要上传一张图片'),
    
    handleValidationErrors
  ],
  
  // 更新游记验证
  updateTravelLog: [
    check('title')
      .optional()
      .isLength({ min: 2, max: 100 }).withMessage('标题长度应在2-100个字符之间'),
    
    check('content')
      .optional()
      .isLength({ min: 10 }).withMessage('内容长度不能少于10个字符'),
    
    check('image_urls')
      .optional()
      .isArray().withMessage('图片URLs必须是数组格式'),
    
    handleValidationErrors
  ],
  
  // 游记ID参数验证
  validateTravelLogId: [
    param('id')
      .isInt({ min: 1 }).withMessage('无效的游记ID'),
    
    handleValidationErrors
  ]
};

/**
 * 审核验证规则
 */
const auditValidators = {
  // 审核操作验证
  auditTravelLog: [
    check('audit_status')
      .isIn(['approved', 'rejected']).withMessage('审核状态必须是 approved 或 rejected'),
    
    check('reason')
      .if(body('audit_status').equals('rejected'))
      .notEmpty().withMessage('拒绝时必须提供原因')
      .isLength({ min: 5 }).withMessage('拒绝原因至少需要5个字符'),
    
    handleValidationErrors
  ]
};

/**
 * 评论验证规则
 */
const commentValidators = {
  // 创建评论验证
  createComment: [
    check('log_id')
      .isInt({ min: 1 }).withMessage('无效的游记ID'),
    
    check('content')
      .notEmpty().withMessage('评论内容不能为空')
      .isLength({ min: 1, max: 500 }).withMessage('评论内容长度应在1-500个字符之间'),
    
    handleValidationErrors
  ]
};

/**
 * 搜索验证规则
 */
const searchValidators = {
  // 搜索游记验证
  searchTravelLogs: [
    query('keyword')
      .optional()
      .isLength({ min: 1 }).withMessage('搜索关键词不能为空'),
    
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('页码必须大于等于1'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 }).withMessage('每页数量必须在1-50之间'),
    
    handleValidationErrors
  ]
};

module.exports = {
  userValidators,
  travelLogValidators,
  auditValidators,
  commentValidators,
  searchValidators
}; 