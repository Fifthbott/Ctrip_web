## 游记后端服务

基于 Node.js 和 Express 构建的游记后端服务，提供用户管理、旅游日志、评论和审核等功能的 RESTful API。

## 项目特点

- 完整的用户管理系统（注册、登录、个人信息管理）
- 游记发布和管理
- 评论和互动功能（点赞、收藏） /TODO
- 内容审核系统
- 文件上传功能（图片、视频）
- 数据库 ORM 集成 (Sequelize)
- 较为完整的安全措施 (Helmet, CORS, JWT)

## 技术栈

- **Node.js & Express**: 服务器框架
- **Sequelize ORM**: 数据库对象关系映射
- **JWT**: 用户认证
- **Multer**: 文件上传处理
- **Helmet**: 安全头设置
- **Compression**: 响应压缩
- **Morgan**: 日志记录
- **Cors**: 跨域资源共享

## 项目结构

```
src/
├── config/          # 配置文件
├── controllers/     # 业务逻辑控制器
├── docs/            # API文档
├── middleware/      # 中间件
├── models/          # 数据模型
├── public/          # 静态资源
├── routes/          # API路由
├── uploads/         # 上传文件存储
├── utils/           # 工具函数
└── app.js           # 应用入口
```

## 主要功能

### 用户管理
- 用户注册与登录
- 个人信息管理
- 用户头像上传

### 旅游日志
- 创建和管理旅游日志
- 上传图片和视频
- 内容标签管理

### 社交互动
- 评论功能
- 点赞系统
- 收藏功能

### 内容审核
- 旅游日志审核流程
- 内容状态管理

## 安装与启动

### 前置要求
- Node.js (>= 14.x)
- MySQL 或其他 Sequelize 支持的数据库

### 安装步骤

1. 克隆仓库
```bash
git clone https://github.com/Fifthbott/Ctrip_web.git
cd Ctrip_web
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
创建 `.env` 文件，参考以下内容：
```
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_NAME=ctrip_db
DB_USER=root
DB_PASS=password
JWT_SECRET=your_jwt_secret
SYNC_MODELS=false
```

4. 启动服务
```bash
npm start
```

开发模式启动：
```bash
npm run dev
```

## API 路由

### 用户相关
- `POST /api/users/register` - 用户注册
- `POST /api/users/login` - 用户登录
- `GET /api/users/me` - 获取个人信息
- `PUT /api/users/me` - 更新个人信息
- `POST /api/users/me/avatar` - 上传头像

### 旅游日志
- `POST /api/travel-logs` - 创建旅游日志
- `GET /api/travel-logs` - 获取旅游日志列表
- `GET /api/travel-logs/:id` - 获取旅游日志详情
- `PUT /api/travel-logs/:id` - 更新旅游日志
- `DELETE /api/travel-logs/:id` - 删除旅游日志
- `POST /api/travel-logs/upload-images` - 上传图片
- `POST /api/travel-logs/upload-video` - 上传视频

### 评论
- `POST /api/comments` - 创建评论
- `GET /api/comments/log/:logId` - 获取指定日志的评论

### 点赞与收藏
- `POST /api/travel-logs/:id/like` - 点赞旅游日志
- `POST /api/travel-logs/:id/favorite` - 收藏旅游日志

### 审核
- `GET /api/audits/logs` - 获取待审核旅游日志
- `PUT /api/audits/logs/:id` - 更新审核状态

## 开发与部署

### 开发环境
- 开发时使用 nodemon 自动重启
- 详细的开发日志记录
- 模型自动同步 (SYNC_MODELS=true)

### 生产环境
- 优化的日志格式
- 压缩响应数据
- 安全的 HTTP 头配置

## 贡献指南
欢迎提交 Pull Request 或提出 Issue。
>>>>>>> cf836bac9f5483f049db51127a7842031c2ed71a
