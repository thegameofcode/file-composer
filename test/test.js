var sinon = require('sinon');
var test = require('./util').test;
var fs = require('fs');

describe('file-composer tests', function () {
  beforeEach(function () {
    sinon.stub(fs, 'readFileSync');
    sinon.stub(fs, 'writeFile');
    sinon.stub(console, 'log');
  });

  afterEach(function () {
    fs.readFileSync.restore();
    fs.writeFile.restore();
    console.log.restore();
  });

  describe('include tests', function () {
    it('should generate an empty output file when the input is empty', function () {
      test('', '');
    });

    it('should be equals the output file to the input file when there is no includes', function () {
      test('Foo', 'Foo');
    });

    it('should include a one level file', function () {
      test('Foo!include(level1)', 'FooBar', {
        level1: 'Bar'
      });
    });

    it('should include a one level empty file', function () {
      test('Foo!include(level1)', 'Foo', {
        level1: ''
      });
    });

    it('should include a one level file (extra spaces are ignored)', function () {
      test('Foo!include  ( levelx  )', 'FooBar', {
        levelx: 'Bar'
      });
    });

    it('should include twice a one level file', function () {
      test('Foo!include(level1)!include(level1)', 'FooBarBar', {
        level1: 'Bar'
      });
    });

    it('should include two files of level 1', function () {
      test('Foo!include(level1a)!include(level1b)', 'FooBarBaz', {
        level1a: 'Bar',
        level1b: 'Baz'
      });
    });

    it('should include files of two levels', function () {
      test('Foo!include(level1)', 'FooBarBaz', {
        level1: 'Bar!include(level2)',
        level2: 'Baz'
      });
    });

    it('should include twice files of two levels', function () {
      test('Foo!include(level1)!include(level1)', 'FooBarBazBazBarBazBaz', {
        level1: 'Bar!include(level2)!include(level2)',
        level2: 'Baz'
      });
    });

    it('should include files of three levels', function () {
      test('Foo!include(level1)', 'FooBarBazQux', {
        level1: 'Bar!include(level2)',
        level2: 'Baz!include(level3)',
        level3: 'Qux'
      });
    });

    it('should include a file of third level multiple times', function () {
      test('Foo!include(level1)!include(level3)', 'FooBarBazQuxQuxQuxQux', {
        level1: 'Bar!include(level2)!include(level3)!include(level3)',
        level2: 'Baz!include(level3)',
        level3: 'Qux'
      });
    });

    it('should include a file of second level multiple times with three levels', function () {
      test('Foo!include(level1)!include(level2)', 'FooBarBazQuxBazQuxBazQux', {
        level1: 'Bar!include(level2)!include(level2)',
        level2: 'Baz!include(level3)',
        level3: 'Qux'
      });
    });
  });

  describe('param tests', function () {

    it('should work with empty params', function () {
      test('Foo!include(level1,{values:{}})', 'FooBar', {
        level1: 'Bar'
      });
    });

    it('should replace one param at first level file', function () {
      test('Foo!include(level1, { values: { param1:"Baz" }})', 'FooBarBaz', {
        level1: 'Bar{{ param1 }}'
      });
    });

    it('should replace one param twice at first level file', function () {
      test('Foo!include(level1, { values: { param1:"Baz" }})', 'FooBarBazBaz', {
        level1: 'Bar{{ param1 }}{{param1}}'
      });
    });

    it('should replace two params at first level file', function () {
      test('Foo!include(level1, { values: { param1:"Baz", param2: "Qux" }})', 'FooBarBazQux', {
        level1: 'Bar{{ param1 }}{{ param2 }}'
      });
    });

    it('should use the default value when the param is not passed (extra spaced are ignored)', function () {
      test('Foo!include(level1, { values: { param1:"Baz"}})', 'FooBarBazQux', {
        level1: 'Bar{{ param1 }}{{ param2 || Qux }}'
      });
    });

    it('should clean the param when it is not passed and there is no a default value', function () {
      test('Foo!include(level1)', 'FooBar', {
        level1: 'Bar{{ param1 }}'
      });
    });

    it('should replace one param at second level file', function () {
      test('Foo!include(level1)', 'FooBarBazQux', {
        level1: 'Bar!include(level2, { values: { param1:"Qux" }})',
        level2: 'Baz{{ param1 }}'
      });
    });

    it('should replace when the same file is included twice with different param values', function () {
      test('Foo!include(level1, { values: { param1:"Baz" }})!include(level1, { values: { param1:"Qux" }})', 'FooBarBazBarQux', {
        level1: 'Bar{{ param1 }}'
      });
    });

    it('should replace when the same file is included twice from diferents files with different param values', function () {
      test('Foo!include(level1a)!include(level1b)!include(level1c)', 'FooLevel1aLevel2BarLevel1bLevel2BazLevel1cLevel2Qux', {
        level1a: 'Level1a!include(level2, { values: { param1: "Bar"} })',
        level1b: 'Level1b!include(level2, { values: { param1: "Baz"} })',
        level1c: 'Level1c!include(level2)',
        level2: 'Level2{{param1 || Qux }}'
      });
    });

    it('should work when the parameter is passed from top level to second level (bypass the first level) ', function () {
      test('Foo!include(level1, { values: { param1: "Qux"}})', 'FooBarBazQux', {
        level1: 'Bar!include(level2)',
        level2: 'Baz{{param1 }}'
      });
    });

    it('should prior parameter from higher levels', function () {
      test('Foo!include(level1, { values: { param1: "Baz"}})', 'FooBarBaz', {
        level1: 'Bar!include(level2, { values: { param1: "Qux"}})',
        level2: '{{ param1 }}'
      });
    });

    it('should prior command line arguments', function () {
      test('Foo!include(level1, { values: { param1: "Qux"}})', 'FooBarBaz', {
        level1: 'Bar!include(level2)',
        level2: '{ { param1 } }'
      }, {
        v: 'param1:Baz'
      });

    });

    it('should replace one param inside other param at first level file', function () {
      test('Foo!include(level1, { values: { param1:"Baz", param2: "{{param1}}" }})', 'FooBarBaz', {
        level1: 'Bar{{ param2 }}'
      });
    });

    it('should replace one param inside other compose param at first level file', function () {
      test('Foo!include(level1, { values: { paramX:"Baz", paramY: "{{paramX}}{{paramX}}FooBar" }})', 'FooBarBazBazFooBar', {
        level1: 'Bar{{ paramY || Foo }}'
      });
    });

    it('should replace one param inside other param at second level file', function () {
      test('Foo!include(level1, { values: { param1:"Baz", param2: "{{param1}}" }})', 'FooBarBaz', {
        level1: '!include(level2)',
        level2: 'Bar{{ param2 }}'
      });
    });

    it('should replace one param inside other param at second level file (the inside param is defined at second level)', function () {
      test('Foo!include(level1, { values: { param1:"Baz"}})', 'FooBarBaz', {
        level1: '!include(level2, { values: {param2: "{{param1}}" }})',
        level2: 'Bar{{ param2 }}'
      });
    });

    it('should replace one param inside other param inside other parem at first level file', function () {
      test('Foo!include(level1, { values: { param1:"Baz", param2: "{{param1}}", param3: "{{param2}}" }})', 'FooBarBaz', {
        level1: 'Bar{{ param3 }}'
      });
    });

    describe('space and lineBreak tests', function () {
      it('should keep spaces of top file', function () {
        test('Foo !include(level1)', 'Foo Bar', {
          level1: 'Bar'
        });
      });
      it('should keep spaces of top file in all lines', function () {
        test('Foo !include(level1)', 'Foo Bar\n Baz', {
          level1: 'Bar\nBaz'
        });
      });
      it('should keep spaces of include files', function () {
        test('Foo!include(level1)', 'Foo Bar', {
          level1: ' Bar'
        });
      });
      it('should keep lineBreaks of top file', function () {
        test('Foo\n!include(level1)', 'Foo\nBar', {
          level1: 'Bar'
        });
      });
      it('should keep lineBreaks of include files', function () {
        test('Foo!include(level1)', 'Foo\nBar', {
          level1: '\nBar'
        });
      });
      it('should add spaces acording to spaces parameter', function () {
        test('Foo!include(level1, {spaces: 1})', 'Foo Bar', {
          level1: 'Bar'
        });
      });
      it('should add spaces to all lines acording to spaces parameter', function () {
        test('Foo!include(level1, {spaces: 2})', 'Foo  Bar\n  Baz', {
          level1: 'Bar\nBaz'
        });
      });
      it('should add lineBreak lines acording to lineBreaks parameter', function () {
        test('Foo!include(level1, {lineBreaks: 1})', 'Foo\nBar', {
          level1: 'Bar'
        });
      });
      it('should add lineBreak lines only at begining of the included file', function () {
        test('Foo!include(level1, {lineBreaks: 1})', 'Foo\nBar\nBaz', {
          level1: 'Bar\nBaz'
        });
      });
      it('should add lineBreak lines and spaces in one case', function () {
        test('Foo!include(level1, {spaces: 1, lineBreaks: 1})', 'Foo\n Bar', {
          level1: 'Bar'
        });
      });
      it('should add lineBreak lines and spaces in multilevel case', function () {
        test('Foo!include(level1, {spaces: 1, lineBreaks: 1})', 'Foo\n Bar\n  Baz', {
          level1: 'Bar!include(level2, {spaces: 1, lineBreaks: 1})',
          level2: 'Baz'
        });
      });
      it('should add params to existing spaces in all lines', function () {
        test('Foo\n  !include(level1, {spaces: 2})', 'Foo\n    Bar\n    Baz', {
          level1: 'Bar\nBaz'
        });
      });
    });
    describe('times tests', function () {
      it('should repeat the include twice', function () {
        test('Foo!include(level1, {times: 2})', 'FooBarBar', {
          level1: 'Bar'
        });
      });
      it('should repeat the include four times', function () {
        test('Foo!include(level1, {times: 4})', 'FooBarBarBarBar', {
          level1: 'Bar'
        });
      });

      it('should repeat spaces and lineBreaks twice', function () {
        test('Foo!include(level1, {times: 2, spaces: 2, lineBreaks: 1})', 'Foo\n  Bar\n  Bar', {
          level1: 'Bar'
        });
      });
      it('should repeat twice include files of three levels', function () {
        test('Foo!include(level1, {times: 2})', 'FooBarBazQuxBarBazQux', {
          level1: 'Bar!include(level2)',
          level2: 'Baz!include(level3)',
          level3: 'Qux'
        });
      });
      it('should repeat twice include files of three levels (with times:2 parameter)', function () {
        test('Foo!include(level1, {times: 2})', 'FooBarBazQuxQuxBazQuxQuxBarBazQuxQuxBazQuxQux', {
          level1: 'Bar!include(level2, {times: 2})',
          level2: 'Baz!include(level3, {times: 2})',
          level3: 'Qux'
        });
      });
      it('should replace twice the include param', function () {
        test('Foo!include(level1, {times:2, values: { param1:"Baz" }})', 'FooBarBazBarBaz', {
          level1: 'Bar{{ param1 }}'
        });
      });
    });
    describe('param expression tests', function () {
      it('should eval a simple expression', function () {
        test('Foo!eval(1 + 4)_eval', 'Foo5');
      });
      it('should eval a complex arithmetic expression', function () {
        test('Foo!eval(2 * (4 + 1) )_eval', 'Foo10');
      });
      it('should eval a simple function expression call', function () {
        test('Foo!eval((function() { return 1 + 4 ; })() )_eval', 'Foo5');
      });
      it('should eval two simple expressions', function () {
        test('Foo!eval(1 + 4)_eval!eval(3 * 5)_eval', 'Foo515');
      });
      it('should eval core JavaScript functions', function () {
        test('Foo!eval([1, 2, 3].join(""))_eval', 'Foo123');
      });
      it('should eval in one level expressions', function () {
        test('Foo !include(level1)', 'Foo 6', {
          level1: '!eval(2 + 4)_eval'
        });
      });
      it('should eval in one level expressions with params', function () {
        test('Foo !include(level1, { values: {value1: 1, value2: 5} })', 'Foo 6', {
          level1: '!eval({{ value1 }} + {{ value2 }})_eval'
        });
      });
    });
    describe('param function generator', function () {
      it('should include values until the generator is exhausted', function () {
        test('Foo!include(level1, { values: {fruit: "{{!fruitGen}}" }})', 'FooAppleOrangePear', {
          level1: '{{fruit}}'
        });
      });
      it('can receive parameters', function () {
        test('Foo!include(level1, { values: {fruit: "{{!each Apple Orange Pear}}" }})', 'FooAppleOrangePear', {
          level1: '{{fruit}}'
        });
      });
      it('can receive parameters at second level', function () {
        test('Foo!include(level1, { values: {fruit: "{{!each Apple Orange Pear}}" }})', 'FooAppleOrangePear', {
          level1: '!include(level2)',
          level2: '{{fruit}}'
        });
      });
      it('can use evaluable expressions', function () {
        test('Foo!include(level1, { values: {fruit: "{{!each Apple Orange Pear}}" }})', 'FooApple1Orange1Pear1', {
          level1: '!include(level2)',
          level2: '!eval("{{fruit}}1")_eval'
        });
      });
      it('can receive parameterized parameters at second level', function () {
        test('Foo!include(level1, {values: { anotherFruit: "Melon" } })', 'FooAppleOrangePearMelon', {
          level1: '!include(level2, { values: {fruit: "{{!each Apple Orange Pear {{anotherFruit}} }}" }})',
          level2: '{{fruit}}'
        });
      });
      it('should use multiple gens in the same level', function () {
        test('Foo!include(level1, { values: {fruit: "{{!each Apple Orange Pear}}{{!each 1 2 3}}" }})', 'FooAppleOrangePear123', {
          level1: '{{fruit}}'
        });
      });
      it('should make a cross product when multiple generators are used in different levels (version 1)', function () {
        test('Foo!include(level1, { values: {fruit: "{{!each Apple Orange Pear}}" }})', 'FooApple123Orange123Pear123', {
          level1: '{{fruit}}!include(level2, { values: {number: "{{!each 1 2 3}}" }})',
          level2: '{{number}}'
        });
      });
      it('should make a cross product when multiple generators are used in different levels (version 2)', function () {
        test('Foo!include(level1, { values: {fruit: "{{!each Apple Orange Pear}}" }})', 'FooApple1Apple2Apple3Orange1Orange2Orange3Pear1Pear2Pear3', {
          level1: '!include(level2, { values: {number: "{{!each 1 2 3}}" }})',
          level2: '{{fruit}}{{number}}'
        });
      });
    });
  });
  describe('test conditional include with if', function () {
    it('should not include when "if" parameter is false', function () {
      test('Foo!include(level1, { if: false })', 'Foo', {
        level1: 'Bar'
      });
    });
  
    it('should not include when "if" parameter is true', function () {
      test('Foo!include(level1, { if: true })', 'FooBar', {
        level1: 'Bar'
      });
    });
    it('should not include when "if" expression is false', function () {
      test('Foo!include(level1, { if: "4 * 2 % 2 !== 0" })', 'Foo', {
        level1: 'Bar'
      });
    });
    it('should include when "if" expression is true', function () {
      test('Foo!include(level1, { if: "4 * 2 % 2 === 0" })', 'FooBar', {
        level1: 'Bar'
      });
    });
    it('should not include when "if" expression is falsy', function () {
      test('Foo!include(level1, { if: "NaN" })', 'Foo', {
        level1: 'Bar'
      });
    });
    it('should include when "if" expression is truthy', function () {
      test('Foo!include(level1, { if: 1 })', 'FooBar', {
        level1: 'Bar'
      });
    });
    it('should not include when "if" is a false param value', function () {
      test('Foo!include(level1, { if: "{{inc}}", values: { inc: "false"}})', 'Foo', {
        level1: 'Bar'
      });
    });
    it('should include when "if" is a true param value', function () {
      test('Foo!include(level1, { if: "{{inc}}", values: { inc: "true"}})', 'FooBar', {
        level1: 'Bar'
      });
    });
    it('should not include when "if" is a faly param value', function () {
      test('Foo!include(level1, { if: "{{inc}}", values: { inc: "NaN"}})', 'Foo', {
        level1: 'Bar'
      });
    });
    it('should include when "if" is a truthy param value', function () {
      test('Foo!include(level1, { if: "{{inc}}", values: { inc: 1}})', 'FooBar', {
        level1: 'Bar'
      });
    });
    it('should work with generator values', function () {
      test('Foo!include(level1, { if: "{{number}} % 2 == 0", values: { number: "{{!each 1 2 3 4 5 6 7 8 9 10}}" }})', 'FooBar2Bar4Bar6Bar8Bar10', {
        level1: 'Bar{{number}}'
      });
    });
    it('should work with generator values and multiple params', function () {
      test('Foo!include(level1, { if: "{{number}} % {{div}} == 0", values: {div: 2, number: "{{!each 1 2 3 4 5 6 7 8 9 10}}" }})', 'FooBar2Bar4Bar6Bar8Bar10', {
        level1: 'Bar{{number}}'
      });
    });
  });
});
