var fs = require('fs');
var tempnam = require('arlib/tempnam');
var child_process = require('child_process');
var phpdate = require('../index');
var gmdate = phpdate.gmdate;
var assert = require('assert');

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

    'should pad to 2 places': function(t) {
        assert.equal(gmdate('m', 1), '01');
        t.done();
    },

    'should pad to 3 places': function(t) {
        assert.equal(gmdate('B', 1), '041');
        assert.equal(phpdate('B', 1), '041');
        t.done();
    },

    'should pad to 4 places': function(t) {
        // note that nodejs typesets '123' without a leading zero
        assert.equal(phpdate('Y', new Date("1/1/123")), '0123');
        t.done();
    },

    'should pad to 6 places': function(t) {
        assert.equal(phpdate('u', 1), '001000');
        t.done();
    },

    'should report on timestamp number': function(t) {
        var str = gmdate('Y-m-d', 86400000/2);
        t.equal('1970-01-01', str);
        t.done();
    },

    'should report on current time': function(t) {
        var str = phpdate('Y-m-d');
        t.equal(str.slice(0, 2), '20');
        t.equal(str.length, '2014-01-01'.length);
        t.done();
    },

    'should report on timestamp object': function(t) {
        var str = phpdate('Y-m-d', new Date(86400000/2));
        t.equal('1970-01-01', str);
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
        //var dt1 = gmdate('Y-m-d H:i:s', 514969199 * 1000);  // 1:59:59am EST, 6:59:59 GMT
        //var dt2 = gmdate('Y-m-d H:i:s', 514969200 * 1000);  // 3:00:00am EDT, 7:00:00 GMT
        t.done();
    },

    'should typeset gmdate for 1295756896': function(t) {
        var dt = gmdate('Z e I O P T', 1295756896000);
        //assert.equal(dt, '');
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
            return t.done();
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
                            'ini_set("date.timezone", "US/Eastern");' +
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
