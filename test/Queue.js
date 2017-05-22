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
    }

    createClass(Queue, [{
        key: 'bulk',
        value: function bulk() {
            var _this2 = this;

            if (this._workers.length) {
                setTimeout(function () {
                    _this2.process();
                }, 0);
            } else {
                this._drain();
            }
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
            this.bulk();
        }
    }, {
        key: 'process',
        value: function process() {
            var _this4 = this;

            var _loop = function _loop() {
                var worker = _this4._workers.shift();

                _this4._workersList.push(worker);
                if (_this4._workers.length === 0 && typeof _this4.empty === 'function') {
                    _this4.empty();
                }
                if (_this4._workersList.length === _this4._concurrency && typeof _this4.saturated === 'function') {
                    _this4.saturated();
                }

                _this4.queue(worker.task, onlyOnce(function () {
                    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                        args[_key] = arguments[_key];
                    }

                    _this4.pull(worker);

                    if (args && args[0] && args[0] instanceof Error && typeof _this4.error === 'function') {
                        _this4.error.apply(_this4, args.concat([worker.task]));
                    }
                    if (typeof worker.callback === 'function') {
                        worker.callback.apply(worker, args);
                    }
                    if (_this4._workersList.length <= _this4._concurrency - _this4.buffer && typeof _this4.unsaturated === 'function') {
                        _this4.unsaturated();
                    }
                    _this4._drain();
                    _this4.process();
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
        key: 'unshift',
        value: function unshift(task, callback) {
            var _this5 = this;

            this._idle = false;
            var tasks = Array.isArray(task) ? task : [task];
            tasks.forEach(function (t) {
                var worker = { task: t, callback: callback };
                checkCallback(worker);
                _this5._workers.unshift(worker);
            });
            this.bulk();
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
