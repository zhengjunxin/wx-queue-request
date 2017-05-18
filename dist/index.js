(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.queue = factory());
}(this, (function () { 'use strict';

class Queue {
    constructor(worker, concurrency = 1) {
        this.worker = worker;
        this.concurrency = concurrency;
        this.running = 0;
        this.tasks = [];
    }
    push(action) {
        this.tasks.push(action);
        this.run();
    }
    run() {
        const { running, concurrency, tasks, worker } = this;

        if (running < concurrency && tasks.length) {
            const task = tasks.shift();
            this.running++;
            worker(task, () => {
                this.running--;
                this.run();
            });
        }
    }
}

const queue = new Queue((task, callback) => task(callback), 10);

function queueRequest() {
    const request = wx.request;

    Object.defineProperty(wx, 'request', {
        get() {
            return obj => {
                queue.push(callback => {
                    const originComplete = obj.complete;
                    obj.complete = (...args) => {
                        callback();
                        if (typeof originComplete === 'function') {
                            originComplete(...args);
                        }
                    };
                    request(obj);
                });
            };
        }
    });
}

var index = {
    queueRequest
};

return index;

})));
