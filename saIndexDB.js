import { $initDBbase, $removeDBbase, $readDBbase, $addDBbase, $updateDBbase, $getAllDBbase, $clearDBbase, $deleteDBbase } from './indexDB';
const DATA_BASE_NAME = 'saTrackDBbase';
let initStart = true;

export const $saInit = (event, interval = 10000) => {
    if (initStart) {
      initStart = false
      $initDBbase(DATA_BASE_NAME, false, 1, db => {
          $readDBbase(DATA_BASE_NAME, 'erpparam', data => {
              // 数据库读取成功！
              if (!data) {
                data = {
                    defaults: Object.assign(event, {
                        electronVersion: window.electronVersion,
                    }),
                    queueArray: [],
                };
                $updateDBbase(DATA_BASE_NAME, { name: 'erpparam', sa: data });
              }
              initSetInterval(data, event, interval);
          });
      });
    };
};

function initSetInterval(data, event, interval) {
    // 轮询
    $customizeSetInterval(timer => {
        // 读取数据库
        $readDBbase(DATA_BASE_NAME, 'erpparam', data => {
            if (data && data.sa && data.sa.queueArray.length > 0) {
                let tempData = data.sa.queueArray
                $saDataDestroy(data)

                // 模拟请求 投喂数据(请求)
                if (true) {
                  console.log('埋点...已成功上报！', tempData);
                } else {
                  // 如果失败了
                  $readDBbase(DATA_BASE_NAME, 'erpparam', data => {
                    // 如上报失败，则回填临时data
                    if (data && data.sa && data.sa.queueArray && data.sa.queueArray.length > 0) {
                      data = [...data.sa.queueArray, ...tempData]
                    } else {
                      // 当前无新数据，则赋值
                      data.sa.queueArray = tempData
                      $updateDBbase(DATA_BASE_NAME, { name: 'erpparam', sa: data });
                    }
                    tempData = []
                  })
                }
            }
        });
    }, interval);
}

export const $track = event => {
    // 读取数据库
    $readDBbase(DATA_BASE_NAME, 'erpparam', data => {
        if (data && data.sa && data.sa.queueArray) {
            data.sa.queueArray.push({
                defaults: data.sa.defaults,
                event: Object.assign(event, { timestamp: new Date().getTime() }),
            });
            console.log('埋点...点击', data.sa)
            $updateDBbase(DATA_BASE_NAME, { name: 'erpparam', sa: data.sa });
        }
    });
};

function $customizeSetInterval(callback, interval) {
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
}

export const $saDataDestroy = (data) => {
    data.sa.queueArray = [];
    $updateDBbase(DATA_BASE_NAME, { name: 'erpparam', sa: data.sa });
}
