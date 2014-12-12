'use strict';

global.chai = require('chai');
global.chai.should();
global.sinon = require('sinon');
var sinonChai = require('sinon-chai');
global.chai.use(sinonChai);

var chaiAsPromised = require('chai-as-promised');
global.chai.use(chaiAsPromised);

global.nock = require('nock');
global.nock.disableNetConnect();

var services = require('../services');
var FakeConfigService = require('./mocks/config-service-mock');
var FakeHerokuService = require('./mocks/heroku-service-mock');
var FakeLoaderService = require('./mocks/loader-service-mock');

services.configService = new FakeConfigService();
services.herokuService = new FakeHerokuService();
services.loaderService = new FakeLoaderService();

process.env.TEST = true;