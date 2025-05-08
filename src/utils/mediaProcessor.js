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
const IMAGE_QUALITIES = {
  high: { width: 1920, quality: 80 },   // 高质量 - 用于详情页大图
  medium: { width: 800, quality: 70 },  // 中等质量 - 用于列表页
  thumb: { width: 300, quality: 60 }    // 缩略图 - 用于预览
};

const VIDEO_QUALITIES = {
  standard: { 
    videoBitrate: '1000k',  // 标准画质视频比特率
    audioBitrate: '128k',   // 音频比特率
    width: 720,             // 视频宽度
    format: 'mp4'           // 输出格式
  }
};

/**
 * 处理图片 - 生成多种尺寸的压缩版本
 * @param {Object} file - Multer上传的文件对象
 * @param {string} subDir - 子目录名称
 * @returns {Promise<Object>} - 包含各种尺寸URL的对象
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
    
    // 创建不同尺寸的图片
    const results = {};
    const originalBuffer = fs.readFileSync(file.path);
    
    // 获取图片信息
    const metadata = await sharp(originalBuffer).metadata();
    
    // 保存原始图片（如果需要）
    // 通常不建议在生产环境保留原始未处理图片，除非有特殊需求
    const originalImagePath = path.join(uploadDir, `${filename}_original${ext}`);
    await sharp(originalBuffer)
      .webp({ quality: 90 })
      .toFile(originalImagePath);
    
    results.original = `/uploads/${subDir}/${filename}_original${ext}`;
    
    // 生成不同尺寸的图片
    for (const [key, config] of Object.entries(IMAGE_QUALITIES)) {
      // 只生成小于原图的尺寸
      const targetWidth = Math.min(config.width, metadata.width);
      const outputPath = path.join(uploadDir, `${filename}_${key}${ext}`);
      
      await sharp(originalBuffer)
        .resize(targetWidth)
        .webp({ quality: config.quality })
        .toFile(outputPath);
      
      results[key] = `/uploads/${subDir}/${filename}_${key}${ext}`;
    }
    
    // 删除原始上传文件
    fs.unlinkSync(file.path);
    
    return results;
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
    
    return `/uploads/avatars/${filename}${ext}`;
  } catch (error) {
    console.error('头像处理失败:', error);
    throw new Error(`头像处理失败: ${error.message}`);
  }
};

/**
 * 处理视频 - 压缩并生成缩略图
 * @param {Object} file - Multer上传的文件对象
 * @param {Boolean} quickResponse - 是否快速响应（默认为false，即等待处理完成后响应）
 * @returns {Promise<Object>} - 包含视频URL和缩略图URL的对象
 */
