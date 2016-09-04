var util = require('util'),
    events = require('events');

var ElasticseachReporter = function ( baseReporter, config) {

    var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
    this.baseReporter = baseReporter;
    this.config = config;
    this.options = options;

    this.on('start', function() {
        //console.log(this);
    });

    this.on('end', function() {
        //console.log('end',arguments);
    });

    this.on('suite:start', function(suite) {
      
      //console.log('suite:start',suite);
    });

    this.on('suite:end', function(suite) {
        //console.log('suite:end',suite);
    });

    this.on('test:start', function(test) {
        //console.log('test:start',test);
    });

    this.on('test:end', function(test) {
        //console.log('test:end',test);
    });

    this.on('hook:start', function() {
        //console.log('hook:start',arguments);
    });

    this.on('hook:end', function() {
        //console.log('hook:end',arguments);
    });

    this.on('test:pass', function() {
        //console.log('test:pass',arguments);
    });

    this.on('test:fail', function() {
        //console.log('test:fail',arguments);
    });

    this.on('test:pending', function() {
        //console.log('test:pending',arguments);
    });
    
   this.on('runner:start', function (runner) {
       //this.runner = runner;
       //console.log('runner:start',runner)
   })    
   this.on('runner:end', function (runner) {
       //console.log('runner:end',runner);
       //delete this.runner;
   })    
};

ElasticseachReporter.reporterName='ElasticseachReporter';

/**
 * Inherit from EventEmitter
 */
util.inherits(ElasticseachReporter, events.EventEmitter);



/**
 * Expose Custom Reporter
 */
exports = module.exports = ElasticseachReporter;