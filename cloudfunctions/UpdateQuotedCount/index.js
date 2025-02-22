// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
    const { questionList } = event;
    const resList = {
        success : [],
        fail: []
    };
    try {
        if (!Array.isArray(questionList)) {
            return {
                success: false,
                message: '无效的题目ID列表',
                data: []
            };
        }
        if (questionList.length) {
            for (const id of questionList) {
                const res = await db.collection('question').doc(id).update({
                  data: {
                    quotedCount: db.command.inc(1)
                  }
                });
                if (res.errMsg == "document.update:ok") {
                    resList.success.push(id);
                } else {
                    resList.fail.push(id);
                }
            }
            return {
                success: true,
                message: '修改成功',
                res: resList
            };
        } else {
            return {
                success: true,
                message: '修改成功'
            };
        }
    } catch (err) {
        return {
            success: false,
            message: '修改失败',
            err: err
        };
    }
}