# 旅游笔记服务 API 文档

## 基础信息

- **基础URL**: `/api`
- **版本**: 1.0.0
- **响应格式**: JSON

所有API响应都遵循以下标准格式:

```json
{
  "status": "success|error",
  "message": "响应消息",
  "data": {
    // 响应数据
  }
}
```

对于分页接口，响应格式如下:

```json
{
  "status": "success",
  "message": "响应消息",
  "data": {
    "items": [],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "pages": 10
    }
  }
}
```

## 认证

系统使用JWT令牌进行认证。在需要认证的API中，客户端需要在请求头中添加:

```
Authorization: Bearer <token>
```

认证令牌可通过用户登录API获取。

## 基础路由

### 获取API信息

- **URL**: `/`
- **方法**: `GET`
- **描述**: 获取API服务基本信息
- **认证**: 不需要

**响应示例**:

```json
{
  "status": "success",
  "message": "旅游笔记服务已成功启动",
  "version": "1.0.0",
  "endpoints": {
    "users": "/api/users",
    "travelLogs": "/api/travel-logs",
    "audits": "/api/audits"
  }
}
```

### 健康检查

- **URL**: `/health`
- **方法**: `GET`
- **描述**: 检查API服务的健康状态
- **认证**: 不需要

**响应示例**:

```json
{
  "status": "success",
  "message": "服务正常运行",
  "timestamp": "2023-07-01T12:34:56.789Z"
}
```

## 用户接口

### 用户注册

- **URL**: `/api/users/register`
- **方法**: `POST`
- **描述**: 创建新用户账户
- **认证**: 不需要

**请求参数**:

| 参数名     | 类型   | 必填 | 描述                                              |
|------------|--------|------|---------------------------------------------------|
| username   | string | 是   | 用户名，3-20个字符，只能包含字母、数字和下划线    |
| password   | string | 是   | 密码，6-20个字符，必须包含大小写字母和数字        |
| nickname   | string | 是   | 昵称，2-20个字符                                  |
| avatar     | string | 否   | 头像URL，不提供则使用默认头像                     |

**响应示例**:

