'use strict';


/* global document,window */

var fs = require('fs-extra'),
    gm = require('gm'),
    uuidGen = require('uuid'),
    path = require('path'),
    Q = require('q'),
    browserTool = require('./browser-tools');



module.exports = function documentScreenshot(screenshotFile) {

    var tmpDir = null;
    var scrollFn = function(w, h) {
      window.scrollTo(w, h);      
    };
    var screenshotFileTmp;

    
    /*!
     * create tmp directory to cache viewport shots
     */
    browser.call( function() {
    
            var uuid = uuidGen.v4();
            tmpDir = screenshotFile+'_';
            
            if(!fs.existsSync(tmpDir) ) {
              fs.mkdirsSync(tmpDir, '0755');
            }
    
    });

    
    /*!
     * prepare page scan
     */
    var info = browser.execute( browserTool.getPageInfo ).value;
    browser.execute( browserTool.hideScrollbar );
        
    browser.pause(500);
    var seq=0;
    var cols = [];
    for( var y=0; y< info.documentHeight ; y += info.screenHeight ) {
      var row = [];
      cols.push( row );
      for( var x=0; x < info.documentWidth  ; x+= info.screenWidth ) {
        browser.execute(scrollFn,x,y);
        
        browser.pause(500);
        
        var filename = tmpDir + '\\'+ (seq<10?'0':'') + seq + '_' + x+'-'+y+'.png';
        browser.saveScreenshot(filename);
        
        //console.log('x-y',  x, y );
        
        var shouldCorpWidth =  info.documentWidth - x < info.screenWidth;
        var shouldCorpHeight = info.documentHeight - y < info.screenHeight;
        var shouldCorp = shouldCorpWidth || shouldCorpHeight;
        if( shouldCorp ) {
          var width = shouldCorpWidth ? (info.documentWidth - x)%info.screenWidth : info.screenWidth;
          var height = shouldCorpHeight ? (info.documentHeight - y)%info.screenHeight : info.screenHeight ;
          
          var xx = info.screenWidth - width;
          var yy = info.screenHeight - height;
          
          //console.log("corp", width, height, xx, yy );
          
          browser.call(function() {
            var deferred = Q.defer();
            gm(filename).crop(width, height, xx, yy).write(filename, function() { 
              deferred.resolve(filename); 
            });
            return deferred.promise;        
          });
        
        }
        
        row.push( { x:x, y:y, filename:filename } );
      }
    }
    
    // recompose row picture file more than one column
    
    var rowFiles = [];
    for( var c in cols ) {
      // optimisation
      if( cols[c].length==1 ) {
        rowFiles.push(cols[c][0].filename); 
      
      } else {
        var file = gm(cols[c][0].filename);
        // joins columns
        for( var l=1; l< cols[c].length; l++ ) {
          var row = cols[c][l];        
          file.append(row.filename,true)
        }

        rowFiles.push( browser.call(function() {
          var deferred = Q.defer();
          var n = path.join(tmpDir, 'row-'+c+'.png' );
          file.write( n , function() { 
            deferred.resolve(n); 
          });
          return deferred.promise;        
        }));
      }
    }
    
    // recompose full picture
    var res = gm(rowFiles[0]);
    for( var i=1; i< rowFiles.length; i++ ) {
      res.append( rowFiles[i], false );
    }    
    browser.call(function() {
      var deferred = Q.defer();
      res.write(screenshotFile, function() { 
        deferred.resolve(screenshotFile); 
      });
      return deferred.promise;        
    });
    
    // cleanup
    //for( var i in rowFiles ) {
    //  fs.removeSync(rowFiles[i]);      
    //}
    //for( var i in cols ) {
    //  for( var j in cols[i] ) {
    //    fs.removeSync(cols[i][j].filename);  
    //  }
    //}
    //fs.removeSync(tmpDir);  
     // show elements
    
    browser.execute( browserTool.showScrollbar );

    //scroll back to original position
    browser.execute( browserTool.scrollTo, info.originScroll );
    browser.pause(500);

    return screenshotFile;

};
