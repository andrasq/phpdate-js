phpdate-js
==========

fast php date() work-alike for nodejs

        var phpdate = require('phpdate-js');
        var gmdate = require('phpdate-js').gmdate;

        phpdate('Y-m-d H:i:s T');
        // => "2014-11-27 13:58:02 EST"

        gmdate('Y-m-d H:i:s T', new Date());
        // => "2014-11-27 18:58:02 GMT"

        phpdate('Y-m-d H:i:s T', 1234567890000);
        // => "2009-02-13 18:31:30 EST"

Supports all php conversions, including North American timezone names, offsets,
and daylight savings changes.
See php's
[date](http://php.net/manual/en/function.date.php) for the descriptions.

The conversion is very fast, about as fast as the fastest date conversion
npm modules (see [ultra-strftime](http://npmjs.org/package/ultra-strftime)
and [fast-strftime](http://npmjs.org/package/fast-strftime)); much faster
than `new Date().toString()` or `toISOString()`.

## Installation

        npm install phpdate-js
        npm test phpdate-js

        node node_modules/phpdate-js/benchmark/benchmark-phpdate.js

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

Notes
-----

- The T and e conversions (timezone abbreviation and timezone name) reverse
  engineer the timezone offset, and only support North American timezones.  The
  date and time conversions rely on the built-in system timezone handling and
  should be correct in all locales.
- The e conversion returns a generic timezone name like US/Eastern and not
  a locale-specific one such as America/New_York.
