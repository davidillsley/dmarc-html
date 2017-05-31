  var counts = {};

  function handleFileSelect(evt) {
    var files = evt.target.files; // FileList object

    // files is a FileList of File objects. List some properties.
    var output = [];
    for (var i = 0, f; f = files[i]; i++) {
      output.push('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ',
                  f.size, ' bytes, last modified: ',
                  f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a',
                  '</li>');

      var file_to_xml = require('./filetoxml.js');
      file_to_xml(f, processDocument);
    }
    document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>';
  }

  function processDocument(documentAsString) {
    var xmlDoc = $.parseXML( documentAsString );
    var $xml = $(xmlDoc);
    var orgname = $xml.find("report_metadata org_name").text();
    var reportid = $xml.find("report_metadata report_id").text();
    console.log(orgname);

    console.log(reportid);

    var records = $xml.find("record");
    console.log(records.length);

    var ds = [];

    for( var i =0; i < records.length; i++) {

      var sourceip = $(records[i]).find("row source_ip").text();

      var inarpa = "";
      if(sourceip.includes(":")){
        var blocks = sourceip.split(":");
        var composed = "";
        for(a in blocks) {
          var padded = "0000"+blocks[a];
          var trimmed = padded.substring(padded.length-4);
          if (trimmed === "0000") {
            console.log("multed");
            trimmed = "0000".repeat(8-blocks.length+1);
            console.log(trimmed);
          }
          composed = composed+trimmed;
        }
        inarpa = composed.split("").reverse().join(".")+".ip6.arpa";
      } else {
        inarpa = sourceip.split(".").reverse().join(".")+".in-addr.arpa";
      }

      var count = $(records[i]).find("row count").text();
      var disposition = $(records[i]).find("row policy_evaluated disposition").text();
      var rowdkim = $(records[i]).find("row policy_evaluated dkim").text();
      var rowspf = $(records[i]).find("row policy_evaluated spf").text();

      var headerfrom = $(records[i]).find("identifiers header_from").text();

      var details = counts[headerfrom] || { pass:0, fail: 0, quarantine: 0, reject: 0};

      if(rowdkim === "pass" || rowspf === "pass"){
        details.pass += parseInt(count);
      } else{
        details.fail += parseInt(count);
      }

      if(disposition === "quarantine") {
        details.quarantine += parseInt(count);
      } else if(disposition === "reject") {
        details.reject += parseInt(count);
      }

      counts[headerfrom] = details;

      ds.push([headerfrom, sourceip, inarpa, count, disposition, rowdkim, rowspf]);
    }
    for(i in ds){
      var td = $("<tr class="+ds[i][4]+"></tr>");
      for(j in ds[i]){
        if( j == 1 ){
          var cellid = ds[i][2].replace(/\./gi,"");
          td.append("<td id='cell"+cellid+"' class='address"+cellid+" "+ds[i][4]+"'>"+ds[i][j]+"</td>")
        } else if (j ==2 ) {
          // var cellid = ds[i][2].replace(/\./gi,"");
          // td.append("<td id='cell"+cellid+"' class='address"+cellid+" "+ds[i][4]+"'>"+ds[i][j]+"</td>")
        }else {
          td.append("<td id='cell"+i+""+j+"' class="+ds[i][4]+">"+ds[i][j]+"</td>");
        }
      }
      var ptr_lookup = require("./dns.js");
      ptr_lookup(ds[i][2], function(q, a){
        console.log( "Data Loaded: "+q+ " " + a );
        var addrcell = '.address'+q.replace(/\./gi,"");
        var prev = $(addrcell).text();
        $(addrcell).text(a);
        $(addrcell).attr("title", prev);
      });

      var tablename = "table"+ds[i][0].replace(/\./gi,"");
      if(!$("#"+tablename).length) {
        console.log("Creating section for from domain");
        var table = $('<h2>'+ds[i][0]+'</h2><table id="'+tablename+'" width="100%"><thead><tr><th>From</th><th>Source</th><th>Count</th><th>Disposition</th><th>DKIM</th><th>SPF</th></tr></thead></table>');
        $('#container').append(table);
      }

      $("#"+tablename).append(td);
    }

    $("#counts > tbody:last").children().remove();
    for(i in counts) {
      var td = $("<tr></tr>");
      td.append("<td>"+i+"</td>");
      td.append("<td>"+counts[i].pass+"</td>");
      td.append("<td>"+counts[i].quarantine+"</td>");
      td.append("<td>"+counts[i].reject+"</td>");
      $('#counts').append(td);
    }
  }

  document.getElementById('files').addEventListener('change', handleFileSelect, false);
