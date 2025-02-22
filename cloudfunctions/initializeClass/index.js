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

  const { classId } = eventData;

  try {
    // 获取指定班级的文档
    const classDoc = await db.collection('classes').doc(classId).get();
    const classData = classDoc.data;

    // 检查班级是否存在
    if (!classData) {
      console.error('Class not found:', classId);
      return { success: false, message: 'Class not found' };
    }

    console.log('Class data:', JSON.stringify(classData));

    // 初始化 questions 数组中的每个问题
    const initializedQuestions = classData.questions.map(question => {
      let optionsCount;

      if (question.options && Array.isArray(question.options)) {
        optionsCount = Array(question.options.length).fill(0);
      } else {
        console.warn(`Invalid or missing options for question with id ${question.question_id}, using default optionsCount [0, 0, 0, 0]`);
        optionsCount = [0, 0, 0, 0]; // 默认值
      }

      return {
        ...question,
        ans_is_visible: false,
        is_visible: false,
        publishcount: 0,
        studentAnswers: [],
        optionsCount: optionsCount
      };
    });

    console.log('Initialized questions:', JSON.stringify(initializedQuestions));

    // 更新班级文档
    const result = await db.collection('classes').doc(classId).update({
      data: {
        questions: initializedQuestions
      }
    });

    // 输出更新结果
    console.log('Update result:', JSON.stringify(result));
    return { success: true, message: 'Class initialized successfully' };
  } catch (err) {
    // 输出错误信息
    console.error('Error initializing class:', err);
    return { success: false, message: err.message || 'An error occurred' };
  }
};