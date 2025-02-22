// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
    const question = event.question;
    const nowTime = new Date();
    let questionItem = {
        context: question.context,
        options: question.options,
        answer: question.answer,
        difficulty: question.difficulty,
        type: question.type,
        hasImage: question.hasImage,
        image: question.image,
        creator: question.creator,
        createdTime: nowTime,
        quotedCount: 0,
        questionLabel1: question.questionLabel1,
        questionLabel2: question.questionLabel2
    }
    try {
    const res = await db.collection("question").add({
        data: questionItem
    });
    if (res.errMsg == "collection.add:ok") {
        return {
            success: true,
            message: '问题插入成功'
        };
    } else {
        return {
            success: false,
            message: '问题插入失败'
        };
    }
    } catch(err) {
        return {
            success: false,
            message: err,
          };
    }    
}