
var langs = require('../data/langs');
var i18n = require('../data/i18n');
var path = require('path');
var browserTool = require('./browser-tools');
var merge = require('deepmerge');

var api = {
  resolution: process.env.RESOLUTION ? process.env.RESOLUTION : 'LOCAL',
  category: process.env.CATEGORY ? process.env.CATEGORY : ''
};

var langSelector = {
  fr_FR: '#ui-id-6',
  nl_BE: '#ui-id-7',
  fr_BE: '#ui-id-8',
  fr_LU: '#ui-id-9',
}

api.setLanguage = function(step, lang) {
  step
  .log('common:setLanguage', lang )
  .click('.ui-icon-triangle-1-s', 'click on languages')
  .assertVisible( langSelector[lang.code], 5000, 'wait for languages to be shown')
  .click( langSelector[lang.code], 'select lang '+lang.code )
  .wait(2000,'wait for page to be reload changed to '+lang.code);
}

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

api.checkPage = function(step, lang, page) {
  step.log('common:checkPage',{ lang: lang, page: page } );
  // assert title value
  if( page.title ) {
    step.assertEqual( browser.getTitle(), i18n(page.name, page.title, lang.code), 'check window title')
  }
  if( page.labels ) {
    for( var i in page.labels ) {
      var label = page.labels[i];
      
      var resetInfo=null;
      if( label.hideSelectors ) {
        resetInfo = browser.execute( browserTool.hideElements,label.hideSelectors ).value;
      }
      
      var element = browser.getText(label.selector);
      if( typeof(element)=='object' && element.length ) {
        if( !label.code.length ) {
          throw new Error('the selector "'+label.selector+'" returns more than one element. label.code should be an array', element);
        }
        // iterate driven by expected values
        for( var j in label.code ) {
          step.assertEqual(
                i18n( page.name, label.code[j], lang.code ),
                element[j], 
                'check label for button '+label.code[j]
          )          
        }
      } else {
        step.assertEqual(
              i18n( page.name, label.code, lang.code ),
              element, 
              'check label for button '+lang.code
        )
      }
      
      if( resetInfo ) {
        browser.execute( browserTool.resetVisibility, resetInfo.uuid );
      }
      
    }
  }
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
  
  var wrapper = function() {
    // store info
    browser.testInfo( testContext );
    // run test
    impl( testContext ); 
  }
  
  var test = it( info.name.forEach ? info.name.join('#') : info.name, wrapper );
  test.testContext = testContext;
  
}

api.suites = [];
api.suitesByName = {};


api.testsuite = function( testsuiteName, impl ) {
  var fullName = [ 'com', 'ldn' ];
  if( typeof(testsuiteName)=='string') fullName.push(testsuiteName);
  if( testsuiteName.forEach ) testsuiteName.forEach( function(name) { fullName.push(name); } );
  var suite = describe( fullName.join('.'), impl );
  api.suites.push(suite);
  api.suitesByName[suite.title]=suite;
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