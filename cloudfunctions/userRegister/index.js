// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
}) // 使用当前云环境

const db = cloud.database();
const usersCollection = db.collection('users');

exports.main = async (event, context) => {
  const { username, password, name, email, userType } = event;

  try {
    // 检查用户是否已存在
    const existingUser = await usersCollection.where({ username }).get();
    if (existingUser.data.length > 0) {
      return {
        success: false,
        message: '用户已存在'
      };
    }

    // 创建新用户
    const result = await usersCollection.add({
      data: {
        username,
        password, // 实际应用中应加密存储密码
        name,
        email,
        userType,
        createdAt: db.serverDate()
      }
    });

    return {
      success: true,
      message: '注册成功',
      data: result
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
};