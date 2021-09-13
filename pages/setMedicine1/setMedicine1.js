// pages/setMedicine1/setMedicine1.js
var util = require("../../utils/util.js");
var app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 顶部进度条样式
    processStyle: [{
        left: "#00CC99",
        right: '#ffffff',
        icon: '/icons/circle-fill.png'
      },
      {
        left: '#ffffff',
        right: "#00CC99",
        icon: '/icons/circle-empty.png'
      }
    ],

    // 药品选项
    curMedicine: '',
    curMedicineIndex: -1,
    allMedicine: [
      '维生素', '胶原蛋白', '螺旋藻', '鱼油', '钙片', '褪黑素', '葡萄耔', '蜂胶', '大豆异黄酮', '卵磷脂'
    ],

    // 从之前页面传过来的药盒内容
    latticeContent: null,
  },

  // 检测选择药品事件
  medicineTap: function (options) {
    var index = options.target.dataset.index;
    var curMedicine = this.data.curMedicine;
    var curMedicineIndex = this.data.curMedicineIndex;
    var allMedicine = this.data.allMedicine;
    var latticeContent = this.data.latticeContent;
    curMedicineIndex = index;
    curMedicine = allMedicine[index];
    latticeContent.medicineName = curMedicine;
    this.setData({
      curMedicineIndex: curMedicineIndex,
      curMedicine: curMedicine,
      latticeContent: latticeContent
    })
    console.log("点击设置药品名称", this.data.latticeContent)
  },

  // 跳转到下一页
  nextPage: function () {
    if (this.data.curMedicine == '') {
      wx.showModal({
        title: 'TIPS',
        content: '请选择要添加的药品',
        showCancel: false,
        confirmText: '确定',
        confirmColor: '#3CC51F',
        success: (result) => {},
        fail: () => {},
        complete: () => {}
      });
    } else {
      wx.navigateTo({
        url: '../setMedicine2/setMedicine2?data=' + JSON.stringify(this.data.latticeContent),
        success: (result) => {},
        fail: () => {},
        complete: () => {}
      });
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var data = JSON.parse(options.data);
    console.log("跳转设置页面1", data)
    var latticeContent = this.data.latticeContent;
    latticeContent = data;
    // 药盒已经有内容，需要进行修改
    if (latticeContent.hasContent) {
      this.data.curMedicine = latticeContent.medicineName;
      for (var i = 0; i < this.data.allMedicine.length; i++) {
        if (latticeContent.medicineName == this.data.allMedicine[i]) {
          this.data.curMedicineIndex = i;
          break;
        }
      }
    } else {
      // 药盒暂无内容
      this.data.curMedicine = '';
      this.data.curMedicineIndex = -1;
    }
    this.setData({
      curMedicineIndex: this.data.curMedicineIndex,
      curMedicine: this.data.curMedicine,
      latticeContent: latticeContent
    })
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