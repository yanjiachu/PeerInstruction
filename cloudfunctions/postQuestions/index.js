// 引入云开发模块
const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV // 使用当前云环境
});

// 获取数据库引用
const db = cloud.database();
const _ = db.command;

// 定义云函数
exports.main = async (event, context) => {
  const {
    classId,
    teacherId,
    questionId,
    postNumber,
    questionPostTime,
    questionDeadLine
  } = event; // 解结构出传入的参数

  try {
    // 获取课堂信息
    const classInfo = await db.collection('classes')
      .doc(classId)
      .get();

    if (!classInfo.data) {
      // 课堂不存在
    }

    const classData = classInfo.data;

    // 检查教师ID是否匹配
    if (classData.teacher_id !== teacherId) {
      // 教师ID不匹配
    }

    // 找到对应的题目
    const questionIndex = classData.questions.findIndex(q => q.question_id === questionId);

    if (questionIndex === -1) {
      // 题目ID无效
    }

    // 更新题目的第postNumber次提交的信息
    const postInfoPath = `questions.${questionIndex}.postInfo[${postNumber}]`;
    const updateData = {
      [postInfoPath]: {
        isPosted: true,
        isEnd: false,
        postTime: new Date(questionPostTime),
        deadLine: new Date(questionDeadLine)
      },
      teacherUpdateTime: new Date() // 更新教师更新时间
    };

    // 更新课堂记录
    await db.collection('classes')
      .doc(classId)
      .update({
        data: updateData
      });

    // 返回结果
  } catch (err) {
    console.error(err);
    return {
      success: false,
      message: '题目发布失败，请重试！',
      error: err.message
    };
  }
};