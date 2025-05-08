/**
 * 统一API响应格式化工具
 */

// 成功响应
const success = (res, data = null, message = '操作成功', statusCode = 200) => {
  return res.status(statusCode).json({
    status: 'success',
    code: statusCode,
    message,
    data
  });
};

// 错误响应
const error = (res, message = '操作失败', statusCode = 400, errorCode = null, errorDetails = null) => {
  const response = {
    status: 'error',
    code: statusCode,
    message
  };
  
  if (errorCode) {
    response.errorCode = errorCode;
  }
  
  if (errorDetails) {
    response.details = errorDetails;
  }
  
  return res.status(statusCode).json(response);
};

// 分页数据响应
const paginate = (res, items, count, page, limit, message = '获取数据成功', statusCode = 200) => {
  return res.status(statusCode).json({
    status: 'success',
    code: statusCode,
    message,
    data: {
      items,
      pagination: {
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit)
      }
    }
  });
};

// 创建响应
const created = (res, data = null, message = '创建成功') => {
  return success(res, data, message, 201);
};

// 无内容响应
const noContent = (res) => {
  return res.status(204).end();
};

// 中间件：统一API响应格式化
const responseMiddleware = (req, res, next) => {
  // 扩展response对象，添加快捷方法
  res.success = function(data, message, statusCode) {
    return success(res, data, message, statusCode);
  };
  
  res.error = function(message, statusCode, errorCode, errorDetails) {
    return error(res, message, statusCode, errorCode, errorDetails);
  };
  
  res.paginate = function(items, count, page, limit, message, statusCode) {
    return paginate(res, items, count, page, limit, message, statusCode);
  };
  
  res.created = function(data, message) {
    return created(res, data, message);
  };
  
  res.noContent = function() {
    return noContent(res);
  };
  
  next();
};

module.exports = {
  responseMiddleware,
  success,
  error,
  paginate,
  created,
  noContent
}; 