// 引入必要的模块
const cloud = require('wx-server-sdk');

// 初始化云开发环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV // 使用当前环境
});

// 获取数据库引用
const db = cloud.database();

// 主处理函数
exports.main = async (event, context) => {
  // 输出接收到的事件数据
  console.log('Received event:', JSON.stringify(event));

  // 检查 event.data 是否存在，如果不存在，尝试直接从 event 中获取数据
  const eventData = event.data || event;

  // 检查 eventData 是否存在
  if (!eventData) {
    console.error('No data provided in the request');
    return { success: false, message: 'No data provided in the request' };
  }

  const { classId, questionId, answer, studentId } = eventData;

  try {
    // 获取指定班级的文档
    const classDoc = await db.collection('classes').doc(classId).get();
    const classData = classDoc.data;

    // 检查班级是否存在
    if (!classData) {
      console.error('Class not found:', classId);
      return { success: false, message: 'Class not found' };
    }

    // 找到对应的问题
    const question = classData.questions.find(q => q.question_id === questionId);

    if (!question) {
      console.error('Question not found:', questionId);
      return { success: false, message: 'Question not found' };
    }

    // 确保 publishCount 存在
    if (typeof question.publishcount !== 'number') {
      question.publishcount = 0;
    }

    // 确保 studentAnswers 是一个数组
    if (!Array.isArray(question.studentAnswers)) {
      question.studentAnswers = [];
    }

    // 获取当前 publishCount
    const publishCount = question.publishcount;

    // 确保 studentAnswers 有足够的子数组
    while (question.studentAnswers.length <= publishCount) {
      question.studentAnswers.push([]);
    }

    // 将学生答案存储在对应的数组中
    question.studentAnswers[publishCount-1].push({ studentId, answer });

    // 更新班级文档
    const result = await db.collection('classes').doc(classId).update({
      data: {
        questions: classData.questions
      }
    });

    // 输出更新结果
    console.log('Update result:', JSON.stringify(result));
    return { success: true, message: 'Answer submitted successfully' };
  } catch (err) {
    // 输出错误信息
    console.error('Error submitting answer:', err);
    return { success: false, message: err.message || 'An error occurred' };
  }
};