'use strict';

var fs = require('fs-extra');

var _get = require('babel-runtime/helpers/get')['default'];

var _inherits = require('babel-runtime/helpers/inherits')['default'];

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _Object$keys = require('babel-runtime/core-js/object/keys')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _allureJsCommons = require('allure-js-commons');

var _allureJsCommons2 = _interopRequireDefault(_allureJsCommons);

var _allureJsCommonsBeansStep = require('allure-js-commons/beans/step');

var _allureJsCommonsBeansStep2 = _interopRequireDefault(_allureJsCommonsBeansStep);

function isEmpty(object) {
    return !object || _Object$keys(object).length === 0;
}

var LOGGING_HOOKS = ['"before all" hook', '"after all" hook'];

/**
 * Initialize a new `Allure` test reporter.
 *
 * @param {Runner} runner
 * @api public
 */

var debug = false;
var debugSeleniumCommand = false;

function logger() {
  if( debug )
    console.log(arguments);
}
function error() {
  console.error(arguments);
}

var AllureReporter = (function (_events$EventEmitter) {
    _inherits(AllureReporter, _events$EventEmitter);

    function AllureReporter(baseReporter, config) {
        var _this = this;

        var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

        _classCallCheck(this, AllureReporter);

        _get(Object.getPrototypeOf(AllureReporter.prototype), 'constructor', this).call(this);

        this.baseReporter = baseReporter;
        this.config = config;
        this.options = options;
        this.allures = {};

        var epilogue = this.baseReporter.epilogue;

        this.on('end', function () {
            epilogue.call(baseReporter);
        });

        this.on('suite:start', function (suite) {
            var allure = _this.getAllure(suite.cid);
            var currentSuite = allure.getCurrentSuite();
            var prefix = currentSuite ? currentSuite.name + ' ' : '';
            allure.startSuite(prefix + suite.title);
        });

        this.on('suite:end', function (suite) {
            _this.getAllure(suite.cid).endSuite();
        });

        this.on('test:start', function (test) {
            var allure = _this.getAllure(test.cid);
            allure.startCase(test.title);

            var currentTest = allure.getCurrentTest();
            currentTest.addParameter('environment-variable', 'capabilities', JSON.stringify(test.runner[test.cid]));
            currentTest.addParameter('environment-variable', 'spec files', JSON.stringify(test.specs));
            
        });
        
        this.on('test:pass', function (test) {
        
        
        
            _this.getAllure(test.cid).endCase('passed');
        });

        this.on('test:fail', function (test) {

            var allure = _this.getAllure(test.cid);
            var status = test.err.type === 'AssertionError' ? 'failed' : 'broken';

            if (!allure.getCurrentTest()) {
                allure.startCase(test.title);
            } else {
                allure.getCurrentTest().name = test.title;
            }

            while (allure.getCurrentSuite().currentStep instanceof _allureJsCommonsBeansStep2['default']) {
                allure.endStep(status);
            }

            allure.endCase(status, test.err);
        });

        this.on('runner:command', function (command) {
            var allure = _this.getAllure(command.cid);

            if (!_this.isAnyTestRunning(allure)) {
                return;
            }

            if( debugSeleniumCommand ) {
              allure.startStep(command.method + ' ' + command.uri.path);
              
              if (!isEmpty(command.data)) {
                  _this.dumpJSON(allure, 'Request', command.data);
              }
            }
        });

        this.on('runner:result', function (command) {
            var allure = _this.getAllure(command.cid);

            if (!_this.isAnyTestRunning(allure)) {
                return;
            }

            if( debugSeleniumCommand ) {
              if (command.requestOptions.uri.path.match(/\/wd\/hub\/session\/[^/]*\/screenshot/)) {
                  allure.addAttachment('Screenshot', new Buffer(command.body.value, 'base64'));
              } else {
                  _this.dumpJSON(allure, 'Response', command.body);
              }
              
              allure.endStep('passed');
            }
        });

        /*
           meta : {
            (mandatory) cid : ...,
            (mandatory) event : 'test:meta'
            (optional) description : string
            (optional) feature : string | array
            (optional) strory : string | array
            (optional) issue : string | array
            (optional) severity : [ 'blocker','critical','normal','minor','trivial' ]
            (optional) argument : {name: value, name2: value }
            (optional) environment : {name: value, name2: value }
           }
        */
        this.on('test:meta', function (meta) {
            var allure = _this.getAllure(meta.cid);
            logger('test:meta', meta);
            
            if (!_this.isAnyTestRunning(allure)) {
                return;
            }
            var currentTest = allure.getCurrentTest();
            
            // manage description
            if( meta.description ) {
              currentTest.setDescription(meta.description);            
            }
            // manage labels ( feature, story, issue )
            if( meta.feature ) {
                 if( typeof(meta.feature)=='string' ) {
                    currentTest.addLabel( 'feature', meta.feature );
                  } else {
                    for( var i in meta.feature ) {
                      currentTest.addLabel( 'feature', meta.feature[i] );
                    }
                  }              
            }
            if( meta.story ) {
                 if( typeof(meta.story)=='string' ) {
                    currentTest.addLabel( 'story', meta.story );
                  } else {
                    for( var i in meta.story ) {
                      currentTest.addLabel( 'story', meta.story[i] );
                    }
                  }              
            }
            if( meta.issue ) {
                 if( typeof(meta.issue)=='string' ) {
                    currentTest.addLabel( 'issue', meta.issue );
                  } else {
                    for( var i in meta.issue ) {
                      currentTest.addLabel( 'issue', meta.issue[i] );
                    }
                  }              
            }
            if( meta.severity ) {
                 if( typeof(meta.severity)=='string' ) {
                    currentTest.addLabel( 'severity', meta.severity );
                  } else {
                    error('ERROR : meta.severity should be a string', meta);
                  }              
            }
            // manage parameters
            if( meta.argument ) {
               if( typeof(meta.argument)=='object' ) {
                  var keys = Object.keys(meta.argument);
                  for( var i in keys ) {
                    var key = keys[i];
                    var val = meta.argument[key];
                    currentTest.addParameter( 'argument', key, val );
                  }
                } else {
                  error('ERROR : meta.argument should be an object { name2: val1, name2: val2.. }', meta);                 
                }
            }
            if( meta.environment ) {
               if( typeof(meta.environment)=='object' ) {
                  var keys = Object.keys(meta.environment);
                  for( var i in keys ) {
                    var key = keys[i];
                    var val = meta.environment[key];
                    currentTest.addParameter( 'environment-variable', key, val );
                  }
                } else {
                  error('ERROR : meta.environment should be an object { name2: val1, name2: val2.. }', meta);                 
                }
            }

        });

        this.on('step:start', function (step) {
            var allure = _this.getAllure(step.cid);
            logger('step:start', step);

            if (!_this.isAnyTestRunning(allure)) {
                error('cannot start step because no test is running',step);
                return;
            }
            allure.startStep(step.title!=null ? step.title : 'No name defined');
            
        });        
        
        this.on('step:end', function (step) {
            var allure = _this.getAllure(step.cid);
            logger('step:end', step);

            if (!_this.isAnyTestRunning(allure)) {
                error('cannot end step because no test is running',step);
                return;
            }
            allure.endStep(step.status!=null ? step.status : 'passed');
            
        });         
        /*
          attachment : {
            cid: ...,
            event: 'test:attach',
            title: string,
            file: string,
            type: string
          }
        
        */
        this.on('test:attach', function (attachment) {
            var allure = _this.getAllure(attachment.cid);
            logger('test:attach', attachment);

            if (!_this.isAnyTestRunning(allure)) {
                error('cannot attach because no test is running',attachment);
                return;
            }
            allure.addAttachment(
              attachment.title, 
              fs.readFileSync(attachment.file), 
              attachment.type 
            );
        });

        /*
          attachment : {
            cid: ...,
            event: 'test:log',
            message: string,
            detail: object
          }
        
        */
        this.on('test:log', function (log) {
            var allure = _this.getAllure(log.cid);
            logger('test:log', log);

            if (!_this.isAnyTestRunning(allure)) {
                error('cannot log because no test is running',log);
                return;
            }
            var content = log.detail!=null ? JSON.stringify(log.detail, null, '    ') : '';
            allure.addAttachment(
              log.message, content, 'application/json'
            );
        });
        
        
        this.on('runner:screenshot', function (command) {
            var allure = _this.getAllure(command.cid);
            allure.addAttachment('screenshot '+command.filename, new Buffer(command.data, 'base64'));
        });
        
        this.on('hook:start', function (hook) {
            var allure = _this.getAllure(hook.cid);

            if (!allure.getCurrentSuite() || LOGGING_HOOKS.indexOf(hook.title) === -1) {
                return;
            }

            allure.startCase(hook.title);
        });

        this.on('hook:end', function (hook) {
            var allure = _this.getAllure(hook.cid);

            if (!allure.getCurrentSuite() || LOGGING_HOOKS.indexOf(hook.title) === -1) {
                return;
            }
            
            allure.endCase('passed');

            if (allure.getCurrentTest().steps.length === 0) {
                allure.getCurrentSuite().testcases.pop();
            }
        });
    }

    _createClass(AllureReporter, [
      {
        key: 'getAllure',
        value: function getAllure(cid) {
            if (this.allures[cid]) {
                return this.allures[cid];
            }

            var allure = new _allureJsCommons2['default']();
            allure.setOptions({ targetDir: this.options.outputDir || 'allure-results' });
            this.allures[cid] = allure;
            return this.allures[cid];
        }
      },
      {
        key: 'isAnyTestRunning',
        value: function isAnyTestRunning(allure) {
            return allure.getCurrentSuite() && allure.getCurrentTest();
        }
      }, 
      {
        key: 'dumpJSON',
        value: function dumpJSON(allure, name, json) {
            allure.addAttachment(name, JSON.stringify(json, null, '    '), 'application/json');
        }
      }
      
    ]);

    return AllureReporter;
})(_events2['default'].EventEmitter);

AllureReporter.reporterName = 'AllureReporter';

exports['default'] = AllureReporter;
module.exports = exports['default'];
