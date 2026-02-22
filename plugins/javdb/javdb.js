/**
 * JavDB 强制捕获脚本
 * 触发条件：只要检测到 u1.029xxj.com 域名下的视频流量
 */

const reqUrl = (typeof $request !== "undefined") ? $request.url : "";

// 1. 基础校验：必须包含目标域名和视频特征
if (!reqUrl || !/u1\.029xxj\.com/i.test(reqUrl)) {
    $done({});
    return;
}

// 2. 提取番号 (从 URL 路径中智能匹配，JavDB 的路径通常包含资源 ID)
// 路径示例：.../videos/2b/2b9ce...
const pathParts = reqUrl.split('/');
const videoId = pathParts.length > 5 ? pathParts[5].substring(0, 8).toUpperCase() : "未知番号";

// 3. 去重逻辑：5秒内同一个资源只跳一次通知
const cacheKey = "JAV_NOTIFY_LIMIT";
const lastId = $persistentStore.read(cacheKey);
if (lastId === videoId) {
    $done({});
    return;
}
$persistentStore.write(videoId, cacheKey);

// 4. 构建跳转链接 (直接尝试播放当前截获的流或推导索引)
// 我们尝试推导 index.m3u8，如果黑屏，至少剪贴板里有原始 ts 链接供你分析
const m3u8Url = reqUrl.replace(/seg-\d+.*\.ts/i, "index.m3u8");
const jumpUrl = "SenPlayer://x-callback-url/play?url=" + encodeURIComponent(m3u8Url);

// 5. 立即发送通知
$notification.post(
  "🎯 已捕获 JavDB 流量",
  "识别到资源: " + videoId,
  "点击跳转 SenPlayer，如黑屏请检查网页是否支持外链",
  { 
    "openUrl": jumpUrl,
    "clipboard": m3u8Url 
  }
);

$done({});
