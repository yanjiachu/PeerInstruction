const cloud = require("wx-server-sdk");

cloud.init();

exports.main = async (event) => {
  const db = cloud.database();
  const { courseID } = event;

  try {
    const result = await db.collection('files')
      .where({
        courseID: courseID,
        isDeleted: false
      })
      .get()  // 获取查询结果
  
      // 返回查询结果
      return result.data
    } catch (err) {
      console.error('查询失败:', err)
      return {
        error: '查询失败',
        details: err
      }
    }    
};