const processVideo = async (file, quickResponse = false) => {
  try {
    const filename = path.parse(file.filename).name;
    const processId = uuidv4();
    const uploadDir = path.join(process.cwd(), UPLOAD_PATH, 'videos');
    const thumbDir = path.join(process.cwd(), UPLOAD_PATH, 'thumbnails');
    const coverDir = path.join(process.cwd(), UPLOAD_PATH, 'covers');
    const tempDir = path.join(process.cwd(), UPLOAD_PATH, 'temp');
    
    // 确保目录存在
    [uploadDir, thumbDir, coverDir, tempDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
    
    // 使用UUID生成唯一处理后文件名
    const processedId = uuidv4().slice(0, 8);
    const processedFilename = `${filename}_${processedId}`;
    const config = VIDEO_QUALITIES.standard;
    const outputPath = path.join(uploadDir, `${processedFilename}.${config.format}`);
    const thumbnailPath = path.join(thumbDir, `${filename}.jpg`);
    const coverPath = path.join(coverDir, `${filename}_cover.jpg`);
    
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
      processVideoInBackground(tempFilePath, outputPath, thumbnailPath, coverPath, processedFilename, config, processId);
      
      // 立即返回处理中的响应
      return {
        video_url: `/uploads/videos/${processedFilename}.${config.format}`,
        thumbnail_url: `/uploads/thumbnails/${filename}.jpg`,
        cover_url: `/uploads/covers/${filename}_cover.jpg`,
        status: 'processing',
        process_id: processId
      };
    }
    
    // 返回的Promise会在视频处理完成后resolve
    return new Promise((resolve, reject) => {
      try {
        // 更新进度
        progressTracker.set(processId, {
          status: 'extracting_cover',
          progress: 10,
          message: '提取视频封面...',
          created_at: new Date(),
          filename: processedFilename
        });
        
        // 首先提取视频封面 (从视频的中间位置)
        ffmpeg.ffprobe(tempFilePath, (err, metadata) => {
          if (err) {
            console.error('获取视频信息失败:', err);
            progressTracker.set(processId, { 
              status: 'error', 
              progress: 0, 
              message: '获取视频信息失败',
              error: err.message 
            });
            reject(new Error(`获取视频信息失败: ${err.message}`));
            return;
          }
          
          // 获取视频时长（秒）
          const duration = metadata.format.duration || 0;
          // 选择视频中间位置作为封面
          const coverTime = Math.min(Math.max(duration / 2, 0), duration).toFixed(3);
          
          // 提取封面图片
          ffmpeg(tempFilePath)
            .screenshots({
              timestamps: [coverTime],
              filename: path.basename(coverPath),
              folder: path.dirname(coverPath),
              size: '800x?'
            })
            .on('end', () => {
              // 更新进度
              progressTracker.set(processId, {
                status: 'processing_video',
                progress: 20,
                message: '视频处理中...',
                created_at: new Date(),
                filename: processedFilename
              });
              
              // 然后处理视频
              let progressPercent = 20;
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
                    // 视频处理进度从20%到80%
                    progressPercent = 20 + Math.min(Math.floor(progress.percent), 100) * 0.6;
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
                  // 更新进度
                  progressTracker.set(processId, {
                    status: 'generating_thumbnail',
                    progress: 80,
                    message: '生成缩略图...',
                    created_at: new Date(),
                    filename: processedFilename
                  });
                  
                  // 最后生成缩略图 (从视频的1秒位置)
                  ffmpeg(tempFilePath)
                    .screenshots({
                      timestamps: ['00:00:01.000'],
                      filename: path.basename(thumbnailPath),
                      folder: path.dirname(thumbnailPath),
                      size: '300x?'
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
                        video_url: `/uploads/videos/${processedFilename}.${config.format}`,
                        thumbnail_url: `/uploads/thumbnails/${filename}.jpg`,
                        cover_url: `/uploads/covers/${filename}_cover.jpg`,
                        status: 'completed',
                        process_id: processId
                      });
                    })
                    .on('error', (err) => {
                      // 更新进度状态
                      progressTracker.set(processId, { 
                        status: 'error', 
                        progress: 0, 
                        message: '缩略图生成失败',
                        error: err.message 
                      });
                      
                      // 删除临时文件
                      try {
                        fs.unlinkSync(tempFilePath);
                      } catch (error) {
                        console.warn('无法删除临时文件:', error.message);
                      }
                      
                      console.error('缩略图生成失败:', err);
                      reject(new Error(`缩略图生成失败: ${err.message}`));
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
            })
            .on('error', (err) => {
              // 更新进度状态
              progressTracker.set(processId, { 
                status: 'error', 
                progress: 0, 
                message: '视频封面提取失败',
                error: err.message 
              });
              
              console.error('视频封面提取失败:', err);
              reject(new Error(`视频封面提取失败: ${err.message}`));
            });
        });
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
 * @param {string} thumbnailPath - 缩略图路径
 * @param {string} coverPath - 封面图路径
 * @param {string} processedFilename - 处理后的文件名
 * @param {Object} config - 视频配置
 * @param {string} processId - 进度跟踪ID
 */
const processVideoInBackground = (inputPath, outputPath, thumbnailPath, coverPath, processedFilename, config, processId) => {
  // 创建一个后台处理过程
  (async () => {
    try {
      // 更新进度
      progressTracker.set(processId, {
        status: 'extracting_cover',
        progress: 10,
        message: '提取视频封面...',
        created_at: new Date(),
        filename: processedFilename
      });
      
      // 首先获取视频信息
      const getMetadata = () => {
        return new Promise((resolve, reject) => {
          ffmpeg.ffprobe(inputPath, (err, metadata) => {
            if (err) reject(err);
            else resolve(metadata);
          });
        });
      };
      
      const metadata = await getMetadata();
      // 获取视频时长（秒）
      const duration = metadata.format.duration || 0;
      // 选择视频中间位置作为封面
      const coverTime = Math.min(Math.max(duration / 2, 0), duration).toFixed(3);
      
      // 提取封面图片
      await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .screenshots({
            timestamps: [coverTime],
            filename: path.basename(coverPath),
            folder: path.dirname(coverPath),
            size: '800x?'
          })
          .on('end', resolve)
          .on('error', reject);
      });
      
      // 更新进度
      progressTracker.set(processId, {
        status: 'processing_video',
        progress: 20,
        message: '视频处理中...',
        created_at: new Date(),
        filename: processedFilename
      });
      
      // 处理视频
      let progressPercent = 20;
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
              // 视频处理进度从20%到80%
              progressPercent = 20 + Math.min(Math.floor(progress.percent), 100) * 0.6;
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
      
      // 更新进度
      progressTracker.set(processId, {
        status: 'generating_thumbnail',
        progress: 80,
        message: '生成缩略图...',
        created_at: new Date(),
        filename: processedFilename
      });
      
      // 生成视频缩略图
      await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .screenshots({
            timestamps: ['00:00:01.000'],
            filename: path.basename(thumbnailPath),
            folder: path.dirname(thumbnailPath),
            size: '300x?'
          })
          .on('end', resolve)
          .on('error', reject);
      });
      
      // 更新进度为完成
      progressTracker.set(processId, {
        status: 'completed',
        progress: 100,
        message: '处理完成',
        created_at: new Date(),
        filename: processedFilename
      });
      
      console.log('后台视频处理完成:', outputPath);
      
      // 删除临时文件
      fs.unlinkSync(inputPath);
      console.log('后台处理完成，临时文件已删除');
      
      // 定时清理进度信息（30分钟后）
      setTimeout(() => {
        if (progressTracker.has(processId)) {
          progressTracker.delete(processId);
        }
      }, 30 * 60 * 1000);
    } catch (error) {
      console.error('后台视频处理失败:', error);
      
      // 更新进度状态
      progressTracker.set(processId, { 
        status: 'error', 
        progress: 0, 
        message: error.message,
        error: error.message 
      });
      
      // 尝试删除临时文件
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
 * @param {string} processId - 处理ID
 * @returns {Object|null} - 处理进度信息
 */
const getVideoProcessProgress = (processId) => {
  if (progressTracker.has(processId)) {
    return progressTracker.get(processId);
  }
  return null;
};

/**
 * 生成缩略图
 * @param {string} videoPath - 视频文件路径
 * @returns {Promise<string>} - 缩略图URL
 */
const generateVideoThumbnail = async (videoPath) => {
  try {
    const filename = `${uuidv4()}`;
    const thumbDir = path.join(process.cwd(), UPLOAD_PATH, 'thumbnails');
    
    // 确保目录存在
    if (!fs.existsSync(thumbDir)) {
      fs.mkdirSync(thumbDir, { recursive: true });
    }
    
    const thumbnailPath = path.join(thumbDir, `${filename}.jpg`);
    
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: ['00:00:01.000'],
          filename: `${filename}.jpg`,
          folder: thumbDir,
          size: '300x?'
        })
        .on('end', () => {
          resolve(`/uploads/thumbnails/${filename}.jpg`);
        })
        .on('error', (err) => {
          console.error('缩略图生成失败:', err);
          reject(new Error(`缩略图生成失败: ${err.message}`));
        });
    });
  } catch (error) {
    console.error('缩略图生成失败:', error);
    throw new Error(`缩略图生成失败: ${error.message}`);
  }
};

module.exports = {
  processImage,
  processAvatar,
  processVideo,
  generateVideoThumbnail,
  getVideoProcessProgress,
  IMAGE_QUALITIES,
  VIDEO_QUALITIES
}; 