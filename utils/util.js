// 按时间排序数组
const timeSort = function (a, b) {
  var atime = a.remindTime.split(":");
  var btime = b.remindTime.split(":");
  return (parseInt(atime[0]) - parseInt(btime[0]) == 0) ? (parseInt(atime[1]) - parseInt(btime[1])) : (parseInt(atime[0]) - parseInt(btime[0]));
}

// 按日期时间排序数组
const daySort = function (b, a) {
  var aday = a.remindTime.split(" ")[0].split("-");
  var bday = b.remindTime.split(" ")[0].split("-");
  var atime = a.remindTime.split(" ")[1].split(":");
  var btime = b.remindTime.split(" ")[1].split(":");
  for (var i = 0; i < 3; i++) {
    if (parseInt(aday[i]) != parseInt(bday[i])) {
      return parseInt(aday[i]) - parseInt(bday[i])
    }
  }
  for (var i = 0; i < 2; i++) {
    if (parseInt(atime[i]) != parseInt(btime[i])) {
      return parseInt(atime[i]) - parseInt(btime[i])
    }
  }
  if (a.latticeIndex != b.latticeIndex)
    return a.latticeIndex - b.latticeIndex;
  return 0;
}

// 颜色定义
const color = {
  GrassGreen: '#3CB371',
  AquamarineGreen: '#00FA9A',
  OrchidPurple: '#BA55D3',
  RoyalBlue: '#4169E1',
  LightSeaGreen: '#20B2AA'
}

// 公共数据 样式、图标路径等
const commenData = {
  // 版本号
  version: "1.0.0",

  // URL
  URL: {
    // 这里是用来测试的mock地址 后面需要替换掉
    baseURL: "http://rap2api.taobao.org/app/mock/235904",
    // 定义的接口地址
    getUserInfor: "/wx/login/getUserInfor",
    downloadBoxContent: "/wx/download/downloadBoxContent",
    downloadTakeRecord: "/wx/download/downloadTakeRecord",
    uploadTakeRecord: "/wx/upload/uploadTakeRecord",
    uploadBoxContent: "/wx/upload/uploadBoxContent",
    uploadActionRecord: "/wx/upload/uploadActionRecord",
    uploadSimpleTakeRecord: "/wx/upload/uploadSimpleTakeRecord"
  },

  // latticeColor
  latticColor: [
    color.GrassGreen,
    color.LightSeaGreen,
    color.OrchidPurple,
    color.RoyalBlue
  ],
  // latticeAddIcon
  latticeAddIcon: [
    '/icons/AddGrassGreen.png',
    '/icons/AddLightSeaGreen.png',
    '/icons/AddOrchidPurple.png',
    '/icons/AddRoyalBlue.png'
  ],
  // latticeEditIcon
  latticeEditIcon: [
    '/icons/EditGrassGreen.png',
    '/icons/EditLightSeaGreen.png',
    '/icons/EditOrchidPurple.png',
    '/icons/EditRoyalBlue.png'
  ],
  // latticeMedicineIcon
  latticeMedicineIcon: [
    '/icons/MedicineGrassGreen.png',
    '/icons/MedicineLightSeaGreen.png',
    '/icons/MedicineOrchidPurple.png',
    '/icons/MedicineRoyalBlue.png'
  ]
}

module.exports = {
  commenData: commenData,
  timeSort: timeSort,
  daySort: daySort
}