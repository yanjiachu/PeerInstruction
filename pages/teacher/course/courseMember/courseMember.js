// pages/teacher/course/courseMember.js
Page({

    data: {
        courseID: '',
        courseName: '',
        teacherName: '',
        showDeleteIcon: false,
        showDialog: false,
        selectedStudentID: '',
        buttons: [{ text: '取消' }, { text: '删除' }]
    },

    onLoad(options) {
        const courseID = options.courseID;
        const courseName = decodeURIComponent(options.courseName)
        const app = getApp();
        if (!app.globalData.userID || !app.globalData.name) {
            wx.showToast({
                title: '用户信息未加载，请稍后重试',
                icon: 'none',
                duration: 2000
            });
            return;
        }
        this.setData({
            courseID: courseID,
            teacherName: app.globalData.name,
            courseName: courseName
        })
        if (courseID) {
            console.log(courseID);
            wx.showLoading({
                title: '加载中……',
            })
            wx.cloud.callFunction({
                name: 'getStudentList',
                data: {
                    courseID: courseID
                },
                success: res => {
                    console.log(res.result.students)
                    this.setData({
                        students: res.result.students
                    })
                    wx.hideLoading();
                },
                fail: err => {
                    console.log('云函数调用失败', err)
                }
            })
        }
    },

    // 点击管理按钮，切换删除图标显示状态
    onManageButtonTap() {
        this.setData({
            showDeleteIcon: !this.data.showDeleteIcon,
        });
    },

    // 点击减号图标，显示弹窗
    onDeleteIconTap(event) {
        const studentID = event.currentTarget.dataset.id;
        this.setData({
            showDialog: true,
            selectedStudentID: studentID
        });
    },

    onDialogButtonTap(event) {
        const _btn = event.detail.item.text;
        if (_btn == '删除') {
            this.removeStudent()
        }
        this.setData({
            showDialog: false,
        })
    },

    removeStudent() {
        const studentID = this.data.selectedStudentID;
        const courseID = this.data.courseID;
        console.log(studentID)
        console.log(courseID)

        if (!studentID || !courseID) {
            console.error("缺少 studentID 或 courseID");
            wx.showToast({
                title: '缺少参数',
                icon: 'error'
            });
            return;
        }

        wx.cloud.database().collection('courses_students').where({
            studentID: studentID,
            courseID: courseID
        })
            .remove()
            .then(res => {
                console.log("删除成功：", res);
                wx.showToast({
                    title: '移除成功',
                    icon: 'success'
                });
                wx.cloud.callFunction({
                    name: 'getStudentList',
                    data: {
                        courseID: courseID
                    },
                    success: res => {
                        console.log(res.result.students)
                        this.setData({
                            students: res.result.students
                        })
                    },
                    fail: err => {
                        console.log('云函数调用失败', err)
                    }
                })
            })
            .catch(err => {
                console.error("删除失败：", err);
                wx.showToast({
                    title: '移除失败',
                    icon: 'error'
                });
            });
    }
})

