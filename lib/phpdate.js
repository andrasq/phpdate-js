/**
 * php.date() work-alike, for most of the conversions
 *
 * Copyright (C) 2014 Andras Radics
 * Licensed under the Apache License, Version 2.0
 *
 * 2014-10-18 - AR.
 */

'use strict';

module.exports = phpdate;
module.exports.gmdate = gmdate;

var _tzCache = new TzCache();                   // cached tzInfo() data
function tzInfo( now ) {
    return _tzCache.tzInfo(now);
}

function phpdate( format, timestamp ) {
    var dt = _timestampToDt(timestamp);
    var i, output = "";

    for (i=0; i<format.length; i++) {
        var c = format[i];
        if (formatters[c]) output += formatters[c](dt);
        else if (c === '\\' && ++i < format.length) output += format[i];
        else output += c;
    }
    return output;
}

function _timestampToDt( timestamp ) {
    return (typeof timestamp === 'number') ? new Date(timestamp) : timestamp ? timestamp : new Date();
    // TODO: use process.hrtime() to capture microsecond timestamp, for 'u' format
}

// `now` is a Date object which will output timezone-corrected values
// (either localtime, no correction, or gmtime, shifted ahead by tz.offs)
var formatters = {
    d: function(now){ return pad2(now.getDate()); },
    D: function(now){ return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][now.getDay()]; },
    j: function(now){ return now.getDate(); },
    l: function(now){ return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][now.getDay()]; },
    h: function(now){ return pad2(hour1to12(now)); },
    N: function(now){ return iso8601day(now.getDay()); },               // Mon=1 .. Sun=7
    S: function(now){ return dayNumberOrdinalSuffix(now); },
    w: function(now){ return now.getDay(); },
    z: function(now){ return weekdayOffset(now).year; },

    // W: ISO 8601 week number of the year, weeks starting on Monday
    // AR: php pads with a leading zero if 1..9
    W: function(now){ return pad2(iso8601week(now)); },

    F: function(now){ return ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][now.getMonth()]; },
    m: function(now){ return pad2(now.getMonth() + 1); },
    M: function(now){ return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][now.getMonth()]; },
    n: function(now){ return now.getMonth() + 1; },
    t: function(now){ return weekdayOffset(now).mdays; },

    L: function(now){ return weekdayOffset(now).leap ? 1 : 0; },
    // o: ISO 8601 year number
    o: function(now){ return pad4(iso8601year(now)); },
    Y: function(now){ return pad4(now.getFullYear()); },
    y: function(now){ return pad2(now.getFullYear() % 100); },

    a: function(now){ return now.getHours() < 12 ? "am" : "pm"; },
    A: function(now){ return now.getHours() < 12 ? "AM" : "PM"; },
    B: function(now){ var tz = tzInfo(now);
        // swatch time is GMT +01:00, ie timestamp 1 is 1am, '041'
        var tm = now.getTime() + 3600 * 1000;
        return pad3(Math.floor(1000 * (tm % 86400000) / 86400000)); },
    g: function(now){ return hour1to12(now); },
    G: function(now){ return (now.getHours()); },
    H: function(now){ return pad2(now.getHours()); },
    i: function(now){ return pad2(now.getMinutes()); },
    s: function(now){ return pad2(now.getSeconds()); },
    u: function(now){ return pad6(now.getTime() % 1000 * 1000); },

    e: function(now){ var tz = tzInfo(now); return tz.tzname; },
    I: function(now){ var tz = tzInfo(now); return tz.isDst; },
    O: function(now){ var tz = tzInfo(now); return (!tz.offs ? '+0000' : tz.sign + pad2(tz.h) + pad2(tz.m)); },
    P: function(now){ var tz = tzInfo(now); return (!tz.offs ? '+00:00' : tz.sign + pad2(tz.h) + ":" + pad2(tz.m)); },
    T: function(now){ var tz = tzInfo(now); return tz.tz; },
    Z: function(now){ var tz = tzInfo(now); return -tz.offs * 60; },

    c: function(now){ return phpdate("Y-m-d\\TH:i:sP", now); },
    r: function(now){ return phpdate("D, d M Y H:i:s O", now); },
    U: function(now){ return Math.floor(now.getTime() / 1000); },
};


