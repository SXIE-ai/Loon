/*
 * Telegram链接重定向脚本
 * 将t.me链接重定向到指定的Telegram客户端
 */

// 调试模式
const DEBUG = true;

// 记录日志
function log(message) {
    if (DEBUG) {
        console.log(`[Telegram重定向] ${message}`);
    }
}

// 解析参数
function getArgument(key) {
    try {
        if (typeof $argument === 'undefined' || !$argument) {
            return '';
        }
        
        const params = {};
        $argument.split('&').forEach(item => {
            const [k, v] = item.split('=');
            if (k && v !== undefined) {
                params[k] = decodeURIComponent(v);
            }
        });
        
        return params[key] || '';
    } catch (e) {
        log(`解析参数失败: ${e}`);
        return '';
    }
}

// 客户端映射
const CLIENT_SCHEMES = {
    'Telegram': 'tg',
    'Swiftgram': 'sg',
    'Turrit': 'turrit', 
    'iMe': 'ime',
    'Nicegram': 'ng',
    'Lingogram': 'lingo'
};

// 主函数
(function() {
    log('脚本开始执行');
    
    // 获取用户选择的客户端
    let client = getArgument('t.me_redirect');
    log(`获取到的客户端参数: ${client}`);
    
    // 转换为对应的scheme
    const scheme = CLIENT_SCHEMES[client] || client;
    log(`转换后的scheme: ${scheme}`);
    
    if (!scheme) {
        log('未指定有效的客户端，跳过重定向');
        $done({});
        return;
    }
    
    // 提取t.me链接
    const url = $request.url;
    log(`请求URL: ${url}`);
    
    const match = url.match(/^(?:https?:\/\/)?t\.me\/(.+)$/);
    
    if (!match) {
        log('URL格式不匹配，跳过');
        $done({});
        return;
    }
    
    const domain = match[1];
    log(`提取的domain: ${domain}`);
    
    // 构建重定向URL
    const redirectUrl = `${scheme}://resolve?domain=${domain}`;
    log(`重定向到: ${redirectUrl}`);
    
    // 返回307重定向
    $done({
        status: 307,
        headers: {
            'Location': redirectUrl,
            'Content-Type': 'text/html'
        },
        body: `<html><head><meta http-equiv="refresh" content="0;url=${redirectUrl}"></head></html>`
    });
})();
