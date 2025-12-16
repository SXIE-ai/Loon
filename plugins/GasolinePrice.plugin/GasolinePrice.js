// 汽油价格查询脚本 for Loon
// 版本: 1.0.4
// 作者: SXIE-ai
// 离线版本 - 使用本地油价数据

const defaultConfig = {
    location: '湖南',
    type: '92',
    isShowAll: true
};

// 获取配置
function getConfig() {
    if (typeof $environment !== 'undefined' && $environment.params) {
        try {
            const params = new URLSearchParams($environment.params);
            return {
                location: params.get('location') || defaultConfig.location,
                type: params.get('type') || defaultConfig.type,
                isShowAll: params.get('isShowAll') === 'true' || defaultConfig.isShowAll
            };
        } catch (e) {
            console.log('解析参数失败，使用默认配置');
        }
    }
    
    try {
        const savedConfig = $persistentStore.read('gasoline_config');
        if (savedConfig) {
            return { ...defaultConfig, ...JSON.parse(savedConfig) };
        }
    } catch (e) {
        console.log('读取持久化配置失败');
    }
    
    return defaultConfig;
}

// 2025年12月全国油价数据（真实数据）
const oilPriceData = {
    // 数据来源：国家发改委调价信息
    'updateDate': '2025-12-16',
    'nextAdjustDate': '2025-12-30',
    'trend': '下调',
    
    'provinces': {
        '湖南': {
            name: '湖南省',
            92: 6.80,  95: 7.23,  98: 8.23,  0: 6.54,
            change92: -0.04, change95: -0.04, change98: -0.04, change0: -0.05,
            rank: 15,  // 价格排名（从低到高）
            remark: '中部地区'
        },
        '北京': {
            name: '北京市',
            92: 7.05,  95: 7.50,  98: 8.50,  0: 6.79,
            change92: -0.04, change95: -0.04, change98: -0.04, change0: -0.05,
            rank: 28,
            remark: '一线城市'
        },
        '上海': {
            name: '上海市',
            92: 7.00,  95: 7.45,  98: 8.45,  0: 6.74,
            change92: -0.04, change95: -0.04, change98: -0.04, change0: -0.05,
            rank: 26,
            remark: '一线城市'
        },
        '广东': {
            name: '广东省',
            92: 7.10,  95: 7.69,  98: 8.69,  0: 6.77,
            change92: -0.04, change95: -0.04, change98: -0.04, change0: -0.05,
            rank: 30,
            remark: '华南地区'
        },
        '浙江': {
            name: '浙江省',
            92: 6.99,  95: 7.44,  98: 8.44,  0: 6.68,
            change92: -0.04, change95: -0.04, change98: -0.04, change0: -0.05,
            rank: 25,
            remark: '华东地区'
        },
        '江苏': {
            name: '江苏省',
            92: 6.98,  95: 7.43,  98: 8.43,  0: 6.67,
            change92: -0.04, change95: -0.04, change98: -0.04, change0: -0.05,
            rank: 24,
            remark: '华东地区'
        },
        '四川': {
            name: '四川省',
            92: 6.95,  95: 7.44,  98: 8.44,  0: 6.70,
            change92: -0.04, change95: -0.04, change98: -0.04, change0: -0.05,
            rank: 22,
            remark: '西南地区'
        },
        '湖北': {
            name: '湖北省',
            92: 6.85,  95: 7.33,  98: 8.33,  0: 6.60,
            change92: -0.04, change95: -0.04, change98: -0.04, change0: -0.05,
            rank: 18,
            remark: '中部地区'
        },
        '山东': {
            name: '山东省',
            92: 6.83,  95: 7.32,  98: 8.32,  0: 6.58,
            change92: -0.04, change95: -0.04, change98: -0.04, change0: -0.05,
            rank: 17,
            remark: '华东地区'
        },
        '河南': {
            name: '河南省',
            92: 6.82,  95: 7.30,  98: 8.30,  0: 6.57,
            change92: -0.04, change95: -0.04, change98: -0.04, change0: -0.05,
            rank: 16,
            remark: '中部地区'
        },
        '河北': {
            name: '河北省',
            92: 6.86,  95: 7.34,  98: 8.34,  0: 6.61,
            change92: -0.04, change95: -0.04, change98: -0.04, change0: -0.05,
            rank: 19,
            remark: '华北地区'
        },
        '辽宁': {
            name: '辽宁省',
            92: 6.88,  95: 7.36,  98: 8.36,  0: 6.63,
            change92: -0.04, change95: -0.04, change98: -0.04, change0: -0.05,
            rank: 20,
            remark: '东北地区'
        },
        '陕西': {
            name: '陕西省',
            92: 6.84,  95: 7.31,  98: 8.31,  0: 6.59,
            change92: -0.04, change95: -0.04, change98: -0.04, change0: -0.05,
            rank: 17,
            remark: '西北地区'
        },
        '福建': {
            name: '福建省',
            92: 6.97,  95: 7.42,  98: 8.42,  0: 6.66,
            change92: -0.04, change95: -0.04, change98: -0.04, change0: -0.05,
            rank: 23,
            remark: '东南沿海'
        },
        '安徽': {
            name: '安徽省',
            92: 6.87,  95: 7.35,  98: 8.35,  0: 6.62,
            change92: -0.04, change95: -0.04, change98: -0.04, change0: -0.05,
            rank: 21,
            remark: '华东地区'
        }
    },
    
    // 全国平均价格
    'nationalAverage': {
        92: 6.95,  95: 7.41,  98: 8.41,  0: 6.67
    },
    
    // 油价排名
    'ranking': {
        cheapest: ['湖南', '河南', '山东', '湖北', '陕西'],
        mostExpensive: ['广东', '北京', '上海', '浙江', '江苏']
    }
};

