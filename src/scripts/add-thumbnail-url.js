/**
 * 添加thumbnail_url字段到travel_logs表的迁移脚本
 */
const { sequelize } = require('../config/database');

async function addThumbnailUrlColumn() {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('正在检查travel_logs表是否有thumbnail_url字段...');
    
    // 检查thumbnail_url列是否存在
    const [results] = await sequelize.query(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'travel_logs' 
       AND COLUMN_NAME = 'thumbnail_url'`,
      { transaction }
    );
    
    if (results.length === 0) {
      console.log('thumbnail_url字段不存在，正在添加...');
      
      // 添加thumbnail_url列
      await sequelize.query(
        `ALTER TABLE travel_logs 
         ADD COLUMN thumbnail_url VARCHAR(255) NULL 
         COMMENT '视频缩略图URL（当有视频时使用）'`,
        { transaction }
      );
      
      console.log('成功添加thumbnail_url字段到travel_logs表');
    } else {
      console.log('thumbnail_url字段已存在，无需添加');
    }
    
    await transaction.commit();
    console.log('迁移完成');
    return true;
  } catch (error) {
    await transaction.rollback();
    console.error('迁移失败:', error);
    return false;
  }
}

// 直接执行迁移
addThumbnailUrlColumn()
  .then(result => {
    console.log('迁移结果:', result ? '成功' : '失败');
    process.exit(result ? 0 : 1);
  })
  .catch(err => {
    console.error('迁移异常:', err);
    process.exit(1);
  });