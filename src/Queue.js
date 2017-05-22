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
        this._concurrency = checkConcurrency(concurrency)
        this.buffer = this._concurrency / 4

        Object.defineProperties(this, {
            'concurrency': {
                get: () => {
                    return this._concurrency
                },
                set: (value) => {
                    this._concurrency = value
                    this.buffer = this._concurrency / 4
                    this.bulk()
                }
            },
            'started': {
                get: () => {
                    return !this.idle()
                }
            }
        })
        this._workers = []
        this._workersList = []
        this._idle = true
        this.paused = false
        this.enableDrain = true
    }
    bulk() {
        if (this._workers.length) {
            setTimeout(() => {
                this.process()
            }, 0)
        }
        else {
            this._drain()
        }
    }
    push(task, callback) {
        this._idle = false
        const tasks = Array.isArray(task) ? task : [task]
        tasks.forEach(t => {
            const worker = {task: t, callback}
            checkCallback(worker)
            this._workers.push(worker)
        })
        this.bulk()
    }
    process() {
        while (!this.paused && this.concurrency > this._workersList.length && this._workers.length) {
            const worker = this._workers.shift()

            this._workersList.push(worker)
            if (this._workers.length === 0 && typeof this.empty === 'function') {
                this.empty()
            }
            if (this._workersList.length === this._concurrency && typeof this.saturated === 'function') {
                this.saturated()
            }

            this.queue(worker.task, onlyOnce((...args) => {
                this.pull(worker)

                if (args && args[0] && args[0] instanceof Error && typeof this.error === 'function') {
                    this.error(...args, worker.task)
                }
                if (typeof worker.callback === 'function') {
                    worker.callback(...args)
                }
                if (this._workersList.length <= this._concurrency - this.buffer && typeof this.unsaturated === 'function') {
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
    unshift(task, callback) {
        this._idle = false
        const tasks = Array.isArray(task) ? task : [task]
        tasks.forEach(t => {
            const worker = {task: t, callback}
            checkCallback(worker)
            this._workers.unshift(worker)
        })
        this.bulk()
    }
    idle() {
        return this._idle
    }
    pause() {
        this.paused = true
    }
    resume() {
        this.paused = false

        this.bulk()
    }
    kill() {
        this.enableDrain = false
        this._workers.length = 0
        this._idle = true
    }
    _drain() {
        if (this._workersList.length === 0 && this._workers.length === 0 && typeof this.drain === 'function') {
            this._idle = true
            if (this.enableDrain) {
                this.drain()
            }
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