// Date is magic, and cannot inherit its prototype methods... so decorate it
function GmtDate( dt ) {
    this.dt = dt;
    this.isGmt = true;
}
GmtDate.prototype.getTime = function GmtDate_getTime() { return this.dt.getTime(); };
GmtDate.prototype.getFullYear = function GmtDate_getFullYear() { return this.dt.getUTCFullYear(); };
GmtDate.prototype.getMonth = function GmtDate_getMonth() { return this.dt.getUTCMonth(); };
GmtDate.prototype.getDay = function GmtDate_getDay() { return this.dt.getUTCDay(); };
GmtDate.prototype.getDate = function GmtDate_getDate() { return this.dt.getUTCDate(); };
GmtDate.prototype.getHours = function GmtDate_getHours() { return this.dt.getUTCHours(); };
GmtDate.prototype.getMinutes = function GmtDate_getMinutes() { return this.dt.getUTCMinutes(); };
GmtDate.prototype.getSeconds = function GmtDate_getSeconds() { return this.dt.getUTCSeconds(); };

function gmdate( format, timestamp ) {
    var dt = _timestampToDt(timestamp);
    return phpdate(format, new GmtDate(dt));
}


function iso8601day( dayOfWeek ) {
    // convert php 0..6 Sun-Sat to ISO 1..7 Mon-Sun
    return dayOfWeek > 0 ? dayOfWeek : 7;
}

function iso8601week( now ) {
/*
 * ISO-8601 week number of year, weeks starting on Monday
 * The first week of a year is the week that contains the first Thursday of the year
 * (php.net)
 * http://en.wikipedia.org/wiki/ISO_week_date
 */
    var offs = weekdayOffset(now);
    // offs.week is 0..6 day in week offset (0 = Sun)
    // offs.year is 0..356 day in year offset (0 = Jan 1)
    // offs.year % 7 is number of 7-day groups since Jan 1st
    // offs.year div 7 is the 0..6 day in 7-day offset (0 = same as Jan 1)
    // FIXME: writeme
    // ISO weeks start with Mon = 0
    var dayOfIsoWeek = offs.week === 0 ? 6 : offs.week - 1;
    var dayOfYear = offs.year;
    var dayOfSevenday = offs.year % 7;
    var dayOfStartOfYear = dayOfIsoWeek - dayOfSevenday;

    // dayOfStartOfYear is days relative to Jan 1 of the first iso week
    if (dayOfStartOfYear < 0) dayOfStartOfYear += 7;
    if (dayOfStartOfYear >= 4) dayOfStartOfYear -= 7;

    // dayOfLastOfYear is the last day of the last iso week
    var dayOfLastOfYear = (dayOfStartOfYear + offs.ydays - 1) % 7;

    // days offset from Jan 1 to first day in this ISO year
    var firstDayOfIsoYear = (dayOfStartOfYear < 4) ? dayOfStartOfYear - 7 : 7 - dayOfStartOfYear;
    // days offset from Jan 1 to last this in this ISO year
    var lastDayOfIsoYear = 99999;                               // FIXME!

    if (dayOfYear < firstDayOfIsoYear) return 52 || 53;         // FIXME!!
    else if (dayOfYear > lastDayOfIsoYear) return 1;
    else return (dayOfYear - firstDayOfIsoYear) % 7 + 1;        // ???
}

function iso8601year( now ) {
/*
 * ISO-8601 year number. This has the same value as Y, except that if the
 * ISO week number (W) belongs to the previous or next year, that year is
 * used instead. (php.net)
 */
    var week = iso8601week(now);
    if (week > 50 && now.getMonth() === 0)
        // week 52 or 53, final week of previous year
        return now.getFullYear() - 1;
    else if (week === 1 && now.getMonth() !== 0)
        // week 1, first week of next year
        return now.getFullYear() + 1;
    else
        return now.getFullYear();
}

function hour1to12( now ) {
    var hour = now.getHours() % 12;
    return hour === 0 ? 12 : hour;
}

function TzCache( ) {
    this.capacity = 20;
    this.cache = [];
    this.timezone = 'local';
}

TzCache.prototype.cacheIndex = function TzCache_cacheIndex( timestamp ) {
    // group timezone info into 15-minute buckets
    return Math.floor(timestamp / 1000 / 60 / 15);
}

TzCache.prototype.get = function TzCache_get( timestamp ) {
    return this.cache[this.cacheIndex(timestamp)];
}

TzCache.prototype.set = function TzCache_set( timestamp, info ) {
    if (this.cache.length >= this.capacity) {
        delete this.cache[Math.floor(Math.random() * this.capacity)];
    }
    this.cache[this.cacheIndex(timestamp)] = info;
}

