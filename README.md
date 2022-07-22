# 埋点脚本

### 安装脚本
```
$ npm i sa-event-tracking
or
$ yarn add sa-event-tracking
```

##### 引用插件--
```js
import { $saInit } from 'sa-event-tracking'
```

##### 初始化加载脚本:
```js
  // 调用初始化埋点函数
  const getURL = '上报接口地址'
  $saInit(getURL, 10000);
```

##### 开始埋点:
```js
import { $track } from 'sa-event-tracking'
$track({
    eventId: "10110",
    param: {}
})
```

##### 参数说明:
```
    {
      "eventId": "110001",
      "param": {
          "isSavePwd": 1,
          "status": "在线"
      },
      "timestamp": 1658372690231,
      "userid": "uxy_xxx_xxxxxx",
      "siteid": "uxy_xxx",
      "userName": "name",
      "electronVersion": "",
      "clientVersion": "9.9.1",
      "username": "name"
    }
```
###### 更多配置参考: github.com/moyupoi/sa-devent-tracking
