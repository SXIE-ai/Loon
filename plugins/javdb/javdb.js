// 当前请求 URL
const reqUrl = $request.url;
if (!reqUrl) {
  $done({});
  return;
}

// ... 后面接你之前的提取 ID 和通知逻辑 ...


// 2. 提取“身份证”：直接取问号前面的 URL，这样不管 u1 还是 u2 变了都能识别
const videoId = reqUrl.split('?')[0].replace(/seg-\d+/i, ""); 

const cacheKey = "JAVDB_ACTIVE_ID";
const lastVideoId = $persistentStore.read(cacheKey);

// 3. 调试日志 (在 Loon 日志里看这个输出)
console.log("当前视频ID: " + videoId);

// 4. 去重判断
if (lastVideoId === videoId) {
  $done({});
  return;
}

// 5. 写入并通知
$persistentStore.write(videoId, cacheKey);

const scheme = ($argument.sch || "").trim();
const jumpUrl = scheme ? scheme + encodeURIComponent(reqUrl) : reqUrl;

$notification.post(
  "🎬 JavDB 捕获成功",
  "点击跳转 SenPlayer",
  reqUrl,
  {
    "openUrl": jumpUrl,
    "clipboard": reqUrl
  }
);

$done({});
