const tabService = require("../../../utils/tabService");

Page({
  data: {
    username: '',
    password: '',
    name: '',
    email: '',
    optionsValues: ['请选择登录用户类型', '学生', '教师'],
    userType: 0
  },

  onLoad: function () {
    const loginTable = wx.getStorageSync("loginTable") || "xuesheng";
    this.setData({
      tableName: loginTable
    });
  },

  handleInput: function (e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [field]: e.detail.value
    });
  },

  handlePickerChange: function (e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [field]: this.data[`${field}Options`][e.detail.value]
    });
  },

  register: function () {

    const {
      username,
      password,
      name,
      email,
      userType
    } = this.data;

    //测试
    // console.log('username:', username);
    // console.log('password:', password);
    // console.log('name:', name);
    // console.log('email:', email);
    // console.log('userType:', userType);

    if (userType == 0) {
      wx.showToast({
        title: '请选择用户类型',
        icon: 'none',
        duration: 1000
      });
      return;
    }

    if (!username || !password || !name || !email) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      });
      return;
    }

    wx.cloud.callFunction({
      name: 'userRegister',
      data: {
        username,
        password,
        name,
        email,
        userType: this.data.userType
      },
      success: res => {
        if (res.result.success) {
          wx.showToast({
            title: '注册成功',
            icon: 'success'
          });

          const app = getApp();
          // 清除本地存储的数据
          wx.clearStorageSync();
          // 重置全局数据中的用户信息
          app.globalData.userName = username;
          app.globalData.userType = userType;
          app.globalData.name = name;
          app.globalData.email = email;

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
          title: '注册失败，请稍后再试',
          icon: 'none'
        });
        console.error('注册失败', err);
      }
    });
  },

  onLoginTap: function () {
    wx.navigateTo({
      url: '/pages/signReg/login/login'
    });
  },

  onForgetTap: function () {
    wx.navigateTo({
      url: '/pages/signReg/forget/forget'
    });
  },

  optionsChange: function (e) {
    let userType = e.detail.value;
    this.setData({
      userType: userType
    });
  }
});