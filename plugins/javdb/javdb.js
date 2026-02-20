const reqUrl = $request.url;
if (!reqUrl || !/u1\.029xxj\.com/i.test(reqUrl) || !/\.(m3u8|mp4|ts)(\?|$)/i.test(reqUrl)) {
  $done({});
  return;
}

const cacheKey = "JAVDB_LAST_NOTIFY_TIME";
const lastNotifyTime = $persistentStore.read(cacheKey);
const now = Date.now();

// 如果距离上次通知不到 300 秒（5分钟），就静默退出
if (lastNotifyTime && (now - parseInt(lastNotifyTime) < 300000)) {
  $done({});
  return;
}

// 写入当前时间戳
$persistentStore.write(now.toString(), cacheKey);

// 修复 $argument 报错
let scheme = "";
try {
  if (typeof $argument !== "undefined" && $argument) {
    // 兼容 sch=xxx 或直接填字符串的情况
    scheme = typeof $argument === "string" ? $argument : ($argument.sch || "");
  }
} catch (e) {}

const jumpUrl = scheme ? scheme.trim() + encodeURIComponent(reqUrl) : reqUrl;

$notification.post(
  "🎬 JavDB 捕获到视频",
  "点击跳转播放器",
  "已捕获最新资源，5分钟内不再重复提醒",
  {
    openUrl: jumpUrl,
    clipboard: reqUrl
  }
);

$done({});
