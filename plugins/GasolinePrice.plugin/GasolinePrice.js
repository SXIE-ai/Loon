// 汽油价格查询脚本 for Loon
// 版本: 1.0.1
// 作者: SXIE-ai
// 默认地区: 湖南

const defaultConfig = {
    location: '湖南',  // 修改为湖南
    type: '92',
    isShowAll: true
};

// 获取配置函数（Loon专用）
function getConfig() {
    // 方法1: 从 $environment 获取（如果从插件配置面板传入）
    if (typeof $environment !== 'undefined' && $environment.params) {
        try {
            const params = new URLSearchParams($environment.params);
            const config = {
                location: params.get('location') || defaultConfig.location,
                type: params.get('type') || defaultConfig.type,
                isShowAll: params.get('isShowAll') === 'true' || defaultConfig.isShowAll
            };
            console.log('从 $environment 获取配置:', config);
            return config;
        } catch (e) {
            console.log('解析参数失败，使用默认配置');
        }
    }
    
    // 方法2: 从持久化存储获取（如果用户已保存配置）
    try {
        const savedConfig = $persistentStore.read('gasoline_config');
        if (savedConfig) {
            const config = JSON.parse(savedConfig);
            console.log('从持久化存储获取配置:', config);
            return { ...defaultConfig, ...config };
        }
    } catch (e) {
        console.log('读取持久化配置失败');
    }
    
    // 方法3: 使用默认配置
    console.log('使用默认配置:', defaultConfig);
    return defaultConfig;
}

// 模拟油价数据 - 添加湖南数据
async function fetchGasolinePrice(location, type) {
    // 模拟数据
    const mockData = {
        '湖南': {
            '92': 7.95,
            '95': 8.45,
            '98': 9.45,
            '0': 7.64,
            'updateTime': '2024-12-16 08:00',
            'province': '湖南省'
        },
        '江苏': {
            '92': 7.98,
            '95': 8.49,
            '98': 9.49,
            '0': 7.67,
            'updateTime': '2024-12-16 08:00',
            'province': '江苏省'
        },
        '北京': {
            '92': 8.05,
            '95': 8.56,
            '98': 9.56,
            '0': 7.74,
            'updateTime': '2024-12-16 08:00',
            'province': '北京市'
        },
        '上海': {
            '92': 8.00,
            '95': 8.51,
            '98': 9.51,
            '0': 7.69,
            'updateTime': '2024-12-16 08:00',
            'province': '上海市'
        },
        '广东': {
            '92': 8.07,
            '95': 8.74,
            '98': 9.74,
            '0': 7.72,
            'updateTime': '2024-12-16 08:00',
            'province': '广东省'
        },
        '浙江': {
            '92': 7.99,
            '95': 8.50,
            '98': 9.50,
            '0': 7.68,
            'updateTime': '2024-12-16 08:00',
            'province': '浙江省'
        }
    };
    
    // 如果查询的地区不在数据中，使用湖南作为默认
    const targetLocation = mockData[location] ? location : '湖南';
    const data = mockData[targetLocation] || mockData['湖南'];
    
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
        success: true,
        data: data,
        actualLocation: targetLocation
    };
}

// 获取油价图标函数
function getPriceIcon(type) {
    const icons = {
        '92': '⛽',
        '95': '🛢️',
        '98': '🔥',
        '0': '🚛'
    };
    return icons[type] || '⛽';
}

// 获取趋势图标（模拟）
function getTrendIcon() {
    const trends = ['↗️', '↘️', '➡️'];
    return trends[Math.floor(Math.random() * trends.length)];
}

// 主函数
async function main() {
    try {
        // 1. 获取配置
        const config = getConfig();
        const { location, type, isShowAll } = config;
        
        console.log(`开始查询油价 - 地区: ${location}, 油号: ${type}`);
        
        // 2. 获取油价数据
        const result = await fetchGasolinePrice(location, type);
        
        if (!result.success) {
            throw new Error('获取油价数据失败');
        }
        
        const priceData = result.data;
        const actualLocation = result.actualLocation;
        
        // 3. 格式化显示内容
        let content = '';
        const trendIcon = getTrendIcon();
        
        if (isShowAll) {
            content += `${getPriceIcon('92')} 92号汽油: ¥${priceData['92']} ${trendIcon}\n`;
            content += `${getPriceIcon('95')} 95号汽油: ¥${priceData['95']} ${trendIcon}\n`;
            content += `${getPriceIcon('98')} 98号汽油: ¥${priceData['98']} ${trendIcon}\n`;
            content += `${getPriceIcon('0')} 0号柴油: ¥${priceData['0']} ${trendIcon}\n`;
        } else {
            content += `${getPriceIcon(type)} ${type}号: ¥${priceData[type]} ${trendIcon}\n`;
        }
        
        content += `\n📍 ${priceData.province}`;
        
        // 如果查询的地区不在数据中，显示提示
        if (actualLocation !== location) {
            content += `\n⚠️ 未找到"${location}"数据，显示${priceData.province}数据`;
        }
        
        content += `\n🕒 ${priceData.updateTime}`;
        
        // 4. 输出到Loon面板
        const notification = {
            title: `今日油价 - ${priceData.province}`,
            content: content
        };
        
        // 判断执行环境
        if (typeof $notification !== 'undefined') {
            // Loon环境 - 发送通知
            $notification.post(notification.title, '', notification.content);
        }
        
        if (typeof $done !== 'undefined') {
            // 面板更新
            $done({
                title: notification.title,
                content: notification.content,
                icon: 'fuelpump.fill',
                'icon-color': '#FF6B00'
            });
        } else {
            // 纯脚本执行
            console.log(JSON.stringify(notification, null, 2));
        }
        
    } catch (error) {
        console.error('油价查询错误:', error);
        
        const errorMsg = {
            title: '油价查询失败',
            content: `错误: ${error.message}\n请检查网络连接\n默认显示湖南油价`
        };
        
        if (typeof $notification !== 'undefined') {
            $notification.post(errorMsg.title, '', errorMsg.content);
        }
        
        if (typeof $done !== 'undefined') {
            $done({
                title: errorMsg.title,
                content: errorMsg.content,
                icon: 'exclamationmark.triangle.fill',
                style: 'error'
            });
        }
    }
}

// 执行主函数
main();
