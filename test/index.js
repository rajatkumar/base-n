'use strict';

// internal files
var baseN = require('../lib');

// external files
var assert = require('chai').assert;

describe('baseN', function() {

    it('should find correct fixed length', function() {
        var b64;
        // 64
        // 4096
        // 262144
        // 16777216
        b64 = baseN.create({
            max: 63
        });
        assert.equal(b64.length, 1);

        b64 = baseN.create({
            max: 64
        });
        assert.equal(b64.length, 2);

        b64 = baseN.create({
            max: 4096
        });
        assert.equal(b64.length, 3);

        b64 = baseN.create({
            max: 262144
        });
        assert.equal(b64.length, 4);
    });


    it('should generate fixed length string', function() {
        var x;
        var b64;

        b64 = baseN.create({
            length: 5
        });
        x = b64.encode(5);
        assert.isString(x);
        assert.lengthOf(x, 5);

        b64 = baseN.create({
            length: 2
        });
        x = b64.encode(5);
        assert.isString(x);
        assert.lengthOf(x, 2);

        // can also fix length by giving a max integer value allowed.
        // this should be two characters. (64^2)
        b64 = baseN.create({
            max: 4095
        });
        x = b64.encode(5);
        assert.isString(x);
        assert.lengthOf(x, 2);
    });


    it('should throw when generating string larger than allowed length',
    function() {
        var b64;

        b64 = baseN.create({
            length: 2
        });

        // 2 characters is 64^2 = 4096 max (0 based)
        assert.doesNotThrow(function() {
            b64.encode(4095);
        });
        assert.throws(function() {
            b64.encode(4096);
        });


        b64 = baseN.create({
            max: 4095
        });

        assert.doesNotThrow(function() {
            b64.encode(4095);
        });
        assert.throws(function() {
            b64.encode(4096);
        });
    });


    it('should throw when encoding negative integers', function() {
        var b64 = baseN.create();

        assert.throws(function() {
            b64.encode(-1);
        });
    });


    it('should throw when decoding unknown character', function() {
        var b64 = baseN.create();

        assert.throws(function() {
            b64.decode('$');
        });
    });

    it('should symmetric encode/decode', function(done) {

        this.timeout(10000);

        var b64 = baseN.create({
            max: 1000000
        });
        var accumulator = {};

        for (var i = 0; i < 1000000; i++) {
            var encoded = b64.encode(i);
            var decoded = b64.decode(encoded);

            // ensure symmetrical encoding/decoding
            assert.equal(decoded, i);
            // ensure this encoded value is unique and not seen yet
            assert.notOk(accumulator[encoded]);
            // add it to accumulator
            accumulator[encoded] = true;
        }

        done();
    });


    it('should support base-n', function() {

        // binary tests
        var b2 = baseN.create({
            base: 2
        });

        assert.equal(b2.encode(1), '1');
        assert.equal(b2.encode(3), '11');
        assert.equal(b2.encode(8), '1000');
        assert.equal(b2.encode(9), '1001');
    });


    it('should support base-n with arbitrary characters', function() {

        // binary tests
        var b2 = baseN.create({
            characters: '_-'
        });

        assert.equal(b2.encode(1), '-');
        assert.equal(b2.encode(3), '--');
        assert.equal(b2.encode(8), '-___');
        assert.equal(b2.encode(9), '-__-');
    });
});
