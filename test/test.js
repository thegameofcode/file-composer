var sinon = require('sinon');
var test = require('./util').test;
var fs = require('fs');

describe('file-composer tests', function() {
	beforeEach(function() {
		sinon.stub(fs, 'readFileSync');
		sinon.stub(fs, 'writeFile');
		sinon.stub(console, 'log');
	});

	afterEach(function() {
		fs.readFileSync.restore();
		fs.writeFile.restore();
		console.log.restore();
	});

	describe('include tests', function() {
		it('should generate an empty output file when the input is empty', function() {
			test('', '');
		});

		it('should be equals the output file to the input file when there is no includes', function() {
			test('Foo', 'Foo');
		});

		it('should include a one level file', function() {
			test('Foo!include(level1)', 'FooBar', {
				level1: 'Bar'
			});
		});

		it('should include a one level empty file', function() {
			test('Foo!include(level1)', 'Foo', {
				level1: ''
			});
		});

		it('should include a one level file (extra spaces are ignored)', function() {
			test('Foo!include  ( levelx  )', 'FooBar', {
				levelx: 'Bar'
			});
		});

		it('should include twice a one level file', function() {
			test('Foo!include(level1)!include(level1)', 'FooBarBar', {
				level1: 'Bar'
			});
		});

		it('should include two files of level 1', function() {
			test('Foo!include(level1a)!include(level1b)', 'FooBarBaz', {
				level1a: 'Bar',
				level1b: 'Baz'
			});
		});

		it('should include files of two levels', function() {
			test('Foo!include(level1)', 'FooBarBaz', {
				level1: 'Bar!include(level2)',
				level2: 'Baz'
			});
		});

		it('should include twice files of two levels', function() {
			test('Foo!include(level1)!include(level1)', 'FooBarBazBazBarBazBaz', {
				level1: 'Bar!include(level2)!include(level2)',
				level2: 'Baz'
			});
		});

		it('should include files of three levels', function() {
			test('Foo!include(level1)', 'FooBarBazQux', {
				level1: 'Bar!include(level2)',
				level2: 'Baz!include(level3)',
				level3: 'Qux'
			});
		});

		it('should include a file of third level multiple times', function() {
			test('Foo!include(level1)!include(level3)', 'FooBarBazQuxQuxQuxQux', {
				level1: 'Bar!include(level2)!include(level3)!include(level3)',
				level2: 'Baz!include(level3)',
				level3: 'Qux'
			});
		});

		it('should include a file of second level multiple times with three levels', function() {
			test('Foo!include(level1)!include(level2)', 'FooBarBazQuxBazQuxBazQux', {
				level1: 'Bar!include(level2)!include(level2)',
				level2: 'Baz!include(level3)',
				level3: 'Qux'
			});
		});
	});

	describe('param tests', function() {

		it('should work with empty params', function() {
			test('Foo!include(level1,{values:{}})', 'FooBar', {
				level1: 'Bar'
			});
		});

		it('should replace one param at first level file', function() {
			test('Foo!include(level1, { values: { param1:"Baz" }})', 'FooBarBaz', {
				level1: 'Bar{{ param1 }}'
			});
		});

		it('should replace one param twice at first level file', function() {
			test('Foo!include(level1, { values: { param1:"Baz" }})', 'FooBarBazBaz', {
				level1: 'Bar{{ param1 }}{{param1}}'
			});
		});

		it('should replace two params at first level file', function() {
			test('Foo!include(level1, { values: { param1:"Baz", param2: "Qux" }})', 'FooBarBazQux', {
				level1: 'Bar{{ param1 }}{{ param2 }}'
			});
		});

		it('should use the default value when the param is not passed (extra spaced are ignored)', function() {
			test('Foo!include(level1, { values: { param1:"Baz"}})', 'FooBarBazQux', {
				level1: 'Bar{{ param1 }}{{ param2 || Qux }}'
			});
		});

		it('should clean the param when it is not passed and there is no a default value', function() {
			test('Foo!include(level1)', 'FooBar', {
				level1: 'Bar{{ param1 }}'
			});
		});

		it('should replace one param at second level file', function() {
			test('Foo!include(level1)', 'FooBarBazQux', {
				level1: 'Bar!include(level2, { values: { param1:"Qux" }})',
				level2: 'Baz{{ param1 }}'
			});
		});

		it('should replace ok when the same file is included twice with different param values', function() {
			test('Foo!include(level1, { values: { param1:"Baz" }})!include(level1, { values: { param1:"Qux" }})', 'FooBarBazBarQux', {
				level1: 'Bar{{ param1 }}'
			});
		});

		it('should replace ok when the same file is included twice from diferents files with different param values', function() {
			test('Foo!include(level1a)!include(level1b)!include(level1c)', 'FooLevel1aLevel2BarLevel1bLevel2BazLevel1cLevel2Qux', {
				level1a: 'Level1a!include(level2, { values: { param1: "Bar"} })',
				level1b: 'Level1b!include(level2, { values: { param1: "Baz"} })',
				level1c: 'Level1c!include(level2)',
				level2: 'Level2{{param1 || Qux }}'
			});
		});

		it('should work when the parameter is passed from top level to second level (bypass the first level) ', function() {
			test('Foo!include(level1, { values: { param1: "Qux"}})', 'FooBarBazQux', {
				level1: 'Bar!include(level2)',
				level2: 'Baz{{param1 }}'
			});
		});

		it('should prior parameter from higher levels', function() {
			test('Foo!include(level1, { values: { param1: "Baz"}})', 'FooBarBaz', {
				level1: 'Bar!include(level2, { values: { param1: "Qux"}})',
				level2: '{{ param1 }}'
			});
		});

		it('should prior command line arguments', function() {
			test('Foo!include(level1, { values: { param1: "Qux"}})', 'FooBarBaz', {
				level1: 'Bar!include(level2)',
				level2: '{{ param1 }}'
			}, {
				v: 'param1:Baz'
			});
		});

		describe('space and lineBreak tests', function() {
			it('should keep spaces of top file', function() {
				test('Foo !include(level1)', 'Foo Bar', {
					level1: 'Bar'
				});
			});
			it('should keep spaces of top file in all lines', function() {
				test('Foo !include(level1)', 'Foo Bar\n Baz', {
					level1: 'Bar\nBaz'
				});
			});
			it('should keep spaces of include files', function() {
				test('Foo!include(level1)', 'Foo Bar', {
					level1: ' Bar'
				});
			});
			it('should keep lineBreaks of top file', function() {
				test('Foo\n!include(level1)', 'Foo\nBar', {
					level1: 'Bar'
				});
			});
			it('should keep lineBreaks of include files', function() {
				test('Foo!include(level1)', 'Foo\nBar', {
					level1: '\nBar'
				});
			});
			it('should add spaces acording to spaces parameter', function() {
				test('Foo!include(level1, {spaces: 1})', 'Foo Bar', {
					level1: 'Bar'
				});
			});
			it('should add spaces to all lines acording to spaces parameter', function() {
				test('Foo!include(level1, {spaces: 2})', 'Foo  Bar\n  Baz', {
					level1: 'Bar\nBaz'
				});
			});
			it('should add lineBreak lines acording to lineBreaks parameter', function() {
				test('Foo!include(level1, {lineBreaks: 1})', 'Foo\nBar', {
					level1: 'Bar'
				});
			});
			it('should add lineBreak lines only at begining of the included file', function() {
				test('Foo!include(level1, {lineBreaks: 1})', 'Foo\nBar\nBaz', {
					level1: 'Bar\nBaz'
				});
			});
			it('should add lineBreak lines and spaces in one case', function() {
				test('Foo!include(level1, {spaces: 1, lineBreaks: 1})', 'Foo\n Bar', {
					level1: 'Bar'
				});
			});
			it('should add lineBreak lines and spaces in multilevel case', function() {
				test('Foo!include(level1, {spaces: 1, lineBreaks: 1})', 'Foo\n Bar\n  Baz', {
					level1: 'Bar!include(level2, {spaces: 1, lineBreaks: 1})',
					level2: 'Baz'
				});
			});
			it('should add params to existing spaces in all lines', function() {
				test('Foo\n  !include(level1, {spaces: 2})', 'Foo\n    Bar\n    Baz', {
					level1: 'Bar\nBaz'
				});
			});
		});
	});
});