# 一、题目名称 

旅游日记平台

# 二、题目描述 

项目分为游记发布、呈现的用户系统和内容合规检查的审核管理系统。其中对客用户使用的游记发布系统为一个移动端项目，可以在手机端发布游记以及查看、分享所有已成功发布的游记；审核管理系统为一个PC站点，不同角色可以对用户发布的游记做上线前的审核检查、删除等操作。

# 三、必须实现的功能 

## 1.页面汇总

1.1用户系统（移动端）： 

1.1.1游记列表（首页）
1.1.2我的游记
1.1.3游记发布
1.1.4游记详情
1.1.5用户登录/注册
1.2审核管理系统（PC 站点）： 
1.2.1审核列表

## 2.页面说明：

### 2.1游记列表（首页）：

#### 2.1.1展示瀑布流游记卡片列表，分页加载所有人发布且审核通过的游记 

#### 2.1.2游记卡片展示元素包括游记图片、游记标题、用户头像、用户昵称 

#### 2.1.３页面顶部添加搜索功能，可通过游记标题，作者昵称搜索游记 

#### 2.1.４点击游记卡片可跳转至当前游记详情页 

### 2.2我的游记 ：

#### 2.2.1展示当前登录用户发布的游记列表 

##### a）游记有待审核、已通过、未通过三种状态

##### b）未通过审核游记需展示拒绝原因（审核时录入） 

##### c）实现游记编辑、删除功能。待审核、未通过状态可编辑，所有状态游记可删除（物理删除即可） 

#### 2.2.2 添加游记发布入口，点击跳转「游记发布」页

#### 2.2.3 用户上传内容外网展示需要符合相关法律法规，上线前设置审核机制是很有必要的。 

#### 2.2.4 登录态进入页面时需校验

### 2.3游记发布

#### 2.3.1 实现游记编辑发布，发布内容包括但不限于： 标题内容、图片（可上传多张）、视频（只允许上传一个 

#### 2.3.2对编辑内容做必须输入的校验，标题、内容、图片均为必须输入项

#### 2.3.3实现发布功能，校验未通过出页面提示，通过后新增或更新游记内容到数据库，页面返回至「我的游记」页面并刷新

#### 2.3.4 每篇游记新增时考虑设计一个唯—ID，用于后台检索以及更新操作用。 

#### 2.3.5 需要考虑图片大小带来的性能问题，一般做法是通过动态切图参数控制，本项目中我们在存储之前先压缩，直接存储压缩后的图片。

#### 2.3.6 除了上传图片也可支持视频上传。 

#### 2.3.7 进入页面时需校验登录态。

### 2.4游记详情

#### 2.4.1展示游记完整内容，包括作者昵称、头像 

#### 2.4.2图片可左右滑动查看，可放大查看原图 

#### 2.4.3如果有视频的话，视频位于图片列表的第一项，点击后进入全屏播放。 

#### 2.4.4支持游记分享功能（比如分享到微信） 

#### 2.4.5其他游记详情相关功能，可作为加分项。

#### 2.4.6 视频基础要求仅为点击后全屏播放，其他交互不做强制要求，进阶可完成视频封面图、WiFi下自动播放、离开页面时暂停播放、页面滑动时小窗播放等功能。 

#### 2.4.7分享到社交媒体可能需要一个额外的H5 游记详情承接页 （和选择的技术栈有关），有余力的同学可以实现，不做强制要求。

### 2.5用户登录/注册 

#### 2.5.1实现简单的用户名/密码登录注册功能 

#### 2.5.2对用户昵称做重复校验 

#### 2.5.3支持用户头像上传，未上传设置默认值

# 上述为移动端页面，下面的是web端：

### 2.6审核列表页面：

#### 1.展示所有用户发布的游记列表，包括待审核、已通过、未通过三种状态，具体说明如下：

待审核：用户新发布游记的初始状态
已通过：审核人员审查通过后
未通过：审核人员审查拒绝

#### 2.支持通过不同的游记状态做筛选过滤

#### 3.支持管理系统用户登录

#### 4.支持游记的管理操作，具体操作手势如下：

通过：审核通过，游记状态置为「已通过」
拒绝：审核拒绝，游记状态置为「未通过」，提交时审核人员需填写拒绝原因
删除：逻辑删除游记

