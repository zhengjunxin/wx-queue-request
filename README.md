# wx-queue-request
管理微信小程序 wx.request 方法的并发数。

## 下载
由于小程序不支持 npm，所以直接右键保存 [index.js](https://joezheng2015.github.io/wx-queue-request/dist/index.js) 文件即可。

## 使用
``` javascript
import {queueRequest} from './wx-queue-request';

// 返回的 reqeust 函数是对 wx.request 方法的封装
// 保证最大并发请求数为 10
const request = queueRequest()
const fetchData = () => request({
  url: 'test.php',
  data: {
    x: '',
    y: '',
  },
  header: {
    'content-type': 'application/json',
  },
})

// 即使连续调用 fetchData 超过 10 次，也能正常请求
fetchData()
```
## License
MIT
