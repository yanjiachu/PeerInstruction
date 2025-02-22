const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const usersCollection = db.collection('users');

exports.main = async (event, context) => {
  const {
    username,
    password,
    userType
  } = event;

  try {
    // 根据用户名和用户类型查找用户
    const user = await usersCollection.where({
      username,
      userType
    }).get();

    if (user.data.length === 0) {
      return {
        success: false,
        message: '用户不存在'
      };
    }

    // 检查密码是否匹配
    if (user.data[0].password !== password) {
      return {
        success: false,
        message: '密码错误'
      };
    }

    // 登录成功
    return {
      success: true,
      message: '登录成功',
      data: user.data[0]
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
};