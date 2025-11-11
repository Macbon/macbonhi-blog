export const momentm = (date: Date) => {
    var d = new Date(date);
    var Y = d.getFullYear();
    var M: number | string = d.getMonth() + 1;
    var D: number | string = d.getDate();

    if (M < 10) {
        M = '0' + M;

    }
    if (D < 10) {
        D = '0' + D;

    }
    var times = Y + '-' + M + '-' + D;
    return times

}

// 详细时间处理函数
export const momentl = (date: string | number | Date) => {
  var time;
  var d = new Date(date);
  var n = new Date();
  // 获取时间戳
  var dd = d.getTime();
  var h = d.getHours();
  var m: number | string = d.getMinutes();
  var Y = d.getFullYear();
  var M = d.getMonth() + 1;
  var D = d.getDate();
  // 现在时间
  var nn = n.getTime();
  // var hh = n.getHours();
  // var mm = n.getMinutes();
  var YY = n.getFullYear();
  var MM = n.getMonth() + 1;
  var DD = n.getDate();

  // 2分钟内显示"刚刚"
  if ((nn - dd) < 120 * 1000) {
    time = '刚刚';
    return time;
  } else if (120 * 1000 < (nn - dd) && (nn - dd) <= 60 * 60 * 1000) {
    // 2分钟到1小时内显示"X分钟前"
    time = Math.ceil((nn - dd) / 60 / 1000) + '分钟前';
    return time;
  } else if (60 * 60 * 1000 < (nn - dd) && D == DD && M == MM && Y == YY) {
    // 同一天但超过1小时显示"时:分"
    if (m < 10) {
      m = '0' + m;
    }
    time = h + ':' + m;
    return time;
  } else if (Y == YY && M == MM && D + 1 == DD) {
    // 昨天的时间
    if (m < 10) {
      m = '0' + m;
    }
    time = '昨天 ' + h + ':' + m;
    return time;
  } else if (Y == YY) {
    // 今年的其他日期
    if (m < 10) {
      m = '0' + m;
    }
    time = M + '月' + D + '日 ' + h + ':' + m;
    return time;
  } else {
    // 其他年份的日期
    if (m < 10) {
      m = '0' + m;
    }
    time = Y + '年' + M + '月' + D + '日 ' + h + ':' + m;
    return time;
  }
};
