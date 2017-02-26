(root => {
    umd_export(timerlog_factory);

    return;

    function timerlog_factory() {
        const global_options = (() => { 
            const defaults = {
                disable_all: false,
            };
            if( typeof window !== "undefined" ) {
                return (window.timerlog_options = window.timerlog_options || defaults);
            } else if( typeof global !== "undefined" ) {
                return (global.timerlog_options = global.timerlog_options || defaults);
            }
            console.warn('unexpected environment');
            return defaults;
        })(); 

        const options_storage = {}

        const PROJECT_NAME = 'timerlog';

        const OPTIONS = [
            'message',
            'id',
            'start_timer',
            'end_timer',
            'start_timestamp',
            'measured_time',
            'tag',
            'tags',
            'disable',
            'measured_time_threshold',
            'lap_time',
            'nth_lap_time',
            'disable_all',
        ];

        return timerlog;

        function timerlog() {
            const options = process_arguments.apply(null, arguments);

            if( options.start_timer && !options.end_timer && !options.lap_time ) {
                return options.id;
            }
            if( options.measured_time !== undefined && options.measured_time < options.measured_time_threshold ) {
                return;
            }
            if( options.disable ) {
                return;
            }
            if( global_options.disable_all ) {
                return;
            }
            if( is_disabled(options) ) {
                return;
            }
            print(options);
        }

        function process_arguments() { 
            if( arguments.length !== 1 || !arguments[0] || arguments[0].constructor !== Object ) {
                throw_error({message: PROJECT_NAME+' should be called with exactly one argument and this argument should be an object'});
            }

            let opts = Object.assign({}, arguments[0]);

            Object.keys(opts).forEach(k => {
                if( ! OPTIONS.includes(k) ) {
                    throw_error({message: 'unknown argument `'+k+'`'});
                }
            });

            if( [opts.lap_time, opts.start_timer, opts.end_timer].filter(v=>!!v).length > 1 ) {
                throw_error({message: "only exactly one of `start_timer`, `end_timer`, or `lap_time` should be truthy"});
            }

            if( opts.tag || opts.tags ) {
                opts.tags = (
                    []
                    .concat( opts.tag ? [opts.tag] : [] )
                    .concat( opts.tags || [] )
                );
                delete opts.tag;
            }

            if( opts.lap_time || opts.start_timer || opts.end_timer ) {
                opts = handle_timer_logic(opts);
            }

            if( opts.disable_all !== undefined ) {
                global_options.disable_all = opts.disable_all;
            }

            return opts;

            function handle_timer_logic(opts) {
                if( opts.start_timer ) {
                    opts.start_timestamp = opts.start_timestamp || get_timestamp();
                    opts.id = opts.id || Math.random();
                    if( options_storage[opts.id] ) {
                        throw_error({is_warning: true, message:"trying to start a new timer while a timer is already running for `"+opts.id+"`"});
                    }
                }

                if( opts.end_timer || opts.lap_time ) {
                    const timestamp = get_timestamp();
                    if( ! opts.id ) throw_error({message: "`id` required when `opts.end_timer==true`"});
                    const options_stored = options_storage[opts.id];
                    if( ! options_stored ) throw_error({is_internal_error: true, message:"couldn't find options storage for `"+opts.id+"`"});
                    opts = Object.assign({}, options_stored, opts);
                    opts.measured_time = timestamp - opts.start_timestamp;
                }

                if( opts.end_timer ) {
                    delete options_storage[opts.id];
                } else {
                    options_storage[opts.id] = opts;
                }

                if( opts.lap_time ) {
                    opts.nth_lap_time = (opts.nth_lap_time||0) + 1;
                }

                return opts;

                function get_timestamp() {
                    if(typeof performance === "object") {
                        return performance.now()|0;
                    }
                    return new Date();
                }
            }
        } 

        function print(options) { 
            const prefix =
                [PROJECT_NAME]
                .concat( options.tags || [] )
                .concat( options.lap_time && !options.end_timer ? ['lap-'+options.nth_lap_time] : [] )
                .concat( options.measured_time !== undefined ? [options.measured_time+'ms'] : [] )
                .map(s => '['+s+']')
                .join('');

            console.info(
                [
                    prefix,
                    options.message||options.id,
                ]
                .filter(v=>!!v).join(' ')
            );
        } 

        function is_disabled(options) { 
            const locally_enabled = (() => {
                const tags_setting = (
                    (options.tags || [])
                    .map(t => get_setting(PROJECT_NAME+'_'+t))
                    .filter(v => v!==null)
                );
                if( tags_setting.length>0 ) {
                    return tags_setting[0];
                }
                return null;
            })();

            const globally_enabled = get_setting(PROJECT_NAME);

            const is_production = get_is_production();

            if( locally_enabled !== null ) {
                return !locally_enabled;
            }

            if( globally_enabled !== null ) {
                return !globally_enabled;
            }

            return is_production;

            function get_setting(key) {
                if( is_browser() ) {
                    return get_setting_in_browser(key);
                }

                if( is_nodejs() ) {
                    const val = get_setting_in_nodejs(key);
                    if( val !== null ) {
                        return val;
                    }
                    return get_setting_in_nodejs(key.toUpperCase());
                }

                unexpected_env();
            }

            function get_setting_in_browser(key) {
                return interpret_setting_value(window.localStorage[key]);
            }

            function get_setting_in_nodejs(key) {
                return interpret_setting_value(process.env[key]);
            }

            function interpret_setting_value(val) {
                if( ! val ) {
                    return null;
                }
                try{
                    return !!JSON.parse(val);
                }catch(e){};
                return true;
            }

            function get_is_production() {
                if( is_browser() ) {
                    return window.location.hostname !== 'localhost';
                }

                if( is_nodejs() ) {
                    return process.env["NODE_ENV"] === "production";
                }

                unexpected_env();
            }

            function is_browser() {
                 return typeof window !== 'undefined';
             }

            function is_nodejs() {
                return typeof (process||{}).env !== 'undefined';
            }

            function unexpected_env() {
                throw_error({is_internal_error: true, message: "unexpected environement; neither `window` or `process.env` is defined"});
            }
        } 

        function throw_error({message, is_internal_error=false, is_warning=false}) { 
            const PREFIX__ERROR = PROJECT_NAME + ': ';
            const PREFIX__WRONG_USAGE = PREFIX__ERROR + 'wrong usage: ';
            const PREFIX__INTERNAL_ERROR = PREFIX__ERROR + 'unexpected error: ';

            const prefix = is_internal_error ? PREFIX__INTERNAL_ERROR : PREFIX__WRONG_USAGE;

            const msg = prefix+message;

            if( is_warning ) {
                console.warn(msg);
            } else {
                throw new Error(msg);
            }
        } 
    }

    function umd_export(factory) { 
        // taken from https://github.com/umdjs/umd
        if (typeof define === 'function' && define.amd) {
            define([], factory);
        } else if (typeof module === 'object' && module.exports) {
            module.exports = factory();
        } else {
            root.returnExports = factory();
        }
    } 
})(this);
