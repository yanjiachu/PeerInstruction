// pages/myPosts/myPosts.js
const app = getApp(); // 获取全局应用实例
const db = wx.cloud.database();

Page({
  data: {
    courseID: '',  // 课程 ID
    username: '',  // 用户名
    posts: []      // 帖子列表
  },

  onLoad(options) {
    const courseID = decodeURIComponent(options.courseID);
    const username = app.globalData.name || '匿名用户';

    this.setData({
      courseID: courseID,
      username: username
    });

    this.fetchMyPosts();
  },

  // 获取我的帖子
  fetchMyPosts() {
    const { courseID, username } = this.data;

    db.collection('posts')
      .where({
        courseId: courseID,
        username: username,
        deleted: false
      })
      .orderBy('timestamp', 'desc')
      .get()
      .then(res => {
        const posts = res.data.map(post => ({
          ...post,
          timestamp: this.formatDate(post.timestamp)
        }));

        this.setData({
          posts: posts
        });
      })
      .catch(err => {
        console.error('获取我的帖子失败：', err);
        wx.showToast({
          title: '获取我的帖子失败',
          icon: 'none'
        });
      });
  },

  // 格式化日期
  formatDate(timestamp) {
    try {
      if (!timestamp) {
        return '未知时间';
      }
      const dateObj = new Date(timestamp.$date || timestamp);
      const year = dateObj.getFullYear();
      const month = ('0' + (dateObj.getMonth() + 1)).slice(-2);
      const day = ('0' + dateObj.getDate()).slice(-2);
      const hours = ('0' + dateObj.getHours()).slice(-2);
      const minutes = ('0' + dateObj.getMinutes()).slice(-2);
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    } catch (e) {
      return '时间格式错误';
    }
  },

  // 查看帖子详情
  viewPost(event) {
    const postId = event.currentTarget.dataset.id;
    if (!postId) {
      wx.showToast({
        title: '帖子ID无效',
        icon: 'none'
      });
      return;
    }
    wx.navigateTo({
      url: `/pages/postDetail/postDetail?id=${postId}`
    });
  }
});