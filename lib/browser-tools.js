
module.exports = {

  hideElements: function(selectors) {
    var uuid = ''+ (Math.random()*100000);
    console.log('setVisibility', uuid);
    if( !window.BroserTool ) {
      window.BroserTool={};
    }
    window.BroserTool[uuid]=[];
    for( var i in selectors ) {
      var selector = selectors[i];
      var elmts = document.querySelectorAll(selector);
      for( var j=0; j<elmts.length; j++ ) {
        var elmt = elmts[j];
        window.BroserTool[uuid].push( {element: elmt, selector: selector, index: j, visibility: elmt.style.visibility } );
        elmt.style.visibility='hidden';
      }
    }
    console.log('hideElements results', uuid, window.BroserTool[uuid]);
    
    return { uuid: uuid, hiddenElements: window.BroserTool[uuid]   };
  },
  
  resetVisibility: function(uuid) {
    if( !window.BroserTool ) {
      throw new Error('BroserTool not defined');
    }
    
    if( !window.BroserTool[uuid] ) {
      throw new Error('BroserTool not initialized for uuid '+uuid);
    }
    console.log('resetVisibility', uuid, window.BroserTool[uuid] );
    
    for( var i=0; i<window.BroserTool[uuid]; i++ ) {
      var history = window.BroserTool[uuid][i];
      history.element.style.visibility = history.visibility;
    }
    
    delete window.BroserTool[uuid];
    return true;
  },
  
  getPageInfo: function() {
    var originScroll = { top: document.body.scrollTop, left: document.body.scrollLeft};
    window.scrollTo(0, 0);
    return {
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        documentWidth: document.documentElement.scrollWidth,
        documentHeight: document.documentElement.scrollHeight,
        devicePixelRatio: window.devicePixelRatio,
        originScroll: originScroll
    };
  },
  
  scrollTo: function( scroll ) {
    document.body.scrollTop=scroll.top;
    document.body.scrollLeft=scroll.left;
  },
    
  hideScrollbar: function() {
    document.documentElement.style.overflow = 'hidden';
  }, 

  showScrollbar: function() {
    document.documentElement.style.overflow = 'auto';
  }, 
  
  showMessage: function(message, timeout, textColor, backgroundColor, borderColor) {
    window.messenger = document.createElement("div");
    window.messenger.style.vibility='hidden';
    window.messenger.style.display='none';
    window.messenger.style['z-index']=100000;
    window.messenger.style.position='absolute';
    window.messenger.style.backgroundColor=backgroundColor;
    window.messenger.style.border='50px solid '+(borderColor ? borderColor :'black');
    
    window.messenger.style.overflow='auto';
    window.messenger.style.padding='30px';
    window.messenger.style.bottom=0;
    window.messenger.style.right=0;
    window.messenger.style.top=0;
    window.messenger.style.left=0;
    window.messenger.style.color=textColor ? textColor : 'black';
    window.messenger.style['font-size']='20px';
    
    //window.messenger.align='center';
    document.body.appendChild(window.messenger);
    //<img width="100px" src="http://webdriver.io/images/webdriverio.png" border="0">
    window.messenger.innerHTML = '<br>'+message;
    window.messenger.style.vibility='visible';
    window.messenger.style.display='block';
    
    setTimeout( function(){ 
      window.messenger.style.vibility='hidden';
      window.messenger.style.display='none';
    }, timeout);
    
    
  },
  
  describeTest: function(test, testContext, titleColor) {
    var html= '<h3 width="100%" align="center" style="color: '+ (titleColor ? titleColor : 'black')+';">'+test.type+'</h3><hr>';
    html += '<h5><i>'+test.parent+'</i></h5><h4><b>'+test.title+'</b></h4>'; 
    html += '<h5><i>'+testContext.description+'</i></h5>';   
    html += '<table>';
    html += '<tr><td><i>File : </i></td><td>'+test.file+'</td></tr>';
    if(testContext.severity)
      html += '<tr><td><i>Severity : </i></td><td>'+testContext.severity+'</td></tr>';
    if(testContext.feature)
      html += '<tr><td><i>Feature : </i></td><td>'+testContext.feature+'</td></tr>';
    if(testContext.story)
      html += '<tr><td><i>Story : </i></td><td>'+testContext.story+'</td></tr>';
    if(testContext.issue)
      html += '<tr><td><i>Issues : </i></td><td>'+testContext.issue+'</td></tr>';
    if(testContext.environment)
      html += '<tr><td><i>Env : </i></td><td>'+JSON.stringify(testContext.environment)+'</td></tr>';
    if(testContext.argument)
    html += '<tr><td><i>Arguments : </i></td><td>'+JSON.stringify(testContext.argument)+'</td></tr>';
    html += '</table>';
    
    if( test.type=='afterTest' ) {
      html += '<h4 style="color: '+ (titleColor ? titleColor : 'black')
           +';"><i><small>Result ( duration : '+Math.round(test.duration/1000) +' s )</small></i> : '
           +( test.passed ? 'OK' : 'FAILED' )
           + '</h4>';
      

      if( test.err ) {
        if( test.err.message.forEach ) {
          html += '<ul>';
          for( var i=0 ; i<test.err.message.length; i++ )
            html += '<li>ERROR : '+test.err.message[i]+'</li>';
          html += '</ul>';
        } else {
          html += '<h5>ERROR : '+test.err.message+'</h5>';
        }
        
        if(test.err.stack)
          html+= '<textarea cols="80" rows="15">'+test.err.stack+'</textarea><br>';
          
      }
    }
    
    return html;
    
  }

};