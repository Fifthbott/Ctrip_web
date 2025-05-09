/**
 * 媒体处理工具 - 处理图片和视频压缩
 */
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
// 使用专门的ffprobe安装包
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// 设置ffmpeg和ffprobe路径
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

// 配置
const UPLOAD_PATH = process.env.UPLOAD_PATH || 'src/uploads';
// 添加进度存储
const progressTracker = new Map();
// 简化为只保留中等质量的图片配置
const IMAGE_QUALITY = { width: 800, quality: 70 };  // 中等质量 - 用于列表页

const VIDEO_QUALITY = { 
  videoBitrate: '1000k',  // 标准画质视频比特率
  audioBitrate: '128k',   // 音频比特率
  width: 720,             // 视频宽度
  format: 'mp4'           // 输出格式
};

/**
 * 处理图片 - 只生成中等质量的压缩版本
 * @param {Object} file - Multer上传的文件对象
 * @param {string} subDir - 子目录名称
 * @returns {Promise<string>} - 压缩后图片的URL
 */
const processImage = async (file, subDir = 'images') => {
  try {
    const filename = path.parse(file.filename).name;
    const ext = '.webp'; // 使用WebP格式提供更好的压缩率
    const uploadDir = path.join(process.cwd(), UPLOAD_PATH, subDir);
    
    // 确保目录存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const originalBuffer = fs.readFileSync(file.path);
    
    // 获取图片信息
    const metadata = await sharp(originalBuffer).metadata();
    
    // 只生成中等质量的图片
    // 只生成小于原图的尺寸
    const targetWidth = Math.min(IMAGE_QUALITY.width, metadata.width);
    const outputPath = path.join(uploadDir, `${filename}${ext}`);
    
    await sharp(originalBuffer)
      .resize(targetWidth)
      .webp({ quality: IMAGE_QUALITY.quality })
      .toFile(outputPath);
    
    // 删除原始上传文件
    fs.unlinkSync(file.path);
    
    // 返回压缩后图片的相对路径
    return `${filename}${ext}`;
  } catch (error) {
    console.error('图片处理失败:', error);
    throw new Error(`图片处理失败: ${error.message}`);
  }
};

/**
 * 处理单个头像图片
 * @param {Object} file - Multer上传的文件对象
 * @returns {Promise<string>} - 处理后的头像URL
 */
const processAvatar = async (file) => {
  try {
    const filename = path.parse(file.filename).name;
    const ext = '.webp';
    const uploadDir = path.join(process.cwd(), UPLOAD_PATH, 'avatars');
    
    // 确保目录存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // 生成标准头像尺寸 (200x200)
    const avatarPath = path.join(uploadDir, `${filename}${ext}`);
    
    await sharp(file.path)
      .resize(200, 200, { fit: 'cover', position: 'center' })
      .webp({ quality: 80 })
      .toFile(avatarPath);
    
    // 删除原始上传文件
    fs.unlinkSync(file.path);
    
    // 返回头像的相对路径
    return `${filename}${ext}`;
  } catch (error) {
    console.error('头像处理失败:', error);
    throw new Error(`头像处理失败: ${error.message}`);
  }
};

/**
 * 处理视频 - 只生成标准质量视频
 * @param {Object} file - Multer上传的文件对象
 * @param {Boolean} quickResponse - 是否快速响应（默认为false，即等待处理完成后响应）
 * @returns {Promise<Object>} - 包含视频URL的对象
 */
