// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
    const { questionId, userID } = event;
    try {
        const res = await db.collection('question').doc(questionId).get();
        const existingQuestion = res.data;
        const filePath = existingQuestion.image;
        if (existingQuestion && existingQuestion.creator === userID) {
            const res = await db.collection('question').doc(questionId).remove();
            if (res.errMsg == "document.remove:ok") {
                if (existingQuestion.hasImage) {
                    const result = await cloud.deleteFile({
                        fileList: [existingQuestion.image]
                    });
                    return {
                        success: true,
                        message: '问题删除成功',
                        deleteImage: result,
                        deleteQuestion: res
                    };
                } else {
                    return {
                        success: true,
                        message: '问题删除成功',
                        res: res
                    };
                }
            } else {
                return {
                    success: false,
                    message: '问题删除失败',
                    res: res
                };
            }
        } else {
            return {
                success: 'false',
                message: '非出题人操作或题目已被删除，操作失败'
            };
        }
    } catch(err) {
        return {
            success: false,
            message: err,
          };
    }
}