#### 5.系统设计两个角色：审核人员和管理员，角色对应权限如下：审核人员：可以操作游记的审核通过和拒绝

管理员：可以执行所有支持的操作（通过、拒绝、删除）

#### 6.「逻辑删除」指并未实际删除数据库中存储的数据，而是设置一个「删除区分」用来标记该条记录为已删除的状态，这样做的目的通常是考虑到后续可能的数据恢复。 

#### 7.管理系统有不同的角色（用户），此处为了简化逻辑，可考虑把用户信息配置到json 文件来简化登录注册逻辑

根据上述描述生成

# 四、数据库设计思路

```sql
-- 用户表，存储用户的基本信息，包括用户名、昵称、头像、角色等
CREATE TABLE `users` (
    `user_id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '用户唯一标识',
    `username` VARCHAR(255) UNIQUE NOT NULL COMMENT '用户名，唯一，不允许为空',
    `password_hash` VARCHAR(255) NOT NULL COMMENT '用户密码（加密存储）',
    `nickname` VARCHAR(255) NOT NULL COMMENT '用户昵称',
    `avatar` VARCHAR(255) DEFAULT 'default_avatar.jpg' COMMENT '用户头像（URL），默认头像',
    `role` ENUM('user', 'admin', 'reviewer') NOT NULL COMMENT '用户角色：普通用户、管理员、审核员',
    `status` ENUM('active', 'inactive', 'banned') DEFAULT 'active' COMMENT '用户状态：活跃、非活跃、禁用',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '账户创建时间',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '账户更新时间'
);

-- 游记表，存储用户发布的游记信息
CREATE TABLE `travel_logs` (
    `log_id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '游记唯一标识',
    `user_id` INT NOT NULL COMMENT '用户ID，外键关联 `users`',
    `title` VARCHAR(255) NOT NULL COMMENT '游记标题',
    `content` TEXT NOT NULL COMMENT '游记内容',
    `status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' COMMENT '审核状态：待审核、已通过、未通过',
    `image_urls` JSON COMMENT '游记图片URL数组，支持多个图片',
    `video_url` VARCHAR(255) COMMENT '游记视频URL（可选）',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '游记创建时间',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '游记更新时间',
    `deleted_at` TIMESTAMP NULL COMMENT '游记删除时间，逻辑删除',
    `comment_count` INT DEFAULT 0 COMMENT '评论数，初始化为0',
    `like_count` INT DEFAULT 0 COMMENT '点赞数，初始化为0',
    `favorite_count` INT DEFAULT 0 COMMENT '收藏数，初始化为0',
    FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`)
);

-- 游记审核表，存储游记的审核记录
CREATE TABLE `travel_logs_audit` (
    `audit_id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '审核记录唯一标识',
    `log_id` INT NOT NULL COMMENT '游记ID，外键关联 `travel_logs`',
    `reviewer_id` INT NOT NULL COMMENT '审核员ID，外键关联 `users`',
    `audit_status` ENUM('approved', 'rejected') NOT NULL COMMENT '审核状态：待审核、通过、拒绝',
    `reason` TEXT COMMENT '审核拒绝的原因',
    `audit_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '审核时间',
    FOREIGN KEY (`log_id`) REFERENCES `travel_logs`(`log_id`),
    FOREIGN KEY (`reviewer_id`) REFERENCES `users`(`user_id`)
);

-- 评论表，存储用户对游记的评论
CREATE TABLE `comments` (
    `comment_id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '评论唯一标识',
    `log_id` INT NOT NULL COMMENT '游记ID，外键关联 `travel_logs`',
    `user_id` INT NOT NULL COMMENT '用户ID，外键关联 `users`',
    `content` TEXT NOT NULL COMMENT '评论内容',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '评论时间',
    FOREIGN KEY (`log_id`) REFERENCES `travel_logs`(`log_id`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`)
);

-- 标签表，存储游记的标签
CREATE TABLE `tags` (
    `tag_id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '标签唯一标识',
    `tag_name` VARCHAR(100) NOT NULL UNIQUE COMMENT '标签名称'
);

-- 游记与标签关联表，存储游记和标签之间的多对多关系
CREATE TABLE `travel_log_tags` (
    `log_id` INT NOT NULL COMMENT '游记ID，外键关联 `travel_logs`',
    `tag_id` INT NOT NULL COMMENT '标签ID，外键关联 `tags`',
    PRIMARY KEY (`log_id`, `tag_id`),
    FOREIGN KEY (`log_id`) REFERENCES `travel_logs`(`log_id`),
    FOREIGN KEY (`tag_id`) REFERENCES `tags`(`tag_id`)
);

-- 点赞表，记录用户对游记的点赞
CREATE TABLE `likes` (
    `like_id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '点赞记录唯一标识',
    `user_id` INT NOT NULL COMMENT '用户ID，外键关联 `users`',
    `log_id` INT NOT NULL COMMENT '游记ID，外键关联 `travel_logs`',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '点赞时间',
    FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`),
    FOREIGN KEY (`log_id`) REFERENCES `travel_logs`(`log_id`),
    UNIQUE (`user_id`, `log_id`) COMMENT '每个用户对同一篇游记只能点赞一次'
);

