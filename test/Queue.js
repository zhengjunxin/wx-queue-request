(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.Queue = factory());
}(this, (function () { 'use strict';

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

var checkConcurrency = function checkConcurrency() {
    var concurrency = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;

    if (concurrency == null) {
        concurrency = 1;
    } else if (concurrency === 0) {
        throw new Error('Concurrency must not be zero');
    }
    return concurrency;
};

var checkCallback = function checkCallback(worker) {
    if (worker.callback != null && typeof worker.callback !== 'function') {
        throw new Error('task callback must be a function');
    }
};

var Queue = function () {
    function Queue(queue, concurrency) {
        var _this = this;

        classCallCheck(this, Queue);

        this.queue = queue;
        this._concurrency = checkConcurrency(concurrency);
        this.buffer = this._concurrency / 4;

        Object.defineProperties(this, {
            'concurrency': {
                get: function get$$1() {
                    return _this._concurrency;
                },
                set: function set$$1(value) {
                    _this._concurrency = value;
                    _this.buffer = _this._concurrency / 4;
                    _this.bulk();
                }
            },
            'started': {
                get: function get$$1() {
                    return !_this.idle();
                }
            }
        });
        this._workers = [];
        this._workersList = [];
        this._idle = true;
        this.paused = false;
        this.enableDrain = true;

        this.bulk();
    }

    createClass(Queue, [{
        key: 'bulk',
        value: function bulk() {
            var _this2 = this;

            setTimeout(function () {
                var bulkNum = Math.min(_this2._concurrency, _this2._workers.length);
                if (bulkNum) {
                    for (var i = 0; i < bulkNum; i++) {
                        _this2.next();
                    }
                } else {
                    _this2._drain();
                }
            }, 0);
        }
    }, {
        key: 'run',
        value: function run(worker) {
            function done() {
                if (done.called) {
                    throw new Error('Callback was already called');
                }
                done.called = true;
                this.pull(worker);

                for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                    args[_key] = arguments[_key];
                }

                if (args && args[0] && args[0] instanceof Error && typeof this.error === 'function') {
                    this.error.apply(this, args.concat([worker.task]));
                }
                if (typeof worker.callback === 'function') {
                    worker.callback.apply(worker, args);
                }
                if (this._workersList.length <= this._concurrency - this.buffer && typeof this.unsaturated === 'function') {
                    this.unsaturated();
                }
                this._drain();
                this.next();
            }
            this.queue(worker.task, done.bind(this));
        }
    }, {
        key: 'push',
        value: function push(task, callback) {
            var _this3 = this;

            this._idle = false;
            var tasks = Array.isArray(task) ? task : [task];
            tasks.forEach(function (t) {
                var worker = { task: t, callback: callback };
                checkCallback(worker);
                _this3._workers.push(worker);
            });
        }
    }, {
        key: 'next',
        value: function next() {
            if (!this.paused && this.concurrency > this._workersList.length && this._workers.length) {
                var worker = this._workers.shift();

                if (worker) {
                    this._workersList.push(worker);
                    if (this._workers.length === 0 && typeof this.empty === 'function') {
                        this.empty();
                    }
                    if (this._workersList.length === this._concurrency && typeof this.saturated === 'function') {
                        this.saturated();
                    }
                    this.run(worker);
                }
            }
        }
    }, {
        key: 'length',
        value: function length() {
            return this._workers.length;
        }
    }, {
        key: 'workersList',
        value: function workersList() {
            return this._workersList;
        }
    }, {
        key: 'pull',
        value: function pull(worker) {
            var index = this._workersList.indexOf(worker);
            if (index !== -1) {
                this._workersList.splice(index, 1);
            }
        }
    }, {
        key: 'running',
        value: function running() {
            return this._workersList.length;
        }
    }, {
        key: 'unshift',
        value: function unshift(task, callback) {
            var _this4 = this;

            this._idle = false;
            var tasks = Array.isArray(task) ? task : [task];
            tasks.forEach(function (t) {
                var worker = { task: t, callback: callback };
                checkCallback(worker);
                _this4._workers.unshift(worker);
            });
        }
    }, {
        key: 'idle',
        value: function idle() {
            return this._idle;
        }
    }, {
        key: 'pause',
        value: function pause() {
            this.paused = true;
        }
    }, {
        key: 'resume',
        value: function resume() {
            this.paused = false;

            this.bulk();
        }
    }, {
        key: 'kill',
        value: function kill() {
            this.enableDrain = false;
            this._workers.length = 0;
            this._idle = true;
        }
    }, {
        key: '_drain',
        value: function _drain() {
            if (this._workersList.length === 0 && this._workers.length === 0 && typeof this.drain === 'function') {
                this._idle = true;
                if (this.enableDrain) {
                    this.drain();
                }
            }
        }
    }, {
        key: 'remove',
        value: function remove(callback) {
            this._workers = this._workers.filter(function (worker, index) {
                var node = { data: worker.task, priority: index };
                return !callback(node);
            });
        }
    }]);
    return Queue;
}();

return Queue;

})));
