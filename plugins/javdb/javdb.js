const reqUrl = (typeof $request !== "undefined") ? $request.url : null;
const arg = (typeof $argument !== "undefined") ? $argument : "";

if (!reqUrl || !/029xxj\.com/i.test(reqUrl) || !/\.(ts|m3u8)(\?|$)/i.test(reqUrl)) {
    $done({});
    return;
}

// --- 暴力合成逻辑 ---
// 把 seg-xxx.ts 替换成 index.m3u8，这通常是该架构下的主索引地址
let m3u8Url = reqUrl.replace(/seg-\d+.*\.ts/i, "index.m3u8");

// 去重，防止同一个视频反复弹
const videoId = m3u8Url.split('?')[0];
const cacheKey = "JAVDB_FINAL_M3U8";
if ($persistentStore.read(cacheKey) === videoId) {
    $done({});
    return;
}
$persistentStore.write(videoId, cacheKey);

// 解析跳转播放器 (维持之前的墨鱼架构兼容)
let playerCode = "SenPlayer";
if (typeof arg === 'string' && arg.startsWith('[')) {
    playerCode = arg.slice(1, -1).split(',')[0].trim();
}

const jumpUrl = "SenPlayer://x-callback-url/play?url=" + encodeURIComponent(m3u8Url);

$notification.post(
  "🎬 JavDB 智能合成索引",
  "尝试通过切片推导 m3u8，点击播放",
  m3u8Url,
  { "openUrl": jumpUrl }
);

$done({});
