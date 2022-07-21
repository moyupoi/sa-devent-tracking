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
// 获取用户信息
const { siteId, userId, username } = loginUserProxy();
// 调用初始化埋点函数
// isFetch 是模拟请求 true || false
$saInit({
    siteId,
    userId,
    username,
    clientVersion: version,
}, 10000, isFetch); // (初始化参数, 上报间隔时间)
```

##### 开始埋点:
```js
import { $track } from 'sa-event-tracking'
$track({
    eventId: "10110",
    param: "{}"
})
```

##### 参数说明:
```
{
    "defaults": {       
        "siteId": "kf_90001",
        "userId": "用户ID",
        "username": "用户名称",
        "clientVersion": "项目版本号",
        "electronVersion": "electron版本号",
    },
    "event": {
        "timestamp": "毫秒数",
        "eventId": "10110",
        "param": "{}"
    }
}
```
###### 更多配置参考: github.com/moyupoi/sa-devent-tracking
