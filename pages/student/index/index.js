// pages/student/index/index.js
const tabService = require("../../../utils/tabService");

Page({

    data: {
        //标签栏
        tabs: [
            { name: "我的课程" },
            { name: "更多课程" }
        ],
        activeTab: 0, // 默认选中第一个标签

        //课程列表
        courses: [],
        myCourses: [],
        allCourses: [],
        allCoursesPage: 0,
        allCoursesHasMore: true,
        scrollPosition: [0, 0],
        bgColors: ['#00BCD4', '#FF8A65', '#4DB6AC', '#7986CB', '#9575CD', '#F06292'],

        //导航栏
        tabIndex: 0,  // 默认选中第一个 Tab
        tabBar: {
            list: [
                { pagePath: 'pages/teacher/index/index', text: '教师首页', iconPath: '/static/menuTabs/index. png', selectedIconPath: '/static/menuTabs/index1.png' },
                { pagePath: 'pages/teacher/TeacherQuestionBank/qB', text: '题库管理', iconPath: '/static/menuTabs/icon1.png', selectedIconPath: '/static/menuTabs/icon1_act.png' },
                { pagePath: 'pages/teacher/center/center', text: '个人信息', iconPath: '/static/menuTabs/mine.  png', selectedIconPath: '/static/menuTabs/mine1.png' },
                { pagePath: 'pages/student/index/index', text: '学生首页', iconPath: '/static/menuTabs/index. png', selectedIconPath: '/static/menuTabs/index1.png' },
                { pagePath: 'pages/student/center/center', text: '个人信息', iconPath: '/static/menuTabs/mine.  png', selectedIconPath: '/static/menuTabs/mine1.png' }
            ],
            color: "#FFFFFF",
            selectedColor: "#FFEA00",
            borderStyle: "black",
            backgroundColor: "#990033",
        },

        //弹窗
        showDialog: false,
        selectedCourse: '',
        buttons: [{ text: '取消' }, { text: '加入' }]
    },

    onLoad() {
        this.fetchMyCourses();
        this.fetchAllCourses();
        this.listenCourseChanges();
        console.log('test', this.data.courses)
    },

    async fetchMyCourses() {
        wx.showLoading({ title: '加载中...' });

        // 获取我的课程
        const db = wx.cloud.database()
        const coursesStudentsRes = await db.collection('courses_students')
            .where({ 'studentID': getApp().globalData.userID })
            .get()

        const courseIDs = coursesStudentsRes.data.map(item => item.courseID);
        console.log(courseIDs)

        if (courseIDs.length === 0) {
            this.setData({
                myCourses: [],
            })
            return;
        }

        db.collection('courses')
            .where({
                _id: db.command.in(courseIDs)
            })
            .get()
            .then(res => {
                console.log('Fetched My Courses:', res.data)
                this.setData({
                    courses: res.data,
                    myCourses: res.data
                }, () => {
                    this.printCourse()
                });
                wx.hideLoading();
            })
            .catch(err => {
                wx.showToast({ title: '加载失败', icon: 'none' });
                console.error(err);
                wx.hideLoading();
            })
            .finally(() => {
                wx.hideLoading();
            });
    },

    fetchAllCourses() {
        // 获取全部公开课程
        wx.cloud.database().collection('courses')
            .where({
                isPublic: true
            })
            .get()
            .then(res => {
                console.log('Fetched All Courses:', res.data);
                this.setData({
                    allCourses: res.data
                }, () => {
                    this.printCourse()
                });
            })
            .catch(err => {
                wx.showToast({ title: '加载失败', icon: 'none' });
                console.error(err);
            })
    },

    printCourse() {
        const coursesWithColors = this.data.courses.map((course, index) => {
            const colorIndex = course._id ?
                course._id.charCodeAt(0) % this.data.bgColors.length :
                index % this.data.bgColors.length; // 依据 _id 生成固定颜色
            return {
                ...course,
                bgColor: this.data.bgColors[colorIndex]
            };
        });
        this.setData({
            courses: coursesWithColors
        });
    },

    // 启动监听课程变化
    listenCourseChanges() {
        const db = wx.cloud.database();
        const studentID = getApp().globalData.userID;
        // 监听我的课程
        const myCoursesListener = db.collection('courses_students')
            .where({ studentID })
            .watch({
                onChange: async (snapshot) => {
                    console.log('Courses_Students Updated:', snapshot);

                    if (snapshot.docs.length > 0) {
                        // 获取所有 courseID
                        const courseIDs = snapshot.docs.map(item => item.courseID);

                        try {
                            // 查询 courses 表获取课程详情
                            const coursesRes = await db.collection('courses')
                                .where({
                                    _id: db.command.in(courseIDs)
                                })
                                .get();

                            // 更新页面数据
                            this.setData({
                                myCourses: coursesRes.data,
                                courses: coursesRes.data // 如果当前显示的是我的课程，直接更新
                            }, () => {
                                this.printCourse();
                            });
                        } catch (error) {
                            console.error('Failed to fetch courses:', error);
                        }
                    } else {
                        // 如果没有课程数据，清空相关内容
                        this.setData({
                            myCourses: [],
                            courses: []
                        });
                    }
                },
                onError: (err) => {
                    console.error('Error watching courses_students:', err);
                }
            });

        // 监听全部课程
        const allCoursesListener = wx.cloud.database().collection('courses').watch({
            onChange: (snapshot) => {
                console.log('All Courses Updated:', snapshot);
                // 数据发生变化时，更新全部课程数据
                this.setData({
                    allCourses: snapshot.docs
                }, () => {
                    this.printCourse()
                });
            },
            onError: (err) => {
                console.error('Error watching all courses:', err);
            }
        });

        // 将监听器存储在实例中，方便后续取消监听
        this.setData({
            myCoursesListener,
            allCoursesListener
        });
    },

    onUnload() {
        if (this.data.myCoursesListener) {
            this.data.myCoursesListener.close();
        }
        if (this.data.allCoursesListener) {
            this.data.allCoursesListener.close();
        }
    },

    onShow() {
        tabService.updateIndex(this, 0);
    },

    switchTab(e) {
        const index = e.currentTarget.dataset.index; // 获取点击的标签索引
        this.setData({
            activeTab: index,
            courses: index === 0 ? this.data.myCourses : this.data.allCourses // 通过 courses 来统一管理
        }, () => {
            this.printCourse();
        });
    },

    onCourseCardTap: function (event) {
        const courseID = event.currentTarget.dataset.id;
        const courseName = event.currentTarget.dataset.coursename;
        console.log(courseID)
        wx.navigateTo({
            url: `/pages/student/course/courseDetail/courseDetail?courseID=${courseID}&courseName=${encodeURIComponent(courseName)}`,
        })
    },

    onJoinTap: function (event) {
        const courseID = event.currentTarget.dataset.parentId;
        console.log(courseID)
        this.setData({
            showDialog: true,
            selectedCourse: courseID
        })
    },

    onDialogButtonTap(event) {
        const _btn = event.detail.item.text;
        if (_btn == '加入') {
            this.joinCourse()
        }
        this.setData({
            showDialog: false,
        })
    },

    joinCourse: function (event) {
        const courseID = this.data.selectedCourse;
        const studentID = getApp().globalData.userID;
        if (!courseID || !studentID) {
            wx.showToast({ title: '课程ID或用户ID为空', icon: 'none' });
            return
        }

        wx.cloud.database().collection('courses_students')
            .add({
                data: {
                    courseID: courseID,
                    studentID: studentID,
                },
                success: function (res) {
                    wx.showToast({
                        title: '加入成功',
                        icon: 'success'
                    });
                },
                fail: function (err) {
                    wx.showToast({
                        title: '加入失败，请稍后重试',
                        icon: 'none'
                    });
                    console.error('数据插入失败：', err);
                }
            });
    }
})