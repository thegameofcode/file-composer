function arrayGen(array) {
  var index = 0;
  return {
    done: function() { return index >= array.length; },
    value: function () {
      if (this.done()) {
        throw new Error('Generator is exhausted!');
      }
        
      return array[index++];
    }
  };
}

function fruitGen() {
  return arrayGen(['Apple', 'Orange', 'Pear']);
}

function fruitGen2() {
  return arrayGen([].slice.call(arguments));
}
module.exports = {
  fruitGen: fruitGen,
  fruitGen2: fruitGen2
};