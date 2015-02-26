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

module.exports = {
  rangeGen: rangeGen
};