```json
{
  "status": "success",
  "message": "注册成功",
  "data": {
    "user": {
      "user_id": 1,
      "username": "example_user",
      "nickname": "旅行者",
      "avatar": "avatars/default_avatar.jpg",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 用户登录

- **URL**: `/api/users/login`
- **方法**: `POST`
- **描述**: 用户登录获取认证令牌
- **认证**: 不需要

**请求参数**:

| 参数名     | 类型   | 必填 | 描述     |
|------------|--------|------|----------|
| username   | string | 是   | 用户名   |
| password   | string | 是   | 密码     |

**响应示例**:

```json
{
  "status": "success",
  "message": "登录成功",
  "data": {
    "user": {
      "user_id": 1,
      "username": "example_user",
      "nickname": "旅行者",
      "avatar": "avatars/default_avatar.jpg",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 获取当前用户信息

- **URL**: `/api/users/me`
- **方法**: `GET`
- **描述**: 获取当前登录用户的详细信息
- **认证**: 需要

**响应示例**:

```json
{
  "status": "success",
  "data": {
    "user": {
      "user_id": 1,
      "username": "example_user",
      "nickname": "旅行者",
      "avatar": "avatars/default_avatar.jpg",
      "role": "user",
      "status": "active",
      "created_at": "2023-07-01T12:34:56.789Z"
    }
  }
}
```

### 更新当前用户信息

- **URL**: `/api/users/me`
- **方法**: `PUT`
- **描述**: 更新当前登录用户的信息
- **认证**: 需要

**请求参数**:

| 参数名     | 类型   | 必填 | 描述                                       |
|------------|--------|------|-------------------------------------------|
| nickname   | string | 否   | 昵称，2-20个字符                          |
| password   | string | 否   | 新密码，6-20个字符，必须包含大小写字母和数字 |
| avatar     | string | 否   | 头像URL                                   |

**响应示例**:

```json
{
  "status": "success",
  "message": "用户信息更新成功",
  "data": {
    "user": {
      "user_id": 1,
      "username": "example_user",
      "nickname": "新昵称",
      "avatar": "new_avatar.jpg",
      "role": "user"
    }
  }
}
```

### 获取用户列表(仅管理员)

- **URL**: `/api/users`
- **方法**: `GET`
- **描述**: 获取所有用户的列表
- **认证**: 需要(管理员权限)

**查询参数**:

| 参数名   | 类型   | 必填 | 描述                   |
|----------|--------|------|------------------------|
| page     | number | 否   | 页码，默认为1          |
| limit    | number | 否   | 每页记录数，默认为10   |

**响应示例**:

```json
{
  "status": "success",
  "data": {
    "users": [
      {
        "user_id": 1,
        "username": "example_user",
        "nickname": "旅行者",
        "avatar": "avatars/default_avatar.jpg",
        "role": "user",
        "status": "active",
        "created_at": "2023-07-01T12:34:56.789Z"
      },
      // 更多用户...
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 10,
      "pages": 5
    }
  }
}
```

## 游记接口

### 创建游记

- **URL**: `/api/travel-logs`
- **方法**: `POST`
- **描述**: 创建新的旅游游记
- **认证**: 需要

**请求参数**:

| 参数名      | 类型     | 必填 | 描述                   |
|-------------|----------|------|------------------------|
| title       | string   | 是   | 游记标题，2-100个字符  |
| content     | string   | 是   | 游记内容，至少10个字符  |
| image_urls  | string[] | 是   | 图片URL数组，至少1张图片 |
| video_url   | string   | 否   | 视频URL                |
| tags        | string[] | 否   | 标签数组               |

**响应示例**:

```json
{
  "status": "success",
  "message": "游记创建成功，等待审核",
  "data": {
    "travel_log": {
      "log_id": 1,
      "title": "北京三日游",
      "status": "pending",
      "created_at": "2023-07-01T12:34:56.789Z"
    }
  }
}
```

### 获取游记列表

- **URL**: `/api/travel-logs`
- **方法**: `GET`
- **描述**: 获取已审核通过的游记列表
- **认证**: 不需要

**查询参数**:

| 参数名   | 类型   | 必填 | 描述                   |
|----------|--------|------|------------------------|
| page     | number | 否   | 页码，默认为1          |
| limit    | number | 否   | 每页记录数，默认为10   |
| search   | string | 否   | 搜索关键词，搜索标题和作者昵称 |

**响应示例**:

```json
{
  "status": "success",
  "message": "获取游记列表成功",
  "data": {
    "items": [
      {
        "log_id": 1,
        "title": "北京三日游",
        "content": "这是一篇关于北京三日游的游记...",
        "image_urls": ["url1.jpg", "url2.jpg"],
        "video_url": "video1.mp4",
        "created_at": "2023-07-01T12:34:56.789Z",
        "comment_count": 5,
        "like_count": 10,
        "favorite_count": 3,
        "author": {
          "user_id": 1,
          "nickname": "旅行者",
          "avatar": "avatar.jpg"
        },
        "tags": [
          {"tag_id": 1, "tag_name": "北京"},
          {"tag_id": 2, "tag_name": "旅游"}
        ]
      },
      // 更多游记...
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "pages": 10
    }
  }
}
```

### 获取游记详情

- **URL**: `/api/travel-logs/:id`
- **方法**: `GET`
- **描述**: 获取单个游记的详细信息
- **认证**: 不需要

**URL参数**:

| 参数名 | 类型   | 描述   |
|--------|--------|--------|
| id     | number | 游记ID |

**响应示例**:

```json
{
  "status": "success",
  "message": "获取游记详情成功",
  "data": {
    "travel_log": {
      "log_id": 1,
      "title": "北京三日游",
      "content": "这是一篇关于北京三日游的详细游记...",
      "image_urls": ["url1.jpg", "url2.jpg"],
      "video_url": "video1.mp4",
      "created_at": "2023-07-01T12:34:56.789Z",
      "updated_at": "2023-07-02T10:11:12.789Z",
      "comment_count": 5,
      "like_count": 10,
      "favorite_count": 3,
      "author": {
        "user_id": 1,
        "nickname": "旅行者",
        "avatar": "avatar.jpg"
      },
      "tags": [
        {"tag_id": 1, "tag_name": "北京"},
        {"tag_id": 2, "tag_name": "旅游"}
      ],
      "comments": [
        {
          "comment_id": 1,
          "content": "非常精彩的游记！",
          "created_at": "2023-07-02T09:00:00.000Z",
          "author": {
            "user_id": 2,
            "nickname": "评论者",
            "avatar": "commenter.jpg"
          }
        },
        // 更多评论...
      ]
    }
  }
}
```

### 更新游记

- **URL**: `/api/travel-logs/:id`
- **方法**: `PUT`
- **描述**: 更新自己的游记信息
- **认证**: 需要

**URL参数**:

| 参数名 | 类型   | 描述   |
|--------|--------|--------|
| id     | number | 游记ID |

**请求参数**:

| 参数名      | 类型     | 必填 | 描述                   |
|-------------|----------|------|------------------------|
| title       | string   | 否   | 游记标题，2-100个字符  |
| content     | string   | 否   | 游记内容，至少10个字符  |
| image_urls  | string[] | 否   | 图片URL数组           |
| video_url   | string   | 否   | 视频URL                |
| tags        | string[] | 否   | 标签数组               |

**响应示例**:

```json
{
  "status": "success",
  "message": "游记更新成功，等待重新审核",
  "data": {
    "travel_log": {
      "log_id": 1,
      "title": "北京四日游",
      "status": "pending",
      "updated_at": "2023-07-03T12:34:56.789Z"
    }
  }
}
```

### 删除游记

- **URL**: `/api/travel-logs/:id`
- **方法**: `DELETE`
- **描述**: 删除自己的游记
- **认证**: 需要

**URL参数**:

| 参数名 | 类型   | 描述   |
|--------|--------|--------|
| id     | number | 游记ID |

**响应示例**:

```json
{
  "status": "success",
  "message": "游记删除成功"
}
```

### 获取我的游记列表

- **URL**: `/api/travel-logs/me`
- **方法**: `GET`
- **描述**: 获取当前用户的所有游记
- **认证**: 需要

**查询参数**:

| 参数名   | 类型   | 必填 | 描述                                      |
|----------|--------|------|-----------------------------------------|
| page     | number | 否   | 页码，默认为1                             |
| limit    | number | 否   | 每页记录数，默认为10                      |
| status   | string | 否   | 游记状态(pending, approved, rejected)     |

**响应示例**:

```json
{
  "status": "success",
  "message": "获取个人游记列表成功",
  "data": {
    "items": [
      {
        "log_id": 1,
        "title": "北京三日游",
        "content": "这是一篇关于北京三日游的游记内容...",
        "image_urls": ["url1.jpg", "url2.jpg"],
        "video_url": "video1.mp4",
        "cover_url": "cover1.jpg",
        "status": "rejected",
        "created_at": "2023-07-01T12:34:56.789Z",
        "updated_at": "2023-07-02T10:11:12.789Z",
        "like_count": 0,
        "comment_count": 0,
        "favorite_count": 0,
        "tags": [
          {"tag_id": 1, "tag_name": "北京"},
          {"tag_id": 2, "tag_name": "旅游"}
        ],
        "audit_info": {
          "reject_reason": "图片质量不佳，请提供更清晰的图片",
          "audit_time": "2023-07-02T15:20:30.789Z",
          "reviewer": {
            "user_id": 3,
            "nickname": "审核员A"
          }
        },
        "audit_history": [
          {
            "audit_id": 5,
            "audit_status": "rejected",
            "reason": "图片质量不佳，请提供更清晰的图片",
            "audit_time": "2023-07-02T15:20:30.789Z",
            "reviewer": {
              "user_id": 3,
              "nickname": "审核员A"
            }
          },
          {
            "audit_id": 3,
            "audit_status": "rejected",
            "reason": "内容不符合规范，请修改不当用语",
            "audit_time": "2023-07-01T18:15:20.789Z",
            "reviewer": {
              "user_id": 4,
              "nickname": "审核员B"
            }
          }
        ]
      },
      {
        "log_id": 2,
        "title": "上海两日游",
        "content": "这是一篇关于上海两日游的游记内容...",
        "image_urls": ["url3.jpg", "url4.jpg"],
        "video_url": null,
        "cover_url": "cover2.jpg",
        "status": "approved",
        "created_at": "2023-07-05T09:10:11.789Z",
        "updated_at": "2023-07-05T09:10:11.789Z",
        "like_count": 0,
        "comment_count": 0,
        "favorite_count": 0,
        "tags": [
          {"tag_id": 3, "tag_name": "上海"},
          {"tag_id": 4, "tag_name": "美食"}
        ],
        "audit_history": [
          {
            "audit_id": 8,
            "audit_status": "approved",
            "reason": null,
            "audit_time": "2023-07-05T10:30:00.789Z",
            "reviewer": {
              "user_id": 3,
              "nickname": "审核员A"
            }
          }
        ]
      }
    ],
    "pagination": {
      "total": 7,
      "page": 1,
      "limit": 10,
      "pages": 1
    }
  }
}
```

### 上传游记图片

- **URL**: `/api/travel-logs/upload-images`
- **方法**: `POST`
- **描述**: 上传游记图片
- **认证**: 需要
- **Content-Type**: `multipart/form-data`

**请求参数**:

| 参数名 | 类型   | 必填 | 描述                      |
|--------|--------|------|---------------------------|
| images | files  | 是   | 图片文件，最多10张        |

**响应示例**:

```json
{
  "status": "success",
  "message": "图片上传成功",
  "data": {
    "image_urls": [
      "/uploads/images/image1.jpg",
      "/uploads/images/image2.jpg"
    ]
  }
}
```

### 上传游记视频

- **URL**: `/api/travel-logs/upload-video`
- **方法**: `POST`
- **描述**: 上传游记视频
- **认证**: 需要
- **Content-Type**: `multipart/form-data`

**请求参数**:

| 参数名 | 类型   | 必填 | 描述      |
|--------|--------|------|-----------|
| video  | file   | 是   | 视频文件  |

**响应示例**:

```json
{
  "status": "success",
  "message": "视频上传成功",
  "data": {
    "video_url": "/uploads/videos/video1.mp4"
  }
}
```

### 游记点赞

- **URL**: `/api/travel-logs/:id/like`
- **方法**: `POST`
- **描述**: 对游记进行点赞
- **认证**: 需要

**URL参数**:

| 参数名 | 类型   | 描述   |
|--------|--------|--------|
| id     | number | 游记ID |

**响应示例**:

```json
{
  "status": "success",
  "message": "点赞成功",
  "data": {
    "like_count": 11
  }
}
```

### 取消游记点赞

- **URL**: `/api/travel-logs/:id/like`
- **方法**: `DELETE`
- **描述**: 取消对游记的点赞
- **认证**: 需要

**URL参数**:

| 参数名 | 类型   | 描述   |
|--------|--------|--------|
| id     | number | 游记ID |

**响应示例**:

```json
{
  "status": "success",
  "message": "取消点赞成功",
  "data": {
    "like_count": 10
  }
}
```

### 收藏游记

- **URL**: `/api/travel-logs/:id/favorite`
- **方法**: `POST`
- **描述**: 收藏游记
- **认证**: 需要

**URL参数**:

| 参数名 | 类型   | 描述   |
|--------|--------|--------|
| id     | number | 游记ID |

**响应示例**:

```json
{
  "status": "success",
  "message": "收藏成功",
  "data": {
    "favorite_count": 4
  }
}
```

### 取消收藏游记

- **URL**: `/api/travel-logs/:id/favorite`
- **方法**: `DELETE`
- **描述**: 取消收藏游记
- **认证**: 需要

**URL参数**:

| 参数名 | 类型   | 描述   |
|--------|--------|--------|
| id     | number | 游记ID |

**响应示例**:

```json
{
  "status": "success",
  "message": "取消收藏成功",
  "data": {
    "favorite_count": 3
  }
}
```

### 获取游记评论

- **URL**: `/api/travel-logs/:id/comments`
- **方法**: `GET`
- **描述**: 获取游记的评论列表
- **认证**: 不需要

**URL参数**:

| 参数名 | 类型   | 描述   |
|--------|--------|--------|
| id     | number | 游记ID |

**查询参数**:

| 参数名   | 类型   | 必填 | 描述                   |
|----------|--------|------|------------------------|
| page     | number | 否   | 页码，默认为1          |
| limit    | number | 否   | 每页记录数，默认为10   |

**响应示例**:

```json
{
  "status": "success",
  "message": "获取评论成功",
  "data": {
    "items": [
      {
        "comment_id": 1,
        "content": "非常精彩的游记！",
        "created_at": "2023-07-02T09:00:00.000Z",
        "author": {
          "user_id": 2,
          "nickname": "评论者",
          "avatar": "commenter.jpg"
        }
      },
      // 更多评论...
    ],
    "pagination": {
      "total": 5,
      "page": 1,
      "limit": 10,
      "pages": 1
    }
  }
}
```

## 评论接口

### 创建评论

- **URL**: `/api/comments`
- **方法**: `POST`
- **描述**: 创建游记评论
- **认证**: 需要

**请求参数**:

| 参数名    | 类型   | 必填 | 描述                              |
|-----------|--------|------|----------------------------------|
| log_id    | number | 是   | 游记ID                           |
| content   | string | 是   | 评论内容，1-500个字符             |

**响应示例**:

```json
{
  "status": "success",
  "message": "评论发布成功",
  "data": {
    "comment": {
      "comment_id": 1,
      "content": "非常精彩的游记！",
      "created_at": "2023-07-02T09:00:00.000Z",
      "author": {
        "user_id": 2,
        "nickname": "评论者",
        "avatar": "commenter.jpg"
      }
    }
  }
}
```

### 删除评论

- **URL**: `/api/comments/:id`
- **方法**: `DELETE`
- **描述**: 删除自己的评论(或管理员删除任意评论)
- **认证**: 需要

**URL参数**:

| 参数名 | 类型   | 描述   |
|--------|--------|--------|
| id     | number | 评论ID |

**响应示例**:

```json
{
  "status": "success",
  "message": "评论删除成功"
}
```

### 获取游记评论列表

- **URL**: `/api/travel-logs/:id/comments`
- **方法**: `GET`
- **描述**: 获取某篇游记的评论列表
- **认证**: 不需要

**URL参数**:

| 参数名 | 类型   | 描述   |
|--------|--------|--------|
| id     | number | 游记ID |

**查询参数**:

| 参数名 | 类型   | 必填 | 描述                 |
|--------|--------|------|---------------------|
| page   | number | 否   | 页码，默认为1        |
| limit  | number | 否   | 每页记录数，默认为10 |

**响应示例**:

```json
{
  "status": "success",
  "message": "获取评论列表成功",
  "data": {
    "items": [
      {
        "comment_id": 1,
        "content": "非常精彩的游记！",
        "created_at": "2023-07-02T09:00:00.000Z",
        "author": {
          "user_id": 2,
          "nickname": "评论者",
          "avatar": "commenter.jpg"
        }
      },
      // 更多评论...
    ],
    "pagination": {
      "total": 15,
      "page": 1,
      "limit": 10,
      "pages": 2
    }
  }
}
```

## 审核接口 (仅管理员或审核员)

### 获取待审核游记列表

- **URL**: `/api/audits/travel-logs`
- **方法**: `GET`
- **描述**: 获取待审核的游记列表
- **认证**: 需要(admin或reviewer权限)

**查询参数**:

| 参数名   | 类型   | 必填 | 描述                                        |
|----------|--------|------|---------------------------------------------|
| page     | number | 否   | 页码，默认为1                               |
| limit    | number | 否   | 每页记录数，默认为10                        |
| status   | string | 否   | 审核状态(pending, approved, rejected)        |

**响应示例**:

```json
{
  "status": "success",
  "message": "获取待审核游记列表成功",
  "data": {
    "items": [
      {
        "log_id": 1,
        "title": "北京三日游",
        "content": "这是一篇关于北京三日游的游记...",
        "image_urls": ["url1.jpg", "url2.jpg"],
        "video_url": "video1.mp4",
        "status": "pending",
        "created_at": "2023-07-01T12:34:56.789Z",
        "author": {
          "user_id": 1,
          "nickname": "旅行者",
          "avatar": "avatar.jpg"
        }
      },
      // 更多游记...
    ],
    "pagination": {
      "total": 20,
      "page": 1,
      "limit": 10,
      "pages": 2
    }
  }
}
```

### 获取待审核游记详情

- **URL**: `/api/audits/travel-logs/:id`
- **方法**: `GET`
- **描述**: 获取待审核游记的详细信息
- **认证**: 需要(admin或reviewer权限)

**URL参数**:

| 参数名 | 类型   | 描述   |
|--------|--------|--------|
| id     | number | 游记ID |

**响应示例**:

```json
{
  "status": "success",
  "message": "获取待审核游记详情成功",
  "data": {
    "travel_log": {
      "log_id": 1,
      "title": "北京三日游",
      "content": "这是一篇关于北京三日游的详细游记...",
      "image_urls": ["url1.jpg", "url2.jpg"],
      "video_url": "video1.mp4",
      "status": "pending",
      "created_at": "2023-07-01T12:34:56.789Z",
      "author": {
        "user_id": 1,
        "nickname": "旅行者",
        "avatar": "avatar.jpg"
      },
      "tags": [
        {"tag_id": 1, "tag_name": "北京"},
        {"tag_id": 2, "tag_name": "旅游"}
      ]
    },
    "audit_history": [
      {
        "audit_id": 1,
        "audit_status": "rejected",
        "reason": "图片不清晰，请重新上传",
        "auditor": {
          "user_id": 3,
          "nickname": "审核员"
        },
        "audit_time": "2023-07-01T14:00:00.000Z"
      }
    ]
  }
}
```

### 审核游记

- **URL**: `/api/audits/travel-logs/:id`
- **方法**: `POST`
- **描述**: 对游记进行审核操作
- **认证**: 需要(admin或reviewer权限)

**URL参数**:

| 参数名 | 类型   | 描述   |
|--------|--------|--------|
| id     | number | 游记ID |

**请求参数**:

| 参数名        | 类型   | 必填 | 描述                             |
|---------------|--------|------|----------------------------------|
| audit_status  | string | 是   | 审核状态(approved或rejected)      |
| reason        | string | 否   | 拒绝原因(状态为rejected时必填)    |

**响应示例**:

```json
{
  "status": "success",
  "message": "审核完成",
  "data": {
    "travel_log": {
      "log_id": 1,
      "title": "北京三日游",
      "status": "approved",
      "updated_at": "2023-07-03T12:34:56.789Z"
    },
    "audit": {
      "audit_id": 2,
      "audit_status": "approved",
      "audit_time": "2023-07-03T12:34:56.789Z"
    }
  }
}
```

### 删除游记(仅管理员)

- **URL**: `/api/audits/travel-logs/:id`
- **方法**: `DELETE`
- **描述**: 管理员删除游记
- **认证**: 需要(admin权限)

**URL参数**:

| 参数名 | 类型   | 描述   |
|--------|--------|--------|
| id     | number | 游记ID |

**响应示例**:

```json
{
  "status": "success",
  "message": "游记已永久删除"
}
```

## 错误码

| 状态码 | 说明               |
|--------|-------------------|
| 200    | 请求成功           |
| 201    | 创建成功           |
| 400    | 请求参数错误       |
| 401    | 未认证             |
| 403    | 无权限             |
| 404    | 资源不存在         |
| 422    | 数据验证失败       |
| 500    | 服务器内部错误     |

## 数据验证规则

### 用户信息验证
- 用户名: 3-20个字符，只能包含字母、数字和下划线
- 密码: 6-20个字符，必须包含大小写字母和数字
- 昵称: 2-20个字符

### 游记内容验证
- 标题: 2-100个字符
- 内容: 至少10个字符
- 图片: 至少需要一张图片

### 评论验证
- 内容: 1-500个字符

## 接口变更日志

### 1.0.0 (2023-07-01)
- 初始版本 

### 1.1.0 (2023-08-01)
- 添加评论功能接口
  - POST /api/comments - 创建评论
  - DELETE /api/comments/:id - 删除评论
  - GET /api/travel-logs/:id/comments - 获取游记评论列表 