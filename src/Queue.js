const checkConcurrency = (concurrency = 1) => {
    if (concurrency == null) {
        concurrency = 1
    }
    else if (concurrency === 0) {
        throw new Error('Concurrency must not be zero')
    }
    return concurrency
}

const onlyOnce = (fn) => (...args) => {
    if (fn === null) {
        throw new Error('Callback was already called')
    }
    const callFn = fn
    fn = null
    return callFn(...args)
}

export default function queue(callback, concurrency) {
    checkConcurrency(concurrency)

    // 待处理的队列
    let workers = []
    // 正在处理的队列
    const workerList = []

    return {
        concurrency,
        push(task, callback) {
            workers.push({
                task,
                callback,
            })
            setTimeout(() => {
                this.process()
            }, 0)
        },
        process() {
            while (this.concurrency > workerList.length && workers.length) {
                const worker = workers.shift()
                workerList.push(worker)
                callback(worker.task, onlyOnce((...args) => {
                    this.pull(worker)
                    if (typeof worker.callback === 'function') {
                        worker.callback(...args)
                    }
                    this.process()
                }))
            }
        },
        pull(worker) {
            const index = workerList.indexOf(worker)
            if (index !== -1) {
                workerList.splice(index, 1)
            }
        }
    }
}
 