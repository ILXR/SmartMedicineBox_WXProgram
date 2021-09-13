// pages/record/record.js
var util = require("../../utils/util.js");
const app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 从app.js获取的全局变量
    BLEconnect: app.globalData.BLEconnect,
    loginSuccess: app.globalData.loginSuccess,
    userInfo: app.globalData.userInfo,
    deviceId: app.globalData.deviceId,

    // 药盒内容样式
    takeColor: '#3CB371',
    ntakeColor: '#FF4500',
    latticeStyle: [{
        color: util.commenData.latticColor[0],
      },
      {
        color: util.commenData.latticColor[1],
      },
      {
        color: util.commenData.latticColor[2],
      },
      {
        color: util.commenData.latticColor[3],
      }
    ],

    // 服药记录列表
    recordList: [
      // {
      //   "UUID": "1",
      //   "medicineName": "降脂药",
      //   "medicineNum": 3.5,
      //   "latticeIndex": 1,
      //   "remindTime": "2019-09-30 10:30",
      //   "state": 1
      // },
      // {
      //   "UUID": "1",
      //   "medicineName": "感冒药",
      //   "medicineNum": 2.5,
      //   "latticeIndex": 3,
      //   "remindTime": "2019-09-31 10:30",
      //   "state": 0
      // }
    ]
  },

  // 上传服药记录时同时修改本地服药记录列表
  addRecord: function (record) {
    var exist = false;
    for (var i = 0; i < this.data.recordList.length; i++) {
      if (record.latticeIndex == this.data.recordList[i].latticeIndex && record.remindTime == this.data.recordList[i].remindTime) {
        exist = true;
        break;
      }
    }
    if (!exist)
      this.data.recordList.push(record);
    this.updateList();
    this.setData({
      recordList: this.data.recordList
    })
  },

  // 辅助函数，判断两个record时间是否相等
  timeEqual: function (a, b) {
    var aday = a.remindTime.split(" ")[0].split("-");
    var bday = b.remindTime.split(" ")[0].split("-");
    var atime = a.remindTime.split(" ")[1].split(":");
    var btime = b.remindTime.split(" ")[1].split(":");
    for (var i = 0; i < 3; i++) {
      if (parseInt(aday[i]) != parseInt(bday[i])) {
        return false
      }
    }
    for (var i = 0; i < 2; i++) {
      if (parseInt(atime[i]) != parseInt(btime[i])) {
        return false
      }
    }
    return true;
  },

  // 点击服用状态进行修改
  // 先修改本地，再上传云端
  changeState: function (options) {
    var URL = util.commenData.URL;
    var index = options.currentTarget.dataset.index;
    var recordList = this.data.recordList;
    if (index >= recordList.length) {
      console.log("读取超出范围");
      return;
    }
    var firstDetail = recordList[index]
    var firstState = recordList[index].state;
    firstState = (firstState + 1) % 2;
    for (var i = index; i < recordList.length; i++) {
      if (this.timeEqual(firstDetail, recordList[i])) {
        recordList[i].state = firstState;
        if (recordList[i].UUID == null)
          continue;
        // 向后台请求修改数据
        console.log("修改服药状态", recordList[i]);
        wx.request({
          url: URL.baseURL + URL.uploadTakeRecord,
          data: {
            UUID: recordList[i].UUID,
            state: recordList[i].state
          },
          header: {
            'content-type': 'application/json'
          },
          method: 'POST',
          dataType: 'json',
          responseType: 'text',
          success: (result) => {
            console.log("修改服药状态成功");
          },
          fail: () => {},
          complete: () => {}
        });
      } else {
        break;
      }
    }
    this.setData({
      recordList: this.data.recordList
    });
  },

  // 获取用户服药记录
  getTakeRecord: function () {
    var getFinished = false;
    var URL = util.commenData.URL;
    wx.showLoading({
      title: "正在获取",
      mask: true,
      success: (result) => {},
      fail: () => {},
      complete: () => {}
    });
    setTimeout(() => {
      wx.hideLoading();
      if (!getFinished) {
        wx.showToast({
          title: '获取超时',
          icon: 'none',
          duration: 1500,
          mask: false,
          success: (result) => {},
          fail: () => {},
          complete: () => {}
        });
        wx.stopPullDownRefresh();
      }
    }, 6000);
    wx.request({
      url: URL.baseURL + URL.downloadTakeRecord,
      data: {
        unionId: this.data.userInfo.unionId
      },
      header: {
        'content-type': 'application/json'
      },
      method: 'POST',
      dataType: 'json',
      responseType: 'text',
      success: (result) => {
        console.log("获取服药记录成功", result.data);
        this.data.recordList = result.data.records;
        this.updateList();
      },
      fail: () => {
        console.log("获取服药记录失败");
        wx.showModal({
          title: 'TIPS',
          content: '内容获取失败，请检查网络后重试',
          showCancel: false,
          confirmText: '确定',
          confirmColor: '#3CC51F',
          success: (result) => {
            if (result.confirm) {}
          },
          fail: () => {},
          complete: () => {}
        });
      },
      complete: () => {
        getFinished = true;
        wx.hideLoading();
        wx.stopPullDownRefresh();
      }
    });
  },

  // 设置显示列表样式 排序等
  updateList: function () {
    var recordList = this.data.recordList;
    console.log(recordList)
    // 排倒序
    recordList.sort(util.daySort);
    this.setData({
      recordList: recordList
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 上传服药记录时更新本地数据
    app.setUpdateRecordCallback(this.addRecord);
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 同步页面数据
    this.setData({
      BLEconnect: app.globalData.BLEconnect,
      loginSuccess: app.globalData.loginSuccess,
      userInfo: app.globalData.userInfo,
      deviceId: app.globalData.deviceId,
    })
    if (app.globalData.loginSuccess)
      this.getTakeRecord();
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    this.getTakeRecord();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})