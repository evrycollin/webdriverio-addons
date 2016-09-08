var fs = require('fs');
var xlsx = require('node-xlsx');

module.exports = function( file, sheetName ) {

  // load excel
  var workbook = xlsx.parse(fs.readFileSync(file));
  
  // search for sheet
  for( var i in workbook ) {
    var sheet = workbook[i];
    if( sheet.name == sheetName ) {    
      var data = [];
      // parse headers
      var headers = sheet.data[0];
      // parse data
      for( var j in sheet.data ) {
        if( j==0 ) continue;
        var row = sheet.data[j];
        // create object
        var o = {};
        for( var k in headers ) {
          var fieldName = headers[k];
          o[fieldName] = row[k];
        }
        data.push(o);      
      }
    
      return data;
    }
  }
  return null;

}