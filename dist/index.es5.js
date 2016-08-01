'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

module.exports = timerlog;

var options_storage = {};

var PROJECT_NAME = 'timerlog';

var ERROR_PREFIX = PROJECT_NAME + ': ';

function timerlog(message) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    options = process_options(message, options);
    message = undefined;

    Object.keys(options).forEach(function (k) {
        if (!['message', 'start_timer', 'end_timer', 'timestamp', 'measured_time', 'tag', 'disabled', 'log_id', 'measured_time_threshold'].includes(k)) {
            throw new Error(ERROR_PREFIX + 'unknown argument `' + k + '`');
        }
    });

    if (options.start_timer && !options.end_timer) {
        return options.log_id;
    }
    if (options.measured_time !== undefined && options.measured_time < options.measured_time_threshold) {
        return;
    }
    if (options.disabled) {
        return;
    }
    print(options);
}

function process_options(message, options) {
    if (!message) {
        throw new Error(ERROR_PREFIX + 'at least one argument is required');
    }
    if (![String, Object].includes(message.constructor)) {
        throw new Error(ERROR_PREFIX + 'first argument should either be an Object or a String');
    }

    if (message.constructor === Object) {
        Object.assign(options, message);
        message = undefined;
    } else {
        options.message = message;
        message = undefined;
    }

    if (options.end_timer && options.start_timer) {
        throw new Error(ERROR_PREFIX + "having both `start_timer` and `end_timer` doesn't make sense");
    }

    if (options.start_timer) {
        options.timestamp = options.timestamp || get_timestamp();
        options.log_id = Math.random();
    }
    if (options.end_timer) {
        var timestamp = get_timestamp();
        var options_stored = options_storage[options.log_id || options.end_timer];
        if (!options_stored) throw new Error("`log_id` or `end_timer` should be an ID returned when `start_timer` is truhty");
        options = Object.assign({}, options_stored, options);
        options.measured_time = options.measured_time || timestamp - options.timestamp;
    }

    if (options.start_timer) {
        options_storage[options.log_id] = options;
    }
    if (options.end_timer) {
        delete options_storage[options.log_id];
    }

    return options;
}

function print(options) {

    if (is_disabled(options)) {
        return;
    }

    var prefix = [PROJECT_NAME].concat(options.tag ? [options.tag] : []).concat(options.measured_time !== undefined ? [options.measured_time + 'ms'] : []).map(function (s) {
        return '[' + s + ']';
    }).join('');

    console.info(prefix + ' ' + options.message);
}

function is_disabled(options) {
    var locally_enabled = !options.tag ? null : get_setting(PROJECT_NAME + '_' + options.tag);
    var globally_enabled = get_setting(PROJECT_NAME);
    if (locally_enabled || globally_enabled) {
        return false;
    }
    return true;
}

function get_setting(key) {
    if (typeof window === 'undefined') {
        return true;
    }
    var localStorageValue = window.localStorage[key];
    if (!localStorageValue) {
        return false;
    }
    try {
        if (!JSON.parse(localStorageValue)) {
            return false;
        }
    } catch (e) {};
    return true;
}

function get_timestamp() {
    if ((typeof performance === 'undefined' ? 'undefined' : _typeof(performance)) === "object") {
        return performance.now() | 0;
    }
    return new Date();
}

