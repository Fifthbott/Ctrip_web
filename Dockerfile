FROM node:18-alpine

# 安装 tzdata 包以配置时区
RUN apk add --no-cache tzdata

# 设置时区为 Asia/Shanghai
RUN cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && echo "Asia/Shanghai" > /etc/timezone

# 需要删除 tzdata，以减小镜像体积
RUN apk del tzdata

WORKDIR /app

COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制应用代码
COPY . .

# 创建上传目录
RUN mkdir -p src/uploads/images src/uploads/videos src/uploads/avatars && \
    chmod -R 777 src/uploads

# 设置默认环境变量
ENV NODE_ENV=production \
    PORT=3000 \
    DB_HOST=mysql8 \
    DB_USERNAME=user1 \
    DB_PASSWORD=qwe123 \
    DB_NAME=Ctrip \
    SYNC_MODELS=false \
    UPLOAD_PATH=src/uploads \
    BASE_URL=http://101.43.95.173:3000

EXPOSE 3000

CMD ["npm", "start"] 