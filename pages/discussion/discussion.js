const db = wx.cloud.database();

Page({
  data: {
    posts: [],           // 帖子数据
    pageSize: 10,        // 每次加载的帖子数量
    pageIndex: 0,        // 当前页面索引
    hasMore: true,       // 是否还有更多帖子
    courseID: ''
  },
  
  // 日期格式化函数
  formatDate(timestamp) {
    try {
      if (!timestamp) {
        return '未知时间';
      }
      // 处理 timestamp 可能的 $date 格式
      const dateObj = new Date(timestamp.$date || timestamp);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const hours = String(dateObj.getHours()).padStart(2, '0');
      const minutes = String(dateObj.getMinutes()).padStart(2, '0');
      const seconds = String(dateObj.getSeconds()).padStart(2, '0');

      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    } catch (e) {
      return '时间格式错误';
    }
  },
  
  onLoad(options) {
    const courseID = decodeURIComponent(options.courseID);
    this.setData({
      courseID: courseID
    });
    // 根据 courseID 获取对应课程的帖子列表
    this.fetchPosts(true);  // 页面初次加载时获取最新帖子
  },

  // 页面显示时自动刷新，确保从发布页面返回时展示最新帖子
  onShow() {
    this.fetchPosts(true);  // 刷新数据
  },

  // 下拉刷新，重置页面数据并获取最新帖子
  onPullDownRefresh() {
    this.fetchPosts(true, () => {
      wx.stopPullDownRefresh();  // 停止下拉刷新动画
    });
  },

  // 触底加载更多数据
  onReachBottom() {
    if (this.data.hasMore) {
      this.fetchPosts(false);  // 加载更多数据
    } else {
      wx.showToast({
        title: '没有更多帖子了',
        icon: 'none'
      });
    }
  },

  // 获取帖子数据
  fetchPosts(isRefresh = false, callback) {
    if (isRefresh) {
      this.setData({
        pageIndex: 0,
        hasMore: true,
        posts: []
      });
    }

    const { pageSize, pageIndex, posts, courseID } = this.data;  // 添加 courseID

    wx.cloud.callFunction({
      name: 'displayPosts',
      data: {
        pageSize,
        pageIndex,
        courseID   // 传递课程ID给云函数
      }
    }).then(res => {
      if (res.result && res.result.success) {
        // 格式化每条帖子中的日期字段
        const newPosts = res.result.data.map(post => ({
          ...post,
          timestamp: this.formatDate(post.timestamp)  // 格式化日期
        }));

        // 合并新获取的帖子数据
        const updatedPosts = isRefresh ? newPosts : posts.concat(newPosts);

        this.setData({
          posts: updatedPosts,
          pageIndex: pageIndex + 1,
          hasMore: newPosts.length === pageSize  // 若返回的数量小于 pageSize，则说明没有更多数据
        });
      } else {
        wx.showToast({
          title: '加载数据失败',
          icon: 'none'
        });
      }
      if (callback) callback();
    }).catch(error => {
      wx.showToast({
        title: '加载数据失败',
        icon: 'none'
      });
      if (callback) callback();
      console.error("Error fetching posts:", error);
    });
  },

  // 跳转到创建帖子页面，传递 courseID 参数
  createPost() {
    wx.navigateTo({
      url: `/pages/createPost/createPost?courseID=${encodeURIComponent(this.data.courseID)}`
    });
  },

  // 跳转到我的帖子页面（可根据需要传递 courseID）
  myPosts() {
    wx.navigateTo({
      url: `/pages/myPosts/myPosts?courseID=${encodeURIComponent(this.data.courseID)}`
    });
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