const db = wx.cloud.database();

Page({
    data: {
        context: '',
        options: {},
        type: 0,
        answer: [],
        hasImage: false,
        image: '',
        difficulty: 1,
        currentTag: '',
        tags: [],
        optionsNumber: 4,
        placeholderText: "输入标签，用空格分隔，标签最多支持2个"
    },
    onLoad: function () {
        this.updataOptionsDisplay();
    },
    //标签
    inputTag(e) {
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
    //输入题目文本
    inputQuestion(e) {
        this.setData({ context: e.detail.value });
    },

    //选择图片
    chooseImage() {
        wx.chooseMedia({
            count: 1,
            mediaType: ['image'],
            sourceType: ['album', 'camera'],
            camera: 'back',
            success: (res => {
                this.setData({
                    image: res.tempFiles[0].tempFilePath,
                    hasImage: true
                })
            }),
            fail: (err => {
                wx.showToast({
                    title: '图片选择失败',
                    icon: 'none',
                    duration: 1000
                });
            })
        })
    },
    deleteImage() {
        this.setData({
            image: '',
            hasImage: false
        })
    },
    previewImage() {
        wx.previewMedia({
            sources: [{ url: this.data.image, type: 'image' }],
        })
    },
    //选择正确答案
    checkboxChange(event) {
        const label = event.detail.value;
        this.setData({ answer: label });
        // console.log('answer：', this.data.answer);
    },
    // 刷新页面
    refresh: function () {
        this.setData({
            context: '',
            options: {},
            type: 0,
            answer: [],
            hasImage: false,
            image: '',
            difficulty: 1,
            currentTag: '',
            tags: [],
            optionsNumber: 4,
            placeholderText: "输入标签，用空格分隔，标签最多支持2个"
        });
        this.updataOptionsDisplay();
    },
    // 上传！
    inputCheck: function () {
        if (this.data.tags.length < 1) {
            wx.showToast({
                title: '请输入标签',
                icon: 'none',
                duration: 1000
            });
            return false;
        }
        if (this.data.context.length == 0) {
            wx.showToast({
                title: '请输入题目内容',
                icon: 'none',
                duration: 1000
            });
            return false;
        }
        if (!(this.data.options.every(option => option.content.length != 0))) {
            wx.showToast({
                title: '请输入选项内容',
                icon: 'none',
                duration: 1000
            });
            return false;
        }
        if (this.data.answer.length == 0) {
            wx.showToast({
                title: '请输入答案',
                icon: 'none',
                duration: 1000
            });
            return false;
        }
        return true;
    },
    submit() {
        if (!this.inputCheck()) {
            return;
        }
        wx.showLoading({
            title: '正在创建题目...',
            mask: true
        });
        if (this.data.answer.length < 2) {
            this.setData({ type: 0 });
        } else {
            this.setData({ type: 1 });
        }
        const app = getApp();
        let question = {
            context: this.data.context,
            options: this.data.options.map(option => option.content),
            answer: this.data.answer,
            difficulty: this.data.difficulty,
            type: this.data.type,
            hasImage: this.data.hasImage,
            image: '',
            creator: app.globalData.userID,
            quotedCount: 0,
            questionLabel1: this.data.tags[0],
            questionLabel2: this.data.tags.length > 1 ? this.data.tags[1] : ''
        }
        if (this.data.hasImage) {
            wx.cloud.uploadFile({
                cloudPath: 'question/' + new Date().getTime() + '.png',
                filePath: this.data.image,
                success: res => {
                    console.log('图片上传成功', res);
                    question.image = res.fileID;
                    this.insertQuestionToDB(question);
                },
                fail: err => {
                    wx.hideLoading();
                    wx.showToast({
                        title: '图片上传失败',
                        icon: 'none',
                        duration: 1000
                    });
                }
            });
        } else {
            this.insertQuestionToDB(question);
        }
    },
    insertQuestionToDB: function (question) {
        wx.cloud.callFunction({
            name: "questionInsert",
            data: {
                question: question
            },
            success:(res) => {
                console.log(res);
                if (res.result.success) {
                    wx.hideLoading();
                    wx.showToast({
                        title: '题目创建成功',
                        icon: 'none',
                        duration: 2000
                    });
                    this.refresh();
                } else {
                    wx.hideLoading();
                    wx.showToast({
                        title: '题目创建失败',
                        icon: 'none',
                        duration: 2000
                    });
                }
            }, fail(res) {
                wx.hideLoading();
                wx.showToast({
                    title: '请求错误，请检查网络配置',
                    icon: 'none',
                    duration: 1000
                });
            }
        });
    },
    // 选项显示和修改
    increase: function () {
        if (this.data.optionsNumber != 15) {
            this.setData({
                optionsNumber: this.data.optionsNumber + 1
            })
            this.updataOptionsDisplay();
        } else {
            wx.showToast({
                title: '至多有15个选项',
                icon: 'none',
                duration: 1000
            });
        }
    },
    decrease: function () {
        if (this.data.optionsNumber != 2) {
            this.setData({
                optionsNumber: this.data.optionsNumber - 1
            });
            this.updataOptionsDisplay();
        } else {
            wx.showToast({
                title: '至少有2个选项',
                icon: 'none',
                duration: 1000
            });
        }
    },
    updataOptionsDisplay: function () {
        this.setData({
            options: Array.from({ length: this.data.optionsNumber }, (_, index) => ({
                label: String.fromCharCode(65 + index),
                content: '',
                select: false
            })),
            answer: [],
            type: 0
        });
    },
    onOptionInput: function (e) {
        const index = e.currentTarget.dataset.index;
        const value = e.detail.value;
        const options = this.data.options.map((option, i) => {
            if (i === index) {
                return { ...option, content: value };
            }
            return option;
        });
        this.setData({ options });
        // console.log(options);
    },
    difficultyIncrease: function () {
        if (this.data.difficulty != 5) {
            this.setData({
                difficulty: this.data.difficulty + 1
            })
        } else {
            wx.showToast({
                title: '难度至多为5',
                icon: 'none',
                duration: 1000
            });
        }
    },
    difficultyDecrease: function () {
        if (this.data.difficulty != 1) {
            this.setData({
                difficulty: this.data.difficulty - 1
            });
        } else {
            wx.showToast({
                title: '难度至少为1',
                icon: 'none',
                duration: 1000
            });
        }
    }
})