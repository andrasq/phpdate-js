phpdate-js
==========

[![Build Status](https://api.travis-ci.org/andrasq/phpdate-js.svg?branch=master)](https://travis-ci.org/andrasq/phpdate-js?branch=master)
[![Coverage Status](https://coveralls.io/repos/github/andrasq/phpdate-js/badge.svg?branch=master)](https://coveralls.io/github/andrasq/phpdate-js?branch=master)

Extremely fast, fully compatible exact php `date()` and `gmdate()` work-alike for
nodejs, supporting all php conversions.

        var phpdate = require('phpdate-js');
        var gmdate = require('phpdate-js').gmdate;

        phpdate('Y-m-d H:i:s T');
        // => "2014-11-27 13:58:02 EST"

        gmdate('Y-m-d H:i:s T', new Date());
        // => "2014-11-27 18:58:02 GMT"

        phpdate('Y-m-d H:i:s T', 1234567890000);
        // => "2009-02-13 18:31:30 EST"

Supports timezone offsets, and daylight savings changes, but only North American
timezone names (those it derives from the timezone offset).
See php's
[date](http://php.net/manual/en/function.date.php) for the descriptions.

The conversion is very fast, about as fast as the fastest date conversion
npm modules (see [ultra-strftime](http://npmjs.org/package/ultra-strftime)
and [fast-strftime](http://npmjs.org/package/fast-strftime)); much faster
than `new Date().toString()` or `toISOString()`.


## Benchmark

$ node-v6.7.0 benchmark/benchmark.js

    ---- format different dates
    qtimeit=0.18.0 node=6.7.0 v8=5.1.281.83 platform=linux kernel=3.16.0-4-amd64 up_threshold=11
    arch=ia32 mhz=4416 cpuCount=8 cpu="Intel(R) Core(TM) i7-6700K CPU @ 4.00GHz"
    name  speed  (stats)  rate
    fast-strftime 1.1.1      2,099,978 ops/sec (17 runs of 50 calls in 4.048 out of 4.324 sec, +/- 0.00%)    1000 >>>>>
    ultra-strftime 1.0.2     2,505,634 ops/sec (20 runs of 50 calls in 3.991 out of 4.116 sec, +/- 0.00%)    1193 >>>>>>
    phpdate-js 1.0.3         6,031,994 ops/sec (24 runs of 100 calls in 3.979 out of 4.060 sec, +/- 0.00%)   2872 >>>>>>>>>>>>>>

    ---- format same date
    qtimeit=0.18.0 node=6.7.0 v8=5.1.281.83 platform=linux kernel=3.16.0-4-amd64 up_threshold=11
    arch=ia32 mhz=4417 cpuCount=8 cpu="Intel(R) Core(TM) i7-6700K CPU @ 4.00GHz"
    name  speed  (stats)  rate
    fast-strftime cached      3,870,123 ops/sec (31 runs of 50 calls in 4.005 out of 4.116 sec, +/- 0.00%)    1000 >>>>>
    ultra-strftime cached    48,313,751 ops/sec (39 runs of 500 calls in 4.036 out of 4.061 sec, +/- 0.00%)  12484 >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    phpdate-js cached        48,524,098 ops/sec (39 runs of 500 calls in 4.019 out of 4.043 sec, +/- 0.00%)  12538 >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>


### phpdate( format, [timestamp] )

return a formatted date string like PHP's `date()` does.  The output will be
adjusted for the local timezone in effect.  Supports all conversions, though
timezone support is limited to
North America.  Localization is as reported by the nodejs runtime (the
system), inferred from Date.getTimezoneOffset().

`Format` is the timestamp conversion specifier.  Format control characters are
replaced with formatted values; other characters are left as-is.  Backslash
escapes the special meaning of a character.  For instance, 'Y-m-d H:i:s'
formats an ISO 9075 SQL datetime such as '2014-01-02 12:34:56'.  The date
and time are formatted for the current locale, with timezone and daylight
savings adjustments applied.

The `timestamp` is optional.  If omitted, the current date is used.  If
specified, it can be a Date object or a JavaScript millisecond timestamp
(milliseconds since the epoch).

        var phpdate = require('phpdate-js');
        phpdate('Y-m-d H:i:s.u T');     // 2014-10-18 04:56:53.437000 EDT

### gmdate( format, [timestamp] )

Identical to phpdate, but the timestamp is formatted as UTC, without timezone
or daylight saving adjustments.

        var gmdate = require('phpdate-js').gmdate;
        var now = gmdate('Y-m-d H:i:s T');
        // => "2014-11-27 19:17:50 GMT"

Related Work
------------

- `fast-strftime`
- `ultra-strftime`
- `phpdate`


Notes
-----

- The T and e conversions (timezone abbreviation and timezone name) reverse
  engineer the timezone offset, and only support North American timezones.  The
  date and time conversions rely on the built-in system timezone handling and
  should be correct in all locales.
- The e conversion returns a generic timezone name like US/Eastern and not
  a locale-specific one such as America/New_York.
