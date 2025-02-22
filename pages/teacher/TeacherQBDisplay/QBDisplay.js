// pages/question/question.js
Page({
    data: {
        question: {},
        isDisabled: true
    },
    onSelect() {
        const question2Str = encodeURIComponent(JSON.stringify(this.data.question));
        wx.navigateTo({
            url: '../TeacherQuestionRevise/QRevise?question=' + question2Str
        });
    },
    previewImage() {
        wx.previewMedia({
            sources: [{ url: this.data.question.image, type: 'image' }],
        })
    },
    onLoad: function (options) {
        const data = JSON.parse(decodeURIComponent(options.question));
        this.updataQuestionData(data);
        const app = getApp();
        if (this.data.question.creator == app.globalData.userID) {
            this.setData({ isDisabled: false });
        }
    },
    updataQuestionData: function (instance) {
        const options = instance.options.map((value, index) => ({
            label: String.fromCharCode(65 + index),
            content: value,
            select: false
        }));
        instance.options = options;
        const date = new Date(instance.createdTime);
        instance.createdTime = date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        this.setData({ question: instance });
        console.log(this.data.question);
    },
    deleteTap: function () {
        wx.showLoading({
            title: '正在删除题目...',
            mask: true
        });
        const app = getApp();
        wx.cloud.callFunction({
            name: "questionDelete",
            data: {
                userID: app.globalData.userID,
                questionId: this.data.question._id
            },
            success: (res) => {
                console.log(res);
                wx.hideLoading();
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
    }
})