// return timezone info about the date
TzCache.prototype.tzInfo = function TzCache_tzInfo( now ) {
    if (now.isGmt) {
        // if now is evaluated in a GMT context, all the offsets are zero
        return {
            offs: 0,
            h: 0,
            m: 0,
            isDst: 0,
            tz: 'GMT',          // 'T' returns php timezone abbrev, is 'GMT'
            sign: '+',
            tzname: 'UTC',      // 'e' returns php timezone name, is 'UTC'
        };
    }

    // getting the tz info is slow... cache it, reload every 15 min
    var tm = now.getTime();
    var tz = this.get(tm);
    if (tz) return tz;

    // note: slower to parse now.toString() than to derive from getTimezoneOffset()
    var offset = now.getTimezoneOffset();
    var winterOffset = new Date(0).getTimezoneOffset();     // winter 1970 had no DST in effect
    // FIXME: this assumes DST in the northern hemisphere; southern might shift in our winter
    var isWestOfGmt = (winterOffset > 0);
    var isCurrentlyDst = (offset !== winterOffset);
    var offsetMinutes = Math.abs(offset) % 60;
    var offsetHours = (Math.abs(offset) - offsetMinutes) / 60;
    var tzMap = {
        '0': ['GMT', 'GMT', 'GMT'],
        '240': ['AST', 'ADT', 'Atlantic'],
        '300': ['EST', 'EDT', 'US/Eastern'],
        '360': ['CST', 'CDT', 'US/Central'],
        '420': ['MST', 'MDT', 'US/Mountain'],
        '480': ['PST', 'PDT', 'US/Pacific'],
        // Juneau
        // Hawaii
    };
    // FIXME: only detects a few timezone abbreviations, and presumes US
    var tzCode = tzMap[winterOffset] ? tzMap[winterOffset][0 + isCurrentlyDst] : now.toString().slice(35, 38);
    var tzName = tzMap[winterOffset] ? tzMap[winterOffset][2] : '???';
    var info = {
        offs: offset,
        h: offsetHours,
        m: offsetMinutes,
        isDst: isCurrentlyDst ? 1 : 0,
        tz: tzCode,
        sign: isWestOfGmt ? "-" : "+",
        tzname: tzName,
    };
    this.set(tm, info);

    return info;
};

