
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
  
  describeTest: function(event, suite, test, titleColor) {
    var html= '<h3 width="100%" align="center" style="color: '+ (titleColor ? titleColor : 'black')+';">'+event.type+'</h3><hr>';
    if( suite ) html += '<h5><i>'+suite.title+'</i></h5><h4><b>'+test.title+'</b></h4>'; 
    html += '<h5><i>'+test.testContext.description+'</i></h5>';   
    html += '<table>';
    html += '<tr><td><i>File : </i></td><td>'+test.file+'</td></tr>';
    if(test.testContext.severity)
      html += '<tr><td><i>Severity : </i></td><td>'+test.testContext.severity+'</td></tr>';
    if(test.testContext.feature)
      html += '<tr><td><i>Feature : </i></td><td>'+test.testContext.feature+'</td></tr>';
    if(test.testContext.story)
      html += '<tr><td><i>Story : </i></td><td>'+test.testContext.story+'</td></tr>';
    if(test.testContext.issue)
      html += '<tr><td><i>Issues : </i></td><td>'+test.testContext.issue+'</td></tr>';
    if(test.testContext.environment)
      html += '<tr><td><i>Env : </i></td><td>'+JSON.stringify(test.testContext.environment)+'</td></tr>';
    if(test.testContext.argument)
    html += '<tr><td><i>Arguments : </i></td><td>'+JSON.stringify(test.testContext.argument)+'</td></tr>';
    html += '</table>';
    
    if( event.type=='afterTest' ) {
      html += '<h4 style="color: '+ (titleColor ? titleColor : 'black')
           +';"><i><small>Result ( duration : '+Math.round(event.duration/1000) +' s )</small></i> : '
           +( event.passed ? 'OK' : 'FAILED' )
           + '</h4>';
      

      if( event.err ) {
        if( event.err.message.forEach ) {
          html += '<ul>';
          for( var i=0 ; i<event.err.message.length; i++ )
            html += '<li>ERROR : '+event.err.message[i]+'</li>';
          html += '</ul>';
        } else {
          html += '<h5>ERROR : '+event.err.message+'</h5>';
        }
        
        if(event.err.stack)
          html+= '<textarea cols="80" rows="15">'+event.err.stack+'</textarea><br>';
          
      }
    }
    
    return html;
    
  }

};