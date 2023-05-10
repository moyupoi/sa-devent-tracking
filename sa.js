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
// 存储错误信息
let errorData = [];

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

        // window.addEventListener('error', (e) => {})
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
            // 错误信息
            let tempData = data;
            if (errorData && errorData.length > 0) {
                tempData = data.concat(errorData);
                errorData = [];
            }
            // 埋点数据提交
            if (tempData && tempData.length > 0) {
                moyuLog({
                    text: '埋点...索引读取成功！',
                    color: '#04c160',
                    tempData,
                });
                fetchEscalation(tempData, false);
            }
        });
        // 判断临时数据中是否有值
        reportTemporaryData();
    }, interval);
};

const unrepeated = (arr) => {
    let hash = {};
    return arr.reduce((accum, item) => {
        hash[item['timestamp']] ? '' : (hash[item['timestamp']] = true && accum.push(item));
        return accum;
    }, []);
}

// 请求接口上报数据
const fetchEscalation = (data, isLocalStorage = false) => {
    try {
        if (data && data.length > 0) {
            data = unrepeated(data);
        }
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
    } catch (e) {}
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
            $localstorageISExcess(LOCAL_STORAGE_NAME, record);
        }
    } else {
        event = JSON.stringify([event]);
        $localstorageISExcess(LOCAL_STORAGE_NAME, event);
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

// 过滤器
const selectMatchItems = (lists, keyWords) => {
    let resArr = [];
    lists.filter(item => {
        if (keyWords.indexOf(item) !== -1) {
            resArr.push(item);
        }
    })
    return resArr;
}

// 获取错误日志
const collectErrLogReport = () => {
    window.onerror = (msg, url, line, col, error) => {
        // 需要过滤的字符串组
        const filterErrorArray = ['ResizeObserver loop limit exceeded'];
        let errorText = '';
        if (error && error.stack) {
            try {
                errorText = error.stack.toString();
                // 过滤掉不需要埋点的错误
                if (msg && msg !== '' && selectMatchItems(filterErrorArray, msg).length > 0) return
            } catch (e) {}
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
                frequency: 0,
            },
            timestamp: new Date().getTime(),
        };

        // 记录错误
        recordError(data, msg);
    };
};

const recordError = (data, msg) => {
    const { siteid } = defaultInfoData;
    if (errorData && errorData.length > 0) {
        errorData.map(item => {
            if (item.eventId === '100098' && item.param && item.param.msg === msg) {
                // 重复了，并且更新
                item.param['frequency'] = item.param.frequency + 1;
            }
        });
    } else {
        errorData.push(data);
    }
}

// const recordError = (data, msg) => {
//     const { siteid } = defaultInfoData;
//     $readIndexDBbase(DATA_BASE_NAME, 'siteid', siteid, dbase => {
//         let dbaseMap = dbase.filter(item => item.eventId === '100098');
//         // 默认重复
//         let isRepeat = false;
//         if (dbaseMap && dbaseMap.length > 0) {
//             dbaseMap.map(item => {
//                 if (item.eventId === '100098' && item.param && item.param.msg === msg) {
//                     // 重复了，并且更新
//                     item.param['frequency'] = item.param.frequency + 1;
//                     $updateDBbase(DATA_BASE_NAME, item);
//                 } else {
//                     // 不重复
//                     isRepeat = true;
//                 }
//             });
//             if (isRepeat) $track(data);
//         } else {
//             $track(data);
//         }
//     });
// }

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
            callback(cpuNumber);
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
    return result >= 1 ? 1 : result;
};

// 获取实时帧率
export const $FPSEfficiency = callback => {
    let lastTime = performance.now();
    let frameCount = 0,
        elapsedTime = 0;
    let loop = () => {
        let nowTime = performance.now();
        elapsedTime += nowTime - lastTime;
        lastTime = nowTime;
        frameCount++;
        if (elapsedTime >= 1000) {
            let fps = Math.round(frameCount / (elapsedTime * 0.001));
            frameCount = 0;
            elapsedTime = 0;
            callback(fps);
        }
        window.requestAnimationFrame(loop);
    };
    loop();
};

/**
    压力测试: 给予电脑性能压力
    pressure: 创建dom数，一般电脑不要超过400
*/
export const $performancePressureTest = (pressure = 100) => {
    document.body.style.overflow = 'hidden';
    for (let i = 0; i < pressure; i++) {
        let div = document.createElement('div');
        div.className = 'mover';
        div.style.background = '#fff';
        div.style.width = '200px';
        div.style.height = '170px';
        div.style.pointerEvents = 'none';
        div.style.opacity = 0.1;
        div.style.position = 'absolute';
        div.style.zIndex = '999';
        document.body.appendChild(div);
    }

    let fanFlies = (function () {
        return (
            window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function (callback) {
                window.setTimeout(callback, 1000 / 60);
            }
        );
    })();
    let movers = document.querySelectorAll('.mover');
    (function init() {
        for (let m = 0; m < movers.length; m++) {
            movers[m].style.top = m * 20 + 'px';
        }
    })();
    function update(timestamp) {
        for (let m = 0; m < movers.length; m++) {
            movers[m].style.left = (Math.sin(movers[m].offsetTop + timestamp / 1000) + 1) * 500 + 'px';
        }
        fanFlies(update);
    }
    fanFlies(update);
};

