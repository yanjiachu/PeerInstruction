const tabService = require("../../../utils/tabService");

Page({
  data: {
    username: '',
    password: '',
    optionsValues: ['请选择登录用户类型', '学生', '教师'],
    userType: 0
  },

  onLoad: function () {
    // 初始化页面
  },

  handleInput: function (e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [field]: e.detail.value
    });
  },

  optionsChange: function (event) {
    this.setData({
      userType: event.detail.value
    });
  },

  onLoginTap: function () {
    const {
      username,
      password,
      userType
    } = this.data;

    if (userType == 0) {
      wx.showToast({
        title: '请选择用户类型',
        icon: 'none',
        duration: 1000
      });
      return;
    }

    if (!username || !password) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      });
      return;
    }

    wx.cloud.callFunction({
      name: 'userLogin',
      data: {
        username,
        password,
        userType: this.data.userType
      },
      success: res => {
        if (res.result.success) {
          wx.showToast({
            title: '登录成功',
            icon: 'success'
          });

          const app = getApp();
          app.globalData.userType = userType;
          app.globalData.userID = res.result.data._id;
          app.globalData.userName = username;
          app.globalData.name = res.result.data.name;
          app.globalData.email = res.result.data.email;

          // 修改switchTab
          tabService.updateRole(this, userType);

          if (userType == 1) {
            wx.switchTab({
              url: '../../student/index/index'
            });
          } else if (userType == 2) {
            wx.switchTab({
              url: '../../teacher/index/index'
            });
          }
        } else {
          wx.showToast({
            title: res.result.message,
            icon: 'none'
          });
        }
      },
      fail: err => {
        wx.showToast({
          title: '登录失败，请稍后再试',
          icon: 'none'
        });
        console.error('登录失败', err);
      }
    });
  },

  onRegisterTap: function (n) {
    wx.setStorageSync('loginTable', n);
    wx.navigateTo({
      url: '/pages/signReg/register/register'
    });
  },

  onForgetTap: function () {
    wx.navigateTo({
      url: '/pages/signReg/forget/forget'
    });
  }
});