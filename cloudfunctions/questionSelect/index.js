// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
    const { funcType, selectArgs } = event;
    let queryResult = [];
    try {
    switch (funcType) {
        case 0: 
            // 根据题目id进行检索
            if (!Array.isArray(selectArgs) || selectArgs.length === 0) {
                return {
                    success: false,
                    message: '无效的题目ID列表',
                    data: []
                };
            }
            queryResult = await db.collection('question').where({
                _id: db.command.in(selectArgs)
            }).get();
            break;
        case 1: 
            // 根据题目标签进行检索
            if (!Array.isArray(selectArgs) || selectArgs.length < 1 || selectArgs.length > 2) {
                return {
                    success: false,
                    message: '无效的题目标签列表',
                    data: []
                };
            }
            if (selectArgs.length == 1) {
                queryResult = await db.collection('question').where({
                    questionLabel1: selectArgs[0]
                }).get();
            } else if (selectArgs.length == 2) {
                queryResult = await db.collection('question').where({
                    questionLabel1: selectArgs[0],
                    questionLabel2: selectArgs[1]
                }).get();
            }
            break;
        default:
            // funcType 为其他
            return {
                success: false,
                message: '无效的检索类型',
                data: []
            };
    }
    return {
        success: true,
        message: '检索成功',
        data: queryResult.data
    };
    } catch(err) {
        return {
            success: false,
            message: err,
          };
    }
};