/**
    获取请求时长
    type:     fetch | script | css | xmlhttprequest | img | link
    interval: 轮询时长
    overtime: 超时多少开始记录
*/
let interfaceData = []; // 全局存储接口数据
let interfaceCount = 0; // 超过计数限额则提交埋点数据倒indexDB
export const $interfaceDuration = (type = ['fetch'], interval = 60000, overtime = 100, frequency = 10, siteId = '', callback) => {
    customizeSetInterval(requestAnimationFrameID => {
        let resource = performance.getEntriesByType('resource');
        if (resource && resource.length > 0) {
            let obj = {};
            resource = resource.reduce((cur, next) => {
                // 当超时时间大于 overtime
                if (next.duration > overtime && type.includes(next.initiatorType)) {
                    // 对url做处理
                    let urlName = '';
                    if (next.name && next.name !== '') {
                        // 如果存在?情况下，去掉?之后的内容
                        if (next.name.indexOf('?') !== -1) {
                            urlName = next.name.substring(24, next.name.indexOf('?'));
                        // 如果存在siteId情况下，去掉siteId之后的内容
                        } else if (next.name.indexOf(siteId) !== -1) {
                            urlName = next.name.substring(24, next.name.indexOf(siteId));
                        } else {
                            urlName = next.name.substring(24, next.name.length);
                        }
                    }
                    // 已经存在
                    if (!obj[urlName]) {
                        obj[urlName] = cur.push({
                            // 资源的名称
                            name: urlName,
                            // 资源加载耗时
                            duration: Math.round(next.duration),
                            // 资源大小
                            transferSize: next.transferSize,
                            // 资源所用协议
                            // protocol: next.nextHopProtocol,
                            // 次数
                            count: 1,
                        });
                    } else {
                        cur.map(item => {
                            if (item.name === urlName && item.duration > next.duration) {
                                item.duration = next.duration;
                                item.transferSize = next.transferSize;
                                item.count = item.count + 1;
                            }
                        });
                    }
                }
                return cur;
            }, []);

            if (interfaceData && interfaceData.length > 0) {
                resource.map(item => {
                    let dataIndex = interfaceData.findIndex(ftem => ftem.name === item.name);
                    if (dataIndex !== -1) {
                        if (interfaceData[dataIndex].duration > item.duration) {
                            interfaceData[dataIndex].duration = item.duration;
                            interfaceData[dataIndex].transferSize = item.transferSize;
                        }
                    } else {
                        interfaceData.push(item);
                    }
                });
            } else {
                interfaceData = resource;
            }

            interfaceCount++;
            // 清除缓冲器
            performance.clearResourceTimings();
            if (interfaceCount >= frequency) {
                interfaceCount = 0;
                moyuLog({
                    text: '埋点...请求接口数据',
                    color: '#04c160',
                    data: interfaceData,
                });
                callback(interfaceData);
            }
        }

        // // 组件diff时长记录
        // if (renderDurationData && renderDurationData.length > 0) {
        //     const { siteid } = defaultInfoData;
        //     $readIndexDBbase(DATA_BASE_NAME, 'siteid', siteid, dbase => {
        //         let dbaseMap = dbase.filter(item => item.eventId === '110073');
        //         if (dbaseMap && dbaseMap.length > 0) {
        //             dbaseMap.map(item => {
        //                 if (item && item.param && item.param.renderDurationData && item.param.renderDurationData.length > 0) {
        //                     renderDurationData = [...renderDurationData, ...item.param.renderDurationData];
        //                 }
        //
        //                 let obj = {};
        //                 renderDurationData = renderDurationData.reduce((cur, next) => {
        //                     if (!obj[next.name]) {
        //                         obj[next.name] = cur.push({
        //                             name: next.name,
        //                             type: next.type,
        //                             diff: next.diff,
        //                         })
        //                     } else {
        //                         cur.map(item => {
        //                             if (item.name === next.name && item.type === next.type) {
        //                                 item.diff = [...item.diff, ...next.diff];
        //                             }
        //                         })
        //                     }
        //                     return cur;
        //                 }, []);
        //                 $updateDBbase(DATA_BASE_NAME, { ...item, param: { renderDurationData }});
        //             });
        //         } else {
        //             $track({
        //                 eventId: '110073',
        //                 param: {
        //                     renderDurationData,
        //                 },
        //             });
        //         }
        //     });
        // }
    }, interval);
};

// 组件diff时长记录
// let renderDurationData = [];
// export const $renderDuration = (name, type, time = Date.now()) => {
//     if (renderDurationData.length > 0 && renderDurationData.filter(item => item.name === name && item.type === type).length > 0) {
//         renderDurationData.map(item => {
//             if (item.name === name && item.type === type) {
//                 let temp = time - item.time;
//                 item.diff.push(temp);
//                 item.time = time;
//             }
//         });
//     } else {
//         renderDurationData.push({ name, time, type, diff: [] });
//     }
//     // moyuLog({
//     //     text: '埋点...组件执行时间',
//     //     color: '#04c160',
//     //     data: renderDurationData,
//     // });
// }

export const $localstorageISExcess = (key, value) => {
    try {
        let size = 0;
        let isCopies = false;
        const max = 5120;
        for (let item in window.localStorage) {
            if (window.localStorage.hasOwnProperty(item)) {
                // 判断存在复写情况
                if (item === key) {
                    size += value.length;
                    isCopies = true;
                } else {
                    size += window.localStorage.getItem(item).length;
                }
            }
        }
        let valueLneth = isCopies ? 0 : value.length;
        let bytes = parseInt(((size + valueLneth) / 1024).toFixed(2));
        if (bytes >= max) {
            moyuLog({
                text: 'localStorage存储单元已超出限额...',
                color: '#d16770',
                data: `${bytes}KB`,
            });
            localStorage.removeItem(LOCAL_STORAGE_NAME);
        } else {
            window.localStorage.setItem(key, value);
        }
    } catch (e) {
        moyuLog({
            text: 'localStorage存储单元已超出限额...',
            color: '#d16770',
        });
        localStorage.removeItem(LOCAL_STORAGE_NAME);
    }
}
