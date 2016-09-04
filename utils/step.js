var assert = require('assert');
var Q = require('q');
var uuid = require('uuid');

function Step(title) {
    this.title = title;
    this.result = 'pending';
    this.attachments = [];
    this.uuid = uuid.v4();
    this.terminated = false;

    Step.prototype.log = function( message, detail ) {
      browser.info(message,detail);
      return this;
    };
    
    
    Step.prototype.attachLog = function( message, detail ) {
      process.send({ event: 'test:log', cid: browser.currentTest.cid, message: message, detail: detail, uuid: this.uuid });
      return this;
    };
     
    Step.prototype.attachPng = function( title, file ) {
      process.send({ event: 'test:attach', cid: browser.currentTest.cid, title: title, type: 'image/png', file: file, uuid: this.uuid });
      return this;
    };
    
    Step.prototype.attachFile = function( title, file, type ) {
      process.send({ event: 'test:attach', cid: browser.currentTest.cid, title: title, type: type, file: file, uuid: this.uuid });
      return this;
    };
    
    Step.prototype.done = function( res, message, detail ) {
      if( this.terminated ) {
        throw new Error('step already terminated', this);
      }
      if( res ) {
        this.result=res;
      } else {
        if( this.result == 'pending' ) {
          this.result = 'error';
        }
      }
      if( message ) {
        this.log(message, detail);
      }
      process.send( { event: 'step:end', cid: browser.currentTest.cid, status: this.result, uuid: this.uuid } );
      this.terminated=true;
    };

    Step.prototype.ok = function( message, detail ) {
      if( this==null ) throw new Error('no step started');
      this.done('passed', message, detail);
    };
    
    Step.prototype.passed = function( message, detail ) {
      this.done('passed', message, detail);
    };
    
    Step.prototype.failed = function( message, detail ) {
      this.done('failed', message, detail);
    };
    Step.prototype.broken = function( message, detail ) {
      this.done('broken', message, detail);
    }; 
    Step.prototype.cancel = function( message, detail ) {
      this.done('canceled', message, detail);
    };    
    Step.prototype.ko = function( message, detail ) {
      // expect screenshot to be taken by assertion methods
      //browser.takeFullScreenshot('Error screenshot test ko : '+(message!=null ? message : ''), this);
      this.done('failed', message, detail);
    };    
    Step.prototype.error = function( message, detail ) {
      browser.takeFullScreenshot('Error screenshot test error : '+(message!=null ? message : ''), this);
      this.done('error', message, detail);
    };
    
    Step.prototype.assertEqual = function( expected, value, message ) {
      this.log( 'assert equals : ' + ( message!= null ? message : '' ), { expected:expected, value:value } );
      try {
        assert.equal(expected, value, message);
      } catch(err) {
        console.log('\nERROR : step-assertEqual\n- Expected : '+expected+'\n- Value : '+ value+'\n- Context : '+message);
        this.ko( 'assertion error',err);
        throw err;
      }
      return this;
    };
    
    Step.prototype.assertVisible = function( selector, timeout, message ) {
      this.log( 
        'assert visible : ' + ( message!=null ? message : selector+' in (ms) '+timeout), 
        { selector:selector, timeout:timeout } 
      );
      try {
        browser.waitForVisible(selector, timeout);
      } catch(err) {
        var newErr = new Error('cannot find element with selector : '+selector+' with-in '+timeout+'ms',err);
        this.ko(message, newErr);
        throw newErr;
      }
      return this;
    };
     
    Step.prototype.assertVisual = function( refScreenshot, test, message ) {
      try {
        browser.assertVisual(refScreenshot, test);
      } catch(err) {
        browser.takeFullScreenshot('Error assertVisual : '+refScreenshot+' '+(message!=null ? message : ''), this);
        this.ko(message, err);
        throw err;
      }
      return this;
    };
    
    Step.prototype.url = function( url, message ) {
      this.log( 
        'open url : '+(message!=null ? message : url), 
        { url:url } 
      );
      try {
        browser.url(url);
        
        this.assertVisible('body', 10000, 'wait for page to be loaded');
        
      } catch(err) {
        this.ko(message, err);
        throw err;
      }
      return this;
    };    
    
    Step.prototype.submitForm = function( selector, message ) {
      this.log( 
        'submit form : '+(message!=null ? message : selector ), 
        { selector:selector } 
      );
      try {
        browser.submitForm(selector);
      } catch(err) {
        this.ko(message, err);
        throw err;
      }
      return this;
    };    
    

    Step.prototype.setValue = function( selector, value, message ) {
      this.log( 
        'setValue : '+( message!=null ? message : selector+'='+value ), 
        { selector:selector, value:value  } 
      );
      try {
        browser.setValue(selector, value);
      } catch(err) {
        this.ko(message, err);
        throw err;
      }
      return this;
    };  

    Step.prototype.click = function( selector, message ) {
      this.log( 
        'click : '+( message!=null ? message : selector ), 
        { selector:selector } 
      );
      try {
        browser.click(selector);
      } catch(err) {
        var newErr = new Error('cannot click on not found element : '+selector,err);
        this.ko(message, newErr);
        throw newErr;
      }
      return this;
    };    
        
     Step.prototype.selectByValue = function( selector, value, message ) {
      this.log( 
        'selectByValue : '+( message!=null ? message : selector+'='+value ), 
        { selector:selector, value:value  } 
      );
      try {
        browser.selectByValue(selector, value);
      } catch(err) {
        this.ko(message, err);
        throw err;
      }
      return this;
    }; 
    
    Step.prototype.fullscreen = function( ) {
      browser.windowHandleMaximize();
      return this;
    };      
    
    Step.prototype.takeFullScreenshot = function(title) {
      browser.takeFullScreenshot(title, this);
      return this;
    };    
    
    Step.prototype.wait = function(timeoutSec) {
      //this.log( 
      //  'waiting for (ms): '+timeoutSec, 
      //  { timeoutSec: timeoutSec } 
      //); 
      var self = this;
      browser.call(
        function() {
            var deferred = Q.defer();
            setTimeout(
              function() { 
                deferred.resolve(''); 
              }, 
              timeoutSec 
            );
            return deferred.promise;
        }
      );
      return this;
    };  
    
    Step.prototype.doInStep = function() {
      var fct = arguments[0];
      var args = [];
      args.push(this);
      for( var i in arguments ) {
        if(i!=0) args.push(arguments[i]);
      }
      fct.apply(this,args);
      return this;
    };    

    process.send( { event: 'step:start', cid: browser.currentTest.cid, title: title, uuid: this.uuid } );
    
}

module.exports = Step;
