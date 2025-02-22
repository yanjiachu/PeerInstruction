Page({
  data: {
    classId: '8df0e92f67278afb123ae9147cdebbcc',
    courseId:'',
    className: '',
    currentTime: '',
    studentCount: 0,
    teachername: '',
    questions: [],
    publishcount:0,
    currentQuestion: null,
    countdown: 0,
    isAnswerVisible: false,
    unpublishedCollapsed: false,
    publishedCollapsed: true,
    selectedOptionIndex: null,
    letterMap: "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
    publishedQuestions: [], // 已发布的题目列表
    unpublishedQuestions: [], // 未发布的题目列表
    unpublishedCurrentIndex: 0,// 当前显示的未发布题目索引
    // 新增属性
    questionPublishStatus: {},//存储每个题目的发布状态
    countdownTimers: {} // 用于存储每个题目的倒计时定时器
  },

  onLoad: function (options) {
    console.log('options:', options); // 调试输出
    if (options && options.classId) {
      this.setData({
        classId: options.classId,
        courseId:options.courseId
      });
    }
    this.loadClassQuestions();
    this.updateTime();
    this.intervalId = setInterval(this.updateTime.bind(this), 1000);
    this.updateStudentCount();
    this.studentCountInterval = setInterval(this.updateStudentCount.bind(this), 5000); // 每分钟更新一次
  },

  loadClassQuestions: async function()  {
    var that = this; // 保存 this 上下文
    var db = wx.cloud.database();
    console.log('classId:', this.data.classId); // 调试输出
    if (this.data.classId) {
      db.collection('classes').doc(this.data.classId).get({
        success: function (res) {
          console.log('res:', res); // 调试输出
          if (res.data && res.data.questions) {
            var questionIds = res.data.questions.map(q => q.question_id);
            that.loadQuestionsByIds(questionIds);
            that.setData({
              className: res.data.class_name || '未知课堂',
              start_time: res.data.start_time || 0,
              end_time: res.data.end_time || 0,
              teacherId: res.data.teacher_id || '未知教师'
            });
            that.formatTimes();
            that.startClassCountdown();
          } else {
            console.error('文档不存在或没有 questions 字段');
            wx.showToast({
              title: '文档不存在或没有 questions 字段',
              icon: 'none'
            });
          }
        },
        fail: function (err) {
          console.error('加载课堂题目失败', err);
          wx.showToast({
            title: '加载课堂题目失败',
            icon: 'none'
          });
        }
      });
    } else {
      console.error('classId 为空');
    }
  },

  formatTimes: function () {
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    };
    const startTime = new Date(this.data.start_time);
    const endTime = new Date(this.data.end_time);
    this.setData({
      formattedStartTime: formatDate(startTime),
      formattedEndTime: formatDate(endTime)
    });
  },

  onUnload: function () {
    clearInterval(this.intervalId);
    clearInterval(this.studentCountInterval);
  },

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

  viewDataAnalysis: function (e) {
    const classId = this.data.classId;
    const questionId = e.currentTarget.dataset.id;
    console.log("view-analysis questionId",questionId);
  
    // 跳转到数据分析页面
    wx.navigateTo({
      url: '/pages/teacher/answerAnalysis/answerAnalysis?classId=' + classId + '&questionId=' + questionId
    });
  },

  loadQuestionsByIds: function (questionIds) {
    var that = this; // 保存 this 上下文
    var db = wx.cloud.database();
    db.collection('question').where({
      _id: db.command.in(questionIds)
    }).get({
      success: function (res) {
        console.log('questions:', res.data); // 调试输出
        if (res.data) {
          var questions = res.data.map(function (q) {
            return {
              id: q._id,
              context: q.context,
              options: q.options,
              answer: q.answer,
              difficulty: q.difficulty,
              type: q.type,
              hasImage: q.hasImage,
              image: q.image,
              questionLabel1: q.questionLabel1,
              questionLabel2: q.questionLabel2,
              //status: q.status || "not_published",
              //publishedAt: q.publishedAt || null,
              //endTime: q.endTime || null,
              countdown: q.countdown || 60,
              //showAnswer: q.showAnswer || false,
              studentAnswers: q.studentAnswers || [],
              isPublished: false,//q.status === "published",
              publishCount: 0 //q.publishCount || 0

            };
          });
          console.log("thisquesiton",questions);
          // 分割已发布的题目和未发布的题目
          const publishedQuestions = questions.filter(q => q.isPublished);
          const unpublishedQuestions = questions.filter(q => !q.isPublished);

          that.setData({
            questions: questions,
            publishedQuestions: publishedQuestions,
            unpublishedQuestions: unpublishedQuestions
          });
        } else {
          console.error('未找到题目');
          wx.showToast({
            title: '未找到题目',
            icon: 'none'
          });
        }
      },
      fail: function (err) {
        console.error('加载题目失败', err);
        wx.showToast({
          title: '加载题目失败',
          icon: 'none'
        });
      }
    });
  },
//开始上课初始化
startClass: async function() {
  const classId = this.data.classId;

  try {
    // 调用云函数初始化班级数据
    const res = await wx.cloud.callFunction({
      name: 'initializeClass',
      data: {
        classId: classId
      }
    });

    console.log(res.result);
    if (res.result.success) {
      wx.showToast({
        title: '初始化成功',
        icon: 'success',
        duration: 2000
      });
      // 重新加载数据
      await this.loadClassQuestions();
    } else {
      wx.showToast({
        title: '初始化失败',
        icon: 'none',
        duration: 2000
      });
    }
  } catch (err) {
    console.error('[云函数] [initializeClass] 调用失败', err);
    wx.showToast({
      title: '初始化失败',
      icon: 'none',
      duration: 2000
    });
  }
},

  
  publishQuestion: function (e) {
    var questionId = e.currentTarget.dataset.id;
    var classId = this.data.classId;
    var question = this.data.unpublishedQuestions.find(q => q.id === questionId);
  
    if (question) {
      // 首次发布或再次发布
      const isPublishedBefore = this.data.questionPublishStatus[questionId] || false;
      question.isPublished = true;
      question.publishCount += 1;
  
      // 更新本地数据
      const updatedUnpublishedQuestions = this.data.unpublishedQuestions.map(q => {
        if (q.id === questionId) {
          return { ...q, isPublished: true, publishCount: question.publishCount };
        }
        return q;
      });
  
      const updatedPublishedQuestions = [...this.data.publishedQuestions, question];
  
      this.setData({
        currentQuestion: question,
        countdown: question.countdown,
        isAnswerVisible: false,
        selectedOptionIndex: null,
        unpublishedQuestions: updatedUnpublishedQuestions,
        publishedQuestions: updatedPublishedQuestions,
        questionPublishStatus: {
          ...this.data.questionPublishStatus,
          [questionId]: true
        }
      });
  
      // 启动倒计时定时器
      this.startCountdown(questionId, question.countdown);
  
      // 调用云函数更新题目可见性和发布次数
      wx.cloud.callFunction({
        name: 'updateQuestionVisibility',
        data: {
          action: 'publish',
          classId: classId,
          questionId: questionId,
          questionCount: question.publishCount
        },
        success(res) {
          console.log(res.result);
        },
        fail(err) {
          console.error('[云函数] [updateQuestionVisibility] 调用失败', err);
        }
      });
    }
  },
  // publishQuestion: function (e) {
  //   var questionId = e.currentTarget.dataset.id;
  //   var classId = this.data.classId;
  //   var question = this.data.unpublishedQuestions.find(q => q.id === questionId);
  
  //   if (question) {
  //     // 首次发布或再次发布
  //     const isPublishedBefore = this.data.questionPublishStatus[questionId] || false;
  //     question.isPublished = true;
  //     question.publishCount += 1;
  
  //     // 更新本地数据
  //     const updatedUnpublishedQuestions = this.data.unpublishedQuestions.map(q => {
  //       if (q.id === questionId) {
  //         return { ...q, isPublished: true, publishCount: question.publishCount };
  //       }
  //       return q;
  //     });
  
  //     const updatedPublishedQuestions = [...this.data.publishedQuestions, question];
  
  //     this.setData({
  //       currentQuestion: question,
  //       countdown: question.countdown,
  //       isAnswerVisible: false,
  //       selectedOptionIndex: null,
  //       unpublishedQuestions: updatedUnpublishedQuestions,
  //       publishedQuestions: updatedPublishedQuestions,
  //       questionPublishStatus: {
  //         ...this.data.questionPublishStatus,
  //         [questionId]: true
  //       }
  //     });
  
  //     // 启动倒计时定时器
  //     this.startCountdown(questionId, question.countdown);
  
  //     // 调用云函数更新题目可见性和发布次数
  //     wx.cloud.callFunction({
  //       name: 'updateQuestionVisibility',
  //       data: {
  //         action: 'publish',
  //         classId: classId,
  //         questionId: questionId,
  //         questionCount: question.publishCount
  //       },
  //       success(res) {
  //         console.log(res.result);
  //       },
  //       fail(err) {
  //         console.error('[云函数] [updateQuestionVisibility] 调用失败', err);
  //       }
  //     });
  //   }
  // },
  endQuestion: function () {
    const currentQuestionId = this.data.currentQuestion.id;
    const classId = this.data.classId;
  
    // 清除倒计时定时器
    if (this.data.countdownTimers[currentQuestionId]) {
      clearInterval(this.data.countdownTimers[currentQuestionId]);
    }
  
    // 调用云函数使题目不可见
    wx.cloud.callFunction({
      name: 'updateAnswerVisibility',
      data: {
        action: 'end',
        classId: classId,
        questionId: currentQuestionId
      },
      success: res => {
        console.log('更新题目可见性成功', res);
  
        // 成功后更新本地数据
        const updatedPublishedQuestions = this.data.publishedQuestions.filter(q => q.id !== currentQuestionId);
        const updatedUnpublishedQuestions = this.data.unpublishedQuestions.map(q => {
          if (q.id === currentQuestionId) {
            return { ...q, isPublished: false };
          }
          return q;
        });
  
        this.setData({
          publishedQuestions: updatedPublishedQuestions,
          unpublishedQuestions: updatedUnpublishedQuestions,
          currentQuestion: null,
          countdown: 0,
          isAnswerVisible: false,
          selectedOptionIndex: null,
          questionPublishStatus: {
            ...this.data.questionPublishStatus,
            [currentQuestionId]: false
          }
        });
      },
      fail: err => {
        console.error('更新题目可见性失败', err);
      }
    });
  },
  
  updateClassQuestionPublishCount: function (questionId, publishCount) {
    var that = this;
    var db = wx.cloud.database();
    // 先获取当前的 questions 数据
    db.collection('classes').doc(this.data.classId).get({
      success: function (res) {
        if (res.data && res.data.questions) {
          const questions = res.data.questions;
          // 找到需要更新的 question
          const updatedQuestions = Object.keys(questions).reduce((acc, key) => {
            if (questions[key].question_id === questionId) {
              console.log('questions_id:', questions[key]); // 调试输出
              acc[key] = {
                ...questions[key],
                publishcount: publishCount
              };
            } else {
              acc[key] = questions[key];
            }
            return acc;
          }, {});
          // 更新数据库中的 questions
          db.collection('classes').doc(that.data.classId).update({
            data: {
              questions: updatedQuestions
            }
          }).then(res => {
            console.log('更新发布次数成功', res);
          }).catch(err => {
            console.error('更新发布次数失败', err);
          });
        } else {
          console.error('文档不存在或没有 questions 字段');
        }
      },
      fail: function (err) {
        console.error('获取课堂题目失败', err);
      }
    });
  },
  startCountdown: function (questionId, countdown) {
    var that = this;
  
    // 清除之前的定时器（如果存在）
    if (this.data.countdownTimers[questionId]) {
      clearInterval(this.data.countdownTimers[questionId]);
    }
  
    // 启动新的倒计时定时器
    this.data.countdownTimers[questionId] = setInterval(() => {
      var currentCountdown = that.data.countdown - 1;
      that.setData({
        countdown: currentCountdown
      });
  
      if (currentCountdown <= 0) {
        clearInterval(that.data.countdownTimers[questionId]);
        that.endQuestion();
      }
    }, 1000);
  },
  // startCountdown: function () {
  //   var that = this;
  //   var interval = setInterval(() => {
  //     var countdown = that.data.countdown - 1;
  //     that.setData({
  //       countdown
  //     });
  //     if (countdown <= 0) {
  //       clearInterval(interval);
  //       that.endQuestion();
  //     }
  //   }, 1000);
  // },

  updateStudentCount: function () {
    var that = this;
    var db = wx.cloud.database();
    db.collection('classes').doc(this.data.classId).get({
      success: function (res) {
        if (res.data && res.data.student_ids) {
          console.log('class_inform:', res); // 调试输出
          that.setData({
            studentCount: res.data.student_ids.length
          });
        }
      },
      fail: function (err) {
        console.error('获取学生人数失败', err);
      }
    });
  },
//结束课堂
  endClass: function () {
    // 调用云函数或其他逻辑来结束课堂
    wx.cloud.callFunction({
      name: 'endclass',
      data: {
        classId: this.data.classId // 假设 classId 存在于 data 中
      },
      success: res => {
        console.log('课堂结束成功', res);
        // 跳转到 class-list 页面
        wx.navigateBack();
      },
      fail: err => {
        console.error('课堂结束失败', err);
      }
    });
  },

  showAnswer: function () {
    this.setData({
      isAnswerVisible: true
    });
    // 调用云函数更新题目可见性
    wx.cloud.callFunction({
      name: 'updateAnswerVisibility',
      data: {
        action: 'showAnswer',
        classId: this.data.classId,
        questionId: this.data.currentQuestion.id
      },
      success: res => {
        console.log('更新答案可见性成功', res);
      },
      fail: err => {
        console.error('更新答案可见性失败', err);
      }
    });
  },

  selectOption: function (e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      selectedOptionIndex: index
    });
  },

  submitSelectedAnswer: function () {
    var index = this.data.selectedOptionIndex;
    var answer = this.data.currentQuestion.options[index];
    var questionId = this.data.currentQuestion.id;
    var studentAnswer = {
      questionId: questionId,
      answer: answer,
      timestamp: new Date().getTime()
    };
    this.submitToDatabase(studentAnswer);
  },

  submitToDatabase: function (studentAnswer) {
    var that = this;
    var db = wx.cloud.database();
    db.collection('stu_answers').add({
      data: studentAnswer,
      success: function (res) {
        console.log('提交答案成功', res);
        wx.showToast({
          title: '答案提交成功',
          icon: 'success'
        });
        that.setData({
          selectedOptionIndex: null
        });
      },
      fail: function (err) {
        console.error('提交答案失败', err);
        wx.showToast({
          title: '答案提交失败',
          icon: 'none'
        });
      }
    });
  },

  toggleUnpublished: function () {
    this.setData({
      unpublishedCollapsed: !this.data.unpublishedCollapsed
    });
  },

  togglePublished: function () {
    this.setData({
      publishedCollapsed: !this.data.publishedCollapsed
    });
  },

  onUnpublishedSwiperChange(e) {
    const unpublishedCurrentIndex = e.detail.current;
    this.setData({
      unpublishedCurrentIndex
    });
    // 可以在这里添加更多逻辑，例如更新题目状态等
  }
});