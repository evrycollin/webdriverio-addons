/**
*
* call WebService to generate random user 
*/

request  = require('sync-request');

module.exports = function( options ) {
  // call Webservice https://randomuser.me/api/?results=XX
  var url = 'https://randomuser.me/api/?';
  for( var param in options ) {
    url += param + '=' + encodeURI(options[param]) + '&'
  }
  console.log("> generating random users",options, url);
  var res = request('GET', url).getBody().toString('utf8');
  return JSON.parse(res).results;
    
}