// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
    const { questionId, question } = event;
    try {
        const res = await db.collection('question').doc(questionId).get();
        const existingQuestion = res.data;
        // 检查 creator 是否匹配
        if (existingQuestion && existingQuestion.creator === question.reviser) {
            const res = await db.collection('question').doc(questionId).update({
                data: {
                    context: question.context,
                    options: question.options,
                    answer: question.answer,
                    type: question.type,
                    hasImage: question.hasImage,
                    image: question.image,
                    difficulty: question.difficulty,
                    questionLabel1: question.questionLabel1,
                    questionLabel2: question.questionLabel2
                }
            });
            if (res.errMsg == "document.update:ok") {
                return {
                    success: true,
                    message: '问题更新成功'
                };
            } else {
                return {
                    success: true,
                    message: '问题更新失败'
                };
            }
        } else {
            // 创建新的问题
            const nowTime = new Date();
            const newQuestion = {
                context: question.context,
                options: question.options,
                answer: question.answer,
                type: question.type,
                hasImage: question.hasImage,
                image: question.image,
                creator: question.reviser,
                createdTime: nowTime,
                quotedCount: 0,
                difficulty: question.difficulty,
                questionLabel1: question.questionLabel1,
                questionLabel2: question.questionLabel2
            };
            const res = await db.collection('question').add({
                data: newQuestion
            });
            if (res.errMsg == "collection.add:ok") {
                return {
                    success: true,
                    message: '非出题人修改，已成功插入新问题插入'
                };
            } else {
                return {
                    success: false,
                    message: '非出题人修改，新问题插入失败'
                };
            }
        }
    } catch(err) {
        return {
            success: false,
            message: err,
          };
    }
}