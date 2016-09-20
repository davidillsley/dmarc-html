
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
      var inarpa = sourceip.split(".").reverse().join(".")+".in-addr.arpa";
      var count = $(records[i]).find("row count").text();
      var disposition = $(records[i]).find("row policy_evaluated disposition").text();
      var rowdkim = $(records[i]).find("row policy_evaluated dkim").text();
      var rowspf = $(records[i]).find("row policy_evaluated spf").text();

      var headerfrom = $(records[i]).find("identifiers header_from").text();

      var details = counts[headerfrom] || { pass:0, fail: 0};

      if(rowdkim === "pass" || rowspf === "pass"){
        details.pass += parseInt(count);
      } else{
        // console.log("'"+rowdkim+"' '"+rowspf)
        details.fail += parseInt(count);
      }

      counts[headerfrom] = details;

      ds.push([headerfrom, sourceip, inarpa, count, disposition, rowdkim, rowspf]);
    }
    for(i in ds){
      var td = $("<tr></tr>");
      for(j in ds[i]){
        if(j !=2 ){
          td.append("<td id='cell"+i+""+j+"'>"+ds[i][j]+"</td>");
        } else {
          var cellid = ds[i][j].replace(/\./gi,"");
          td.append("<td id='cell"+cellid+"' class='address"+cellid+"'>"+ds[i][j]+"</td>")
        }
      }

      ptr_lookup(ds[i][2], function(q, a){
        console.log( "Data Loaded: "+q+ " " + a );
        var addrcell = '.address'+q.replace(/\./gi,"");
        $(addrcell).text(a);
      });

      $('#example').append(td);
    }

    $("#counts > tbody:last").children().remove();
    for(i in counts) {
      var td = $("<tr></tr>");
      td.append("<td>"+i+"</td>");
      td.append("<td>"+counts[i].pass+"</td>");
      td.append("<td>"+counts[i].fail+"</td>");
      $('#counts').append(td);
    }
  }
