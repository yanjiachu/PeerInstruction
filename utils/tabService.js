import {studentUser, teacherUser} from "./tabBarUrl";
// tabBar的data
let tabData = {
    tabIndex: 0,
    tabBar: {
        custom: true,
        color: "#5F5F5F",
        selectedColor: "#07c160",
        backgroundColor: "#F7F7F7",
        list: []
    }
};

// 更新菜单
const updateRole = (that, type) => {
    if (type == 1) {
        tabData.tabBar.list = studentUser;
    } else if (type == 2) {
        tabData.tabBar.list = teacherUser;
    }
    updateTab(that);
}

// 更新底部高亮
const updateIndex = (that, index) => {
    tabData.tabIndex = index;
    updateTab(that);
}

// 更新Tab状态
const updateTab = (that) => {
    if (typeof that.getTabBar === 'function' && that.getTabBar()) {
        that.getTabBar().setData(tabData);
    }
}

module.exports = {
    updateRole, updateTab, updateIndex, tabBar: tabData.tabBar.list
}