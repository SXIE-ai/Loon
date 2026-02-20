// 第一版最简捕获逻辑
const reqUrl = (typeof $request !== "undefined") ? $request.url : null;

if (!reqUrl) {
  $done({});
  return;
}

// 基础域名过滤
if (!/029xxj\.com/i.test(reqUrl)) {
  $done({});
  return;
}

// 资源格式过滤
if (!/\.(m3u8|mp4|ts)(\?|$)/i.test(reqUrl)) {
  $done({});
  return;
}

// Scheme 处理
const scheme = ($argument && $argument.sch) ? $argument.sch : "";
const jumpUrl = scheme ? (scheme + encodeURIComponent(reqUrl)) : reqUrl;

// 第一版强制弹窗通知
$notification.post(
  "🎬 JavDB 捕获成功",
  "点击跳转播放器",
  reqUrl,
  {
    "openUrl": jumpUrl,
    "clipboard": reqUrl
  }
);

$done({});
