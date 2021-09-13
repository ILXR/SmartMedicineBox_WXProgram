// pages/connect/connect.js
const app = getApp();
var util = require("../../utils/util.js");

Page({

  /**
   * 页面的初始数据
   */
  data: {
    searching: false,
    deviceList: [],
    isConnecting: false,
    version: ""
  },

  // 根据蓝牙适配器是否在搜索而进行本页面动画的停止与播放
  updateSearching: function (value) {
    this.setData({
      searching: value
    })
  },

  // 回调函数，设备连接成功
  connectSuccess: function () {
    if (this.data.isConnecting) {
      wx.showToast({
        title: '设备连接成功',
        icon: 'none',
        duration: 1500,
        mask: false,
      });
    }
    this.data.isConnecting = false;
  },

  // 搜索设备
  searchDevice: function () {
    console.log(app.data.adapterHasInit,app.globalData.loginSuccess);
    if (!app.data.adapterHasInit || !app.globalData.loginSuccess) {
      // 蓝牙不可用
      wx.showModal({
        title: 'TIPS',
        content: '请登录并打开设备蓝牙后再进行操作',
        showCancel: false,
        confirmText: '确定',
        confirmColor: '#3CC51F',
        success: (result) => {
          if (result.confirm) {}
        },
        fail: () => {},
        complete: () => {}
      });
      return;
    }
    if (app.data.isDiscovering) {
      this.setData({
        searching: app.data.isDiscovering
      })
      return;
    }
    if (app.globalData.BLEconnect) {
      // 如果当前有设备正在连接，弹出提醒框
      wx.showModal({
        title: 'TIPS',
        content: '请先断开当前设备连接',
        showCancel: false,
        confirmText: '确定',
        confirmColor: '#3CC51F',
        success: (result) => {
          if (result.confirm) {}
        },
        fail: () => {},
        complete: () => {}
      });
      return;
    }
    this.setData({
      deviceList: [],
      searching: true
    });
    app.stopConnecntDevices();
    app.stopBluetoothDevicesDiscovery();
    // 等待断开连接后再进行搜索
    setTimeout(() => {
      app.startBluetoothDevicesDiscovery();
    }, 500);
    setTimeout(() => {
      // 停止搜索设备
      this.setData({
        searching: false
      })
      if (!app.data.isDiscovering) {
        return;
      } else {
        app.stopBluetoothDevicesDiscovery();
      }
    }, 10000)
  },

  // 删除设备
  deleteDevice: function () {
    if (!app.data.adapterHasInit || !app.globalData.loginSuccess) {
      // 蓝牙不可用
      wx.showModal({
        title: 'TIPS',
        content: '请登录并打开设备蓝牙后再进行操作',
        showCancel: false,
        confirmText: '确定',
        confirmColor: '#3CC51F',
        success: (result) => {
          if (result.confirm) {}
        },
        fail: () => {},
        complete: () => {}
      });
      return;
    }
    if (app.globalData.deviceId != "") {
      wx.showModal({
        title: 'TIPS',
        content: '是否解除与当前设备的绑定',
        showCancel: true,
        cancelText: '取消',
        cancelColor: '#000000',
        confirmText: '确定',
        confirmColor: '#3CC51F',
        success: (result) => {
          if (result.confirm) {
            app.globalData.deviceId = "";
            app.globalData.uuid = "";
            app.globalData.BLEconnect = false;
            app.stopConnecntDevices();
            app.stopBluetoothDevicesDiscovery();
            setTimeout(() => {
              app.getBluetoothAdapterState();
            }, 1000);
          }
        },
        fail: () => {},
        complete: () => {}
      });
    } else {
      wx.showModal({
        title: 'TIPS',
        content: '当前没有设备正在连接',
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

  // 寻找到设备的回调函数
  findDeviceCallback: function (device) {
    var exist = false;
    for (var i = 0; i < this.data.deviceList.length; i++) {
      if (device.deviceId == this.data.deviceList[i].deviceId)
        exist = true;
    }
    if (!exist) {
      this.data.deviceList.push(device);
      this.setData({
        deviceList: this.data.deviceList
      })
    }
  },

  // 选择药盒进行连接
  tapDevice: function (option) {
    var device = option.target.dataset.item;
    console.log("选择连接设备", device)
    app.globalData.deviceId = device.macAddr;
    if (!app.data.isAndroidPlatform) {
      app.globalData.uuid = device.deviceId;
    }
    this.setData({
      searching: false
    })
    app.stopBluetoothDevicesDiscovery();
    app.stopConnecntDevices();
    setTimeout(() => {
      app.getBluetoothAdapterState();
    }, 500);
    this.data.isConnecting = true;
    wx.showLoading({
      title: "正在连接",
      mask: true,
      success: (result) => {},
      fail: () => {},
      complete: () => {}
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 设置回调函数
    app.setConnectCallback(this.findDeviceCallback);
    app.setDiscoverCallback(this.updateSearching);
    app.setConnectSuccessCallback(this.connectSuccess);
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
    this.setData({
      searching: app.data.isDiscovering,
      version: util.commenData.version
    })
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