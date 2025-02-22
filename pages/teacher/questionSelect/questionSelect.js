// pages/teacher/questionSelect/questionSelect.js

Page({
    data: {
        placeholderText: "输入标签，用空格分隔，标签最多支持2个",
        questionsCount: 0,
        currentTag: '',
        tags: [],
        items: [
        ],
        itemsIndex: [],
        itemsIndexTemp: [],
        selectedQuestionCount: 0,
        selectedQuestionID: [],
        courseName: '',
        className: '',
        sortStandardList: ['默认排序', '按难度排序', '按引用量排序'],
        sortStandard: 0
    },
    onLoad: function (options) {
        // console.log(options);
        this.setData({
            courseName: options.courseName,
            className: options.className,
            questionsCount: this.data.items.length
        });
    },
    //标签
    inputTag: function (e) {
        let value = e.detail.value;
        // 检查用户是否按下删除键，并且输入框为空
        if (this.data.currentTag === '' && e.detail.cursor === 0 && e.detail.keyCode === 8) {
            this.deleteLastTag();
            return;
        }
        if (value.endsWith(' ') || value.endsWith('\n')) {
            if (value.length <= 10 && this.data.tags.length <= 1) {
                this.addTag(value.trim());
                if (this.data.tags.length) {
                    this.setData({ placeholderText: "" });
                }
            }
            value = '';
        }
        this.setData({ currentTag: value });
    },
    handleConfirm() {
        this.addTag(this.data.currentTag.trim());
        this.setData({ currentTag: '' });
    },
    addTag(tag) {
        if (tag && this.data.tags.indexOf(tag) === -1) {
            this.data.tags.push(tag);
            this.setData({ tags: this.data.tags });
        }
    },
    deleteTag(e) {
        const index = e.currentTarget.dataset.index;
        this.data.tags.splice(index, 1);
        if (this.data.tags.length === 0) {
            this.setData({ placeholderText: "输入标签，用空格分隔，标签最多支持2个" });
        }
        this.setData({ tags: this.data.tags });
    },
    deleteLastTag() {
        const tags = this.data.tags;
        if (tags.length) {
            tags.pop();
            this.setData({ tags });
        }
    },
    // 查询
    handleSearch: function () {
        const tagsCount = this.data.tags.length;
        if (tagsCount < 1 || tagsCount > 2) {
            wx.showToast({
                title: '请重新输入标签',
                icon: 'none',
                duration: 2000
            });
            return;
        }
        console.log(this.data.tags);
        wx.showLoading({
            title: '正在检索题目...',
            mask: true
        });
        wx.cloud.callFunction({
            name: "questionSelect",
            data: {
                funcType: 1,
                selectArgs: this.data.tags
            },
            success: (res) => {
                console.log(res);
                wx.hideLoading();
                if (res.result.success) {
                    this.setData({
                        items: res.result.data,
                    });
                    const itemLength = this.data.items.length;
                    this.setData({
                        itemsIndex: Array.from({ length: itemLength }, (_, index) => index),
                        itemsIndexTemp: Array.from({ length: itemLength }, (_, index) => index),
                        sortStandard: 0,
                        questionsCount: itemLength
                    });
                } else {
                    wx.showLoading({
                        title: '检索失败',
                        mask: true
                    });
                }
            }, fail(res) {
                wx.hideLoading();
                wx.showLoading({
                    title: '请求错误，请检查网络配置',
                    mask: true
                });
            }
        });
    },
    // 选择题目
    goToOriginalQuestion(event) {
        const i = event.currentTarget.dataset.index;
        const index = this.data.itemsIndex[i];
        const questionValue = this.data.items[index];
        const question2Str = encodeURIComponent(JSON.stringify(questionValue));
        const that = this;
        wx.navigateTo({
            url: '/pages/teacher/questionSelectDetail/questionSelectDetail?question2Str=' + question2Str,
            events: {
                acceptDataFromDetail: function (data) {
                    if (data.isSelected) {
                        that.data.items[index].isSelected = true;
                        that.data.selectedQuestionID.push(that.data.items[index]._id);
                    } else {
                        that.data.items[index].isSelected = false;
                        that.data.selectedQuestionID.pop(that.data.items[index]._id);
                    }
                    that.setData({
                        items: that.data.items,
                        selectedQuestionCount: that.data.selectedQuestionID.length
                    });
                }
            }
        });
    },
    selectEnd: function () {
        const eventChannel = this.getOpenerEventChannel();
        const selectQuestions = this.data.items.filter(question => question.isSelected);
        // console.log(selectQuestions);
        eventChannel.emit('acceptDataFromSelect', {
            selectQuestionID: this.data.selectedQuestionID,
            questions: selectQuestions
        });
        wx.navigateBack({
            delta: 1
        });
    },
    // 题目排序
    bindPickerChange: function (e) {
        const index = e.detail.value;
        console.log('picker', e);
        const questions = this.data.items;
        if (questions.length) {
            const list = Array.from({ length: questions.length }, (_, index) => index);
            switch (index) {
                case '0':
                    // 默认
                    console.log(0);
                    this.setData({ itemsIndex: JSON.parse(JSON.stringify(this.data.itemsIndexTemp)) });
                    break;
                case '1':
                    // 难度
                    console.log(1);
                    list.sort((a, b) => questions[b].difficulty - questions[a].difficulty);
                    this.setData({ itemsIndex: list });
                    break;
                case '2':
                    // 引用量
                    console.log(2);
                    list.sort((a, b) => questions[b].quotedCount - questions[a].quotedCount);
                    this.setData({ itemsIndex: list });
                    break;
            }
            // console.log(this.data.items);
            this.setData({ sortStandard: index });
        } else {
            wx.showToast({
                title: '请先筛选题目',
                icon: 'none',
                duration: 2000
            });
        }
        console.log(this.data.itemsIndex);
        console.log(this.data.itemsIndexTemp);
    }
})