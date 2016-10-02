var util = require('util'),
    events = require('events'),
    uuid = require('uuid'),
    merge = require('deepmerge'),
    fs = require('fs-extra'),
    path = require('path'),
    request = require('sync-request'),
    dateFormat = require('dateformat');
/*

** Docker-compose :

elasticsearch:
  image: elasticsearch:latest
  container_name: elasticsearch
  command: elasticsearch -Des.network.host=0.0.0.0
  ports:
    - "9200:9200"

kibana:
  image: kibana:latest
  container_name: kibana
  ports:
    - "5601:5601"
  links:
    - elasticsearch
    


** Webdriverio Config file :

var elasticSearchReporter = require('webdriverio-addons').elasticSearchReporter;

config :

    campaignName: 'LDN',

    reporters: [..., elasticSearchReporter, ... ],
    reporterOptions: {
        'outputDir': 'outputDir',
        'elasticseachReporter': {
            localCopy: true,
            stats: true,
            esHost: 'vps213987.ovh.net',
            esPort: '9200',
            campaignsIndex: 'campaigns_2016_10',
            campaignsType: 'campaign',
            testcasesIndex: 'testcases_2016_10',
            testcasesType: 'testcase',
            logsIndex: 'logs_2016_10',
            logsType: 'log',
            attachmentsIndex: 'attachments',
            attachmentsType: 'attachment'
        }
    },   



*/


