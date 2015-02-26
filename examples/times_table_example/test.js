var fileComposer = require('../../lib/file-composer');

fileComposer.render({
	i: __dirname + '/main.txt',
	o:  __dirname + '/output.txt',
  b:  __dirname,
  v: ['from:1', 'to:10'],
  f: __dirname + '/gen.js'
});
