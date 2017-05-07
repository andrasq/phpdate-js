var fs = require('fs');
var tempnam = require('tempnam');
var child_process = require('child_process');
var assert = require('assert');

// the tests expect US/Eastern localtime
// US/Eastern is known on Debian, but not on Mac
process.env.TZ = "US/Eastern";

var phpdate = require('../index');
var gmdate = phpdate.gmdate;

module.exports = {
    setUp: function(done) {
        this.now = Date.now();
        this.timestamp = 315682496123;          // 1980-01-02 12:34:56.123000
        done();
    },

    'should have valid package.json': function(t) {
        var json = require('../package.json');
        t.done();
    },

    'should export expected properties': function(t) {
        assert.ok(typeof phpdate === 'function');
        assert.ok(typeof phpdate.gmdate === 'function');
        assert.ok(typeof phpdate.timezoneName === 'string' || phpdate.timezoneName === null);
        t.done();
    },

    'should return string': function(t) {
        assert.equal(typeof phpdate(""), 'string');
        t.done();
    },

    'options': {
        // options set static globals, toggle them back on after checking
        // these tests are mostly for code coverage, since caching is not easily testable

        'should accept options.cacheResults': function(t) {
            var str = phpdate("Y-m-d", this.timestamp, { cacheResults: false });
            assert.ok(/[0-9]{4}-[0-9]{2}-[0-9]{2}/.test(str));
            phpdate("Y-m-d", this.timestamp, { cacheResults: true });
            t.done();
        },

        'should accept options.cacheCurrentDate': function(t) {
            var str = phpdate("Y-m-d", this.timestamp, { cacheCurrentDate: false });
            assert.ok(/[0-9]{4}-[0-9]{2}-[0-9]{2}/.test(str));
            phpdate("Y-m-d", this.timestamp, { cacheCurrentDate: true });
            t.done();
        },

        'should accept options.cacheTimezone': function(t) {
            var str = phpdate("Y-m-d", this.timestamp, { cacheTimezone: false });
            assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(str));
            phpdate("Y-m-d", this.timestamp, { cacheTimezone: true });
            t.done();
        },

        'should guess timezone from offset if exports.timezoneName is not available': function(t) {
            return t.skip();

            var tzName = phpdate.timezoneName;
            phpdate.timezoneName = null;
            var str = phpdate("e", 1000, { cacheTimezone: false, cacheResults: false });
            phpdate.timezoneName = tzName;
            var str2 = phpdate("e", 1000, { cacheTimezone: false, cacheResults: false });
            phpdate("Y", Date.now(), { cacheTimezone: true, cacheResults: true });
            assert.equal(str, 'US/Eastern');
            assert.equal(str2, tzName);
            t.done();
        },

        'cached _currentDate should advance': function(t) {
            var str1 = phpdate("i.u");
            setTimeout(function(){
            var str2 = phpdate("i.u");
            setTimeout(function(){
            var str3 = phpdate("i.u");
            setTimeout(function(){
            var str4 = phpdate("i.u");
            t.assert(str1 != str2);
            t.assert(str2 != str3);
            t.assert(str3 != str4);
            t.done();
            }, 2); }, 2); }, 2);
        },

        'should reuse _currentDate': function(t) {
            return t.skip();

            // the cached _currentDate expires every millisecond
            setTimeout(function _retry() {
                var t1 = Date.now();
                phpdate("", 0, { cacheResults: false });
                var str1 = phpdate("Y-m-d");
                var str2 = phpdate("Y-m-d");
                var str3 = phpdate("Y-m-d");
                var str3 = phpdate("Y-m-d");
                var str3 = phpdate("Y-m-d");
                var str3 = phpdate("Y-m-d");
                var t2 = Date.now();
                if (t1 !== t2) return _retry();
                phpdate("", 0, { cacheResults: true });
                phpdate("Y-m-d");
                phpdate("Y-m-d");
                t.done();
            }, 2);
        },
    },

    'padding': {
        'should pad to 2 places': function(t) {
            assert.equal(gmdate('s', 1000), '01');
            assert.equal(gmdate('s', 10000), '10');
            t.done();
        },

        'should pad to 3 places': function(t) {
            assert.equal(gmdate('B', 1), '041');
            assert.equal(phpdate('B', 1), '041');
            assert.equal(phpdate('B', 23.04 * 3600 * 1000), '001');
            assert.equal(phpdate('B', 23.5 * 3600 * 1000), '020');
            assert.equal(phpdate('B', 11 * 3600 * 1000), '500');
            t.done();
        },

        'should pad to 4 places': function(t) {
            // note that nodejs typesets '123' without a leading zero
            assert.equal(phpdate('Y', new Date("1/1/123")), '0123');
            assert.equal(phpdate('Y', new Date(-62000000000000)), '0005');
            assert.equal(phpdate('Y', new Date(-61800000000000)), '0011');
            assert.equal(phpdate('Y', new Date(-58000000000000)), '0132');
            assert.equal(phpdate('Y', new Date(1.5e12)), '2017');
            t.done();
        },

        'should pad to 6 places': function(t) {
            assert.equal(phpdate('u', 1), '001000');
            assert.equal(phpdate('u', 10), '010000');
            assert.equal(phpdate('u', 100), '100000');
            t.done();
        },
    },

    'should report on timestamp number': function(t) {
        var str = gmdate('Y-m-d', 86400000/2);
        t.equal('1970-01-01', str);
        t.done();
    },

    'should report on current time': function(t) {
        var str = phpdate('Y-m-d');
        t.ok(/^\d{4}-\d{2}-\d{2}$/.test(str));
        t.done();
    },

    'should report on timestamp object': function(t) {
        var str = phpdate('Y-m-d', new Date(86400000/2));
        t.equal('1970-01-01', str);
        t.done();
    },

    'should report current date': function(t) {
        (function _retry() {
            var year1 = new Date().getFullYear();
            var str = phpdate('Y');
            var str = phpdate('Y');     // second one for code coverage
            var year2 = new Date().getFullYear();
            if (year1 !== year2) return _retry();
            t.equal(str, String(year1));
            t.done();
        })();
    },

    'should include utf8 chars in format': function(t) {
        var str = phpdate('Y-m-d \u1234', 315682496123);
        t.equal(str, '1980-01-02 \u1234');
        t.done();
    },

    'should format Y-m-d H:i:s.u': function(t) {
        var str = phpdate('Y-m-d H:i:s.u', 315682496123);
        t.equal(str, '1980-01-02 12:34:56.123000');
        t.done();
    },

    'should format c': function(t) {
        var str = phpdate('c', 315682496123);
        t.equal(str, '1980-01-02T12:34:56-05:00');
        t.done();
    },

    'gmdate should handle ST fall back': function(t) {
        var gdt = gmdate('Y-m-d H:i:s', 1194147428000);
        var pdt = phpdate('Y-m-d H:i:s', 1194147428000);
        assert.equal(gdt, '2007-11-04 03:37:08');
        assert.equal(pdt, '2007-11-03 23:37:08');
        t.done();
    },

    'gmdate should handle DST spring forward': function(t) {
        var pdt = phpdate('Y-m-d H:i:s', 514953117000);
        var gdt = gmdate('Y-m-d H:i:s', 514953117000);
        assert.equal(pdt, '1986-04-26 21:31:57');
        assert.equal(gdt, '1986-04-27 02:31:57');
        t.done();
    },

    'gmdate should handle DT fall back overlap': function(t) {
        // FIXME: WRITEME
        t.done()
    },

    'gmdate should handle DST spring foward in black hole': function(t) {
        var dt1 = gmdate('Y-m-d H:i:s', 514969199 * 1000);  // 1:59:59am EST, 6:59:59 GMT
        var dt2 = gmdate('Y-m-d H:i:s', 514969200 * 1000);  // 3:00:00am EDT, 7:00:00 GMT
        assert.equal(dt1, "1986-04-27 06:59:59");
        assert.equal(dt2, "1986-04-27 07:00:00");
        t.done();
    },

    'should typeset gmdate for 1295756896': function(t) {
        var dt = gmdate('Z e I O P T', 1295756896000);
        assert.equal(dt, '0 UTC 0 +0000 +00:00 GMT');
        t.done();
    },

    'should find the iso week for week ending next year': function(t) {
        // note: new Date() defaults datetime strings to GMT...
        // but parses and honors "EST" !  getHours() et al return localtime.
        assert.equal(phpdate('W', new Date('1986-12-30 EST')), '01');
        assert.equal(phpdate('W', new Date('2002-12-30 EST')), '01');
        assert.equal(phpdate('W', new Date('2002-12-31 EST')), '01');
        assert.equal(phpdate('W', new Date('2001-12-31 EST')), '01');
        t.done();
    },

    'should find iso week for week starting last year': function(t) {
        var str = phpdate('W', new Date('1988-01-02 EST'));
        t.equal(str, '53');
        t.done();
    },

    'fuzz test phpdate with 10k random timestamps': function(t) {
        fuzztest(t, phpdate, 'date');
    },

    'fuzz test gmdate with 10k random timestamps': function(t) {
        fuzztest(t, gmdate, 'gmdate');
    },

    // TODO: specific tests
};

