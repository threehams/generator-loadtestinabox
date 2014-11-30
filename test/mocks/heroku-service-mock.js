'use strict';
var Promise = require('bluebird');

function FakeHerokuService() {}

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
FakeHerokuService.prototype.getAuthToken = function() {
  return 'ff9c3a98-3408-46ac-85cf-cbc41306f736';
};
FakeHerokuService.prototype.getConfig = function() {
  return Promise.resolve({
    CONFIG_KEY: 'configValue'
  });
};
FakeHerokuService.prototype.setAuthToken = function() {};
FakeHerokuService.prototype.writeConfig = function() {};

module.exports = FakeHerokuService;