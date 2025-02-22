// pages/reply/reply.js
const app = getApp(); // 获取全局应用实例

Page({
  data: {
    postId: '',         // 帖子ID
    replyContent: ''    // 回复内容
  },

  onLoad(options) {
    const { postId } = options; // 获取传递过来的帖子ID
    if (!postId) {
      wx.showToast({
        title: '无效的帖子ID',
        icon: 'none'
      });
      return;
    }
    this.setData({ postId }); // 保存帖子ID
  },

  // 输入框内容变化时触发
  onInputChange(event) {
    this.setData({
      replyContent: event.detail.value // 更新回复内容
    });
  },

  // 发送回复
  onSendReply() {
    const { postId, replyContent } = this.data;

    // 验证输入内容
    if (!replyContent.trim()) {
      wx.showToast({
        title: '请输入回复内容',
        icon: 'none'
      });
      return;
    }

    // 获取用户名（从 globalData 的 name 字段）
    const username = app.globalData.name || '匿名用户';

    // 向数据库中添加回复
    wx.cloud.database().collection('reply')
      .add({
        data: {
          postId,               // 关联的帖子ID
          content: replyContent, // 回复内容
          username: username,    // 用户名（从 globalData 中获取）
          timestamp: new Date(), // 当前时间
          deleted: false        // 回复默认未被删除
        }
      })
      .then(() => {
        wx.showToast({
          title: '回复成功',
          icon: 'success',
          duration: 1500
        });

        // 回复成功后返回帖子详情页
        setTimeout(() => {
          wx.navigateBack(); // 返回上一页（帖子详情页）
        }, 1500);
      })
      .catch(err => {
        console.error('发送回复失败:', err);
        wx.showToast({
          title: '回复失败，请重试',
          icon: 'none'
        });
      });
  }
});