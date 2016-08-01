var timerlog = require('./dist/index.es5.js');


var AMOUNT = 10e6;

var log_id = timerlog({
    message: 'A million random numbers generated',
    start_timer: true,
    tag: 'generate-random-numbers',
    measured_time_threshold: 10, // only print if measured time is greater than 10ms
    disabled: false, // `disabled: true` -> do not print
});

let sum = 0;
for(var i=0; i<AMOUNT; i++) {
    sum += Math.random();
}

timerlog({
    end_timer: log_id,
});
