const reqUrl = (typeof $request !== "undefined") ? $request.url : null;
if (!reqUrl || !/029xxj\.com/i.test(reqUrl)) {
    $done({}); return;
}

// 记录所有该域名下的请求路径（去重）
const path = reqUrl.split('?')[0];
const cacheKey = "FINAL_CHECK";
if ($persistentStore.read(cacheKey) === path) {
    $done({}); return;
}
$persistentStore.write(path, cacheKey);

// 只要是该域名下的链接，一律弹窗，咱们人工筛选
$notification.post("捕获到资源", "路径: " + path, reqUrl, { "clipboard": reqUrl });
$done({});
