Page({
  data: {
    userInfo: {
      name: '',
      email: ''
    }
  },

  onLoad(options) {
    const app = getApp();
    const userInfo = {
      name: app.globalData.name,
      email: app.globalData.email
    }
    this.setData({
      userInfo: userInfo
    });
  },

  bindnameInput(e) {
    this.setData({
      'userInfo.name': e.detail.value
    });
  },

  bindEmailInput(e) {
    this.setData({
      'userInfo.email': e.detail.value
    });
  },

  saveUserInfo() {
    const app = getApp();
    const newUserInfo = this.data.userInfo;

    // 调用云函数更新用户信息
    wx.cloud.callFunction({
      name: 'changeInfo',
      data: {
        userID: app.globalData.userID,
        name: newUserInfo.name,
        email: newUserInfo.email
      }
    }).then(res => {
      if (res.result.success) {
        // 更新全局数据中的用户信息
        app.globalData.name = newUserInfo.name;
        app.globalData.email = newUserInfo.email;

        // 提示用户信息已保存
        wx.showToast({
          title: '保存成功',
          icon: 'success',
          duration: 1000
        });

        if (app.globalData.userType == 1) {
          wx.reLaunch({
            url: '/pages/student/center/center',
          });
        } else {
          wx.reLaunch({
            url: '/pages/teacher/center/center',
          });
        }

      } else {
        wx.showToast({
          title: '保存失败',
          icon: 'none',
          duration: 2000
        });
      }
    }).catch(err => {
      console.error('调用云函数失败', err);
      wx.showToast({
        title: '保存失败',
        icon: 'none',
        duration: 2000
      });
    });
  },

  returnIndex: function () {
    const app = getApp();

    if (app.globalData.userType == 1) {
      wx.reLaunch({
        url: '/pages/student/center/center',
      });
    } else {
      wx.reLaunch({
        url: '/pages/teacher/center/center',
      });
    }
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {},

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

  }
})