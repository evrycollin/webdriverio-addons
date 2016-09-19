var util = require('util'),
    events = require('events'),
    uuid = require('uuid');

var ElasticseachReporter = function ( baseReporter, config) {
    
    var _this = this;

    var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
    this.baseReporter = baseReporter;
    this.config = config;
    this.options = options;
    
    this.campaign = {
      uuid: uuid.v4(),
      startTime: new Date().toISOString(),
      suites: {},
      username: process.env.USERNAME,
    }
    
    this.runners = {};
    this.testsUuid = {};
    
    this.getCurrentTest = function(cid) {
      return _this.testsUuid[cid];
    }
    
    console.log('ElasticseachReporter', options);

    this.on('start', function() {
        console.log('start',arguments);
    });
    
    
   this.on('runner:start', function (runner) {
       console.log('runner:start',runner.cid)
       _this.runners[ runner.cid ] = runner;
       _this.testsUuid[ runner.cid ]=null;              
   })      

    this.on('suite:start', function(suite) {
      //console.log('suite:start',suite);
    });

    this.on('suite:end', function(suite) {
        //console.log('suite:end',suite);
    });

    this.on('test:start', function(test) {
      _this.testsUuid[test.cid] = uuid.v4();
        
       console.log('test:start',_this.getCurrentTest(test.cid));
    });

    this.on('test:meta', function(meta) {
        //console.log('test:meta',meta);
    });

    this.on('hook:start', function() {
        //console.log('hook:start',arguments);
    });

    this.on('hook:end', function() {
        //console.log('hook:end',arguments);
    });

    this.on('test:pass', function(test) {
        if( !_this.campaign.suites[test.parent] ) {
          _this.campaign.suites[test.parent]=[];
        }
        test.uuid = _this.getCurrentTest(test.cid);
        test.status = 'passed';
        _this.campaign.suites[test.parent].push(test);
        console.log('test:pass',_this.getCurrentTest(test.cid), test);
    });

    this.on('test:fail', function(test) {
        if( !_this.campaign.suites[test.parent] ) {
          _this.campaign.suites[test.parent]=[];
        }
        test.uuid = _this.getCurrentTest(test.cid);
        test.status = 'failed';
        _this.campaign.suites[test.parent].push(test);
        console.log('test:fail',_this.getCurrentTest(test.cid), test);
    });
    
    this.on('test:end', function(test) {
        console.log('test:end',_this.getCurrentTest(test.cid));
        _this.testsUuid[test.cid]=null;
    });
    
    this.on('test:pending', function() {
        //console.log('test:pending',arguments);
    });
    
    this.on('test:log', function(event) {
        console.log('test:log',_this.getCurrentTest(event.cid), event.message );
        
    });

    this.on('test:attach', function(event) {
        console.log('test:attach',_this.getCurrentTest(event.cid));
    });

    this.on('step:start', function(event) {
        console.log('step:start',_this.getCurrentTest(event.cid), event);
    });
    
    this.on('step:end', function(event) {
        console.log('step:end',_this.getCurrentTest(event.cid), event);
    });
       
    this.on('runner:end', function (runner) {
       console.log('runner:end',runner.cid);
       
       delete _this.runners[ runner.cid ];
       delete _this.testsUuid[ runner.cid ];
    });

    this.on('end', function() {
        _this.campaign.endTime=new Date().toISOString();
        var suiteResults = [];
        var result = { totalTest: 0, totalFailed: 0, totalSuccess: 0, totalSkipped: 0 }
        for( var suite in _this.campaign.suites ) {
          var totalSuite = { name: suite, totalTest: 0, totalFailed: 0, totalSuccess: 0, totalSkipped: 0 };
          var tests = _this.campaign.suites[suite];
          for( var idx in tests ) {
            result.totalTest++;
            totalSuite.totalTest++;
            if( tests[idx].status=='passed' ) { result.totalSuccess++; totalSuite.totalSuccess++ }
            else if( tests[idx].status=='failed' ) { result.totalFailed++; totalSuite.totalFailed++; }
            else { result.totalSkipped++; totalSuite.totalSkipped++; }
          }
          suiteResults.push(totalSuite);
        }
        _this.campaign.result = result;
        _this.campaign.suiteResults = suiteResults;
        
        
        console.log(_this.campaign);
    });
    
};

ElasticseachReporter.reporterName='elasticseachReporter';

/**
 * Inherit from EventEmitter
 */
util.inherits(ElasticseachReporter, events.EventEmitter);

ElasticseachReporter.reporterName='ElasticseachReporter';

/**
 * Expose Custom Reporter
 */
exports = module.exports = ElasticseachReporter;