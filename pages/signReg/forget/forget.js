Page({
  data: {
    username: '',
    email: '',
    captcha: '',
    newPassword: ''
  },

  handleInput: function (e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [field]: e.detail.value
    });
  },

  sendCaptcha: function () {
    const {
      username,
      email
    } = this.data;

    if (!username || !email) {
      wx.showToast({
        title: '请填写学号/工号和邮箱',
        icon: 'none'
      });
      return;
    }

    wx.cloud.callFunction({
      name: 'sendCaptcha',
      data: {
        email
      },
      success: res => {
        if (res.result.success) {
          wx.showToast({
            title: '验证码已发送',
            icon: 'success'
          });
          // 将生成的验证码存储到本地，方便后续验证
          this.setData({
            captcha: res.result.captcha
          });
        } else {
          wx.showToast({
            title: res.result.message,
            icon: 'none'
          });
        }
      },
      fail: err => {
        wx.showToast({
          title: '验证码发送失败，请稍后再试',
          icon: 'none'
        });
        console.error('验证码发送失败', err);
      }
    });
  },

  resetPassword: function () {
    const {
      username,
      email,
      captcha,
      newPassword
    } = this.data;

    if (!username || !email || !captcha || !newPassword) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      });
      return;
    }

    wx.cloud.callFunction({
      name: 'passwordChange',
      data: {
        username,
        email,
        captcha,
        newPassword
      },
      success: res => {
        if (res.result.success) {
          wx.showToast({
            title: '密码重置成功',
            icon: 'success'
          });
          wx.navigateTo({
            url: '/pages/login/login'
          });
        } else {
          wx.showToast({
            title: res.result.message,
            icon: 'none'
          });
        }
      },
      fail: err => {
        wx.showToast({
          title: '密码重置失败，请稍后再试',
          icon: 'none'
        });
        console.error('密码重置失败', err);
      }
    });
  },

  onLoginTap: function () {
    wx.navigateTo({
      url: '/pages/signReg/login/login'
    });
  },

  onRegisterTap: function () {
    wx.navigateTo({
      url: '/pages/signReg/register/register'
    });
  }
});