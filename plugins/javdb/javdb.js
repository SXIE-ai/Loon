/*
#!name = JavDB → SenPlayer 播放
#!desc = 抓取 JavDB 播放页中真实视频流（m3u8/mp4），点击通知跳转 SenPlayer
#!author = you
*/

const url = $request.url;
if (!url) {
  $done({});
  return;
}

// 只处理视频直链
if (!/\.(m3u8|mp4|webm)(\?|$)/i.test(url)) {
  $done({});
  return;
}

// 去重
const KEY = "JAVDB_LAST_VIDEO_URL";
const last = $persistentStore.read(KEY);
if (last === url) {
  $done({});
  return;
}
$persistentStore.write(url, KEY);

// SenPlayer scheme
const senPlayerUrl =
  "SenPlayer://x-callback-url/play?url=" + encodeURIComponent(url);

// 通知
$notification.post(
  "🎬 JavDB 捕获到视频流",
  "点击使用 SenPlayer 播放",
  url.split("?")[0],
  {
    openUrl: senPlayerUrl,
    clipboard: url
  }
);

$done({});
