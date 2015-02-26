function rangeGen(from, to, step) {
  from = Number(from) || 0;
  to = Number(to) !== undefined ? to : Infinity;
  step = Number(step) || 1;
  
  return {
    done: function() { return step >= 1 ? from > to : to < from; },
    value: function () {
      if (this.done()) {
        throw new Error('Generator is exhausted!');
      }
      var result = from;
      from += step;
      return result;
    }
  };
}

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

function argsGen() {
  return arrayGen([].slice.call(arguments));
}

module.exports = {
  range: rangeGen,
  arrayGen: arrayGen,
  each: argsGen
};