const processVideo = async (file, quickResponse = false) => {
  try {
    const filename = path.parse(file.filename).name;
    const processId = uuidv4();
    const uploadDir = path.join(process.cwd(), UPLOAD_PATH, 'videos');
    const tempDir = path.join(process.cwd(), UPLOAD_PATH, 'temp');
    
    // 确保目录存在
    [uploadDir, tempDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
    
    // 使用UUID生成唯一处理后文件名
    const processedId = uuidv4().slice(0, 8);
    const processedFilename = `${filename}_${processedId}`;
    const config = VIDEO_QUALITY;
    const outputPath = path.join(uploadDir, `${processedFilename}.${config.format}`);
    
    // 初始化进度跟踪
    progressTracker.set(processId, {
      status: 'preparing',
      progress: 0,
      message: '准备处理视频...',
      created_at: new Date(),
      filename: processedFilename
    });
    
    // 为确保安全，先将原始文件复制到临时目录
    const tempFilePath = path.join(tempDir, `${filename}_temp.mp4`);
    fs.copyFileSync(file.path, tempFilePath);
    
    // 尝试删除原始上传文件
    try {
      fs.unlinkSync(file.path);
    } catch (err) {
      console.warn('无法删除原始上传文件:', err.message);
      // 继续处理，不中断流程
    }
    
    // 如果需要快速响应
    if (quickResponse) {
      // 在后台继续处理视频
      processVideoInBackground(tempFilePath, outputPath, processedFilename, config, processId);
      
      // 立即返回处理中的响应
      return {
        video_url: `${processedFilename}.${config.format}`,
        status: 'processing',
        process_id: processId
      };
    }
    
    // 返回的Promise会在视频处理完成后resolve
    return new Promise((resolve, reject) => {
      try {
        // 更新进度
        progressTracker.set(processId, {
          status: 'processing_video',
          progress: 10,
          message: '视频处理中...',
          created_at: new Date(),
          filename: processedFilename
        });
        
        // 处理视频
        let progressPercent = 10;
        ffmpeg(tempFilePath)
          .outputOptions([
            `-c:v libx264`,               // 使用H.264编码器
            `-crf 28`,                    // 恒定速率因子 (较高的值 = 较低的质量)
            `-preset medium`,             // 编码速度/压缩率的权衡
            `-c:a aac`,                   // 音频编码为AAC
            `-b:a ${config.audioBitrate}`,// 音频比特率
            `-vf scale=${config.width}:-2` // 调整视频大小，保持宽高比
          ])
          .output(outputPath)
          .on('progress', (progress) => {
            if (progress.percent) {
              // 视频处理进度从10%到100%
              progressPercent = 10 + Math.min(Math.floor(progress.percent), 100) * 0.9;
              progressTracker.set(processId, {
                status: 'processing_video',
                progress: progressPercent,
                message: `视频处理中 ${Math.floor(progress.percent)}%...`,
                created_at: new Date(),
                filename: processedFilename
              });
            }
          })
          .on('end', () => {
            // 删除临时文件
            try {
              fs.unlinkSync(tempFilePath);
            } catch (err) {
              console.warn('无法删除临时文件:', err.message);
            }
            
            // 更新进度为完成
            progressTracker.set(processId, {
              status: 'completed',
              progress: 100,
              message: '处理完成',
              created_at: new Date(),
              filename: processedFilename
            });
            
            // 定时清理进度信息（30分钟后）
            setTimeout(() => {
              if (progressTracker.has(processId)) {
                progressTracker.delete(processId);
              }
            }, 30 * 60 * 1000);
            
            resolve({
              video_url: `${processedFilename}.${config.format}`,
              status: 'completed',
              process_id: processId
            });
          })
          .on('error', (err) => {
            // 更新进度状态
            progressTracker.set(processId, { 
              status: 'error', 
              progress: 0, 
              message: '视频处理失败',
              error: err.message 
            });
            
            // 删除临时文件
            try {
              fs.unlinkSync(tempFilePath);
            } catch (error) {
              console.warn('无法删除临时文件:', error.message);
            }
            
            console.error('视频处理失败:', err);
            reject(new Error(`视频处理失败: ${err.message}`));
          })
          .run();
      } catch (error) {
        // 更新进度状态
        progressTracker.set(processId, { 
          status: 'error', 
          progress: 0, 
          message: '处理过程发生错误',
          error: error.message 
        });
        
        reject(error);
      }
    });
  } catch (error) {
    console.error('视频处理失败:', error);
    throw new Error(`视频处理失败: ${error.message}`);
  }
};

/**
 * 在后台处理视频 - 不阻塞主流程
 * @param {string} inputPath - 输入视频路径
 * @param {string} outputPath - 输出视频路径
 * @param {string} processedFilename - 处理后的文件名
 * @param {Object} config - 视频配置
 * @param {string} processId - 进度跟踪ID
 */
const processVideoInBackground = (inputPath, outputPath, processedFilename, config, processId) => {
  // 创建一个后台处理过程
  (async () => {
    try {
      // 更新进度
      progressTracker.set(processId, {
        status: 'processing_video',
        progress: 10,
        message: '视频处理中...',
        created_at: new Date(),
        filename: processedFilename
      });
      
      // 处理视频
      let progressPercent = 10;
      await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .outputOptions([
            `-c:v libx264`,               // 使用H.264编码器
            `-crf 28`,                    // 恒定速率因子
            `-preset medium`,             // 编码速度/压缩率的权衡
            `-c:a aac`,                   // 音频编码为AAC
            `-b:a ${config.audioBitrate}`,// 音频比特率
            `-vf scale=${config.width}:-2` // 调整视频大小，保持宽高比
          ])
          .output(outputPath)
          .on('progress', (progress) => {
            if (progress.percent) {
              // 视频处理进度从10%到100%
              progressPercent = 10 + Math.min(Math.floor(progress.percent), 100) * 0.9;
              progressTracker.set(processId, {
                status: 'processing_video',
                progress: progressPercent,
                message: `视频处理中 ${Math.floor(progress.percent)}%...`,
                created_at: new Date(),
                filename: processedFilename
              });
            }
          })
          .on('end', resolve)
          .on('error', reject)
          .run();
      });
      
      // 删除临时文件
      try {
        fs.unlinkSync(inputPath);
      } catch (err) {
        console.warn('无法删除临时文件:', err.message);
      }
      
      // 更新进度为完成
      progressTracker.set(processId, {
        status: 'completed',
        progress: 100,
        message: '处理完成',
        created_at: new Date(),
        filename: processedFilename
      });
      
      // 定时清理进度信息（30分钟后）
      setTimeout(() => {
        if (progressTracker.has(processId)) {
          progressTracker.delete(processId);
        }
      }, 30 * 60 * 1000);
    } catch (error) {
      // 更新进度状态
      progressTracker.set(processId, { 
        status: 'error', 
        progress: 0, 
        message: '视频处理失败',
        error: error.message 
      });
      
      console.error('后台视频处理失败:', error);
      
      // 删除临时文件
      try {
        fs.unlinkSync(inputPath);
      } catch (err) {
        console.warn('无法删除临时文件:', err.message);
      }
    }
  })();
};

/**
 * 获取视频处理进度
 * @param {string} processId - 进度跟踪ID
 * @returns {Object|null} - 进度信息
 */
const getVideoProcessProgress = (processId) => {
  return progressTracker.get(processId) || null;
};

module.exports = {
  processImage,
  processAvatar,
  processVideo,
  getVideoProcessProgress
}; 