-- 收藏表，记录用户对游记的收藏
CREATE TABLE `favorites` (
    `favorite_id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '收藏记录唯一标识',
    `user_id` INT NOT NULL COMMENT '用户ID，外键关联 `users`',
    `log_id` INT NOT NULL COMMENT '游记ID，外键关联 `travel_logs`',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '收藏时间',
    FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`),
    FOREIGN KEY (`log_id`) REFERENCES `travel_logs`(`log_id`),
    UNIQUE (`user_id`, `log_id`) COMMENT '每个用户对同一篇游记只能收藏一次'
);

-- 触发器：新增评论时自动更新游记的评论数
DELIMITER $$

CREATE TRIGGER update_comment_count
AFTER INSERT ON `comments`
FOR EACH ROW
BEGIN
    UPDATE `travel_logs`
    SET `comment_count` = `comment_count` + 1
    WHERE `log_id` = NEW.log_id;
END $$

DELIMITER ;

-- 触发器：新增点赞时自动更新游记的点赞数
DELIMITER $$

CREATE TRIGGER update_like_count
AFTER INSERT ON `likes`
FOR EACH ROW
BEGIN
    UPDATE `travel_logs`
    SET `like_count` = `like_count` + 1
    WHERE `log_id` = NEW.log_id;
END $$

DELIMITER ;

-- 触发器：新增收藏时自动更新游记的收藏数
DELIMITER $$

CREATE TRIGGER update_favorite_count
AFTER INSERT ON `favorites`
FOR EACH ROW
BEGIN
    UPDATE `travel_logs`
    SET `favorite_count` = `favorite_count` + 1
    WHERE `log_id` = NEW.log_id;
END $$

DELIMITER ;

