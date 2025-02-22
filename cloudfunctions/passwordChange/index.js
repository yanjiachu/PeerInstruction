const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const usersCollection = db.collection('users');

exports.main = async (event, context) => {
  const {
    username,
    email,
    captcha,
    newPassword
  } = event;

  try {
    // 检查用户是否存在
    const user = await usersCollection.where({
      username,
      email
    }).get();

    if (user.data.length === 0) {
      return {
        success: false,
        message: '用户不存在或邮箱不匹配'
      };
    }

    // 检查验证码是否匹配
    if (user.data[0].captcha !== captcha) {
      return {
        success: false,
        message: '验证码错误'
      };
    }

    // 更新密码
    await usersCollection.where({
      username,
      email
    }).update({
      data: {
        password: newPassword
      }
    });

    return {
      success: true,
      message: '密码重置成功'
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
};