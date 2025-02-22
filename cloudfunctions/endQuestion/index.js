// 引入必要的模块
const cloud = require('wx-server-sdk')

// 初始化云开发环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV // 使用当前环境
})

// 获取数据库引用
const db = cloud.database()

// 主处理函数
exports.main = async (event, context) => {
  // 输出接收到的事件数据
  console.log('Received event:', event)

  // 检查 event.data 是否存在，如果不存在，尝试直接从 event 中获取数据
  const eventData = event.data || event

  // 检查 eventData 是否存在
  if (!eventData) {
    console.error('No data provided in the request')
    return { success: false, message: 'No data provided in the request' }
  }

  const { action, classId, questionId } = eventData

  // 检查 action 是否为end
  if (action !== 'end') {
    console.log('Unsupported action:', action)
    return { success: false, message: 'Action not supported' }
  }

  try {
    // 获取指定班级的文档
    const classDoc = await db.collection('classes').doc(classId).get()
    const classData = classDoc.data

    // 检查班级是否存在
    if (!classData) {
      console.error('Class not found:', classId)
      return { success: false, message: 'Class not found' }
    }

    // 更新 questions 数组中的指定问题
    const updatedQuestions = classData.questions.map(question => 
      question.question_id === questionId ? { ...question, is_visible: false } : question
    )

    // 更新班级文档
    const result = await db.collection('classes').doc(classId).update({
      data: {
        questions: updatedQuestions
      }
    })

    // 输出更新结果
    console.log('Update result:', result)

    return { success: true, message: 'Question end successfully' }
  } catch (err) {
    // 输出错误信息
    console.error('Error updating question unvisibility:', err)
    return { success: false, message: err.message || 'An error occurred' }
  }
}