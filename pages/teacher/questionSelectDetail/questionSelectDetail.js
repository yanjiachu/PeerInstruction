Page({
    data: {
        question: {}
    },
    onLoad: function(options) {
        const question2Str = options.question2Str;
        const questionTemp = JSON.parse(decodeURIComponent(question2Str));
        this.updataQuestionData(questionTemp);
        this.setData({question : questionTemp});
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
        // console.log(this.data.question);
    },
    previewImage() {
        wx.previewMedia({
            sources: [{ url: this.data.question.image, type: 'image' }],
        })
    },
    onSelect: function() {
        const eventChannel = this.getOpenerEventChannel();
        eventChannel.emit('acceptDataFromDetail', {
            isSelected: true
        });
        wx.navigateBack({
            delta: 1
        });
    },
    onDelete: function() {
        const eventChannel = this.getOpenerEventChannel();
        eventChannel.emit('acceptDataFromDetail', {
            isSelected: false
        });
        wx.navigateBack({
            delta: 1
        });
    }
})
