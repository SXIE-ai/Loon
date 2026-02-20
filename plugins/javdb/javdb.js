// 当前请求 URL
const reqUrl = $request.url;
if (!reqUrl) {
  $done({});
  return;
}

// 仅处理 JavDB 视频资源
if (!/u1\.029xxj\.com/i.test(reqUrl)) {
  $done({});
  return;
}

// 只关心播放资源
if (!/\.(m3u8|mp4|ts)(\?|$)/i.test(reqUrl)) {
  $done({});
  return;
}

// --- 这里是覆盖后的去重逻辑 ---
const cacheKey = "JAVDB_LAST_VIDEO";
const lastUrl = $persistentStore.read(cacheKey);

if (lastUrl === reqUrl) {
  // 如果当前请求的切片或视频和上一次完全一样，就静默退出
  $done({});
  return;
}

// 写入当前 URL，供下次对比（确保换片后能再次通知）
$persistentStore.write(reqUrl, cacheKey);
// --- 覆盖结束 ---

// Scheme（SenPlayer / MKVPiP）
const scheme = ($argument.sch || "").trim();
const jumpUrl = scheme
  ? scheme + encodeURIComponent(reqUrl)
  : reqUrl;

// 通知
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