var ElasticseachReporter = function ( baseReporter, config) {
    
    var _this = this;

    var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
    this.baseReporter = baseReporter;
    this.config = config;
    this.options = options;
    
    this.indexSuffix="";
    if( options.elasticseachReporter.indexPattern ) {
      this.indexSuffix = dateFormat(new Date(), options.elasticseachReporter.indexPattern );
    }
        
    this.campaign = {
      uuid: uuid.v4(),
      startTime: new Date().toISOString(),
      suites: {},
      username: process.env.USERNAME,
    }
    
    this.runners = [];
    this.currentTestByRunner = {};
    
    this.storeToElasticSearch = function( type, document, uuid ) {
      var url = 'http://'+_this.options.elasticseachReporter.esHost+':'+_this.options.elasticseachReporter.esPort+'/';
      url += _this.options.elasticseachReporter[type+'Index'] + _this.indexSuffix + '/' + _this.options.elasticseachReporter[type+'Type'] + '/' + uuid;
      var startTime = new Date().getTime();
      var res = request('POST', url, { headers: {"Content-Type": "application/json"}, json: document } );
      res.getBody();
      if( _this.options.elasticseachReporter.stats ) {
        var duration = new Date().getTime() - startTime;
        console.log('recorded to ElasticSearch',type, uuid, duration+ ' (ms)', url);
      }
    }
    
    this.save = function( type, document, uuid ) {
    
      if( _this.options.elasticseachReporter.localCopy ) {
        if( !fs.existsSync( _this.options.outputDir ) ) {
          fs.mkdirsSync(_this.options.outputDir);
        }
        if( !fs.existsSync( path.join(_this.options.outputDir,type)) ) {
          fs.mkdirsSync(path.join(_this.options.outputDir,type));
        }
        
        var json = JSON.stringify(document,null,4);
        var file = path.join(_this.options.outputDir,type, uuid+'.json');
        //console.log('write document',type, uuid, file );
        fs.writeFileSync( file, json );
      
      }      
      _this.storeToElasticSearch( type, document, uuid );
    }
    
    this.saveCampaign = function( campaign ) {
      _this.save('campaigns', campaign, campaign.uuid );
    }
    this.saveTest = function( test ) {
      _this.save('testcases', test, test.uuid );
    }
    this.saveLog = function( log ) {
      _this.save('logs', log, log.uuid+'.'+log.event.replace(':','-'));
    }    
    this.saveAttachment = function( attachment ) {
      _this.save('attachments', attachment, attachment.uuid);
    }
    
    
    this.getCurrentTest = function(cid) {
      return _this.currentTestByRunner[cid];
    }
    
    console.log('ElasticseachReporter enabled', options.elasticseachReporter );
    
   this.on('runner:start', function (event) {
       //console.log('runner:start',event.cid)
       var runner = merge(event,{});
       delete runner.event;
       delete runner.config;
       
       _this.runners.push(runner);
       _this.currentTestByRunner[ event.cid ]=null;              
   })      


    this.on('test:start', function(test) {
      test.uuid = uuid.v4();
      test.campaign = _this.campaign.uuid;
      test.stepsStack = [];
      test.startTime= new Date().toISOString();
      _this.currentTestByRunner[test.cid]=test;
       //console.log('test:start',_this.getCurrentTest(test.cid).uuid);
    });

    this.on('test:meta', function(event) {
      var test = _this.getCurrentTest(event.cid);
      if( !test.meta ) test.meta={};
      test.meta = merge(test.meta, event );
      delete test.meta.event;
      delete test.meta.cid;
    });

    this.on('test:pass', function(event) {
        var test = _this.getCurrentTest(event.cid);
        test = _this.currentTestByRunner[event.cid] = merge(test,event);
        test.status = 'passed';
        //console.log('test:pass',test);
    });

    this.on('test:fail', function(event) {
        var test = _this.getCurrentTest(event.cid);
        test = _this.currentTestByRunner[event.cid] = merge(test,event);
        test.status = 'failed';
        //console.log('test:fail',test.uuid);
    });
    
    this.on('test:end', function(event) {
        var test = _this.getCurrentTest(event.cid);
        test.endTime= new Date().toISOString();
        delete test.stepsStack;
        delete test.type;
        delete test.event;
        delete test.runner;
        var suite = test.parent;
        delete test.parent;
        test.suite = suite;
        
        if( !_this.campaign.suites[test.suite] ) {
          _this.campaign.suites[test.suite]=[];
        }
        _this.campaign.suites[test.suite].push(test);
        _this.saveTest(test);
        //console.log('test:end',test);
        _this.currentTestByRunner[event.cid]=null;
    });
    
    this.on('test:pending', function() {
        //console.log('test:pending',arguments);
    });
    
    this.on('test:log', function(event) {
      var test = _this.getCurrentTest(event.cid);
      var log = merge(event,{});
      log.uuid = uuid.v4();
      log.campaign = _this.campaign.uuid;
      log.test = _this.getCurrentTest(event.cid).uuid;
      log.cid = event.cid;
      if( test.stepsStack.length>0 ) {
        log.step = test.stepsStack[test.stepsStack.length-1];
      }
      log.dateTime= new Date().toISOString();
      //console.log('test:log',test.uuid );
      _this.saveLog(log);
    });

    this.on('test:attach', function(event) {
        var test = _this.getCurrentTest(event.cid);
        var attachment = merge(event,{});
        attachment.size = fs.statSync(attachment.file)["size"];
        delete attachment.event;
        attachment.test = test.uuid;
        attachment.campaign = _this.campaign.uuid;
        if( test.stepsStack.length>0 ) {
          attachment.step = test.stepsStack[test.stepsStack.length-1];
        }
        attachment.dateTime= new Date().toISOString();
        
        //console.log('test:attach',_this.getCurrentTest(event.cid).uuid);
        _this.saveAttachment(attachment);
    });

    this.on('step:start', function(event) {
      var test = _this.getCurrentTest(event.cid);
      var log = merge(event,{});
      log.uuid = uuid.v4();
      if( log.title ) {
        log.message = log.title;
        delete log.title;
      }    
      log.dateTime= new Date().toISOString();
      log.test = test.uuid;
      if( test.stepsStack.length>0 ) {
        log.step = test.stepsStack[test.stepsStack.length-1];
      }      
      log.campaign = _this.campaign.uuid;
      test.stepsStack.push(log.uuid);
      //console.log('step:start',test.uuid );
      _this.saveLog(log);

    });
    
    this.on('step:end', function(event) {
      var test = _this.getCurrentTest(event.cid);
      var uuid = test.stepsStack.pop();
      var log = merge(event,{});
      log.uuid = uuid;
      if( log.title ) {
        log.message = log.title;
        delete log.title;
      }    
      delete log.cid;   
      log.test = test.uuid;      
      log.campaign = _this.campaign.uuid;
      //console.log('step:end',test.uuid );
      _this.saveLog(log);
    });
       
    this.on('runner:end', function (runner) {
       console.log('runner:end',runner.cid);
       
       //delete _this.runners[ runner.cid ];
       delete _this.currentTestByRunner[ runner.cid ];
    });

    this.on('end', function() {
        _this.campaign.endTime=new Date().toISOString();
        var newSuites = [];
        var result = { totalTest: 0, totalFailed: 0, totalSuccess: 0, totalSkipped: 0 }
        for( var suite in _this.campaign.suites ) {
          var newSuite = { suiteName: suite, tests: [] };
          newSuites.push(newSuite);
          var totalSuite = { totalTest: 0, totalFailed: 0, totalSuccess: 0, totalSkipped: 0 };
          var tests = _this.campaign.suites[suite];
          for( var idx in tests ) {
            var test = tests[idx];
            result.totalTest++;
            totalSuite.totalTest++;
            delete tests[idx].stepsStack;
            if( test.status=='passed' ) { result.totalSuccess++; totalSuite.totalSuccess++ }
            else if( test.status=='failed' ) { result.totalFailed++; totalSuite.totalFailed++; }
            else { result.totalSkipped++; totalSuite.totalSkipped++; }
            
            newSuite.tests.push({
              uuid: test.uuid,
              title: test.title,
              status: test.status,
              cid: test.cid,
              startTime: test.startTime,
              endTime: test.endTime              
            });
            
            
          }
          newSuite.result = totalSuite;
        }
        _this.campaign.result = result;
        _this.campaign.suites = newSuites;
        _this.campaign.runners = _this.runners;
        _this.saveCampaign(_this.campaign);
        
        //console.log( JSON.stringify( _this.campaign, null, 2 ) );
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