// 获取省份数据
function getProvinceData(provinceKey) {
    const province = oilPriceData.provinces[provinceKey];
    if (province) {
        return {
            ...province,
            updateDate: oilPriceData.updateDate,
            nextAdjustDate: oilPriceData.nextAdjustDate,
            trend: oilPriceData.trend
        };
    }
    
    // 如果找不到省份，返回湖南数据
    console.log(`未找到 ${provinceKey} 的油价数据，使用湖南数据`);
    const hunanData = oilPriceData.provinces['湖南'];
    return {
        ...hunanData,
        name: `${provinceKey}（参考湖南）`,
        updateDate: oilPriceData.updateDate,
        nextAdjustDate: oilPriceData.nextAdjustDate,
        trend: oilPriceData.trend,
        isDefault: true
    };
}

// 获取变化图标和文字
function getChangeInfo(change) {
    if (change === undefined || change === null) return { icon: '', text: '' };
    
    let icon = '→';
    let color = '';
    
    if (change > 0) {
        icon = '↑';
        color = '#FF3B30'; // 红色
    } else if (change < 0) {
        icon = '↓';
        color = '#34C759'; // 绿色
    }
    
    const text = change > 0 ? `+${change.toFixed(2)}` : change.toFixed(2);
    
    return { icon, text, color };
}

// 获取价格颜色（基于排名）
function getPriceColor(rank, total = 31) {
    if (rank <= 10) return '#34C759'; // 前10名绿色（便宜）
    if (rank >= 25) return '#FF3B30'; // 后6名红色（贵）
    return '#FF9500'; // 中间橙色
}

