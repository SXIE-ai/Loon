// QQ音乐自动签到插件 v2.0.0（单账号版）
// 简洁稳定的单账号版本
// 作者: SXIE-ai

// ============================================
// 配置管理（简化版）
// ============================================

const Config = {
    // 默认配置
    defaults: {
        cookieSwitch: true,
        notificationSwitch: true,
        enableVip: true,
        checkinTime: "09:10"
    },
    
    // 加载配置
    load() {
        let config = { ...this.defaults };
        
        // 1. 从插件参数加载
        if (typeof $argument !== 'undefined' && $argument) {
            try {
                const args = this.parseArgs($argument);
                Object.assign(config, args);
            } catch (e) {
                console.log('参数解析失败，使用默认值');
            }
        }
        
        // 2. 从存储加载用户配置
        const saved = $persistentStore.read('QQMusic_Single_Config');
        if (saved) {
            try {
                const userConfig = JSON.parse(saved);
                Object.assign(config, userConfig);
            } catch (e) {
                console.log('存储配置解析失败');
            }
        }
        
        console.log('加载配置:', config);
        return config;
    },
    
    // 解析参数
    parseArgs(arg) {
        const config = {};
        
        if (typeof arg === 'string') {
            if (arg.includes('=')) {
                arg.split('&').forEach(pair => {
                    const [key, value] = pair.split('=');
                    if (key && value !== undefined) {
                        config[key] = this.parseValue(value);
                    }
                });
            }
        }
        
        return config;
    },
    
    parseValue(value) {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    },
    
    // 保存配置
    save(config) {
        $persistentStore.write(JSON.stringify(config), 'QQMusic_Single_Config');
    }
};

// ============================================
// 单账号Cookie管理
// ============================================

const CookieManager = {
    // 获取当前Cookie
    get() {
        return $persistentStore.read('QQMusic_Cookie');
    },
    
    // 设置Cookie
    set(cookie) {
        if (!cookie || !this.isValid(cookie)) {
            console.log('Cookie无效，不保存');
            return false;
        }
        
        const oldCookie = this.get();
        if (oldCookie === cookie) {
            console.log('Cookie未变化');
            return false;
        }
        
        $persistentStore.write(cookie, 'QQMusic_Cookie');
        
        // 记录获取时间
        const time = new Date().toLocaleString('zh-CN');
        $persistentStore.write(time, 'QQMusic_Cookie_Time');
        
        console.log('Cookie保存成功');
        return true;
    },
    
    // 清理Cookie
    clear() {
        $persistentStore.write('', 'QQMusic_Cookie');
        $persistentStore.write('', 'QQMusic_Cookie_Time');
        console.log('Cookie已清理');
        return true;
    },
    
    // 检查Cookie是否存在
    exists() {
        return !!this.get();
    },
    
    // 验证Cookie格式
    isValid(cookie) {
        if (!cookie) return false;
        // 检查必要字段
        return cookie.includes('uin=') && cookie.includes('p_skey=');
    },
    
    // 从Cookie提取uin
    extractUin(cookie) {
        const match = cookie.match(/uin=o?(\d+)/i);
        return match ? match[1] : '未知';
    },
    
    // 获取Cookie信息
    getInfo() {
        const cookie = this.get();
        if (!cookie) return null;
        
        const uin = this.extractUin(cookie);
        const time = $persistentStore.read('QQMusic_Cookie_Time') || '未知';
        
        return {
            uin: uin,
            time: time,
            length: cookie.length
        };
    }
};

// ============================================
// 签到管理
// ============================================

