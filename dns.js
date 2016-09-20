function ptr_lookup(address, callback) {

  var ff = function(data) {
    var q = data["Question"][0]["name"];
    var a = data["Answer"][0]["data"];
    callback(q, a);
  }

  $.get( "https://dns.google.com/resolve", { name: address, type: "PTR" }, ff, "json");
}
