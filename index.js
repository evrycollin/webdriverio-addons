

var MyPlugin = function(webdriverInstance, options) {
    options = options || {};

    if(!webdriverInstance) {
        throw new Error('A WebdriverIO instance is needed to initialise MyPlugin');
    }
    
    console.log('!!!!!!!!!!!!!!!!','MyPlugin','init');
    
}


/**
 * expose WebdriverCSS
 */
module.exports.init = function(webdriverInstance, options) {
    return new MyPlugin(webdriverInstance, options);
};