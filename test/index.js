import test from 'ava'
import { queueRequest } from '../src/index'

test.cb('并发数控制', t => {
    const result = []

    const request = (options) => setTimeout(() => {
        options.complete()
    }, 32)

    const queuedRequest = queueRequest(request, 2)
    queuedRequest({
        complete() {
            result.push(1)
        }
    })
    queuedRequest({
        complete() {
            result.push(2)
        }
    })
    queuedRequest({
        complete() {
            result.push(3)
        }
    })

    t.deepEqual(result, [])

    setTimeout(() => {
        setTimeout(() => {
            t.deepEqual(result, [1, 2])
            setTimeout(() => {
                t.deepEqual(result, [1, 2, 3])
                t.end()
            }, 32)
        }, 32)
    }, 0)
})

test.cb('最高并发数控制', t => {
    const result = []

    const request = (options) => {
        result.push(0)
        setTimeout(() => {
            options.complete()
        }, 32)
    }

    const queuedRequest = queueRequest(request, 2)

    queuedRequest({
        complete() {
            result.push(1)
        }
    })

    t.deepEqual(result, [])

    setTimeout(() => {
        t.deepEqual(result, [0])
        
        setTimeout(() => {
            t.deepEqual(result, [0, 1])

            queuedRequest({
                complete() {
                    result.push(2)
                }
            })

            queuedRequest({
                complete() {
                    result.push(3)
                }
            })

            setTimeout(() => {
                t.deepEqual(result, [0, 1, 0, 0])
                t.end()
            }, 0)
        }, 32)
    }, 0)
})
