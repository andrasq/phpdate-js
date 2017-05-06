'use strict';

var f_strftime = require('fast-strftime');
var u_strftime = require('ultra-strftime');
var phpdate = require('../');

var qtimeit = require('qtimeit');


var nloops = 10000;
var x;

qtimeit.timeGoal = 0.4;
qtimeit.bench.opsPerTest = nloops;
qtimeit.bench.visualize = true;
//qtimeit.bench.forkTests = true;

var dates = new Array(nloops);
for (var i=0; i<dates.length; i++) dates[i] = new Date(1.5e12 + i * 1000);

console.log("---- format different dates");
qtimeit.bench({
    'fast-strftime 1.1.1': function() {
        for (i=0; i<nloops; i++) x = f_strftime("%Y-%m-\%d %H-%i-%s", dates[i]);
    },

    'ultra-strftime 1.0.2': function() {
        for (i=0; i<nloops; i++) x = u_strftime("%Y-%m-\%d %H-%i-%s", dates[i]);
    },

    'phpdate-js 1.0.3': function() {
        for (i=0; i<nloops; i++) x = phpdate('Y-m-d H:i:s', dates[i]);
    },
})
console.log("");

console.log("---- format same date");
var dt = dates[0];
qtimeit.bench({
    'fast-strftime cached': function() {
        for (i=0; i<nloops; i++) x = f_strftime("%Y-%m-\%d %H-%i-%s", dt);
    },

    'ultra-strftime cached': function() {
        for (i=0; i<nloops; i++) x = u_strftime("%Y-%m-\%d %H-%i-%s", dt);
    },

    'phpdate-js cached': function() {
        for (i=0; i<nloops; i++) x = phpdate('Y-m-d H:i:s', dt);
    },
})

