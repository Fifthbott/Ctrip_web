// 切换标签页
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
        
        tab.classList.add('active');
        document.getElementById(tab.dataset.tab).style.display = 'block';
    });
});

// 图片预览
document.getElementById('avatar').addEventListener('change', function(e) {
    const preview = document.getElementById('avatarPreview');
    if (this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        }
        reader.readAsDataURL(this.files[0]);
    } else {
        preview.style.display = 'none';
    }
});

// 多图片预览
document.getElementById('images').addEventListener('change', function(e) {
    const container = document.getElementById('imagePreviewContainer');
    container.innerHTML = '';
    
    if (this.files && this.files.length > 0) {
        for (let i = 0; i < this.files.length; i++) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.className = 'preview';
                img.style.width = '100px';
                img.style.height = '100px';
                img.style.objectFit = 'cover';
                img.style.margin = '5px';
                container.appendChild(img);
            }
            reader.readAsDataURL(this.files[i]);
        }
    }
});

// 格式化JSON响应
function formatResponse(resultElem, data, isSuccess = true) {
    if (typeof data === 'string') {
        try {
            data = JSON.parse(data);
        } catch (e) {
            resultElem.innerHTML = `<pre class="error">${data}</pre>`;
            return;
        }
    }
    
    const statusClass = isSuccess ? 'success' : 'error';
    resultElem.innerHTML = `<pre class="${statusClass}">${JSON.stringify(data, null, 2)}</pre>`;
}

// 注册表单提交
document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const resultElem = document.getElementById('registerResult');
    resultElem.innerHTML = '<p>请求处理中...</p>';
    
    const formData = new FormData();
    formData.append('username', document.getElementById('username').value);
    formData.append('password', document.getElementById('password').value);
    formData.append('nickname', document.getElementById('nickname').value);
    
    const avatarFile = document.getElementById('avatar').files[0];
    if (avatarFile) {
        formData.append('avatar', avatarFile);
    }
    
    try {
        const response = await fetch('/api/users/register', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        formatResponse(resultElem, data, response.ok);
        
        if (response.ok) {
            // 自动填充登录表单
            document.getElementById('loginUsername').value = document.getElementById('username').value;
            // 切换到登录标签
            document.querySelector('[data-tab="login"]').click();
        }
    } catch (error) {
        formatResponse(resultElem, { error: error.message }, false);
    }
});

// 登录表单提交
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const resultElem = document.getElementById('loginResult');
    resultElem.innerHTML = '<p>请求处理中...</p>';
    
    try {
        const response = await fetch('/api/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: document.getElementById('loginUsername').value,
                password: document.getElementById('loginPassword').value
            })
        });
        
        const data = await response.json();
        formatResponse(resultElem, data, response.ok);
        
        if (response.ok && data.data?.token) {
            // 保存token并填充到上传表单
            localStorage.setItem('authToken', data.data.token);
            document.getElementById('authToken').value = `Bearer ${data.data.token}`;
            document.getElementById('videoAuthToken').value = `Bearer ${data.data.token}`;
            
            // 切换到上传标签
            document.querySelector('[data-tab="upload"]').click();
        }
    } catch (error) {
        formatResponse(resultElem, { error: error.message }, false);
    }
});

// 图片上传表单提交
document.getElementById('imageUploadForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const resultElem = document.getElementById('imageUploadResult');
    resultElem.innerHTML = '<p>请求处理中...</p>';
    
    const formData = new FormData();
    const files = document.getElementById('images').files;
    
    if (files.length === 0) {
        formatResponse(resultElem, { error: '请选择至少一个图片文件' }, false);
        return;
    }
    
    for (let i = 0; i < files.length; i++) {
        formData.append('images', files[i]);
    }
    
    try {
        const token = document.getElementById('authToken').value;
        const headers = {};
        if (token) headers['Authorization'] = token;
        
        const response = await fetch('/api/travel-logs/upload-images', {
            method: 'POST',
            headers: headers,
            body: formData
        });
        
        const data = await response.json();
        formatResponse(resultElem, data, response.ok);
    } catch (error) {
        formatResponse(resultElem, { error: error.message }, false);
    }
});

// 视频上传表单提交
document.getElementById('videoUploadForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const resultElem = document.getElementById('videoUploadResult');
    resultElem.innerHTML = '<p>请求处理中...</p>';
    
    const formData = new FormData();
    const file = document.getElementById('video').files[0];
    
    if (!file) {
        formatResponse(resultElem, { error: '请选择一个视频文件' }, false);
        return;
    }
    
    formData.append('video', file);
    
    try {
        const token = document.getElementById('videoAuthToken').value;
        const headers = {};
        if (token) headers['Authorization'] = token;
        
        const response = await fetch('/api/travel-logs/upload-video', {
            method: 'POST',
            headers: headers,
            body: formData
        });
        
        const data = await response.json();
        formatResponse(resultElem, data, response.ok);
    } catch (error) {
        formatResponse(resultElem, { error: error.message }, false);
    }
});

// 加载保存的token
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('authToken');
    if (token) {
        document.getElementById('authToken').value = `Bearer ${token}`;
        document.getElementById('videoAuthToken').value = `Bearer ${token}`;
    }
}); 