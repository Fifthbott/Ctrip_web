#!/bin/bash
# Ctrip_web 自动部署脚本

# 显示脚本运行过程中的命令
set -x

# 定义网络名称（含连字符）
NETWORK_NAME="ctrip-network"

# 确保上传目录存在
mkdir -p src/uploads/{images,videos,avatars}
chmod -R 777 src/uploads

# 创建环境变量文件(如果不存在)
if [ ! -f .env ]; then
  cp example.env .env
  echo "创建了.env文件，请根据需要修改配置"
  
  # 提示用户设置服务器IP
  echo "请输入服务器IP地址 (用于BASE_URL):"
  read SERVER_IP
  
  if [ ! -z "$SERVER_IP" ]; then
    # 更新BASE_URL
    sed -i "s|BASE_URL=http://localhost|BASE_URL=http://$SERVER_IP|" .env
    echo "BASE_URL已更新为: http://$SERVER_IP"
  fi
fi

# 检查Docker网络
NETWORK_EXISTS=$(docker network ls | grep "$NETWORK_NAME" | wc -l)
if [ $NETWORK_EXISTS -eq 0 ]; then
  echo "错误: 网络 $NETWORK_NAME 不存在，请先创建此网络"
  exit 1
fi

# 检查并连接现有MySQL和Nginx容器到网络
MYSQL_EXISTS=$(docker ps | grep mysql8 | wc -l)
if [ $MYSQL_EXISTS -gt 0 ]; then
  docker network connect "$NETWORK_NAME" mysql8 || true
  echo "将MySQL容器连接到$NETWORK_NAME网络"
fi

NGINX_EXISTS=$(docker ps | grep nginx | wc -l)
if [ $NGINX_EXISTS -gt 0 ]; then
  docker network connect "$NETWORK_NAME" nginx || true
  echo "将Nginx容器连接到$NETWORK_NAME网络"
  
  NGINX_SERVER_IP=$(grep "BASE_URL" .env | cut -d'/' -f3)
  
  # 复制并修改Nginx配置
  cp nginx/deploy.conf nginx/deploy.custom.conf
  
  # 替换server_name
  sed -i "s|server_name localhost;|server_name $NGINX_SERVER_IP;|" nginx/deploy.custom.conf
  
  # 确保Nginx中有必要的目录
  docker exec nginx mkdir -p /etc/nginx/conf.d /app/src/uploads
  
  # 复制Nginx配置
  docker cp nginx/deploy.custom.conf nginx:/etc/nginx/conf.d/ctrip.conf
  docker exec nginx nginx -t && docker exec nginx nginx -s reload
  echo "更新了Nginx配置"
fi

# 修改docker-compose.yml中的网络名称
if grep -q "ctrip_network" docker-compose.yml; then
  echo "修改docker-compose.yml中的网络名称"
  cp docker-compose.yml docker-compose.yml.bak
  sed -i "s|ctrip_network|$NETWORK_NAME|g" docker-compose.yml
  sed -i 's|external: true|external: \n      name: ctrip-network|g' docker-compose.yml
fi

# 构建并启动应用 - 使用 docker compose 而非 docker-compose
docker compose up -d --build
echo "应用已构建并启动"

# 提示用户是否需要初始化数据库
echo "需要初始化数据库吗? (yes/no)"
read INIT_DB

if [ "$INIT_DB" = "yes" ]; then
  sed -i 's/SYNC_MODELS=false/SYNC_MODELS=true/' .env
  docker compose restart
  echo "数据库结构同步中..."
  
  # 等待一段时间让同步完成
  sleep 30
  
  # 恢复设置
  sed -i 's/SYNC_MODELS=true/SYNC_MODELS=false/' .env
  docker compose restart
  echo "数据库初始化完成并恢复SYNC_MODELS=false设置"
fi

# 检查应用状态
echo "应用部署完成，容器状态："
docker compose ps

echo "可以通过以下命令查看日志："
echo "docker compose logs -f"

# 输出访问地址
SERVER_IP=$(grep "BASE_URL" .env | cut -d'/' -f3)
echo "应用现在可以通过以下地址访问："
echo "API: http://$SERVER_IP:3000"
echo "通过Nginx: http://$SERVER_IP" 