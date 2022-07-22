# 埋点脚本

##### 特色功能
```
  1、事件埋点
  2、注入默认信息
  3、初始化后获取UA(自动获取)
  {
    browser: "Chrome 103.0.0.0"
    cpu: ""
    os: "Mac OS 10.15.7"
  }
  4、监听错误日子并上传
  5、页面加载性能指标

```

### 安装脚本
```
$ npm i sa-event-tracking
or
$ yarn add sa-event-tracking
```

##### 1.初始化加载脚本:
```js
  import { $saInit } from 'sa-event-tracking'
  // 调用初始化埋点函数
  const getURL = '上报接口地址'
  $saInit(getURL, 10000);
```

##### 2.注入默认信息:
```js
  import { $setDefaultInfo } from 'sa-event-tracking'
  $setDefaultInfo({ username: 'xxx', userid: 'xxx', siteid: 'xxx' });
```

##### 3.开始埋点:
```js
  import { $track } from 'sa-event-tracking'
  $track({
      eventId: "10110",
      param: {}
  })
```

##### 4.页面加载性能指标:
```
  {name: 'DNS查询耗时', value: '0ms'}
  {name: 'TCP链接耗时', value: '0ms'}
  {name: '网络请求耗时(TTFB)', value: '3ms'}
  {name: 'request请求耗时', value: '0ms'}
  {name: '解析dom树耗时', value: '1272ms'}
  {name: '白屏时间', value: '15ms'}
  {name: 'js脚本执行时间', value: '0ms'}
  {name: '首屏渲染时间', value: '1464ms'}
  {name: '首次有内容渲染时间', value: '1512ms'}
  {name: '页面完全加载时间', value: '1481ms'}
  {name: '资源加载耗时', value: '179ms'}
  {name: '重定向次数', value: '0次'}
  {name: '重定向耗时', value: '0ms'}
  {name: '内存大小的限制', value: '4095.75 MB'}
  {name: '已分配大小', value: '243.31 MB'}
  {name: '当前JS活跃内存大小', value: '219.19 MB'}
```
```js
  import { $initializationDetection } from 'sa-event-tracking';
  $initializationDetection();
```

##### 参数说明:
```
  [{
      "userid":"uxy_1000_xxxxxxxxx",
      "siteid":"uxy_1000",
      "username":"lcc",
      "electronVersion":"",
      "clientVersion":"9.9.2",
      "eventId":"100015",
      "param":{
          "type":"最近联系人"
      },
      "system":{
          "cpu":"",
          "browser":"Chrome 103.0.0.0",
          "os":"Mac OS 10.15.7"
      },
      "timestamp":1658482652052,
      "id":350
  }]
```
###### 更多配置参考: github.com/moyupoi/sa-devent-tracking