function fuzztest( t, phpdate, phpPhpdateName ) {
    var timestampCount = 10000;
    var formats = [
        "a A g G H i s",
        "d D j l N S w",
        "z",                // weekday offset
        "F m M n t L Y y",
        "B",                // swatch time
        "u",                // microseconds, not possible with a fixed timestamp -- php is buggy!
        "e I O P T",
        "Z",
        "c",
        "r U",
        "W o z",
    ];

    var i, times = [];

    child_process.exec("php -v", function(err) {
        if (err) {
            console.log("fuzz test:", err.message);
            return t.done(err);
        }

        // pick random dates between 1986 (500m) and 2017 (1500m)
        for (i=0; i<timestampCount; i++) times.push(Math.floor(Math.random() * 1000000000 + 500000000));

        var doneCount = 0;
        for (i in formats) {
            (function(format, i) {
                tempnam("/tmp", "nodeunit-", function(err, tempfile) {
                    if (err) throw err;
                    fs.writeFileSync(tempfile, times.join("\n") + "\n");
                    try {
                        var script =
                            'ini_set("date.timezone", "' + process.env.TZ + '");' +
                            '$nlines = 0;' +
                            'while ($timestamp = fgets(STDIN)) {' +
                            '    $nlines += 1;' +
                            '    echo ' + phpPhpdateName + '("' + format + '\\n", trim($timestamp));' +
                            '}' +
                            'file_put_contents("/tmp/ar.out", "AR: nlines = $nlines\n");' +
                            '//sleep(10);' +
                            '';
                        child_process.exec("php -r '" + script + "' < " + tempfile, {maxBuffer: 100 * 1024 * 1024}, function(err, stdout, stderr) {
                            var results = stdout.split("\n");
                            results.pop();
                            assert.equal(results.length, times.length);
                            var j;
                            for (j=0; j<times.length; j++) {
                                var str = phpdate(format, times[j]*1000);
                                // note: php5-cli reports 'e' is "America/New_York" if env.TZ is "US/Eastern"
                                // but if set with ini_set("date.timezone", "US/Eastern") 'e' shows as "US/Eastern"
if (str !== results[j]) console.log(format, "::", times[j], phpdate("g G   Y-m-d H:i:s", times[j]*1000), "\nAR\n", str, "\nphp -r\n", results[j]);
                                assert.equal(str, results[j]);
                                //t.equal(phpdate(format, times[j]*1000), results[j]);
                            }
                            fs.unlink(tempfile);
                            doneCount += 1;
                            if (doneCount === formats.length) t.done();
                        });
                    }
                    catch (err) {
                        t.ok(false, "php not installed, cannot fuzz test");
                        doneCount += 1;
                        if (doneCount === formats.length) t.done();
                    }
                });
            })(formats[i], i);
        }
    });
}
