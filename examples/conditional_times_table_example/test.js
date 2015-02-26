var fileComposer = require('../../lib/file-composer');

fileComposer.render({
  i: __dirname + '/main.txt',
  b: __dirname,
  v: ['from:1', 'to:10']
});
