import Queue from './Queue'

function queueRequest(request, concurrency = 10) {
    if (typeof request !== 'function') {
        throw Error('request must be function')
    }
    const q = new Queue((task, callback) => task(callback), concurrency)

    return (obj) => {
        q.push((callback) => {
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

function queue(concurrency) {
    const request = wx.request

    Object.defineProperty(wx, 'request', {
        get() {
            return queueRequest(request, concurrency)
        }
    })
}

export {
    queueRequest,
    queue,
}
