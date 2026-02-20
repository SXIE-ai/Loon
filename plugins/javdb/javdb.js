#  当前请求 URL
const reqUrl = $request.url;
if (!reqUrl) {
  $done({});
  return;
}

#  仅处理 JavDB 视频资源
if (!/u1\.029xxj\.com/i.test(reqUrl)) {
  $done({});
  return;
}

#  只关心第一次有效播放资源
if (!/\.(m3u8|mp4|ts)(\?|$)/i.test(reqUrl)) {
  $done({});
  return;
}

#  去重：只通知一次
const cacheKey = "JAVDB_LAST_VIDEO";
const last = $persistentStore.read(cacheKey);
# if (last) {
#   $done({});
#   return;
# }

#  写入标记
$persistentStore.write(reqUrl, cacheKey);

#  Scheme（SenPlayer / MKVPiP）
const scheme = ($argument.sch || "").trim();
const jumpUrl = scheme ? scheme + encodeURIComponent(reqUrl) : reqUrl;

#  通知
$notification.post(
  "🎬 JavDB 捕获到视频",
  "点击跳转播放器",
  reqUrl,
  {
    openUrl: jumpUrl,
    clipboard: reqUrl
  }
);

$done({});
