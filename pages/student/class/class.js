Page({
  data: {
    studentId: '', // 当前用户的ID
    className: '',
    description: '',
    currentTime: '',
    questions: [],
    currentquestions: [],
  previousCurrentQuestions:[],
    
    selectedAnswers: [], // 修改为数组，用于存储每个题目的答案
    submitted: [], // 新增提交状态数组
    //selectedAnswer: '', // 记录每个题目的答案, // 用于存储选中的答案
    currentIndex: 0,
    intervalId: null,
    isAccordionOpen: true,
    letterMap: "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
    classId: '8df0e92f67278afb123ae9147cdebbcc' // 固定的classId，用于测试
  },

  onLoad: function (options) {
    console.log('Page loaded with options:', options);
    // 如果从上一个页面传递了classId，使用传递的值
    if (options.classId) {
      this.setData({
        classId: options.classId
      });
    }
    // 获取当前用户ID
    // 获取当前用户ID
    const app = getApp();
    const studentId = app.globalData.userID;
    if (studentId) {
      this.setData({
        studentId: studentId
      });
    } else {
      console.error('Student ID not found in app.globalData');
    };
    this.updateTime(); //获取当前时间
    this.intervalId = setInterval(this.updateTime.bind(this), 1000); //每秒更新一次
    this.getClassQuestions(this.data.classId); //拉取历史题目
    this.startPolling(this.data.classId);
    this.fetchQuestion(this.data.classId); //当前要做的题目
    this.fetchClassDetails(this.data.classId); //拉取当前课程信息
    // 保存当前的 currentquestions 数组
  this.previousCurrentQuestions = this.data.currentquestions;
    // 初始化 selectedAnswers 数组
    this.setData({
      selectedAnswers: new Array(this.data.currentquestions.length).fill(''),
      submitted: new Array(this.data.currentquestions.length).fill(false)
    });
  },

  onUnload: function () {
    clearInterval(this.data.intervalId);
  },
  toggleAccordion: function () {
    this.setData({
      isAccordionOpen: !this.data.isAccordionOpen
    });
  },
  startPolling: function (classId) {
    const intervalId = setInterval(() => {
      this.getClassQuestions(classId);
      this.fetchQuestion(classId);
    }, 5000);
    this.setData({
      intervalId
    });
  },

  fetchQuestion: async function(classId) {
    try {
      const res = await wx.cloud.callFunction({
        name: 'getStudentQuestions',
        data: {
          classId: classId
        }
      });
  
      if (res.result.success && res.result.currentquestions) {
        const newCurrentQuestions = res.result.currentquestions;
        this.fetchUserAnswers();
        // 比较新旧 currentquestions 数组
        const currentquestionsChanged = JSON.stringify(newCurrentQuestions) !== JSON.stringify(this.previousCurrentQuestions);
  
        if (currentquestionsChanged) {
          this.setData({
            currentquestions: newCurrentQuestions,
            selectedAnswers: new Array(newCurrentQuestions.length).fill(''),
            submitted: new Array(newCurrentQuestions.length).fill(false)
          });
  
          // 更新 previousCurrentQuestions
          this.previousCurrentQuestions = newCurrentQuestions;
        } else {
          this.setData({
            currentquestions: newCurrentQuestions
          });
        }
      } else {
        this.setData({
          currentquestions: null
        });
      }
    } catch (err) {
      console.error('获取问题失败', err);
    }
  },

  //获取学生答案
  // 获取用户的历史答题记录
  fetchUserAnswers: function () {
    const { questions, studentId, classId } = this.data;

    Promise.all(questions.map(async (question) => {
      const result = await wx.cloud.callFunction({
        name: 'getStudentsAnswer',
        data: {
          studentId: studentId,
          classId: classId,
          questionId: question._id,
          publishCount: question.publishCount
        }
      });
      if (result.result.success) {
        question.userAnswer = result.result.answer;
      } else {
        question.userAnswer = '您未作答';
      }
    })).then(() => {
      this.setData({ questions });
    }).catch((err) => {
      console.error('Error fetching user answers:', err);
      wx.showToast({
        title: '获取答题记录失败',
        icon: 'none',
        duration: 2000
      });
    });
  },
  // 添加获取班级名称的方法
  fetchClassDetails: function (classId) {
    wx.cloud.callFunction({
      name: 'getClassDetails', // 调用的云函数名称
      data: {
        classId: classId
      }
    }).then(res => {
      if (res.result && res.result.res) {
        console.log("details", res.result);
        this.setData({
          className: res.result.res[0].class_name,
          description: res.result.res[0].description
        });
      } else {
        console.error('获取课堂信息失败');
      }
    }).catch(err => {
      console.error('获取课堂信息失败', err);
    });
  },
  // 选择答案
  selectAnswer: function (e) {
    const {
      answer,
      index
    } = e.currentTarget.dataset;
    this.setData({
      selectedAnswers: this.data.selectedAnswers.map((value, i) => i === index ? answer : value)
    });
  },
  // 提交答案
  submitAnswer: function (e) {
    const {
      index
    } = e.currentTarget.dataset;
    const {
      classId,
      currentquestions,
      selectedAnswers,
      studentId
    } = this.data;
    const currentQuestion = currentquestions[index];
    const selectedAnswer = selectedAnswers[index];
    const isSubmitted = this.data.submitted[index];

    if (isSubmitted) {
      wx.showToast({
        title: '已提交过答案',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    if (!selectedAnswer) {
      wx.showToast({
        title: '请选择一个答案',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    // 调用云函数提交答案
    wx.cloud.callFunction({
      name: 'submitAnswer',
      data: {
        classId: classId,
        questionId: currentQuestion._id,
        answer: selectedAnswer,
        studentId: studentId
      },
      
      success: res => {
        console.log(res.result);
        if (res.result.success) {
          wx.showToast({
            title: '提交成功',
            icon: 'success',
            duration: 2000
          });
          // 重新加载当前问题更新提交状态
          this.setData({
            submitted: this.data.submitted.map((value, i) => i === index ? true : value)
          });
        } else {
          wx.showToast({
            title: '提交失败',
            icon: 'none',
            duration: 2000
          });
        }
      },
      fail: err => {
        console.error('[云函数] [submitAnswer] 调用失败', err);
        wx.showToast({
          title: '提交失败',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },


  toggleAnswerVisibility: function (e) {
    const index = e.currentTarget.dataset.index; // 获取当前问题的索引
    let questions = this.data.questions; // 获取问题列表
    questions[index].isAnswerVisible = !questions[index].isAnswerVisible; // 切换答案的可见性
    this.setData({ // 更新数据
      questions: questions
    });
  },
  getClassQuestions: function (classId) {
    console.log('Calling getQuestions cloud function with classId:', classId);
    wx.cloud.callFunction({
      name: 'getQuestions',
      data: {
        classId: classId
      },
      success: res => {
        console.log('Cloud function success:', res);
        if (!res.result.error) {
          this.setData({
            questions: res.result.questions
          });
          console.log('questions', res.result.questions);
        } else {
          console.error('Cloud function error:', res.result.error);
        }
      },
      fail: err => {
        console.error('Cloud function call failed:', err);
      }
    });
  },

  onSwiperChange: function (e) {
    this.setData({
      currentIndex: e.detail.current
    });
  },

  onPrevQuestion: function () {
    let newIndex = this.data.currentIndex - 1;
    if (newIndex < 0) newIndex = this.data.questions.length - 1;
    this.setData({
      currentIndex: newIndex
    });
  },

  onNextQuestion: function () {
    let newIndex = this.data.currentIndex + 1;
    if (newIndex >= this.data.questions.length) newIndex = 0;
    this.setData({
      currentIndex: newIndex
    });
  },
  // 获取当前时间并格式化
  updateTime: function () {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const formattedTime = `${hours}:${minutes}:${seconds}`;
    this.setData({
      currentTime: formattedTime
    });
  },


});