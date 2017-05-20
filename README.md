# wx-queue-request
管理微信小程序 wx.request 方法的并发数。

## 下载
由于小程序不支持 npm，所以直接右键保存 [index.js](https://joezheng2015.github.io/wx-queue-request/dist/index.js) 文件即可。

## 使用
在 app.js 引入并执行即可

``` javascript
import {queue} from './wx-queue-request';
queue()

// 因为请求队列被管理
// 即使并发请求数超过 10 也不会报错了
wx.request({url: 'test.php'})
wx.request({url: 'test.php'})
wx.request({url: 'test.php'})
wx.request({url: 'test.php'})
wx.request({url: 'test.php'})
wx.request({url: 'test.php'})
wx.request({url: 'test.php'})
wx.request({url: 'test.php'})
wx.request({url: 'test.php'})
wx.request({url: 'test.php'})
wx.request({url: 'test.php'})
```
## License
MIT
