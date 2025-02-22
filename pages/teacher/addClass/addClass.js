const db = wx.cloud.database();

Page({
  data: {
    courseId: '',
    courseName: '',
    class_name: '',
    description: '',
    teacher_id: '',
    location: '',
    student_ids: '',
    startDate: '',
    startTime: '',
    startDateTime: '',
    endDate: '',
    endTime: '',
    endDateTime: '',
    selectQuestionID: [],
    questions: []
  },
  onLoad: function (options) {
    // 获取从上一个页面传递过来的 courseId
    if (options && options.courseId) {
      this.setData({
        courseId: options.courseId,
        courseName: decodeURIComponent(options.courseName)
      });
    }
    const questionsWithShowMore = this.data.questions.map(question => ({
      ...question,
      showMore: false
    }));
      wx.cloud.callFunction({
        name: 'getStudentList',
        data: {
          courseID: this.data.courseId
        },
        success: res => {
          console.log(res.result.students)
          const students = res.result.students || [];
          const student_ids = students.map(student => students.id)
          this.setData({
            student_ids: student_ids
          })
          console.log(this.data.student_ids)
        },
        fail: err => {
          console.log('云函数调用失败', err)
        }
      })
    this.setData({
      questions: questionsWithShowMore
    });
  },
  inputClassName(e) {
    this.setData({
      class_name: e.detail.value
    });
  },
  inputDescription(e) {
    this.setData({
      description: e.detail.value
    });
  },

  inputLocation(e) {
    this.setData({
      location: e.detail.value
    });
  },
  inputStudentIds(e) {
    this.setData({
      student_ids: e.detail.value
    });
  },
  setStartDate(e) {
    this.setData({
      startDate: e.detail.value
    });
  },
  setStartTime(e) {
    this.setData({
      startTime: e.detail.value
    });
  },
  setEndDate(e) {
    this.setData({
      endDate: e.detail.value
    });
  },
  setEndTime(e) {
    this.setData({
      endTime: e.detail.value
    });
  },

  selectQuestion: function () {
    const courseId = this.data.courseId;
    const courseName = this.data.courseName;
    const className = this.data.class_name;
    const that = this;
    wx.navigateTo({
      url: '/pages/teacher/questionSelect/questionSelect?courseName=' + courseName + '&className=' + className,
      events: {
        acceptDataFromSelect: function (data) {
          that.setData({
            selectQuestionID: data.selectQuestionID,
            questions: data.questions
          });
          console.log(that.data.selectQuestionID);
          console.log(that.data.questions);
        }
      }
    });
  },
  //更新题目引用次数
  updateQuoted: function () {
    wx.cloud.callFunction({
      name: "UpdateQuotedCount",
      data: {
        questionList: this.data.selectQuestionID
      },
      success: (res) => {
        console.log(res);
        wx.showToast({
          title: res.result.message,
          icon: 'none',
          duration: 2000
        });
      },
      fail: (res) => {
        console.log(res);
        wx.hideLoading();
        wx.showToast({
          title: "请求错误，请检查网络配置",
          icon: 'none',
          duration: 2000
        });
      }
    })
  },
  onShow: function (options) {
    // 检查是否有从题目选择页面返回的数据
    if (options && options.questions) {
      this.setData({
        questions: JSON.parse(options.selectedQuestions)
      });
      console.log('questions', this.questions);
    }
  },
  toggleShowMore: function (e) {
    const index = e.currentTarget.dataset.index;
    let questions = this.data.questions;
    questions[index].showMore = !questions[index].showMore;
    this.setData({
      questions: questions
    });
  },
  submitForm(e) {
      const startDateTime= this.data.startDate ? `${this.data.startDate}T${this.data.startTime}` : ''
      const endDateTime= this.data.endDate ? `${this.data.endDate}T${this.data.endTime}` : ''
    this.updateQuoted();
    console.log('Start DateTime:', startDateTime);
    console.log('End DateTime:', endDateTime);
    const classInfo = {
      courseId: this.data.courseId,
      class_name: this.data.class_name,
      description: this.data.description,
      teacher_id: this.data.teacher_id,
      location: this.data.location,
      student_ids: this.data.student_ids,
      created_at: new Date(),
      updated_at: new Date(),
      status: false,
      questions: this.data.selectQuestionID.map(qid => ({
        "ans_is_visible": false,
        "is_visible": false,
        "publishcount": 0,
        "question_id": qid,
        "studentsAnswer": []
      })),
      start_time: startDateTime,
      end_time: endDateTime
    };

    // 验证输入
    if (!classInfo.class_name || !classInfo.location) {
      wx.showToast({
        title: '请填写必填项',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    // 调用云函数保存班级信息
    wx.showLoading({
      title: '正在创建班级...',
      mask: true
    });
    wx.cloud.callFunction({
      name: 'createClass',
      data: {
        classInfo: classInfo
      },
      success: res => {
        wx.hideLoading();
        if (res.result.success) {
          wx.showToast({
            title: '班级创建成功',
            icon: 'success',
            duration: 2000
          });
          this.refresh();
        } else {
          wx.showToast({
            title: '班级创建失败',
            icon: 'none',
            duration: 2000
          });
        }
      },
      fail: err => {
        wx.hideLoading();
        wx.showToast({
          title: '请求错误，请检查网络配置',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },
  refresh: function () {
    this.setData({
      class_name: '',
      description: '',
      teacher_id: '',
      location: '',
      student_ids: '',
      startDate: '',
      startTime: '',
      startDateTime: '',
      endDate: '',
      endTime: '',
      endDateTime: '',
      selectQuestionID: [],
      questions: []
    });
  }
});