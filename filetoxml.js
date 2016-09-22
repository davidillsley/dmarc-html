module.exports = function (file, callback) {
  var reader = new FileReader();

  reader.onload = (function(f, c) {
    return function(e) {
      processFile(f, e, c);
    };
  })(file, callback);

  reader.readAsArrayBuffer(file);
}

function processFile(file, event, callback) {
  if(file.name.endsWith(".gz")){
    inflate(event, callback);
  } else if(file.name.endsWith("zip")){
    unzip(event, callback);
  } else {
    decode(event, callback);
  }
}

function inflate(event, callback) {
  console.log("inflate path");
  var pako = require('pako');
  var documentAsString = pako.inflate(event.target.result, {to: 'string'});
  console.log("documentAsString: "+documentAsString);
  callback(documentAsString);
}

function unzip(event, callback) {
  console.log("zip path");
  var JSZip = require("jszip");
  JSZip.loadAsync(event.target.result)
    .then(function(zip) {
      zip.forEach(function (relativePath, zipEntry) {
        zipEntry.async("string")
          .then(function success(content) {
            console.log(content);
            var documentAsString = content;
            console.log("documentAsString: "+documentAsString);
            callback(documentAsString);
          }, function error(e) {
            console.log(e);
          });
        });
      });
}

function decode(event, callback) {
  console.log("decode path");
  var decoder = new TextDecoder("utf-8");
  var documentAsString = decoder.decode(event.target.result);
  console.log("documentAsString: "+documentAsString);
  callback(documentAsString);
}
