// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
    const { courseID } = event

    try {
        const courseStudentsRes = await db.collection('courses_students')
            .where({ courseID: courseID })
            .get()
        const studentIDs = courseStudentsRes.data.map(item => item.studentID)
        if (studentIDs.length === 0) {
            return {
                students: []
            }
        }
        const usersRes = await db.collection('users')
            .where({
                _id: db.command.in(studentIDs)
            })
            .get()
        const students = usersRes.data.map(user => ({
            id: user._id,
            name: user.name
        }))
        return {
            students: students
        }
    } catch (err) {
        console.error(err)
        return {
            error: '查询失败'
        }
    }

}