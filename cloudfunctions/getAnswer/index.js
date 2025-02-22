// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }); // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
  const { classId, questionId } = event; // 获取传入的参数

  const db = cloud.database();
  const classesCollection = db.collection('classes');

  try {
    // 查询指定班级的数据
    const classDoc = await classesCollection.doc(classId).get();
    const classData = classDoc.data;

    if (!classData || !classData.questions) {
      return {
        error: '班级数据或题目数据不存在'
      };
    }

    // 找到指定题目的数据
    const question = classData.questions.find(q => q.question_id === questionId);

    if (!question || !question.studentAnswers) {
      return {
        error: '题目数据或学生答题数据不存在'
      };
    }

    // 统计第一次答题的数据
    const answerCount1 = { 'A': 0, 'B': 0, 'C': 0, 'D': 0 };
    if (question.studentAnswers[0]) {
      question.studentAnswers[0].forEach(studentAnswer => {
        if (answerCount1[studentAnswer.answer] !== undefined) {
          answerCount1[studentAnswer.answer]++;
        }
      });
    }

    // 统计第二次答题的数据
    const answerCount2 = { 'A': 0, 'B': 0, 'C': 0, 'D': 0 };
    if (question.studentAnswers[1]) {
      question.studentAnswers[1].forEach(studentAnswer => {
        if (answerCount2[studentAnswer.answer] !== undefined) {
          answerCount2[studentAnswer.answer]++;
        }
      });
    }

    // 转换成图表需要的格式
    const series = [
      { name: 'A', data: answerCount1['A'] },
      { name: 'B', data: answerCount1['B'] },
      { name: 'C', data: answerCount1['C'] },
      { name: 'D', data: answerCount1['D'] }
    ];

    const series2 = [
      { name: 'A', data: answerCount2['A'] },
      { name: 'B', data: answerCount2['B'] },
      { name: 'C', data: answerCount2['C'] },
      { name: 'D', data: answerCount2['D'] }
    ];

    return {
      answer1: answerCount1,
      answer2: answerCount2,
      series: series,
      series2: series2
    };
  } catch (e) {
    console.error('查询失败:', e);
    return {
      error: e
    };
  }
};