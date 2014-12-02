'use strict';
var Promise = require('bluebird');

function FakeHerokuService(config) {
  config = config || {};
  this.appName = config.appName;
  this.authToken = config.authToken;
  this.username = config.username;
  this.password = config.password;
}

FakeHerokuService.prototype.createAddon = function() {
  return Promise.resolve();
};
FakeHerokuService.prototype.createApp = function() {
  return 'an-addon-name';
};
FakeHerokuService.prototype.getAddons = function() {
  return Promise.resolve([
    {
      name: 'addon1'
    },
    {
      name: 'addon2'
    }
  ]);
};
FakeHerokuService.prototype.getAuthToken = function(username, password) {
  return 'ff9c3a98-3408-46ac-85cf-cbc41306f736';
};
FakeHerokuService.prototype.getConfig = function() {
  return Promise.resolve({
    CONFIG_KEY: 'configValue'
  });
};
FakeHerokuService.prototype.setAuthToken = function() {};
FakeHerokuService.prototype.setConfig = function() {};

module.exports = FakeHerokuService;