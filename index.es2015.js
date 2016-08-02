module.exports = timerlog;


const options_storage = {}

const PROJECT_NAME = 'timerlog';

const ERROR_PREFIX = PROJECT_NAME+': ';
const WRONG_USAGE = ERROR_PREFIX+'wrong usage: ';

function timerlog() {
    const options = process_arguments.apply(null, arguments);

    Object.keys(options).forEach(k => {
        if( ! ['message', 'id', 'start_timer', 'end_timer', 'timestamp', 'measured_time', 'tag', 'disabled', 'measured_time_threshold', ].includes(k) ) {
            throw new Error(WRONG_USAGE+'unknown argument `'+k+'`');
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

function process_arguments() {
    if( arguments.length !== 1 || !arguments[0] || arguments[0].constructor !== Object ) {
        throw new Error(WRONG_USAGE+PROJECT_NAME+' should be called with exactly one argument and this argument should be an object');
    }

    const opts = arguments[0];

    if( opts.end_timer && opts.start_timer ) {
        throw new Error(WRONG_USAGE+"having both `start_timer` and `end_timer` doesn't make sense");
    }
    if( !opts.message && !opts.id ) {
        throw new Error(WRONG_USAGE+'`message` or `id` required');
    }

    if( opts.start_timer ) {
        opts.timestamp = opts.timestamp || get_timestamp();
        opts.id = opts.id || Math.random();
        if( options_storage[opts.id] ) {
            throw new Error("trying to start a new timer while a timer is already running for `"+opts.id+"`");
        }
    }
    if( opts.end_timer ) {
        const timestamp = get_timestamp();
        const storage_key = opts.id || ![true,false].includes(opts.end_timer) && opts.end_timer;
        if( !storage_key ) throw new Error("`id` should be an ID or `end_timer` should be the value returned when `start_timer` is truhty");
        const options_stored = options_storage[storage_key];
        if( !options_stored ) throw new Error("couldn't find options storage for `"+storage_key+"`");
        Object.assign(opts, options_stored);
        opts.measured_time = opts.measured_time || timestamp - opts.timestamp;
    }

    if( opts.start_timer ) {
        options_storage[opts.id] = opts;
    }
    if( opts.end_timer ) {
        delete options_storage[opts.id];
    }

    opts.message = opts.message || opts.id;

    return opts;
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
