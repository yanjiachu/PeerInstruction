const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV // 使用当前环境
});
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    // 输出接收到的事件参数
    const classId = event.classId;
    console.log('Received event:', event);

    const startTime = Date.now();
    const classRes = await db.collection('classes').doc(classId).get(); // 获取班级信息
    console.log('Class data fetched in', Date.now() - startTime, 'ms');
    console.log('Class data:', classRes.data);

    const visibleQuestions = classRes.data.questions.filter(q => q.is_visible);
    console.log('Visible questions:', visibleQuestions);

    if (visibleQuestions.length > 0) {
      // 收集所有可见题目的ID
      const questionIDs = visibleQuestions.map(q => q.question_id);
      console.log('Fetching questions with IDs:', questionIDs);

      const startTime2 = Date.now();
      // 使用whereIn查询多个题目的数据
      const questionRes = await db.collection('question').where({
        _id: db.command.in(questionIDs)
      }).get();
      console.log('Question data fetched in', Date.now() - startTime2, 'ms');
      console.log('Question data:', questionRes.data);

      return { success: true, currentquestions: questionRes.data };
    } else {
      console.log('No visible questions found.');
      return { success: true, currentquestions: null };
    }
  } catch (err) {
    console.error('获取问题失败', err);
    return { success: false, error: err };
  }
};