const CheckinManager = {
    // 执行签到
    async execute(config) {
        try {
            console.log('开始QQ音乐签到');
            
            // 1. 检查Cookie
            if (!CookieManager.exists()) {
                this.notify(config, 'QQ音乐签到', '失败', '请先获取Cookie');
                return;
            }
            
            const cookie = CookieManager.get();
            
            // 2. 检查是否已签到
            if (this.hasCheckedToday()) {
                this.notify(config, 'QQ音乐签到', '提示', '今日已签到');
                return;
            }
            
            // 3. 执行签到
            const result = await this.doCheckin(cookie);
            
            if (result.code === 0) {
                await this.handleSuccess(config, result, cookie);
            } else if (result.code === 1001) {
                await this.handleAlreadyChecked(config);
            } else {
                this.notify(config, 'QQ音乐签到', '失败', `错误码: ${result.code}`);
            }
            
        } catch (error) {
            console.error('签到失败:', error);
            this.notify(config, 'QQ音乐签到', '错误', error.message);
        }
    },
    
    // 执行签到请求
    async doCheckin(cookie) {
        const uin = CookieManager.extractUin(cookie);
        
        const requestData = {
            "comm": { "ct": "6", "cv": "1000", "uin": uin },
            "req": { "module": "music.task.TaskCenterServer", "method": "CheckIn", "param": {} }
        };
        
        const options = {
            url: 'https://u.y.qq.com/cgi-bin/musicu.fcg',
            headers: {
                'Cookie': cookie,
                'User-Agent': 'QQMusic/12.0.5',
                'Content-Type': 'application/json',
                'Referer': 'https://y.qq.com/'
            },
            body: JSON.stringify(requestData),
            timeout: 10000
        };
        
        return await this.httpRequest(options);
    },
    
    // 执行VIP签到
    async doVipCheckin(cookie) {
        const uin = CookieManager.extractUin(cookie);
        
        const requestData = {
            "comm": { "ct": "6", "cv": "1000", "uin": uin },
            "req": { "module": "music.vip.VipCenterServer", "method": "CheckIn", "param": {} }
        };
        
        const options = {
            url: 'https://u.y.qq.com/cgi-bin/musicu.fcg',
            headers: {
                'Cookie': cookie,
                'User-Agent': 'QQMusic/12.0.5',
                'Content-Type': 'application/json',
                'Referer': 'https://y.qq.com/'
            },
            body: JSON.stringify(requestData)
        };
        
        return await this.httpRequest(options);
    },
    
    // HTTP请求
    async httpRequest(options) {
        return new Promise((resolve, reject) => {
            $httpClient.post(options, (error, response, data) => {
                if (error) {
                    reject(error);
                    return;
                }
                
                try {
                    const result = JSON.parse(data);
                    resolve(result);
                } catch (e) {
                    reject(new Error('响应解析失败'));
                }
            });
        });
    },
    
    // 处理签到成功
    async handleSuccess(config, result, cookie) {
        console.log('签到成功');
        
        // 解析奖励
        const reward = result.req?.data?.reward || {};
        let message = '签到成功';
        const rewards = [];
        
        if (reward.exp) rewards.push(`经验+${reward.exp}`);
        if (reward.point) rewards.push(`积分+${reward.point}`);
        if (reward.vip_point) rewards.push(`成长值+${reward.vip_point}`);
        
        if (rewards.length > 0) {
            message += '：' + rewards.join(' ');
        }
        
        // 保存签到状态
        this.saveCheckinTime();
        
        // 发送通知
        this.notify(config, 'QQ音乐签到', '成功', message);
        
        // 执行VIP签到
        if (config.enableVip) {
            await this.delay(1000);
            try {
                const vipResult = await this.doVipCheckin(cookie);
                if (vipResult.code === 0) {
                    const vipReward = vipResult.req?.data?.reward || {};
                    if (vipReward.vip_point) {
                        this.notify(config, 'QQ音乐VIP', '成功', `成长值+${vipReward.vip_point}`);
                    }
                }
            } catch (vipError) {
                console.log('VIP签到失败，不影响主流程');
            }
        }
    },
    
    // 处理已签到
    async handleAlreadyChecked(config) {
        console.log('今日已签到');
        this.saveCheckinTime();
        this.notify(config, 'QQ音乐签到', '提示', '今日已签到');
    },
    
    // 保存签到时间
    saveCheckinTime() {
        const today = new Date().toLocaleDateString('zh-CN');
        $persistentStore.write(today, 'QQMusic_LastCheckin');
        $persistentStore.write(new Date().toLocaleTimeString('zh-CN'), 'QQMusic_LastCheckin_Time');
    },
    
    // 检查今天是否已签到
    hasCheckedToday() {
        const lastDate = $persistentStore.read('QQMusic_LastCheckin');
        const today = new Date().toLocaleDateString('zh-CN');
        return lastDate === today;
    },
    
    // 延迟函数
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    // 发送通知（受配置控制）
    notify(config, title, subtitle, content) {
        if (config.notificationSwitch) {
            $notification.post(title, subtitle, content);
        } else {
            console.log(`通知被关闭: ${title} - ${subtitle}: ${content}`);
        }
    }
};

// ============================================
// 面板生成
// ============================================

