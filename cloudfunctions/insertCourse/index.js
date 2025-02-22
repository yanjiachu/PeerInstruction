const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const { courseName, description, teacher, isPublic } = event;

  // 校验必填字段
  if (!courseName || !description) {
    return {
      success: false,
      message: '课程名称和课程描述不能为空',
    };
  }

  // 生成随机9位纯数字ID
  const generateRandomID = () => {
    return Math.floor(100000000 + Math.random() * 900000000).toString();
  };

  // 检查数据库中是否已存在该ID
  const checkUniqueID = async (id) => {
    const res = await db.collection('courses').where({ _id: id }).get();
    return res.data.length === 0; // 如果不存在返回 true
  };

  // 获取唯一的 _id
  let _id;
  while (true) {
    _id = generateRandomID();
    const isUnique = await checkUniqueID(_id);
    if (isUnique) break;
  }

  // 构建插入数据
  const courseData = {
    _id,
    courseName,
    description,
    classIDList: [],
    teacher,
    isPublic,
    createdAt: db.serverDate(), 
  };

  try {
    // 插入数据到数据库
    await db.collection('courses').add({
      data: courseData
    });
    return {
      success: true,
      message: '课程添加成功',
      data: courseData
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: '课程添加失败',
      error,
    };
  }
}