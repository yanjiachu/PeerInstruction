// 引入云开发初始化模块
const cloud = require('wx-server-sdk');

// 初始化云开发环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV // 使用当前环境
});

// 获取数据库引用
const db = cloud.database();

// 导出云函数
exports.main = async (event, context) => {
  const { classId } = event;

  try {
    // 更新课堂状态为结束
    await db.collection('classes').doc(classId).update({
      data: {
        status: false,
        endTime: new Date().toISOString() // 设置结束时间为当前时间
      }
    });

    // 返回成功消息
    return {
      success: true,
      message: '课堂结束成功'
    };
  } catch (err) {
    // 返回错误信息
    return {
      success: false,
      message: '课堂结束失败',
      error: err
    };
  }
};