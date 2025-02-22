const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV // 使用当前环境
});
const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const classId = event.classId;
  console.log('Received classId:', classId);

  try {
    // 从 classes 集合中获取指定 classId 的文档
    const classRes = await db.collection('classes').doc(classId).get();
    console.log('Fetched class document:', classRes.data);

    // 获取 questions 数组
    const questions = classRes.data.questions || [];
    if (!Array.isArray(questions)) {
      console.error('questions is not an array');
      return {
        error: 'questions is not an array'
      };
    }

    console.log('Initial questions:', questions);

    // 过滤出可见问题的 ID
    const visibleQuestionIds = questions
      .filter(q => q && q.ans_is_visible && q.question_id) // 确保 q 存在并且有 ans_is_visible 和 question_id 属性
      .map(q => q.question_id); // 提取每个答完的问题的 question_id

    console.log('Visible question IDs:', visibleQuestionIds);

    if (visibleQuestionIds.length === 0) {
      console.log('No visible questions found');
      return {
        questions: []
      };
    }

    // 根据 visibleQuestionIds 查询 question 集合
    const questionRes = await db.collection('question').where({
      _id: db.command.in(visibleQuestionIds)
    }).get();

    console.log('Fetched question documents:', questionRes.data);

    // 返回查询结果
    return {
      questions: questionRes.data
    };
  } catch (err) {
    console.error('Error:', err);
    return {
      error: err.message
    };
  }
};