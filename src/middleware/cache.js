/**
 * 缓存控制中间件
 * 为不同类型的路由设置适当的缓存控制头
 */

// 强缓存中间件 - 为静态资源设置长期缓存
const strongCache = (req, res, next) => {
  // 设置缓存控制头，7天缓存
  res.set({
    'Cache-Control': 'public, max-age=604800, immutable',
    'Pragma': 'public',
    'Expires': new Date(Date.now() + 604800000).toUTCString()
  });
  next();
};

// 协商缓存中间件 - 允许客户端发送条件请求，服务器决定内容是否发生变化
const negotiatedCache = (req, res, next) => {
  // 设置缓存控制头，需要重新验证
  res.set({
    'Cache-Control': 'no-cache', 
    'Pragma': 'no-cache'
  });
  next();
};

// 无缓存中间件 - 对于敏感或频繁变化的内容，禁止缓存
const noCache = (req, res, next) => {
  // 设置缓存控制头，禁止缓存
  res.set({
    'Cache-Control': 'no-store, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  next();
};

// 条件请求中间件 - 用于处理客户端的条件请求
const conditionalRequest = (req, res, next) => {
  // 获取原始的end方法
  const originalEnd = res.end;
  
  // 覆盖end方法，在响应结束前检查条件请求
  res.end = function(chunk, encoding) {
    // 如果状态码不是成功，则不处理
    if (this.statusCode !== 200) {
      return originalEnd.call(this, chunk, encoding);
    }
    
    // 获取条件请求头
    const ifNoneMatch = req.headers['if-none-match'];
    const ifModifiedSince = req.headers['if-modified-since'];
    
    // 获取响应头
    const etag = this.getHeader('etag');
    const lastModified = this.getHeader('last-modified');
    
    // 条件匹配逻辑
    if ((etag && ifNoneMatch && etag === ifNoneMatch) || 
        (lastModified && ifModifiedSince && new Date(ifModifiedSince) >= new Date(lastModified))) {
      // 清除之前设置的内容
      this.statusCode = 304;
      this.removeHeader('Content-Type');
      this.removeHeader('Content-Length');
      return originalEnd.call(this);
    }
    
    return originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

// 导出中间件
module.exports = {
  strongCache,
  negotiatedCache,
  noCache,
  conditionalRequest
}; 