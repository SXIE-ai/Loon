/*
 * QQ音乐任务脚本
 * 处理额外的任务和奖励领取
 */

const TASK_API = 'https://u.y.qq.com/cgi-bin/musicu.fcg';

class QQMusicTask {
    constructor() {
        this.utils = {
            extractUin: (cookie) => {
                const match = cookie.match(/uin=o?(\d+)/i);
                return match ? match[1] : '0';
            }
        };
    }

    // 获取完整任务列表
    async getAllTasks(cookie) {
        const tasks = [];
        
        // 1. 日常任务
        const dailyTasks = await this.getDailyTasks(cookie);
        tasks.push(...dailyTasks);
        
        // 2. 成长任务
        await this.delay(1000);
        const growthTasks = await this.getGrowthTasks(cookie);
        tasks.push(...growthTasks);
        
        // 3. 活动任务
        await this.delay(1000);
        const activityTasks = await this.getActivityTasks(cookie);
        tasks.push(...activityTasks);
        
        return tasks;
    }

    // 日常任务
    async getDailyTasks(cookie) {
        const requestData = {
            "comm": {
                "ct": "6",
                "cv": "1000",
                "uin": this.utils.extractUin(cookie)
            },
            "req": {
                "module": "music.task.DailyTaskServer",
                "method": "GetTaskList",
                "param": {}
            }
        };

        return this.makeRequest(cookie, requestData);
    }

    // 成长任务
    async getGrowthTasks(cookie) {
        const requestData = {
            "comm": {
                "ct": "6",
                "cv": "1000",
                "uin": this.utils.extractUin(cookie)
            },
            "req": {
                "module": "music.task.GrowthTaskServer",
                "method": "GetTaskList",
                "param": {}
            }
        };

        return this.makeRequest(cookie, requestData);
    }

    // 活动任务
    async getActivityTasks(cookie) {
        const requestData = {
            "comm": {
                "ct": "6",
                "cv": "1000",
                "uin": this.utils.extractUin(cookie)
            },
            "req": {
                "module": "music.task.ActivityServer",
                "method": "GetActivityList",
                "param": {}
            }
        };

        return this.makeRequest(cookie, requestData);
    }

    // 执行任务
    async executeTask(cookie, taskId, taskType = 'daily') {
        let moduleName;
        
        switch (taskType) {
            case 'growth':
                moduleName = 'music.task.GrowthTaskServer';
                break;
            case 'activity':
                moduleName = 'music.task.ActivityServer';
                break;
            default:
                moduleName = 'music.task.DailyTaskServer';
        }

        const requestData = {
            "comm": {
                "ct": "6",
                "cv": "1000",
                "uin": this.utils.extractUin(cookie)
            },
            "req": {
                "module": moduleName,
                "method": "CompleteTask",
                "param": {
                    "task_id": taskId
                }
            }
        };

        const options = {
            url: TASK_API,
            headers: {
                'Cookie': cookie,
                'User-Agent': 'QQMusic/12.0.5',
                'Content-Type': 'application/json',
                'Referer': 'https://y.qq.com/'
            },
            body: JSON.stringify(requestData)
        };

        return new Promise((resolve, reject) => {
            $httpClient.post(options, (error, response, data) => {
                if (error) {
                    reject(error);
                    return;
                }

                try {
                    const result = JSON.parse(data);
                    resolve({
                        success: result.code === 0,
                        data: result.req?.data || {}
                    });
                } catch (e) {
                    reject(new Error('任务执行响应解析失败'));
                }
            });
        });
    }

    // 通用请求方法
    async makeRequest(cookie, requestData) {
        const options = {
            url: TASK_API,
            headers: {
                'Cookie': cookie,
                'User-Agent': 'QQMusic/12.0.5',
                'Content-Type': 'application/json',
                'Referer': 'https://y.qq.com/'
            },
            body: JSON.stringify(requestData)
        };

        return new Promise((resolve) => {
            $httpClient.post(options, (error, response, data) => {
                if (error || !data) {
                    resolve([]);
                    return;
                }

                try {
                    const result = JSON.parse(data);
                    if (result.code === 0 && result.req?.data?.tasks) {
                        resolve(result.req.data.tasks);
                    } else {
                        resolve([]);
                    }
                } catch (e) {
                    resolve([]);
                }
            });
        });
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 入口函数
if (typeof $argument !== 'undefined') {
    const task = new QQMusicTask();
    
    switch ($argument) {
        case 'run':
            // 执行任务逻辑
            break;
        default:
            console.log('QQ音乐任务模块已加载');
    }
}
