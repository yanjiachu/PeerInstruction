const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const usersCollection = db.collection('users');

// 云函数入口函数
exports.main = async (event, context) => {
  const { userID, name, email } = event

  try {
    // 更新用户信息
    await usersCollection.where({
      _id: userID
    }).update({
      data: {
        name: name,
        email: email
      }
    })

    return {
      success: true,
      message: '用户信息更新成功'
    }
  } catch (err) {
    return {
      success: false,
      message: '用户信息更新失败',
      error: err
    }
  }
}