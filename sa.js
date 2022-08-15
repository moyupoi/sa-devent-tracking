import { $initDBbase, $removeDBbase, $readDBbase, $addDBbase, $updateDBbase, $getAllDBbase, $clearDBbase, $deleteDBbase, $readIndexDBbase } from './indexDB';
import { moyuLog } from './moyulog';
const UAParser = require('ua-parser-js');
// 数据库名称
const DATA_BASE_NAME = 'saTrackDBbase';
// 临时存储storage名称
const LOCAL_STORAGE_NAME = 'saTempData';
// 请求url
let CLIENT_URL = '';
// 系统信息
let saSystem = '';
// 防重复调用
let initStart = true;
// 存默认值
let defaultInfoData = false;
let localStorage = window.localStorage;
// 埋点开关
let isSaSwitch = true;
//上报事件
let reportEvent = [];
//不上报事件
let reportEvenEx = [];

/**
  外部调用函数
  初始化函数:      $saInit()
  赋默认信息:      $setDefaultInfo()
  埋点地爱用:      $track()
  错误检测:        $initializationDetection
*/

// 埋点初始化函数
export const $saInit = (url, reportEventParame, reportEvenExParams, interval = 10000) => {
    if (url && url !== '' && initStart && isSaSwitch) {
        reportEvent = reportEventParame;
        reportEvenEx = reportEvenExParams;
        // 防止重复调用
        initStart = false;
        // 赋值URL
        CLIENT_URL = url;
        saSystem = getUA();
        // 打开数据库
        $initDBbase(DATA_BASE_NAME, true, 1, db => {
            // 开始执行轮询
            initSetInterval(interval);
            // 监听错误日志
            if (isAllowReporting('100098')) {
                collectErrLogReport();
            }
            // 获取系统信息
            getUA();
            moyuLog({
                text: '埋点...初始化完成！',
                color: '#04c160',
            });
        });
    }
};

// 注入默认信息
export const $setDefaultInfo = params =>
    (defaultInfoData = Object.assign({
        ...defaultInfoData,
        ...params,
    }));

// 外部调用
export const $track = event => {
    /**
        isSaSwitch: 判断是否能上报事件
        isAllowReporting: 判断是否允许上报
    */
    if (isSaSwitch && isAllowReporting(event.eventId)) {
        // 判断初始化默认数据中是否有值
        if (defaultInfoData) {
            const data = {
                ...defaultInfoData,
                ...event,
                system: saSystem,
                timestamp: new Date().getTime(),
            };
            $addDBbase(DATA_BASE_NAME, data).then(res => {
                if (res) {
                    moyuLog({
                        text: '埋点...事件埋点成功!',
                        color: '#04c160',
                        data,
                    });
                } else {
                    moyuLog({
                        text: '埋点...事件埋点失败...',
                        color: '#d16770',
                    });
                }
            });
        } else {
            // 如果没有默认值，则把数据存到临时Storage中
            setTemporaryStorage(event);
        }
    }
};

