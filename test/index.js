'use strict';

// external files
const assert = require('chai').assert;
const exec = require('child_process').exec;
const path = require('path');

// internal files
const baseN = require('../lib');

describe('baseN', function () {
    describe('constructor assertions', function () {
        it('should throw when characters option is not an array', function () {
            assert.throws(
                function () {
                    baseN.create({
                        characters: '123',
                    });
                },
                Error,
                '`characters` option must be an array of string'
            );
        });

        it('should throw when characters option is not array of string', function () {
            assert.throws(
                function () {
                    baseN.create({
                        characters: [1, 2, 3],
                    });
                },
                Error,
                '`characters` option must be an array of string'
            );
        });

        it('should throw when characters option is empty array', function () {
            assert.throws(
                function () {
                    baseN.create({
                        characters: [],
                    });
                },
                Error,
                '`characters` option cannot be empty'
            );
        });

        it('should throw when characters option is inconsistent length', function () {
            assert.throws(
                function () {
                    baseN.create({
                        characters: ['1', '23', '4'],
                    });
                },
                Error,
                '`characters` options are of inconsistent length: `23` is not 1 characters long'
            );
        });

        it('should throw when length option is not an integer', function () {
            assert.throws(
                function () {
                    baseN.create({
                        length: 'a',
                    });
                },
                Error,
                '`length` option must be an integer'
            );
        });

        it('should throw when length option is not an integer', function () {
            assert.throws(
                function () {
                    baseN.create({
                        base: 'a',
                    });
                },
                Error,
                '`base` option must be an integer'
            );
        });
    });

    describe('Javascript API', function () {
        it('should find correct fixed length', function () {
            let b64;
            // 64
            // 4096
            // 262144
            // 16777216
            b64 = baseN.create({
                max: 63,
            });
            assert.equal(b64.length, 1);

            b64 = baseN.create({
                max: 64,
            });
            assert.equal(b64.length, 2);

            b64 = baseN.create({
                max: 4096,
            });
            assert.equal(b64.length, 3);

            b64 = baseN.create({
                max: 262144,
            });
            assert.equal(b64.length, 4);
        });

        it('should generate fixed length string', function () {
            let x;
            let b64;

            b64 = baseN.create({
                length: 5,
            });
            x = b64.encode(5);
            assert.isString(x);
            assert.lengthOf(x, 5);

            b64 = baseN.create({
                length: 2,
            });
            x = b64.encode(5);
            assert.isString(x);
            assert.lengthOf(x, 2);

            // can also fix length by giving a max integer value allowed.
            // this should be two characters. (64^2)
            b64 = baseN.create({
                max: 4095,
            });
            x = b64.encode(5);
            assert.isString(x);
            assert.lengthOf(x, 2);
        });

        it('should symmetric encode/decode', function (done) {
            this.timeout(60000);

            const b64 = baseN.create({
                max: 1000000,
            });
            const accumulator = {};

            for (let i = 0; i < 1000000; i++) {
                const encoded = b64.encode(i);
                const decoded = b64.decode(encoded);

                // ensure symmetrical encoding/decoding
                assert.equal(decoded, i);
                // ensure this encoded value is unique and not seen yet
                assert.notOk(accumulator[encoded]);
                // add it to accumulator
                accumulator[encoded] = true;
            }

            done();
        });

        it('should support base-n', function () {
            // binary tests
            const b2 = baseN.create({
                base: 2,
            });

            assert.equal(b2.encode(1), '1');
            assert.equal(b2.encode(3), '11');
            assert.equal(b2.encode(8), '1000');
            assert.equal(b2.encode(9), '1001');
        });

        it('should support base-n with arbitrary characters', function () {
            // binary tests
            const b2 = baseN.create({
                characters: ['_', '-'],
                base: 2,
            });

            assert.equal(b2.encode(1), '-');
            assert.equal(b2.encode(3), '--');
            assert.equal(b2.encode(8), '-___');
            assert.equal(b2.encode(9), '-__-');
        });
    });

    describe('multi-character encoding', function () {
        // create base128 instance with multi character dictionary
        const b128 = baseN.create({
            characters: [...Array(128).keys()].map((k) =>
                ('0' + k.toString(16)).slice(-2)
            ),
        });

        it('encode an int with two character dictionary', function () {
            assert.deepEqual(b128.encode(32), '20');
            assert.deepEqual(b128.encode(64), '40');
            assert.deepEqual(b128.encode(128), '0100');
            assert.deepEqual(b128.encode(256), '0200');
            assert.deepEqual(b128.encode(4096), '2000');
            assert.deepEqual(b128.encode(1048576), '400000');
        });

        it('decode an int with two character dictionary', function () {
            assert.deepEqual(b128.decode('20'), 32);
            assert.deepEqual(b128.decode('40'), 64);
            assert.deepEqual(b128.decode('0100'), 128);
            assert.deepEqual(b128.decode('0200'), 256);
            assert.deepEqual(b128.decode('2000'), 4096);
            assert.deepEqual(b128.decode('400000'), 1048576);
        });
    });

    describe('CLI', function () {
        const cliPath = path.join(__dirname, '../bin/cli.js');

        it('should encode', function (done) {
            exec(cliPath + ' encode 11', function (err, stdout, stderr) {
                assert.ifError(err);
                // replace all new lines in output
                const parsedOut = stdout.replace('\n', '');
                assert.equal(parsedOut, 'b');
                done();
            });
        });

        it('should decode', function (done) {
            exec(cliPath + ' decode a', function (err, stdout, stderr) {
                assert.ifError(err);
                // replace all new lines in output
                const parsedOut = stdout.replace('\n', '');
                assert.equal(parsedOut, '10');
                done();
            });
        });

        it('should encode and decode with custom characters', function (done) {
            const cmd = cliPath + ' encode 11 --characters=a --characters=b';
            exec(cmd, function (err, stdout, stderr) {
                assert.ifError(err);
                // replace all new lines in output
                const parsedOut = stdout.replace('\n', '');
                assert.equal(parsedOut, 'babb');
                done();
            });
        });
    });

    describe('Error cases', function () {
        it('should throw when generating string larger than allowed length', function () {
            let b64;

            b64 = baseN.create({
                length: 2,
            });

            // 2 characters is 64^2 = 4096 max (0 based)
            assert.doesNotThrow(function () {
                b64.encode(4095);
            });
            assert.throws(function () {
                b64.encode(4096);
            });

            b64 = baseN.create({
                max: 4095,
            });

            assert.doesNotThrow(function () {
                b64.encode(4095);
            });
            assert.throws(function () {
                b64.encode(4096);
            }, RangeError);
        });

        it('should throw when encoding negative integers', function () {
            const b64 = baseN.create();

            assert.throws(function () {
                b64.encode(-1);
            }, RangeError);
        });

        it('should throw when encoding non integers', function () {
            const b64 = baseN.create();

            assert.throws(function () {
                b64.encode('hello');
            }, TypeError);
        });

        it('should throw when decoding unknown character', function () {
            const b64 = baseN.create();

            assert.throws(function () {
                b64.decode('$');
            });
        });

        it('should throw when value exceeds max supported Number value in JS', function () {
            const b64 = baseN.create();

            assert.throws(function () {
                b64.decode('-----------');
            }, RangeError);
        });

        it('should throw when both max and length are specified in options', function () {
            assert.throws(function () {
                baseN.create({
                    max: 1000,
                    length: 2,
                });
            });
        });
    });
});