// return relative offsets of the date
function weekdayOffset( now ) {
    var yr = now.getFullYear();
    var mo = now.getMonth();
    var isLeap = (yr % 4) === 0 && ((yr % 100) !== 0 || (yr % 400) === 0);

    var days = [31, 28 + isLeap, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    var dy = 0;
    for (var i=0; i<mo; i++)
        dy += days[i];
    dy += now.getDate() - 1;

    return {
        leap: isLeap,                   // whether this is a leap year
        week: now.getDay(),             // day of week, 0=Sunday
        month: now.getDate() - 1,       // day of month, 0=1st
        year: dy,                       // day of year, 0=Jan1
        mdays: days[now.getMonth()],    // days in month
        ydays: 365 + isLeap,            // days in year
    };
}

// return st, nd, rd, or th, depending on the date
function dayNumberOrdinalSuffix( now ) {
    var date = now.getDate();
    if (date % 100 > 10 && date % 100 < 20) return 'th';
    else return ['th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th'][date % 10];
}

function pad2( number ) {
    return number >= 10 ? number : "0" + number;
}

function pad3( number ) {
    return number >= 100 ? number : "0" + pad2(number);
}

function pad4( number ) {
    return (
        number >= 1000 ? "" + number :
        number >= 100 ? "0" + number :
        number >= 10 ? "00" + number :
                      "000" + number
    );
}

function pad6( number ) {
    return (
        number >= 100000 ? "" + number :
        number >= 10000 ? "0" + number :
        number >= 1000 ? "00" + number :
        number >= 100 ? "000" + number :
        number >= 10 ? "0000" + number :
                      "00000" + number
    );
}

/*** ---------------------------------------------------------------- ***\
From php.net/manual/en/function.date.php as of 2014-09-15:

d	Day of the month, 2 digits with leading zeros	01 to 31
D	A textual representation of a day, three letters	Mon through Sun
j	Day of the month without leading zeros	1 to 31
l (lowercase 'L')	A full textual representation of the day of the week	Sunday through Saturday
N	ISO-8601 numeric representation of the day of the week (added in PHP 5.1.0)	1 (for Monday) through 7 (for Sunday)
S	English ordinal suffix for the day of the month, 2 characters	st, nd, rd or th. Works well with j
w	Numeric representation of the day of the week	0 (for Sunday) through 6 (for Saturday)
z	The day of the year (starting from 0)	0 through 365
Week	---	---
W	ISO-8601 week number of year, weeks starting on Monday (added in PHP 4.1.0)	Example: 42 (the 42nd week in the year)
Month	---	---
F	A full textual representation of a month, such as January or March	January through December
m	Numeric representation of a month, with leading zeros	01 through 12
M	A short textual representation of a month, three letters	Jan through Dec
n	Numeric representation of a month, without leading zeros	1 through 12
t	Number of days in the given month	28 through 31
Year	---	---
L	Whether it's a leap year	1 if it is a leap year, 0 otherwise.
o	ISO-8601 year number. This has the same value as Y, except that if the ISO week number (W) belongs to the previous or next year, that year is used instead. (added in PHP 5.1.0)	Examples: 1999 or 2003
Y	A full numeric representation of a year, 4 digits	Examples: 1999 or 2003
y	A two digit representation of a year	Examples: 99 or 03
Time	---	---
a	Lowercase Ante meridiem and Post meridiem	am or pm
A	Uppercase Ante meridiem and Post meridiem	AM or PM
B	Swatch Internet time	000 through 999
g	12-hour format of an hour without leading zeros	1 through 12
G	24-hour format of an hour without leading zeros	0 through 23
h	12-hour format of an hour with leading zeros	01 through 12
H	24-hour format of an hour with leading zeros	00 through 23
i	Minutes with leading zeros	00 to 59
s	Seconds, with leading zeros	00 through 59
u	Microseconds (added in PHP 5.2.2). Note that date() will always generate 000000 since it takes an integer parameter, whereas DateTime::format() does support microseconds.	Example: 654321
Timezone	---	---
e	Timezone identifier (added in PHP 5.1.0)	Examples: UTC, GMT, Atlantic/Azores
I (capital i)	Whether or not the date is in daylight saving time	1 if Daylight Saving Time, 0 otherwise.
O	Difference to Greenwich time (GMT) in hours	Example: +0200
P	Difference to Greenwich time (GMT) with colon between hours and minutes (added in PHP 5.1.3)	Example: +02:00
T	Timezone abbreviation	Examples: EST, MDT ...
Z	Timezone offset in seconds. The offset for timezones west of UTC is always negative, and for those east of UTC is always positive.	-43200 through 50400
Full Date/Time	---	---
c	ISO 8601 date (added in PHP 5)	2004-02-12T15:19:21+00:00
r	» RFC 2822 formatted date	Example: Thu, 21 Dec 2000 16:01:07 +0200
U	Seconds since the Unix Epoch (January 1 1970 00:00:00 GMT)	See also time()
\*** ---------------------------------------------------------------- ***/


// quick test:
/**

var timeit = require('./timeit');
var moment = require('moment');

console.log(phpdate("c T"));
console.log(gmdate("c T"));
console.log(phpdate("c T"));
console.log(phpdate("r T"));
//console.log(gmdate("r T"));

var s;
//timeit(100000, function() { s = new Date().toISOString() });
//console.log(s);
// 850k/s; 920k/s if only test run

//timeit(100000, function() { s = phpdate("Y-m-d H:i:s.u T"); });
//timeit(100000, function() { s = phpdate("Y-m-d H:i:s"); });
//console.log(s);
// 107k/s sprintf(), 340k/s padFormat() switch, 435/s external dispatch table split out functions,
// w/o .u microseconds 550k/s, w/ pad2 580k/s

//timeit(100000, function() { s = phpdate("c"); });
//console.log(s);
// 265k/s; not much diff w/ pad2; 360k/s with tz info caching; 385k/s if only test run

//timeit(100000, function() { s = gmdate("c"); });
//console.log(s);
// 340k/s (do not create unnecessary Date objects, they halve the run rate)

//var dt = new Date();
//timeit(100000, function(){ s = phpdate("c", dt); });
// 400k/s gmdate, 460k/s phpdate

//timeit(40000, function() { s = moment.utc().format() });
//console.log(s);
// 150k/s

// php:
// % timeit php -r 'for ($i=0; $i<100000; ++$i) $x = date("Y-m-d H:i:s\n"); echo $x;'
// 2014-10-17 23:37:34
// 1.1040u 0.0040s 00:1.11033 99.79%        0+11812k 0+0io 0pf+0w
// ie 90k/s

/**/
