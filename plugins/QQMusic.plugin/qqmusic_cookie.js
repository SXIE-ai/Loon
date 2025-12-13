/*
QQ音乐自动获取Cookie脚本 for Loon
自动捕获Cookie并保存到合适的账号位置
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
    return config.auto_cookie === 'true';
}

// 主逻辑
if ($request && isCookieMode()) {
    const cookie = $request.headers['Cookie'] || $request.headers['cookie'];
    
    if (cookie && isValidQQMusicCookie(cookie)) {
        saveCookieToAccount(cookie);
    }
}

$done();

// 验证是否是有效的QQ音乐Cookie
function isValidQQMusicCookie(cookie) {
    return cookie.includes('qqmusic_key') && 
           cookie.includes('uin') && 
           (cookie.includes('p_skey') || cookie.includes('skey') || cookie.includes('qm_keystr'));
}

// 保存Cookie到合适的账号位置
function saveCookieToAccount(newCookie) {
    console.log('检测到QQ音乐Cookie，开始处理...');
    
    // 检查现有账号情况
    const accounts = [];
    for (let i = 1; i <= 4; i++) {
        const cookieKey = `qqmusic_cookie${i}`;
        const enableKey = `qqmusic_enable${i}`;
        
        // 尝试从持久化存储读取
        const existingCookie = $persistentStore.read(cookieKey) || '';
        const existingEnable = $persistentStore.read(enableKey) || 'false';
        
        accounts.push({
            index: i,
            cookie: existingCookie,
            enabled: existingEnable === 'true',
            isEmpty: !existingCookie.trim()
        });
    }
    
    // 策略1：优先替换相同账号（通过uin判断）
    const newUin = extractUin(newCookie);
    let targetAccount = null;
    
    for (const account of accounts) {
        if (account.cookie) {
            const oldUin = extractUin(account.cookie);
            if (oldUin && newUin && oldUin === newUin) {
                targetAccount = account;
                console.log(`找到相同账号(uin: ${newUin})，更新账号${account.index}`);
                break;
            }
        }
    }
    
    // 策略2：如果没有相同账号，使用第一个空位
    if (!targetAccount) {
        for (const account of accounts) {
            if (account.isEmpty) {
                targetAccount = account;
                console.log(`使用空位账号${account.index}`);
                break;
            }
        }
    }
    
    // 策略3：如果没有空位，使用第一个账号
    if (!targetAccount) {
        targetAccount = accounts[0];
        console.log(`所有账号已满，更新账号1`);
    }
    
    // 保存Cookie和启用状态
    if (targetAccount) {
        const cookieKey = `qqmusic_cookie${targetAccount.index}`;
        const enableKey = `qqmusic_enable${targetAccount.index}`;
        
        $persistentStore.write(newCookie, cookieKey);
        $persistentStore.write('true', enableKey);
        
        // 发送通知
        const accountName = `账号${targetAccount.index}`;
        const uinDisplay = newUin ? `(uin: ${newUin})` : '';
        
        $notification.post(
            '🎵 QQ音乐Cookie获取成功',
            `${accountName} 已更新`,
            `Cookie已自动保存到${accountName} ${uinDisplay}\n\n` +
            `请进入插件设置确认：\n` +
            `1. Cookie已自动填充\n` +
            `2. 开关已自动开启\n` +
            `3. 如有多账号请手动调整`
        );
        
        console.log(`Cookie已保存到${accountName}`);
        
        // 记录获取时间
        $persistentStore.write(new Date().toISOString(), `qqmusic_last_cookie_update`);
    }
}

// 从Cookie中提取uin
function extractUin(cookie) {
    const match = cookie.match(/uin=(\d+)/);
    return match ? match[1] : null;
}

// 辅助函数：从插件参数获取配置（用于调试）
function getPluginArg(key) {
    try {
        if (typeof $argument !== 'undefined' && $argument) {
            const args = {};
            $argument.split('&').forEach(item => {
                const [k, v] = item.split('=');
                if (k && v !== undefined) {
                    args[k] = decodeURIComponent(v);
                }
            });
            return args[key];
        }
    } catch (e) {
        console.log('读取插件参数失败:', e);
    }
    return null;
}
