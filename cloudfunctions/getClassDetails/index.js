// 引入必要的模块
const cloud = require('wx-server-sdk');

// 初始化云开发环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV // 使用当前环境
});

// 导出一个名为 getClassInfo 的云函数
exports.main = async (event, context) => {
  const { classId } = event; // 从请求参数中获取 classId

  try {
    // 从 classes 集合中查询指定的班级信息
    const result = await cloud.database().collection('classes')
      .where({
        _id: classId // 假设 classId 是集合中的主键
      })
      .get();

    if (result.data.length > 0) {
      // 如果找到了班级信息，返回班级名称
      return {
        success: true,
        res: result.data
      };
    } else {
      // 如果没有找到课堂信息，返回错误信息
      return {
        success: false,
        error: '未找到对应的课堂信息'
      };
    }
  } catch (err) {
    // 捕获并返回任何发生的错误
    return {
      success: false,
      error: err.message || '查询失败'
    };
  }
};