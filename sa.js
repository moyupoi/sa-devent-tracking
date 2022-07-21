import { $initDBbase, $removeDBbase, $readDBbase, $addDBbase, $updateDBbase, $getAllDBbase, $clearDBbase, $deleteDBbase, $readIndexDBbase } from './indexDB';
// 数据库名称
const DATA_BASE_NAME = 'saTrackDBbase';
const LOCAL_STORAGE_NAME = 'saTempData';
let CLIENT_URL = '';
let initStart = true;
let defaultInfoData = false;
let localStorage = window.localStorage;

/**
  外部调用函数
  初始化函数: $saInit()
  赋值默认信息: $setDefaultInfo()
  埋点地爱用: $track()
*/

// 埋点初始化函数
export const $saInit = (url, interval = 10000) => {
    if (initStart) {
        // 防止重复调用
        initStart = false;
        // 赋值URL
        CLIENT_URL = url;
        // 打开数据库
        $initDBbase(DATA_BASE_NAME, true, 1, db => {
            console.log('埋点...初始化完成...');
            // 开始执行轮询
            initSetInterval(interval);
        });
    };
};

// 注入默认信息
export const $setDefaultInfo = params => (defaultInfoData = Object.assign({ ...defaultInfoData, ...params }));

// 外部调用
export const $track = event => {
    // 判断初始化默认数据中是否有值
    if (defaultInfoData) {
        const data = {
            ...defaultInfoData,
            ...event,
            timestamp: new Date().getTime(),
        };
        $addDBbase(DATA_BASE_NAME, data).then(res => {
            if (res) {
                console.log('埋点...点击埋点成功！', res);
            } else {
                console.log('埋点...点击埋点失败！');
            };
        });
    } else {
        // 如果没有默认值，则把数据存到临时Storage中
        setTemporaryStorage(event);
    };
};

// 轮询函数
const initSetInterval = interval => {
    // 轮询 调接口pull数据
    customizeSetInterval(requestAnimationFrameID => {
        const { siteid } = defaultInfoData;
        $readIndexDBbase(DATA_BASE_NAME, 'siteid', siteid, data => {
            if (data && data.length > 0) {
                console.log('埋点...索引读取成功...', data);
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
        headers: { 'Content-Type': 'application/json' },
    }).then(res => res.json()).then(res => {
        if (res && res.code === 200) {
            console.log('埋点...数据请求成功...');
            if (isLocalStorage) {
                // 销毁Storage中的数据
                localStorage.removeItem(LOCAL_STORAGE_NAME);
                console.log('埋点...销毁Storage中数据成功...')
            } else {
                // 销毁indexDB中的数据
                saDataDestroy();
            }
        } else {
            data = JSON.stringify(data);
            console.log(`埋点...销毁indexDB数据未成功...数据为${data}`);
        }
    });
};

// 没有初始化时把埋点放到localStorage中
const setTemporaryStorage = event => {
    let record = localStorage.getItem(LOCAL_STORAGE_NAME);
    event = { ...event, timestamp: new Date().getTime() };
    if (record && isJSONString(record)) {
        record = JSON.parse(record);
        if (record && record.length > 0) {
            record.push(event);
            record = JSON.stringify(record);
            localStorage.setItem(LOCAL_STORAGE_NAME, record);
        };
    } else {
        event = JSON.stringify([event]);
        localStorage.setItem(LOCAL_STORAGE_NAME, event);
    };
};

// 销毁数据库存的埋点
const saDataDestroy = () => {
    $clearDBbase(DATA_BASE_NAME);
    console.log('埋点...indexDB中的数据销毁完毕...');
};

const isJSONString = params => {
    if (typeof params == 'string' && params && params !== '') {
        try {
            if (typeof JSON.parse(params) === 'object') {
                return true;
            };
        } catch (e) {};
    };
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
        };
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
            console.log('埋点...上报storage中临时数据...');
        };
    };
};
