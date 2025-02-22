Page({
  data: {
    files: [], 
    courseID: "", 
    uploader: {
      uploaderID: "", 
      uploaderName: "" 
    }
  },

  onLoad(options) {
    const courseID = options.courseID;
    const app = getApp();
    if (!app.globalData.userID || !app.globalData.name) {
      wx.showToast({
        title: '用户信息未加载，请稍后重试',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    this.setData ({
      courseID: courseID,
      uploader: {
        uploaderID: app.globalData.userID,
        uploaderName: app.globalData.name
      }      
    })
  },

  // 选择文件
  chooseFiles() {
    wx.chooseMessageFile({
      count: 5, // 一次最多选择5个文件，可以根据需求修改
      type: 'all', // 可以选择所有类型的文件
      success: (res) => {
        // 选择文件成功后，处理文件列表
        const newFiles = res.tempFiles.map(file => ({
          fileName: file.name,
          fileSize: this.formatFileSize(file.size),
          filePath: file.path
        }));

        // 将选择的文件加入到已选择的文件列表
        this.setData({
          files: [...this.data.files, ...newFiles]
        });
      }
    });
  },

  // 删除文件
  deleteFile(e) {
    const index = e.currentTarget.dataset.index;
    const files = [...this.data.files];
    files.splice(index, 1); // 删除对应文件
    this.setData({
      files
    });
  },

  // 上传文件
  async uploadFiles() {
    const { files, courseID, uploader } = this.data;
    if (files.length === 0) {
      wx.showToast({
        title: '请选择文件',
        icon: 'none'
      });
      return;
    }

    // 上传文件并更新数据库
    for (const file of files) {
      try {
        // 上传文件到云存储
        const res = await wx.cloud.uploadFile({
          cloudPath: `file/${courseID}/${Date.now()}_${file.fileName}`, // 设置云端文件路径
          filePath: file.filePath // 本地文件路径
        });

        const fileID = res.fileID; // 获取上传后的 fileID

        // 保存文件信息到数据库
        const fileData = {
          courseID: courseID,
          fileName: file.fileName,
          filePath: fileID, // 使用云存储返回的 fileID 作为文件路径
          fileSize: file.fileSize,
          fileType: this.getFileType(file.fileName),
          uploadTime: new Date(),
          isDeleted: false,
          uploader: {
            uploaderID: uploader.uploaderID,
            uploaderName: uploader.uploaderName
          }
        };

        // 更新文件信息到数据库
        await wx.cloud.database().collection('files').add({
          data: fileData
        });

        wx.showToast({
          title: '文件上传成功',
          icon: 'success',
          duration: 2000,
          success: function () {
            setTimeout(function () {
              wx.navigateBack();
            }, 2000)
          }
        });

      } catch (error) {
        console.error(error);
        wx.showToast({
          title: '文件上传失败',
          icon: 'none'
        });
      }
    }
  },

  // 获取文件类型
  getFileType(fileName) {
    const extension = fileName.split('.').pop().toLowerCase();
    const typeMap = {
      'pdf': 'pdf',
      'doc': 'doc',
      'docx': 'doc',
      'txt': 'text',
      'md': 'text',
      'xls': 'xls',
      'xlsx': 'xls',
      'png': 'image',
      'jpg': 'image',
      'jpeg': 'image',
      'ppt': 'ppt',
      'pptx': 'ppt',
      'zip': 'zip',
      'rar': 'zip',
      '7z': 'zip',
      'mp3': 'audio',
      'mp4': 'video'
    };
    return typeMap[extension] || 'other'; // 默认为 'other'
  },

  formatFileSize(size) {
    if (size < 1024) return size + " B";
    if (size < 1024 * 1024) return (size / 1024).toFixed(2) + " KB";
    if (size < 1024 * 1024 * 1024) return (size / (1024 * 1024)).toFixed(2) + " MB";
    return (size / (1024 * 1024 * 1024)).toFixed(2) + " GB";
  },
});
