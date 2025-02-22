// 云函数入口文件
const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const classInfo = event.classInfo;
  const nowTime = new Date();

  let classItem = {
    courseId: classInfo.courseId,
    class_name: classInfo.class_name,
    description: classInfo.description,
    teacher_id: classInfo.teacher_id,
    location: classInfo.location,
    student_ids: classInfo.student_ids,
    created_at: nowTime,
    updated_at: nowTime,
    status: false,
    questions: classInfo.questions,
    start_time: classInfo.start_time,
    end_time: classInfo.end_time
  };

  try {
    const res = await db.collection("classes").add({
      data: classItem
    });
    if (res.errMsg == "collection.add:ok") {
      const newClassId = res._id;
      const updateRes = await db.collection("courses").where({
        _id: classItem.courseId
      }).update({
        data:{
          classIDList: db.command.push(newClassId)
        }
      });
      if (updateRes.errMsg === "collection.update:ok") {
        return {
          success: true,
          message: '课堂创建成功'
        };
      } else {
        return {
          success: false,
          message: '课堂创建成功，课程classIDList更新失败'
      };
    }
    } else {
      return {
        success: false,
        message: '课堂创建失败'
      };
    }
  } 
  catch (err) {
    return {
      success: false,
      message: err
    };
  }
}