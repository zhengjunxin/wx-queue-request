const checkConcurrency = (concurrency = 1) => {
    if (concurrency == null) {
        concurrency = 1
    }
    else if (concurrency === 0) {
        throw new Error('Concurrency must not be zero')
    }
    return concurrency
}

export default class Queue {
    constructor(worker, concurrency = 1) {
        this.worker = worker
        this.concurrency = checkConcurrency(concurrency)
        this.running = 0
        this.tasks = []
    }
    push(action) {
        this.tasks.push(action)
        this.run()
    }
    run() {
        const {running, concurrency, tasks, worker} = this

        if (running < concurrency && tasks.length) {
            const task = tasks.shift()
            this.running++
            worker(task, () => {
                this.running--
                this.run()
            })
        }
    }
}
