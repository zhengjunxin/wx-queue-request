import Queue from './Queue'

const queue = new Queue((task, callback) => task(callback), 10)

function queueRequest() {
    const request = wx.request

    Object.defineProperty(wx, 'request', {
        get() {
            return (obj) => {
                queue.push((callback) => {
                    const originComplete = obj.complete
                    obj.complete = (...args) => {
                        callback()
                        if (typeof originComplete === 'function') {
                            originComplete(...args)
                        }
                    }
                    request(obj)
                })
            }
        }
    })
}

export default {
    queueRequest,
}
