const express = require('express');
const commentController = require('../controllers/commentController');
const { authenticate } = require('../middleware/auth');
const { commentValidators } = require('../middleware/validators');

const router = express.Router();

// 所有评论接口都需要身份验证
router.use(authenticate);

/**
 * @route POST /api/comments
 * @desc 创建评论
 * @access Private
 */
router.post('/', commentValidators.createComment, commentController.createComment);

/**
 * @route DELETE /api/comments/:id
 * @desc 删除评论
 * @access Private - 评论作者或管理员
 */
router.delete('/:id', commentController.deleteComment);

module.exports = router; 