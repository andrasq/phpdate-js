var u_strftime = require('ultra-strftime');

var i, x, nloops = 1000000;
var t1 = Date.now();

var dt = new Date();
for (i=0; i<nloops; i++) x = u_strftime("%Y-%m-\%d %H-%i-%s", dt);

var t2 = Date.now();
console.log(x);
console.log(nloops + " in ms", t2-t1);
