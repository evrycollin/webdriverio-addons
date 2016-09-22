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

    baseUrl: 'http://www.google.com',

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
#### Details
- startStep
- testInfo
- info
- error
- warning
- attachPng
- attachFile
- openFullscreen 
- openScreen 
- showMessage


### Screenshot tools & Visual integration test
Allow tester to get a fullscreen screenshot even if the underlying WebDriver only returns a viewport screenshot ( like Chrome )
- takeFullScreenshot: function (title, step, hideSelectors)

Like webdriver-css plugin, but working with webdriver.io v4
- takeElementScreenshot: function( options ) 
- assertVisual : function( refScreenshot, options ) 



### Splash screen
- before test meta data
- after test with results

## Create project
The Webdriverio-addons npm module will get all dependencies you need to make test running on you computer

### Requirements
- [Git](https://git-scm.com/)
```bash
$ apt-get install git
...
$ git --version
git version 1.9.1
```

- [NodeJS](https://nodejs.org/en/download/)

```bash
$ apt-get install nodejs-legacy npm
...
$ nodejs --version
v0.10.25
$ npm --version
1.3.10
```
- [Java](http://www.oracle.com/technetwork/java/javase/downloads/index.html) 

```bash
$ apt-get install default-jre
...
$ java -version
OpenJDK Runtime Environment (IcedTea 2.6.7) (7u111-2.6.7-0ubuntu0.14.04.3)
OpenJDK 64-Bit Server VM (build 24.111-b01, mixed mode)
```
- [GrphicsMagick](http://www.graphicsmagick.org/)

```bash
$ apt-get install graphicsmagick
...
$ gm
GraphicsMagick 1.3.18 2013-03-10 Q8 http://www.GraphicsMagick.org/
Copyright (C) 2002-2013 GraphicsMagick Group.
Additional copyrights and licenses apply to this software.
See http://www.GraphicsMagick.org/www/Copyright.html for details.
```

### Dependencies
- webdriverio
- mocha
- selenium-standalone
- allure-cli
- graphicsmagics
- wdio-allure-reporter
- wdio-allure-addons-reporter
- wdio-dot-reporter
- wdio-json-reporter
- wdio-junit-reporter
- wdio-mocha-framework
- wdio-selenium-standalone-service
- wdio-spec-reporter

### Start new NPM project

```bash
# create new NodeJS project
$ mkdir myProject
$ cd myProject
$ npm init
$ npm install --save
```
### Create your `wdio` configuration

### Create your first spec

### Cleanup
```bash
# cleanup working folders
rm -f -R ./allure-results
rm -f -R ./screenshots
rm -f -R ./outputDir
rm -f -R ./errorShots
rm -f -R ./allure-report
```

### Run tests

```bash
./node_modules/.bin/wdio myConf.wdio.js
```

### Generate Allure report

```bash
# generates allure report ( angularjs webapp )
./node_modules/.bin/allure generate ./allure-results -o ./allure-report

# start a webServer and open browser to see report
./node_modules/.bin/allure report open -o ./allure-report
```
