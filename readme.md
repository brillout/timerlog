## Usage

#### Simple

Following will print `[timerlog][40ms] A million random numbers generated`

```js
// example.js
var timerlog = require('timerlog'); // `npm install timerlog`
                                    // works in Node.js and in the browser

var AMOUNT = 1e6;

timerlog({
    id: 'simple-usage',
    start_timer: true,
    message: 'A million random numbers generated'
});

var sum = 0;
for(var i=0; i<AMOUNT; i++) {
    sum += Math.random();
}

timerlog({
    id: 'simple-usage',
    end_timer: true
});
```



#### Advanced

Running the following
```js
var timerlog = require('timerlog');

var AMOUNT = 1e6;

var log_id = timerlog({
    start_timer: true,
    message: 'Generating random numbers',
    tag: 'generate-random-numbers',
    disable: false // `disable: true` -> do not print
});

var sum = 0;
for(var i=0; i<5; i++) {
    timerlog({
        id: log_id,
        lap_time: true
    });
    for(var j=0; j<AMOUNT; j++) {
        sum += Math.random();
    }
}

timerlog({
    id: log_id,
    message: 'Random numbers sum: '+sum,
    measured_time_threshold: 10, // only print if measured time is greater than 10ms
    end_timer: true
});
```

will print

```
[timerlog][generate-random-numbers][lap-1][0ms] Generating random numbers
[timerlog][generate-random-numbers][lap-2][70ms] Generating random numbers
[timerlog][generate-random-numbers][lap-3][123ms] Generating random numbers
[timerlog][generate-random-numbers][lap-4][156ms] Generating random numbers
[timerlog][generate-random-numbers][lap-5][177ms] Generating random numbers
[timerlog][generate-random-numbers][205ms] Random numbers sum: 2499861.740182983
```

## FAQ

#### I try to use timerlog on client-side but it won't print anything.

You have to enable timerlog's logging:

```js
localStorage['timerlog'] = 1;
```

#### I get errors like `(intermediate value).includes is not a function` or `Object.assign is not a function` on older browsers.

timerlog requires some polyfills on older browsers. E.g. on Firefox 31.0 (used by Travis CI) it
requires:

* [Array.prototype.includes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes#Polyfill)
* [Object.assign](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign#Polyfill)
