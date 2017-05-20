import Queue from './Queue'

const queue = new Queue((task, callback) => task(callback), 10)

function queueRequest() {
    return (obj) => {
        queue.push((callback) => {
            const originComplete = obj.complete
            obj.complete = (...args) => {
                callback()
                if (typeof originComplete === 'function') {
                    originComplete(...args)
                }
            }
            wx.request(obj)
        })
    }
}

export default {
    queueRequest,
}
