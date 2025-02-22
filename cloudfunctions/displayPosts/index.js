// 云函数入口文件
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });  // 使用当前云环境
const db = cloud.database();
const postsCollection = db.collection('posts');  // 集合名称为 posts

// 云函数入口函数
exports.main = async (event, context) => {
  const { pageSize = 10, pageIndex = 0, courseID } = event;

  try {
    // 构建查询条件
    let query = postsCollection.where({
      deleted: false  // 只获取未删除的帖子
    });

    // 如果传入了 courseID，则按课程筛选
    if (courseID) {
      query = query.where({
        courseId: courseID
      });
    }

    // 执行查询
    const res = await query
      .orderBy('timestamp', 'desc')   // 按日期降序排列，确保最新帖子在最前
      .skip(pageIndex * pageSize)     // 跳过前面的数据
      .limit(pageSize)                // 每次只获取 pageSize 条数据
      .get();

    return {
      success: true,
      data: res.data                   // 返回数据
    };
  } catch (error) {
    return {
      success: false,
      message: '获取数据失败',
      error: error
    };
  }
};