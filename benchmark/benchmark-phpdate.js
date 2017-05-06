var phpdate = require('../index');

var i, x, nloops = 1000000;
var dt = new Date();

var t1 = Date.now();
for (i=0; i<nloops; i++) x = new Date(1e9 + i);
var t2 = Date.now();
console.log(x);
console.log(nloops + " in ms", t2-t1);

var t1 = Date.now();
for (i=0; i<nloops; i++) x = phpdate('Y-m-d H:i:s');
var t2 = Date.now();
console.log(x);
console.log(nloops + " in ms", t2-t1);

var t1 = Date.now();
for (i=0; i<nloops; i++) x = phpdate('Y-m-d H:i:s', new Date(1e9 + i));
var t2 = Date.now();
console.log(x);
console.log(nloops + " in ms", t2-t1);

var t1 = Date.now();
for (i=0; i<nloops; i++) x = phpdate('Y-m-d H:i:s', undefined, {cacheResults: false});
var t2 = Date.now();
console.log(x);
console.log(nloops + " in ms", t2-t1);
