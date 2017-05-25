const checkConcurrency = (concurrency = 1) => {
    if (concurrency == null) {
        concurrency = 1
    }
    else if (concurrency === 0) {
        throw new Error('Concurrency must not be zero')
    }
    return concurrency
}

const checkCallback = (worker) => {
    if (worker.callback != null && typeof worker.callback !== 'function') {
        throw new Error('task callback must be a function')
    }
}

const onlyOnce = (fn) => (...args) => {
    if (fn === null) {
        throw new Error('Callback was already called')
    }
    const callFn = fn
    fn = null
    return callFn(...args)
}

class Queue {
    constructor(queue, concurrency) {
        this.queue = queue
        this.concurrency = checkConcurrency(concurrency)
        this.buffer = this.concurrency / 4

        this._workers = []
        this._workersList = []
        this.paused = false
        this.enableDrain = true
        this.started = false
    }
    push(task, callback) {
        this.insert(task, callback, true)
    }
    unshift(task, callback) {
        this.insert(task, callback, false)
    }
    insert(task, callback, isPush) {
        this.started = true
        const tasks = Array.isArray(task) ? task : [task]
        for (let i = 0; i < tasks.length; i++) {
            const worker = {
                task: tasks[i],
                callback
            }
            checkCallback(worker)
            if (isPush) {
                this._workers.push(worker)
            }
            else {
                this._workers.unshift(worker)
            }
        }
        if (this._workers.length) {
            setTimeout(() => {
                this.process()
            }, 0)
        }
        else {
            this._drain()
        }
    }
    process() {
        while (!this.paused && this.concurrency > this._workersList.length && this._workers.length) {
            const worker = this._workers.shift()

            this._workersList.push(worker)
            if (this._workers.length === 0 && typeof this.empty === 'function') {
                this.empty()
            }
            if (this._workersList.length === this.concurrency && typeof this.saturated === 'function') {
                this.saturated()
            }

            this.queue(worker.task, onlyOnce((...args) => {
                this.pull(worker)

                if (args[0] && typeof this.error === 'function') {
                    this.error(...args, worker.task)
                }
                if (typeof worker.callback === 'function') {
                    worker.callback(...args)
                }
                if (this._workersList.length <= this.concurrency - this.buffer && typeof this.unsaturated === 'function') {
                    this.unsaturated()
                }
                this._drain()
                this.process()
            }))
        }
    }
    length() {
        return this._workers.length
    }
    workersList() {
        return this._workersList
    }
    pull(worker) {
        const index = this._workersList.indexOf(worker)
        if (index !== -1) {
            this._workersList.splice(index, 1)
        }
    }
    running() {
        return this._workersList.length
    }
    idle() {
        return this._workers.length === 0 && this._workersList.length === 0
    }
    pause() {
        this.paused = true
    }
    resume() {
        this.paused = false

        this.process()
    }
    kill() {
        this.enableDrain = false
        this._workers.length = 0
    }
    _drain() {
        const {_workersList, _workers, drain, enableDrain} = this

        if (_workersList.length === 0 && _workers.length === 0 && enableDrain && typeof drain === 'function') {
            this.drain()
        }
    }
    remove(callback) {
        this._workers = this._workers.filter((worker, index) => {
            const node = {data: worker.task, priority: index}
            return !callback(node)
        })
    }
}

export default Queue
