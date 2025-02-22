const cloud = require('wx-server-sdk');
cloud.init();

const db = cloud.database();
const _ = db.command;

// 每次批量处理的条数
const BATCH_SIZE = 100;

exports.main = async (event, context) => {
  try {
    let hasMoreCourses = true; // 是否还有未处理的 courses 数据
    let hasMoreFiles = true;   // 是否还有未处理的 file 数据
    let coursesSkip = 0;       // courses 表的分页起点
    let filesSkip = 0;         // file 表的分页起点

    // 更新 courses 表中的 teacher.teacherName
    while (hasMoreCourses) {
      const coursesRes = await db.collection('courses')
        .skip(coursesSkip)
        .limit(BATCH_SIZE)
        .get();

      const courses = coursesRes.data;

      if (courses.length === 0) {
        hasMoreCourses = false;
        break;
      }

      const teacherIDs = courses.map(course => course.teacher.teacherID);
      const uniqueTeacherIDs = [...new Set(teacherIDs)];

      // 批量获取 teacher 对应的用户信息
      const usersRes = await db.collection('users')
        .where({
          _id: _.in(uniqueTeacherIDs)
        }).get();

      const usersMap = {};
      usersRes.data.forEach(user => {
        usersMap[user._id] = user.name;
      });

      // 批量更新 courses 表
      const updateCoursesTasks = courses.map(course => {
        const teacherName = usersMap[course.teacher.teacherID];
        if (teacherName) {
          return db.collection('courses').doc(course._id).update({
            data: {
              'teacher.teacherName': teacherName
            }
          });
        }
        return Promise.resolve();
      });

      await Promise.all(updateCoursesTasks);

      coursesSkip += BATCH_SIZE;
    }

    // 更新 file 表中的 uploader.uploaderName
    while (hasMoreFiles) {
      const filesRes = await db.collection('file')
        .skip(filesSkip)
        .limit(BATCH_SIZE)
        .get();

      const files = filesRes.data;

      if (files.length === 0) {
        hasMoreFiles = false;
        break;
      }

      const uploaderIDs = files.map(file => file.uploader.uploaderID);
      const uniqueUploaderIDs = [...new Set(uploaderIDs)];

      // 批量获取 uploader 对应的用户信息
      const usersRes = await db.collection('users')
        .where({
          _id: _.in(uniqueUploaderIDs)
        }).get();

      const usersMap = {};
      usersRes.data.forEach(user => {
        usersMap[user._id] = user.name;
      });

      // 批量更新 file 表
      const updateFilesTasks = files.map(file => {
        const uploaderName = usersMap[file.uploader.uploaderID];
        if (uploaderName) {
          return db.collection('file').doc(file._id).update({
            data: {
              'uploader.uploaderName': uploaderName
            }
          });
        }
        return Promise.resolve();
      });

      await Promise.all(updateFilesTasks);

      filesSkip += BATCH_SIZE;
    }

    return {
      success: true,
      message: '批量更新完成'
    };
  } catch (error) {
    console.error('批量更新失败：', error);
    return {
      success: false,
      error: error
    };
  }
};
