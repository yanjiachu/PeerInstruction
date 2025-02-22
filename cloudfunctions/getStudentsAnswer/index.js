// cloudfunctions/getStudentAnswerForQuestion/index.js
exports.main = async (event, context) => {
  const { studentId, classId, questionId, publishCount } = event;

  try {
    // 获取数据库引用
    const db = require("wx-server-sdk");
    db.init({
      env: db.CURRENT_ENV
    });

    const _db = db.database();
    const classesCollection = _db.collection('classes');

    // 查询特定班级的题目
    const classResult = await classesCollection.doc(classId).get();
    const classData = classResult.data;

    // 找到特定题目
    const question = classData.questions.find(q => q._id === questionId);

    if (!question) {
      return { success: false, error: 'Question not found' };
    }

    // 检查 publishCount 是否有效
    if (publishCount < 1 || publishCount > question.studentAnswers.length) {
      return { success: false, error: 'Invalid publish count' };
    }

    // 获取用户在指定发布次数后的作答记录
    const studentAnswerArray = question.studentAnswers[publishCount - 1];
    const userAnswer = studentAnswerArray ? studentAnswerArray.find(answer => answer.studentId === studentId) : null;

    const answer = userAnswer ? userAnswer.answer : '您未作答';

    return { success: true, answer };
  } catch (error) {
    console.error('Error getting user answer for question:', error);
    return { success: false, error: error.message };
  }
};