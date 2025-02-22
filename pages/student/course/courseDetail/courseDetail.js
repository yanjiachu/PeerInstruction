// pages/student/course/courseDetail/courseDetail.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    courseID: '',
    courseName: '',
    classList: [],
    classListListener: null,
  },

    // 监听数据库变化
  startWatchingDatabase: function (courseID) {
    const db = wx.cloud.database();
    const classListListener = db.collection('courses')
      .where({ _id: courseID }) // 根据 courseID 过滤
      .watch({
        onChange: snapshot => {
          console.log('数据库变更:', snapshot);
          if (snapshot.docChanges.length > 0) {
            this.fetchCourseDetails(courseID)
              .then(result => {
                const processedClassList = this.processClassList(result.classDetails);
                this.setData({ classList: processedClassList });
              })
              .catch(error => {
                console.error('更新班级列表失败:', error.message);
              });
          }
        },
        onError: error => {
          console.error('监听错误:', error);
        },
      });

    this.setData({ classListListener });
  },

  // 停止监听
  stopWatchingDatabase: function () {
    if (this.data.classListListener) {
      this.data.classListListener.close();
      this.setData({ classListListener: null });
    }
  },

  fetchCourseDetails : function(courseID) {
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'getCourseDetails',
        data: { courseID: courseID },
        success: res => {
          if (res.result.error) {
            reject(new Error('错误：' + res.result.error)); // 返回错 误信息
          } else {
            resolve(res.result); // 返回成功的结果
          }
        },
        fail: err => {
          reject(new Error('调用云函数getCourseDetail失败：' + err));   // 处理失败的情况
        }
      });
    });
  },

  processClassList : function(classListUnprocessed) {
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const groupedClasses = {};
    classListUnprocessed.forEach(classItem => {
      const startTime = new Date(classItem.start_time);
      const date = `${startTime.getMonth() + 1}月${startTime.getDate()}日`;
      const day = weekdays[startTime.getDay()];
      const time = `${startTime.getHours()}:${String(startTime.getMinutes()).padStart(2, '0')}`;
      const title = classItem.class_name;
      const id = classItem.class_id;
      // 如果没有这个日期的分组，就新建一个
      if (!groupedClasses[date]) {
        groupedClasses[date] = {
          date: date,
          day: day,
          sessions: []
        };
      }
      // 将班级信息添加到对应日期的 sessions 中
      groupedClasses[date].sessions.push({ time, title, id });
    });
  // 将 groupedClasses 对象转换为数组，并按日期从大到小排序
  const result = Object.values(groupedClasses)
    .sort((a, b) => {
      const dateA = new Date(a.date.replace('月', '/').replace('日', ''));
      const dateB = new Date(b.date.replace('月', '/').replace('日', ''));
      return dateB - dateA; // 按日期降序排序
    })
    .map(group => {
      // 对每个日期内的 sessions 按时间升序排序
      group.sessions.sort((a, b) => {
        const timeA = new Date(`1970-01-01T${a.time}:00Z`);
        const timeB = new Date(`1970-01-01T${b.time}:00Z`);
        return timeA - timeB; // 按时间升序排序
      });
      return group;
    });
    return result;
  },

  onLoad(options) {
    const courseID = options.courseID;
    const courseName = decodeURIComponent(options.courseName)
    this.setData({
      courseID : courseID,
      courseName : courseName
    })
    this.fetchCourseDetails(courseID)
      .then(result => {
        console.log(result);

        // 对 classListUnprocessed 进行处理
        const processedClassList = this.processClassList(result.classDetails);

        console.log(processedClassList);
        // 设置处理后的 classList
        this.setData({
          classList: processedClassList
        });
      })
      .catch(error => {
        // 处理错误
        console.error(error.message);
      });
    this.startWatchingDatabase(courseID)
  },

  onUnload() {
    // 停止监听数据库
    this.stopWatchingDatabase();
  },

  onMemberTap : function (params) {
    const courseID = this.data.courseID;
    const courseName = this.data.courseName;
    wx.navigateTo({
      url: `/pages/student/course/courseMember/courseMember?courseID=${courseID}&courseName=${encodeURIComponent(courseName)}`,
    })
  },

  onDisscusionTap : function() {
    const courseID = this.data.courseID;
    wx.navigateTo({
      url: `/pages/discussion/discussion?courseID=${courseID}`,
    })
  },

  onClassTap : function(e) {
    const classId = e.currentTarget.dataset.id;
    const courseId = this.data.courseID;
    console.log(classId, courseId)
    // 导航到班级页面，并传递 classId 和 courseId
    wx.navigateTo({
      url: `/pages/student/class/class?classId=${classId}&courseId=${courseId}`
    });
  },

  onFileTap : function () {
    console.log('onFileTap')
    const courseID = this.data.courseID;
    const courseName = this.data.courseName;
    wx.navigateTo({
      url: `/pages/student/course/courseFile/courseFile?courseID=${courseID}&courseName=${encodeURIComponent(courseName)}`,
    })    
  },
  
  
  
  // 从课程详情页跳转到讨论区
  viewDiscussion(event) {
    const courseID = this.data.courseID; // 获取课程ID
    wx.navigateTo({
      url: `/pages/discussion/discussion?courseID=${encodeURIComponent(courseID)}`
    });
  }
})