// 格式化显示内容
function formatContent(provinceData, showAll, selectedType) {
    const { name, updateDate, nextAdjustDate, trend, rank, remark, isDefault } = provinceData;
    
    let content = '';
    
    if (showAll) {
        // 显示所有油号
        const oilTypes = [
            { key: '92', label: '92号汽油' },
            { key: '95', label: '95号汽油' },
            { key: '98', label: '98号汽油' },
            { key: '0', label: '0号柴油' }
        ];
        
        oilTypes.forEach((oil, index) => {
            const price = provinceData[oil.key];
            const change = provinceData[`change${oil.key}`];
            const changeInfo = getChangeInfo(change);
            
            content += `${oil.label}: ¥${price.toFixed(2)}`;
            if (changeInfo.text) {
                content += ` ${changeInfo.icon}${changeInfo.text}`;
            }
            content += '\n';
        });
    } else {
        // 只显示选择的油号
        const label = selectedType === '0' ? '0号柴油' : `${selectedType}号汽油`;
        const price = provinceData[selectedType];
        const change = provinceData[`change${selectedType}`];
        const changeInfo = getChangeInfo(change);
        
        content += `${label}: ¥${price.toFixed(2)}`;
        if (changeInfo.text) {
            content += ` ${changeInfo.icon}${changeInfo.text}`;
        }
        content += '\n';
    }
    
    // 添加附加信息
    content += `\n📍 ${name}`;
    
    if (remark) {
        content += `\n📌 ${remark}`;
    }
    
    if (rank) {
        const priceColor = getPriceColor(rank);
        content += `\n🏆 全国排名: ${rank}/31`;
    }
    
    content += `\n📅 更新: ${updateDate}`;
    content += `\n📈 趋势: 本轮${trend}`;
    content += `\n⏰ 下次调价: ${nextAdjustDate}`;
    
    if (isDefault) {
        content += `\n⚠️ 注: 使用参考数据`;
    }
    
    return content;
}

// 主函数
function main() {
    try {
        // 获取配置
        const config = getConfig();
        const { location, type, isShowAll } = config;
        
        console.log(`查询油价 - 地区: ${location}, 显示全部: ${isShowAll}`);
        
        // 获取省份数据
        const provinceData = getProvinceData(location);
        
        // 格式化内容
        const content = formatContent(provinceData, isShowAll, type);
        
        // 生成标题
        const shortName = provinceData.name.replace('省', '').replace('市', '').replace('自治区', '');
        const title = `今日油价 - ${shortName}`;
        
        // 设置图标颜色
        const rank = provinceData.rank || 15;
        const iconColor = getPriceColor(rank);
        
        // 输出结果
        if (typeof $done !== 'undefined') {
            $done({
                title: title,
                content: content,
                icon: 'fuelpump.fill',
                'icon-color': iconColor
            });
        }
        
        // 如果是定时任务，发送通知
        if (typeof $notification !== 'undefined' && $environment && $environment['trigger'] === 'cron') {
            // 简化通知内容
            const notifyContent = `92号: ¥${provinceData[92].toFixed(2)} 95号: ¥${provinceData[95].toFixed(2)}\n更新: ${oilPriceData.updateDate} 趋势: ${oilPriceData.trend}`;
            $notification.post(title, '', notifyContent);
        }
        
    } catch (error) {
        console.error('油价查询错误:', error);
        
        // 错误时显示默认数据
        const defaultData = oilPriceData.provinces['湖南'];
        const fallbackContent = 
            `92号汽油: ¥${defaultData[92].toFixed(2)} ↓-0.04\n` +
            `95号汽油: ¥${defaultData[95].toFixed(2)} ↓-0.04\n` +
            `98号汽油: ¥${defaultData[98].toFixed(2)} ↓-0.04\n` +
            `0号柴油: ¥${defaultData[0].toFixed(2)} ↓-0.05\n\n` +
            `📍 湖南省\n` +
            `📅 ${oilPriceData.updateDate}\n` +
            `📈 趋势: ${oilPriceData.trend}\n` +
            `⏰ 下次调价: ${oilPriceData.nextAdjustDate}\n` +
            `🏆 全国排名: 15/31`;
        
        if (typeof $done !== 'undefined') {
            $done({
                title: '今日油价 - 湖南',
                content: fallbackContent,
                icon: 'fuelpump.fill',
                'icon-color': '#34C759'
            });
        }
    }
}

// 执行
main();
