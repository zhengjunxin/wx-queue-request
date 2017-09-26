# wx-queue-request

[![Build Status](https://travis-ci.org/zhengjunxin/wx-queue-request.svg?branch=master)](https://travis-ci.org/zhengjunxin/wx-queue-request)

管理微信小程序 `wx.request` 方法的并发数，解决请求数大于 10 时，直接不请求的问题。如果需要 `wx.request` 方法支持 Promise，可以使用 [wx-promise-request](https://github.com/zhengjunxin/wx-promise-request) 库哦。

## 下载

由于小程序不支持 npm，所以直接右键保存 [index.js](https://zhengjunxin.github.io/wx-queue-request/dist/index.js) 文件即可。

## 使用

在 app.js 引入并执行即可

```js
import { queue } from './wx-queue-request'
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

## API

### `queue([concurrency])`

直接对全局的 `wx.request` 进行封装，调用后 `wx.request` 即会管理队列。并发数默认为 10。

``` javascript
import { queue } from './wx-queue-request'
queue(5) // 指定并发数为 5

wx.request({url: 'test.php'})
```

### `queueRequest(request, [concurrency])`

对指定请求函数进行封装，返回被管理队列的函数，并发数 concurrency 默认为 10。

``` javascript
import { queueRequest } from './wx-queue-request'

export default queueRequest(wx.request, 10)
```

## License

MIT
