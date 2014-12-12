'use strict';
var Promise = require('bluebird');

function FakeConfigService() {}

FakeConfigService.prototype.read = function() {
  return {
    heroku: {},
    loader: {}
  };
};

FakeConfigService.prototype.write = function() {
  return Promise.resolve();
};

module.exports = FakeConfigService;