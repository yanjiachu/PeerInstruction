// pages/student/course/courseMember/courseMember.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    courseID:'',
    courseName:'',
    teacherName:'',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const courseID = options.courseID;
    const app = getApp();
    const userID = app.globalData.userID;
    const userName = app.globalData.name;
    if(courseID) {
      wx.showLoading({
        title: '加载中……',
      })
      wx.cloud.callFunction({
        name: 'getStudentList',
        data: {
          courseID: courseID
        },
        success: res => {
          let students = res.result.students;
  
          // 找到当前用户并移到第一位
          const userIndex = students.findIndex(student => student.id === userID);
          if (userIndex !== -1) {
            const currentUser = students.splice(userIndex, 1)[0];
            currentUser.isMe = true; // 标记当前用户
            students.unshift(currentUser); // 移到第一位
          } else {
            // 如果用户未在列表中，添加用户信息到第一位
            students.unshift({
              id: userID,
              name: userName,
              isMe: true
            });
          }
  
          // 更新到页面数据
          this.setData({
            students: students
          });
          wx.hideLoading()
        },
        fail: err => {
          console.log('云函数调用失败', err)
        }
      })
      wx.cloud.database().collection('courses')
        .where({_id : courseID})
        .get()
        .then(res => {
          this.setData({
            teacherName: res.data[0].teacher.teacherName
          })
        })      
    }
  },
})