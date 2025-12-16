// 汽油价格查询脚本 for Loon
// 版本: 1.0.5
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

// 2025年12月全国油价数据
const oilPriceData = {
    'updateDate': '2025-12-16',
    'nextAdjustDate': '2025-12-30',
    'trend': '下调',
    
    'provinces': {
        '湖南': {
            name: '湖南省',
            92: 6.80,  95: 7.23,  98: 8.23,  0: 6.54,
            change92: -0.04, change95: -0.04, change98: -0.04, change0: -0.05,
            rank: 15,
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
        }
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

// 主函数
function main() {
    try {
        // 获取配置
        const config = getConfig();
        const { location, type, isShowAll } = config;
        
        console.log(`查询油价 - 地区: ${location}, 显示全部: ${isShowAll}`);
        
        // 获取省份数据
        const provinceData = getProvinceData(location);
        const { name, updateDate, nextAdjustDate, trend, rank, remark } = provinceData;
        
        // 格式化显示内容
        let content = '';
        
        if (isShowAll) {
            content += `92号汽油: ¥${provinceData[92].toFixed(2)} ↓-0.04\n`;
            content += `95号汽油: ¥${provinceData[95].toFixed(2)} ↓-0.04\n`;
            content += `98号汽油: ¥${provinceData[98].toFixed(2)} ↓-0.04\n`;
            content += `0号柴油: ¥${provinceData[0].toFixed(2)} ↓-0.05\n`;
        } else {
            const price = provinceData[type];
            const label = type === '0' ? '0号柴油' : `${type}号汽油`;
            const change = type === '0' ? '-0.05' : '-0.04';
            content += `${label}: ¥${price.toFixed(2)} ↓${change}\n`;
        }
        
        content += `\n📍 ${name}`;
        
        if (remark) {
            content += `\n📌 ${remark}`;
        }
        
        if (rank) {
            content += `\n🏆 全国排名: ${rank}/31`;
        }
        
        content += `\n📅 更新: ${updateDate}`;
        content += `\n📈 趋势: 本轮${trend}`;
        content += `\n⏰ 下次调价: ${nextAdjustDate}`;
        
        // 生成标题
        const shortName = name.replace('省', '').replace('市', '').replace('自治区', '').replace('（参考湖南）', '');
        const title = `今日油价 - ${shortName}`;
        
        console.log(`标题: ${title}`);
        console.log(`内容: \n${content}`);
        
        // 输出到面板 - Loon的正确格式
        const result = {
            title: title,
            content: content,
            icon: "fuelpump"
        };
        
        console.log('准备调用 $done');
        $done(result);
        
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
            `📌 中部地区\n` +
            `🏆 全国排名: 15/31\n` +
            `📅 更新: ${oilPriceData.updateDate}\n` +
            `📈 趋势: ${oilPriceData.trend}\n` +
            `⏰ 下次调价: ${oilPriceData.nextAdjustDate}`;
        
        const fallbackResult = {
            title: '今日油价 - 湖南',
            content: fallbackContent,
            icon: "fuelpump"
        };
        
        $done(fallbackResult);
    }
}

// 执行
try {
    main();
} catch (e) {
    console.error('脚本执行错误:', e);
    $done({
        title: '油价查询',
        content: '脚本执行出错，请检查配置\n\n错误信息：' + e.message,
        icon: "exclamationmark.triangle"
    });
}
