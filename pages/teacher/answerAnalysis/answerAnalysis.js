let Charts = require('../../../utils/wxcharts.js'); // 确保路径正确
var app = getApp();

Page({
  data: {
    classId: '',
    questionId: ''
  },

  onLoad: function (options) {

    // 获取传递的参数
    const classId = options.classId;
    const questionId = options.questionId;

    // 将参数保存到页面的 data 中
    this.setData({
      classId: classId,
      questionId: questionId
    });

    console.log('Class ID:', classId);
    console.log('Question ID:', questionId);

    var windowWidth = '',
      windowHeight = ''; // 定义宽高
    try {
      var res = wx.getWindowInfo(); // 尝试获取屏幕宽高数据
      windowWidth = res.windowWidth / 750 * 700; // 按比例换算
      windowHeight = res.windowWidth / 750 * 500; // 按比例换算
    } catch (e) {
      console.error('获取窗口信息失败', e);
    }

    // 调用云函数获取数据
    wx.cloud.callFunction({
      name: 'getAnswer',
      data: {
        classId: classId,
        questionId: questionId
      },
      success: res => {
        console.log('云函数调用成功', res.result.series);
        const series = res.result.series;

        // 创建图表
        new Charts({
          canvasId: 'pieCanvas',
          type: 'pie',
          series: series,
          width: windowWidth, // 图表展示内容宽度
          height: windowHeight, // 图表展示内容高度
          dataLabel: true, // 是否在图表上直接显示数据
        });
      },
      fail: err => {
        console.error('云函数调用失败', err);
      }
    });

    // 调用云函数获取数据
    wx.cloud.callFunction({
      name: 'getAnswer',
      data: {
        classId: classId,
        questionId: questionId
      },
      success: res => {
        console.log('云函数调用成功', res.result.series, res.result.series2);
        const series = res.result.series;
        const series2 = res.result.series2;

        // 创建第一个图表
        new Charts({
          canvasId: 'pieCanvas',
          type: 'pie',
          series: series,
          width: windowWidth,
          height: windowHeight,
          dataLabel: true,
        });

        // 创建第二个图表
        new Charts({
          canvasId: 'pieCanvas2',
          type: 'pie',
          series: series2,
          width: windowWidth,
          height: windowHeight,
          dataLabel: true,
        });
      },
      fail: err => {
        console.error('云函数调用失败', err);
      }
    });
  }
});