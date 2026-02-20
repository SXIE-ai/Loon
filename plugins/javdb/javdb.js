const reqUrl = (typeof $request !== "undefined") ? $request.url : null;

// 只要是这个刷屏域名的请求都拦截看一眼
if (!reqUrl || !/liquidlink\.cn/i.test(reqUrl)) {
    $done({});
    return;
}

// 提取核心参数进行去重，防止通知刷屏
const urlObj = reqUrl.split('?')[0];
const cacheKey = "LIQUID_LINK_LAST";
if ($persistentStore.read(cacheKey) === urlObj) {
    $done({});
    return;
}
$persistentStore.write(urlObj, cacheKey);

// 尝试作为普通视频链接发送给 SenPlayer
const jumpUrl = "SenPlayer://x-callback-url/play?url=" + encodeURIComponent(reqUrl);

$notification.post(
  "🎯 捕获到动态流接口",
  "域名: api.liquidlink.cn",
  "点击尝试唤起播放器，如黑屏则说明资源已加密",
  { "openUrl": jumpUrl, "clipboard": reqUrl }
);

$done({});
