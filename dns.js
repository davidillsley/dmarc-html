module.exports = function (address, callback) {
  var request = require('request');
  var options = {
    url: 'https://dns.google.com/resolve',
    qs: {
      type: 'PTR',
      name: address
    }
  };
  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var data = JSON.parse(body);
      var q = data["Question"][0]["name"];
      var a = data["Answer"][0]["data"];
      callback(q, a);
    }
  });
}