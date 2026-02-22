/**
 * JavDB 番号解析跳转整合版
 * 适用：Loon (HTTP-REQUEST)
 * 功能：从 URL 提取番号 -> 请求第三方接口 -> 获取 m3u8 -> 唤起 SenPlayer
 */

const reqUrl = (typeof $request !== "undefined") ? $request.url : "";
const arg = (typeof $argument !== "undefined") ? $argument : "";

// 1. 核心逻辑：提取番号 (JavDB URL 规律：/v/XXXXX)
function getJavID(url) {
    const match = url.match(/\/v\/([a-zA-Z0-9]+)/);
    return match ? match[1].toUpperCase() : null;
}

const videoId = getJavID(reqUrl);

if (!videoId) {
    $done({});
} else {
    // 2. 构造接口 (参考仓库 API 逻辑)
    // 这里使用解析接口获取真实播放地址，避开网页乱码
    const apiAddr = `https://pear.zzxu.de/api/movie/DetailInfo?id=${videoId}`;

    const request = {
        url: apiAddr,
        headers: { "User-Agent": "Mozilla/5.0" },
        timeout: 5000
    };

    $httpClient.get(request, (error, response, data) => {
        if (error || !data) {
            console.log("解析请求失败: " + error);
            $done({});
            return;
        }

        try {
            const res = JSON.parse(data);
            // 提取播放地址 (根据实际 API 返回结构调整)
            const m3u8Url = res.data?.play_url || res.url;

            if (m3u8Url) {
                // 3. 构造播放器跳转 (适配你的 SenPlayer 设置)
                let playerScheme = "SenPlayer://x-callback-url/play?url=";
                const finalJump = playerScheme + encodeURIComponent(m3u8Url);

                $notification.post(
                    "🎬 番号解析成功: " + videoId,
                    "已锁定真实 m3u8 地址",
                    "点击立即唤起播放器",
                    { "openUrl": finalJump }
                );
            } else {
                console.log("API 未返回有效地址");
            }
        } catch (e) {
            console.log("JSON 解析异常: " + e);
        }
        $done({});
    });
}
