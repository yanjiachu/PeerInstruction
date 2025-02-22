// pages/teacher/center/index.js
const tabService = require("../../../utils/tabService");

Page({

    data: {
      //标签栏
      tabs: [
        { name: "我的课程" },
        { name: "全部课程" },
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
          { pagePath: 'pages/teacher/TeacherQuestionBank/qB', text: '题库管理', iconPath: '/static/menuTabs/  icon1.png', selectedIconPath: '/static/menuTabs/icon1_act.png' },
          { pagePath: 'pages/teacher/center/center', text: '个人信息', iconPath: '/static/menuTabs/mine.  png', selectedIconPath: '/static/menuTabs/mine1.png' },
          { pagePath: 'pages/student/index/index', text: '学生首页', iconPath: '/static/menuTabs/index. png', selectedIconPath: '/static/menuTabs/index1.png' },
          { pagePath: 'pages/student/center/center', text: '个人信息', iconPath: '/static/menuTabs/mine.  png', selectedIconPath: '/static/menuTabs/mine1.png' }
        ],
        color: "#FFFFFF",
        selectedColor: "#FFEA00",
        borderStyle: "black",
        backgroundColor: "#990033"
      }
    },
    onLoad(options) {
      this.fetchCourses();
      this.listenCourseChanges();
    },

    onReady() {

    },
    onShow() {
        tabService.updateIndex(this, 0);
    },
    onHide() {

    },
    onUnload() {
      if (this.data.myCoursesListener) {
        this.data.myCoursesListener.close();
      }
      if (this.data.allCoursesListener) {
        this.data.allCoursesListener.close();
      }
    },
    onPullDownRefresh() {

    },
    onReachBottom() {

    },
    onShareAppMessage() {

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
    
  
    // 启动监听课程变化
    listenCourseChanges() {
      // 监听我的课程
      const myCoursesListener = wx.cloud.database().collection('courses')
        .where({ 'teacher.teacherID': getApp().globalData.userID })
        .watch({
          onChange: (snapshot) => {
            console.log('My Courses Updated:', snapshot);
            // 数据发生变化时，更新我的课程数据
            this.setData({
              myCourses: snapshot.docs,
              courses: snapshot.docs // 如果当前显示的是我的课程，直接更新
            }, () => {
              this.printCourse()
            });
          },
          onError: (err) => {
            console.error('Error watching my courses:', err);
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

    fetchCourses() {
      wx.showLoading({ title: '加载中...' });
  
      // 获取我的课程
      wx.cloud.database().collection('courses')
        .where({ 'teacher.teacherID': getApp().globalData.userID })
        .get()
        .then(res => {
          console.log('Fetched My Courses:', res.data);
          this.setData({
            myCourses: res.data,
            courses: res.data // 初始化时显示我的课程
          }, () => {
            this.printCourse()
          });
        })
        .catch(err => {
          wx.showToast({ title: '加载失败', icon: 'none' });
          console.error(err);
        })
        .finally(() => {
          wx.hideLoading();
        });
  
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
        .finally(() => {
          wx.hideLoading();
        });
    },

    printCourse() {
      const coursesWithColors = this.data.courses.map((course, index) => {
        const colorIndex = course._id ? 
          course._id.charCodeAt(0) % this.data.bgColors.length : 
          index % this.data.bgColors.length; // 依据 _id 或索引生成固定颜色
        return {
          ...course,
          bgColor: this.data.bgColors[colorIndex]
        };
      });
      this.setData({
        courses: coursesWithColors
      });
    },
    

    onReachBottom() {
      if (this.data.activeTab === 1 && this.data.allCoursesHasMore) {
        this.fetchAllCourses();
      }
    },

    onCreateCourseTap: function() {
      wx.navigateTo({
        url: '/pages/teacher/course/createCourse/createCourse',
      })
    },
    onCourseCardTap: function(event) {
      const courseID = event.currentTarget.dataset.id;
      const courseName = event.currentTarget.dataset.coursename
      wx.navigateTo({
        url: `/pages/teacher/course/courseDetail/courseDetail?courseID=${courseID}&courseName=${encodeURIComponent(courseName)}`,
      })
    },

})