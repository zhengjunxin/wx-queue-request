import Queue from './Queue'

const q = new Queue((task, callback) => task(callback), 10)

function queueRequest(request) {
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

function queue() {
    const request = wx.request

    Object.defineProperty(wx, 'request', {
        get() {
            return queueRequest(request)
        }
    })
}

export default {
    queueRequest,
    queue,
}
