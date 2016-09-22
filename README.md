# webdriverio-addons

## Introduction

[Webdriver.io](http://webdriver.io/) is a powerfull javascript framework for NodeJS platform, based on Selenium architecture.

Webdriver.io is open and allow a lot of differente usage

In this project, we try to encapsulate and extend Webdriver.io base functions

The following choice have been done :
- tests use the `sync` mode
- use `mocha` as test runner
- use `allure` reporting with addons ( see [wdio-allure-addons-reporter](https://github.com/evrycollin/wdio-allure-addons-reporter) )

## Enhancement 

### Configration bootstrap
Webdriverio-addons come with a default working configuration that you can extends for your project config 

```javascript
var defaultConfig = require('webdriverio-addons').defaultConfig;

module.exports = require('deepmerge')( 
  defaultConfig, 
  {
  
    maxInstances: 1,
       
    // Level of logging verbosity: silent | verbose | command | data | result | error
    logLevel: 'silent',

    baseUrl: 'http://preprod-birthlist.orchestra.cc',

    host: 'localhost',
    port: 4444,
    specs: [
     './src/specs/mySpec.js'
    ],

    capabilities: [
      {
        maxInstances: 1,
        browserName: 'chrome'
      }
    ],
    // start selenium standalone automaticly
    services: [ 'selenium-standalone' ]
    
  }
);
```

### Suite & Testcase Meta
```javascript
var WAT = require('webdriverio-addons').common;
// testsuite
WAT.testsuite( ['home',lang.code], function() {
  
  this.timeout(60000);
  
  /**
  * Testcase
  */
  WAT.testcase(
    {
      name: ['home_check_title',lang.code],
      description : 'checking home page title for '+lang.code,
      feature : 'website internationnal',
      story : [ 'traduction des titres' ],
      severity : 'trivial',
      issue: ['AQA-0001'],
      argument : { lang: lang.code }
    },
    function (context) {
       // .... test impl
    }
  );
});
```

### Step API

Allow developer to write its test with hierarchical logging context

```javascript
function (context) {
  // go to open homepage fullscreen
  browser
  .startStep('open home page ')
  .fullscreen()
  .url(url, 'open home page')
  .ok();
  
  
  // assert title value
  browser.startStep('verify title')
  .assertEqual( browser.getTitle(), i18n('home', 'title', lang.code), 'check window title')
  .ok();

}
```

### Screenshot tools
Allow tester to get a fullscreen screenshot even if the underlying WebDriver only returns a viewport screenshot ( like Chrome )

### Visual integration test

Like webdriver-css plugin, but working with webdriver.io v4

### Splash screen
- before test meta data
- after test with results

## Create project
The Webdriverio-addons npm module will get all dependencies you need to make test running on you computer

### Dependencies
- webdriverio
- mocha
- selenium-standalone
- allure-cli
- wdio-allure-reporter
- wdio-allure-addons-reporter
- wdio-dot-reporter
- wdio-json-reporter
- wdio-junit-reporter
- wdio-mocha-framework
- wdio-selenium-standalone-service
- wdio-spec-reporter


- graphicsmagics

```bash
# create new NodeJS project
$ mkdir myProject
$ cd myProject
$ npm init
$ npm install --save
```

