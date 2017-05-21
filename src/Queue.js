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
        
        this.bulk()
    }
    bulk() {
        setTimeout(() => {
            const bulkNum = Math.min(this._concurrency, this._workers.length)
            if (bulkNum) {
                for (let i = 0; i < bulkNum; i++) {
                    this.next()
                }
            }
            else {
                this._drain()
            }
        }, 0)
    }
    run(worker) {
        function done(...args) {
            if (done.called) {
                throw new Error('Callback was already called')
            }
            done.called = true
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
            this.next()
        }
        this.queue(worker.task, done.bind(this))
    }
    push(task, callback) {
        this._idle = false
        const tasks = Array.isArray(task) ? task : [task]
        tasks.forEach(t => {
            const worker = {task: t, callback}
            checkCallback(worker)
            this._workers.push(worker)
        })
    }
    next() {
        if (!this.paused && this.concurrency > this._workersList.length && this._workers.length) {
            const worker = this._workers.shift()

            if (worker) {
                this._workersList.push(worker)
                if (this._workers.length === 0 && typeof this.empty === 'function') {
                    this.empty()
                }
                if (this._workersList.length === this._concurrency && typeof this.saturated === 'function') {
                    this.saturated()
                }
                this.run(worker)
            }
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
