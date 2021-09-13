// arraybuffer 转 16进制字符串
var buff2hex = function (buffer) {
    var hexArr = Array.prototype.map.call(
        new Uint8Array(buffer),
        function (bit) {
            return ('00' + bit.toString(16)).slice(-2)
        }
    )
    return hexArr.join('');
}

// string转arraybuffer
var str2buff = function (str) {
    // 首先将字符串转为16进制
    let val = ""
    for (let i = 0; i < str.length; i++) {
        if (val === '') {
            val = str.charCodeAt(i).toString(16)
        } else {
            val += ',' + str.charCodeAt(i).toString(16)
        }
    }
    // 将16进制转化为ArrayBuffer
    return new Uint8Array(val.match(/[\da-f]{2}/gi).map(function (h) {
        return parseInt(h, 16)
    })).buffer
}
// arraybuffer转string
var buff2str = function (buf) {
    return String.fromCharCode.apply(null, new Uint8Array(buf));
}

// 从广播包数据中获取药盒mac地址
var getBoxMacAddr = function (advertisData) {
    // 获取无符号整数类型十六进制字符串数组
    var hexArr = Array.prototype.map.call(
        new Uint8Array(advertisData),
        function (bit) {
            return ('00' + bit.toString(16)).slice(-2).toUpperCase()
        }
    )
    if (hexArr.length == 8) {
        var res = new Array();
        // 获取正确顺序
        for (var i = 0; i < 8; i++) {
            res[i] = hexArr[7 - i];
        }
        // 智能药盒设备筛选
        if (res[6] == "12" && res[7] == "34") {
            return res.slice(0, 6).join(":")
        } else {
            return null;
        }
    } else {
        return null;
    }
}

// 根据时间获取从0点开始的秒数 "00:00:00"
var getSeconds = function(time){
    var temp = time.split(":");
    if(temp.length!=3)
        return 0;
    var hour = parseInt(temp[0]);
    var minute = parseInt(temp[1]);
    var seconds = parseInt(temp[2]);
    return hour*3600+minute*60+seconds;
}

// 智能药盒设备蓝牙服务和特征值id
var bloothID = {
    serviceId: '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
    writeCharacteristic: '6e400002-b5a3-f393-e0a9-e50e24dcca9e',
    notifyCharacteristic: '6e400003-b5a3-f393-e0a9-e50e24dcca9e',
}

module.exports = {
    buff2hex: buff2hex,
    getBoxMacAddr: getBoxMacAddr,
    bloothID: bloothID,
    str2buff: str2buff,
    buff2str: buff2str,
    getSeconds: getSeconds
}