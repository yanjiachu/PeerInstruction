Page({
  data: {
    courseName: '',
    description: '',
    isPublic: true,
    editingCourseName: false,
    editingDescription: false,
    courseID: ''
  },

  onLoad(options) {
    const courseID = options.courseID;
    if (courseID) {
      this.fetchCourseData(courseID);
      this.setData({
        courseID: courseID
      })
    }
  },

  // 从数据库拉取课程数据
  fetchCourseData(courseID) {
    // 使用云开发数据库查询课程信息
    wx.cloud.database().collection('courses').doc(courseID).get()
      .then(res => {
        // 拉取成功后更新页面数据
        if (res.data) {
          this.setData({
            courseName: res.data.courseName,
            description: res.data.description,
            isPublic: res.data.isPublic,
          });
        }
      })
      .catch(err => {
        console.error('拉取课程数据失败:', err);
        wx.showToast({
          title: '加载失败',
          icon: 'none',
        });
      });
  },

  // 课程名称输入处理
  onCourseNameInput: function (e) {
    this.setData({
      courseName: e.detail.value
    });
  },

  // 课程描述输入处理
  onDescriptionInput: function (e) {
    this.setData({
      description: e.detail.value
    });
  },

  // 是否公开状态改变
  onIsPublicChange: function (e) {
    this.setData({
      isPublic: e.detail.value
    });
  },

  // 点击编辑课程名称
  editCourseName: function () {
    this.setData({
      editingCourseName: true
    }, () => {
      // 延迟设置焦点以确保 DOM 节点更新完成
      setTimeout(() => {
        const query = wx.createSelectorQuery();
        query.select('.weui-input').fields({ node: true, size: true }, function (res) {
          if (res && res.node) {
            res.node.focus(); // 设置焦点
            const length = res.node.value.length;
            res.node.setSelectionRange(length, length); // 将光标移到末尾
          }
        }).exec();
      }, 50);
    });
  },

  // 点击编辑课程描述
  editDescription: function () {
    this.setData({
      editingDescription: true
    }, () => {
      // 延迟设置焦点以确保 DOM 节点更新完成
      setTimeout(() => {
        const query = wx.createSelectorQuery();
        query.select('.weui-textarea').fields({ node: true, size: true }, function (res) {
          if (res && res.node) {
            res.node.focus(); // 设置焦点
            const length = res.node.value.length;
            res.node.setSelectionRange(length, length); // 将光标移到末尾
          }
        }).exec();
      }, 50);
    });
  },

  submit: function() {
    const { courseName, description, isPublic, courseID } = this.data;
  
    if (!courseID) {
      wx.showToast({
        title: '未找到课程ID',
        icon: 'none',
      });
      return;
    }
  
    if (!courseName.trim()) {
      wx.showToast({
        title: '课程名称不能为空',
        icon: 'none',
      });
      return;
    }
  
    // 调用云开发数据库更新数据
    wx.cloud.database().collection('courses').doc(courseID).update({
      data: {
        courseName: courseName,
        description: description,
        isPublic: isPublic,
      }
    }).then(res => {
      wx.showToast({
        title: '更新成功',
        icon: 'success',
      });
    }).catch(err => {
      console.error('更新课程信息失败:', err);
      wx.showToast({
        title: '更新失败',
        icon: 'none',
      });
    });
  },
  

});
