
var tools = require('./lib/tools');
var documentScreenshot = require('./lib/documentScreenshot');
var common = require('./lib/common');
var excelDataLoader = require('./lib/excel-data-loader');
var browserTools = require('./lib/browser-tools');
var elasticSearchReporter = require('./lib/elasticsearch-reporter');
var defaultConfig = require('./conf/wdio.conf.js');

var WebdriverioAddOns = function(webdriverInstance, options) {
    options = options || {};
    
    if(!webdriverInstance) {
        throw new Error('A WebdriverIO instance is needed to initialise MyPlugin');
    }
    
    this.instance = webdriverInstance;
    tools.setConfig(options);
    common.setConfig(options);
        
    // from tools
    this.instance.addCommand("openFullscreen", tools.openFullscreen.bind(this));
    this.instance.addCommand("openScreen", tools.openScreen.bind(this));
    this.instance.addCommand("startStep", tools.startStep.bind(this));
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


module.exports.tools = tools;
module.exports.common = common;
module.exports.excelDataLoader = excelDataLoader;
module.exports.browserTools = browserTools;
module.exports.elasticSearchReporter = elasticSearchReporter;
module.exports.defaultConfig = defaultConfig;