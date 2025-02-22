// pages/student/course/createCourse/createCourse.js
Page({


  data: {
    courseName: "",
    description: "",
    isPublic: false,
  },

  onLoad(options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  // 监听课程名称输入
  onCourseNameInput(e) {
    this.setData({
      courseName: e.detail.value
    });
  },

  // 监听课程描述输入
  onDescriptionInput(e) {
    this.setData({
      description: e.detail.value
    });
  },

  // 监听课程公开切换
  onIsPublicChange(e) {
    this.setData({
      isPublic: e.detail.value,
    });
  },

  // 提交表单
  async submit() {
    const { courseName, description, isPublic } = this.data;
  
    // 校验表单
    if (!courseName || !description) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none',
        duration: 2000
      });
      return;
    }
  
    const app = getApp();
    
    // 检查 globalData 是否初始化
    if (!app.globalData.userID || !app.globalData.name) {
      wx.showToast({
        title: '用户信息未加载，请稍后重试',
        icon: 'none',
        duration: 2000
      });
      return;
    }
  
    let teacher = {
      teacherID: app.globalData.userID,
      teacherName: app.globalData.name
    };
  
    console.log("Teacher Object:", teacher);
  
    wx.showLoading({
      title: '提交中...',
    });
  
    try {
      const res = await wx.cloud.callFunction({
        name: 'insertCourse',
        data: {
          courseName,
          description,
          isPublic,
          teacher,
        }
      });
  
      wx.hideLoading();
  
      if (res.result && res.result.success) {
        wx.showToast({
          title: '提交成功',
          icon: 'success',
          duration: 2000,
          complete: () => {
            wx.navigateBack({ delta: 1 });
          }
        });
  
        this.setData({
          courseName: "",
          description: ""
        });
      } else {
        wx.showModal({
          title: '提交失败',
          content: res.result.message || '未知错误',
          showCancel: false
        });
      }
    } catch (error) {
      wx.hideLoading();
      console.error(error);
      wx.showModal({
        title: '提交失败',
        content: '系统错误，请稍后重试',
        showCancel: false
      });
    }
  }  
})