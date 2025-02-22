// app.js
App({
    onLaunch() {
        if (!wx.cloud) {
            console.error("请使用 2.2.3 或以上的基础库以使用云能力");
          } else {
            wx.cloud.init({
              env: "group5-pi-0g6m7hqka8f427e4",
              traceUser: true,
            });
          }
    },
    globalData: {
        userID: "2ad666ce672790da1248728e65531583",
        userType: 0,
        userName: '用户名',
        name: '姓名',
        email: '123@qq.com',
        list: []
    }
})