// 事件埋点: 页面加载的性能指标
export const $initializationDetection = () => {
    const eventId = '100099';
    if (isSaSwitch && isAllowReporting(eventId)) {
        try {
            let navigation = performance.getEntriesByType('navigation');
            let memory = performance.memory;
            let paint = performance.getEntriesByType('paint');
            let firstPaintTime = 0;
            let firstContentfulPaint = 0;
            if (navigation && navigation.length > 0 && navigation[0].type && paint && paint.length > 0) {
                navigation = navigation[0];
                firstPaintTime = paint[0].startTime;
                firstContentfulPaint = paint[1].startTime;
            } else {
                return;
            }
            const { domainLookupStart = 0, domainLookupEnd = 0, connectStart = 0, connectEnd = 0, responseStart = 0, responseEnd = 0, domComplete = 0, domInteractive = 0, domContentLoadedEventEnd = 0, domContentLoadedEventStart = 0, loadEventEnd = 0, fetchStart = 0, loadEventStart = 0, requestStart = 0, redirectEnd = 0, redirectStart = 0 } = navigation;
            const { jsHeapSizeLimit = 0, totalJSHeapSize = 0, usedJSHeapSize = 0 } = memory;
            const data = {
                eventId,
                param: [
                    {
                        name: 'DNS查询耗时',
                        value: `${(domainLookupEnd - domainLookupStart).toFixed(0)}ms`,
                    },
                    {
                        name: 'TCP链接耗时',
                        value: `${(connectEnd - connectStart).toFixed(0)}ms`,
                    },
                    {
                        name: '网络请求耗时(TTFB)',
                        value: `${(responseStart - requestStart).toFixed(0)}ms`,
                    },
                    {
                        name: 'request请求耗时',
                        value: `${responseEnd === 0 ? 0 : (responseEnd - responseStart).toFixed(0)}ms`,
                    },
                    {
                        name: '解析dom树耗时',
                        value: `${(domInteractive - responseEnd).toFixed(0)}ms`,
                    },
                    {
                        name: '白屏时间',
                        value: `${(responseEnd - fetchStart).toFixed(0)}ms`,
                    },
                    {
                        name: 'js脚本执行时间',
                        value: `${(domContentLoadedEventEnd - domContentLoadedEventStart).toFixed(0)}ms`,
                    },
                    {
                        name: '首屏渲染时间',
                        value: `${firstPaintTime.toFixed(0)}ms`,
                    },
                    {
                        name: '首次有内容渲染时间',
                        value: `${firstContentfulPaint.toFixed(0)}ms`,
                    },
                    {
                        name: '页面完全加载时间',
                        value: `${(loadEventStart - fetchStart).toFixed(0)}ms`,
                    },
                    {
                        name: '资源加载耗时',
                        value: `${(loadEventStart - domContentLoadedEventEnd).toFixed(0)}ms`,
                    },
                    {
                        name: '重定向次数',
                        value: `${performance.navigation.redirectCount.toFixed(0)}次`,
                    },
                    {
                        name: '重定向耗时',
                        value: `${(redirectEnd - redirectStart).toFixed(0)}ms`,
                    },
                    {
                        name: '内存大小的限制',
                        value: `${clip(jsHeapSizeLimit / 1024 / 1024)} MB`,
                    },
                    {
                        name: '已分配大小',
                        value: `${clip(totalJSHeapSize / 1024 / 1024)} MB`,
                    },
                    {
                        name: '当前JS活跃内存大小',
                        value: `${clip(usedJSHeapSize / 1024 / 1024)} MB`,
                    },
                ],
            };

            $track(data);
            moyuLog({
                text: '埋点...首屏性能检测！',
                color: '#04c160',
                data,
            });
        } catch (e) {}
    }
};

export const $saReset = () => {
    initStart = false;
};

// 埋点开关
export const $saSwitch = params => {
    isSaSwitch = params;
    if (!isSaSwitch) localStorage.removeItem('saTempData');
};

// 轮询函数
const initSetInterval = interval => {
    // 轮询 调接口pull数据
    customizeSetInterval(requestAnimationFrameID => {
        const { siteid } = defaultInfoData;
        $readIndexDBbase(DATA_BASE_NAME, 'siteid', siteid, data => {
            if (data && data.length > 0) {
                moyuLog({
                    text: '埋点...索引读取成功！',
                    color: '#04c160',
                    data,
                });
                fetchEscalation(data, false);
            }
        });
        // 判断临时数据中是否有值
        reportTemporaryData();
    }, interval);
};

