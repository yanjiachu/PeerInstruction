// pages/teacher/course/courseFile/courseFile.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    courseID: '',
    courseName: '',
    sortOptions: ["按上传时间（从旧到新）", "按上传时间（从新到旧）", "按名称（A-Z）", "按文件类型"],
    selectedSort: 0,
    files: [], // 文件数据
    fileIcons: {
      mp3: "/static/file-icon/file-audio.png",
      doc: "/static/file-icon/file-doc.png",
      text: "/static/file-icon/file-text.png",
      xls: "/static/file-icon/file-excel.png",
      pdf: "/static/file-icon/file-pdf.png",
      image: "/static/file-icon/file-pic.png",
      ppt: "/static/file-icon/file-ppt.png",
      zip: "/static/file-icon/file-zip.png",
      mp4: "/static/file-icon/file-video.png",
    },
    fileWathcher: null,
  },

  onLoad(options) {
    const courseID = options.courseID;
    const courseName = decodeURIComponent(options.courseName)
    this.setData({
      courseID : courseID,
      courseName : courseName
    })
    this.setupFileWatcher();
  },

  onUnload() {
    if (this.data.fileWatcher) {
      this.data.fileWatcher.close();
      console.log('文件监听器已关闭');
    }
  },

  setupFileWatcher() {
    const db = wx.cloud.database();
    const filesCollection = db.collection('files');

    const watcher = filesCollection
      .where({
        courseID: this.data.courseID,
      })
      .watch({
        onChange: this.handleFileListChange.bind(this),
        onError: this.handleWatchError.bind(this),
      });

    this.setData({ fileWatcher: watcher });    
  },

  handleFileListChange(snapshot) {
    console.log('文件数据发生变化:', snapshot);
    this.loadFiles();
  },

  handleWatchError(err) {
    console.error('监听失败:', err);
  },

  loadFiles() {
    wx.showLoading({ title: '加载中...' });
    wx.cloud.callFunction({
      name: "getFileList",
      data: { courseID: this.data.courseID },
      success: res => {
        console.log(res.result)

        const files = res.result.map((file) => ({
          ...file,
          formattedUploadTime: this.formatUploadTime(file.uploadTime),
        }))

        this.setData({
          files: this.sortFiles(files),
        });
        wx.hideLoading();
      },
      fail: err => {
        console.error(err)
      }
    })
  },

  sortFiles(files) {
    const { selectedSort } = this.data;
    switch (selectedSort) {
      case 0: // 按上传时间（从旧到新）
        return files.sort((a, b) => new Date(a.uploadTime) - new Date(b.uploadTime));
      case 1: // 按上传时间（从新到旧）
        return files.sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime));
      case 2: // 按名称（A-Z）
        return files.sort((a, b) => a.fileName.localeCompare(b.fileName));
      case 3: // 按文件类型
        return files.sort((a, b) => a.fileType.localeCompare(b.fileType));
      default:
        return files;
    }
  },

  onSortChange(e) {
    const selectedSort = Number(e.detail.value); // 确保 `selectedSort` 是数字类型
    this.setData({
      selectedSort,
    });
    // 确保重新排序并更新 `files`
    const sortedFiles = this.sortFiles(this.data.files);
    this.setData({ files: sortedFiles });
  },

  formatUploadTime(uploadTime) {
    const date = new Date(uploadTime);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  },

  getCellTitle(file) {
    if (this.data.selectedSort === 0 || this.data.selectedSort === 1) {
      return new Date(file.uploadTime).toLocaleDateString();
    }
    if (this.data.selectedSort === 2) {
      const char = file.fileName.charAt(0).toUpperCase();
      return /^[A-Z]$/.test(char) ? char : "#";
    }
    if (this.data.selectedSort === 3) {
      return file.fileType.toUpperCase();
    }
    return "";
  },

  getCellFooter(file) {
    return this.formatFileSize(file.fileSize);
  },

  onDownload(e) {
    const fileID = e.currentTarget.dataset.id;
    const file = this.data.files.find(item => item._id === fileID);
    this.updateFileStatus(fileID, { isDownloading: true, progress: 0 });

    // 下载文件
    const downloadTask = wx.cloud.downloadFile({
      fileID: file.filePath, // 从文件表获取云文件路径
      success: res => {
        // 下载完成
        if (res.statusCode === 200) {
          this.updateFileStatus(fileID, { isDownloading: false, progress: 100 });
          const filePath = res.tempFilePath
          wx.openDocument({
            filePath: filePath,
            showMenu: true,
            success: function (res) {
              console.log('打开文档')
            }
          })
        }
      },
      fail: err => {
        console.error('下载失败:', err);
        this.updateFileStatus(fileID, { isDownloading: false });
      },
    });

    // 模拟进度
    downloadTask.onProgressUpdate((res) => {
      const files = this.data.files.map((file) => {
        if (file._id === fileID) {
          file.progress = res.progress;
        }
        return file;
      });
      this.setData({ files });
    });

    // 保存下载任务，方便后续暂停或恢复
    this.setData({
      downloadTask: {
        ...this.data.downloadTask,
        [fileID]: downloadTask,
      },
    });
  },

  // 暂停下载
  onPause(e) {
    const fileID = e.currentTarget.dataset.id;
    const task = this.data.downloadTask[fileID];

    if (task) {
      task.abort(); // 暂停下载
    }

    this.updateFileStatus(fileID, { isPaused: true, isDownloading: false });
  },

  // 恢复下载
  onResume(e) {
    const fileID = e.currentTarget.dataset.id;
    const file = this.data.files.find(item => item._id === fileID);

    this.updateFileStatus(fileID, { isPaused: false, isDownloading: true });

    // 从上次进度继续下载
    const downloadTask = wx.cloud.downloadFile({
      fileID: file.filePath,
      progress: file.progress,
      success: res => {
        if (res.statusCode === 200) {
          this.updateFileStatus(fileID, { isDownloading: false, progress: 100 });
        }
      },
      fail: err => {
        console.error('下载失败:', err);
        this.updateFileStatus(fileID, { isDownloading: false });
      },
    });

    // 继续监听下载进度
    downloadTask.onProgressUpdate((res) => {
      const files = this.data.files.map((file) => {
        if (file._id === fileID) {
          file.progress = res.progress;
        }
        return file;
      });
      this.setData({ files });
    });

    // 保存恢复后的下载任务
    this.setData({
      downloadTask: {
        ...this.data.downloadTask,
        [fileID]: downloadTask,
      },
    });
  },

  // 更新文件状态
  updateFileStatus(fileID, updates) {
    const files = this.data.files.map((file) => {
      if (file._id === fileID) {
        return { ...file, ...updates };
      }
      return file;
    });
    this.setData({ files });
  },

  onAddFileTap: function() {
    const courseID = this.data.courseID;
    wx.navigateTo({
      url: `/pages/teacher/course/courseFile/uploadFile/uploadFile?courseID=${courseID}`,
    })
  }
});