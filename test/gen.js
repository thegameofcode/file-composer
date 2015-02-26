var gen = require('../lib/gen');

function fruitGen() {
  return gen.arrayGen(['Apple', 'Orange', 'Pear']);
}
module.exports = {
  fruitGen: fruitGen,
  each: gen.each
};
