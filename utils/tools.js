var fs = require('fs-extra');
var uuid = require('uuid');
var assert = require('assert');
var async  = require('async');
var Q = require('q');
var tty = require('tty');
var gm = require('gm');
var compare = require('./compare');
var path = require('path');

var Step = require('./step');

var browserTool = require('./browser-tools');

var tool = {

  takeFullScreenshot: function (title, step, hideSelectors) {
    var externalStep = (step!=null);
    var step = step ? step : browser.newStep('takeFullScreenshot')
    var config = browser.getToolsConfig();
    // create working folder if needed
    if( !fs.existsSync(config.screenshot.folder) ) {
      fs.mkdirsSync(config.screenshot.folder);
    }
    
    browser.execute( browserTool.hideScrollbar );
    
    // hide elements
    var originalState=null;
    if( hideSelectors ) {
      var subStep = browser.startStep('hide elements');
      originalState = browser.execute( browserTool.hideElements, hideSelectors ).value;
      browser.info('originalState',originalState);
      browser.pause(500);
      subStep.ok();
    }
    
    
    // save screenshot
    var filename = path.join(config.screenshot.folder,uuid.v4()+'.png');
    browser.saveScreenshot(filename);
    //browser.attachPng(title!=null ? title : 'screenshot', filename);
    
    // check sizes
    if( !externalStep ) {
      var pageSize = browser.getElementSize('body');
      var screenshotSize = browser.call(function() {
          var deferred = Q.defer();
          gm(filename).size(function(err, value){
            deferred.resolve(value);
          });
          return deferred.promise;      
      });
      step.log('check pageSize', {pageSize:pageSize, screenshotSize:screenshotSize} );
      
      // check if browser gives a fullpage screenshot are note ( chrome do not )
      if(    pageSize.width > screenshotSize.width
          || pageSize.height > screenshotSize.height ) {
          
          // we should take documentScreenshot
          
          var s = browser.startStep('recompose full screenshot');
          try {
            browser.documentScreenshot( filename );
            s.attachPng('full page screenshot', filename );
            s.ok();
          } catch(err) {
            s.ko('error compose full screenshot',err);
            throw err;
          }

      }
    }
    
    // show elements
    browser.execute( browserTool.showScrollbar );

    if( hideSelectors ) {
      var subStep = browser.startStep('reset hide elements : '+originalState.uuid);
      browser.execute( browserTool.resetVisibility, originalState.uuid );
      browser.pause(500);
      subStep.ok();
    }

    
      
    //console.log(' - screenshot saved : '+filename);
    if( !externalStep ) step.ok();
    return filename;
  },
  
  
  takeElementScreenshot: function( options ) {
    var config = browser.getToolsConfig().screenshot;    
    console.log('* takeElementScreenshot',config,options);
    
    // 1. take synchronious fallpage screenshot
    var screenshot = browser.takeFullScreenshot(null,null, options.hideSelectors);
    screenshot = screenshot.substring(0,screenshot.length-4);

    var step = browser.newStep( 'takeElementScreenshot' );
    step.log('details', { options: options });
    
//    // 2. apply masks
//    if( options.masks ) {
//      var masksStep = browser.startStep('apply masks', { masks: options.masks });
//      browser.execute( browserTool.hideScrollbar );
//
//      var maskColor = options.maskColor ? options.maskColor : config.maskColor;
//      var masked = gm(screenshot+'.png').stroke(maskColor, 0).fill(maskColor);   
//      // draw masks
//      options.masks.forEach(
//        function(mask) {
//          console.log(' - apply mask', mask );
//          var maskStep = browser.startStep('apply mask : '+mask);    
//      
//          var elements = browser.elements(mask);
//          var coord = [];
//          for( var i in elements.value ) {
//            var element = elements.value[i];
//            
//            var s = browser.elementIdSize(element.ELEMENT).value;
//            // filter empty object
//            if( s.width>0 && s.height>0 ) {
//              var l = browser.elementIdLocation(element.ELEMENT).value;
//              
//              var rect = { x:l.x, y:l.y, width: l.x+s.width, height: l.y+s.height };
//              coord.push(rect);
//              
//              masked.drawRectangle(rect.x, rect.y, rect.width, rect.height);
//            }
//            
//          }
//          maskStep.log('found ['+coord.length+'] elements : positions',coord);
//          browser.execute( browserTool.showScrollbar );
//
//          maskStep.ok();
//        }
//      );
//      masksStep.ok();
//      
//      // write image
//      var maskedFile = browser.call( function() {
//        var deferred = Q.defer();
//        var filename = screenshot+'#.png';
//        console.log(' - writting  masked', filename);
//        masked.write(filename, function(err, stdout, stderr, command) { 
//            if( err ) {
//              console.error("error saving masked",filename, err, stdout, stderr, command);
//              step.log("error saving masked", err);
//              step.error();
//              deferred.reject(err);
//            } else {
//              console.log(' > write_masked success', filename);
//              browser.startStep('masked screenshot').then( function(s) {
//                s.attachPng(filename,filename).ok();
//                deferred.resolve(filename);
//              });
//              
//            }
//        });         
//        return deferred.promise;      
//      });
//    }
    
    // extract elements

    if( typeof(options.selector)==="string" ) {
      // make a valid selector object in case of simple string with "noname"
      options.selector = { noname: options.selector };
    }
    // process selectors
    var elmtImages = [];
    browser.execute( browserTool.hideScrollbar );

    Object.keys(options.selector).forEach(
      function(seletorName) {
        var selector = options.selector[seletorName];
        var step = browser.startStep('extract element selector : '+selector );
        var elmtSize = browser.getElementSize(selector);
        var elmtLoc = browser.getLocation(selector);
        if( !elmtSize.length ) {
          // make array if only 1 results
          elmtSize = [elmtSize];
          elmtLoc = [elmtLoc];
        }
        // process selectors
        for( var idx in elmtSize ) {
          var size = elmtSize[idx];
          var loc = elmtLoc[idx];
          
          elmtImg = browser.call(function() {
            var deferred = Q.defer();
            // crop element area and save image
            console.log(' - crop element '+seletorName+' '+idx, size, loc );
            var idxSuffix = elmtSize.length==1 ? '' : '#'+idx;
            var filename = screenshot+'_'+seletorName+idxSuffix+'.png';
            step.log('crop image', { loc: loc, size:size, image: screenshot+(options.masks ? '#' : '')+'.png', destFile: filename } );
            var img = gm(screenshot+(options.masks ? '#' : '')+'.png').crop(size.width, size.height, loc.x, loc.y);
            img.write(filename, function() { 
              console.log(' > write_element ['+seletorName+'] success '+idx, filename );               
              browser.startStep('crop element screenshot ['+seletorName+idxSuffix+'] ').then(
                function(s) {
                  s.attachPng(filename, filename ).ok();
                  deferred.resolve(filename);
                }
              );
            }); 
            return deferred.promise;
          });
          var res = {};
          res[seletorName] = elmtImg;
          elmtImages.push( res );
        };
        
        step.ok();
      }
    );
    browser.execute( browserTool.showScrollbar );    
    step.ok();
    return elmtImages;
  },
  
  assertVisual : function( refScreenshot, options ) {

    var config = browser.getToolsConfig().screenshot;    
  
    // 1. take element screenshot
    var screenshots = browser.takeElementScreenshot(options);
    
    var failAssertion = [];
        
    // 2. for each screenshots
    for( var i in screenshots ) {   
      var screenshot = screenshots[i];
    
      var name = Object.keys(screenshot)[0];
      var file = screenshot[name];
      // manage indexed elements #0 #1 #2 ...
      var idx = file.lastIndexOf('#')< 0 ? '' : file.substring( file.lastIndexOf('#'), file.lastIndexOf('.') );
      
      var ref = path.join(refScreenshot, name + idx + '.png');        

      var step = browser.newStep( 'asser visual for : '+name+idx );

      step.log( 'test setup', { name: name, ref: ref, file: file, options: options, config: config } );
      
      console.log(' > assert visual ['+name+'] : '+file+ ' vs '+ref);
      
      if( fs.existsSync(ref) ) {
        step.log('visual reference image found', {ref: ref } );
        var diff = file.substring(0,file.length-4)+'_diff.png';
        var compareOptions = {
          file: diff, // required
          highlightColor: options.diff && options.diff.highlightColor ? options.diff.highlightColor : config.diff.highlightColor, // optional. Defaults to red
          highlightStyle: options.diff && options.diff.highlightStyle ? options.diff.highlightStyle : config.diff.highlightStyle, // optional. Defaults to assign
          metric: options.diff && options.diff.metric ? options.diff.metric : config.diff.metric, // optional. Defaults to mse
          tolerance: options.diff && options.diff.tolerance ? options.diff.tolerance : config.diff.tolerance // optional. Defaults to 0
        };
        
        step.log('gm-compare options', compareOptions );
        var compare = browser.call( function() {
          var deferred = Q.defer();
          gm.compare(ref, file, compareOptions, function (err, isEqual, equality, raw) {
            console.log(' - Error', err);
            console.log(' - Ref : %s', ref);
            console.log(' - Screenshot : %s', file);
            console.log(' - Diff : %s', diff);
            console.log(' - The images are equal: %s', isEqual);
            console.log(' - Actual equality: %d', equality)
            console.log(raw);
                
            if (err) {
              browser.error( 'error during compare', err );
              step.ko('failed due to compare error');              
              deferred.reject(err);
            }
            else {
              deferred.resolve({isEqual:isEqual,equality:equality, raw } );
            }
          });    
          return deferred.promise;        
        });
        
        compare.options = compareOptions;
        
        // if  ok
        if( compare.isEqual ) {
          browser.startStep('image are considerated as equals ('+compare.equality+')' )
          .attachPng( 'element ['+name+'] image', file )
          .attachLog( 'compare results', compare )
          .ok();

          step.ok();

        } else {
        
          // it's not ok
          browser.startStep('visual assertion failed')
          .attachPng( 'reference image', ref )
          .attachPng( 'element ['+name+'] image', file )
          .attachPng( 'diff between REF / ['+name+']', diff )
          .attachLog( 'failed compare-results', compare)
          .broken();
          
          failAssertion.push('visual compare '+ref+' / '+file+' failed : tolerance '+compare.equality+' over ' +compareOptions.tolerance);

          step.ko();
        
        }
      } else {
        step.log('Error : cannot find reference file', {ref:ref} );
        // ask for recording if terminal interactif
        if( true || Boolean(process.stdin.isTTY) ) {
          /*
          process.stdin.resume();
          process.stdin.setEncoding('utf8'); 
          process.stdin.setRawMode(true);            
          
          marche pas trop encore
          l'idée, c'est de demander a l'utilisateur s'il veut enregister le screenshot en tand que reference
          en attendant, ca le fait par defaut avec un gros message ' > HELPER :....'
          
          var key = browser.call(
            function() {
              var deferred = Q.defer();
              process.stdout.write('\n*************************\n');
              process.stdout.write('\n*   Interactive Mode    *\n');
              process.stdout.write('\n*************************\n');
              process.stdout.write(' Reference visual file for ['+name+'] not found ['+ref+'].\n Save current screenshot as new Ref file ? [Y,n] ');
              // on any data into stdin
              process.stdin.on( 'data', function( key ){
                console.log( ' '+key +'\n');
                deferred.resolve(key);
              });              
            
              return deferred.promise;
            }
          );
          */
          // copy screenshot to ref location if Y
          if( true || key.toUpperCase()=='Y') {
            // check if dest folder exists
            
            var refDir = path.dirname(ref);
            if( !fs.existsSync(refDir) ) {
              console.log(' _ create missing folder',refDir);
              fs.mkdirsSync(refDir);
            }      
            // copy screenshot to ref
            fs.copySync(file, ref+'__MISSING.PNG');

            browser.warning( 'HELPER : saved missing reference file', { ref: ref+'__MISSING.PNG', from: file }  );
            
            console.log(' > HELPER : saved new reference file',ref+'__MISSING.PNG','from',file);
          }
          
        } 
        // this test failed in anycase
        var err = 'cannot process visual test for ['+name+'] because ref file ['+ref+'] is not found';
        browser.error(err, { missing:ref } );
        
        step.ko();
        failAssertion.push(err);
        console.error('Failed test step : '+err);
      }
    
    };
    
    // verify soft assertion
    assert( failAssertion.length==0, failAssertion );
    
    return screenshots;
  
  },
  
  
  startStep : function( title ) {
     return new Step(title);
  },
 
  doStep : function( ) {
    var title = arguments[0];
    var fct = arguments[1];
    var step = tool.startStep(title);
    var args = [];
    for( var i in arguments ) {
      if( i>0 ) args.push(arguments[i]);
    }   
    step.doInStep.apply(step,args);
    step.ok();
    
  },
  
  testInfo: function( meta ) {
    meta.cid = browser.currentTest.cid;
    meta.event = 'test:meta';
    process.send( meta );
  },
  
  info: function( message, detail ) {
    var step = browser.startStep(message);
    if( detail ) {
      step.attachLog('detail', detail);
    }
    step.ok();
  },
  
  error: function( message, detail ) {
    var step = browser.startStep(message);
    if( detail ) {
      step.attachLog('error-detail', detail);
    }
    step.ko();
  },
  
  warning: function( message, detail ) {
    var step = browser.startStep(message);
    if( detail ) {
      step.attachLog('warning-detail', detail);
    }
    step.broken();
  },  
  
  attachPng: function( title, file ) {
    var step = browser.startStep(title);
    if( file ) {
      step.attachPng(file, file );
    }
    step.ok();
  },
  
  
  attachFile: function( title, file, type ) {
    var step = browser.startStep(title);
    if( file ) {
      step.attachFile(file, file, type );
    }
    step.ok();
  },
  
  
}

tool.showMessage = function(message, timeout, textColor, backgroundColor, borderColor) {
  browser.execute( browserTool.showMessage ,message, timeout, textColor, backgroundColor, borderColor ); 
  browser.pause(timeout+500);        
}

module.exports=tool;

