var path = require('path');

var basePath = './';
var options = {};

var fs = require('fs');

function searchPattern(pattern, include, fn) {
  var search;
  while ((search = pattern.exec(include.output)) !== null) {
    include = fn(include, search);
  }
  return include;
}

function searchIncludes(include) {
  var includePattern = /([ ]*)!include\s*\(\s*([^)]+)\s*\)/g;
  return searchPattern(includePattern, include, function(include, search) {
    try {
        var includeParams = getIncludeParams(search[2]);
        includeParams.params.spaces = includeParams.params.spaces || 0;
        includeParams.params.spaces += search[1].length;
      } catch (e) {
        var line = findLineNumber(include.output, search[0]);
        throw new Error('Malformed include: ' + search[0] + ' at line ' + line.number + ' of ' + include.fileName + '[' + line.text + ']' + ' Error: ' + e);
      }
      addFile(include, path.join(basePath, includeParams.fileName), {
        index: includePattern.lastIndex,
        fileOwner: include.fileName,
        stringToReplace: search[0],
        includeParams: includeParams.params
      });
      return include;
  });
}

function findLineNumber(contents, string) {
  var lines = contents.split('\n');
  for (var i = 0; i < lines.length; i++) {
    if (lines[i].indexOf(string) !== -1) {
      return {
        text: lines[i],
        number: i + 1
      };
    }
  }
}

function getIncludeParams(match) {
  var fileName = match.replace(/,.+/, '').trim();
  var params = match.match(/,(.+)/);
  var addQuotesPattern = /(['"])?([a-zA-Z0-9_]+)(['"])?:/g;

  return {
    fileName: fileName,
    params: params ? JSON.parse(params[1].replace(addQuotesPattern, '"$2": ')) : {}
  };

}

function getInclude(include, fileName) {
  if (!include) {
    return null;
  }

  if (include.fileName === fileName) {
    return include;
  } else {
    var i = 0;
    var childInclude = null;
    while (!childInclude && i < include.children.length) {
      childInclude = getInclude(include.children[i].node, fileName);
      i++;
    }
    return childInclude;
  }
}

function addIncludeChild(parent, child, position) {
  parent.children.push({
    node: child,
    position: position
  });
}

function addFile(parent, fileName, options) {
  var include = getInclude(parent, fileName);
  if (!include) {
    var input = fs.readFileSync(fileName, 'utf8');
    include = {
      fileName: fileName,
      children: [],
      output: input
    };
    searchIncludes(include);
  }
  if (options) {
    addIncludeChild(parent, include, options);
  }

  return include;
}

function replacePattern(string, pattern, value) {
  var search;
  var result = string;
  while ((search = pattern.exec(result)) !== null) {
    var replacement = value !== undefined ? value(search) : search[1];
    replacement = replacement.trim();

    result = replaceString(result, pattern.lastIndex - search[0].length, search[0].length, replacement);
    pattern.lastIndex = pattern.lastIndex + (replacement.length - search[0].length);
  }

  return result;
}

function replaceDefaultValues(include) {
    var result = include.output;
  result = replacePattern(result, /{{[^|]*\|\|\s*([^}]+)\s*}}/g); //default values
  result = replacePattern(result, /{{.*?}}/g, function() { return ''; }); //clean non passed values
  include.output = result;

  return result;
}

function replaceValues(string, values) {
  var result = string;
  var i;

  if (options.v) {
    var argValues = Array.isArray(options.v) ? options.v : [options.v];
    for (i = 0; i < argValues.length; i++) {
      var key = argValues[i].substring(0, argValues[i].indexOf(':'));
      var value = argValues[i].substring(argValues[i].indexOf(':') + 1);
      result = replacePattern(result, new RegExp('{{\\s*' + key + '\\s*[^}]*}}', 'g'), function() { return value; });
    }
  }

  if (values) {
    for (var key in values) {
      result = replacePattern(result, new RegExp('{{\\s*' + key + '\\s*[^}]*}}', 'g'), function() { return '{{' + key + '||' + values[key] + '}}'; });
    }
  }
  return result;
}



function addLineBreaks(string, lineBreaks) {
  var result = string;
  if (lineBreaks) {
    for (var i = 0; i < lineBreaks; i++) {
      result = '\n' + result;
    }
  }
  return result;
}

function addSpaces(string, numSpaces) {
  var result = string;
  var spaces = '';

  if (numSpaces) {
    for (var i = 0; i < numSpaces; i++) {
      spaces += ' ';
    }
    result = result.replace(/(^|\n)/g, '\$1' + spaces);
  }
  return result;
}

function renderInclude(string, params) {
  var result = string;

  if (!params) {
    return result;
  }

  result = replaceValues(result, params.values);
  result = addSpaces(result, params.spaces);
  result = addLineBreaks(result, params.lineBreaks);

  var times = params.times || 1;
  var i = 0;
  render = '';
  for (; i < times; i++) {
    render += result;
  }

  return render;
}

function replaceInclude(destiny, replacement, position) {
  var compiledReplacement = renderInclude(replacement.output, position.includeParams);
  destiny.output = replaceString(destiny.output, position.index - position.stringToReplace.length, position.stringToReplace.length, compiledReplacement);
}

function replaceString(string, position, length, replacement) {
  return string.substring(0, position) + replacement + string.substring(position + length);
}

function printInclude(include, indent, position) {
  indent = indent || 0;
  var i;
  var s = '';
  for (i = 0; i < indent; i++) {
    s += ' ';
  }
  for (i = 0; i < include.children.length; i++) {
    printInclude(include.children[i].node, indent + 1, include.children[i].position.index);
  }
  console.log(s + include.fileName, position);
}


function replaceAllIncludes(replacement, destiny, position) {
  while (replacement.children.length > 0) {
    var nextReplacement = replacement.children.splice(replacement.children.length - 1, 1)[0];
    replaceAllIncludes(nextReplacement.node, replacement, nextReplacement.position);
  }

  if (destiny) {
    replaceInclude(destiny, replacement, position);
  }
}

function evalExpressions(include) {
  var evalPattern = /!eval\s*\(\s*(.+?)\s*\)!lave/g;
  include.output = replacePattern(include.output, evalPattern, function(search) {
    return eval(search[1]).toString();
  });
  
  return include;
}


function writeOutput(includes, outputFileName) {
  var output = includes.output;
  console.log('Writing results to ' + outputFileName + ' ...');
  fs.writeFile(outputFileName, output, function (err) {
    if (err) {
      throw err;
    }
    console.log('Done!');
  });
}

function render(argv) {

  basePath = argv.b || basePath;

  var inputFileName = argv.i;
  var outputFileName = argv.o;

  options = argv;
  var includes = addFile(null, inputFileName);
  replaceAllIncludes(includes);
  replaceDefaultValues(includes);
  evalExpressions(includes);
  writeOutput(includes, outputFileName);
}

module.exports = {
  render: render
};