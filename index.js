

var MyPlugin = function(webdriverInstance, options) {
    options = options || {};
    
    this.currentTest=null;

    if(!webdriverInstance) {
        throw new Error('A WebdriverIO instance is needed to initialise MyPlugin');
    }
    
    //console.log('!!!!!!!!!!!!!!!!','MyPlugin','init');
    
    webdriverInstance.addCommand('hello', function() {
    
      console.log('!!!!!!!!!!!!!!!!!!!!!!!', 'HELLO');
    
    } );
    
    
    process.on('test:start', function(test) {
      browser.cid = test.cid;
    });    
/*
{
	type: 'test: start',
	title: 'home_check_title#fr_FR',
	parent: 'com.ldn.home.fr_FR',
	pending: false,
	file: 'D: \\orchestra\\listedenaissance\\test\\specs\\home.js',
	cid: '0a',
	specs: ['D: \\orchestra\\listedenaissance\\test\\specs\\home.js'],
	runner: {
		'0a': {
			maxInstances: 1,
			browserName: 'chrome'
		}
	}
}
*/      

}


/**
 * expose WebdriverCSS
 */
module.exports.init = function(webdriverInstance, options) {
    return new MyPlugin(webdriverInstance, options);
};