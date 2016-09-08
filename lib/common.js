
var path = require('path');
var browserTool = require('./browser-tools');
var merge = require('deepmerge');
var browserTool = require('./browser-tools');

var api = {
  resolution: process.env.RESOLUTION ? process.env.RESOLUTION : 'LOCAL',
  category: process.env.CATEGORY ? process.env.CATEGORY : ''
};


api.openFullscreen = function( step, url ) {
  step
  .log('common:openFullscreen', { url: url } )
  .fullscreen()
  .url(url, 'open home page')
  //.assertVisible('body',5000, 'wait for page to be loaded');
  //browser.click('body');
}

api.openScreen = function( step, url, width, height ) {
  step
  .log('common:openScreen', { url: url, width: width, height: height } );
      
  browser.setViewportSize( { width: width, height: width } );

  step
  .url(url, 'open home page')
  //.assertVisible('body',5000, 'wait for page to be loaded');
  //browser.click('body');
}



api.assertVisual = function( step, refScreenshot, test ) {
  browser
  .newStep('common:assertVisual')
  .log( 'details', {refScreenshot:refScreenshot,test:test } )
  .ok();
  
  step.assertVisual(refScreenshot, test);
}

api.testcase = function( info, impl ) {

  if( !info.name ) {
    var err = 'No name provided in test information';
    console.error(err,info);
    throw new Error(err);
  }
  
  
  var wrapper = function() {
    console.log('!!!!!!!!!!!!!!!!!!', browser.currentTest);
    var testContext = merge( 
      { 
        environment: {
          browser: browser.capabilities.browserName,
          category: api.category,
          resolution: api.resolution,
          username: process.env.USERNAME 
        } 
      }, 
      info 
    );

    browser.testContext = testContext;
    
    browser.windowHandleMaximize()
    browser.url('about:blank');
  
    browser.showMessage( browserTool.describeTest(browser.currentTest, testContext, 'white') , 3500, 'white', '#3399ff');
      
    // store info
    browser.testInfo( testContext );
    // run test
    impl( testContext ); 
    
    
  }
  
  it( info.name.forEach ? info.name.join('#') : info.name, wrapper );
  
};

api.beforeTest = function(test) {
  browser.currentTest = test;
};

api.afterTest = function(test) {
    if( !test.duration ) {
      test.duration = new Date().getTime() - browser.testContext.startTime;
    }

    console.log('afterTest',test);

    browser.url('about:blank');
    var timeout = test.err ? 6000 : 3000;
    var borderColor = test.passed ? '#2eb82e' : '#ff1a1a';
    browser.showMessage( browserTool.describeTest(test, browser.testContext, borderColor), timeout, 'black', '#ffffcc', borderColor );
    delete browser.currentTest;
    delete browser.stepContext;

};

api.testsuite = function( testsuiteName, impl ) {
  var fullName = [ 'com', 'ldn' ];
  if( typeof(testsuiteName)=='string') fullName.push(testsuiteName);
  if( testsuiteName.forEach ) testsuiteName.forEach( function(name) { fullName.push(name); } );
  describe( fullName.join('.'), impl );

}

api.getReferenceFile = function( name ) { 
  var res = path.join( browser.getToolsConfig().visualReferenceDir, api.resolution, browser.capabilities.browserName );
  if( typeof(name)=='array' ) {
    for( var v in name ) {
      res = path.join(res, name[v]);
    }
  } else {
    for( var v in arguments ) {
      res = path.join(res, arguments[v]);
    }
  }
  return res;
}

module.exports = api;