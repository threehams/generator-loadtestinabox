'use strict';
var Promise = require('bluebird');

function FakeLoaderService(config) {
  config = config || {};
  this.verificationToken = config.verificationToken;
  this.appId = config.appId;
  this.hostname = config.hostname;
  this.authToken = config.authToken;
}

FakeLoaderService.prototype = {
  createApp: function() {},
  verifyApp: function () {},
  pollCompletion: function() {
    return Promise.resolve({ responseTime: 50, successes: 100 });
  },
  runTest: function() {
    return Promise.resolve('def456');
  },
  createTest: function() {
    return Promise.resolve({
      testId: 'abc123',
      resultId: 'def456'
    });
  }
};

module.exports = FakeLoaderService;