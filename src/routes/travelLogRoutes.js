const express = require('express');
const travelLogController = require('../controllers/travelLogController');
const commentController = require('../controllers/commentController');
const interactionController = require('../controllers/interactionController');
const { authenticate } = require('../middleware/auth');
const { travelLogValidators, commentValidators, searchValidators } = require('../middleware/validators');
const { uploadImage, uploadVideo, handleMulterError } = require('../utils/fileUpload');

const router = express.Router();

// 公开路由 - 获取游记列表和详情
router.get('/', searchValidators.searchTravelLogs, travelLogController.getTravelLogs);

// 视频处理进度查询（公开接口，不需要认证）
router.get('/video-progress/:id', travelLogController.getVideoProgress);

// 需要身份验证的路由
router.use(authenticate);

// 我的游记 - 放在使用:id参数的路由前面
router.get('/me', travelLogController.getMyTravelLogs);

// 获取当前用户的游记详情 - 路径上区分于公开游记详情
router.get('/me/:id', travelLogValidators.validateTravelLogId, travelLogController.getMyTravelLogDetail);

// 文件上传
router.post('/upload-images', 
  uploadImage.array('images', 10), 
  handleMulterError,
  travelLogController.uploadImages
);

router.post('/upload-video', 
  uploadVideo.single('video'), 
  handleMulterError,
  travelLogController.uploadVideo
);

// 游记管理
router.post('/', travelLogValidators.createTravelLog, travelLogController.createTravelLog);

// 带ID参数的路由 - 放在最后
router.get('/:id', travelLogValidators.validateTravelLogId, travelLogController.getTravelLog);
router.get('/:id/comments', travelLogValidators.validateTravelLogId, commentController.getComments);
router.put('/:id', travelLogValidators.validateTravelLogId, travelLogValidators.updateTravelLog, travelLogController.updateTravelLog);
router.delete('/:id', travelLogValidators.validateTravelLogId, travelLogController.deleteTravelLog);

// 互动（点赞、收藏）
router.post('/:id/like', travelLogValidators.validateTravelLogId, interactionController.likeTravelLog);
router.delete('/:id/like', travelLogValidators.validateTravelLogId, interactionController.unlikeTravelLog);
router.post('/:id/favorite', travelLogValidators.validateTravelLogId, interactionController.favoriteTravelLog);
router.delete('/:id/favorite', travelLogValidators.validateTravelLogId, interactionController.unfavoriteTravelLog);

module.exports = router; 