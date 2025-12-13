/*
QQ音乐自动获取Cookie脚本 - 修复版
*/

// 检查是否是Cookie获取模式
function isCookieMode() {
    if (typeof $argument === 'undefined') return true;
    
    const config = {};
    if ($argument) {
        $argument.split('&').forEach(item => {
            const [key, value] = item.split('=');
            if (key && value !== undefined) {
                config[key] = decodeURIComponent(value);
            }
        });
    }
    return config.auto_cookie !== 'false';
}

// 主逻辑
if ($request && isCookieMode()) {
    const url = $request.url;
    const cookie = $request.headers['Cookie'] || $request.headers['cookie'];
    
    // 只处理QQ音乐相关域名
    if (url.includes('y.qq.com') || url.includes('c.y.qq.com')) {
        if (cookie && isValidQQMusicCookie(cookie)) {
            saveCookieToAccount(cookie, url);
        }
    }
}

$done();

// 验证Cookie
function isValidQQMusicCookie(cookie) {
    if (!cookie) return false;
    
    // QQ音乐的关键字段
    return cookie.includes('qqmusic_key=') && 
           (cookie.includes('uin=') || cookie.includes('qqmusic_uin='));
}

// 保存Cookie
function saveCookieToAccount(cookie, url) {
    console.log('检测到QQ音乐Cookie');
    
    // 提取uin用于识别
    const uin = extractUin(cookie);
    
    // 检查现有账号
    let targetIndex = 1;
    let foundSameAccount = false;
    
    for (let i = 1; i <= 4; i++) {
        const storedCookie = $persistentStore.read(`qqmusic_cookie${i}`) || '';
        
        if (storedCookie) {
            const storedUin = extractUin(storedCookie);
            if (uin && storedUin && uin === storedUin) {
                targetIndex = i;
                foundSameAccount = true;
                console.log(`找到相同账号(uin: ${uin})，更新账号${i}`);
                break;
            }
        } else if (!foundSameAccount) {
            // 使用第一个空位
            targetIndex = i;
            break;
        }
    }
    
    // 保存Cookie
    $persistentStore.write(cookie, `qqmusic_cookie${targetIndex}`);
    $persistentStore.write('true', `qqmusic_enable${targetIndex}`);
    
    // 发送通知
    const accountName = `账号${targetIndex}`;
    const uinDisplay = uin ? `(QQ: ${uin})` : '';
    
    $notification.post(
        '🎵 QQ音乐Cookie获取',
        `${accountName} 已保存${foundSameAccount ? '（更新）' : ''}`,
        `Cookie已保存到${accountName} ${uinDisplay}\n\n` +
        `提示：请检查插件设置中的Cookie是否正确`
    );
    
    console.log(`Cookie已保存到${accountName}`);
    
    // 记录时间
    $persistentStore.write(new Date().toISOString(), `qqmusic_cookie_time_${targetIndex}`);
}

// 提取uin
function extractUin(cookie) {
    // 尝试多种uin字段
    const patterns = [
        /uin=(\d+)/,
        /qqmusic_uin=(\d+)/,
        /wx_uin=(\d+)/,
        /open_uin=(\d+)/
    ];
    
    for (const pattern of patterns) {
        const match = cookie.match(pattern);
        if (match) return match[1];
    }
    
    return null;
}
