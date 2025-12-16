// Loon抓包辅助脚本
// 用于提取联通请求信息

const targetDomains = ['10010.com', 'act.10010.com', 'm.client.10010.com'];
const targetKeywords = ['login', 'signin', 'daySign', 'lottery', 'choujiang'];

// 存储抓到的请求
let capturedRequests = {
  login: null,
  sign: null,
  lottery: null
};

// 主函数
function main() {
  console.log('🔍 开始分析抓包数据...');
  
  // 这里需要手动从抓包记录中提取
  // 或者使用 $request 对象（如果在请求脚本中）
  
  showInstructions();
}

// 显示使用说明
function showInstructions() {
  const instructions = `
🎯 Loon 抓包配置指南：

1. 启用 MitM 并安装证书
2. 添加抓包规则：
   hostname = *.10010.com

3. 开始抓包并操作联通APP：
   - 登录/刷新
   - 每日签到
   - 积分抽奖

4. 停止抓包，查找以下请求：

🔑 关键请求特征：
----------------------------
✅ 登录请求：
   URL包含：login, token, auth
   Method: POST
   包含账号信息

✅ 签到请求：
   URL包含：signin, daySign
   Method: POST
   Headers中有Cookie

✅ 抽奖请求：
   URL包含：lottery, choujiang
   先有GET请求（获取token）
   后有POST请求（执行抽奖）

5. 手动记录以下信息：
   - 完整URL
   - Headers（特别是Cookie）
   - 请求方法

6. 填入插件配置中
`;
  
  console.log(instructions);
  
  if (typeof $done !== 'undefined') {
    $done({
      title: '联通抓包指南',
      content: instructions,
      icon: 'magnifyingglass'
    });
  }
}

// 如果在请求上下文中
if (typeof $request !== 'undefined') {
  const url = $request.url;
  const method = $request.method;
  const headers = $request.headers;
  
  // 检查是否为目标请求
  if (url.includes('10010.com')) {
    console.log(`📡 捕获请求: ${method} ${url}`);
    
    // 分类存储
    if (url.includes('login')) {
      capturedRequests.login = {
        url: url,
        headers: headers,
        method: method
      };
      console.log('✅ 捕获登录请求');
    }
    
    if (url.includes('daySign') || url.includes('signin')) {
      capturedRequests.sign = {
        url: url,
        headers: headers,
        method: method
      };
      console.log('✅ 捕获签到请求');
    }
    
    if (url.includes('lottery') || url.includes('choujiang')) {
      capturedRequests.lottery = {
        url: url,
        headers: headers,
        method: method
      };
      console.log('✅ 捕获抽奖请求');
    }
  }
}

// 执行
main();
