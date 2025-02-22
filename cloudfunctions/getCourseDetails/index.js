// 云函数：getCourseDetails.js
const cloud = require('wx-server-sdk')

cloud.init()

const db = cloud.database()

exports.main = async (event, context) => {
  const { courseID } = event // 获取传入的 courseID
  try {
    // 1. 查询 courses 表，获取 courseName 和 classIDList
    const courseRes = await db.collection('courses').where({
      _id: courseID
    }).get()

    if (courseRes.data.length === 0) {
      return { error: '课程不存在' }
    }

    const course = courseRes.data[0]
    const classIDList = course.classIDList || [] // 获取classID列表
    const teacherID = course.teacher.teacherID

    // 2. 查询 classes 表，根据 classIDList 获取每个 classID 的详细信息
    const classDetailsPromises = classIDList.map(classID => {
      return db.collection('classes').where({
        _id: classID
      }).get()
    })

    // 等待所有查询完成
    const classDetailsResults = await Promise.all(classDetailsPromises)

    // 3. 处理查询结果，收集 class_name 和 start_time
    const classDetails = classDetailsResults.map(result => {
      if (result.data.length > 0) {
        return {
          class_name: result.data[0].class_name,
          start_time: result.data[0].start_time,
          class_id  : result.data[0]._id,
        }
      } else {
        return null // 如果找不到该 classID 的数据
      }
    }).filter(detail => detail !== null) // 过滤掉找不到数据的项

    // 4. 返回结果
    return {
      teacherID,
      classDetails
    }

  } catch (err) {
    return {
      error: err.message
    }
  }
}
