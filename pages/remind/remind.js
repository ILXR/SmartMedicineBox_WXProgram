// pages/remind/remind.js
var util = require("../../utils/util.js");
const app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 从app.js获取的全局变量
    BLEconnect: false,
    loginSuccess: false,
    userInfo: {},
    deviceId: "",

    // 用于消息提示框显示
    curLattice: 1,
    showModel: false,

    // 蓝牙连接状态
    TipText: "设备未连接",

    // 药盒内容样式
    darkStyle: { // 不可点击状态
      AddDark: '/icons/AddDark.png',
      EditDark: '/icons/EditDark.png',
      MedicineDark: '/icons/MedicineDark.png'
    },
    latticeStyle: [{
        index: 1,
        color: util.commenData.latticColor[0],
        darkerColor: '#006400',
        addIcon: util.commenData.latticeAddIcon[0],
        editIcon: util.commenData.latticeEditIcon[0],
        medicineIcon: util.commenData.latticeMedicineIcon[0]
      },
      {
        index: 2,
        color: util.commenData.latticColor[1],
        darkerColor: '#008B8B',
        addIcon: util.commenData.latticeAddIcon[1],
        editIcon: util.commenData.latticeEditIcon[1],
        medicineIcon: util.commenData.latticeMedicineIcon[1]
      },
      {
        index: 3,
        color: util.commenData.latticColor[2],
        darkerColor: '#4B0082',
        addIcon: util.commenData.latticeAddIcon[2],
        editIcon: util.commenData.latticeEditIcon[2],
        medicineIcon: util.commenData.latticeMedicineIcon[2]
      },
      {
        index: 4,
        color: util.commenData.latticColor[3],
        darkerColor: '#000080',
        addIcon: util.commenData.latticeAddIcon[3],
        editIcon: util.commenData.latticeEditIcon[3],
        medicineIcon: util.commenData.latticeMedicineIcon[3]
      }
    ],

    // 药盒内容
    latticeContent: [
      // {
      //   "latticeIndex": 1,
      //   "hasContent": true,
      //   "medicineName": "感冒药",
      //   "timePerDay": 3,
      //   "numPerTime": 3.5,
      //   "weekTakeDay": 127,
      //   "contentDetail": [
      //     {
      //       "remindTime": "06:20:00",
      //       "takeNumber": 3
      //     },
      //     {
      //       "remindTime": "21:00:00",
      //       "takeNumber": 3
      //     },
      //     {
      //       "remindTime": "22:30:00",
      //       "takeNumber": 3
      //     }
      //   ]
      // },
      // {
      //   "latticeIndex": 2,
      //   "hasContent": true,
      //   "medicineName": "发烧药",
      //   "timePerDay": 3,
      //   "numPerTime": 3.5,
      //   "weekTakeDay": 127,
      //   "contentDetail": [
      //     {
      //       "remindTime": "16:10:00",
      //       "takeNumber": 3
      //     },
      //     {
      //       "remindTime": "21:10:00",
      //       "takeNumber": 3
      //     },
      //     {
      //       "remindTime": "22:40:00",
      //       "takeNumber": 3
      //     }
      //   ]
      // },
      // {
      //   "latticeIndex": 3,
      //   "hasContent": false
      // },
      // {
      //   "latticeIndex": 4,
      //   "hasContent": false
      // }
    ],

    // 显示列表属性包括  latticIndex remindTime takeNumber
    // 现在正在服药
    nowRemindTime: "",
    nowRemindList: [],
    // 今日即将服药
    nextRemindTime: "",
    nextRemindList: []
  },

  // 定时器，每隔十分钟执行一次来更新当前正在服药列表
  updateInterval: null,
  updateTimer: null,

  // 更新显示，检测到globaldata变化或者蓝牙连接成功
  updatePage: function (name, value) {
    console.log("全局变量变化", name, value)
    this.setData({
      BLEconnect: app.globalData.BLEconnect,
      loginSuccess: app.globalData.loginSuccess,
      userInfo: app.globalData.userInfo,
      deviceId: app.globalData.deviceId,
    });
    // 获取到用户和设备信息后才能获取药盒内容
    if (app.globalData.loginSuccess && app.globalData.BLEconnect)
      this.getLatticeContent();
  },

  // 点击设置跳转
  ConnectConfig: function () {
    // TODO
    wx.navigateTo({
      url: '../connect/connect',
      success: (result) => {

      },
      fail: () => {},
      complete: () => {}
    });
  },

  // 更新服药提醒列表，现在正在服药列表和今日即将服药列表
  updateList: function () {
    if (this.data.latticeContent.length == 0)
      return;
    // 获取当前时间
    var nowTime = new Date();
    var day = nowTime.getDay();
    var hour = nowTime.getHours();
    var minute = nowTime.getMinutes();
    var dayBinary = 0x01 << (6 - day);

    // 遍历药盒槽，添加待提醒消息到列表中
    var latticeContent = this.data.latticeContent;
    var nextRemindList = this.data.nextRemindList;
    var nowRemindList = this.data.nowRemindList;
    nextRemindList.length = 0;
    nowRemindList.length = 0;
    var nextRemindTime = this.data.nextRemindTime;
    var nowRemindTime = this.data.nowRemindTime;
    for (var i = 0, ilen = latticeContent.length; i < ilen; i++) {
      var item = latticeContent[i];
      if (!item.hasContent) {
        continue;
      } else {
        // weekTakeDay 7位二进制，从左到右分别是日、一、二、三，，，，
        if (!(item.weekTakeDay & dayBinary)) {
          continue;
        }
        // 遍历服药时间列表
        for (var j = 0, jlen = item.contentDetail.length; j < jlen; j++) {
          // temp将存到remindList中
          var {
            ...temp
          } = item.contentDetail[j];
          temp.latticeIndex = item.latticeIndex;
          temp.medicineName = item.medicineName;
          var time = temp.remindTime.split(":");
          time[0] = parseInt(time[0]);
          time[1] = parseInt(time[1]);
          // 检测是否已过服药时间
          if ((time[0] < hour - 1) || (time[0] == hour - 1 && 60 - time[1] + minute > 30) ||
            (time[0] == hour && time[1] + 30 < minute)) {
            continue;
          }
          // 检测是否正在服药
          if ((time[0] == hour && time[1] <= minute && minute <= time[1] + 30) || (time[0] == hour - 1 && 60 - time[1] + minute <= 30)) {
            nowRemindList.push(temp);
          } else {
            nextRemindList.push(temp);
          }
        }
      }
    }
    // 列表排序
    if (nowRemindList.length > 0) {
      nowRemindList.sort(util.timeSort);
      var nowTime = nowRemindList[0].remindTime;
      var time = nowTime.split(":");
      nowRemindTime = time[0] + ":" + time[1];
    } else {
      nowRemindTime = "";
    }
    if (nextRemindList.length > 0) {
      nextRemindList.sort(util.timeSort);
      var nextTime = nextRemindList[0].remindTime;
      var time = nextTime.split(":");
      nextRemindTime = time[0] + ":" + time[1];
    } else {
      nextRemindTime = "";
    }
    this.setData({
      latticeContent: latticeContent,
      // 现在正在服药时间
      nowRemindTime: nowRemindTime,
      // 现在正在服药列表
      nowRemindList: nowRemindList,
      // 今日即将服药时间
      nextRemindTime: nextRemindTime,
      // 今日即将服药列表
      nextRemindList: nextRemindList
    })
  },

  // 点击药盒响应
  latticeTap: function (options) {
    if (!app.globalData.BLEconnect || !app.globalData.loginSuccess) {
      wx.showModal({
        title: 'TIPS',
        content: '请登录并连接设备后再进行设置',
        showCancel: false,
        confirmText: '我知道了',
        confirmColor: '#3CC51F',
        success: (result) => {
          if (result.confirm) {}
        },
        fail: () => {},
        complete: () => {}
      });
      return;
    }
    var lattice = options.currentTarget.dataset.lattice;
    var latticeContent = this.data.latticeContent;
    var curLattice = this.data.curLattice;
    var showModel = this.data.showModel;
    curLattice = lattice.latticeIndex;
    if (lattice.hasContent) {
      showModel = true;
      this.setData({
        curLattice: curLattice,
        showModel: showModel
      })
    } else {
      wx.showModal({
        title: 'TIPS',
        content: '手动添加药品',
        showCancel: true,
        cancelText: '取消',
        cancelColor: '#000000',
        confirmText: '确定',
        confirmColor: '#3CC51F',
        success: (result) => {
          if (result.confirm) {
            // 编辑药盒内容
            wx.navigateTo({
              url: '../setMedicine1/setMedicine1?data=' + JSON.stringify(latticeContent[curLattice - 1]),
              success: (result) => {},
              fail: () => {},
              complete: () => {}
            });
          } else {}
        },
        fail: () => {},
        complete: () => {}
      });
    }
  },

  // 点击自定义消息提示框
  myModelTap: function (options) {
    var URL = util.commenData.URL;
    var id = options.target.id;
    var showModel = this.data.showModel;
    var latticeContent = this.data.latticeContent;
    var curLattice = this.data.curLattice;
    showModel = false;
    if (id == "edit") {
      setTimeout(() => {
        this.setData({
          showModal: false,
        })
      }, 2000);
      // 修改服药设置点击事件
      wx.navigateTo({
        url: '../setMedicine1/setMedicine1?data=' + JSON.stringify(latticeContent[curLattice - 1]),
        success: (result) => {},
        fail: () => {},
        complete: () => {}
      });
    } else if (id == "cancle") {
      // 隐藏提示框
      this.setData({
        showModel: showModel,
      })
      // 向后台发送请求清空数据
      wx.request({
        url: URL.baseURL + URL.uploadBoxContent,
        data: {
          unionId: app.globalData.userInfo.unionId,
          boxID: app.globalData.deviceId,
          latticeIndex: curLattice,
          hasContent: false
        },
        header: {
          'content-type': 'application/json'
        },
        method: 'POST',
        dataType: 'json',
        responseType: 'text',
        success: (result) => {
          if (result.data.status == 200) {
            console.log("清空药盒数据成功", result.data);
            latticeContent[curLattice - 1] = {
              latticeIndex: curLattice,
              // false表示为空,true表示有药品,内容为空时下面数据可以没有
              hasContent: false,
            };
            // 向蓝牙设备发送更新数据
            app.updateBoxConfig(latticeContent[curLattice - 1]);
            this.setData({
              latticeContent: latticeContent
            })
          } else {
            console.log("清空药盒数据失败", result.data)
            wx.showToast({
              title: '操作失败',
              icon: 'none',
              duration: 1500,
            });
          }
        },
        fail: () => {
          console.log("清空药盒数据请求服务器失败")
        },
        complete: () => {}
      });
    } else {
      this.setData({
        showModel: showModel
      });
    }
  },

  // 获取药盒内容
  getLatticeContent: function () {
    var URL = util.commenData.URL;
    if (!app.globalData.loginSuccess || !app.globalData.BLEconnect) {
      console.log("不能获取药盒内容");
      return;
    }
    if (app.data.readContent) {
      // 修改了药盒内容，先进行本地数据的修改
      for (var i = 0; i < this.data.latticeContent.length; i++) {
        if (this.data.latticeContent[i].latticeIndex == app.data.latticeContent.latticeIndex) {
          this.data.latticeContent[i] = app.data.latticeContent;
          break;
        }
      }
      app.data.readContent = false;
      this.updateList();
      return;
    }
    // 获取药盒内容
    console.log("获取药盒内容请求", app.globalData.userInfo.unionId, app.globalData.deviceId);
    wx.request({
      url: URL.baseURL + URL.downloadBoxContent,
      data: {
        unionId: app.globalData.userInfo.unionId,
        boxID: app.globalData.deviceId
      },
      header: {
        'content-type': 'application/json'
      },
      method: 'POST',
      dataType: 'json',
      responseType: 'text',
      success: (result) => {
        var data = result.data;
        if (data.status == 200) {
          console.log("获取药盒内容成功", data);
          if (JSON.stringify(this.data.latticeContent) != JSON.stringify(data.latticeContent)) {
            this.data.latticeContent = data.latticeContent;
            this.updateList();
            for (var i = 0; i < this.data.latticeContent.length; i++) {
              // 向设备发送最新的设置内容
              app.updateBoxConfig(this.data.latticeContent[i]);
            }
          }
        } else {
          console.log("获取药盒内容失败", data);
        }
      },
      fail: () => {
        wx.showModal({
          title: 'TIPS',
          content: '获取失败，请开启手机网络后再进行操作',
          showCancel: false,
          confirmText: '确定',
          confirmColor: '#3CC51F',
          success: (result) => {
            if (result.confirm) {}
          },
          fail: () => {},
          complete: () => {}
        });
        console.log("获取药盒内容连接服务器失败");
      },
      complete: () => {}
    });
  },

  // 为了防止设置catchtouchmove的警告
  catchBackTouchMove: function (event) {
    return true;
  },

  // 设置顶部蓝牙状态栏显示的内容
  setTipText: function (tips) {
    this.data.TipText = tips;
    this.setData({
      TipText: this.data.TipText
    });
  },

  // 获取蓝牙数据对药盒的操作后回调函数，检测当前服药状态，
  judgeTakeRecord: function (data) {
    console.log("开始分析药盒操作", data);
    // 药盒连接期间药盒操作
    // getActionResult: {
    // 	"code": 21,
    // 	"mode": 0 //0关 1开
    // }
    // 先上传操作记录，再进行判断上传服药记录
    if (!app.globalData.loginSuccess || !app.globalData.BLEconnect)
      return;
    var URL = util.commenData.URL;
    Date.prototype.Format = function (fmt) { //author: meizz   
      var o = {
        "M+": this.getMonth() + 1, //月份   
        "d+": this.getDate(), //日   
        "h+": this.getHours(), //小时   
        "m+": this.getMinutes(), //分   
        "s+": this.getSeconds(), //秒   
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度   
        "S": this.getMilliseconds() //毫秒   
      };
      if (/(y+)/.test(fmt))
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
      for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt))
          fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
      return fmt;
    }
    var time = (new Date()).Format("yyyy-MM-dd hh:mm:ss");
    console.log("当前时间", time);
    wx.request({
      url: URL.baseURL + URL.uploadActionRecord,
      data: {
        unionId: app.globalData.userInfo.unionId,
        boxID: app.globalData.deviceId,
        time: time,
        mode: data.mode ? 1 : 0
      },
      header: {
        'content-type': 'application/json'
      },
      method: 'POST',
      dataType: 'json',
      responseType: 'text',
      success: (result) => {
        if (result.data.status == 200) {
          console.log("药盒操作数据上传成功", result);
        } else {
          console.log("药盒操作数据上传失败", result);
        }
      },
      fail: (result) => {
        console.log("药盒操作数据上传请求服务器失败", result);
      },
      complete: () => {}
    });
    // 开始根据本地数据分析服药情况
    if (data.mode) {
      // 0关 1开 只有开才表示吃药
      var nowRemindList = this.data.nowRemindList;
      for (var i = 0; i < nowRemindList.length; i++) {
        console.log("上传内容", app.globalData.userInfo.unionId, app.globalData.deviceId, nowRemindList[i].medicineName, nowRemindList[i].takeNumber, nowRemindList[i].latticeIndex, (time.split(" "))[0] + " " + nowRemindList[i].remindTime)
        if (app.updateRecordCallback != null) {
          var record = {
            UUID: null,
            medicineName: nowRemindList[i].medicineName,
            medicineNum: nowRemindList[i].takeNumber,
            latticeIndex: nowRemindList[i].latticeIndex,
            remindTime: (time.split(" "))[0] + " " + nowRemindList[i].remindTime,
            state: 1
          }
          app.updateRecordCallback(record);
        }
        wx.request({
          url: URL.baseURL + URL.uploadTakeRecord,
          data: {
            unionId: app.globalData.userInfo.unionId,
            boxID: app.globalData.deviceId,
            medicineName: nowRemindList[i].medicineName,
            medicineNum: nowRemindList[i].takeNumber,
            latticeIndex: nowRemindList[i].latticeIndex,
            time: (time.split(" "))[0] + " " + nowRemindList[i].remindTime,
            state: 1,
          },
          header: {
            'content-type': 'application/json'
          },
          method: 'POST',
          dataType: 'json',
          responseType: 'text',
          success: (result) => {
            if (result.data.status == 200) {
              console.log("服药记录数据上传成功", result);
            } else {
              console.log("服药记录数据上传失败", result);
            }
          },
          fail: (result) => {
            console.log("服药记录数据上传请求服务器失败", result);
          },
          complete: () => {}
        });
      }
    }

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 添加监听globalData数据
    app.watch(this.updatePage);
    // 设置蓝牙连接状态栏回调函数
    app.setTipCallback(this.setTipText);
    // 设置药盒操作回调函数
    app.setActionCallback(this.judgeTakeRecord);
    // 设置更新页面的回调，在蓝牙连接成功后更新页面数据
    app.setUpdateRemindCallback(this.updatePage);
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
    this.updatePage();
    // 设置定时器，从下一个10分钟整开始执行
    var time = new Date();
    var nextTime = new Date();
    var timeMin = parseInt((time.getMinutes() % 100) / 10);
    if (timeMin == 5) {
      nextTime.setHours(time.getHours() + 1);
      nextTime.setMinutes(0);
      nextTime.setSeconds(0);
    } else {
      nextTime.setMinutes(((timeMin + 1) % 6) * 10);
      nextTime.setSeconds(0);
    }
    this.updateTimer = setTimeout(() => {
      this.updateList();
      this.updateInterval = setInterval(() => {
        this.updateList();
      }, 1000 * 60 * 10)
    }, nextTime - time);
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    if (this.updateTimer != null) {
      clearTimeout(this.updateTimer);
      this.updateTimer = null;
    }
    if (this.updateInterval != null) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
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

  },

  ontouchmove: function () {

  }
})