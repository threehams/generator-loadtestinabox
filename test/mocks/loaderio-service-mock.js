'use strict';
var Promise = require('bluebird');

function FakeLoaderService() {}

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