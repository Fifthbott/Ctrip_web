/**
 * 游记列表处理脚本
 * 负责处理游记列表的渲染和图片显示逻辑
 */

// 获取游记列表的函数
async function fetchTravelLogs(page = 1, limit = 10) {
  try {
    const response = await fetch(`/api/travel-logs?page=${page}&limit=${limit}`);
    const data = await response.json();
    
    if (data.status === 'success') {
      renderTravelLogs(data.data.travel_logs);
      renderPagination(data.data.pagination);
    } else {
      showError('获取游记列表失败');
    }
  } catch (error) {
    console.error('获取游记列表出错:', error);
    showError('获取游记列表出错，请稍后重试');
  }
}

// 渲染游记列表的函数
function renderTravelLogs(travelLogs) {
  const container = document.getElementById('travel-list-container');
  if (!container) return;
  
  // 清空容器
  container.innerHTML = '';
  
  // 遍历游记列表
  travelLogs.forEach(log => {
    // 创建游记卡片
    const card = document.createElement('div');
    card.className = 'travel-card';
    card.dataset.logId = log.log_id;
    
    // 获取封面图片URL - 优先使用cover_url，不存在则取首张图片
    const coverImage = getCoverImage(log);
    
    // 生成HTML
    card.innerHTML = `
      <div class="travel-image">
        <img src="${coverImage}" alt="${log.title}" onerror="this.src='/public/images/default-cover.webp'">
      </div>
      <div class="travel-content">
        <h3 class="travel-title">${log.title}</h3>
        <div class="travel-info">
          <span class="travel-author">${log.author ? log.author.nickname : '未知用户'}</span>
          <span class="travel-likes">❤ ${log.like_count || 0}</span>
        </div>
      </div>
    `;
    
    // 添加点击事件
    card.addEventListener('click', () => {
      window.location.href = `/travel-logs/${log.log_id}`;
    });
    
    // 添加到容器
    container.appendChild(card);
  });
}

/**
 * 获取封面图片URL - 实现逻辑：
 * 1. 优先使用cover_url
 * 2. 如果不存在cover_url，则使用image_urls数组中的第一张图片
 * 3. 如果两者都不存在，返回默认封面
 */
function getCoverImage(travelLog) {
  // 优先使用cover_url
  if (travelLog.cover_url) {
    return travelLog.cover_url;
  }
  
  // 其次使用image_urls中的第一张图片
  if (travelLog.image_urls && travelLog.image_urls.length > 0) {
    return travelLog.image_urls[0];
  }
  
  // 最后使用默认封面
  return '/public/default-cover.webp';
}

// 渲染分页的函数
function renderPagination(pagination) {
  const container = document.getElementById('pagination-container');
  if (!container) return;
  
  // 清空容器
  container.innerHTML = '';
  
  // 创建分页按钮
  for (let i = 1; i <= pagination.pages; i++) {
    const button = document.createElement('button');
    button.textContent = i;
    button.className = i === pagination.page ? 'active' : '';
    button.addEventListener('click', () => {
      fetchTravelLogs(i, pagination.limit);
    });
    container.appendChild(button);
  }
}

// 显示错误信息
function showError(message) {
  const container = document.getElementById('error-container');
  if (container) {
    container.textContent = message;
    container.style.display = 'block';
  } else {
    alert(message);
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  // 加载第一页游记列表
  fetchTravelLogs();
}); 