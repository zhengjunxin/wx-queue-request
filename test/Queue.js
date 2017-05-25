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

var onlyOnce = function onlyOnce(fn) {
    return function () {
        if (fn === null) {
            throw new Error('Callback was already called');
        }
        var callFn = fn;
        fn = null;
        return callFn.apply(undefined, arguments);
    };
};

var Queue = function () {
    function Queue(queue, concurrency) {
        classCallCheck(this, Queue);

        this.queue = queue;
        this.concurrency = checkConcurrency(concurrency);
        this.buffer = this.concurrency / 4;

        this._workers = [];
        this._workersList = [];
        this.paused = false;
        this.enableDrain = true;
        this.started = false;
    }

    createClass(Queue, [{
        key: 'push',
        value: function push(task, callback) {
            this.insert(task, callback, true);
        }
    }, {
        key: 'unshift',
        value: function unshift(task, callback) {
            this.insert(task, callback, false);
        }
    }, {
        key: 'insert',
        value: function insert(task, callback, isPush) {
            var _this = this;

            this.started = true;
            var tasks = Array.isArray(task) ? task : [task];
            for (var i = 0; i < tasks.length; i++) {
                var worker = {
                    task: tasks[i],
                    callback: callback
                };
                checkCallback(worker);
                if (isPush) {
                    this._workers.push(worker);
                } else {
                    this._workers.unshift(worker);
                }
            }
            if (this._workers.length) {
                setTimeout(function () {
                    _this.process();
                }, 0);
            } else {
                this._drain();
            }
        }
    }, {
        key: 'process',
        value: function process() {
            var _this2 = this;

            var _loop = function _loop() {
                var worker = _this2._workers.shift();

                _this2._workersList.push(worker);
                if (_this2._workers.length === 0 && typeof _this2.empty === 'function') {
                    _this2.empty();
                }
                if (_this2._workersList.length === _this2.concurrency && typeof _this2.saturated === 'function') {
                    _this2.saturated();
                }

                _this2.queue(worker.task, onlyOnce(function () {
                    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                        args[_key] = arguments[_key];
                    }

                    _this2.pull(worker);

                    if (args[0] && typeof _this2.error === 'function') {
                        _this2.error.apply(_this2, args.concat([worker.task]));
                    }
                    if (typeof worker.callback === 'function') {
                        worker.callback.apply(worker, args);
                    }
                    if (_this2._workersList.length <= _this2.concurrency - _this2.buffer && typeof _this2.unsaturated === 'function') {
                        _this2.unsaturated();
                    }
                    _this2._drain();
                    _this2.process();
                }));
            };

            while (!this.paused && this.concurrency > this._workersList.length && this._workers.length) {
                _loop();
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
        key: 'idle',
        value: function idle() {
            return this._workers.length === 0 && this._workersList.length === 0;
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

            this.process();
        }
    }, {
        key: 'kill',
        value: function kill() {
            this.enableDrain = false;
            this._workers.length = 0;
        }
    }, {
        key: '_drain',
        value: function _drain() {
            var _workersList = this._workersList,
                _workers = this._workers,
                drain = this.drain,
                enableDrain = this.enableDrain;


            if (_workersList.length === 0 && _workers.length === 0 && enableDrain && typeof drain === 'function') {
                this.drain();
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
