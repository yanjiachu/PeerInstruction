// pages/createPost/createPost.js
const db = wx.cloud.database();
const app = getApp(); // 获取全局应用实例

Page({
  /**
   * 页面的初始数据
   */
  data: {
    courseID: '', // 存储课程ID
  },

  // 生命周期函数--监听页面加载
  onLoad(options) {
    // 获取传递过来的课程ID
    const courseID = decodeURIComponent(options.courseID);
    this.setData({
      courseID: courseID
    });
  },

  // 提交帖子
  btnsub(res) {
    console.log(res);
    var title = res.detail.value.title;
    var content = res.detail.value.content;
    var date = new Date();

    // 验证输入
    if (!title || !content) {
      wx.showToast({
        title: '请填写完整内容',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    // 获取用户名（从 globalData 的 name 字段）
    var author = app.globalData.name || '匿名用户';

    console.log(title, author, content, date);

    // 添加帖子到数据库
    db.collection("posts").add({
      data: {
        "timestamp": date,
        "username": author,
        "content": content,
        "courseId": this.data.courseID, // 使用动态的课程ID
        "deleted": false,
        "repliesCount": 0,
        "title": title
      }
    }).then(res => {
      // 显示提交成功的提示
      wx.showToast({
        title: '提交成功',
        icon: 'success',
        duration: 1500,  // 显示1.5秒后自动返回上一页
        success: () => {
          setTimeout(() => {
            // 返回到上一个页面
            wx.navigateBack({
              delta: 1, // 返回的页面层数
            });
          }, 1500);  // 等待Toast显示完毕
        }
      });
    }).catch(err => {
      console.error("帖子发布失败：", err);
      wx.showToast({
        title: '提交失败，请重试',
        icon: 'none',
        duration: 2000
      });
    });
  },

  // 其他生命周期函数（可保持不变）
});