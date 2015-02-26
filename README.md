## Intro

`file-composer` is a templating engine for the filesystem.

You can include multiple files into another at inserting points.

Supports multilevel include and parameters replacement.

## Example

```
#file main.txt
Foo
    !include(file1.txt, {values: {param1: "Baz"}})

#file file1.txt
Bar
{{ param1 }}

#output.txt
Foo
    Bar
    Baz
```

[Complete example](https://github.com/thegameofcode/file-composer/tree/master/examples/times_table_example)

[More examples](https://github.com/IGZJavierPerez/file-composer/blob/master/test/test.js)

## To install

```bash
npm install -g file-composer
```

## To use

```bash
file-composer -i example/main.txt -o example/output.txt --base=example
```

Or to replace defined params:

```bash
file-composer -i example/main.txt -o example/output.txt --base=example -v param1:123
```


## To use as a dependency

```bash
npm install --save-dev file-composer
```

```javascript
var fileComposer = require('file-composer');

fileComposer.render({
	i: './example/main.txt',
	o: './example/output.txt',
	b: './example'
});
```

