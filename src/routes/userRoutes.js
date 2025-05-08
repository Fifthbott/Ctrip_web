const express = require('express');
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const { userValidators } = require('../middleware/validators');
const { uploadAvatar, handleMulterError } = require('../utils/fileUpload');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// 临时用于测试的存储
const testStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), 'src/uploads/test'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// 临时用于测试的multer实例
const testUpload = multer({ storage: testStorage });

// 公开路由 - 用户注册
router.post('/register', 
  // 处理头像上传
  uploadAvatar.single('avatar'),
  // 处理上传错误
  handleMulterError,
  // 验证请求数据
  userValidators.register,
  // 处理注册
  userController.register
);

// 用户登录
router.post('/login', userValidators.login, userController.login);

// 需要身份验证的路由
router.use(authenticate);

// 获取当前用户信息
router.get('/me', userController.getMe);

// 更新当前用户信息
router.put('/me', userValidators.updateUser, userController.updateMe);

// 临时测试路由
router.post('/test-upload', 
  (req, res, next) => {
    console.log('【测试】接收到测试上传请求');
    console.log('【测试】Content-Type:', req.headers['content-type']);
    next();
  },
  testUpload.single('file'),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: '没有文件被上传' });
    }
    res.json({ 
      message: '文件上传成功',
      file: req.file 
    });
  }
);

// 上传/更新用户头像 (包含调试)
router.post('/me/avatar', 
  (req, res, next) => {
    console.log('【调试】接收到头像上传请求');
    console.log('【调试】Content-Type:', req.headers['content-type']);
    console.log('【调试】请求体:', req.body);
    next();
  },
  uploadAvatar.single('avatar'), 
  handleMulterError,
  userController.updateAvatar
);

// 管理员路由 - 获取所有用户
router.get('/', authorize(['admin']), userController.getAllUsers);

module.exports = router; 