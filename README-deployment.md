# Ctrip_web 部署说明

## 部署环境

- 服务器环境: CentOS 7
- Docker: 26.1.4
- Docker Compose: 2.27.1
- 已有MySQL8和Nginx容器运行
- 已有Docker网络: ctrip-network

## 快速部署

1. 将项目代码上传到服务器
2. 进入项目目录
3. 创建环境变量文件: `cp example.env .env` 并编辑设置数据库连接信息
4. 修改`docker-compose.yml`中的网络设置为`ctrip-network`
5. 连接容器到网络: `docker network connect ctrip-network mysql8`
6. 编辑Nginx配置: `cp nginx/deploy.conf nginx/deploy.custom.conf` 并修改IP
7. 配置Nginx: `docker cp nginx/deploy.custom.conf nginx:/etc/nginx/conf.d/ctrip.conf`
8. 重启Nginx: `docker exec nginx nginx -s reload`
9. 构建和启动应用: `docker compose up -d --build`

## 使用部署脚本

提供了自动部署脚本简化流程：

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

脚本会自动执行大部分配置和部署步骤，仅需要提供服务器IP和确认数据库初始化。

## 详细部署流程

请参阅 [deployment_guide.md](./deployment_guide.md) 获取完整的部署指南。

## 项目结构

此项目采用Node.js+Express开发的旅游日志平台，主要文件/目录:

- `Dockerfile`: Docker镜像构建配置
- `docker-compose.yml`: Docker Compose服务配置
- `example.env`: 环境变量示例文件
- `nginx/deploy.conf`: Nginx配置文件
- `src/`: 源代码目录

## 注意事项

- 首次部署需初始化数据库结构，详见部署指南
- 确保文件上传目录有正确权限
- 生产环境中务必修改默认密码和JWT密钥
- BASE_URL环境变量需要设置为服务器实际IP，例如 http://101.43.95.173
- 确保`DB_HOST`设置为`mysql8`或您实际的MySQL容器名
- Docker Compose 2.x版本使用`docker compose`命令(无连字符) 