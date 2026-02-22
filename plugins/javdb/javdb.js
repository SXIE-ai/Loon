/**
 * JavDB 番号解析跳转 (整合版)
 * 逻辑：提取番号 -> 接口请求 -> 获取 m3u8 -> 唤起播放器
 */

const $ = new Env('JavDB番号解析');
const arg = (typeof $argument !== "undefined") ? $argument : "";

// 1. 获取当前页面 URL 或请求
const currentUrl = (typeof $request !== "undefined") ? $request.url : "";

// 2. 提取番号 (针对 JavDB 的 URL 规律)
// 比如 https://javdb.com/v/XXXXX 或标题中的 ABC-123
function getID() {
    let id = "";
    const urlMatch = currentUrl.match(/\/v\/([a-zA-Z0-9]+)/);
    if (urlMatch) {
        id = urlMatch[1];
    }
    // 如果 URL 没匹配到，尝试匹配网页标题（如果是脚本注入模式）
    return id.toUpperCase();
}

const videoId = getID();

if (!videoId) {
    $.done({});
} else {
    // 3. 构造解析接口 (参考仓库中的 API 逻辑)
    // 注意：这里需要一个有效的解析服务器地址，Pear 脚本通常也是请求类似地址
    const api_url = `https://pear.zzxu.de/api/movie/DetailInfo?id=${videoId}`; 

    $.get({
        url: api_url,
        headers: { "User-Agent": "Mozilla/5.0" }
    }, (error, response, data) => {
        if (!error && data) {
            try {
                const res = JSON.parse(data);
                // 假设返回的数据结构中有 m3u8 地址
                const m3u8Url = res.data.play_url || res.url; 

                if (m3u8Url) {
                    // 4. 解析播放器 Scheme (复用你之前的逻辑)
                    let playerCode = "SenPlayer";
                    if (arg.startsWith('[')) {
                        playerCode = arg.slice(1, -1).split(',')[0].trim();
                    }

                    const jumpUrl = `SenPlayer://x-callback-url/play?url=${encodeURIComponent(m3u8Url)}`;

                    $.notification.post(
                        "🎬 JavDB 番号解析成功",
                        `识别到番号: ${videoId}`,
                        "点击跳转 SenPlayer 播放",
                        { "openUrl": jumpUrl }
                    );
                } else {
                    console.log("解析成功但未找到播放地址");
                }
            } catch (e) {
                console.log("解析失败: " + e);
            }
        }
        $.done({});
    });
}