// 请求接口上报数据
const fetchEscalation = (data, isLocalStorage = false) => {
    fetch(CLIENT_URL, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then(res => res.json())
        .then(res => {
            if (res && res.code === 200) {
                moyuLog({
                    text: '埋点...数据请求成功！',
                    color: '#04c160',
                });
                if (isLocalStorage) {
                    // 销毁Storage中的数据
                    localStorage.removeItem(LOCAL_STORAGE_NAME);
                    moyuLog({
                        text: '埋点...销毁Storage中数据成功！',
                        color: '#04c160',
                    });
                } else {
                    // 销毁indexDB中的数据
                    saDataDestroy();
                }
            } else {
                data = JSON.stringify(data);
                moyuLog({
                    text: '埋点...销毁indexDB数据未成功...数据为',
                    color: '#d16770',
                    data,
                });
            }
        });
};

// 没有初始化时把埋点放到localStorage中
const setTemporaryStorage = event => {
    let record = localStorage.getItem(LOCAL_STORAGE_NAME);
    event = {
        ...event,
        timestamp: new Date().getTime(),
    };
    if (record && isJSONString(record)) {
        record = JSON.parse(record);
        if (record && record.length > 0) {
            record.push(event);
            record = JSON.stringify(record);
            localStorage.setItem(LOCAL_STORAGE_NAME, record);
        }
    } else {
        event = JSON.stringify([event]);
        localStorage.setItem(LOCAL_STORAGE_NAME, event);
    }
};

// 销毁数据库存的埋点
const saDataDestroy = () => {
    $clearDBbase(DATA_BASE_NAME);
    moyuLog({
        text: '埋点...indexDB中的数据销毁完毕!',
        color: '#04c160',
    });
};

const isJSONString = params => {
    if (typeof params == 'string' && params && params !== '') {
        try {
            if (typeof JSON.parse(params) === 'object') {
                return true;
            }
        } catch (e) {}
    }
    return false;
};

// 轮询函数
const customizeSetInterval = (callback, interval) => {
    let timer = null;
    let startTime = Date.now();
    let loop = () => {
        let endTime = Date.now();
        if (endTime - startTime >= interval) {
            startTime = endTime = Date.now();
            callback(timer);
        }
        timer = window.requestAnimationFrame(loop);
    };
    loop();
    return timer;
};

// 上报临时数据
const reportTemporaryData = () => {
    // 判断storage中是否存在数据，如果存在提交上去并清空
    let record = localStorage.getItem(LOCAL_STORAGE_NAME);
    if (record && isJSONString(record)) {
        let recordArray = JSON.parse(record);
        if (defaultInfoData && defaultInfoData.username && defaultInfoData.username !== '' && recordArray && recordArray.length > 0) {
            // 默认信息回填
            recordArray.map(item => Object.assign(item, defaultInfoData));
            // 上报埋点
            fetchEscalation(recordArray, true);
            moyuLog({
                text: '埋点...上报storage中临时数据完成!',
                color: '#04c160',
            });
        }
    }
};

// 获取错误日志
const collectErrLogReport = () => {
    window.onerror = (msg, url, line, col, error) => {
        let errorText = '';
        if (error && error.stack) {
            // 如果浏览器有堆栈信息，直接使用
            errorText = error.stack.toString();
        } else if (arguments.callee) {
            // 尝试通过callee拿堆栈信息
            let ext = [];
            let fn = arguments.callee.caller;
            // 这里只拿三层堆栈信息
            let floor = 3;
            while (fn && --floor > 0) {
                ext.push(fn.toString());
                if (fn === fn.caller) {
                    // 如果有环
                    break;
                }
                fn = fn.caller;
            }
            errorText = ext.join(',');
        }
        if (msg.indexOf("'")) {
            msg = msg.replace(/'/g, '"');
        }
        if (errorText.indexOf("'")) {
            errorText = errorText.replace(/'/g, '"');
        }
        const data = {
            eventId: '100098',
            system: saSystem,
            ...defaultInfoData,
            param: {
                msg,
                url,
                line,
                col,
                errorText,
            },
        };
        moyuLog({
            text: '埋点...发现一条崩溃错误...',
            color: '#d16770',
            data,
        });

        const { siteid } = defaultInfoData;
        $readIndexDBbase(DATA_BASE_NAME, 'siteid', siteid, dbase => {
            let dbaseMap = dbase.filter(item => item.eventId === '100098');
            // 默认重复
            let isRepeat = false;
            if (dbaseMap && dbaseMap.length > 0) {
                dbaseMap.map(item => {
                    if (item.eventId === '100098' && item.param && item.param.msg === msg) {
                        // 重复了，并且更新
                        let frequency = item.frequency ? item.frequency + 1 : 1;
                        $updateDBbase(DATA_BASE_NAME, { ...item, frequency });
                    } else {
                        // 不重复
                        isRepeat = true;
                    }
                });
                if (isRepeat) $track(data);
            } else {
                $track(data);
            }
        });
    };
};

const clip = num => num.toString().replace(/(?<=\.\d{2}).*$/, '');

// 获取系统信息
const getUA = () => {
    const uaParser = new UAParser(window.navigator.userAgent);
    const result = uaParser.getResult();
    const { browser, cpu, os } = result;
    return {
        cpu: cpu.architecture || '',
        browser: `${browser.name} ${browser.version}`,
        os: `${os.name} ${os.version}`,
    };
};

// 判断是否可以上报
const isAllowReporting = eventId => {
    let result = true;
    // 允许上报事件
    if (reportEvent && reportEvent.length > 0 && reportEvent.filter(item => item !== eventId).length > 0) {
        result = false;
    }

    // 不允许上报事件
    if (reportEvenEx && reportEvenEx.length > 0 && reportEvenEx.filter(item => item === eventId).length > 0) {
        result = false;
    }

    return result;
};

// 实时监控cpu运行效率
let delay = 1000;
let data = {
    per_line: [], //记录每个点对应的cpu开销
    time_line: [], //没个点的时间坐标记录下来
    averageTime: delay, //如果cpu一直是0%，那就是200ms打一个点
    totalSize: 0, //从启动到现在累计的总开销
};
export const $CPUEfficiency = (delay = 1000, callback) => {
    let lastTime = Date.now();
    delay = delay;
    data.averageTime = delay;
    customizeSetInterval(requestAnimationFrameID => {
        let per = (Date.now() - lastTime - delay - 0) / delay;
        if (per < 0) {
            per = 0;
        }
        if (per > 1) {
            per = 1;
        }
        lastTime = Date.now();
        let stepPer = getStepPer(Date.now(), per);
        let cpuNumber = Math.round(stepPer * 100);
        if (cpuNumber) {
            callback(`${cpuNumber}%`);
        }
    }, delay);
};

/**
 * 计算当前的实际百分比，然后限制在最高100%的时候需要补画多少个点，确保面积不受影响
 * @param {Number} time 当前这个点的时间
 * @param {Number} per  当前的CPU百分比
 */
const getStepPer = (time, per) => {
    data.time_line.push(time);
    let cd;
    data.per_line.push(per);
    let len = data.time_line.length;
    if (data.time_line.length == 1) {
        cd = data.averageTime;
    } else {
        cd = time - data.time_line[len - 2];
    }
    if (cd < data.averageTime) {
        cd = data.averageTime;
    }
    let result = (cd - data.averageTime) / data.averageTime;
    if (len >= 2) {
        data.totalSize += ((data.per_line[len - 1] + data.per_line[len - 2]) * (data.time_line[len - 1] - data.time_line[len - 2])) / 2;
    }
    if (data.per_line.length > 2) {
        //省内存，最多保存两个值
        data.per_line.shift();
        data.time_line.shift();
    }
    if (result >= 100) {
        result = 100
    }
    return result;
};

// 获取实时帧率
export const $FPSEfficiency = (callback) => {
    let lastTime = performance.now();
    let frame = 0;
    let lastFameTime = performance.now();
    let loop = (time) => {
        let now =  performance.now();
        let fs = (now - lastFameTime);
        lastFameTime = now;
        let fps = Math.round(1000/fs);
        frame++;
        if (now > 1000 + lastTime) {
            let fps = Math.round( ( frame * 1000 ) / ( now - lastTime ) );
            frame = 0;
            lastTime = now;
            callback(fps);
        };
        window.requestAnimationFrame(loop);
    }
    loop();
}
