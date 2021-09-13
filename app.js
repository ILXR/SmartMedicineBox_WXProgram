var util = require("utils/util.js");
var blooth = require("utils/blooth.js");
var boxDataFmt = require("utils/boxDataFmt.js");

App({
  // 全局变量
  globalData: {
    _userInfo: null,
    // 这里的deviceId用于存储mac地址，将会上传到数据库
    _deviceId: null,
    _BLEconnect: null,
    _loginSuccess: null,
    // 用于ios连接，ios设备从数据库获取mac地址后判断周围设备广播包中的mac地址内容，提取设备的uuid并进行连接
    uuid: null,
  },
  data: {
    // 设备列表
    deviceList: [],
    // 正在搜索设备
    isDiscovering: false,
    // 正在连接设备
    isConnecting: false,
    // 连接到的设备信息
    connectedDevice: {
      state: false,
      // 用于连接，表示mac地址或者uuid
      deviceId: "",
      // 单独表示mac地址
      macAddr: "",
    },
    // 蓝牙是否已经初始化
    adapterHasInit: false,
    // 判断安卓/ios平台
    isAndroidPlatform: true,
    // 定时器
    startDiscoveryTimer: null,

    // 药品设置
    latticeContent:null,
    // 是否需要读取药品设置
    readContent:false
  },

  /****************************************回调函数**********************************************/
  // remind页面蓝牙状态提醒栏设置
  tipCallback: null,
  // remind页面判断药盒开关操作，并上传服药记录
  actionCallback: null,
  // remind页面蓝牙连接成功后刷新页面
  updateRemindCallback:null,
  // connect页面更新蓝牙设备列表
  connectCallback: null,
  // connect页面搜索状态更新
  discoverCallback:null,
  // connect页面连接成功回调
  connectSuccessCallback:null,
  // record页面更新本地服药记录
  updateRecordCallback:null,
  setTipCallback: function (callback) {
    this.tipCallback = callback;
  },
  setActionCallback: function (callback) {
    this.actionCallback = callback;
  },
  setConnectCallback: function (callback) {
    this.connectCallback = callback;
  },
  setDiscoverCallback:function(callback){
    this.discoverCallback = callback;
  },
  setConnectSuccessCallback:function(callback){
    this.connectSuccessCallback = callback;
  },
  setUpdateRecordCallback:function(callback){
    this.updateRecordCallback = callback;
  },
  setUpdateRemindCallback:function(callback){
    this.updateRemindCallback = callback;
  },

  /**
   * 当小程序初始化完成时，会触发 onLaunch（全局只触发一次）
   */
  onLaunch: function () {
    this.globalData.BLEconnect = false;
    this.globalData.loginSuccess = false;
    this.globalData.uuid = "";
    this.globalData.deviceId = "";
    this.globalData.userInfo = {};
    wx.getSystemInfo({
      success: (result) => {
        console.log("获取系统信息成功", result);
        if (result.platform == "android") {
          this.data.isAndroidPlatform = true;
        }
      },
      fail: () => {
        console.log("获取系统信息失败", result);
      },
      complete: () => {}
    });
    // 用户登录
    this.userLogin();
  },

  /**
   * 当小程序启动，或从后台进入前台显示，会触发 onShow
   */
  onShow: function (options) {
    this.BLEinit();
    if(this.data.connectedDevice.state){
      this.updataBoxTime();
    }
  },

  /**
   * 当小程序从前台进入后台，会触发 onHide
   */
  onHide: function () {

  },

  /**
   * 当小程序发生脚本错误，或者 api 调用失败时，会触发 onError 并带上错误信息
   */
  onError: function (msg) {

  },

  // globalData.data 监听器
  watch: function (method) {
    var obj = this.globalData;
    Object.defineProperty(obj, "BLEconnect", {
      configurable: true,
      enumerable: true,
      set: function (value) {
        this._BLEconnect = value;
        method("BLEconnect", value);
      },
      get: function () {
        return this._BLEconnect
      }
    });
    Object.defineProperty(obj, "loginSuccess", {
      configurable: true,
      enumerable: true,
      set: function (value) {
        this._loginSuccess = value;
        method("loginSuccess", value);
      },
      get: function () {
        return this._loginSuccess
      }
    });
    Object.defineProperty(obj, "userInfo", {
      configurable: true,
      enumerable: true,
      set: function (value) {
        this._userInfo = value;
        method("userInfo", value);
      },
      get: function () {
        return this._userInfo
      }
    });
    Object.defineProperty(obj, "deviceId", {
      configurable: true,
      enumerable: true,
      set: function (value) {
        this._deviceId = value;
        method("deviceId", value);
      },
      get: function () {
        return this._deviceId
      }
    });
  },

  // 用户登录
  userLogin: function () {
    var URL = util.commenData.URL;
    wx.showLoading({
      title: "正在登陆",
      mask: true,
      success: (result) => {},
    });
    // 登录
    wx.login({
      success: (r) => {
        var code = r.code; //登录凭证
        if (code) {
          //2、调用获取用户信息接口
          wx.getUserInfo({
            success: (res) => {
              console.log("获取用户信息成功", {
                encryptedData: res.encryptedData,
                iv: res.iv,
                code: code
              })
              //3.解密用户信息 获取unionId
              //...
              //3.请求自己的服务器，解密用户信息 获取unionId等加密信息
              wx.request({
                url: URL.baseURL + URL.getUserInfor, //自己的服务接口地址
                method: 'post',
                header: {
                  'content-type': 'application/json'
                },
                data: {
                  code: code,
                  encryptedData: res.encryptedData,
                  iv: res.iv,
                },
                success: (data) => {
                  console.log("获取解密数据成功", data);
                  //4.解密成功后 获取自己服务器返回的结果
                  if (data.data.status == 200) {
                    wx.hideLoading();
                    this.globalData.userInfo = data.data.userInfo;
                    this.globalData.deviceId = data.data.deviceId;
                    this.globalData.loginSuccess = true;
                    // 获取到最近连接过的设备mac地址，进行蓝牙初始化连接
                    this.BLEinit();
                  } else {
                    console.log('解密失败');
                    this.loginFailed();
                  }
                },
                fail: () => {
                  console.log('请求服务器错误');
                  this.loginFailed();
                }
              })
            },
            fail: (res) => {
              console.log('获取用户信息失败',res);
              this.loginFailed();
            }
          })
        } else {
          console.log('获取用户登录态失败！' + r.errMsg);
          this.loginFailed();
        }
      },
      fail: (res) => {
        console.log("用户登录失败", res)
        this.loginFailed();
      }
    })
  },

  // 登录失败处理
  loginFailed: function () {
    wx.hideLoading();
    this.tipCallback("用户未登录")
    var loginSuccess = this.globalData;
    loginSuccess.loginSuccess = false;
    wx.showModal({
      title: 'TIPS',
      content: '登录验证失败,请检查网络后重新登录',
      showCancel: true,
      cancelText: '取消',
      cancelColor: '#000000',
      confirmText: '确定',
      confirmColor: '#3CC51F',
      success: (result) => {
        if (result.confirm) {
          this.userLogin();
        } else {
          wx.showModal({
            title: '提醒',
            content: '检测到您未登录，有些功能将无法使用',
            showCancel: false,
            confirmText: '确定',
            confirmColor: '#666',
            success: (result) => {
              if (result.confirm) {}
            },
            fail: () => {},
            complete: () => {}
          });
        }
      },
      fail: () => {},
      complete: () => {}
    });
  },

  /**********************************************蓝牙模块***************************************/
  // 由于系统限制，Android 上获取到的 deviceId 为设备 MAC 地址，iOS 上则为设备 uuid。因此 deviceId 不能硬编码到代码
  // 通过在设备广播包中添加mac地址进行连接

  // 初始化参数列表 在onLaunch中调用一次
  BLEinit: function (n) {
    if (!this.globalData.loginSuccess) {
      // 还没有登录成功，不连接蓝牙
      return;
    }
    // 设备列表
    this.data.deviceList = [];
    // 正在搜索设备
    this.data.isDiscovering = false;
    if(this.discoverCallback!=null){
      this.discoverCallback(this.data.isDiscovering);
    }
    // 正在连接设备
    this.data.isConnecting = false;
    console.log('蓝牙数据初始化', this.data);
    // 蓝牙断开，进行数据初始化
    if (!this.data.connectedDevice.state || n == 200) {
      console.log("重新设置蓝牙数据")
      this.data.adapterHasInit = false;
      // 连接到的设备信息
      this.data.connectedDevice = {
        deviceId: "",
        macAddr: "",
        state: false
      };
    }
    this.startConnect();
  },

  // 初始化（开启）蓝牙模块
  startConnect: function () {
    if (this.data.connectedDevice.state) return;
    this.data.connectedDevice.deviceId = "";
    this.data.connectedDevice.macAddr = "";
    this.data.connectedDevice.state = false;
    // 如果适配器已经初始化不在调用初始化(重复初始化会报错)
    if (this.data.adapterHasInit) return;
    // 开启蓝牙适配器状态监听
    this.listenAdapterStateChange();
    // 初始化蓝牙适配器状态(必须步骤，否则无法进行后续的任何操作)
    wx.openBluetoothAdapter({
      success: (res) => {
        console.log("初始化蓝牙成功", res);
        this.getBluetoothAdapterState();
        this.data.adapterHasInit = true;
      },
      fail: (err) => {
        console.log("初始化蓝牙失败", err);
        this.BLEfailed();
      }
    });
  },

  // 检测蓝牙适配器状态
  getBluetoothAdapterState: function () {
    wx.getBluetoothAdapterState({
      success: (res) => {
        /*
          res 属性
          available	boolean	蓝牙适配器是否可用
          discovering	boolean	蓝牙适配器是否处于搜索状态
        */
        console.log("获取蓝牙适配器状态成功", res);
        var available = res.available;
        this.data.isDiscovering = res.discovering;
        if(this.discoverCallback!=null){
          this.discoverCallback(this.data.isDiscovering);
        }
        if (!available) {
          // 蓝牙不可用
          this.BLEfailed();
        } else {
          if(this.data.connectedDevice.state){
            this.tipCallback("设备已连接");
            return;
          }
          // 蓝牙可用，如果已经有目标deviceId直接进行连接，否则提醒用户手动连接
          if (this.globalData.deviceId == "") {
            this.tipCallback("请手动连接设备");
          } else {
            console.log("尝试连接设备", this.globalData.deviceId)
            this.judegIfDiscovering(res.discovering);
          }
        }
      },
      fail: (err) => {
        console.log("获取蓝牙适配器状态失败", err);
        this.BLEfailed();
      }
    })
  },

  // 检测设备连接状态
  judegIfDiscovering: function (discovering) {
    if (this.data.isConnecting) return;
    console.log("获取处于连接状态的设备")
    wx.getConnectedBluetoothDevices({
      services: [blooth.bloothID.serviceId],
      success: (res) => {
        console.log("获取处于连接状态的设备成功", res);
        /*
          devices	Array.<Object>	搜索到的设备列表
          devices 属性：
          name	string	蓝牙设备名称，某些设备可能没有
          deviceId	string	用于区分设备的 id  
        */
        var devices = res['devices'];
        if (devices.length > 0 && devices[0]) {
          this.tipCallback("设备已连接");
          console.log("蓝牙连接成功");
        } else { // 设备未连接
          // 正在搜索
          if (discovering) {
            this.tipCallback("正在搜索设备")
          } else {
            // 安卓平台直接尝试连接
            // ios搜索到mac地址相同的设备后尝试连接
            if (this.data.isAndroidPlatform) {
              this.connectOldDevices();
            } else {
              this.startBluetoothDevicesDiscovery();
            }
          }
        }
      },
      fail: (err) => {
        console.log('获取处于连接状态的设备失败', err);
        this.startBluetoothDevicesDiscovery();
      }
    });
  },

  // 查看设备是否已经连接过，如果以前搜索到过就直接进行连接
  connectOldDevices: function (discovering) {
    wx.getBluetoothDevices({
      success: (res) => {
        console.log("获取连接过得设备成功", res);
        var devices = res.devices;
        // 如果有就直接连接，否则进行设备搜索
        for (var i = 0; i < devices.length; i++) {
          devices[i].macAddr = blooth.getBoxMacAddr(devices[i].advertisData);
          if (devices[i].macAddr == this.globalData.deviceId) {
            console.log("发现连接过目标设备")
            this.startConnectDevices();
            return;
          }
        }
        console.log("没有连接过目标设备")
        this.startBluetoothDevicesDiscovery();
      },
      fail: () => {
        console.log("获取连接过得设备失败", res);
        this.BLEfailed();
      },
      complete: () => {}
    });
  },

  // 开始蓝牙设备搜索
  startBluetoothDevicesDiscovery: function () {
    console.log("开始搜索蓝牙设备");
    // 当前没有设备正在连接
    if (!this.data.connectedDevice['state']) {
      wx.getBluetoothAdapterState({
        success: (res) => {
          console.log("获取蓝牙适配器状态成功", res);
          var available = res.available;
          this.data.isDiscovering = res.discovering;
          if(this.discoverCallback!=null){
            this.discoverCallback(this.data.isDiscovering);
          }
          if (!available) {
            // 蓝牙适配器不可用
            this.BLEfailed();
          } else {
            if (!res.discovering) {
              this.tipCallback("正在搜索设备");
              // 开始搜索设备
              wx.startBluetoothDevicesDiscovery({
                services: [],
                allowDuplicatesKey: true,
                success: (res) => {
                  console.log("蓝牙开启搜索成功", res);
                  this.data.isDiscovering = true;
                  if(this.discoverCallback!=null){
                    this.discoverCallback(this.data.isDiscovering);
                  }
                  this.onBluetoothDeviceFound()
                },
                fail: (err) => {
                  console.log("蓝牙开启搜索失败", res);
                  // 开启搜索失败 延迟后重新调用
                  if (!err.isDiscovering) {
                    this.startDiscoveryTimer = setTimeout(function () {
                      if (!this.data.connectedDevice.state) {
                        this.startBluetoothDevicesDiscovery();
                      }
                    }, 2000);
                  }
                }
              });
            }
          }
        },
        fail: (err) => {
          // 蓝牙适配器状态获取失败
          console.log("蓝牙适配器状态获取失败", err);
          this.BLEfailed();
        }
      })
    }
  },

  // 停止蓝牙设备搜索
  stopBluetoothDevicesDiscovery: function () {
    if (!this.data.isDiscovering)
      return;
    wx.stopBluetoothDevicesDiscovery({
      success: (result) => {
        console.log("停止搜索蓝牙设备成功", result);
        wx.offBluetoothDeviceFound(this.onBluetoothDeviceFound());
      },
      fail: (result) => {
        console.log("停止搜索蓝牙设备失败", result);
      },
      complete: () => {
        this.data.isDiscovering = false;
        if(this.discoverCallback!=null){
          this.discoverCallback(this.data.isDiscovering);
        }
      }
    });
  },

  // 检测到新的设备
  onBluetoothDeviceFound: function () {
    wx.onBluetoothDeviceFound((res) => {
      /*
      res.device数组对象属性
      name string 蓝牙设备名称， 某些设备可能没有
      deviceId string 用于区分设备的 id
      RSSI number 当前蓝牙设备的信号强度
      ===>>> advertisData ArrayBuffer 当前蓝牙设备的广播数据段中的 ManufacturerData 数据段 <<<===
      advertisServiceUUIDs Array. < string > 当前蓝牙设备的广播数据段中的 ServiceUUIDs 数据段
      localName string 当前蓝牙设备的广播数据段中的 LocalName 数据段
      serviceData Object 当前蓝牙设备的广播数据段中的 ServiceData 数据段
    */
      var {
        ...device
      } = res.devices[0];
      var macAddr = blooth.getBoxMacAddr(device.advertisData);
      device.macAddr = macAddr;
      if (device && macAddr != null) {
        if (this.connectCallback != null) {
          this.connectCallback(device);
        }
        var notExist = true
        // 避免重复读取相同设备
        for (var i = 0; i < this.data.deviceList.length; i++) {
          if (device.deviceId == this.data.deviceList[i].deviceId) {
            notExist = false;
          }
        }
        if (notExist) {
          console.log('搜索到新的蓝牙设备', device, macAddr);
          this.data.deviceList.push(device)
          // ios或者安卓搜索到附近设备中有想要进行连接的，就直接尝试连接
          if (device.macAddr == this.globalData.deviceId) {
            if (!this.data.isAndroidPlatform) {
              this.globalData.uuid = device.deviceId;
            }
            this.startConnectDevices();
          }
        }
      }
    });
  },

  // 连接指定的蓝牙设备
  startConnectDevices: function () {
    if (this.data.isConnecting) {
      console.log("进行了重复的连接操作");
      return;
    }
    console.log("开始连接蓝牙设备");
    clearTimeout(this.startDiscoveryTimer);
    this.startDiscoveryTimer = null;
    this.data.isConnecting = true;
    this.tipCallback("正在连接设备");
    this.stopBluetoothDevicesDiscovery();
    // 安卓和ios分别使用不同的deviceId进行连接
    var deviceId = (this.data.isAndroidPlatform) ? (this.globalData.deviceId) : (this.globalData.uuid);
    wx.createBLEConnection({
      deviceId: deviceId,
      success: (res) => {
        console.log('蓝牙设备连接成功', res);
        wx.hideLoading();
        if(this.connectSuccessCallback!=null){
          this.connectSuccessCallback();
        }
        this.data.connectedDevice.state = true;
        this.data.connectedDevice.deviceId = this.data.isAndroidPlatform ? this.globalData.deviceId : this.globalData.uuid;
        this.data.connectedDevice.macAddr = this.globalData.deviceId;
        this.globalData.BLEconnect = true;
        this.updateRemindCallback();
        // 开启数据监听
        this.notifyBLEmsg();
        // 监听连接状况变化 
        wx.onBLEConnectionStateChange((res) => {
          console.log('设备连接状态变化', res);
          this.data.connectedDevice.state = res.connected;
          this.globalData.BLEconnect = res.connected;
          this.data.connectedDevice.deviceId = res.deviceId;
          if (res.connected) {
            this.tipCallback("设备已连接")
          } else {
            this.tipCallback("设备断开连接")
            // 如果是手动断开连接的就不进行重连
            if(this.globalData.deviceId=="")
              return;
            this.getBluetoothAdapterState();
          }
        });
      },
      fail: (err) => {
        wx.hideLoading();
        console.log('设备连接失败', err);
        this.BLEinit('200');
      },
      complete: () => {
        this.data.isConnecting = false;
      }
    });
  },

  // 断开蓝牙设备连接
  stopConnecntDevices: function () {
    if (!this.data.connectedDevice.state) {
      return;
    }
    this.data.connectedDevice.state = false;
    this.data.connectedDevice.macAddr = "";
    wx.closeBLEConnection({
      deviceId: this.data.connectedDevice.deviceId,
      success: (result) => {
        console.log("断开蓝牙设备连接成功", result);
        wx.showToast({
          title: '已断开连接',
          icon: 'none',
          duration: 1500,
          mask: false,
        });
      },
      fail: () => {
        console.log("断开蓝牙设备连接失败", result);
      },
      complete: () => {
        this.data.connectedDevice.deviceId = "";
      }
    });
  },

  // 监听蓝牙适配器状态变化
  listenAdapterStateChange: function () {
    wx.onBluetoothAdapterStateChange((res) => {
      /*
        res 属性
        available	boolean	蓝牙适配器是否可用
        discovering	boolean	蓝牙适配器是否处于搜索状态
      */
      console.log('蓝牙适配器状态改变', res);
      if (!res.available) { // 蓝牙适配器不可用，重新进行连接
        this.BLEinit('200');
      } else {
        this.data.adapterHasInit = true;
        // 蓝牙适配器可用，获取状态，判断是要提醒手动连接还是重连
        this.getBluetoothAdapterState();
      }
    });
  },

  // 蓝牙连接失败的提示，避免代码重用
  BLEfailed: function () {
    wx.showModal({
      title: 'TIPS',
      content: '蓝牙连接失败，请打开蓝牙后重试',
      showCancel: false,
      confirmText: '确定',
      confirmColor: '#3CC51F',
      success: (result) => {
        if (result.confirm) {}
      },
      fail: () => {},
      complete: () => {}
    });
    this.globalData.BLEconnect = false;
    this.tipCallback("请开启设备蓝牙");
  },

  /****************************蓝牙设备通讯********************************/
  // 发送蓝牙数据,msg是字符串类型
  sendBLEmsg: function (msg) {
    if (!this.data.connectedDevice.state)
      return;
    console.log("发送蓝牙数据", this.data.connectedDevice, msg);
    var buffer = blooth.str2buff(msg);
    wx.writeBLECharacteristicValue({
      deviceId: this.data.connectedDevice.deviceId,
      serviceId: blooth.bloothID.serviceId,
      characteristicId: blooth.bloothID.writeCharacteristic,
      value: buffer,
      success: (result) => {
        console.log("向蓝牙设备发送数据成功", result);
      },
      fail: (result) => {
        console.log("向蓝牙设备发送数据失败", result);
        // 1秒后重新发送
        setTimeout(() => {
          this.sendBLEmsg(msg);
        }, 1000);
      },
      complete: () => {}
    });
  },

  // 监听蓝牙数据
  notifyBLEmsg: function () {
    if (!this.data.connectedDevice.state)
      return;
    wx.notifyBLECharacteristicValueChange({
      deviceId: this.data.connectedDevice.deviceId,
      serviceId: blooth.bloothID.serviceId,
      characteristicId: blooth.bloothID.notifyCharacteristic,
      state: true,
      success: (result) => {
        console.log("启用蓝牙监听成功", result);
        // 同步数据
        this.getBoxTakeRecord();
        this.updataBoxTime()
        wx.onBLECharacteristicValueChange((result) => {
          this.analyseBLEmsg(blooth.buff2str(result.value));
        });
      },
      fail: (result) => {
        console.log("启用蓝牙监听失败", result);
      },
      complete: () => {}
    });
  },

  // 处理蓝牙设备数据
  analyseBLEmsg: function (msg) {
    try{
      var data = JSON.parse(msg);
    }catch(err){
      console.log("接收到非JSON数据",msg);
      return;
    }
    
    var URL = util.commenData.URL;
    console.log("处理蓝牙设备数据", msg);
    switch (data.code) {
      // 服药记录数据
      case boxDataFmt.BoxDataFormat.getRecordResult.code:
        if (!data.open || !data.close)
          return;
        if ((data.open.length == 0) && (data.close.length == 0)) // 记录为空，无需请求服务器
          return;
        wx.request({
          url: URL.baseURL + URL.uploadSimpleTakeRecord,
          data: {
            unionId: this.globalData.userInfo.unionId,
            boxID: this.globalData.deviceId,
            open: data.open,
            close: data.close
          },
          header: {
            'content-type': 'application/json'
          },
          method: 'POST',
          dataType: 'json',
          responseType: 'text',
          success: (result) => {
            if (result.state == 200) {
              console.log("上传简单服药记录成功");
            } else {
              console.log("上传简单服药记录失败");
            }
          },
          fail: (result) => {
            console.log("上传简单服药记录请求服务器失败", result);
          },
          complete: () => {}
        });
        break;
      case boxDataFmt.BoxDataFormat.getActionResult.code:
        // 用户对药盒操作，交由回调函数判断是否有服药行为
        if (this.actionCallback == null)
          return;
        else {
          this.actionCallback(data);
        }
        break;
      default:
        console.log("获取蓝牙设备数据格式未定义");
        break;
    }
  },

  // 获取吃药记录
  getBoxTakeRecord: function () {
    // var msg = {
    //   "code": 121
    // }
    var {
      ...msg
    } = boxDataFmt.BoxDataFormat.getRecord;
    this.sendBLEmsg(JSON.stringify(msg));
  },

  // 更新药盒时间
  updataBoxTime: function () {
    var timestamp = Date.parse(new Date()) / 1000;
    // var msg = {
    //   "code": 100,
    //   "timestamp": timestamp
    // }
    var {
      ...msg
    } = boxDataFmt.BoxDataFormat.updateTime;
    msg.timestamp = timestamp;
    this.sendBLEmsg(JSON.stringify(msg));
  },

  // 更新槽的吃药时间
  updateBoxConfig: function (latticeContent) {
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

    // var msg = {
    //   "code": 110,
    //   "hasContent": false,
    //   "latticeIndex": 0,
    //   "week": 127,
    //   "remindTime": []
    // }
    var {
      ...msg
    } = boxDataFmt.BoxDataFormat.updateContent;
    msg.latticeIndex = latticeContent.latticeIndex - 1;
    if (latticeContent.hasContent) {
      // 药盒有内容，设置
      msg.hasContent = latticeContent.hasContent;
      msg.week = latticeContent.weekTakeDay;
      for (var i = 0; i < latticeContent.contentDetail.length; i++) {
        msg.remindTime[i] = blooth.getSeconds(latticeContent.contentDetail[i].remindTime);
      }
    }
    this.sendBLEmsg(JSON.stringify(msg));
  }

})