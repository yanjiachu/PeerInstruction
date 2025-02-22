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
  onShow() {
    tabService.updateIndex(this, 1);
  },

  // 跳转到修改个人信息页面
  changeUserInfo() {
    wx.navigateTo({
      url: '/pages/student/center/centerpages/changeInfo/changeInfo',
    });
  },
  //跳转到讨论区
  discussion(){
    wx.navigateTo({
      url: '/pages/allmyposts/allmyposts'
    });
  },
  // 跳转到我参与的课程页面
  myClass() {
    wx.navigateTo({
      url: '/pages/student/center/centerpages/myClass/myClass',
    });
  },

  // 跳转到我的历史记录页面
  myHistory() {
    wx.navigateTo({
      url: '/pages/student/center/centerpages/history/history',
    });
  },

  test(){
    wx.navigateTo({
      url: '/pages/teacher/answerAnalysis/answerAnalysis',
    });
  },


  //退出，返回到登陆界面
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