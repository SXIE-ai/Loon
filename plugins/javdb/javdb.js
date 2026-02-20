// 1. 安全获取变量，防止变量不存在导致脚本崩溃
const reqUrl = (typeof $request !== "undefined") ? $request.url : null;
// 增加对 $argument 的存在性检查
const arg = (typeof $argument !== "undefined") ? $argument : null;

// 2. 基础过滤：手动运行或非目标请求直接跳过
if (!reqUrl || !/029xxj\.com/i.test(reqUrl) || !/\.(m3u8|mp4|ts)(\?|$)/i.test(reqUrl)) {
  $done({});
  return;
}

// 3. 解析播放器 Scheme 参数
let jumpUrl = reqUrl;
if (arg && typeof arg === "string") {
  // 提取 sch= 后面的内容
  const match = arg.match(/sch=([^&]+)/);
  if (match && match[1]) {
    jumpUrl = match[1] + encodeURIComponent(reqUrl);
  }
}

// 4. 强制发送通知（这一版没有去重，百分百弹窗）
$notification.post(
  "🎬 JavDB 视频捕获",
  "已成功提取链接，点击跳转",
  reqUrl,
  {
    "openUrl": jumpUrl,
    "clipboard": reqUrl
  }
);

$done({});
