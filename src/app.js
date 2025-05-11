require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
const multer = require('multer');
const { initDatabase } = require('./config/dbInit');
const { responseMiddleware } = require('./utils/response');
const { errorHandler, notFoundHandler } = require('./middleware/error');

// 初始化Express应用
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors({
  origin: '*', // 允许所有来源，生产环境应该更严格
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 自定义Helmet配置
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // 允许内联脚本
      styleSrc: ["'self'", "'unsafe-inline'"], // 允许内联样式
      imgSrc: ["'self'", "data:", "blob:"], // 允许数据URL和Blob URL的图片
      mediaSrc: ["'self'", "data:", "blob:"], // 允许数据URL和Blob URL的媒体
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "data:"]
    }
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' } // 允许跨域访问资源
}));

// 开发环境日志更详细
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  // 自定义日志格式，显示为东八区时间
  morgan.token('date', (req, res, tz) => {
    return new Date().toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      hour12: false
    });
  });
  app.use(morgan(':remote-addr - :remote-user [:date] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"'));
}

app.use(compression());

// 解析JSON和URL编码的请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 注册响应中间件 - 必须在multer之前注册，确保res.error方法可用
app.use(responseMiddleware);

// Multer中间件 - 处理不包含文件的multipart/form-data请求
const upload = multer();
app.use((req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  
  // 定义文件上传路径列表
  const fileUploadPaths = [
    '/api/users/register',
    '/api/users/me/avatar',
    '/api/users/avatar',
    '/api/travel-logs/upload-images',
    '/api/travel-logs/upload-video'
  ];
  
  // 检查当前路径是否是文件上传路径
  const isFileUploadPath = fileUploadPaths.some(path => req.path === path);
  
  // 如果是multipart/form-data请求但不是针对文件上传的路由，使用multer处理
  if (contentType.includes('multipart/form-data') && !isFileUploadPath) {
    // 使用none()确保只处理文本字段，不处理文件
    upload.none()(req, res, (err) => {
      if (err) {
        return res.error('表单数据处理错误', 400);
      }
      next();
    });
  } else {
    next();
  }
});

// 请求体解析调试中间件
app.use((req, res, next) => {
  next();
});

// 静态文件服务
app.use('/public', express.static(path.join(__dirname, 'public')));
// 文件上传目录
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API路由
const userRoutes = require('./routes/userRoutes');
const travelLogRoutes = require('./routes/travelLogRoutes');
const auditRoutes = require('./routes/auditRoutes');
const indexRoutes = require('./routes/indexRoutes');
const commentRoutes = require('./routes/commentRoutes');

// 基础路由
app.use('/', indexRoutes);

// API路由
app.use('/api/users', userRoutes);
app.use('/api/travel-logs', travelLogRoutes);
app.use('/api/audits', auditRoutes);
app.use('/api/comments', commentRoutes);

// 404处理
app.use(notFoundHandler);

// 全局错误处理
app.use(errorHandler);

// 捕获multer错误
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('Multer错误:', err);
    return res.status(400).json({
      status: 'error',
      code: err.code,
      message: `文件上传错误: ${err.message}`
    });
  }
  next(err);
});

// 启动服务器
const startServer = async () => {
  try {
    console.log('环境:', process.env.NODE_ENV);
    
    // 检查是否需要同步表结构
    const syncModels = process.env.SYNC_MODELS === 'true';
    
    // 初始化数据库
    await initDatabase(syncModels);
    
    // 启动服务器
    app.listen(PORT, () => {
      console.log(`服务器启动成功: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
};

startServer(); 