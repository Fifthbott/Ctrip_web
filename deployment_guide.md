# Ctrip_web 项目部署指南

本文档详细介绍了如何将Ctrip_web项目部署到CentOS 7服务器上。

## 准备工作

已确认服务器环境：
- CentOS 7
- Docker 26.1.4
- Docker Compose 2.27.1
- 已有MySQL8和Nginx容器运行
- 已有Docker网络: ctrip-network

## 部署步骤

### 1. 创建项目目录并上传代码

```bash
# 创建项目目录
mkdir -p /opt/ctrip_web
cd /opt/ctrip_web

# 使用git克隆项目（如果使用git）
# git clone <your-repository-url> .

# 或者上传项目文件到该目录
# 使用scp, sftp等工具上传
```

### 2. 创建环境变量文件

```bash
# 复制示例环境变量文件并根据实际情况修改
cp example.env .env

# 编辑.env文件，填入实际的配置
nano .env
```

重要配置项:
- `DB_HOST`: 修改为与MySQL容器通信的主机名（例如`mysql8`）
- `JWT_SECRET`: 修改为安全的随机字符串
- `BASE_URL`: 修改为您的服务器IP地址，例如 `http://101.43.95.173`

### 3. 确保docker-compose.yml配置正确

```bash
# 编辑docker-compose.yml文件
nano docker-compose.yml

# 确保networks配置正确:
networks:
  ctrip-network:
    external:
      name: ctrip-network

# 同时确保depends_on指向正确的MySQL容器名称:
depends_on:
  - mysql8
```

### 4. 配置Docker网络

```bash
# 检查网络是否存在
docker network ls | grep ctrip-network

# 将现有的MySQL和Nginx容器连接到这个网络
docker network connect ctrip-network mysql8
docker network connect ctrip-network nginx
```

### 5. 修改Nginx配置

首先确保Nginx有正确的主配置文件：

```bash
# 复制主配置文件
cp nginx/nginx.conf /etc/nginx/nginx.conf

# 确保缓存目录存在
mkdir -p /var/cache/nginx/api_cache
mkdir -p /var/cache/nginx/download_cache
chmod -R 755 /var/cache/nginx
chown -R nginx:nginx /var/cache/nginx
```

然后修改配置文件中的服务器IP：

```bash
# 复制配置文件模板
cp nginx/deploy.conf nginx/deploy.custom.conf

# 编辑配置，替换服务器IP
# 将server_name localhost; 修改为您的服务器IP
# 例如: server_name 101.43.95.173;
nano nginx/deploy.custom.conf
```

然后将修改后的配置文件复制到Nginx容器：

```bash
# 确保Nginx容器中的目录存在
docker exec nginx mkdir -p /etc/nginx/conf.d /app/src/uploads

# 复制配置文件到Nginx配置目录
docker cp nginx/deploy.custom.conf nginx:/etc/nginx/conf.d/ctrip.conf

# 重启Nginx以应用新配置
docker exec nginx nginx -t  # 测试配置
docker exec nginx nginx -s reload  # 重载配置
```

### 6. 构建和启动应用

使用Docker Compose构建和启动应用：

```bash
# 构建并启动容器
docker compose up -d --build

# 查看日志，确认应用启动正常
docker compose logs -f
```

### 7. 数据库初始化

首次部署时，需要同步数据库结构：

```bash
# 修改.env文件中的SYNC_MODELS为true
sed -i 's/SYNC_MODELS=false/SYNC_MODELS=true/' .env

# 重启应用以同步数据库结构
docker compose restart

# 同步完成后，改回false
sed -i 's/SYNC_MODELS=true/SYNC_MODELS=false/' .env
docker compose restart
```

### 8. 验证部署

访问服务器IP，确认应用运行正常：

```bash
# 测试API健康检查端点
curl http://服务器IP/api/health
```

## 常见问题排查

### 连接不上MySQL

检查网络连接和MySQL容器是否正常运行：

```bash
# 查看MySQL容器状态
docker ps | grep mysql8

# 测试从应用容器到MySQL的连接
docker exec ctrip_api ping mysql8
```

### 文件上传问题

检查文件权限和挂载目录：

```bash
# 确保上传目录具有正确权限
chmod -R 777 src/uploads

# 检查卷挂载是否正确
docker inspect ctrip_api | grep Mounts -A 20
```

### Nginx代理问题

检查Nginx配置和日志：

```bash
# 检查Nginx配置
docker exec nginx cat /etc/nginx/conf.d/ctrip.conf

# 查看Nginx错误日志
docker exec nginx cat /var/log/nginx/error.log
```

### 上传目录访问问题

如果无法通过Nginx访问上传的文件：

```bash
# 检查Nginx中的上传目录挂载
docker exec nginx ls -la /app/src/uploads

# 如果目录不存在，创建必要的目录
docker exec nginx mkdir -p /app/src/uploads

# 确保应用容器中的上传目录与Nginx容器共享
# 可以通过Docker卷或挂载宿主机目录实现
```

### 网络问题

如果容器之间无法通信：

```bash
# 检查网络配置
docker network inspect ctrip-network

# 确认容器是否在正确的网络中
docker network inspect ctrip-network | grep ctrip_api
docker network inspect ctrip-network | grep mysql8
docker network inspect ctrip-network | grep nginx
```

## 更新应用

当需要更新应用时，按照以下步骤进行：

```bash
# 获取最新代码
git pull  # 如果使用git

# 重新构建并重启容器
docker compose up -d --build
```

## 备份数据

定期备份MySQL数据：

```bash
# 备份MySQL数据
docker exec mysql8 sh -c 'exec mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" Ctrip' > backup_$(date +%Y%m%d).sql
```

备份上传的文件：

```bash
# 备份上传目录
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz src/uploads
```