'use strict';
var Promise = require('bluebird');

function FakeHerokuService(config) {
  config = config || {};
  this.appName = config.appName;
  this.authToken = config.authToken;
  this.username = config.username;
  this.password = config.password;

  this.createAddon = function() {
    return Promise.resolve();
  };

  this.createApp = function() {
    return 'an-addon-name';
  };

  this.getAddons = function() {
    return Promise.resolve([
      {
        name: 'addon1'
      },
      {
        name: 'addon2'
      }
    ]);
  };

  this.getAuthToken = function(username, password) {
    return 'ff9c3a98-3408-46ac-85cf-cbc41306f736';
  };

  this.getConfig = function() {
    return Promise.resolve({
      CONFIG_KEY: 'configValue'
    });
  };

  this.setAuthToken = function() {};

  this.setConfig = function() {};
}

module.exports = FakeHerokuService;