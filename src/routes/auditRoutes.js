const express = require('express');
const auditController = require('../controllers/auditController');
const { authenticate, authorize } = require('../middleware/auth');
const { auditValidators, travelLogValidators } = require('../middleware/validators');

const router = express.Router();

// 所有路由都需要身份验证
router.use(authenticate);

// 所有路由都需要管理员或审核员权限
router.use(authorize(['admin', 'reviewer']));

// 获取待审核游记列表
router.get('/travel-logs', auditController.getAuditTravelLogs);

// 获取单个游记详情（用于审核）
router.get('/travel-logs/:id', travelLogValidators.validateTravelLogId, auditController.getAuditTravelLog);

// 审核游记
router.post('/travel-logs/:id', travelLogValidators.validateTravelLogId, auditValidators.auditTravelLog, auditController.auditTravelLog);

// 删除游记（仅管理员）
router.delete('/travel-logs/:id', travelLogValidators.validateTravelLogId, authorize(['admin']), auditController.deleteTravelLog);

module.exports = router; 