```



**索引设计**：

- 在 `users` 表的 `username`、`nickname` 字段上建立索引，提升查询效率。
- 在 `travel_logs` 表的 `status`、`user_id`、`created_at` 等字段上建立索引，加速检索游记。
- 在 `comments` 表的 `log_id`、`user_id` 上建立索引，加速查询游记评论。

**逻辑删除**：通过 `deleted_at` 字段实现游记的逻辑删除，避免物理删除带来的数据丢失，同时便于恢复数据。

**冗余字段**：对于一些常用的查询，可能会考虑在表中加入冗余字段，如 `travel_logs` 表中的 `image_urls` 字段，这样避免频繁的多表连接查询。

**缓存设计**：可以对一些查询频繁的结果进行缓存，例如游记列表和用户信息，提升性能。

明白了！让我们从已有的表结构设计出发，分析一下性能优化和可维护性如何在设计中得以体现，并给出具体的优化思路。

### 1. **表结构优化：**

在现有设计中，表结构已经相对清晰，符合数据库设计的基本原则。为了提高性能和可维护性，以下几点需要特别注意：

#### 1.1 **字段设计和数据类型：**

- **`VARCHAR` 长度设置：**
  - 表中使用了 `VARCHAR(255)` 作为大多数文本字段的长度。虽然 MySQL 可以存储较大的文本长度，但如果确定某些字段（如 `nickname`）不会超过某一长度，可以考虑缩短 `VARCHAR` 的长度，减少存储开销。例如，`nickname` 可以设为 `VARCHAR(100)`，如果预计用户名不超过 50 个字符，可以将 `username` 改为 `VARCHAR(100)`。
- **适当的默认值：**
  - `avatar` 字段给出了合理的默认值 `'default_avatar.jpg'`，避免了 `NULL` 值对查询和维护的影响。默认值有助于减少后期数据清理的工作。

#### 1.2 **合理使用 `ENUM` 类型：**

- 在设计中，`ENUM` 类型用来表示状态（如 `status`, `audit_status` 等）。`ENUM` 类型适用于可预知且固定的值，但存在扩展性不足的问题。例如，未来可能需要增加新的角色或审核状态时，修改 `ENUM` 类型会导致重建表，因此更灵活的做法是将这些状态字段提取到独立的参照表中（如 `user_roles` 和 `audit_statuses`），并通过外键关联。

#### 1.3 **NULL 与 默认值：**

- **`deleted_at` 字段使用了 `NULL` 值**：逻辑删除通过 `deleted_at` 字段来标记。使用 `NULL` 标识删除状态是一种好的做法，因为它可以保留删除的数据，用于未来可能的恢复或者审计。
- **`comment_count`, `like_count`, `favorite_count` 初始值为 0**：这种设计可以避免初次查询时的 `NULL` 值处理，同时提高了查询和统计效率，避免了 NULL 值引发的额外计算。

### 2. **外键设计：**

#### 2.1 **外键的使用：**

- 外键约束在设计中有助于保证数据的完整性。例如，`travel_logs` 表中的 `user_id` 外键关联 `users` 表。这确保了删除用户时，相关游记记录的引用完整性，但没有设计级联删除（`ON DELETE CASCADE`）。考虑到业务需求，可能需要添加适当的外键级联操作，以确保删除用户时，相关数据（如游记、评论等）能够被级联删除（或标记删除），从而避免孤立数据。

  ```sql
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE
  ```

#### 2.2 **外键索引：**

- 外键自动为关联字段创建索引，在查询时有助于提升性能。对于 `travel_logs`、`comments`、`likes` 等表的外键（如 `user_id`、`log_id`）创建索引，有助于提高查询效率。

### 3. **索引设计：**

#### 3.1 **常用查询字段的索引：**

- 设计中已经涵盖了常见的查询字段（如 `user_id`、`log_id`、`status` 等）的索引。为了优化查询性能，我们可以对这些字段进一步优化，尤其是在高并发场景下。常见的查询，如查看用户发布的游记、游记的点赞、收藏、评论等，通常会根据 `user_id`, `status`, `created_at` 等字段进行过滤，因此可以考虑创建更多的复合索引。

  ```sql
  CREATE INDEX idx_user_status ON `travel_logs` (`user_id`, `status`);
  CREATE INDEX idx_log_created_at ON `travel_logs` (`log_id`, `created_at`);
  ```

#### 3.2 **针对查询频繁的表创建复合索引：**

- 如果某些查询中涉及多列的联合过滤条件（例如，`user_id` 和 `status` 联合查询），可以创建复合索引来提高查询效率。例如：

  ```sql
  CREATE INDEX idx_user_id_status ON `travel_logs` (`user_id`, `status`);
  ```

#### 3.3 **`JSON` 类型字段的优化：**

- `travel_logs` 表中的 `image_urls` 字段使用了 `JSON` 类型。`JSON` 数据类型灵活方便，但对于频繁查询或涉及 `image_urls` 内容过滤的情况，可能会造成性能瓶颈。为了更高效的查询，考虑将 `image_urls` 中的部分数据（如主图片）单独提取出来作为普通字段存储，减少对 `JSON` 类型字段的查询。

### 4. **触发器设计：**

#### 4.1 **触发器优化：**

- **自动更新计数字段**：现有设计中使用了触发器来更新游记的 `comment_count`、`like_count` 和 `favorite_count` 字段。通过触发器，用户在添加评论、点赞或收藏时，自动更新游记的统计信息，避免了额外的查询和更新操作。
- **性能考量**：触发器虽然方便，但在数据量大的时候可能会成为性能瓶颈。例如，当评论量和点赞量非常大时，触发器可能导致大量的表更新。优化触发器时，可以考虑使用批量更新策略，或定期使用后台任务（如 CRON 作业）来进行批量更新，而不是每次插入操作时都更新。

#### 4.2 **触发器的可维护性**：

- 触发器使得表结构与业务逻辑分离，增强了可维护性。如果有业务逻辑变动（例如评论不再更新 `comment_count` 字段），只需修改触发器而不需要修改表结构或应用层代码。

### 5. **可维护性提升：**

#### 5.1 **表设计中的注释：**

- 每个表和字段都提供了详细的注释，有助于后续开发人员理解数据模型及其目的。注释可以减少数据库表结构理解的难度，特别是在多人协作的项目中。

#### 5.2 **分表与分库：**

- 目前的设计适合单机数据库，但当数据量极大时（例如，百万级别的用户和游记），可能会导致性能问题。此时，可以考虑 **分表** 和 **分库** 策略：
  - 例如，将 `travel_logs` 按 `user_id` 或 `created_at` 切分为多个表，减小单表的记录量，提升查询效率。
  - 使用 **水平分割** 或 **垂直分割** 的方式将不同的表分布到不同的数据库实例中，提高系统的水平扩展性。

#### 5.3 **抽象化设计：**

- 如果涉及多种不同的业务逻辑（如权限控制、数据清理等），可以通过 **视图（views）** 和 **存储过程（stored procedures）** 来抽象出复杂的 SQL 逻辑。这样做可以减少代码重复，提高业务逻辑的可复用性和可维护性。

------

### 总结：

现有的设计在性能和可维护性上已经考虑了多方面的优化：

- **性能优化**：通过合理的字段设计、外键约束、索引和触发器来提高查询效率和保证数据一致性。
- **可维护性**：通过注释、外键约束、分表分库等策略，提高了系统的可扩展性和后期的维护便利性。

但随着数据量的增长，系统可能会面临性能瓶颈，届时可以通过数据库分区、分表分库、以及缓存等技术来进一步优化性能。

问题：服务器问题？利用已有服务器？租赁？  资源存储问题 mdn存储？ 

grant all privileges on *.* to 'user1'@'%' identified by 'jegdbhsgfsg1!' with grant option;

docker run -p 80:80 --name nginx -v /home/nginx/conf/nginx.conf:/etc/nginx/nginx.conf -v /home/nginx/conf/conf.d:/etc/nginx/conf.d -v /home/nginx/log:/var/log/nginx -v /home/nginx/html:/usr/share/nginx/html -d nginx:latest
————————————————

                            版权声明：本文为博主原创文章，遵循 CC 4.0 BY-SA 版权协议，转载请附上原文出处链接和本声明。

原文链接：https://blog.csdn.net/qq_56046190/article/details/140213674

## 简化部署方案

如果您的服务器上已经有MySQL和Nginx容器，可以使用我们的简化部署方案：

### 准备工作

1. 确保您有正在运行的MySQL容器和Nginx容器
2. 确定MySQL容器的名称和所属的Docker网络
3. 确定Nginx配置文件的存放目录

### 部署步骤

#### Windows环境

在PowerShell中运行：

```powershell
# 运行PowerShell部署脚本
./deploy-custom.ps1 -MysqlContainer "your_mysql_container" -MysqlNetwork "your_mysql_network" -NginxConfDir "C:/path/to/nginx/conf.d" -Domain "your-domain.com"

# 可选参数
# -DbUser "custom_user"           # 默认: ctrip_user
# -DbPassword "custom_password"   # 默认: 自动生成
# -DbName "custom_db_name"        # 默认: ctrip_db
# -Clean                          # 清理现有容器
```

#### Linux环境

```bash
# 赋予脚本执行权限
chmod +x deploy-custom.sh

# 运行部署脚本
./deploy-custom.sh --mysql-container=your_mysql_container_name --mysql-network=your_mysql_network_name --nginx-conf-dir=/path/to/nginx/conf.d --domain=your-domain.com
```

### 验证部署

部署完成后，可以通过以下命令检查状态：

```bash
# 查看API服务状态
docker compose -f docker-compose.custom.yml ps

# 查看API服务日志
docker compose -f docker-compose.custom.yml logs -f api

# 在浏览器中访问
http://your-domain.com/api/health
```

### 故障排除

如果部署过程中遇到问题，请检查：

1. MySQL容器是否允许远程连接
2. Docker网络设置是否正确
3. Nginx配置是否正确加载
4. 查看API服务日志中的错误信息

首次部署成功后，建议将`.env`文件中的`SYNC_MODELS`设置为`false`，避免每次启动都同步数据库结构。