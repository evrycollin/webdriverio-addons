
var https = require('https');
var Q = require('q');

/**
*
* call WebService to generate random user 
*/
module.exports = function( count ) {
  var deferred = Q.defer();

  console.log('random-search', count);

  // call Webservice https://randomuser.me/api/?results=XX
    
  https
  .get('https://randomuser.me/api/?results='+count, (res) => {
    console.log('statusCode:', res.statusCode);
  
    res.on('data', (d) => {
      deferred.resolve(JSON.parse(d.toString('utf8')).results);
    });
  
  })
  .on('error', (e) => {
      deferred.reject(e);
  });    
      
  return deferred.promise;
    
}