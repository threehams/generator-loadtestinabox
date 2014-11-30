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

process.env.TEST = true;