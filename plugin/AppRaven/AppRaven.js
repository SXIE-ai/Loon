/*
AppRaven Premium Unlock for Loon
Description: 解锁 AppRaven 高级功能
Author: SXIE-ai
GitHub: https://github.com/SXIE-ai/Loon
*/

// AppRaven Premium Unlock Script
let body = $response.body;
body = body.replace(/"premium":false/g, '"premium":true');
body = body.replace(/"hasInAppPurchases":false/g, '"hasInAppPurchases":true');
body = body.replace(/"youOwn":false/g, '"youOwn":true');
body = body.replace(/"arcade":false/g, '"arcade":true');
body = body.replace(/"preorder":false/g, '"preorder":true');
$done({body});