const PanelManager = {
    // 生成面板内容
    generate(config) {
        const cookieInfo = CookieManager.getInfo();
        const lastCheckin = $persistentStore.read('QQMusic_LastCheckin');
        const checkinTime = $persistentStore.read('QQMusic_LastCheckin_Time');
        const today = new Date().toLocaleDateString('zh-CN');
        
        let content = '';
        let subtitle = '';
        let icon = 'music.note';
        let iconColor = '#007AFF';
        let actionUrl = 'http://trigger.qqmusic.local/';
        let actionTitle = '立即签到';
        
        if (!cookieInfo) {
            // 没有Cookie
            const status = config.cookieSwitch ? '请打开QQ音乐' : 'Cookie获取已关闭';
            content = `❌ 未配置账号\n${status}`;
            subtitle = '未登录';
            icon = 'exclamationmark.triangle';
            iconColor = '#FF9500';
            actionUrl = 'http://getcookie.qqmusic.local/';
            actionTitle = '获取Cookie';
            
        } else if (lastCheckin === today) {
            // 今日已签到
            content = `✅ 今日已签到\n时间: ${checkinTime || '今日'}\n账号: ${cookieInfo.uin}`;
            subtitle = '已签到';
            icon = 'checkmark.circle.fill';
            iconColor = '#34C759';
            actionUrl = 'http://getcookie.qqmusic.local/';
            actionTitle = '查看Cookie';
            
        } else {
            // 待签到
            content = `⏰ 待签到\n时间: ${config.checkinTime}\n账号: ${cookieInfo.uin}\nCookie: ${cookieInfo.time}`;
            subtitle = '待签到';
        }
        
        // 添加配置状态
        content += `\n\n⚙️ 当前配置`;
        content += `\nCookie获取: ${config.cookieSwitch ? '✅' : '❌'}`;
        content += `  通知: ${config.notificationSwitch ? '✅' : '❌'}`;
        content += `\nVIP签到: ${config.enableVip ? '✅' : '❌'}`;
        
        return {
            title: 'QQ音乐签到',
            content: content,
            subtitle: subtitle,
            icon: icon,
            'icon-color': iconColor,
            'action-url': actionUrl,
            'action-title': actionTitle
        };
    }
};

// ============================================
// 路由分发
// ============================================

(function main() {
    console.log('QQ音乐插件启动（单账号版）');
    
    // 加载配置
    const config = Config.load();
    
    // 获取执行模式
    const hasRequest = typeof $request !== 'undefined';
    const argument = typeof $argument !== 'undefined' ? $argument : '';
    
    console.log(`执行模式: ${hasRequest ? 'HTTP请求' : '脚本'}, 参数: ${argument || '无'}`);
    
    // Cookie获取请求
    if (hasRequest) {
        handleCookieRequest(config);
        return;
    }
    
    // 脚本执行
    switch (argument) {
        case 'panel':
            // 生成面板
            const panel = PanelManager.generate(config);
            $done(panel);
            break;
            
        case 'getcookie':
            // 手动获取Cookie
            handleManualGetCookie(config);
            $done();
            break;
            
        case 'clearcookie':
            // 清理Cookie
            handleClearCookie(config);
            $done();
            break;
            
        case 'manual':
        case 'auto':
        default:
            // 执行签到
            CheckinManager.execute(config);
            $done();
    }
})();

// ============================================
// 请求处理函数
// ============================================

// 处理Cookie获取请求
function handleCookieRequest(config) {
    // 检查开关
    if (!config.cookieSwitch) {
        console.log('Cookie获取开关已关闭，跳过处理');
        $done({});
        return;
    }
    
    const url = $request.url;
    const cookie = $request.headers['Cookie'] || $request.headers['cookie'];
    
    // 只处理QQ音乐请求
    if (!url.includes('qq.com') || !cookie) {
        $done({});
        return;
    }
    
    // 保存Cookie
    const saved = CookieManager.set(cookie);
    
    if (saved) {
        const info = CookieManager.getInfo();
        const message = `账号: ${info.uin}\n时间: ${info.time}`;
        
        // 发送通知
        if (config.notificationSwitch) {
            $notification.post('QQ音乐', 'Cookie已保存', message);
        }
        
        console.log(`Cookie保存成功: ${info.uin}`);
    }
    
    $done({});
}

// 手动获取Cookie提示
function handleManualGetCookie(config) {
    if (!config.cookieSwitch) {
        const message = 'Cookie获取开关已关闭\n请在插件设置中开启';
        if (config.notificationSwitch) {
            $notification.post('QQ音乐', '获取失败', message);
        }
        return;
    }
    
    if (CookieManager.exists()) {
        const info = CookieManager.getInfo();
        const message = `已有账号: ${info.uin}\n请打开QQ音乐App刷新`;
        if (config.notificationSwitch) {
            $notification.post('QQ音乐', '已有Cookie', message);
        }
    } else {
        const message = '请打开QQ音乐App获取Cookie';
        if (config.notificationSwitch) {
            $notification.post('QQ音乐', '提示', message);
        }
    }
}

// 清理Cookie
function handleClearCookie(config) {
    const cleared = CookieManager.clear();
    
    if (cleared && config.notificationSwitch) {
        $notification.post('QQ音乐', 'Cookie已清理', '请重新获取Cookie');
    }
    
    console.log('Cookie清理完成');
}