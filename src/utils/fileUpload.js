const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// 获取文件上传配置
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024; // 默认10MB
const UPLOAD_PATH = process.env.UPLOAD_PATH || 'src/uploads';

// 确保上传目录存在
const ensureUploadDirs = () => {
  const dirs = ['images', 'videos', 'avatars']; // 添加头像专用目录
  
  dirs.forEach(dir => {
    const dirPath = path.join(process.cwd(), UPLOAD_PATH, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
};

// 初始化目录
ensureUploadDirs();

// 创建基本存储配置
const createStorage = (subDir) => {
  return multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadDir = path.join(process.cwd(), UPLOAD_PATH, subDir);
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      // 生成唯一文件名
      const uniqueFileName = `${uuidv4()}${path.extname(file.originalname)}`;
      cb(null, uniqueFileName);
    }
  });
};

// 定义图片存储
const imageStorage = createStorage('images');
// 定义视频存储
const videoStorage = createStorage('videos');
// 定义头像存储
const avatarStorage = createStorage('avatars');

// 文件过滤器
const imageFilter = (req, file, cb) => {
  // 允许的图片类型
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的图片类型。只允许JPEG, PNG, GIF, WebP格式'), false);
  }
};

// 视频过滤器
const videoFilter = (req, file, cb) => {
  // 允许的视频类型
  const allowedTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的视频类型。只允许MP4, MPEG, MOV, AVI格式'), false);
  }
};

// 创建Multer实例 - 图片上传
const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: imageFilter
});

// 创建Multer实例 - 视频上传
const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: videoFilter
});

// 创建Multer实例 - 头像上传
const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 头像限制2MB
  fileFilter: imageFilter
});

// 获取文件URL的帮助函数
const getFileUrl = (file, type = 'default') => {
  let fileType;
  
  // 根据文件类型或指定类型确定子目录
  if (type === 'avatar') {
    fileType = 'avatars';
  } else if (type === 'default') {
    fileType = file.mimetype.startsWith('image/') ? 'images' : 'videos';
  } else {
    fileType = type;
  }
  
  // 返回相对路径，不包含'/uploads'前缀
  return `${fileType}/${file.filename}`;
};

// 错误处理中间件
const handleMulterError = (err, req, res, next) => {
  if (err) {
    console.error('===== 文件上传错误详情开始 =====');
    console.error('错误对象:', err);
    console.error('错误名称:', err.name);
    console.error('错误消息:', err.message);
    console.error('错误代码:', err.code);
    console.error('请求路径:', req.path);
    console.error('Content-Type:', req.headers['content-type']);
    
    if (err instanceof multer.MulterError) {
      console.error('Multer错误字段:', err.field);
    }
    
    // 打印当前请求的字段和文件
    console.error('请求体字段:', req.body);
    console.error('请求文件:', req.file || '无文件');
    console.error('请求多文件:', req.files || '无多文件');
    console.error('===== 文件上传错误详情结束 =====');
    
    // 清理可能已经上传的文件
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
        console.log('清理已上传文件:', req.file.path);
      } catch (fileErr) {
        console.error('清理文件失败:', fileErr);
      }
    }
    
    // 处理多文件情况
    if (req.files) {
      if (Array.isArray(req.files)) {
        req.files.forEach(file => {
          try {
            fs.unlinkSync(file.path);
            console.log('清理已上传文件:', file.path);
          } catch (fileErr) {
            console.error('清理文件失败:', fileErr);
          }
        });
      } else if (typeof req.files === 'object') {
        // 多字段文件上传情况
        Object.keys(req.files).forEach(fieldname => {
          const files = req.files[fieldname];
          if (Array.isArray(files)) {
            files.forEach(file => {
              try {
                fs.unlinkSync(file.path);
                console.log('清理已上传文件:', file.path);
              } catch (fileErr) {
                console.error('清理文件失败:', fileErr);
              }
            });
          }
        });
      }
    }
    
    if (err instanceof multer.MulterError) {
      // Multer错误
      let message = '文件上传错误';
      
      // 根据错误类型提供具体的错误消息
      switch (err.code) {
        case 'LIMIT_FILE_SIZE':
          message = '文件大小超出限制';
          break;
        case 'LIMIT_UNEXPECTED_FILE':
          message = `意外的文件字段: ${err.field}`;
          break;
        case 'LIMIT_FILE_COUNT':
          message = '上传的文件数量超出限制';
          break;
        default:
          message = `文件上传错误: ${err.message}`;
      }
      
      // 使用res.error方法返回统一格式的错误响应
      return res.error(message, 400, err.code);
    } else {
      // 其他错误
      return res.error(`文件上传失败: ${err.message}`, 500);
    }
  }
  
  // 没有错误，继续
  next();
};

module.exports = {
  uploadImage,
  uploadVideo,
  uploadAvatar,
  getFileUrl,
  handleMulterError
}; 