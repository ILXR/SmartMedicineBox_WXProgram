// pages/setMedicine2/setMedicine2.js
var util = require("../../utils/util.js");
var app = getApp();

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

    // 星期选项
    weekCheck: [{
      text: "周日"
    }, {
      text: "周一"
    }, {
      text: "周二"
    }, {
      text: "周三"
    }, {
      text: "周四"
    }, {
      text: "周五"
    }, {
      text: "周六"
    }],

    // 顶部进度栏样式
    processStyle: [{
      left: "#00CC99",
      right: '#ffffff',
      icon: '/icons/circle-fill.png'
    }, {
      left: '#ffffff',
      right: "#00CC99",
      icon: '/icons/circle-fill.png'
    }],

    // 次数选择器
    timePerDayArray: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    timePerDayIndex: 0,
    // 小时选择器 分钟选择器
    time: [
      [],
      ['00', '10', '20', '30', '40', '50']
    ],
    timeIndex: [],
    // 数量选择器
    numPerTimeArray: [],
    numPerTimeIndex: 0,
    numberIndex: [],

    latticeContent: {
      // latticeIndex: 1,
      // hasContent: true,
      // medicineName: "感冒药",
      // timePerDay: 3,
      // numPerTime: 3.5,
      // weekTakeDay: 123,
      // contentDetail: [
      //   {
      //     remindTime: "06:30:00",
      //     takeNumber: 3
      //   },
      //   {
      //     remindTime: "21:00:00",
      //     takeNumber: 3
      //   },
      //   {
      //     remindTime: "22:30:00",
      //     takeNumber: 3
      //   }
      // ]
    },

  },

  // 根据药盒内容设置每一项的选择器index
  setIndex: function () {
    var contentDetail = this.data.latticeContent.contentDetail;
    var timeIndex = this.data.timeIndex;
    var numberIndex = this.data.numberIndex;
    timeIndex = [];
    numberIndex = [];
    for (var i = 0; i < contentDetail.length; i++) {
      var hour = parseInt(contentDetail[i].remindTime.split(":")[0]);
      var minute = parseInt(contentDetail[i].remindTime.split(":")[1]);
      var number = contentDetail[i].takeNumber;
      timeIndex.push([parseInt((hour - 0) / 1), parseInt((minute - 0) / 10)]);
      numberIndex.push(parseInt((number - 0.25) / 0.25));
    }
    this.setData({
      timeIndex: timeIndex,
      numberIndex: numberIndex
    })
  },

  // 提交药盒内容设置
  finishConfig: function () {
    var data = app.globalData;
    var URL = util.commenData.URL;
    var latticeContent = this.data.latticeContent;
    // 请求服务器
    console.log("上传药盒设置", latticeContent);
    wx.request({
      url: URL.baseURL + URL.uploadBoxContent,
      data: {
        unionId: data.userInfo.unionId,
        boxID: data.deviceId,
        latticeIndex: latticeContent.latticeIndex,
        hasContent: latticeContent.hasContent,
        latticeContent: latticeContent
      },
      header: {
        'content-type': 'application/json'
      },
      method: 'POST',
      dataType: 'json',
      responseType: 'text',
      success: (result) => {
        if (result.data.status == 200) {
          console.log("设置药盒数据成功", result.data);
          // 向蓝牙设备发送数据更新
          app.updateBoxConfig(this.data.latticeContent);
          wx.showToast({
            title: '设置成功',
            icon: 'success',
            duration: 2000,
            mask: false,
          });
          app.data.latticeContent = this.data.latticeContent;
          app.data.readContent = true;
          setTimeout(() => {
            wx.switchTab({
              url: '/pages/remind/remind',
              success: (result) => {},
              fail: () => {},
              complete: () => {}
            });
          }, 1000);
        } else {
          console.log("设置药盒数据失败", result.data);
          wx.showModal({
            title: 'TIPS',
            content: '操作失败，请开启手机蓝牙和网络后再进行设置',
            showCancel: false,
            confirmText: '确定',
            confirmColor: '#3CC51F',
            success: (result) => {
              if (result.confirm) {}
            },
            fail: () => {},
            complete: () => {}
          });
        }
      },
      fail: () => {
        console.log("设置药盒数据请求服务器错误")
        wx.showModal({
          title: 'TIPS',
          content: '操作失败，请开启手机蓝牙和网络后再进行设置',
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
      complete: () => {}
    });

  },

  // 根据每天次数设置每次的用药时间 初始化contentDetail
  setReminds: function () {
    var latticeContent = this.data.latticeContent;
    latticeContent.contentDetail.length = 0;
    for (var i = 0; i < latticeContent.timePerDay; i++) {
      var time = this.data.time;
      var begin = 8,
        end = 21;
      // 等间隔设置初始时间
      var interval = (end - begin) / (latticeContent.timePerDay - 1);
      var hindex = parseInt(interval * i) + begin;
      var mindex = parseInt((interval * i - parseInt(interval * i)) * 6);
      latticeContent.contentDetail.push({
        remindTime: time[0][hindex] + ":" + time[1][mindex] + ":00",
        takeNumber: latticeContent.numPerTime
      })
    }
  },

  // 星期几选择
  weekChange: function (event) {
    var tapArray = event.detail.value;
    var latticeContent = this.data.latticeContent;
    latticeContent.weekTakeDay = 0;
    for (var i = 0; i < tapArray.length; i++) {
      var index = parseInt(tapArray[i]);
      latticeContent.weekTakeDay |= (1 << (6 - index));
    }
    this.setData({
      latticeContent: latticeContent
    })
    console.log("星期选择改变", this.data.latticeContent.weekTakeDay)
  },

  // 具体时间选择器 需要修改过后对contentDetail进行排序
  contentTimePickerChange: function (e) {
    // e.target.dataset.index 表示第几个 remind
    // e.detail.value[0] 表示 hourIndex
    // e.detail.value[1] 表示 minIndex
    var indexArr = e.detail.value;
    var detailIndex = e.target.dataset.index;
    var timeIndex = this.data.timeIndex;
    var latticeContent = this.data.latticeContent;
    var timeArray = this.data.time;
    latticeContent.contentDetail[detailIndex].remindTime = timeArray[0][indexArr[0]] + ":" + timeArray[1][indexArr[1]] + ":00";
    timeIndex[detailIndex][0] = indexArr[0];
    timeIndex[detailIndex][1] = indexArr[1];
    latticeContent.contentDetail.sort(util.timeSort);
    this.setData({
      latticeContent: latticeContent,
      timeIndex: timeIndex
    })
    this.setIndex();
  },

  // 具体服药数量选择器
  contentNumPickerChange: function (e) {
    // e.detail.value 表示新的选择器 numPerTimeArray 的 index
    // e.target.dataset.index 表示 contentDetail 的 index
    var index = parseInt(e.detail.value);
    var detailIndex = e.target.dataset.index;
    var numberIndex = this.data.numberIndex;
    var latticeContent = this.data.latticeContent;
    latticeContent.contentDetail[detailIndex].takeNumber = this.data.numPerTimeArray[index];
    numberIndex[detailIndex] = index;
    this.setData({
      latticeContent: latticeContent,
      numberIndex: numberIndex
    })
  },

  // 整体每天次数选择器
  timesPickerChange: function (e) {
    var latticeContent = this.data.latticeContent;
    var index = e.detail.value;
    latticeContent.timePerDay = this.data.timePerDayArray[index];
    this.setReminds();
    this.setData({
      timePerDayIndex: index,
      latticeContent: latticeContent
    });
    this.setIndex();
  },

  // 整体服药数量选择器
  numberPickerChange: function (e) {
    var latticeContent = this.data.latticeContent;
    var index = e.detail.value;
    latticeContent.numPerTime = this.data.numPerTimeArray[index];
    for (var i = 0; i < latticeContent.contentDetail.length; i++) {
      latticeContent.contentDetail[i].takeNumber = latticeContent.numPerTime;
    }
    this.setData({
      numPerTimeIndex: index,
      latticeContent: latticeContent
    });
    this.setIndex();
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 初始化选择器数组
    var numPerTimeArray = this.data.numPerTimeArray;
    var hours = this.data.time[0];
    numPerTimeArray.length = 0;
    hours.length = 0;
    var temp = 0.25;
    while (temp < 100) {
      numPerTimeArray.push(temp);
      temp += 0.25;
    }
    temp = 0;
    while (temp < 24) {
      if (temp < 10)
        hours.push('0' + temp);
      else
        hours.push('' + temp);
      temp++;
    }

    // 从上一页面读取药盒内容设置
    var data = JSON.parse(options.data);
    console.log("跳转设置页面2", data)
    var latticeContent = this.data.latticeContent;
    latticeContent = data;

    // 其他需要初始化的数据
    var timePerDayIndex = this.data.timePerDayIndex;
    var numPerTimeIndex = this.data.numPerTimeIndex;
    timePerDayIndex = 2;
    numPerTimeIndex = 3;

    // 初始化药盒内容
    if (latticeContent.hasContent == false) {
      // 药盒内容未设置
      latticeContent.timePerDay = 3;
      latticeContent.numPerTime = 1;
      latticeContent.weekTakeDay = 127;
      latticeContent.hasContent = true;
      latticeContent.contentDetail = [];
      this.setData({
        latticeContent: latticeContent
      })
      this.setReminds();
    }else{
      timePerDayIndex = latticeContent.timePerDay-1;
      numPerTimeIndex = parseInt((latticeContent.numPerTime - 0.25) / 0.25)
    }

    this.setData({
      time: this.data.time,
      timeIndex: this.data.timeIndex,
      timePerDayIndex: timePerDayIndex,

      numPerTimeArray: numPerTimeArray,
      numPerTimeIndex: numPerTimeIndex,
      numberIndex: this.data.numberIndex,

      latticeContent: latticeContent
    })
    // 初始化选择器index
    this.setIndex();
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