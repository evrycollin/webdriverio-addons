
var tools = require('./lib/tools');
var documentScreenshot = require('./lib/documentScreenshot');
var common = require('./lib/common');


var WebdriverioAddOns = function(webdriverInstance, options) {
    options = options || {};
    
    if(!webdriverInstance) {
        throw new Error('A WebdriverIO instance is needed to initialise MyPlugin');
    }
    
    this.instance = webdriverInstance;
    
    // from tools
    this.instance.addCommand("takeElementScreenshot", tools.takeElementScreenshot.bind(this));
    this.instance.addCommand("takeFullScreenshot", tools.takeFullScreenshot.bind(this));
    this.instance.addCommand("assertVisual", tools.assertVisual.bind(this));
    this.instance.addCommand("startStep", tools.startStep.bind(this));
    this.instance.addCommand("doStep", tools.doStep.bind(this));
    this.instance.addCommand("newStep", tools.startStep.bind(this));
    this.instance.addCommand("testInfo", tools.testInfo.bind(this));
    this.instance.addCommand("info", tools.info.bind(this));
    this.instance.addCommand("error", tools.error.bind(this));
    this.instance.addCommand("warning", tools.warning.bind(this));
    this.instance.addCommand("attachFile", tools.attachFile.bind(this));
    this.instance.addCommand("attachPng", tools.attachPng.bind(this));
    this.instance.addCommand("showMessage", tools.showMessage.bind(this));
    // from docScreenshot
    this.instance.addCommand("documentScreenshot", documentScreenshot.bind(this));
    
    
    process.on('test:start', function(test) {
      browser.cid = test.cid;
    });    
  

}


/**
 * expose WebdriverCSS
 */
module.exports.init = function(webdriverInstance, options) {
    return new WebdriverioAddOns(webdriverInstance, options);
};


module.exports.common = common;