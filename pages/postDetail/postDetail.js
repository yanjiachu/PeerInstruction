Page({
  data: {
    post: {},        // 当前帖子的详细信息
    replies: [],     // 当前帖子的回复列表
    postId: '',      // 帖子的ID
  },
  onShow() {
    this.fetchReplies(this.data.postId);
  },

  onLoad(options) {
    const postId = options.id;  // 从页面参数中获取帖子ID
    if (!postId) {
      wx.showToast({
        title: '帖子ID无效',
        icon: 'none'
      });
      return;
    }
    this.setData({ postId });   // 保存帖子ID
    this.fetchPostDetails(postId); // 获取帖子详情
    this.fetchReplies(postId);     // 获取回复列表
  },

  // 时间格式化函数
  formatDate(timestamp) {
    try {
      // 如果时间不存在，直接返回错误提示
      if (!timestamp) {
        return '时间未定义';
      }

      // 如果是 MongoDB 的 $date 格式，提取 ISO 时间字符串
      const date = new Date(timestamp.$date || timestamp);

      // 如果时间无效，返回错误提示
      if (isNaN(date.getTime())) {
        return '时间格式无效';
      }

      // 格式化为 YYYY-MM-DD HH:MM 格式
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    } catch (error) {
      console.error('时间格式化失败:', error);
      return '时间格式化错误';
    }
  },

  // 获取帖子详情
  fetchPostDetails(postId) {
    wx.cloud.database().collection('posts')
      .doc(postId)
      .get()
      .then(res => {
        const post = res.data;
        this.setData({
          post: {
            id: post._id,
            title: post.title,
            content: post.content,
            author: post.username,
            date: this.formatDate(post.timestamp || post.date) // 兼容两种字段
          }
        });
      })
      .catch(err => {
        console.error('加载帖子详情失败:', err);
        wx.showToast({
          title: '加载帖子失败',
          icon: 'none'
        });
      });
  },

  // 获取回复列表
  fetchReplies(postId) {
    wx.cloud.database().collection('reply')
      .where({ postId, deleted: false })  // 筛选有效回复
      .orderBy('timestamp', 'asc')        // 时间正序排列
      .get()
      .then(res => {
        const replies = res.data.map(reply => ({
          id: reply._id,
          content: reply.content,
          username: reply.username,
          time: this.formatDate(reply.timestamp || reply.date) // 兼容两种字段
        }));
        this.setData({ replies });
      })
      .catch(err => {
        console.error('加载回复失败:', err);
        wx.showToast({
          title: '加载回复失败',
          icon: 'none'
        });
      });
  },

  // 点击发表评论按钮
  onReplyClick() {
    wx.navigateTo({
      url: `/pages/reply/reply?postId=${this.data.postId}`
    });
  }
});
