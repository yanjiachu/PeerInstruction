// pages/allmyposts/allmyposts.js
const app = getApp(); // 获取全局应用实例
const db = wx.cloud.database();

Page({
  data: {
    username: '', // 用户名
    posts: []     // 帖子列表
  },

  onLoad() {
    // 获取全局用户名
    const username = app.globalData.name || '匿名用户';
    this.setData({ username });

    // 获取用户的帖子
    this.fetchUserPosts();
  },

  // 获取用户的帖子
  fetchUserPosts() {
    const { username } = this.data;

    db.collection('posts')
      .where({
        username: username,
        deleted: false
      })
      .orderBy('timestamp', 'desc')
      .get()
      .then(res => {
        // 处理时间格式
        const posts = res.data.map(post => ({
          ...post,
          timestamp: this.formatDate(post.timestamp)
        }));
        this.setData({ posts });
      })
      .catch(err => {
        console.error('获取用户帖子失败：', err);
        wx.showToast({
          title: '获取帖子失败',
          icon: 'none'
        });
      });
  },

  // 格式化日期函数
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

  // 点击帖子，进入帖子详情页
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