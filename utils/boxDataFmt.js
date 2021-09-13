// 蓝牙设备发送消息文档
var BoxDataFormat = {
	serviceId: '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
	writeCharacteristic: '6e400002-b5a3-f393-e0a9-e50e24dcca9e',
	notifyCharacteristic: '6e400003-b5a3-f393-e0a9-e50e24dcca9e',

	// 更新时间
	// timestamp用的是UTC时间，不是本地时间
	updateTime: {
		"code": 100,
		"timestamp": 1574249820
	},

	// 更新槽的吃药时间
	// hasContent表示该槽是否有药
	// latticeIndex表示槽的序号，范围[0,3]
	// week表示周几吃药，第一个比特位为1表示周一吃药，以此类推
	// remindTime表示吃药当天相对0点0分0秒的秒数，如41940表示11点37分0秒吃药
	updateContent: {
		"code": 110,
		"hasContent": false,
		"latticeIndex": 0,
		"week": 127,
		"remindTime": []
	},
	
	// 获取吃药记录
	getRecord: {
		"code": 120
	},
	// 返回格式如下：
	// open表示打开盒子的时间戳。
	// close表示关闭盒子的时间戳。
	getRecordResult: {
		"code": 20,
		"open": [1574250017, 1574250031],
		"close": [1574250025, 1574250040]
	},

	// 药盒连接期间药盒操作
	getActionResult: {
		"code": 21,
		"mode": 0 //0关 1开
	}
}

module.exports = {
	BoxDataFormat: BoxDataFormat
}