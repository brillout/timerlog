module.exports = timerlog;


const options_storage = {}

const PROJECT_NAME = 'timerlog';

const ERROR_PREFIX = PROJECT_NAME+': ';

function timerlog(message, options={}) {
    options = process_options(message, options);
    message = undefined;

    Object.keys(options).forEach(k => {
        if( ! ['message', 'id', 'start_timer', 'end_timer', 'timestamp', 'measured_time', 'tag', 'disabled', 'measured_time_threshold', ].includes(k) ) {
            throw new Error(ERROR_PREFIX+'unknown argument `'+k+'`');
        }
    });

    if( options.start_timer && !options.end_timer ) {
        return options.id;
    }
    if( options.measured_time !== undefined && options.measured_time < options.measured_time_threshold ) {
        return;
    }
    if( options.disabled ) {
        return;
    }
    print(options);
}

function process_options(message, options) {
    if( ! message ) {
        throw new Error(ERROR_PREFIX+'at least one argument is required');
    }
    if( ! [String, Object].includes(message.constructor) ) {
        throw new Error(ERROR_PREFIX+'first argument should either be an Object or a String');
    }

    if( message.constructor === Object ) {
        Object.assign(options, message);
        message = undefined;
    } else {
        options.message = message;
        message = undefined;
    }

    if( options.end_timer && options.start_timer ) {
        throw new Error(ERROR_PREFIX+"having both `start_timer` and `end_timer` doesn't make sense");
    }

    if( options.start_timer ) {
        options.timestamp = options.timestamp || get_timestamp();
        options.id = options.id || Math.random();
        if( options_storage[options.id] ) {
            throw new Error("trying to start a new timer while a timer is already running for `"+options.id+"`");
        }
    }
    if( options.end_timer ) {
        const timestamp = get_timestamp();
        const storage_key = options.id || ![true,false].includes(options.end_timer) && options.end_timer;
        if( !storage_key ) throw new Error("`id` should be an ID or `end_timer` should be the value returned when `start_timer` is truhty");
        const options_stored = options_storage[storage_key];
        if( !options_stored ) throw new Error("couldn't find options storage for `"+storage_key+"`");
        options = Object.assign({}, options_stored, options);
        options.measured_time = options.measured_time || timestamp - options.timestamp;
    }

    if( options.start_timer ) {
        options_storage[options.id] = options;
    }
    if( options.end_timer ) {
        delete options_storage[options.id];
    }

    if( ! options.message && options.id ) {
        options.message = options.id;
    }
    if( ! options.message ) {
        throw new Error(ERROR_PREFIX+'`message` or `id` argument required');
    }

    return options;
}

function print(options) {

    if( is_disabled(options) ) {
        return;
    }

    const prefix =
        [PROJECT_NAME]
        .concat( options.tag ? [options.tag] : [])
        .concat( options.measured_time !== undefined ? [options.measured_time+'ms'] : [])
        .map(s => '['+s+']').join('');

    console.info(prefix+' '+options.message);
}

function is_disabled(options) {
    const locally_enabled = !options.tag ? null : get_setting(PROJECT_NAME+'_'+options.tag);
    const globally_enabled = get_setting(PROJECT_NAME);
    if( locally_enabled || globally_enabled ) {
        return false;
    }
    return true;
}

function get_setting(key) {
    if( typeof window === 'undefined' ) {
        return true;
    }
    const localStorageValue = window.localStorage[key]
    if( ! localStorageValue ) {
        return false;
    }
    try{
        if( ! JSON.parse(localStorageValue) ) {
            return false;
        }
    }catch(e){};
    return true;
}

function get_timestamp() {
    if(typeof performance === "object") {
        return performance.now()|0;
    }
    return new Date();
}
