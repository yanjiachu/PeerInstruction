const tabService = require("../../../utils/tabService");

Page({

  data: {
    userInfo: {}
  },
  onLoad(options) {
    const app = getApp();
    const userInfo = {
      userID: app.globalData.userID,
      userName: app.globalData.userName,
      userType: app.globalData.userType,
      name: app.globalData.name,
      email: app.globalData.email
    }
    this.setData({
      userInfo: userInfo
    });
  },
  onReady() {

  },
  onShow() {
    tabService.updateIndex(this, 2);
  },
  onHide() {

  },
  onUnload() {

  },
  onPullDownRefresh() {

  },
  onReachBottom() {

  },
  onShareAppMessage() {

  },
  // 跳转到修改个人信息页面
  changeUserInfo() {
    wx.navigateTo({
      url: '/pages/student/center/centerpages/changeInfo/changeInfo',
    });
  },
  discussion(){
    wx.navigateTo({
      url: '/pages/allmyposts/allmyposts'
    });
  },
  //退出登录
  exit() {
    const app = getApp();
    // 清除本地存储的数据
    wx.clearStorageSync();
    // 重置全局数据中的用户信息
    app.globalData.userID = '';
    app.globalData.userName = '';
    app.globalData.userType = '';
    app.globalData.name = '';
    app.globalData.email = '';
    // 跳转到登录页面
    wx.reLaunch({
      url: '/pages/signReg/login/login',
    });
  }
})

