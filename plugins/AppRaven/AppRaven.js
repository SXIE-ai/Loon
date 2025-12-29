/*
AppRaven Premium Unlock for Loon
Description: 解锁 AppRaven 高级功能
Author: SXIE-ai
GitHub: https://github.com/SXIE-ai/Loon
*/

(function() {
    'use strict';
    
    let body = $response.body;
    
    // 基础功能解锁
    const unlocks = [
        ['"premium":false', '"premium":true'],
        ['"hasInAppPurchases":false', '"hasInAppPurchases":true'],
        ['"youOwn":false', '"youOwn":true'],
        ['"arcade":false', '"arcade":true'],
        ['"preorder":false', '"preorder":true']
    ];
    
    // 执行替换
    unlocks.forEach(([from, to]) => {
        body = body.replace(new RegExp(from, 'g'), to);
    });
    
    // 可选：额外功能
    const extraUnlocks = [
        '"isPremium":false',
        '"isSubscribed":false', 
        '"subscriptionActive":false',
        '"pro":false',
        '"premiumUser":false'
    ];
    
    extraUnlocks.forEach(key => {
        body = body.replace(new RegExp(key, 'g'), key.replace(':false', ':true'));
    });
    
    $done({body});
})();
